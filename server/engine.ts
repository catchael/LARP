// ═══════════════════════════════════════════════════════════
// LARP 發言分析引擎
// ═══════════════════════════════════════════════════════════

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import db from "./db.js";
import {
  P0_STT, P1_GOLDEN, P2_LOGIC, P3_COGNITIVE,
  P4_NEWBIE, P5_STRUCTURE, P_JUDGE,
} from "./prompts.js";

// ── Rate Limiter ──────────────────────────────────────────

class RateLimiter {
  private interval: number;
  private lastCall = 0;
  private queue: Array<() => void> = [];
  private processing = false;

  constructor(callsPerMinute: number) {
    this.interval = 60000 / callsPerMinute;
  }

  async acquire(): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(resolve);
      if (!this.processing) this.process();
    });
  }

  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const wait = this.interval - (now - this.lastCall);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      this.lastCall = Date.now();
      this.queue.shift()!();
    }
    this.processing = false;
  }
}

// ── Analysis Engine ───────────────────────────────────────

export class LARPEngine {
  private geminiClient: GoogleGenAI;
  private groqClient: OpenAI;
  private groqLimiter = new RateLimiter(20); // 保守：免費 30/min
  private jobStore = new Map<string, any>();

  constructor() {
    this.geminiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
    this.groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || "",
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  private async groq(prompt: string, json = false, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.groqLimiter.acquire();
        const res = await this.groqClient.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: json ? "你是一個只輸出合法 JSON 的分析助手，不使用 markdown。" : "你是一個分析助手。" },
            { role: "user", content: prompt }
          ],
          ...(json ? { response_format: { type: "json_object" as const } } : {}),
          temperature: 0.5,
          max_tokens: 3000,
        });
        const text = res.choices[0].message.content || "";
        return json ? JSON.parse(text) : text;
      } catch (e: any) {
        if (e?.status === 429 && i < retries - 1) {
          const wait = 10000 * Math.pow(2, i);
          console.warn(`[Groq] 429 rate limit, retry in ${wait / 1000}s`);
          await new Promise(r => setTimeout(r, wait));
        } else {
          console.error(`[Groq] Error:`, e?.message);
          return json ? { error: String(e?.message) } : "";
        }
      }
    }
    return json ? { error: "retries exhausted" } : "";
  }

  private async gemini(prompt: string, modelName = "gemini-2.0-flash", retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await this.geminiClient.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const text = res.text || "";
        return JSON.parse(text);
      } catch (e: any) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 5000 * Math.pow(2, i)));
        } else {
          console.error(`[Gemini] Error:`, e?.message);
          return { error: String(e?.message) };
        }
      }
    }
    return { error: "retries exhausted" };
  }

  async analyseTurn(raw: string): Promise<any> {
    // Layer 0: STT 修復
    let repaired = await this.groq(P0_STT.replace("{raw}", raw));
    if (!repaired || typeof repaired !== "string") repaired = raw;

    // Layer 1: 黃金答案
    let golden = await this.groq(P1_GOLDEN.replace("{repaired}", repaired));
    if (!golden || typeof golden !== "string") golden = repaired;

    // Layer 2: 四大分析師（並行，共 4 次 Groq calls）
    const [r2, r3, r4, r5] = await Promise.all([
      this.groq(P2_LOGIC.replace("{repaired}", repaired).replace("{golden}", golden), true),
      this.groq(P3_COGNITIVE.replace("{repaired}", repaired).replace("{golden}", golden), true),
      this.groq(P4_NEWBIE.replace("{repaired}", repaired), true),
      this.groq(P5_STRUCTURE.replace("{repaired}", repaired).replace("{golden}", golden), true),
    ]);

    // Layer 3: 雙審判官（並行，Gemini 不佔 Groq 額度）
    const judgePrompt = P_JUDGE
      .replace("{repaired}", repaired).replace("{golden}", golden)
      .replace("{r2}", JSON.stringify(r2)).replace("{r3}", JSON.stringify(r3))
      .replace("{r4}", JSON.stringify(r4)).replace("{r5}", JSON.stringify(r5));

    const [jA, jB] = await Promise.all([
      this.gemini(judgePrompt, "gemini-2.5-flash"),
      this.gemini(judgePrompt, "gemini-2.0-flash"),
    ]);

    return { raw, repaired, golden, reports: { logic: r2, cognitive: r3, newbie: r4, structure: r5 }, verdicts: { a: jA, b: jB } };
  }

  async analyseSession(turns: string[], concurrency = 2): Promise<any> {
    const semaphore = { count: 0, max: concurrency, queue: [] as Array<() => void> };
    const acquire = () => new Promise<void>(resolve => {
      if (semaphore.count < semaphore.max) { semaphore.count++; resolve(); }
      else semaphore.queue.push(() => { semaphore.count++; resolve(); });
    });
    const release = () => {
      semaphore.count--;
      if (semaphore.queue.length > 0) semaphore.queue.shift()!();
    };

    const turnResults = await Promise.all(turns.map(async (t, i) => {
      await acquire();
      console.log(`[Analysis] Turn ${i + 1}/${turns.length}`);
      try {
        const r = await this.analyseTurn(t);
        return { ...r, turn: i };
      } finally {
        release();
      }
    }));

    // 彙整：平均雙審判官分數
    const keys = ["logic_score", "clarity_score", "accessibility_score", "coherence_score"];
    const pools: Record<string, number[]> = Object.fromEntries(keys.map(k => [k, []]));
    const allStrengths: string[] = [], allWeaknesses: string[] = [], allFixes: string[] = [];

    for (const tr of turnResults) {
      for (const jv of [tr.verdicts?.a, tr.verdicts?.b]) {
        if (!jv || jv.error) {
          console.log(`[Analysis] Judge error:`, jv?.error);
          continue;
        }
        console.log(`[Analysis] Judge output keys:`, Object.keys(jv));
        console.log(`[Analysis] Judge scores:`, JSON.stringify(jv.scores ?? jv.final_scores ?? 'NOT FOUND'));
        // 相容 scores 和 final_scores 兩種 key
        const scoreObj = jv.scores ?? jv.final_scores ?? {};
        for (const k of keys) {
          const v = scoreObj[k];
          if (typeof v === "number") pools[k].push(v);
        }
        if (Array.isArray(jv.strengths)) allStrengths.push(...jv.strengths);
        if (Array.isArray(jv.weaknesses)) allWeaknesses.push(...jv.weaknesses);
        const fix = jv.top_fix ?? jv.critical_fix ?? "";
        if (fix) allFixes.push(fix);
      }
    }

    const avgScores = Object.fromEntries(
      keys.map(k => [k, pools[k].length ? Math.round((pools[k].reduce((a, b) => a + b, 0) / pools[k].length) * 10) / 10 : null])
    );
    const dedup = (arr: string[]) => [...new Set(arr)];

    return {
      turns: turnResults,
      summary: {
        scores: avgScores,
        strengths: dedup(allStrengths).slice(0, 3),
        weaknesses: dedup(allWeaknesses).slice(0, 3),
        top_fixes: dedup(allFixes).slice(0, 2),
        total_turns: turns.length,
        total_chars: turns.reduce((s, t) => s + t.length, 0),
      }
    };
  }

  // 背景任務管理
  startJob(jobId: string, userId: number, scriptName: string, turns: string[]) {
    this.jobStore.set(jobId, { status: "pending" });
    (async () => {
      try {
        this.jobStore.set(jobId, { status: "running" });
        const result = await this.analyseSession(turns);
        this.jobStore.set(jobId, { status: "done", result, userId, scriptName });
        console.log(`[Analysis] Job ${jobId} done`);
        // 自動存資料庫
        try {
          db.prepare("INSERT INTO assessment_reports (user_id, report_data) VALUES (?, ?)")
            .run(userId, JSON.stringify({ ...result.summary, job_id: jobId, script_name: scriptName, turns: result.turns }));
        } catch (e) { console.error("[Analysis] DB save error:", e); }
      } catch (e: any) {
        this.jobStore.set(jobId, { status: "error", error: e.message });
        console.error(`[Analysis] Job ${jobId} failed:`, e.message);
      }
    })();
  }

  getJob(jobId: string) {
    return this.jobStore.get(jobId) ?? null;
  }
}

export const larpEngine = new LARPEngine();
