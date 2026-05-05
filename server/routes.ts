// ═══════════════════════════════════════════════════════════
// REST API 路由（PostgreSQL 版）
// ═══════════════════════════════════════════════════════════

import { Router } from "express";
import db from "./db.js";
import { larpEngine } from "./engine.js";
import multer from "multer";
import OpenAI from "openai";

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { Readable, PassThrough } from "stream";
import { getScript, ScriptMeta } from "./entity.js";
import { MODELS } from "./prompts.js";

const SCRIPT_ID_MAP: Record<string, string> = {
  "1": "suffocation",
  "2": "script_02",
};

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
const upload = multer({ storage: multer.memoryStorage() });

const nvidiaClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
});
if (!process.env.NVIDIA_API_KEY) {
  console.warn("⚠️ NVIDIA_API_KEY 未設定，語音名詞修正與分析會 401");
}

// ── Keep-alive ping（供 UptimeRobot 監控用）─────────────
router.get("/ping", (_req, res) => res.json({ ok: true }));

// ── 使用者登入 / 註冊 ─────────────────────────────────────

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      await db.query("UPDATE users SET last_played = NOW() WHERE email = $1", [email]);
      res.json({ user: existing.rows[0] });
    } else {
      const result = await db.query(
        "INSERT INTO users (email) VALUES ($1) RETURNING *",
        [email]
      );
      res.json({ user: result.rows[0] });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── 問卷 ─────────────────────────────────────────────────

router.post("/survey", async (req, res) => {
  const { userId, data } = req.body;
  try {
    await db.query(
      "INSERT INTO surveys (user_id, data) VALUES ($1, $2)",
      [userId, JSON.stringify(data)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Survey error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/surveys/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM surveys WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({
      surveys: result.rows.map((s: any) => ({ ...s, data: JSON.parse(s.data) }))
    });
  } catch (err) {
    console.error("Fetch surveys error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── 紀錄查詢 ──────────────────────────────────────────────

router.get("/records/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [scripts, reports] = await Promise.all([
      db.query("SELECT * FROM script_records WHERE user_id = $1 ORDER BY created_at DESC", [userId]),
      db.query("SELECT * FROM assessment_reports WHERE user_id = $1 ORDER BY created_at DESC", [userId]),
    ]);
    res.json({
      scripts: scripts.rows.map((s: any) => ({ ...s, dialogue: JSON.parse(s.dialogue) })),
      reports: reports.rows.map((r: any) => ({ ...r, report_data: JSON.parse(r.report_data) })),
    });
  } catch (err) {
    console.error("Fetch records error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ── 對話紀錄儲存 ──────────────────────────────────────────

router.post("/save-dialogue", async (req, res) => {
  const { userId, scriptName, dialogue } = req.body;
  try {
    await db.query(
      "INSERT INTO script_records (user_id, script_name, dialogue) VALUES ($1, $2, $3)",
      [userId, scriptName, JSON.stringify(dialogue)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Save dialogue error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─────────────────────────────────────────────────────────
//  ASR：Groq Whisper
// ─────────────────────────────────────────────────────────

async function transcribeWithDeepgram(audioBuffer: Buffer): Promise<string> {
  const model = "nova-2"; // nova-3 不支援中文，改用 nova-2
  const params = new URLSearchParams({
    model,
    language: "zh-TW",
    smart_format: "true",
    filler_words: "true",
    punctuate: "true",
  });

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "audio/wav",
      },
      body: new Uint8Array(audioBuffer),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Deepgram STT ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

  return transcript.trim();
}

// ─────────────────────────────────────────────────────────
//  LLM 名詞修正（可選層）
// ─────────────────────────────────────────────────────────

async function correctTermsWithLlama(rawText: string, script: ScriptMeta): Promise<string> {
  const glossaryHint = script.glossary.join("、");

  const completion = await nvidiaClient.chat.completions.create({
    model: "meta/llama-3.3-70b-instruct",
    messages: [
      {
        role: "system",
        content: `你是繁體中文語音逐字稿的「音近字修正器」。

【唯一任務】
找出輸入文字中因 ASR（語音辨識）誤判造成的「音近字錯誤」，用下方詞表中的正確詞替換。

【詞表（僅用於對照，不可憑此增加內容）】
${glossaryHint}

【嚴格禁止事項 — 違反即視為失敗】
1. 禁止增加任何原文沒有的詞、句子、說明。
2. 禁止把「兇手」「他」「那個人」等玩家自己用的替代稱呼換成詞表裡的完整名稱——玩家自己選的用法不是錯誤。
3. 禁止把「房間」「現場」「角落」等通用詞換成詞表裡的具體地點名稱。
4. 禁止刪除口語詞（然後、那個、就是、嗯、啊）、重複、停頓——這些是分析素材。
5. 禁止重組句子、修改標點、加說明文字。
6. 輸出字數必須與輸入字數差距 ≤5%。若無音近字錯誤，直接逐字輸出原文。

【判斷標準】
只有當原文詞語與詞表詞語「讀音相同或極近，且語意上詞表的詞明顯更合理」時才替換。
例：「摧之作人」→「崔製作人」✓　　「兇手」→「新亭洞連環殺人魔」✗`,
      },
      { role: "user", content: rawText },
    ],
    temperature: 0.0,
    max_tokens: Math.ceil(rawText.length * 2),
  });

  let corrected = completion.choices[0].message.content?.trim() || rawText;
  const ratio = corrected.length / Math.max(rawText.length, 1);
  if (ratio < 0.9 || ratio > 1.1) {
    console.warn(`[Voice] LLM 修正後字數比例 ${Math.round(ratio * 100)}%（預期 90~110%），fallback raw`);
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
    const { character, scriptId } = req.body;
    const script = getScript(SCRIPT_ID_MAP[scriptId] ?? scriptId);

    if (!audioBuffer) return res.status(400).json({ error: "沒有接收到音檔" });

    console.log(`[STT] 收到音檔 ${audioBuffer.length} bytes，準備送 Deepgram`);
    const rawText = await transcribeWithDeepgram(audioBuffer);
    console.log(`[STT] ASR 回傳：「${rawText}」（${rawText.length} 字）`);

    if (!rawText.trim()) return res.json({ success: true, text: "" });

    // 🌟 Whisper 幻覺過濾：靜音/噪音時 Whisper 會產生固定的填充文字，直接丟棄
    const WHISPER_HALLUCINATION = [
      '字幕', 'amara', '訂閱', '翻譯', 'mbc', 'kbs', 'sbs', 'tvn',
      '請按讚', '請分享', '敬請期待', '廣告', 'thanks for watching',
      'subtitle', 'subtitles', 'closed caption',
    ];

    // 🌟 語言偵測：計算日文（hiragana/katakana）和韓文字元比例
    //    Whisper 在靜音或環境噪音時常幻覺出假日文/韓文
    const countChars = (text: string, regex: RegExp) =>
      (text.match(regex) ?? []).length;
    const totalChars = rawText.replace(/\s/g, '').length || 1;
    const japaneseCount = countChars(rawText, /[぀-ゟ゠-ヿ]/g); // hiragana + katakana
    const koreanCount   = countChars(rawText, /[가-힯ᄀ-ᇿ]/g); // hangul
    const foreignRatio  = (japaneseCount + koreanCount) / totalChars;

    const rawLower = rawText.toLowerCase();
    const isHallucination =
      WHISPER_HALLUCINATION.some(w => rawLower.includes(w)) ||
      rawText.trim().length < 2 ||
      /^[\s\S]*$/.test('') ||                             // placeholder
      /^[，。！？、…\s]+$/.test(rawText.trim()) ||        // 純標點
      foreignRatio > 0.3;                                 // 超過 30% 是日/韓文字元

    if (isHallucination) {
      console.warn(`[STT] 偵測到 Whisper 幻覺輸出（日韓比例 ${Math.round(foreignRatio*100)}%），已丟棄：「${rawText}」`);
      return res.json({ success: true, text: "" });
    }

    let correctedText = rawText;
    try {
      correctedText = await correctTermsWithLlama(rawText, script);
    } catch (llmErr: any) {
      console.warn("[Voice] LLM 修正失敗，直接用 ASR 原文：", llmErr.message);
    }

    res.json({ success: true, text: `${character}：${correctedText}` });
  } catch (error: any) {
    console.error("[STT] 處理失敗:", error.message, error.stack);
    res.status(500).json({ error: "語音處理失敗", detail: error.message });
  }
});

// ── AI 分析（非同步，立即回傳 jobId）────────────────────────

router.post("/analyse", (req, res) => {
  const { userId, scriptName, turns, fullDialogue, targetCharacter } = req.body;
  if (!Array.isArray(turns) || turns.length === 0)
    return res.status(400).json({ error: "turns is empty" });
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
  if (requestUserId && jobUserId && requestUserId !== jobUserId)
    return res.status(403).json({ error: "Forbidden: job belongs to another user" });

  res.json({ ...job, jobUserId });
});

// ── Admin ─────────────────────────────────────────────────

router.get("/admin/users", async (req, res) => {
  if (req.headers["x-admin-key"] !== "admin-secret-2024")
    return res.status(403).json({ error: "Forbidden" });
  try {
    const usersResult = await db.query("SELECT * FROM users ORDER BY last_played DESC");
    const result = await Promise.all(usersResult.rows.map(async (u: any) => {
      const [surveys, scripts, reports] = await Promise.all([
        db.query("SELECT * FROM surveys WHERE user_id = $1 ORDER BY created_at DESC", [u.id]),
        db.query("SELECT * FROM script_records WHERE user_id = $1 ORDER BY created_at DESC", [u.id]),
        db.query("SELECT * FROM assessment_reports WHERE user_id = $1 ORDER BY created_at DESC", [u.id]),
      ]);
      return {
        ...u,
        surveys: surveys.rows.map((s: any) => ({ ...s, data: JSON.parse(s.data) })),
        scripts: scripts.rows.map((s: any) => ({ ...s, dialogue: JSON.parse(s.dialogue) })),
        reports: reports.rows.map((r: any) => ({ ...r, report_data: JSON.parse(r.report_data) })),
      };
    }));
    res.json({ users: result });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;