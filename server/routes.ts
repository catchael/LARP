// ═══════════════════════════════════════════════════════════
// REST API 路由
// ═══════════════════════════════════════════════════════════

import { Router } from "express";
import db from "./db.js";
import { larpEngine } from "./engine.js";
import multer from "multer";
import OpenAI from "openai";

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
    // 🌟 這裡也補上 || 'Z'
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
    // 🌟 在 created_at 後面 || 'Z'，強制加上時區標籤
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

// 設定 multer 接收記憶體中的音檔緩衝區
const upload = multer({ storage: multer.memoryStorage() });

// 初始化 NVIDIA API 客戶端
const nvidiaClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "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" 
});
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "你的_DEEPGRAM_API_KEY_填這裡";

// ── 對話紀錄儲存 ──────────────────────────────────────────

router.post("/save-dialogue", (req, res) => {
  const { userId, scriptName, dialogue } = req.body;
  try {
    db.prepare("INSERT INTO script_records (user_id, script_name, dialogue) VALUES (?, ?, ?)")
      .run(userId, scriptName, JSON.stringify(dialogue));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});


// ── 語音處理 (SS + GL) ──────────────────────────────────────────
router.post("/process-voice-turn", upload.single("audio"), async (req, res) => {
  try {
    const audioBuffer = req.file?.buffer;
    const { character } = req.body;

    if (!audioBuffer) {
      return res.status(400).json({ error: "沒有接收到音檔" });
    }

    // 👇 加入這行：將 Buffer 轉換成 Blob
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });
    
    // 1. SS 層：打 Deepgram API 將 WebM 轉成文字
    const dgResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=zh-TW', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm'
      },
      // 👇 把這裡的 audioBuffer 改成 audioBlob
      body: audioBlob 
    });
    
    const dgData = await dgResponse.json() as any;
    const rawText = dgData.results?.channels[0]?.alternatives[0]?.transcript || "";
    
    if (!rawText.trim()) {
      return res.json({ success: true, text: "" }); // 沒講話
    }

    // 2. GL 層：打 NVIDIA Llama 進行專有名詞修正
    const globalContext = `
    劇本背景：韓國新亭洞連環殺人案 (窒息的地下室)。
    核心實體：新亭洞、陽川區、舊商業大樓、廢棄地下室、廢棄管理室、 清潔水槽、員工置物櫃、破舊洗手間、死角、騎樓、地下一樓、通風口、管理員室、洗手槽、獵奇兔子、尼龍繩、黑色塑膠袋、廉價香菸、木製菸斗、劣質菸草、折疊獵刀、過期細胞檢體、非法物證、隱藏攝影機、鐵撬、雨衣、乾燥砂土、濕袖口、指甲抓痕、粉紅色水痕、崔製作人、張警衛、拾荒者、廣搜隊長、節目助理、連環殺手、前科犯、被害者家屬、目擊證人、替罪羔羊、毒樹果實、追訴期、DNA比對、密室還原、硬核推理、 肉搜、獵巫、勒斃、窒息、棄屍、駭客技術、監聽
    `;
    
    const completion = await nvidiaClient.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          // 🌟 強化 Prompt：嚴厲禁止 AI 刪減字數或總結
          content: `你是一個專業的繁體中文語音修正器。背景為：${globalContext}。任務：將輸入的錯誤字詞修正為背景中的正確名詞。

【最高指導原則】：
1. 絕對不可總結、縮減或刪除任何對話內容！必須 100% 完整保留原本的句子長度、廢話與所有細節。
2. 僅替換掉錯誤的名詞，其餘內容一律原封不動保留。
3. 直接輸出修正後的全文，不要加任何解釋或開場白。`
        },
        {
          role: "user",
          content: `請完整保留原意與長度，僅修正名詞。原文如下：\n${rawText}`
        }
      ],
      temperature: 0.1, // 降低溫度，讓 AI 不要擅自發揮創意
      max_tokens: 8192  // 🌟 將輸出上限拉高到 8192 (NVIDIA API 的極限)，確保長對話不會被截斷
    });

    const correctedText = completion.choices[0].message.content?.trim() || rawText;
    const formattedTurn = `${character}：${correctedText}`;

    // 回傳修正後的文字給前端
    res.json({ success: true, text: formattedTurn });

  } catch (error) {
    console.error('語音處理發生錯誤:', error);
    res.status(500).json({ error: "語音處理失敗" });
  }
});

// ── AI 分析（非同步，立即回傳 jobId）────────────────────────

router.post("/analyse", (req, res) => {
  const { userId, scriptName, turns } = req.body;
  if (!Array.isArray(turns) || turns.length === 0) {
    return res.status(400).json({ error: "turns is empty" });
  }
  // jobId 包含 userId 和隨機數，確保唯一且可驗證歸屬
  const jobId = `u${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  larpEngine.startJob(jobId, userId, scriptName, turns);
  res.json({ jobId, status: "pending" });
});

// 查詢分析進度（加入 userId 驗證，防止跨用戶取到別人的報告）
router.get("/analyse/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = larpEngine.getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  // 從 jobId 解析 userId（格式：u{userId}_timestamp_random）
  const match = jobId.match(/^u(\d+)_/);
  const jobUserId = match ? parseInt(match[1]) : null;

  // 驗證請求者的 userId（從 query string 傳入）
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
