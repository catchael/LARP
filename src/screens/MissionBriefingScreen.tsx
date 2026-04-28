import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, FileText, ScrollText, Check, AlertTriangle, Clock } from 'lucide-react';
import { RoomState, User } from '../types';
import { SCRIPTS } from '../data/scripts';
import { PERSONAL_MISSIONS } from '../data/personalMissions';
import { Evidence } from '../gameData';

interface MissionBriefingScreenProps {
  previewScript: typeof SCRIPTS[0] | null;
  roomState: RoomState | null;
  user: User | null;
  isMeReady: boolean;
  onConfirm: (clues: Evidence[]) => void;
  onOpenTimeline: () => void;
}

export const MissionBriefingScreen: React.FC<MissionBriefingScreenProps> = ({
  previewScript,
  roomState,
  user,
  isMeReady,
  onConfirm,
  onOpenTimeline,
}) => {
  const me = roomState?.users.find(u => u.email === user?.email);
  const myCharacterName = me?.assignedCharacter ?? '';
  const character = previewScript?.characters.find(c => c.name === myCharacterName);
  const mission = PERSONAL_MISSIONS[myCharacterName];

  if (!character || !mission) {
    return (
      <div className="text-slate-400 text-center">
        找不到你的任務簡報⋯⋯
      </div>
    );
  }

  return (
    <motion.div
      key="mission_briefing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl w-full"
    >
      {/* 標題 */}
      <div className="text-center mb-8">
        <p className="text-slate-400 text-xs tracking-[0.4em] uppercase mb-2 font-serif">
          Mission Briefing
        </p>
        <h1 className="text-4xl font-black text-slate-100 tracking-tight">
          任務簡報
        </h1>
      </div>

      {/* 角色卡 + 個人時間線按鈕 */}
      <div className="p-6 rounded-3xl flex items-center gap-5 mb-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
        <img
          src={character.image}
          alt={character.name}
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-full border-2 border-indigo-400/60 object-cover bg-slate-700 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white">{character.name}</h2>
          <p className="text-sm text-slate-400">{character.role}</p>
        </div>
        <button
          onClick={onOpenTimeline}
          className="px-4 py-3 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 shrink-0"
        >
          <Clock size={16} />
          個人時間線
        </button>
      </div>

      {/* 主要任務 */}
      <div className="p-7 rounded-3xl mb-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText size={20} className="text-amber-400" />
          <h3 className="text-base font-bold text-amber-300 tracking-wider">主要任務</h3>
        </div>
        <ol className="space-y-3 list-decimal pl-6 marker:text-amber-400 marker:font-bold">
          {mission.mainTasks.map((task, i) => (
            <li key={i} className="text-slate-200 text-sm leading-relaxed pl-2">
              {task}
            </li>
          ))}
        </ol>
      </div>

      {/* 隱藏任務（紅標） */}
      <div className="p-7 rounded-3xl mb-5 bg-red-950/40 backdrop-blur-sm border-2 border-red-500/40 relative overflow-hidden">
        {/* 右上 TOP SECRET 紅標籤 */}
        <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black tracking-[0.25em] uppercase rounded-bl-lg shadow-lg">
          Top Secret
        </div>

        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={20} className="text-red-400" />
          <h3 className="text-base font-black text-red-300 tracking-wider">隱藏任務</h3>
        </div>

        {mission.hiddenTaskNote && (
          <p className="text-xs text-red-300 italic font-bold mb-4 pl-7">
            ⚠️ {mission.hiddenTaskNote}
          </p>
        )}

        <ol className="space-y-3 list-decimal pl-6 marker:text-red-400 marker:font-bold mt-3">
          {mission.hiddenTasks.map((task, i) => (
            <li key={i} className="text-red-100 text-sm leading-relaxed pl-2">
              {task}
            </li>
          ))}
        </ol>
      </div>

      {/* 起始線索 */}
      <div className="p-7 rounded-3xl mb-8 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={20} className="text-emerald-400" />
          <h3 className="text-base font-bold text-emerald-300 tracking-wider">
            起始線索（{mission.initialClues.length}）
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          這些線索會自動加入你的背包，可在地圖筆記本和會議室線索欄查閱
        </p>

        {mission.initialClues.length > 0 ? (
          <div className="space-y-3">
            {mission.initialClues.map(clue => {
              const ClueIcon = clue.icon;
              return (
                <div
                  key={clue.id}
                  className="p-4 bg-slate-700/40 border border-slate-600/60 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-600 flex items-center justify-center shrink-0">
                      {ClueIcon && <ClueIcon size={22} className="text-emerald-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm mb-0.5">{clue.name}</h4>
                      <p className="text-xs text-emerald-300/80 mb-1.5">{clue.brief}</p>
                      {clue.details && (
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {clue.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">本角色沒有起始線索。</p>
        )}
      </div>

      {/* 確認按鈕 */}
      {!isMeReady ? (
        <button
          onClick={() => onConfirm(mission.initialClues)}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-3"
        >
          <CheckCircle2 size={24} />
          確認，進入搜查
        </button>
      ) : (
        <div className="w-full py-5 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 text-base font-bold flex items-center justify-center gap-2">
          <Check size={20} />
          已準備（等其他人）
        </div>
      )}
    </motion.div>
  );
};