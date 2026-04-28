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

// ─── 結局註冊表 ─────────────────────────────────────────
export const ENDING_REGISTRY: Record<string, Act> = {
  [ENDING_ACT_ASSISTANT.id]: ENDING_ACT_ASSISTANT,
  [ENDING_ACT_CAPTAIN.id]: ENDING_ACT_CAPTAIN,
  [ENDING_ACT_GUARD.id]: ENDING_ACT_GUARD,
  [ENDING_ACT_SCAVENGER.id]: ENDING_ACT_SCAVENGER,
  [ENDING_ACT_TIE.id]: ENDING_ACT_TIE,
};

// ─── 角色名稱 → 結局 ID 對照表 ────────────────────────────
export const CHARACTER_TO_ENDING_ID: Record<string, string> = {
  '節目助理': 'ending_assistant',
  '李隊長': 'ending_captain',
  '張警衛': 'ending_guard',
  '拾荒者': 'ending_scavenger',
};

// 🌟 真兇角色名（用來判斷真相大白要明亮還是灰暗）
export const TRUE_KILLER_NAME = '張警衛';

export const TIE_ENDING_ID = 'ending_tie';