// ═══════════════════════════════════════════════════════════
// 幕（Act）結構定義
// ‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐‐
// 本檔負責「幕」的演出順序，將：
//   1. 旁白段落（從 narrations.ts 引用）
//   2. 玩家對話（player_dialogue）
//   3. 等待繼續（pause）
// 三種 Beat 串成一條時間軸。
//
// 編劇要編排「哪段內文後面要插玩家對話」、「哪邊停下來等繼續」
// 就只動這個檔案；如果只是改文字，請去 narrations.ts。
// ═══════════════════════════════════════════════════════════

import {
  NarrationParagraph,
  NARRATIONS_SCRIPT1_PROLOGUE,
  NARRATIONS_SCRIPT1_ACT2,
} from './narrations';

// ─── Beat 類型 ─────────────────────────────────────────────

export type BeatType = 'narration' | 'player_dialogue' | 'pause';

/** 旁白：把 narrations.ts 的一個段落顯示出來 */
export interface NarrationBeat {
  type: 'narration';
  id: string;
  text: string;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

/** 玩家對話：等待指定角色開麥（或按繼續） */
export interface PlayerDialogueBeat {
  type: 'player_dialogue';
  id: string;
  /** 哪個角色說話（對應 previewScript.characters[*].name） */
  characterName: string;
  /** 麥克風無法使用時，「繼續鍵」要顯示的預設台詞 */
  defaultLine: string;
  /** 等候時的提示（可選，例如「請以 XX 的身分回應」） */
  prompt?: string;
  /** 多久沒開麥就顯示「繼續鍵」（毫秒，預設 8000） */
  micFallbackDelay?: number;
}

/** 暫停：所有人等待主持人按「繼續」 */
export interface PauseBeat {
  type: 'pause';
  id: string;
  buttonLabel?: string;
}

export type Beat = NarrationBeat | PlayerDialogueBeat | PauseBeat;

export interface Act {
  id: string;
  title: string;
  /** 背景圖或 CSS 漸層 */
  backgroundImage?: string;
  /** 背景音樂 URL（可選） */
  bgm?: string;
  beats: Beat[];
}

// ─── 工具：把 narrations 轉成 NarrationBeat ───────────────

function toNarrationBeat(p: NarrationParagraph): NarrationBeat {
  return {
    type: 'narration',
    id: p.id,
    text: p.text,
    autoAdvance: p.autoAdvance,
    autoAdvanceDelay: p.autoAdvanceDelay,
  };
}


export function buildBeats(opts: {
  narrations: NarrationParagraph[];
  /** 每段 narration 後面是否自動加一個 pause，預設 true */
  pauseAfterEach?: boolean;
  /** 客製每段 pause 的按鈕文字 */
  pauseLabel?: (narrationId: string, idx: number) => string;
  /** 在某個 narration id 之後要塞入的玩家對話列（不含 type/id 由本函式補） */
  dialogueAfter?: Record<string, Array<Omit<PlayerDialogueBeat, 'type' | 'id'>>>;
}): Beat[] {
  const {
    narrations,
    pauseAfterEach = true,
    pauseLabel,
    dialogueAfter = {},
  } = opts;

  const beats: Beat[] = [];

  narrations.forEach((p, idx) => {
    // 1. 旁白本身
    beats.push(toNarrationBeat(p));

    // 2. 該段後要插的玩家對話
    const inserts = dialogueAfter[p.id] ?? [];
    inserts.forEach((d, i) => {
      beats.push({
        type: 'player_dialogue',
        id: `${p.id}_d${i + 1}`,
        ...d,
      });
    });

    // 3. 暫停（除非該段是 autoAdvance）
    if (pauseAfterEach && !p.autoAdvance) {
      beats.push({
        type: 'pause',
        id: `${p.id}_pause`,
        buttonLabel: pauseLabel ? pauseLabel(p.id, idx) : '繼續',
      });
    }
  });

  return beats;
}

// ═══════════════════════════════════════════════════════════
// 劇本 1：新亭洞連環殺人魔
// ═══════════════════════════════════════════════════════════

// ── 序章：純旁白 + 每段一個繼續鍵，最後一段是「進入角色選擇」 ──
export const ACT_SCRIPT_1_PROLOGUE: Act = {
  id: 'script1_prologue',
  title: '序章',
  backgroundImage: 'linear-gradient(160deg, #0a0a0f 0%, #0d1117 40%, #111827 100%)',
  beats: buildBeats({
    narrations: NARRATIONS_SCRIPT1_PROLOGUE,
    pauseAfterEach: false,
    pauseLabel: (id) => (id === 'n7' ? '進入角色選擇' : '繼續'),
    // 序章沒有玩家對話
    dialogueAfter: {},
  }),
};

// ── 第二幕：密室與屍體 ────────────────────────
export const ACT_SCRIPT_1_ACT2: Act = {
  id: 'script1_act2',
  title: '第二幕：密室與屍體',
  backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  beats: buildBeats({
    narrations: NARRATIONS_SCRIPT1_ACT2,
    pauseAfterEach: false,
    // 最後一段講完時，按鈕文字變成「開始搜查」
    pauseLabel: (id) => (id === 'n7' ? '開始搜查' : '繼續'), 
    dialogueAfter: {
      // 🌟 在第一段旁白 (n1) 之後，插入三人的短暫交談
      n1_2: [
        {
          characterName: '節目助理', 
          defaultLine: '嗯？ 張叔，還有這位是...李隊長？，你們怎麼都在這裡？',
          prompt: '【請開麥發言】困惑地詢問另外兩人來這裡的目的，記住別洩漏自己的秘密。',
          micFallbackDelay: 8000,
        },
        {
          characterName: '李隊長',
          defaultLine: '我收到了製作人的簡訊，他跟我說在這裡等他，但沒有跟我說還有哪些人。你們也是在等崔製作人嗎？',
          prompt: '【請開麥發言】解釋自己為什麼要來這裡，想辦法在藏住目的的情況下證明自己是被邀請的。',
          micFallbackDelay: 8000,
        },
        {
          characterName: '張警衛',
          defaultLine: '對，我也是收到通知，製作人讓我幫忙搬器材過來，說是怕人手不足。',
          prompt: '【請開麥發言】解釋自己為什麼要來這裡，記得假裝自己剛到，可以拿出證據。',
          micFallbackDelay: 8000,
        }
      ],
      // 🌟 在第四段旁白 (n4) 之後，插入拾荒者的驚恐發言
      n4_2: [
        {
          characterName: '拾荒者',
          defaultLine: '別開槍！我只是剛進來躲雨，順便看看有甚麼好東西。你們都聚在這裡做什麼啊？',
          prompt: '【請開麥發言】解釋你的來意，別讓他們把你當成兇手！',
          micFallbackDelay: 8000,
        }
      ]
    },
  })
};

// ═══════════════════════════════════════════════════════════
// 劇本 2、3...（預留）
// ═══════════════════════════════════════════════════════════
// export const ACT_SCRIPT_2_PROLOGUE: Act = { ... };

// ─── 統一匯出索引 ─────────────────────────────────────────

export const ACT_REGISTRY: Record<string, Act> = {
  [ACT_SCRIPT_1_PROLOGUE.id]: ACT_SCRIPT_1_PROLOGUE, // 'script1_prologue'
  [ACT_SCRIPT_1_ACT2.id]: ACT_SCRIPT_1_ACT2,         // 'script1_act2'
};