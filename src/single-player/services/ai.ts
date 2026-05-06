import Groq from "groq-sdk";
import { Level } from "../lib/levels";

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      throw new Error("Missing VITE_GROQ_API_KEY environment variable. 請檢查 .env 檔案。");
    }
    groqClient = new Groq({ 
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true 
    });
  }
  return groqClient;
}

export interface PuzzleEvaluation {
  passed: boolean;
  score: number;
  structureScore: number;
  fluencyScore: number;
  npcResponse: string;
  coachFeedback: string[];
  rewritten: string;
}

// 🌟 改用 Groq 平台上最強的開源推理模型
const MODEL_NAME = "deepseek-r1-distill-llama-70b";

// 🌟 新增 JSON 清洗工具：負責把 <think> 區塊與多餘字元砍掉
function stripReasoning(text: string): string {
  // 1. 移除 <think>...</think> 區塊（含跨行）
  let cleaned = text.replace(/<think[\s\S]*?<\/think>/gi, '');
  // 2. 移除 Markdown 標記
  cleaned = cleaned.replace(/```json\n?|```/g, '');
  // 3. 尋找第一個 { 或 [，把前面 AI 囉嗦的廢話（例如 "這是我為您生成的..."）全部切掉
  const firstBracket = cleaned.search(/[\{\[]/);
  if (firstBracket >= 0) {
    cleaned = cleaned.slice(firstBracket);
  }
  return cleaned.trim();
}

export async function generateCustomFramework(userPrompt: string): Promise<Level> {
  const groq = getGroqClient();
  
  const prompt = `你是一個世界頂尖的溝通專家與遊戲設計師。
使用者遇到了一個真實的溝通挑戰，請你幫他設計一套專屬的「發言結構（溝通框架）」，並把這個挑戰包裝成遊戲的一個關卡讓他練習。

使用者的溝通挑戰：
「${userPrompt}」

請以 JSON 格式回傳一個符合下列結構的物件。
如果其中有任何文字錯誤，請放在 corrections 中。

{
  "id": 999,
  "title": "自訂關卡：[幫他想一個標題]",
  "scenario": "情境描述（依照使用者的挑戰改寫，帶有一點遊戲感或真實感）",
  "objective": "玩家目標",
  "npcName": "對話對象的名字與職稱",
  "npcGreeting": "對象的一句開場白（需要有帶入感，可帶點情緒或壓力）",
  "keywords": ["關鍵字1", "關鍵字2"],
  "corrections": {},
  "clues": [
    { "id": "clue1", "icon": "💡", "text": "有用的線索或事實1", "isRelevant": true },
    { "id": "clue2", "icon": "🤔", "text": "無關的干擾線索", "isRelevant": false }
  ],
  "support": {
    "strategy": "你為他發明的專屬發言框架名稱",
    "description": "這個框架的應用情境與精神",
    "trigger": "能成功說服對方的關鍵突破點",
    "framework": [
      { "name": "第一步的名稱", "cue": "第一步的指導語" },
      { "name": "第二步的名稱", "cue": "第二步的指導語" }
    ]
  }
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "你是一個專業的遊戲設計師，請務必只輸出純 JSON 格式的字串，不要包含任何額外的說明。" 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: MODEL_NAME,
      temperature: 0.6, // 推理模型建議溫度稍微調低一點，讓 JSON 結構更穩定
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Failed to get content from Groq.");

    // 使用清洗工具過濾資料
    const cleanedText = stripReasoning(text);
    const json = JSON.parse(cleanedText) as Level;
    json.id = 999;
    return json;
    
  } catch (e: any) {
    console.error("Groq Custom Framework Error:", e);
    if (e?.status === 429) {
      throw new Error('Groq API 額度已耗盡 (Rate Limit Exceeded)。免費額度每分鐘上限為 12,000 Tokens，請稍等一分鐘後再試。');
    }
    throw new Error(`生成失敗: ${e?.message || '未知錯誤'}`);
  }
}

export async function evaluatePuzzleSpeech(level: Level, transcript: string): Promise<PuzzleEvaluation> {
  const groq = getGroqClient();
  
  const relevantClues = level.clues.filter(c => c.isRelevant).map(c => `- ${c.text}`).join('\n');
  const irrelevantClues = level.clues.filter(c => !c.isRelevant).map(c => `- ${c.text}`).join('\n');
  
  const prompt = `你是一個結合了「沉浸式 RPG NPC」與「專業口語表達教練」的 AI。
玩家正在遊玩一款「發聲解謎」的文字冒險遊戲。請嚴格評估玩家的口說轉換文字。

【當前關卡】：${level.title}
【情境背景】：${level.scenario}
【玩家的目標】：${level.objective}

【玩家應使用的關鍵線索】：
${relevantClues}

【玩家應避開的干擾線索】：
${irrelevantClues}

【玩家對 NPC 說出的話】：
「${transcript}」

請依據玩家的「邏輯結構」、「線索統整與過濾能力」、「說服力」、「語意流暢度」來評分。

請以 JSON 格式回傳，包含以下屬性：
- passed (boolean): 是否說服成功
- score (number): 綜合表現 (0-100)
- structureScore (number): 邏輯結構與線索利用分數 (0-50)
- fluencyScore (number): 表達流暢度分數 (0-50)
- npcResponse (string): 以該情境中 NPC (${level.npcName}) 的口吻，對玩家的話做出沉浸式回應。
- coachFeedback (array of strings): 作為口語教練，給出 2-4 點具體表達建議。
- rewritten (string): 教練示範：如果是我，我會怎麼用更有邏輯來精鍊這段這段話？`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "你是一個專業的口語表達教練與 RPG NPC。請先在腦中思考，思考完畢後務必只輸出純 JSON 格式的字串。" 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: MODEL_NAME,
      temperature: 0.6,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Failed to get content from Groq.");

    // 使用清洗工具過濾資料
    const cleanedText = stripReasoning(text);
    return JSON.parse(cleanedText) as PuzzleEvaluation;
    
  } catch (e: any) {
    console.error("Groq Evaluation Error:", e);
    if (e?.status === 429) {
      throw new Error('Groq API 額度已耗盡 (Rate Limit Exceeded)。免費額度每分鐘上限為 12,000 Tokens，請稍等一分鐘後再試。');
    }
    throw new Error(`評估失敗: ${e?.message || '未知錯誤'}`);
  }
}