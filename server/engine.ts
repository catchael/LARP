// ═══════════════════════════════════════════════════════════
// LARP 發言分析引擎（v3：合併 P_TYPE、3 維度、單一 Judge）
// ═══════════════════════════════════════════════════════════

import OpenAI from "openai";
import db from "./db.js";
import {
  P0_STT, P0_CONTEXT_SUMMARY, P1_TYPE,
  P2_LOGIC, P3_ACCESSIBILITY, P4_STRUCTURE, P_JUDGE,
  MODELS,
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
  private nvidiaClient: OpenAI;
  private groqLimiter = new RateLimiter(20);
  private jobStore = new Map<string, any>();

  constructor() {
    this.groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    this.nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }

  private async nvidia(
    prompt: string,
    json = false,
    modelName: string = MODELS.P0_STT, // 預設用最便宜的模型，呼叫端應自行指定
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
          console.warn(`[Nvidia ${modelName}] 輸出被截斷 (max_tokens=${currentMaxTokens})，下一次重試拉高上限`);
          currentMaxTokens = Math.min(currentMaxTokens * 2, 8192);
          continue;
        }

        if (!json) return text;

        // 🌟 解析 JSON 之前先清思考殘渣
        const cleanText = stripReasoning(text);

        try {
          return JSON.parse(cleanText);
        } catch (parseErr) {
          const repaired = repairJson(cleanText);
          if (repaired) {
            console.warn(`[Nvidia ${modelName}] JSON 截斷已修復成功`);
            return repaired;
          }
          throw parseErr;
        }
      } catch (e: any) {
        if (i < retries - 1) {
          console.warn(`[Nvidia ${modelName}] API 請求失敗，準備重試...`, e?.message);
          await new Promise(r => setTimeout(r, 5000 * Math.pow(2, i)));
        } else {
          console.error(`[Nvidia ${modelName}] Error:`, e?.message);
          return json ? { error: String(e?.message) } : "";
        }
      }
    }
    return json ? { error: "retries exhausted" } : "";
  }

  async analyseTurn(
    raw: string,
    contextSummary = '',
    targetCharacter = '',
  ): Promise<any> {
    // ─── 步驟 1：P0_STT 文字校對 ───
    let repaired = await this.nvidia(
      P0_STT.replace("{raw}", raw),
      false,
      MODELS.P0_STT,
    );
    if (!repaired || typeof repaired !== "string") repaired = raw;

    // ─── 步驟 2：P1_TYPE（判定發言類型）───
    const typeResult = await this.nvidia(
      P1_TYPE
        .replace(/\{repaired\}/g, repaired)
        .replace(/\{context_summary\}/g, contextSummary),
      true,
      MODELS.P1_TYPE,
    );
    // 容錯：模型沒乖乖出 JSON 時 fallback
    const ptype: string =
      (typeResult && typeof typeResult === 'object' && typeResult.type) || 'mixed';

    // ─── 步驟 3：三位分析師並行（P2/P3/P4） ───
    const fillContext = (p: string) => p
      .replace(/\{repaired\}/g, repaired)
      .replace(/\{context_summary\}/g, contextSummary)
      .replace(/\{target_character\}/g, targetCharacter)
      .replace(/\{ptype\}/g, ptype);

    const [r2, r3, r4] = await Promise.all([
      this.nvidia(fillContext(P2_LOGIC),         true, MODELS.P2_LOGIC),
      this.nvidia(fillContext(P3_ACCESSIBILITY), true, MODELS.P3_ACCESSIBILITY),
      this.nvidia(fillContext(P4_STRUCTURE),     true, MODELS.P4_STRUCTURE),
    ]);

    // ─── 步驟 4：P_JUDGE 統一評分（單一裁判）───
    const judgePrompt = fillContext(P_JUDGE)
      .replace("{r2}", JSON.stringify(r2))
      .replace("{r3}", JSON.stringify(r3))
      .replace("{r4}", JSON.stringify(r4));

    const verdict = await this.nvidia(
      judgePrompt,
      true,
      MODELS.P_JUDGE,
      3,
      4096,
    );

    return {
      raw,
      repaired,
      ptype,
      reports: { logic: r2, accessibility: r3, structure: r4 },
      verdict,
    };
  }

  async analyseSession(
    turns: string[],
    concurrency = 2,
    fullDialogue?: { speaker: string; text: string }[],
    targetCharacter?: string,
  ): Promise<any> {

    // 並行控制
    const semaphore = { count: 0, max: concurrency, queue: [] as Array<() => void> };
    const acquire = () => new Promise<void>(resolve => {
      if (semaphore.count < semaphore.max) { semaphore.count++; resolve(); }
      else semaphore.queue.push(() => { semaphore.count++; resolve(); });
    });
    const release = () => {
      semaphore.count--;
      if (semaphore.queue.length > 0) semaphore.queue.shift()!();
    };

    const contextStr = fullDialogue && fullDialogue.length > 0
      ? fullDialogue.map(d => `${d.speaker}：${d.text}`).join('\n')
      : '（無完整對話脈絡）';
    const characterStr = targetCharacter || '未知角色';

    // 🌟 一次性產生 context_summary，後面所有 turn 共用
    const summaryPrompt = P0_CONTEXT_SUMMARY
      .replace('{full_context}', contextStr)
      .replace(/\{target_character\}/g, characterStr);
    const summaryRaw = await this.nvidia(
      summaryPrompt,
      true,
      MODELS.P0_CONTEXT_SUMMARY,
      3,
      1024,
    );
    const contextSummary = typeof summaryRaw === 'string'
      ? summaryRaw
      : JSON.stringify(summaryRaw);
    console.log(`[Analysis] Context summary 產生完畢 (${contextSummary.length} 字)`);

    const turnResults = await Promise.all(turns.map(async (t, i) => {
      await acquire();
      console.log(`[Analysis] Turn ${i + 1}/${turns.length}`);
      try {
        const r = await this.analyseTurn(t, contextSummary, characterStr);
        return { ...r, turn: i };
      } finally {
        release();
      }
    }));

    // 彙整：三維度分數（拿掉 clarity_score）
    const keys = ["logic_score", "accessibility_score", "coherence_score"];
    const pools: Record<string, number[]> = Object.fromEntries(keys.map(k => [k, []]));
    const allStrengths: string[] = [], allWeaknesses: string[] = [], allFixes: string[] = [];

    for (const tr of turnResults) {
      const jv = tr.verdict;
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
          await db.query(
            "INSERT INTO assessment_reports (user_id, report_data) VALUES ($1, $2)",
            [userId, JSON.stringify({ ...result.summary, job_id: jobId, script_name: scriptName, turns: result.turns })]
          );
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