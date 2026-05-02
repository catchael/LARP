// ═══════════════════════════════════════════════════════════
// REST API 路由
// ═══════════════════════════════════════════════════════════

import { Router } from "express";
import db from "./db.js";
import { larpEngine } from "./engine.js";
import multer from "multer";
import OpenAI from "openai";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { Readable, PassThrough } from "stream";

ffmpeg.setFfmpegPath(ffmpegPath.path);

// ── webm/opus → 16 kHz mono WAV ──────────────────────────────
async function webmToWav16k(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inStream = Readable.from(input);
    const outChunks: Buffer[] = [];
    const outStream = new PassThrough();
    outStream.on("data", c => outChunks.push(c));
    outStream.on("end", () => resolve(Buffer.concat(outChunks)));
    outStream.on("error", reject);

    ffmpeg(inStream)
      .inputFormat("webm")
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("error", reject)
      .pipe(outStream, { end: true });
  });
}

const router = Router();

// ── 使用者登入 / 註冊 ─────────────────────────────────────

router.post("/login", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user) {
      db.prepare("UPDATE users SET last_played = CURRENT_TIMESTAMP WHERE email = ?").run(email);
      res.json({ user });
    } else {
      const info = db.prepare("INSERT INTO users (email) VALUES (?)").run(email);
      res.json({ user: { id: info.lastInsertRowid, email } });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── 問卷 ─────────────────────────────────────────────────

router.post("/survey", (req, res) => {
  const { userId, data } = req.body;
  try {
    db.prepare("INSERT INTO surveys (user_id, data) VALUES (?, ?)").run(userId, JSON.stringify(data));
    res.json({ success: true });
  } catch (err) {
    console.error("Survey error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/surveys/:userId", (req, res) => {
  const { userId } = req.params;
  try {
    const surveys = db.prepare("SELECT id, user_id, data, created_at || 'Z' as created_at FROM surveys WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json({ surveys: surveys.map((s: any) => ({ ...s, data: JSON.parse(s.data as string) })) });
  } catch (err) {
    console.error("Fetch surveys error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── 紀錄查詢 ──────────────────────────────────────────────

router.get("/records/:userId", (req, res) => {
  const { userId } = req.params;
  try {
    const scripts = db.prepare("SELECT id, user_id, script_name, dialogue, created_at || 'Z' as created_at FROM script_records WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    const reports = db.prepare("SELECT id, user_id, report_data, created_at || 'Z' as created_at FROM assessment_reports WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json({
      scripts: scripts.map((s: any) => ({ ...s, dialogue: JSON.parse(s.dialogue as string) })),
      reports: reports.map((r: any) => ({ ...r, report_data: JSON.parse(r.report_data as string) }))
    });
  } catch (err) {
    console.error("Fetch records error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── 對話紀錄儲存 ──────────────────────────────────────────

router.post("/save-dialogue", (req, res) => {
  const { userId, scriptName, dialogue } = req.body;
  try {
    db.prepare("INSERT INTO script_records (user_id, script_name, dialogue) VALUES (?, ?, ?)")
      .run(userId, scriptName, JSON.stringify(dialogue));
    res.json({ success: true });
  } catch (err) {
    console.error("Save dialogue error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─────────────────────────────────────────────────────────
//  以下：語音處理用到的常用設定 / 客戶端
// ─────────────────────────────────────────────────────────

const upload = multer({ storage: multer.memoryStorage() });

const nvidiaClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
});
if (!process.env.NVIDIA_API_KEY) {
  console.warn("⚠️ NVIDIA_API_KEY 未設定，語音名詞修正與分析會 401");
}

// ── 劇本背景常數（給 ASR prompt 與 LLM 修正共用）──────────────
const SCRIPT_GLOSSARY = [
  "新亭洞", "陽川區", "舊商業大樓", "廢棄地下室", "廢棄管理室",
  "清潔水槽", "員工置物櫃", "破舊洗手間", "死角", "騎樓",
  "地下一樓", "通風口", "管理員室", "洗手槽", "獵奇兔子",
  "尼龍繩", "黑色塑膠袋", "廉價香菸", "木製菸斗", "劣質菸草",
  "折疊刀", "過期細胞檢體", "非法物證", "隱藏攝影機", "鐵撬",
  "雨衣", "乾燥砂土", "濕袖口", "指甲抓痕", "紅色水痕",
  "崔製作人", "張警衛", "拾荒者", "廣搜隊長", "李隊長", "節目助理",
  "連環殺手", "前科犯", "被害者家屬", "目擊證人", "替罪羔羊"
  , "追訴期", "DNA比對", "密室還原", "硬核推理",
  "肉搜", "獵巫", "勒斃", "窒息", "棄屍", "駭客技術", "監聽",
];

// ─────────────────────────────────────────────────────────
//  ASR 引擎 A：Groq Whisper（目前主用）
// ─────────────────────────────────────────────────────────
async function transcribeWithGroq(audioBuffer: Buffer): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY 未設定");

  const wavBuffer = await webmToWav16k(audioBuffer);
  console.log(`[Groq STT] 轉檔後 WAV = ${wavBuffer.length} bytes`);

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(wavBuffer)], { type: "audio/wav" }),
    "audio.wav"
  );
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "zh");
  formData.append("response_format", "verbose_json");
  formData.append("temperature", "0");
  // prompt 餵專有名詞，可顯著減少音近字誤判
  formData.append("prompt", SCRIPT_GLOSSARY.join("、"));

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq STT ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json() as any;
  console.log(`[Groq STT] 回傳 keys:`, Object.keys(data));
  return String(data.text || "").trim();
}

// ─────────────────────────────────────────────────────────
//  ASR 引擎 B：NVIDIA Parakeet（保留作備援，目前 NVCF 端 500 中）
//  之後若拿到正確 schema，把 /process-voice-turn 裡 transcribeWithGroq
//  換成 transcribeWithParakeet 即可。
// ─────────────────────────────────────────────────────────
const NVCF_BASE = "https://api.nvcf.nvidia.com/v2/nvcf";
const PARAKEET_FUNCTION_ID = process.env.PARAKEET_FUNCTION_ID || "";

async function transcribeWithParakeet(audioBuffer: Buffer): Promise<string> {
  if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY 未設定");
  if (!PARAKEET_FUNCTION_ID)        throw new Error("PARAKEET_FUNCTION_ID 未設定");

  const apiKey = process.env.NVIDIA_API_KEY;

  const wavBuffer = await webmToWav16k(audioBuffer);
  console.log(`[Parakeet] 轉檔後 WAV = ${wavBuffer.length} bytes`);

  // 1. 申請 asset
  const assetReq = await fetch(`${NVCF_BASE}/assets`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      contentType: "audio/wav",
      description: "meeting-room turn audio",
    }),
  });
  if (!assetReq.ok) {
    throw new Error(`Asset 申請失敗 ${assetReq.status}: ${await assetReq.text()}`);
  }
  const { assetId, uploadUrl } = await assetReq.json() as any;
  console.log(`[Parakeet] 拿到 assetId=${assetId}`);

  // 2. PUT 音檔到預簽 URL
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "audio/wav",
      "x-amz-meta-nvcf-asset-description": "meeting-room turn audio",
    },
    body: new Uint8Array(wavBuffer),
  });
  if (!putRes.ok) {
    throw new Error(`音檔上傳失敗 ${putRes.status}: ${await putRes.text()}`);
  }
  console.log(`[Parakeet] 音檔已上傳 (HTTP ${putRes.status})`);

  // 3. 觸發 inference
  const inferRes = await fetch(`${NVCF_BASE}/pexec/functions/${PARAKEET_FUNCTION_ID}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "NVCF-INPUT-ASSET-REFERENCES": assetId,
    },
    body: JSON.stringify({
      audio: assetId,
      language_code: "zh-TW",
      encoding: "LINEAR_PCM",
      sample_rate_hz: 16000,
    }),
  });
  if (!inferRes.ok) {
    const body = await inferRes.text();
    throw new Error(`Parakeet inference ${inferRes.status}: ${body.slice(0, 500)}`);
  }
  const data = await inferRes.json() as any;
  console.log(`[Parakeet] 原始回傳 keys:`, Object.keys(data));

  const text =
    data?.text ||
    data?.transcript ||
    data?.results?.[0]?.alternatives?.[0]?.transcript ||
    data?.output?.[0]?.text ||
    data?.choices?.[0]?.message?.content ||
    "";
  return String(text).trim();
}

// ─────────────────────────────────────────────────────────
//  LLM 名詞修正（可選層）
// ─────────────────────────────────────────────────────────
async function correctTermsWithLlama(rawText: string): Promise<string> {
  const globalContext = `
劇本背景：韓國新亭洞連環殺人案 (窒息的地下室)。
核心實體：${SCRIPT_GLOSSARY.join("、")}
`.trim();

  const completion = await nvidiaClient.chat.completions.create({
    model: "meta/llama-3.3-70b-instruct",
    messages: [
      {
        role: "system",
        content: `你是繁體中文語音逐字稿的「名詞替換器」，不是摘要器。背景：${globalContext}

【唯一任務】把輸入逐字稿中**音近字錯誤的名詞**換成背景裡的正確名詞。

【硬規則】
1. 輸出長度必須與輸入長度差距 ≤10%。如果你想刪掉任何句子、口語詞、語助詞、贅字，那是錯的。
2. 不要重組句子順序、不要修標點、不要解釋、不要道歉。
3. 沒有需要修的詞就「逐字輸出原文」。
4. 不要把口語詞（然後、那個、就是、阿）當成贅字刪掉，這些是分析素材。`
      },
      {
        role: "user",
        content: `逐字輸出下列文字，僅替換錯誤名詞，禁止刪減：\n\n${rawText}`
      }
    ],
    temperature: 0.0,
    max_tokens: 4096,
  });

  let corrected = completion.choices[0].message.content?.trim() || rawText;

  // 防呆：縮水超過 30% 直接 fallback 原文
  const shrinkRatio = corrected.length / Math.max(rawText.length, 1);
  if (shrinkRatio < 0.7) {
    console.warn(`[Voice] LLM 修正後縮水到 ${Math.round(shrinkRatio * 100)}%，fallback raw`);
    corrected = rawText;
  }
  return corrected;
}

// ─────────────────────────────────────────────────────────
//  /process-voice-turn  (主流程：ASR → LLM 修正)
// ─────────────────────────────────────────────────────────
router.post("/process-voice-turn", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file?.buffer;
    const { character } = req.body;

    if (!audioBuffer) {
      return res.status(400).json({ error: "沒有接收到音檔" });
    }

    console.log(`[STT] 收到音檔 ${audioBuffer.length} bytes，準備送 Groq Whisper`);

    // 1. ASR 層（目前用 Groq；想換 Parakeet 把這行替換成 transcribeWithParakeet）
    const rawText = await transcribeWithGroq(audioBuffer);
    console.log(`[STT] ASR 回傳：「${rawText}」（${rawText.length} 字）`);

    if (!rawText.trim()) {
      return res.json({ success: true, text: "" });
    }

    // 2. LLM 名詞修正層（如果想跳過，把下面那行改成 const correctedText = rawText;）
    let correctedText = rawText;
    try {
      correctedText = await correctTermsWithLlama(rawText);
    } catch (llmErr: any) {
      console.warn("[Voice] LLM 修正失敗，直接用 ASR 原文：", llmErr.message);
    }

    const formattedTurn = `${character}：${correctedText}`;
    res.json({ success: true, text: formattedTurn });

  } catch (error: any) {
    console.error('[STT] 處理失敗:', error.message, error.stack);
    res.status(500).json({ error: "語音處理失敗", detail: error.message });
  }
});

// ── AI 分析（非同步，立即回傳 jobId）────────────────────────

router.post("/analyse", (req, res) => {
  const { userId, scriptName, turns, fullDialogue, targetCharacter } = req.body;
  if (!Array.isArray(turns) || turns.length === 0) {
    return res.status(400).json({ error: "turns is empty" });
  }
  const jobId = `u${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  larpEngine.startJob(jobId, userId, scriptName, turns, fullDialogue, targetCharacter);
  res.json({ jobId, status: "pending" });
});

router.get("/analyse/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = larpEngine.getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const match = jobId.match(/^u(\d+)_/);
  const jobUserId = match ? parseInt(match[1]) : null;

  const requestUserId = req.query.userId ? parseInt(req.query.userId as string) : null;
  if (requestUserId && jobUserId && requestUserId !== jobUserId) {
    return res.status(403).json({ error: "Forbidden: job belongs to another user" });
  }

  res.json({ ...job, jobUserId });
});

// ── Admin ─────────────────────────────────────────────────

router.get("/admin/users", (req, res) => {
  if (req.headers["x-admin-key"] !== "admin-secret-2024") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const users = db.prepare("SELECT * FROM users ORDER BY last_played DESC").all() as any[];
    const result = users.map((u: any) => ({
      ...u,
      surveys: (db.prepare("SELECT * FROM surveys WHERE user_id = ? ORDER BY created_at DESC").all(u.id) as any[])
        .map((s: any) => ({ ...s, data: JSON.parse(s.data) })),
      scripts: (db.prepare("SELECT * FROM script_records WHERE user_id = ? ORDER BY created_at DESC").all(u.id) as any[])
        .map((s: any) => ({ ...s, dialogue: JSON.parse(s.dialogue) })),
      reports: (db.prepare("SELECT * FROM assessment_reports WHERE user_id = ? ORDER BY created_at DESC").all(u.id) as any[])
        .map((r: any) => ({ ...r, report_data: JSON.parse(r.report_data) })),
    }));
    res.json({ users: result });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;