import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { AppPhase, RoomState, User, cn } from '../types';
import { SCRIPTS } from '../data/scripts';

interface CharacterPreviewScreenProps {
  previewScript: typeof SCRIPTS[0] | null;
  currentCharacterIndex: number;
  setCurrentCharacterIndex: React.Dispatch<React.SetStateAction<number>>;
  isGameStarted: boolean;
  roomState: RoomState | null;
  setPhase: (p: AppPhase) => void;
  socket: any;
  user: User | null;
}

export const CharacterPreviewScreen: React.FC<CharacterPreviewScreenProps> = ({
  previewScript,
  currentCharacterIndex,
  setCurrentCharacterIndex,
  isGameStarted,
  roomState,
  setPhase,
  socket,
  user,
}) => {
  if (!previewScript || !previewScript.characters || previewScript.characters.length === 0) return null;

  const character = previewScript.characters[currentCharacterIndex];

  const nextChar = () => {
    setCurrentCharacterIndex((prev) => (prev + 1) % previewScript.characters!.length);
  };

  const prevChar = () => {
    setCurrentCharacterIndex((prev) => (prev - 1 + previewScript.characters!.length) % previewScript.characters!.length);
  };
  
  // 🌟 計算目前的選角狀態
  const selectorsUsers = roomState?.users.filter(u => u.selectedCharacter === character.name) || [];
  const isMeSelected = selectorsUsers.some(u => u.email === user?.email);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl w-full">
      <div className="flex items-center justify-between mb-8">
        {!isGameStarted ? (
          <>
            <button
              onClick={() => setPhase(roomState ? 'room_lobby' : 'script_detail')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft size={20} /> 返回{roomState ? '大廳' : '劇本詳情'}
            </button>
            <div className="flex gap-2">
              {previewScript.characters.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    idx === currentCharacterIndex ? "bg-indigo-600 w-8" : "bg-slate-200"
                  )}
                />
              ))}
            </div>
          </>
        ) : (
          <div /> // 遊戲開始後，放一個空的 div 維持版面平衡
        )}
      </div>

      <div className="relative flex items-center justify-center gap-8">
        {/* 🌟 修正：加上 top-1/2 -translate-y-1/2，讓左右切換鍵垂直置中於名片中間 */}
        <button
          onClick={prevChar}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-4 bg-white rounded-full shadow-xl hover:scale-110 transition-transform text-indigo-600 border border-slate-100"
        >
          <ChevronLeft size={32} />
        </button>

        <button
          onClick={nextChar}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-4 bg-white rounded-full shadow-xl hover:scale-110 transition-transform text-indigo-600 border border-slate-100"
        >
          <ChevronRight size={32} />
        </button>

        {/* Character Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCharacterIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="glass overflow-hidden rounded-[3rem] shadow-2xl flex flex-col md:flex-row w-full max-w-4xl"
          >
            <div className="md:w-2/5 h-96 md:h-auto relative">
              <img
                src={character.image}
                alt={character.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-4xl font-black text-white tracking-tighter">{character.name}</h3>
                <p className="text-indigo-300 font-bold text-lg">{character.role}</p>
              </div>
            </div>

            <div className="md:w-3/5 p-12 space-y-8 flex flex-col relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-6xl font-black text-slate-900 tracking-tighter">{character.name}</h2>
                  {/* 🌟 右上角重疊的選角頭像區 */}
                  <div className="flex -space-x-3">
                    {selectorsUsers.map(u => (
                      <div key={u.id} className="w-14 h-14 rounded-full border-4 border-white overflow-hidden shadow-xl z-10" title={u.email}>
                        <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-200">
                    {character.role}
                  </span>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">身份</h4>
                  <p className="text-xl font-bold text-slate-800">{character.identity}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">性格</h4>
                  <p className="text-lg text-slate-600 font-medium">{character.personality}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">簡介</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {character.intro}
                  </p>
                </div>
              </div>

              {/* 🌟 遊戲開始後才會出現的選角按鈕 */}
              {isGameStarted && (
                <div className="pt-6 mt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => socket?.emit('select_character', character.name)}
                    className={cn(
                      "px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all flex items-center gap-3",
                      isMeSelected 
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-indigo-500/40" 
                        : "bg-slate-800 text-white hover:bg-slate-700 shadow-slate-500/30"
                    )}
                  >
                    {isMeSelected ? <><Check size={24} /> 已選擇此角色</> : "選擇此角色"}
                  </button>
                </div>
              )}

            </div>
            {/* 🌟 已移除名片內的麥克風控制區 — 改由 App.tsx 的懸浮按鈕處理 */}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};