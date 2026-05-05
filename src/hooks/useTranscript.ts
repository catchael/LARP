// ═══════════════════════════════════════════════════════════
// useTranscript
// ─────────────────────────────────────────────────────────────
// 集中管理跨輪次的 transcript：
//   · entries：所有 ASR final 結果，含 round / startTimestamp / phase
//   · ordered：依 startTimestamp 排好的版本（解決上傳完成順序 ≠ 說話順序）
//   · phase 區分：'turn' 輪流發言 / 'free' 自由討論
//
// 對外暴露（拿來打包送 /analyse 時用）：
//   · turnsByRoundForCharacter(round, character)
//       → 該玩家在該 round 的「輪流發言」內容（給 P_JUDGE 評估的素材）
//   · fullDialogueByRound(round)
//       → 該 round 全部對話（包含 free + turn，所有人）
//       → 給 P0_CONTEXT_SUMMARY 用，讓 context 涵蓋自由討論說過的事
//
// 為什麼要分 phase：
//   自由討論的發言多半破碎、互相打斷、半句話 — 不適合單獨拿來評估
//   但裡面提到的事實（「我剛剛在廚房看到血跡」）是後續輪流發言的 context
//   所以「自由討論進 context、不進評估」是最佳組合
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';

export type TranscriptPhase = 'turn' | 'free';

export interface TranscriptEntry {
  round: number;
  line: string;             // 完整 "speaker：text" 格式
  startTimestamp: number;   // MediaRecorder.start() 當下的 Date.now()
  phase: TranscriptPhase;
}

export interface UseTranscriptReturn {
  entries: TranscriptEntry[];
  ordered: TranscriptEntry[];
  append: (entry: TranscriptEntry) => void;
  turnsByRoundForCharacter: (round: number, character: string) => string[];
  fullDialogueByRound: (round: number) => Array<{ speaker: string; text: string }>;
  reset: () => void;
}

const splitSpeaker = (line: string): { speaker: string; text: string } => {
  const idx = line.indexOf('：');
  if (idx < 0) return { speaker: '', text: line };
  return {
    speaker: line.slice(0, idx),
    text: line.slice(idx + 1).trim(),
  };
};

export function useTranscript(): UseTranscriptReturn {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  // 永遠用 startTimestamp 排序，避免「網路慢的人後到」造成順序錯亂
  const ordered = useMemo(() => {
    return [...entries].sort((a, b) => a.startTimestamp - b.startTimestamp);
  }, [entries]);

  const append = useCallback((entry: TranscriptEntry) => {
    // 防呆：同一筆（同 speaker + 同 timestamp）不重複加（Socket 廣播可能觸發兩次）
    setEntries(prev => {
      if (prev.some(e =>
        e.startTimestamp === entry.startTimestamp &&
        e.line === entry.line
      )) {
        return prev;
      }
      return [...prev, entry];
    });
  }, []);

  // 給 P_JUDGE 評估用：只取「輪流發言」階段、只取該角色的發言
  const turnsByRoundForCharacter = useCallback(
    (round: number, character: string): string[] => {
      const prefix = `${character}：`;
      return ordered
        .filter(e => e.round === round && e.phase === 'turn')
        .filter(e => e.line.startsWith(prefix))
        .map(e => e.line.slice(prefix.length).trim());
    },
    [ordered]
  );

  // 給 P0_CONTEXT_SUMMARY 用：該輪全部對話（含自由討論），所有人
  const fullDialogueByRound = useCallback(
    (round: number): Array<{ speaker: string; text: string }> => {
      return ordered
        .filter(e => e.round === round)
        .map(e => splitSpeaker(e.line))
        .filter(d => d.speaker && d.text);
    },
    [ordered]
  );

  const reset = useCallback(() => setEntries([]), []);

  return {
    entries,
    ordered,
    append,
    turnsByRoundForCharacter,
    fullDialogueByRound,
    reset,
  };
}