// ═══════════════════════════════════════════════════════════
// LARP 發言分析引擎
// ═══════════════════════════════════════════════════════════

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
  private groqClient: OpenAI;
  private nvidiaClient: OpenAI; // 👈 新增 Nvidia Client
  private groqLimiter = new RateLimiter(20); 
  private jobStore = new Map<string, any>();

  constructor() {
    this.groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || "",
      baseURL: "https://api.groq.com/openai/v1",
    });
    
    // 👈 初始化 Nvidia Client (使用 OpenAI 相容模式)
    this.nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || "",
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }

  // 替換原本的 private async nvidia 函數
  private async nvidia(prompt: string, json = false, modelName = "meta/llama-3.1-8b-instruct", retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await this.nvidiaClient.chat.completions.create({
          model: modelName,
          messages: [
            // 根據 json 參數決定要不要強制輸出 JSON
            { role: "system", content: json ? "你是一個嚴格依照要求格式輸出合法 JSON 的分析助手，不要使用 markdown 標記。" : "你是一個專業的分析助手。" },
            { role: "user", content: prompt }
          ],
          ...(json ? { response_format: { type: "json_object" as const } } : {}),
          temperature: 0.2, 
          max_tokens: 2048, // 確保輸出的字數夠長，不會被截斷
        });
        const text = res.choices[0].message.content || "";
        return json ? JSON.parse(text) : text;
      } catch (e: any) {
        if (i < retries - 1) {
          console.warn(`[Nvidia] API 請求失敗，準備重試...`, e?.message);
          await new Promise(r => setTimeout(r, 5000 * Math.pow(2, i)));
        } else {
          console.error(`[Nvidia] Error:`, e?.message);
          return json ? { error: String(e?.message) } : "";
        }
      }
    }
    return json ? { error: "retries exhausted" } : "";
  }

  async analyseTurn(raw: string): Promise<any> {
    // ⚠️ 這裡全部改成 this.nvidia
    
    // Layer 0: STT 修復 (因為前面 routes.ts 已經做過一次修復，若這裡想當作防呆，請設定 json = false)
    let repaired = await this.nvidia(P0_STT.replace("{raw}", raw), false);
    if (!repaired || typeof repaired !== "string") repaired = raw;

    // Layer 1: 黃金答案 (純文字輸出，json = false)
    let golden = await this.nvidia(P1_GOLDEN.replace("{repaired}", repaired), false);
    if (!golden || typeof golden !== "string") golden = repaired;

    // Layer 2: 四大分析師 (需要輸出 JSON，json = true)
    const [r2, r3, r4, r5] = await Promise.all([
      this.nvidia(P2_LOGIC.replace("{repaired}", repaired).replace("{golden}", golden), true),
      this.nvidia(P3_COGNITIVE.replace("{repaired}", repaired).replace("{golden}", golden), true),
      this.nvidia(P4_NEWBIE.replace("{repaired}", repaired), true),
      this.nvidia(P5_STRUCTURE.replace("{repaired}", repaired).replace("{golden}", golden), true),
    ]);

    // Layer 3: 雙審判官
    const judgePrompt = P_JUDGE
      .replace("{repaired}", repaired).replace("{golden}", golden)
      .replace("{r2}", JSON.stringify(r2)).replace("{r3}", JSON.stringify(r3))
      .replace("{r4}", JSON.stringify(r4)).replace("{r5}", JSON.stringify(r5));

    // 雙裁判評分 (需要 JSON，並且可以指定不同大小的模型交叉評分)
    const [jA, jB] = await Promise.all([
      this.nvidia(judgePrompt, true, "meta/llama-3.3-70b-instruct"), 
      this.nvidia(judgePrompt, true, "deepseek-ai/deepseek-v4-pro"), 
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
