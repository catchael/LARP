// ═══════════════════════════════════════════════════════════
// 結局劇本（act 結構）
// 把 endingNarrations 包成可被 ActScreen 播放的 Act
// ═══════════════════════════════════════════════════════════

import { Act, buildBeats } from './actScripts';
import {
  ENDING_NARRATION_ASSISTANT,
  ENDING_NARRATION_CAPTAIN,
  ENDING_NARRATION_GUARD,
  ENDING_NARRATION_SCAVENGER,
  ENDING_NARRATION_TIE,

  ENDING_NARRATION_YIN,
  ENDING_NARRATION_ZHANG,
  ENDING_NARRATION_PARK,
  ENDING_NARRATION_HA,
  ENDING_NARRATION_S2_TIE,
} from './endingNarrations';

const ENDING_BG = 'linear-gradient(160deg, #0a0a0f 0%, #14111a 50%, #1a0d0d 100%)';

const lastBeatLabel = (n: number) => (id: string, idx: number) =>
  idx === n - 1 ? '結束' : '繼續';

export const ENDING_ACT_ASSISTANT: Act = {
  id: 'ending_assistant',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_ASSISTANT,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_ASSISTANT.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_CAPTAIN: Act = {
  id: 'ending_captain',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_CAPTAIN,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_CAPTAIN.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_GUARD: Act = {
  id: 'ending_guard',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_GUARD,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_GUARD.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_SCAVENGER: Act = {
  id: 'ending_scavenger',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_SCAVENGER,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_SCAVENGER.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_TIE: Act = {
  id: 'ending_tie',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_TIE,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_TIE.length),
    dialogueAfter: {},
  }),
};


// ─── 第二個劇本結局設定 ────────────────────────────────────

export const ENDING_ACT_YIN: Act = {
  id: 'ending_s2_yin',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_YIN,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_YIN.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_ZHANG: Act = {
  id: 'ending_s2_zhang',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_ZHANG,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_ZHANG.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_PARK: Act = {
  id: 'ending_s2_park',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_PARK,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_PARK.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_HA: Act = {
  id: 'ending_s2_ha',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_HA,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_HA.length),
    dialogueAfter: {},
  }),
};

export const ENDING_ACT_S2_TIE: Act = {
  id: 'ending_s2_tie',
  title: '結局',
  backgroundImage: ENDING_BG,
  beats: buildBeats({
    narrations: ENDING_NARRATION_S2_TIE,
    pauseAfterEach: false,
    pauseLabel: lastBeatLabel(ENDING_NARRATION_S2_TIE.length),
    dialogueAfter: {},
  }),
};


// ─── 結局註冊表 ─────────────────────────────────────────
export const ENDING_REGISTRY: Record<string, Act> = {
  // ── 第一個劇本的結局 ──
  [ENDING_ACT_ASSISTANT.id]: ENDING_ACT_ASSISTANT,
  [ENDING_ACT_CAPTAIN.id]: ENDING_ACT_CAPTAIN,
  [ENDING_ACT_GUARD.id]: ENDING_ACT_GUARD,
  [ENDING_ACT_SCAVENGER.id]: ENDING_ACT_SCAVENGER,
  [ENDING_ACT_TIE.id]: ENDING_ACT_TIE,

  // ── 🌟 新增：第二個劇本的結局 ──
  [ENDING_ACT_YIN.id]: ENDING_ACT_YIN,
  [ENDING_ACT_ZHANG.id]: ENDING_ACT_ZHANG,
  [ENDING_ACT_PARK.id]: ENDING_ACT_PARK,
  [ENDING_ACT_HA.id]: ENDING_ACT_HA,
  [ENDING_ACT_S2_TIE.id]: ENDING_ACT_S2_TIE,
};

// ─── 🌟 升級：依據劇本 ID 分類的對照表 ────────────────────────────
export const CHARACTER_TO_ENDING_ID: Record<number, Record<string, string>> = {
  // 第一個劇本的結局對應
  1: {
    '節目助理': 'ending_assistant',
    '李隊長': 'ending_captain',
    '張警衛': 'ending_guard',
    '拾荒者': 'ending_scavenger',
  },
  // 🌟 第二個劇本的結局對應 (請填入你劇本的真實角色與結局 ID)
  2: {
    '角色A': 'ending_s2_char_a',
    '角色B': 'ending_s2_char_b',
    // ...
  }
};

// 🌟 升級：依據劇本 ID 定義真兇
export const TRUE_KILLERS: Record<number, string> = {
  1: '張警衛',
  2: '尹夫人',
};

// 🌟 將單一平局 ID 改為依劇本 ID 對應的字典
export const TIE_ENDING_IDS: Record<number, string> = {
  1: 'ending_tie',
  2: 'ending_s2_tie',
};

// 🌟 真兇角色名（用來判斷真相大白要明亮還是灰暗）
export const TRUE_KILLER_NAME = '張警衛';

export const TIE_ENDING_ID = 'ending_tie';