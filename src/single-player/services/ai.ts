import { GoogleGenAI, Type } from "@google/genai";
import { Level } from "../lib/levels";

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable. If using AI Studio, check your secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  }
  return aiClient;
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

export async function generateCustomFramework(userPrompt: string): Promise<Level> {
  const ai = getAIClient();
  
  const prompt = `你是一個世界頂尖的溝通專家與遊戲設計師。
使用者遇到了一個真實的溝通挑戰，請你幫他設計一套專屬的「發言結構（溝通框架）」，並把這個挑戰包裝成遊戲的一個關卡讓他練習。

使用者的溝通挑戰：
「${userPrompt}」

請以 JSON 格式回傳一個符合下列結構的物件。
如果其中有任何文字錯誤（例如『大史』應該是『大使』），請放在 corrections 中。

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
    // 請產生 4 到 5 個線索，必須包含相關(true)與不相關(false)的干擾線索
  ],
  "support": {
    "strategy": "你為他發明的專屬發言框架名稱 (例如：同理心談判法 S.A.F.E)",
    "description": "這個框架的應用情境與精神",
    "trigger": "能成功說服對方的關鍵突破點",
    "framework": [
      { "name": "第一步的名稱 (例如: S - 同理)", "cue": "第一步的指導語" },
      { "name": "第二步的名稱", "cue": "第二步的指導語" }
      // 設計 3 到 5 步的發言框架
    ]
  }
}`;

  let lastError: any;
  const modelsToTry = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-1.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName, 
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Failed to get content from Gemini.");
      }

      // Strip markdown formatting if any
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();

      const json = JSON.parse(cleanedText) as Level;
      json.id = 999;
      return json;
    } catch (e: any) {
      console.warn(`Model ${modelName} failed for Custom Framework:`, e?.message || e);
      lastError = e;
    }
  }

  // If all models fail, determine if it's a hard quota error
  if (lastError?.message && lastError.message.includes('quota')) {
    throw new Error('伺服器 API 額度已耗盡 (Quota Exceeded)。這可能是因為測試次數過多，觸發了免費額度的上限。請稍後再試或是明日重置額度。');
  }

  throw lastError || new Error("Failed to generate custom framework after trying multiple models.");
}

export async function evaluatePuzzleSpeech(level: Level, transcript: string): Promise<PuzzleEvaluation> {
  const ai = getAIClient();
  
  const relevantClues = level.clues.filter(c => c.isRelevant).map(c => `- ${c.text}`).join('\n');
  const irrelevantClues = level.clues.filter(c => !c.isRelevant).map(c => `- ${c.text}`).join('\n');
  
  const prompt = `你是一個結合了「沉浸式 RPG NPC」與「專業口語表達教練」的 AI。
玩家正在遊玩一款「發聲解謎」的文字冒險遊戲。請嚴格評估玩家的口說轉換文字。

【當前關卡】：${level.title}
【情境背景】：${level.scenario}
【玩家的目標】：${level.objective}

【玩家應使用的關鍵線索】（必須善用這些來達成目標）：
${relevantClues}

【玩家應避開的干擾線索/紅鯡魚】（若玩家使用了這些無關資訊，代表邏輯誤判與失焦）：
${irrelevantClues}

【玩家對 NPC 說出的話】（可能包含語音辨識的些微誤差，請包容）：
「${transcript}」

請依據玩家的「邏輯結構」、「線索統整與過濾能力」、「說服力」、「語意流暢度」來評分。
1. 玩家是否達成了目標？如果邏輯說得通、結構成理、善用【關鍵線索】且並未被【干擾線索】嚴重偏移焦點，就能通過 (passed: true)。
2. 若內容空洞、邏輯不通、或是把【干擾線索】當成主要論點導致情境變得荒謬，則判定失敗 (passed: false)。

請以 JSON 格式回傳，包含以下屬性：
- passed (boolean): 是否說服成功/達成目標
- score (number): 綜合表現 (0-100)。若誤用干擾線索，請扣分。
- structureScore (number): 邏輯結構與線索利用、過濾能力分數 (0-50)
- fluencyScore (number): 表達流暢度分數 (0-50)
- npcResponse (string): 以該情境中 NPC (${level.npcName}) 的口吻，對玩家的話做出沉浸式回應。若玩家提到無關的干擾線索，NPC 也必須在台詞中對此表達疑惑或嘲諷。若成功，NPC 會妥協或讚賞並推進劇情。
- coachFeedback (array of strings): 作為口語教練，給出 2-4 點具體表達建議。必須點出玩家是否成功避開干擾線索、或是不幸被誤導，以及邏輯是否清晰。
- rewritten (string): 教練示範：如果是我，我會怎麼用更有邏輯、排除無效資訊的說服結構來精鍊這段這段話？`;

  let lastError: any;
  const modelsToTry = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-1.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName, 
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passed: { type: Type.BOOLEAN, description: "是否過關" },
              score: { type: Type.INTEGER, description: "總分 (0-100)" },
              structureScore: { type: Type.INTEGER, description: "邏輯/結構分數 (0-50)" },
              fluencyScore: { type: Type.INTEGER, description: "流暢度分數 (0-50)" },
              npcResponse: { type: Type.STRING, description: "NPC 第一人稱的回應，沉浸式對話" },
              coachFeedback: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "教練專業點評，2-4點"
              },
              rewritten: { type: Type.STRING, description: "完美示範講稿" }
            },
            required: ["passed", "score", "structureScore", "fluencyScore", "npcResponse", "coachFeedback", "rewritten"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Failed to get content from Gemini.");
      }

      // Strip markdown formatting if any
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();

      return JSON.parse(cleanedText) as PuzzleEvaluation;
    } catch (e: any) {
      console.warn(`Model ${modelName} failed:`, e?.message || e);
      lastError = e;
      
      // If it's a quota error, we keep trying the next model in the fallback list.
      // If it is NOT a quota error, we might still throw or retry, but let's retry for resilience.
    }
  }

  // If all models fail, determine if it's a hard quota error
  if (lastError?.message && lastError.message.includes('quota')) {
    throw new Error('伺服器 API 額度已耗盡 (Quota Exceeded)。這可能是因為測試次數過多，觸發了免費額度的上限。請稍後再試或是明日重置額度。');
  }

  throw lastError || new Error("Failed to generate response after trying multiple models.");
}
