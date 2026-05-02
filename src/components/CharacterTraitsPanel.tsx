import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Lock, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { CHARACTER_TRAITS } from '../data/characterTraits';
import { cn } from '../types';

interface CharacterTraitsPanelProps {
  /** 目前在看的角色名稱 */
  characterName: string;
  /** 已解鎖進階的角色名稱清單（從 App 傳下來） */
  unlockedCharacters: string[];
  /** 解鎖某角色進階的回呼（會議室時可傳 noop / 不會用到） */
  onUnlockAdvanced: (characterName: string) => void;
  /**
   * 是否為「可解鎖」階段。
   *   true  → 地圖搜查（NotebookModal）：可點解鎖
   *   false → 會議室：只能看已解鎖的，不能新解鎖
   */
  canUnlock: boolean;
  onAddTraitToNote?: (title: string, content: string) => void;
  scriptId: number;
}

export const CharacterTraitsPanel: React.FC<CharacterTraitsPanelProps> = ({
  characterName,
  unlockedCharacters,
  onUnlockAdvanced,
  canUnlock,
  onAddTraitToNote,
  scriptId,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const traits = CHARACTER_TRAITS[scriptId]?.[characterName];
  if (!traits) return null;

  const isAdvancedUnlocked = unlockedCharacters.includes(characterName);
  const hasUnlockedAnother = unlockedCharacters.length > 0 && !isAdvancedUnlocked;
  const advancedDisabled = !isAdvancedUnlocked && (!canUnlock || hasUnlockedAnother);

  // 🌟 新增這段：點擊基礎特徵時，直接傳出筆記
  const handleBasicClick = () => {
    onAddTraitToNote?.('基礎特徵', traits.basic);
  };

  const handleAdvancedClick = () => {
    if (isAdvancedUnlocked) {
      onAddTraitToNote?.('進階特徵', traits.advanced);
      return;
    }
    if (advancedDisabled) return;
    setShowConfirm(true);
  };

  return (
    <>
      {/* 兩個按鈕並排 */}
      <div className="flex gap-2">
        <button
          onClick={handleBasicClick}
          className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-sm border border-indigo-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye size={14} />
          角色基礎特徵
        </button>

        <button
          onClick={handleAdvancedClick}
          disabled={advancedDisabled}
          title={
            !canUnlock && !isAdvancedUnlocked
              ? '需於搜查階段解鎖'
              : hasUnlockedAnother
                ? '本次搜查階段已解鎖過其他人'
                : ''
          }
          className={cn(
            'flex-1 px-3 py-2 rounded-lg font-bold text-sm border transition-colors flex items-center justify-center gap-1.5',
            isAdvancedUnlocked
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              : advancedDisabled
                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
          )}
        >
          {isAdvancedUnlocked ? <Eye size={14} /> : <Lock size={14} />}
          角色進階特徵
        </button>
      </div>

      {/* 🌟 修正：createPortal 必須包在 AnimatePresence 的「外層」，動畫套件才能正常運作 */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-2xl">
                    <AlertTriangle size={24} className="text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">解鎖進階特徵？</h3>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">
                  每次搜索階段僅可察看
                  <span className="font-bold text-amber-600">一人</span>
                  的進階特徵，確認要解鎖
                  <span className="font-bold"> {characterName}</span> 的進階特徵嗎？
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      onUnlockAdvanced(characterName);
                      setShowConfirm(false);
                      // 🌟 確認解鎖後，直接把內容加入筆記
                      onAddTraitToNote?.('進階特徵', traits.advanced);
                    }}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg transition-colors"
                  >
                    確認解鎖
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};