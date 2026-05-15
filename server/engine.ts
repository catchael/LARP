// ═══════════════════════════════════════════════════════════
// LARP 發言分析引擎（v5：串行流程 + 任一失敗即中止）
//
// 優先級：
//   P0_STT   → 永遠執行，retry 保留，失敗只記錄不中止（在 routes.ts 處理）
//   其餘步驟 → 串行，任一失敗立刻停止後續所有請求
//
// 流程：
//   [analyseSession]
//     └─ P0_CONTEXT_SUMMARY  ← 失敗 → 所有 turn 跳過分析，只保留 raw
//   [analyseTurn × N，逐一串行執行]
//     └─ P1_TYPE  → 失敗 → 此 turn abort（P2/P3/P4/Judge 不發）
//     └─ P2_LOGIC → 失敗 → abort
//     └─ P3_ACCESSIBILITY → 失敗 → abort
//     └─ P4_STRUCTURE     → 失敗 → abort
//     └─ P_JUDGE          → 失敗 → abort
//   各 turn 相互獨立：一個 turn abort 不影響下一個 turn
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

// ── 中止信號（區分「正常 null」與「分析鏈失敗」） ──────────

class AnalysisAbortError extends Error {
  constructor(step: string, cause: string) {
    super(`[Abort] ${step} 失敗，中止後續分析：${cause}`);
    this.name = 'AnalysisAbortError';
  }
}

// ── 多帳號 NVIDIA 客戶端池 ────────────────────────────────
// .env 設定：
//   NVIDIA_API_KEY_1=nvapi-xxxx
//   NVIDIA_API_KEY_2=nvapi-yyyy
//   NVIDIA_API_KEY_3=nvapi-zzzz

function buildNvidiaClients(): OpenAI[] {
  const keys: string[] = [];

  for (let i = 1; i <= 10; i++) {
    const k = process.env[`NVIDIA_API_KEY_${i}`]?.trim();
    if (k) keys.push(k);
  }

  // 向後相容：讀舊的 NVIDIA_API_KEY
  if (keys.length === 0) {
    const fallback = process.env.NVIDIA_API_KEY?.trim();
    if (fallback) keys.push(fallback);
  }

  if (keys.length === 0) {
    console.warn('⚠️  找不到任何 NVIDIA_API_KEY，AI 分析功能將無法使用！');
    return [];
  }

  console.log(`[NVIDIA] 已載入 ${keys.length} 組 API Key（前 8 碼）：`);
  keys.forEach((k, i) => console.log(`  #${i + 1}: ${k.slice(0, 8)}...`));

  return keys.map(
    (apiKey) => new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' })
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

// ── 通用信號量 ────────────────────────────────────────────

class Semaphore {
  private count = 0;
  private queue: Array<() => void> = [];

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.count < this.max) { this.count++; resolve(); }
      else this.queue.push(() => { this.count++; resolve(); });
    });
  }

  release() {
    this.count--;
    if (this.queue.length > 0) this.queue.shift()!();
  }
}

// ── Analysis Engine ───────────────────────────────────────

export class LARPEngine {
  private groqClient: OpenAI;
  private nvidiaPool: RoundRobinPool;
  private jobStore = new Map<string, any>();

  // 串行後同時最多 1 個請求在跑，信號量設 3 留一點緩衝給 context_summary 和 turn 重疊的瞬間
  private globalApiSemaphore = new Semaphore(3);

  constructor() {
    this.groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    this.nvidiaPool = new RoundRobinPool(buildNvidiaClients());
  }

  // ── 核心請求方法 ──────────────────────────────────────────
  // throwOnFail=true  → 失敗時丟出 AnalysisAbortError（分析鏈用）
  // throwOnFail=false → 失敗時回傳 null/''，不中止（P0_STT 專用）

  private async nvidia(
    prompt: string,
    json = false,
    modelName: string = MODELS.P0_STT,
    retries = 2,
    maxTokens = 2048,
    throwOnFail = true,
  ): Promise<any> {
    const isReasoningModel =
      modelName.includes('deepseek') ||
      modelName.includes('r1') ||
      modelName.includes('gpt-oss') ||
      modelName.includes('nemotron-3-super');

    let lastError = '';

    for (let i = 0; i < retries; i++) {
      await this.globalApiSemaphore.acquire();
      try {
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
          max_tokens: maxTokens,
        };
        if (json) baseBody.response_format = { type: 'json_object' };
        if (isReasoningModel) baseBody.chat_template_kwargs = { thinking: false };

        const res = await client.chat.completions.create(baseBody);
        const choice = res.choices[0];
        const text = choice.message.content || '';
        const finishReason = choice.finish_reason;

        // 截斷 → 不拉高 token 重打，視為失敗直接中止
        if (finishReason === 'length') {
          lastError = `輸出被截斷 (max_tokens=${maxTokens})，不重試`;
          console.warn(`[Nvidia ${modelName}] ${lastError}`);
          break;
        }

        if (!json) return text;

        const cleanText = stripReasoning(text);
        try {
          return JSON.parse(cleanText);
        } catch {
          const repaired = repairJson(cleanText);
          if (repaired) {
            console.warn(`[Nvidia ${modelName}] JSON 修復成功`);
            return repaired;
          }
          lastError = `JSON parse 失敗: ${cleanText.slice(0, 120)}`;
          console.warn(`[Nvidia ${modelName}] ${lastError}`);
          break; // JSON 壞掉不重試
        }

      } catch (e: any) {
        const is429 = e?.status === 429 || String(e?.message).includes('429');
        lastError = e?.message ?? String(e);

        if (i < retries - 1) {
          const baseWait = is429 ? 15000 : 5000;
          const wait = baseWait * Math.pow(2, i);
          console.warn(
            `[Nvidia ${modelName}] ${is429 ? '429' : '錯誤'}，${wait / 1000}s 後重試 (${i + 1}/${retries})...`
          );
          await new Promise((r) => setTimeout(r, wait));
        } else {
          console.error(`[Nvidia ${modelName}] 重試耗盡:`, lastError);
        }
      } finally {
        this.globalApiSemaphore.release();
      }
    }

    // 所有 retry 耗盡或提前 break
    if (throwOnFail) {
      throw new AnalysisAbortError(modelName, lastError);
    }
    console.warn(`[Nvidia ${modelName}] 失敗（P0_STT 模式，不中止）:`, lastError);
    return json ? null : '';
  }

  // ── 單一 Turn 分析（完全串行，任一步失敗即 throw） ─────────

  async analyseTurn(
    raw: string,
    contextSummary = '',
    targetCharacter = '',
  ): Promise<any> {
    const repaired = raw;

    const fillContext = (p: string) =>
      p
        .replace(/\{repaired\}/g, repaired)
        .replace(/\{context_summary\}/g, contextSummary)
        .replace(/\{target_character\}/g, targetCharacter);

    // Step 1: P1_TYPE
    const typeResult = await this.nvidia(
      P1_TYPE
        .replace(/\{repaired\}/g, repaired)
        .replace(/\{context_summary\}/g, contextSummary),
      true, MODELS.P1_TYPE,
      2,   // retries
      512, // P1 只輸出 {type}，512 足夠
      true,
    );
    const ptype: string =
      (typeResult && typeof typeResult === 'object' && typeResult.type) || 'mixed';

    const fc = (p: string) => fillContext(p).replace(/\{ptype\}/g, ptype);

    // Step 2: P2_LOGIC
    const r2 = await this.nvidia(fc(P2_LOGIC), true, MODELS.P2_LOGIC, 2, 2048, true);

    // Step 3: P3_ACCESSIBILITY
    const r3 = await this.nvidia(fc(P3_ACCESSIBILITY), true, MODELS.P3_ACCESSIBILITY, 2, 2048, true);

    // Step 4: P4_STRUCTURE
    const r4 = await this.nvidia(fc(P4_STRUCTURE), true, MODELS.P4_STRUCTURE, 2, 2048, true);

    // Step 5: P_JUDGE
    const judgePrompt = fc(P_JUDGE)
      .replace('{r2}', JSON.stringify(r2))
      .replace('{r3}', JSON.stringify(r3))
      .replace('{r4}', JSON.stringify(r4));

    const verdict = await this.nvidia(judgePrompt, true, MODELS.P_JUDGE, 2, 4096, true);

    return {
      raw,
      repaired,
      ptype,
      reports: { logic: r2, accessibility: r3, structure: r4 },
      verdict,
    };
  }

  // ── Session 分析 ──────────────────────────────────────────

  async analyseSession(
    turns: string[],
    fullDialogue?: { speaker: string; text: string }[],
    targetCharacter?: string,
  ): Promise<any> {

    const contextStr =
      fullDialogue && fullDialogue.length > 0
        ? fullDialogue.map((d) => `${d.speaker}：${d.text}`).join('\n')
        : '（無完整對話脈絡）';
    const characterStr = targetCharacter || '未知角色';

    // ── P0_CONTEXT_SUMMARY ────────────────────────────────
    // 失敗 → 所有 turn 跳過分析，只保留 raw 逐字稿
    let contextSummary = '';
    try {
      const summaryPrompt = P0_CONTEXT_SUMMARY
        .replace('{full_context}', contextStr)
        .replace(/\{target_character\}/g, characterStr);
      const summaryRaw = await this.nvidia(
        summaryPrompt, true, MODELS.P0_CONTEXT_SUMMARY, 2, 1024, true,
      );
      contextSummary = typeof summaryRaw === 'string' ? summaryRaw : JSON.stringify(summaryRaw);
      console.log(`[Analysis] Context summary 產生完畢 (${contextSummary.length} 字)`);
    } catch (e: any) {
      console.warn(`[Analysis] P0_CONTEXT_SUMMARY 失敗，跳過所有 turn 分析：`, e.message);
      return {
        turns: turns.map((raw, i) => ({ raw, turn: i, skipped: true, skipReason: 'context_summary_failed' })),
        summary: {
          scores: { logic_score: null, accessibility_score: null, coherence_score: null },
          strengths: [], weaknesses: [], top_fixes: [],
          total_turns: turns.length,
          total_chars: turns.reduce((s, t) => s + t.length, 0),
          analysisSkipped: true,
          skipReason: e.message,
        },
      };
    }

    // ── 逐一分析 turn（完全串行） ─────────────────────────
    const turnResults: any[] = [];

    for (let i = 0; i < turns.length; i++) {
      console.log(`[Analysis] Turn ${i + 1}/${turns.length}`);
      try {
        const r = await this.analyseTurn(turns[i], contextSummary, characterStr);
        turnResults.push({ ...r, turn: i });
      } catch (e: any) {
        // 一個 turn 失敗不影響下一個 turn，記錄後繼續
        console.warn(`[Analysis] Turn ${i + 1} 中止（${e.message}）`);
        turnResults.push({
          raw: turns[i],
          turn: i,
          skipped: true,
          skipReason: e.message,
        });
      }
    }

    // ── 彙整分數 ───────────────────────────────────────────
    const keys = ['logic_score', 'accessibility_score', 'coherence_score'];
    const pools: Record<string, number[]> = Object.fromEntries(keys.map((k) => [k, []]));
    const allStrengths: string[] = [], allWeaknesses: string[] = [], allFixes: string[] = [];

    for (const tr of turnResults) {
      if (tr.skipped) continue;
      const jv = tr.verdict;
      if (!jv || jv.error) continue;
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
          ? Math.round((pools[k].reduce((a, b) => a + b, 0) / pools[k].length) * 10) / 10
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

  // ── 背景任務管理 ──────────────────────────────────────────

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
        const result = await this.analyseSession(turns, fullDialogue, targetCharacter);
        this.jobStore.set(jobId, { status: 'done', result, userId, scriptName });
        console.log(`[Analysis] Job ${jobId} done`);
        try {
          await db.query(
            'INSERT INTO assessment_reports (user_id, report_data) VALUES ($1, $2)',
            [userId, JSON.stringify({
              ...result.summary,
              job_id: jobId,
              script_name: scriptName,
              turns: result.turns,
            })]
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

export const larpEngine = new LARPEngine();