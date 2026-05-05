import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, User, Sparkles, Lock, CheckCircle } from 'lucide-react';
import { AppPhase, cn } from '../types';
import { SCRIPTS } from '../data/scripts';
import { ScriptCover } from '../components/ScriptCover';

interface ScriptLobbyScreenProps {
  setPhase: (p: AppPhase) => void;
  setPreviewScript: (s: typeof SCRIPTS[0] | null) => void;
  isScript2Unlocked: boolean;
  hasPlayedScript2: boolean;
}

export const ScriptLobbyScreen: React.FC<ScriptLobbyScreenProps> = ({ 
  setPhase, 
  setPreviewScript,
  isScript2Unlocked,
  hasPlayedScript2
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl w-full space-y-12 pb-12">
    <div className="flex items-end justify-between">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold">劇本挑選大廳</h2>
        <p className="text-slate-500">選擇一個感興趣的劇本，開始您的沉浸式表達體驗</p>
      </div>
      <button
        onClick={() => setPhase('lobby')}
        className="btn-secondary flex items-center gap-2"
      >
        <ChevronLeft size={20} /> 返回教學
      </button>
    </div>

    {/* 多人劇本區域 */}
    <div className="grid md:grid-cols-2 gap-10">
      {SCRIPTS.map((script, index) => {
        const isScript1 = index === 0;
        const isScript2 = index === 1;

        // 🌟 1. 是否被鎖定（反灰且無法點擊）
        // 劇本一：如果劇本二解鎖了，但劇本二還沒玩完 -> 暫時鎖定，逼玩家去玩劇本二
        // 劇本二：如果還沒解鎖 -> 永遠鎖定
        const isLocked = 
          (isScript1 && isScript2Unlocked && !hasPlayedScript2) || 
          (isScript2 && !isScript2Unlocked);

        // 🌟 2. 是否顯示「鳥鳥推薦」
        const isRecommended = 
          (isScript1 && !isScript2Unlocked) || 
          (isScript2 && isScript2Unlocked && !hasPlayedScript2);

        // 🌟 3. 是否為「已破案」的榮譽狀態（不影響點擊）
        const isCleared = 
          (isScript1 && isScript2Unlocked) || 
          (isScript2 && hasPlayedScript2);

        return (
          <motion.div
            key={script.id}
            whileHover={isLocked ? {} : { y: -10 }}
            onClick={() => {
              if (isLocked) {
                if (isScript2 && !isScript2Unlocked) alert('請先完成《窒息地下室》並填寫問卷以解鎖此劇本！');
                if (isScript1 && isScript2Unlocked && !hasPlayedScript2) alert('請先集中精力調查新懸案《黑傘下的妄想殺機》！');
                return;
              }
              setPreviewScript(script);
              setPhase('script_detail');
            }}
            className={cn(
              "group relative rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 transition-all",
              isLocked ? "bg-slate-200 cursor-not-allowed" : "cursor-pointer bg-white hover:shadow-2xl"
            )}
          >
            {/* 🌟 鎖定遮罩 (只有真的被鎖定時才出現) */}
            {isLocked && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-slate-900/90 px-8 py-4 rounded-full flex items-center gap-3 text-white font-bold tracking-widest border border-slate-700 shadow-2xl">
                  <Lock size={20} className={isScript1 ? "text-emerald-400" : "text-amber-400"} />
                  {isScript1 ? '請先調查新懸案' : '未解鎖'}
                </div>
              </div>
            )}

            {/* 🌟 榮譽勳章：已破案 (右上角) */}
            {!isLocked && isCleared && (
              <div className="absolute top-6 right-6 z-40 bg-emerald-500/90 backdrop-blur-sm text-white font-bold text-sm px-4 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400 flex items-center gap-2">
                <CheckCircle size={16} /> 已破案
              </div>
            )}

            {/* 🌟 鳥鳥推薦 (左上角) */}
            {isRecommended && (
              <div className="absolute top-6 -left-2 z-40 bg-indigo-600 text-white font-black text-sm px-4 py-2 rounded-r-xl shadow-lg border-y-2 border-r-2 border-indigo-300 animate-bounce flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-300" />
                先玩這個吧！
              </div>
            )}

            <div className={cn("relative aspect-[2/3] h-80 mx-auto mt-8 overflow-hidden rounded-lg transition-transform duration-700", !isLocked && "group-hover:scale-105")}>
              <div className={cn("w-full h-full transition-all", isLocked && "grayscale opacity-50")}>
                <ScriptCover scriptId={script.id} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className={cn("p-8 space-y-4", isLocked && "opacity-60 grayscale")}>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                「{script.brief}」
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">難度</span>
                  <span className="text-amber-500 font-bold">{script.difficulty}</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">
                  查看詳情 <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>

    {/* 單人劇本體驗全幅橫幅 */}
    <motion.div
      whileHover={!isScript2Unlocked ? {} : { y: -5 }}
      onClick={() => {
        if (!isScript2Unlocked) {
          alert('請先完成《窒息地下室》並填寫問卷以解鎖單人挑戰！');
          return;
        }
        setPhase('single_player');
      }}
      className={cn(
        "group relative rounded-[2.5rem] overflow-hidden shadow-2xl transition-all",
        !isScript2Unlocked ? "bg-slate-800 cursor-not-allowed" : "cursor-pointer bg-gradient-to-br from-indigo-900 to-indigo-700"
      )}
    >
      {!isScript2Unlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-900/90 px-8 py-4 rounded-full flex items-center gap-3 text-white font-bold tracking-widest border border-slate-700 shadow-2xl">
            <Lock size={20} className="text-amber-400" />
            未解鎖 (需先完成劇本一)
          </div>
        </div>
      )}

      <div className={cn("p-10 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10", !isScript2Unlocked && "opacity-40 grayscale")}>
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 flex-shrink-0">
            <User className="w-12 h-12 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">單人挑戰</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">專屬一對一劇本</h3>
            <p className="text-indigo-100 text-lg font-medium">與 AI 引導員進行沉浸式口語表達冒險，隨時展開您的挑戰！</p>
          </div>
        </div>
        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 transition-colors duration-300", !isScript2Unlocked ? "bg-slate-700 text-slate-500" : "bg-white/20 text-white group-hover:bg-white group-hover:text-indigo-600")}>
          <ChevronRight size={32} />
        </div>
      </div>
    </motion.div>
  </motion.div>
);