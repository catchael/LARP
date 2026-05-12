import React from 'react';
import { Eye, Lock } from 'lucide-react';
import { CHARACTER_TRAITS } from '../data/characterTraits';
import { cn } from '../types';

interface CharacterTraitsPanelProps {
  /** 目前在看的角色名稱 */
  characterName: string;
  /** 已解鎖進階的角色名稱清單（從 App 傳下來） */
  unlockedCharacters: string[];
  /** 解鎖某角色進階的回呼（目前邏輯已移至商店，此處保留介面以相容父組件） */
  onUnlockAdvanced: (characterName: string) => void;
  /**
   * 是否為「可解鎖」階段。
   */
  canUnlock: boolean;
  onAddTraitToNote?: (title: string, content: string) => void;
  scriptId: number;
  allCharacterNames: string[];
  onShowToast?: (msg: string) => void;
}

export const CharacterTraitsPanel: React.FC<CharacterTraitsPanelProps> = ({
  characterName,
  unlockedCharacters,
  onAddTraitToNote,
  scriptId,
}) => {
  // 取得該劇本對應角色的特徵資料
  const traits = CHARACTER_TRAITS[scriptId]?.[characterName];
  if (!traits) return null;

  // 判斷是否已解鎖
  const isAdvancedUnlocked = unlockedCharacters.includes(characterName);

  // 點擊基礎特徵：直接加入筆記
  const handleBasicClick = () => {
    onAddTraitToNote?.('基礎特徵', traits.basic);
  };

  // 點擊進階特徵：只有解鎖了才能點擊加入筆記
  const handleAdvancedClick = () => {
    if (isAdvancedUnlocked) {
      onAddTraitToNote?.('進階特徵', traits.advanced);
    }
  };

  return (
    <div className="flex gap-2">
      {/* 基礎特徵按鈕 */}
      <button
        onClick={handleBasicClick}
        className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold text-sm border border-indigo-100 transition-colors flex items-center justify-center gap-1.5"
      >
        <Eye size={14} />
        角色基礎特徵
      </button>

      {/* 進階特徵按鈕：未解鎖時禁用並提示 */}
      <button
        onClick={handleAdvancedClick}
        disabled={!isAdvancedUnlocked}
        className={cn(
          'flex-1 px-3 py-2 rounded-lg font-bold text-sm border transition-colors flex items-center justify-center gap-1.5',
          isAdvancedUnlocked
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
        )}
      >
        {isAdvancedUnlocked ? <Eye size={14} /> : <Lock size={14} />}
        角色進階特徵 {!isAdvancedUnlocked && '(請至商店解鎖)'}
      </button>
    </div>
  );
};