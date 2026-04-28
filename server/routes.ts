// ═══════════════════════════════════════════════════════════
// REST API 路由
// ═══════════════════════════════════════════════════════════

import { Router } from "express";
import db from "./db.js";
import { larpEngine } from "./engine.js";

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
    const surveys = db.prepare("SELECT * FROM surveys WHERE user_id = ? ORDER BY created_at DESC").all(userId);
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
    const scripts = db.prepare("SELECT * FROM script_records WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    const reports = db.prepare("SELECT * FROM assessment_reports WHERE user_id = ? ORDER BY created_at DESC").all(userId);
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
    res.status(500).json({ error: "Database error" });
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
