// ═══════════════════════════════════════════════════════════
// useSubtitles
// ─────────────────────────────────────────────────────────────
// 把字幕拆成兩個獨立 state 防止 race condition：
//   · finalSubtitles：ASR 上傳完成的最終文字（只 append、永不覆蓋）
//   · liveCaptions：每個說話者「正在說」的即時字幕（key=speaker）
//
// 對外暴露：
//   · displaySubtitles：合併後的顯示用陣列（render 用這個）
//   · appendFinal(line)：ASR 完成時呼叫，會自動清掉該 speaker 的 live 行
//   · updateLive(speaker, text)：Web Speech / 遠端 socket interim 用
//   · clearLive(speaker)：手動清掉某 speaker 的 live 行
//   · reset(initial?)：兩個 state 一起清
//
// 為什麼這樣設計：原本 setSubtitles 同時被「append-only」與「覆蓋最後一行」
// 兩種寫入者搶寫，特定時序下後者會覆蓋掉前者剛加進去的 ASR 結果。
// 拆兩個 state 後，物理上不可能互相覆蓋。
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';

export interface UseSubtitlesReturn {
  displaySubtitles: string[];
  finalSubtitles: string[];
  liveCaptions: Record<string, string>;
  appendFinal: (line: string) => void;
  updateLive: (speaker: string, text: string) => void;
  clearLive: (speaker: string) => void;
  reset: (initial?: string[]) => void;
}

export function useSubtitles(initial: string[] = []): UseSubtitlesReturn {
  const [finalSubtitles, setFinalSubtitles] = useState<string[]>(initial);
  const [liveCaptions, setLiveCaptions] = useState<Record<string, string>>({});

  // render 用的合併陣列：先 final，後面附上每位說話者的 live 行
  const displaySubtitles = useMemo(() => {
    const live = Object.entries(liveCaptions)
      .filter(([_, t]) => t && t.trim())
      .map(([speaker, text]) => `${speaker}：${text}`);
    return [...finalSubtitles, ...live].slice(-50); // 上限 50，跟原邏輯保持一致
  }, [finalSubtitles, liveCaptions]);

  // ASR 完成 → append final 並清掉自己的 live
  const appendFinal = useCallback((line: string) => {
    setFinalSubtitles(prev => [...prev, line]);
    const speaker = line.split('：')[0];
    if (speaker) {
      setLiveCaptions(prev => {
        if (!(speaker in prev)) return prev;
        const next = { ...prev };
        delete next[speaker];
        return next;
      });
    }
  }, []);

  // Web Speech / 遠端 interim → 覆蓋自己那一行
  const updateLive = useCallback((speaker: string, text: string) => {
    if (!speaker) return;
    setLiveCaptions(prev => ({ ...prev, [speaker]: text }));
  }, []);

  const clearLive = useCallback((speaker: string) => {
    setLiveCaptions(prev => {
      if (!(speaker in prev)) return prev;
      const next = { ...prev };
      delete next[speaker];
      return next;
    });
  }, []);

  const reset = useCallback((initialArr: string[] = []) => {
    setFinalSubtitles(initialArr);
    setLiveCaptions({});
  }, []);

  return {
    displaySubtitles,
    finalSubtitles,
    liveCaptions,
    appendFinal,
    updateLive,
    clearLive,
    reset,
  };
}