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

// routes.ts 頂端，import 區塊下面
console.log("[NVIDIA routes] 啟動檢查 ──");
const _k = process.env.NVIDIA_API_KEY;
console.log("  key 存在:", !!_k);
console.log("  key 長度:", _k?.length);
console.log("  前 4 碼 (含引號顯示空白):", JSON.stringify(_k?.slice(0, 4)));
console.log("  後 4 碼 (含引號顯示空白):", JSON.stringify(_k?.slice(-4)));
console.log("  是否含換行:", _k?.includes("\n") || _k?.includes("\r"));
console.log("  trim 後長度:", _k?.trim().length);

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

// ── NVIDIA Client：lazy 建立，避免 import 時 .env 還沒載入完 ──
let _nvidiaClient: OpenAI | null = null;
function getNvidiaClient(): OpenAI {
  if (!_nvidiaClient) {
    // routes.ts，getNvidiaClient() 裡
    const apiKey = process.env.NVIDIA_API_KEY?.trim();
    console.log("[NVIDIA routes] key 長度:", apiKey?.length);
    console.log("[NVIDIA routes] key 前後有無空白:", JSON.stringify(apiKey?.slice(0,4)), JSON.stringify(apiKey?.slice(-4)));
    if (!apiKey) {
      console.warn("⚠️ NVIDIA_API_KEY 未設定，語音名詞修正與分析會 401");
    } else {
      console.log("[NVIDIA] key 前 8 字元 =", apiKey.slice(0, 8), "長度 =", apiKey.length);
    }
    _nvidiaClient = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: apiKey || "",
    });
  }
  return _nvidiaClient;
}

// ── Whisper 幻覺清理 ──────────────────────────────────────
// 三層偵測：截斷已知幻覺起點 → 整段檢查日韓文比例 → 過濾純標點
function cleanWhisperHallucination(text: string): {
  cleaned: string;
  hallucinationDetected: boolean;
  reason?: string;
} {
  const trimmed = text.trim();

  // 純標點 → 直接丟棄
  if (/^[，。！？、…\s]+$/.test(trimmed)) {
    return { cleaned: "", hallucinationDetected: true, reason: "純標點" };
  }

  // 找最早的「幻覺起點」並從那裡截斷
  let cutPoint = trimmed.length;
  const reasons: string[] = [];

  // (a) 連續 3 個以上日/韓文字符
  const cjkForeignMatch = trimmed.match(/[぀-ゟ゠-ヿ가-힯ᄀ-ᇿ]{3,}/);
  if (cjkForeignMatch?.index !== undefined && cjkForeignMatch.index < cutPoint) {
    cutPoint = cjkForeignMatch.index;
    reasons.push("日韓文chunk");
  }

  // (b) 短句連續重複 3 次以上（例如「聽得到嗎?」「嗯?」「我?」）
  //     抓 1-6 字 + 標點 的句子重複，cover「嗯?嗯?嗯?」與「聽得到嗎?聽得到嗎?」兩類
  const repeatMatch = trimmed.match(/([\u4e00-\u9fa5]{1,6}[?？！\s]+)\1{2,}/);
  if (repeatMatch?.index !== undefined && repeatMatch.index < cutPoint) {
    cutPoint = repeatMatch.index;
    reasons.push("短句重複");
  }

  // (c) 「、」連接的短詞列表（4 詞以上、每詞 ≤ 4 字）
  //     glossary 透過 prompt 回流的典型幻覺：「搖手、可救出、執行屋、掃消隊」
  const wordListMatch = trimmed.match(/(?:[\u4e00-\u9fa5]{1,4}、){4,}[\u4e00-\u9fa5]{1,4}/);
  if (wordListMatch?.index !== undefined && wordListMatch.index < cutPoint) {
    cutPoint = wordListMatch.index;
    reasons.push("詞表回流");
  }

  // (d) 同一個字連續重複 8 次以上（如「我我我我我我我我」）
  const repeatCharMatch = trimmed.match(/(.)\1{7,}/);
  if (repeatCharMatch?.index !== undefined && repeatCharMatch.index < cutPoint) {
    cutPoint = repeatCharMatch.index;
    reasons.push("單字重複");
  }

  const cleaned = trimmed.slice(0, cutPoint).trim().replace(/[，、]+$/, "");

  if (cutPoint < trimmed.length) {
    return {
      cleaned,
      hallucinationDetected: true,
      reason: `${reasons.join("+")} @${cutPoint}/${trimmed.length}`,
    };
  }

  // 整段檢查：截斷後仍有過多日韓文 → 整段丟棄
  const japaneseCount = (cleaned.match(/[぀-ゟ゠-ヿ]/g) ?? []).length;
  const koreanCount = (cleaned.match(/[가-힯ᄀ-ᇿ]/g) ?? []).length;
  const totalChars = cleaned.replace(/\s/g, "").length || 1;
  const foreignRatio = (japaneseCount + koreanCount) / totalChars;
  if (foreignRatio > 0.15) {
    return {
      cleaned: "",
      hallucinationDetected: true,
      reason: `日韓文比例 ${Math.round(foreignRatio * 100)}%`,
    };
  }

  return { cleaned, hallucinationDetected: false };
}

// ── Keep-alive ping（供 UptimeRobot 監控用）─────────────
router.get("/ping", (_req, res) => res.json({ ok: true }));

router.get("/turn-credentials", async (_req, res) => {
  try {
    const domain = process.env.METERED_DOMAIN;       // e.g. larp-game.metered.live
    const secretKey = process.env.METERED_SECRET_KEY;

    console.log("[TURN] domain =", domain);
    console.log("[TURN] secretKey 前 8 字元 =", secretKey?.slice(0, 8));
    console.log("[TURN] secretKey 長度 =", secretKey?.length);

    if (!domain || !secretKey) {
      console.warn("[TURN] 缺少 Metered 金鑰，使用備援 STUN");
      return res.json({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
    }

    // ✅ 正確端點：GET /api/v1/turn/credentials?secretKey=...
    const iceRes = await fetch(
      `https://${domain}/api/v1/turn/credentials?secretKey=${secretKey}`
    );

    if (!iceRes.ok) {
      throw new Error(`取得 iceServers 失敗: ${iceRes.status}`);
    }

    const iceServers: any[] = await iceRes.json();
    iceServers.unshift({ urls: "stun:stun.l.google.com:19302" });

    res.set("Cache-Control", "private, max-age=3600");
    res.json({ iceServers });

  } catch (err: any) {
    console.error("[TURN] 取得 Metered credentials 失敗:", err.message);
    res.json({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  }
});

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

async function transcribeWithGroq(audioBuffer: Buffer, script: ScriptMeta): Promise<string> {
  const wavBuffer = await webmToWav16k(audioBuffer);
  const { Blob } = await import("buffer");
  const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });
  const audioFile = new File([audioBlob as any], "audio.wav", { type: "audio/wav" });

  const formData = new FormData();
  formData.append("file", audioFile as any);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "zh");
  formData.append("response_format", "text");
  // 🌟 只取前 12 個詞（角色 + 地點為主），避免 glossary 太長導致 Whisper 把詞表當幻覺素材吐回來
  formData.append("prompt", script.glossary.slice(0, 12).join("、"));

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq STT ${response.status}: ${body.slice(0, 300)}`);
  }
  return (await response.text()).trim();
}

// ─────────────────────────────────────────────────────────
//  STT 校正（使用 P0_STT prompt + glossary）
// ─────────────────────────────────────────────────────────

async function correctWithP0STT(rawText: string, script: ScriptMeta): Promise<string> {
  const glossaryHint = script.glossary.join("、");

  const prompt = `你是繁體中文語音逐字稿校對員，熟悉以下劇本專有名詞：${glossaryHint}。
任務：修復 STT 辨識錯誤，還原說話者真實語意。
規則：
1. 只修同音異字與明顯辨識錯誤（例：「摧之作人」→「崔製作人」）
2. 保留所有口語詞（「然後」「那個」「就是說」「嗯」「啊」），這些是分析素材
3. 保留停頓、重複、不流暢，這些是表達特徵
4. 遇到不確定的詞，保留原文
5. 不得刪詞、加詞、重組句子
6. 禁止把語意正確的一般詞換成更具體的劇本詞（例：「大雨」不可換成「暴雨特報」）
7. 輸出長度與輸入差距 ≤ 5%
輸入逐字稿：${rawText}
直接輸出修復後文字，無需任何說明。`;

  // 中文每字約 2 token，給足空間避免截斷
  const maxTokens = Math.max(512, Math.ceil(rawText.length * 3));

  const completion = await getNvidiaClient().chat.completions.create({
    model: "meta/llama-3.3-70b-instruct",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.0,
    max_tokens: maxTokens,
  });

  let corrected = completion.choices[0].message.content?.trim() || rawText;

  // 🌟 只過濾明顯異常（縮水超過 20% 或膨脹超過 30%），寬鬆一些避免誤 fallback
  const ratio = corrected.length / Math.max(rawText.length, 1);
  if (ratio < 0.8 || ratio > 1.3) {
    console.warn(`[Voice] STT校正異常（比例 ${Math.round(ratio * 100)}%，原文 ${rawText.length} 字，修正後 ${corrected.length} 字），fallback raw`);
    corrected = rawText;
  } else {
    console.log(`[Voice] STT校正完成（${rawText.length} 字 → ${corrected.length} 字）`);
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

    console.log(`[STT] 收到音檔 ${audioBuffer.length} bytes，準備送 Groq Whisper`);
    const rawText = await transcribeWithGroq(audioBuffer, script);
    console.log(`[STT] ASR 回傳：「${rawText}」（${rawText.length} 字）`);

    if (!rawText.trim()) return res.json({ success: true, text: "" });

    // 🌟 Whisper 幻覺清理（截斷已知幻覺起點 + 過濾日韓文 + 詞表回流）
    const { cleaned, hallucinationDetected, reason } = cleanWhisperHallucination(rawText);
    if (hallucinationDetected) {
      console.warn(`[STT] 偵測到幻覺（${reason}）`);
      console.warn(`[STT] 原文：「${rawText.slice(0, 80)}${rawText.length > 80 ? "..." : ""}」`);
      console.warn(`[STT] 清理後：「${cleaned.slice(0, 80)}${cleaned.length > 80 ? "..." : ""}」`);
    }
    if (!cleaned) {
      return res.json({ success: true, text: "" });
    }

    let correctedText = cleaned;
    try {
      correctedText = await correctWithP0STT(cleaned, script);
    } catch (llmErr: any) {
      console.warn("[Voice] STT校正失敗，直接用 ASR 原文：", llmErr.message);
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