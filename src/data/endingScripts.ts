// ═══════════════════════════════════════════════════════════
// endingScripts.ts — 結算邏輯與結局註冊
// ═══════════════════════════════════════════════════════════

import { Act, buildBeats } from './actScripts';
import {
  ENDING_NARRATION_ASSISTANT,
  ENDING_NARRATION_CAPTAIN,
  ENDING_NARRATION_GUARD,
  ENDING_NARRATION_SCAVENGER,
  ENDING_NARRATION_TIE,
  ENDING_SCRIPT2_MADAM,
  ENDING_SCRIPT2_GUARD,
  ENDING_SCRIPT2_COP,
  ENDING_SCRIPT2_CEO,
  ENDING_NARRATION_S2_TIE,
} from './endingNarrations';

const ENDING_BG = 'linear-gradient(160deg, #0a0a0f 0%, #14111a 50%, #1a0d0d 100%)';

const lastBeatLabel = (n: number) => (id: string, idx: number) =>
  idx === n - 1 ? '結束' : '繼續';

// ─── 劇本 1 結局實體 ──────────────────────────────────────

export const ENDING_ACT_ASSISTANT: Act = {
  id: 'ending_assistant',
  title: '結局一:泣血的獵刀',
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
  title: '結局二:未曾想過的結局',
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
  title: '結局三:遲來十年的曙光',
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
  title: '結局四:深淵的嘲笑',
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

// ─── 劇本 2 結局實體 ──────────────────────────────────────

export const ACT_SCRIPT2_ENDING_MADAM: Act = {
  id: 'script2_ending_madam',
  title: '結局一：破曉的微光（真結局）',
  backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
  beats: buildBeats({ narrations: ENDING_SCRIPT2_MADAM, pauseAfterEach: true }),
};

export const ACT_SCRIPT2_ENDING_GUARD: Act = {
  id: 'script2_ending_guard',
  title: '結局二：致命的巧合（壞結局）',
  backgroundImage: 'linear-gradient(135deg, #451a03 0%, #000000 100%)',
  beats: buildBeats({ narrations: ENDING_SCRIPT2_GUARD, pauseAfterEach: true }),
};

export const ACT_SCRIPT2_ENDING_COP: Act = {
  id: 'script2_ending_cop',
  title: '結局三：黑傘下的共犯（暗黑結局）',
  backgroundImage: 'linear-gradient(135deg, #312e81 0%, #020617 100%)',
  beats: buildBeats({ narrations: ENDING_SCRIPT2_COP, pauseAfterEach: true }),
};

export const ACT_SCRIPT2_ENDING_CEO: Act = {
  id: 'script2_ending_ceo',
  title: '結局四：荒謬的祭品（悲慘結局）',
  backgroundImage: 'linear-gradient(135deg, #7f1d1d 0%, #000000 100%)',
  beats: buildBeats({ narrations: ENDING_SCRIPT2_CEO, pauseAfterEach: true }),
};

// 🌟 劇本 2 平票結局
export const ACT_SCRIPT2_ENDING_TIE: Act = {
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

// ═══════════════════════════════════════════════════════════
// 結算與對照邏輯 (App.tsx 會引用此處判斷勝負)
// ═══════════════════════════════════════════════════════════

// 🌟 真兇定義：用於判斷 game_ending 顯示「恭喜」或「失敗」
export const TRUE_KILLERS: Record<number, string> = {
  1: '張警衛',
  2: '尹夫人',
};

// 🌟 結局對照表：根據公投最高票決定播哪個 Act
export const CHARACTER_TO_ENDING_ID: Record<number, Record<string, string>> = {
  1: {
    '節目助理': 'ending_assistant',
    '李隊長': 'ending_captain',
    '張警衛': 'ending_guard',
    '拾荒者': 'ending_scavenger',
  },
  2: {
    '尹夫人': 'script2_ending_madam',
    '老張': 'script2_ending_guard',
    '朴警官': 'script2_ending_cop',
    '河總': 'script2_ending_ceo',
  }
};

// 🌟 平票預設結局[cite: 3]
export const TIE_ENDING_IDS: Record<number, string> = {
  1: 'ending_tie',
  2: 'ending_s2_tie',
};

// ─── 結局註冊表 ─────────────────────────────────────────
export const ENDING_REGISTRY: Record<string, Act> = {
  [ENDING_ACT_ASSISTANT.id]: ENDING_ACT_ASSISTANT,
  [ENDING_ACT_CAPTAIN.id]: ENDING_ACT_CAPTAIN,
  [ENDING_ACT_GUARD.id]: ENDING_ACT_GUARD,
  [ENDING_ACT_SCAVENGER.id]: ENDING_ACT_SCAVENGER,
  [ENDING_ACT_TIE.id]: ENDING_ACT_TIE,
  [ACT_SCRIPT2_ENDING_MADAM.id]: ACT_SCRIPT2_ENDING_MADAM,
  [ACT_SCRIPT2_ENDING_GUARD.id]: ACT_SCRIPT2_ENDING_GUARD,
  [ACT_SCRIPT2_ENDING_COP.id]: ACT_SCRIPT2_ENDING_COP,
  [ACT_SCRIPT2_ENDING_CEO.id]: ACT_SCRIPT2_ENDING_CEO,
  [ACT_SCRIPT2_ENDING_TIE.id]: ACT_SCRIPT2_ENDING_TIE,
};