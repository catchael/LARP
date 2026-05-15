// ═══════════════════════════════════════════════════════════
// LARP 發言分析引擎（v4：多帳號輪替 + 降低並發 + 429 退避）
// ═══════════════════════════════════════════════════════════

import OpenAI from "openai";
import db from "./db.js";
import {
  P0_CONTEXT_SUMMARY, P1_TYPE,
  P2_LOGIC, P3_ACCESSIBILITY, P4_STRUCTURE, P_JUDGE,
  MODELS,
} from "./prompts.js";

// ── JSON 清洗工具 ─────────────────────────────────────────

function stripReasoning(text: string): string {
  let cleaned = text.replace(/<think[\s\S]*?<\/think>/gi, '');
  const firstBracket = cleaned.search(/[\{\[]/);
  if (firstBracket > 0) cleaned = cleaned.slice(firstBracket);
  return cleaned.trim();
}

function repairJson(text: string): any | null {
  const firstBrace = text.indexOf('{');
  if (firstBrace < 0) return null;
  let s = text.slice(firstBrace);

  let inString = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') inString = !inString;
  }
  if (inString) s += '"';

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

// ── 多帳號 NVIDIA 客戶端池 ────────────────────────────────
// .env 設定：
//   NVIDIA_API_KEY_1=nvapi-xxxx
//   NVIDIA_API_KEY_2=nvapi-yyyy
//   NVIDIA_API_KEY_3=nvapi-zzzz

function buildNvidiaClients(): OpenAI[] {
  const keys: string[] = [];

  // 優先讀取帶編號的 keys
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`NVIDIA_API_KEY_${i}`];
    if (k) keys.push(k);
  }

  // 向後相容：沒有編號版本時，讀舊的 NVIDIA_API_KEY
  if (keys.length === 0) {
    const fallback = process.env.NVIDIA_API_KEY;
    if (fallback) keys.push(fallback);
  }

  if (keys.length === 0) {
    console.warn('⚠️  找不到任何 NVIDIA_API_KEY，AI 分析功能將無法使用！');
    return [];
  }

  console.log(`[NVIDIA] 已載入 ${keys.length} 組 API Key（前 8 碼）：`);
  keys.forEach((k, i) => console.log(`  #${i + 1}: ${k.slice(0, 8)}...`));

  return keys.map(
    (apiKey) =>
      new OpenAI({
        apiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      })
  );
}

// ── 輪替計數器 ───────────────────────────────────────────

class RoundRobinPool {
  private clients: OpenAI[];
  private index = 0;

  constructor(clients: OpenAI[]) {
    this.clients = clients;
  }

  next(): OpenAI {
    if (this.clients.length === 0) throw new Error('No NVIDIA API clients available');
    const client = this.clients[this.index];
    this.index = (this.index + 1) % this.clients.length;
    return client;
  }

  get size() { return this.clients.length; }
}

// ── Analysis Engine ───────────────────────────────────────

export class LARPEngine {
  private groqClient: OpenAI;
  private nvidiaPool: RoundRobinPool;
  private jobStore = new Map<string, any>();

  // 全域 API 請求信號量：最多同時 2 個 nvidia 請求
  // 每個 analyseTurn 內部有 P1(1) + P2/P3/P4(3並行) + Judge(1) = 5 個請求
  // concurrency=1 的 session 同時跑 1 個 turn，所以峰值 5 個請求
  // concurrency=2 的 session 峰值 10 個請求
  // 用 globalApiSemaphore 把峰值壓在 6 以下
  private globalApiSemaphore = new Semaphore(6);

  constructor() {
    this.groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.nvidiaPool = new RoundRobinPool(buildNvidiaClients());
  }

  private async nvidia(
    prompt: string,
    json = false,
    modelName: string = MODELS.P0_STT,
    retries = 4,
    maxTokens = 2048,
  ): Promise<any> {
    let currentMaxTokens = maxTokens;
    const isReasoningModel =
      modelName.includes('deepseek') ||
      modelName.includes('r1') ||
      modelName.includes('gpt-oss') ||
      modelName.includes('nemotron-3-super');

    for (let i = 0; i < retries; i++) {
      // 佔用全域信號量，避免同時發出過多請求
      await this.globalApiSemaphore.acquire();
      try {
        // 每次請求輪流從不同帳號發出
        const client = this.nvidiaPool.next();

        const baseBody: any = {
          model: modelName,
          messages: [
            {
              role: 'system',
              content: json
                ? '你是嚴格依照要求格式輸出合法 JSON 的分析助手，不要使用 markdown 標記，不要在 JSON 之外輸出任何文字。'
                : '你是一個專業的分析助手。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: currentMaxTokens,
        };
        if (json) baseBody.response_format = { type: 'json_object' };
        if (isReasoningModel) baseBody.chat_template_kwargs = { thinking: false };

        const res = await client.chat.completions.create(baseBody);

        const choice = res.choices[0];
        const text = choice.message.content || '';
        const finishReason = choice.finish_reason;

        // 截斷偵測：拉高 max_tokens 重試（不消耗重試次數）
        if (finishReason === 'length' && i < retries - 1) {
          console.warn(
            `[Nvidia ${modelName}] 輸出被截斷 (max_tokens=${currentMaxTokens})，拉高後重試`
          );
          currentMaxTokens = Math.min(currentMaxTokens * 2, 8192);
          continue; // 不 return，繼續下一輪 for loop
        }

        if (!json) return text;

        const cleanText = stripReasoning(text);
        try {
          return JSON.parse(cleanText);
        } catch {
          const repaired = repairJson(cleanText);
          if (repaired) {
            console.warn(`[Nvidia ${modelName}] JSON 截斷已修復成功`);
            return repaired;
          }
          throw new Error(`JSON parse failed: ${cleanText.slice(0, 200)}`);
        }
      } catch (e: any) {
        const is429 = e?.status === 429 || String(e?.message).includes('429');

        if (i < retries - 1) {
          // 429 退避：等更久；其他錯誤指數退避
          const baseWait = is429 ? 15000 : 5000;
          const wait = baseWait * Math.pow(2, i);
          console.warn(
            `[Nvidia ${modelName}] ${is429 ? '429 Too Many Requests' : '請求失敗'}，${wait / 1000}s 後重試 (${i + 1}/${retries})...`
          );
          await new Promise((r) => setTimeout(r, wait));
        } else {
          console.error(`[Nvidia ${modelName}] 所有重試耗盡:`, e?.message);
          return json ? { error: String(e?.message) } : '';
        }
      } finally {
        this.globalApiSemaphore.release();
      }
    }
    return json ? { error: 'retries exhausted' } : '';
  }

  async analyseTurn(
    raw: string,
    contextSummary = '',
    targetCharacter = '',
  ): Promise<any> {
    const repaired = raw;

    // P1_TYPE
    const typeResult = await this.nvidia(
      P1_TYPE
        .replace(/\{repaired\}/g, repaired)
        .replace(/\{context_summary\}/g, contextSummary),
      true,
      MODELS.P1_TYPE,
    );
    const ptype: string =
      (typeResult && typeof typeResult === 'object' && typeResult.type) || 'mixed';

    // P2 / P3 / P4 並行（但受全域信號量限制）
    const fillContext = (p: string) =>
      p
        .replace(/\{repaired\}/g, repaired)
        .replace(/\{context_summary\}/g, contextSummary)
        .replace(/\{target_character\}/g, targetCharacter)
        .replace(/\{ptype\}/g, ptype);

    const [r2, r3, r4] = await Promise.all([
      this.nvidia(fillContext(P2_LOGIC),         true, MODELS.P2_LOGIC),
      this.nvidia(fillContext(P3_ACCESSIBILITY), true, MODELS.P3_ACCESSIBILITY),
      this.nvidia(fillContext(P4_STRUCTURE),     true, MODELS.P4_STRUCTURE),
    ]);

    // Judge
    const judgePrompt = fillContext(P_JUDGE)
      .replace('{r2}', JSON.stringify(r2))
      .replace('{r3}', JSON.stringify(r3))
      .replace('{r4}', JSON.stringify(r4));

    const verdict = await this.nvidia(
      judgePrompt,
      true,
      MODELS.P_JUDGE,
      4,
      4096, // ← 從 8192 降到 4096；Judge 輸出不需要那麼長
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
    concurrency = 1, // ← 預設改成 1（原本是 2），降低 API 峰值
    fullDialogue?: { speaker: string; text: string }[],
    targetCharacter?: string,
  ): Promise<any> {

    // Turn 層級信號量（限制同時分析的 turn 數量）
    const semaphore = new Semaphore(concurrency);

    const contextStr =
      fullDialogue && fullDialogue.length > 0
        ? fullDialogue.map((d) => `${d.speaker}：${d.text}`).join('\n')
        : '（無完整對話脈絡）';
    const characterStr = targetCharacter || '未知角色';

    // context_summary 一次性產生
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
    const contextSummary =
      typeof summaryRaw === 'string' ? summaryRaw : JSON.stringify(summaryRaw);
    console.log(`[Analysis] Context summary 產生完畢 (${contextSummary.length} 字)`);

    const turnResults = await Promise.all(
      turns.map(async (t, i) => {
        await semaphore.acquire();
        console.log(`[Analysis] Turn ${i + 1}/${turns.length}`);
        try {
          const r = await this.analyseTurn(t, contextSummary, characterStr);
          return { ...r, turn: i };
        } finally {
          semaphore.release();
        }
      })
    );

    // 彙整分數
    const keys = ['logic_score', 'accessibility_score', 'coherence_score'];
    const pools: Record<string, number[]> = Object.fromEntries(
      keys.map((k) => [k, []])
    );
    const allStrengths: string[] = [],
      allWeaknesses: string[] = [],
      allFixes: string[] = [];

    for (const tr of turnResults) {
      const jv = tr.verdict;
      if (!jv || jv.error) {
        console.log(`[Analysis] Judge error:`, jv?.error);
        continue;
      }
      console.log(`[Analysis] Judge output keys:`, Object.keys(jv));
      const scoreObj = jv.scores ?? jv.final_scores ?? {};
      for (const k of keys) {
        const v = scoreObj[k];
        if (typeof v === 'number') pools[k].push(v);
      }
      if (Array.isArray(jv.strengths)) allStrengths.push(...jv.strengths);
      if (Array.isArray(jv.weaknesses)) allWeaknesses.push(...jv.weaknesses);
      const fix = jv.top_fix ?? jv.critical_fix ?? '';
      if (fix) allFixes.push(fix);
    }

    const avgScores = Object.fromEntries(
      keys.map((k) => [
        k,
        pools[k].length
          ? Math.round(
              (pools[k].reduce((a, b) => a + b, 0) / pools[k].length) * 10
            ) / 10
          : null,
      ])
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
      },
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
    this.jobStore.set(jobId, { status: 'pending' });
    (async () => {
      try {
        this.jobStore.set(jobId, { status: 'running' });
        // concurrency=1 避免爆 429
        const result = await this.analyseSession(turns, 1, fullDialogue, targetCharacter);
        this.jobStore.set(jobId, { status: 'done', result, userId, scriptName });
        console.log(`[Analysis] Job ${jobId} done`);
        try {
          await db.query(
            'INSERT INTO assessment_reports (user_id, report_data) VALUES ($1, $2)',
            [
              userId,
              JSON.stringify({
                ...result.summary,
                job_id: jobId,
                script_name: scriptName,
                turns: result.turns,
              }),
            ]
          );
        } catch (e) {
          console.error('[Analysis] DB save error:', e);
        }
      } catch (e: any) {
        this.jobStore.set(jobId, { status: 'error', error: e.message });
        console.error(`[Analysis] Job ${jobId} failed:`, e.message);
      }
    })();
  }

  getJob(jobId: string) {
    return this.jobStore.get(jobId) ?? null;
  }
}

// ── 通用信號量 ────────────────────────────────────────────

class Semaphore {
  private count: number;
  private queue: Array<() => void> = [];

  constructor(private max: number) {
    this.count = 0;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.count < this.max) {
        this.count++;
        resolve();
      } else {
        this.queue.push(() => {
          this.count++;
          resolve();
        });
      }
    });
  }

  release() {
    this.count--;
    if (this.queue.length > 0) {
      this.queue.shift()!();
    }
  }
}

export const larpEngine = new LARPEngine();