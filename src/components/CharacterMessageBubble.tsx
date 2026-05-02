import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchMessage } from '../data/searchMessages';

interface CharacterMessageBubbleProps {
  /** 角色頭像 URL */
  avatar?: string;
  /** 角色名稱（顯示在頭像旁） */
  characterName: string;
  /** 要播放的訊息陣列；空陣列則整個 component 不顯示 */
  messages: SearchMessage[];
  /**
   * 重播 key — 此 key 改變時會重新從頭播放動畫。
   * 建議傳入 `${scriptId}_${round}_${characterName}` 之類的組合。
   */
  autoPlayKey?: string;
  /** 動畫間隔（毫秒），預設 1500 */
  intervalMs?: number;
  /** 全部顯示完之後等多久收合（毫秒），預設 5000 */
  collapseAfterMs?: number;
}

type Phase = 'hidden' | 'avatar_only' | 'showing' | 'all_shown' | 'collapsed';

export const CharacterMessageBubble: React.FC<CharacterMessageBubbleProps> = ({
  avatar,
  characterName,
  messages,
  autoPlayKey,
  intervalMs = 1500,
  collapseAfterMs = 5000,
}) => {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [displayedCount, setDisplayedCount] = useState(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  // 🌟 主動畫流程：autoPlayKey 改變時重新跑一次
  useEffect(() => {
    if (!messages.length) return;

    clearAllTimers();
    setPhase('hidden');
    setDisplayedCount(0);

    // 1. 先冒頭像
    timersRef.current.push(setTimeout(() => {
      setPhase('avatar_only');
    }, 200));

    // 2. 開始一條一條冒訊息
    timersRef.current.push(setTimeout(() => {
      setPhase('showing');
    }, 700));

    return clearAllTimers;
  }, [autoPlayKey, messages.length]);

  // 🌟 一條一條冒出訊息
  useEffect(() => {
    if (phase !== 'showing') return;
    if (displayedCount >= messages.length) {
      setPhase('all_shown');
      return;
    }
    const t = setTimeout(() => {
      setDisplayedCount(prev => prev + 1);
    }, displayedCount === 0 ? 200 : intervalMs);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [phase, displayedCount, messages.length, intervalMs]);

  // 🌟 全部顯示完，等 5 秒後自動收合
  useEffect(() => {
    if (phase !== 'all_shown') return;
    const t = setTimeout(() => {
      setPhase('collapsed');
    }, collapseAfterMs);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [phase, collapseAfterMs]);

  // 🌟 點擊頭像：collapsed → 一次性展開全部；展開狀態 → 收回
  const handleAvatarClick = () => {
    if (phase === 'collapsed') {
      // 一次性顯示全部
      clearAllTimers();
      setDisplayedCount(messages.length);
      setPhase('all_shown'); // 不重新觸發收合計時（因為等等 useEffect 會重新跑）
    } else if (phase === 'all_shown') {
      // 已經展開時再點 → 立刻收合
      clearAllTimers();
      setPhase('collapsed');
    }
  };

  if (!messages.length || phase === 'hidden') return null;

  const isExpanded = phase === 'showing' || phase === 'all_shown';
  const visibleMessages = messages.slice(0, displayedCount);

  return (
    <div className="flex flex-col gap-2 max-w-xs pointer-events-auto">
      {/* ─── 頭像 + 角色名 ─── */}
      <motion.button
        type="button"
        onClick={handleAvatarClick}
        initial={{ opacity: 0, scale: 0.5, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 self-start cursor-pointer focus:outline-none"
      >
        <div className="w-12 h-12 rounded-full border-2 border-amber-200 bg-white shadow-md overflow-hidden ring-2 ring-white/80">
          {avatar ? (
            <img
              src={avatar}
              alt={characterName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
              ?
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm border border-slate-200">
          {characterName}
        </span>
      </motion.button>

      {/* ─── 訊息泡泡（從上往下冒） ─── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="bubble-stack"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 ml-3"
          >
            {visibleMessages.map((msg, i) => (
              <motion.div
                key={`${autoPlayKey}_${i}`}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-amber-50/95 border border-amber-200/80 text-slate-700 text-xs leading-relaxed px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-md backdrop-blur-sm font-serif"
              >
                {msg.text}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};