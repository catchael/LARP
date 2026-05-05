import React from 'react';
import { motion } from 'framer-motion';
import { VenetianMask, Lock, User, ShieldAlert, Ghost, Search } from 'lucide-react';
import { cn } from '../types';

interface GameEndingScreenProps {
  isKiller: boolean;         // 當前玩家是否為真兇
  isKillerCaught: boolean;   // 遊戲結果：真兇是否被投出（被抓到）
  isHost?: boolean;          // 🌟 新增：是否為房主
  onNextPhase?: () => void;  // 🌟 修改：進入下一階段(真相大白)
  surveyCount?: number;
}

export const GameEndingScreen: React.FC<GameEndingScreenProps> = ({
  isKiller,
  isKillerCaught,
  isHost,
  onNextPhase,
}) => {
  // 根據玩家身分與遊戲結果，決定要顯示的 UI 狀態
  const getScreenConfig = () => {
    // 1、真兇被投出：其他玩家畫面 (好人獲勝)
    if (!isKiller && isKillerCaught) {
      return {
        bgClass: "bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-500",
        title: "恭喜你們獲勝",
        subtitle: "正義終將伸張，真兇已成功伏法！",
        textColor: "text-amber-950",
        renderVisuals: () => (
          <div className="relative w-full h-64 flex items-center justify-center">
            <div className="absolute flex gap-8 opacity-40 top-4">
              <User size={80} className="text-amber-900 mt-8" />
              <User size={100} className="text-amber-900" />
              <User size={80} className="text-amber-900 mt-8" />
            </div>
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="relative z-10 mt-12"
            >
              <VenetianMask size={120} className="text-slate-800" />
              <Lock size={80} className="text-red-600 absolute -bottom-6 -right-6 drop-shadow-lg" />
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl -z-10" />
            </motion.div>
          </div>
        )
      };
    }

    // 2、真兇被投出：真兇本人畫面 (逃脫失敗)
    if (isKiller && isKillerCaught) {
      return {
        bgClass: "bg-gradient-to-br from-red-600 via-rose-800 to-slate-900",
        title: "你逃脫失敗",
        subtitle: "法網恢恢，你的罪行已被眾人識破。",
        textColor: "text-white",
        renderVisuals: () => (
          <div className="relative w-full h-64 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 0.3 }}
              className="relative"
            >
              <Ghost size={140} className="text-slate-300 drop-shadow-2xl" />
              <ShieldAlert size={100} className="text-red-500 absolute -bottom-4 -right-4 drop-shadow-2xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-4 bg-red-900/80 rotate-45 shadow-lg" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-4 bg-red-900/80 -rotate-45 shadow-lg" />
            </motion.div>
          </div>
        )
      };
    }

    // 3、真兇逃脫：真兇本人畫面 (兇手獲勝)
    if (isKiller && !isKillerCaught) {
      return {
        bgClass: "bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600",
        title: "恭喜逃脫",
        subtitle: "完美的犯罪！你成功騙過了所有人的眼睛。",
        textColor: "text-yellow-950",
        renderVisuals: () => (
          <div className="relative w-full h-64 flex items-center justify-center">
            <div className="absolute flex gap-12 opacity-30 top-8 blur-sm">
              <User size={90} className="text-yellow-950 rotate-12" />
              <User size={110} className="text-yellow-950 -rotate-6 mt-4" />
              <User size={90} className="text-yellow-950 -rotate-12" />
            </div>
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
              className="relative z-10"
            >
              <VenetianMask size={150} className="text-slate-900 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />
            </motion.div>
          </div>
        )
      };
    }

    // 4、真兇逃脫：其他玩家畫面 (好人失敗)
    return {
      bgClass: "bg-gradient-to-br from-red-900 via-red-950 to-black",
      title: "真兇已逃脫...",
      subtitle: "你們讓真正的兇手逍遙法外，真相將永遠被掩蓋。",
      textColor: "text-red-100",
      renderVisuals: () => (
        <div className="relative w-full h-64 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative"
          >
            <Ghost size={200} className="text-red-600 opacity-80 drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]" />
          </motion.div>
        </div>
      )
    };
  };

  const config = getScreenConfig();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className={cn("min-h-screen w-full flex items-center justify-center p-6 overflow-hidden fixed inset-0 z-[70]", config.bgClass)}
    >
      <div className="max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="glass-panel backdrop-blur-xl bg-white/10 border border-white/20 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-12 relative overflow-hidden"
        >
          {config.renderVisuals()}

          <div className="space-y-4 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className={cn("text-5xl md:text-6xl font-black tracking-tighter drop-shadow-lg", config.textColor)}
            >
              {config.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className={cn("text-xl md:text-2xl font-bold opacity-80", config.textColor)}
            >
              {config.subtitle}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            className="pt-8 relative z-10"
          >
            <button
              onClick={isHost ? onNextPhase : undefined}
              disabled={!isHost}
              className={cn(
                "px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all transform",
                isHost ? "hover:scale-105 cursor-pointer" : "opacity-80 cursor-not-allowed",
                isKillerCaught && !isKiller 
                  ? "bg-amber-900 text-amber-50 hover:bg-amber-800 shadow-xl shadow-amber-900/20" 
                  : "bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur-md"
              )}
            >
              {isHost ? (
                <><Search size={24} /> 進入真相大白環節</>
              ) : (
                <><Lock size={24} /> 等待房主進入真相環節...</>
              )}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};