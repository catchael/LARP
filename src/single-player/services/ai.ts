import Groq from "groq-sdk";
import { Level } from "../lib/levels";

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      throw new Error("Missing VITE_GROQ_API_KEY environment variable. 請檢查 .env 檔案。");
    }
    // 直接用 Groq 官方的伺服器
    groqClient = new Groq({ 
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true 
    });
  }
  return groqClient;
}

// 🌟 導出型別，解決 SinglePlayerApp.tsx 的找不到模組錯誤
export interface PuzzleEvaluation {
  passed: boolean;
  score: number;
  structureScore: number;
  fluencyScore: number;
  npcResponse: string;
  coachFeedback: string[];
  rewritten: string;
}

// 🌟 直接指定 Groq 官方支援的 Qwen 模型
const MODEL_NAME = "qwen/qwen3-32b";

// 🌟 補回 JSON 清洗工具，避免 JSON.parse 報錯
function stripReasoning(text: string): string {
  let cleaned = text.replace(/<think[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/```json\n?|```/g, '');
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
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Failed to get content from Groq.");

    const cleanedText = stripReasoning(text);
    const json = JSON.parse(cleanedText) as Level;
    json.id = 999;
    return json;
    
  } catch (e: any) {
    console.error("Custom Framework Error:", e);
    throw new Error(`生成失敗: ${e?.message || '未知錯誤'}`);
  }
}

export async function evaluatePuzzleSpeech(level: Level, transcript: string): Promise<PuzzleEvaluation> {
  const groq = getGroqClient();
  
  const relevantClues = level.clues.filter(c => c.isRelevant).map(c => `- ${c.text}`).join('\n');
  const irrelevantClues = level.clues.filter(c => !c.isRelevant).map(c => `- ${c.text}`).join('\n');
  
  const prompt = `你是一個結合了「沉浸式 RPG NPC」與「專業口語表達教練」的 AI。
玩家正在遊玩一款「發聲解謎」的文字冒險遊戲。請評估玩家的口說轉換文字。

【當前關卡】：${level.title}
【情境背景】：${level.scenario}
【玩家的目標】：${level.objective}

【玩家應使用的關鍵線索】：
${relevantClues}

【玩家應避開的干擾線索】：
${irrelevantClues}

【玩家對 NPC 說出的話】：
「${transcript}」

請依據玩家的發言來評分。⚠️【注意：本遊戲目前為寬鬆鼓勵模式，請大幅降低過關門檻】⚠️：
1. 過關判定 (passed)：只要玩家「有嘗試針對目標發言」，且「提到至少一個關鍵線索」，就算邏輯稍微跳躍、語句不通順、或是語音辨識有錯字，都請判定成功 (passed: true)。
2. 干擾線索的寬容：即使玩家不小心提到干擾線索，只要不是完全偏題，依然可以讓他們過關，NPC 可以稍微吐槽，但還是要推進劇情。
3. 失敗判定：只有在玩家「完全沒有講話」、「發言內容與情境 100% 無關」或「徹底胡言亂語」時，才判定失敗 (passed: false)。

請以 JSON 格式回傳，包含以下屬性：
- passed (boolean): 是否說服成功 (請從寬認定)
- score (number): 綜合表現 (0-100，給分請甜一點，過關基礎分至少 60)
- structureScore (number): 邏輯結構與線索利用分數 (0-50)
- fluencyScore (number): 表達流暢度分數 (0-50)
- npcResponse (string): 以該情境中 NPC (${level.npcName}) 的口吻，對玩家的話做出沉浸式回應。
- coachFeedback (array of strings): 作為口語教練，給出 2-4 點具體表達建議。多給鼓勵，溫和地點出可以更好的地方。
- rewritten (string): 教練示範：如果是我，我會怎麼精鍊這段話？`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "你是一個專業的口語表達教練與 RPG NPC。請務必只輸出純 JSON 格式的字串。" 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: MODEL_NAME,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Failed to get content from Groq.");

    const cleanedText = stripReasoning(text);
    return JSON.parse(cleanedText) as PuzzleEvaluation;
    
  } catch (e: any) {
    console.error("Evaluation Error:", e);
    throw new Error(`評估失敗: ${e?.message || '未知錯誤'}`);
  }
}