// ═══════════════════════════════════════════════════════════
// LARP 發言分析引擎
// ═══════════════════════════════════════════════════════════

import OpenAI from "openai";
import db from "./db.js";
import {
  P0_STT, P1_GOLDEN, P2_LOGIC, P3_COGNITIVE,
  P4_NEWBIE, P5_STRUCTURE, P_JUDGE,
} from "./prompts.js";

// ── JSON 清洗工具 ─────────────────────────────────────────

function stripReasoning(text: string): string {
  // 移除 <think>...</think> 區塊（含跨行）
  let cleaned = text.replace(/<think[\s\S]*?<\/think>/gi, '');
  // 移除 JSON 開頭之前的所有東西（例如思考的引言、解釋）
  const firstBracket = cleaned.search(/[\{\[]/);
  if (firstBracket > 0) cleaned = cleaned.slice(firstBracket);
  return cleaned.trim();
}

function repairJson(text: string): any | null {
  const firstBrace = text.indexOf('{');
  if (firstBrace < 0) return null;
  let s = text.slice(firstBrace);

  // 統計未跳脫的引號數量；奇數代表沒閉合
  let inString = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') inString = !inString;
  }
  if (inString) s += '"';

  // 補齊未閉合的 { [
  const stack: string[] = [];
  inString = false; escape = false;
  for (const c of s) {
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  while (stack.length) {
    s += stack.pop() === '{' ? '}' : ']';
  }

  try { return JSON.parse(s); } catch { return null; }
}

// ── Rate Limiter ──────────────────────────────────────────

class RateLimiter {
  private interval: number;
  private lastCall = 0;
  private queue: Array<() => void> = [];
  private processing = false;

  constructor(callsPerMinute: number) {
    console.log('[NVIDIA KEY 檢查]', 
    process.env.NVIDIA_API_KEY 
      ? `已讀到，前 8 碼：${process.env.NVIDIA_API_KEY.slice(0, 8)}` 
      : '⚠️ 完全空的！');
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
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    
    // 👈 初始化 Nvidia Client (使用 OpenAI 相容模式)
    this.nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }

  private async nvidia(
    prompt: string, 
    json = false, 
    modelName = "meta/llama-3.1-8b-instruct", 
    retries = 3,
    maxTokens = 2048,
  ): Promise<any> {
    let currentMaxTokens = maxTokens;
    // 🌟 reasoning 模型清單：要關 thinking
    const isReasoningModel = modelName.includes("deepseek") || modelName.includes("r1");

    for (let i = 0; i < retries; i++) {
      try {
        const baseBody: any = {
          model: modelName,
          messages: [
            { role: "system", content: json 
              ? "你是嚴格依照要求格式輸出合法 JSON 的分析助手，不要使用 markdown 標記，不要在 JSON 之外輸出任何文字。" 
              : "你是一個專業的分析助手。" },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          max_tokens: currentMaxTokens,
        };
        if (json) baseBody.response_format = { type: "json_object" };
        // 🌟 reasoning 模型強制關閉思考輸出
        if (isReasoningModel) baseBody.chat_template_kwargs = { thinking: false };

        const res = await this.nvidiaClient.chat.completions.create(baseBody);

        const choice = res.choices[0];
        const text = choice.message.content || "";
        const finishReason = choice.finish_reason;

        // 🌟 截斷偵測：被切尾巴就拉高 max_tokens 重打
        if (finishReason === "length" && i < retries - 1) {
          console.warn(`[Nvidia] 輸出被截斷 (max_tokens=${currentMaxTokens})，下一次重試拉高上限`);
          currentMaxTokens = Math.min(currentMaxTokens * 2, 8192);
          continue;
        }

        if (!json) return text;

        // 🌟 ←←← stripReasoning 放這裡！解析 JSON 之前先清一次思考殘渣
        const cleanText = stripReasoning(text);

        try {
          return JSON.parse(cleanText);
        } catch (parseErr) {
          const repaired = repairJson(cleanText);
          if (repaired) {
            console.warn(`[Nvidia] JSON 截斷已修復成功`);
            return repaired;
          }
          throw parseErr;
        }
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

  async analyseTurn(raw: string, fullContext = '', targetCharacter = ''): Promise<any> {
    let repaired = await this.nvidia(P0_STT.replace("{raw}", raw), false);
    if (!repaired || typeof repaired !== "string") repaired = raw;

    let golden = await this.nvidia(P1_GOLDEN.replace("{repaired}", repaired), false);
    if (!golden || typeof golden !== "string") golden = repaired;

    // 🌟 把脈絡和角色名都塞進去
    const fillContext = (p: string) => p
      .replace("{repaired}", repaired)
      .replace("{golden}", golden)
      .replace("{full_context}", fullContext)
      .replace("{target_character}", targetCharacter);

    const [r2, r3, r4, r5] = await Promise.all([
      this.nvidia(fillContext(P2_LOGIC), true),
      this.nvidia(fillContext(P3_COGNITIVE), true),
      this.nvidia(fillContext(P4_NEWBIE), true),
      this.nvidia(fillContext(P5_STRUCTURE), true),
    ]);

    const judgePrompt = fillContext(P_JUDGE)
      .replace("{r2}", JSON.stringify(r2)).replace("{r3}", JSON.stringify(r3))
      .replace("{r4}", JSON.stringify(r4)).replace("{r5}", JSON.stringify(r5));

    const [jA, jB] = await Promise.all([
      this.nvidia(judgePrompt, true, "nvidia/nemotron-3-super-120b-a12b", 3, 4096), 
      this.nvidia(judgePrompt, true, "deepseek-ai/deepseek-v4-pro", 3, 4096), // 🌟 換掉那個可能不存在的 deepseek-v4-pro
    ]);

    return { raw, repaired, golden, reports: { logic: r2, cognitive: r3, newbie: r4, structure: r5 }, verdicts: { a: jA, b: jB } };
  }

  async analyseSession(
    turns: string[], 
    concurrency = 2,
    fullDialogue?: { speaker: string; text: string }[],
    targetCharacter?: string,
  ): Promise<any> {
    // ⚠️ 以下三行是 acquire/release 的定義，缺一不可！
    const semaphore = { count: 0, max: concurrency, queue: [] as Array<() => void> };
    const acquire = () => new Promise<void>(resolve => {
      if (semaphore.count < semaphore.max) { semaphore.count++; resolve(); }
      else semaphore.queue.push(() => { semaphore.count++; resolve(); });
    });
    const release = () => {
      semaphore.count--;
      if (semaphore.queue.length > 0) semaphore.queue.shift()!();
    };

    // 把整局對話格式化成一個字串脈絡，每個 turn 都用得到
    const contextStr = fullDialogue && fullDialogue.length > 0
      ? fullDialogue.map(d => `${d.speaker}：${d.text}`).join('\n')
      : '（無完整對話脈絡）';
    const characterStr = targetCharacter || '未知角色';

    const turnResults = await Promise.all(turns.map(async (t, i) => {
      await acquire();
      console.log(`[Analysis] Turn ${i + 1}/${turns.length}`);
      try {
        const r = await this.analyseTurn(t, contextStr, characterStr);
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
  startJob(
    jobId: string, 
    userId: number, 
    scriptName: string, 
    turns: string[],
    fullDialogue?: { speaker: string; text: string }[],
    targetCharacter?: string,
  ) {
    this.jobStore.set(jobId, { status: "pending" });
    (async () => {
      try {
        this.jobStore.set(jobId, { status: "running" });
        const result = await this.analyseSession(turns, 2, fullDialogue, targetCharacter);
        this.jobStore.set(jobId, { status: "done", result, userId, scriptName });
        console.log(`[Analysis] Job ${jobId} done`);
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
