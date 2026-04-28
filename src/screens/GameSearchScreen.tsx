import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, ShoppingCart, Briefcase, BookOpen } from 'lucide-react';
import { RoomState, User, cn } from '../types';
import { ROOMS } from '../gameData';

interface GameSearchScreenProps {
  previewScript: any | null;
  roomState: RoomState | null;
  user: User | null;
  activeSearchRoomId: string | null;
  setActiveSearchRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  timeLeft: number;
  setIsShopOpen: (v: boolean) => void;
  coinCount: number;
  isBackpackOpen: boolean;
  setIsBackpackOpen: React.Dispatch<React.SetStateAction<boolean>>;
  backpack: any[];
  setIsNotebookOpen: (v: boolean) => void;
  floorPlan: React.ReactNode;
  roomView: React.ReactNode;
  backpackPanel: React.ReactNode;
  notebookModal: React.ReactNode;
  evidenceModal: React.ReactNode;
  shopModal: React.ReactNode;
}

export const GameSearchScreen: React.FC<GameSearchScreenProps> = ({
  previewScript,
  roomState,
  user,
  activeSearchRoomId,
  setActiveSearchRoomId,
  timeLeft,
  setIsShopOpen,
  coinCount,
  isBackpackOpen,
  setIsBackpackOpen,
  backpack,
  setIsNotebookOpen,
  floorPlan,
  roomView,
  backpackPanel,
  notebookModal,
  evidenceModal,
  shopModal,
}) => {
  if (!previewScript || !roomState) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 bg-slate-950"
    >
      {activeSearchRoomId ? (
        // ─── 房間檢視 ───────────────────────────────
        <div className="absolute inset-0 flex flex-col bg-[#0f172a] p-8 md:p-12 text-slate-300 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-5 relative z-20 shrink-0">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white font-serif tracking-widest border-l-4 border-red-900/80 pl-4">
                {ROOMS[activeSearchRoomId].name}
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-slate-500 font-mono text-sm">
                  SEARCH PHASE - {ROOMS[activeSearchRoomId].floor} {ROOMS[activeSearchRoomId].name}
                </p>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-900/50 rounded-full text-red-400 font-mono text-sm animate-pulse">
                  <Clock size={14} />
                  <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSearchRoomId(null)}
              className="px-6 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors font-bold tracking-widest flex items-center gap-2 rounded-lg"
            >
              <ArrowLeft size={16} /> 返回地圖
            </button>
          </div>

          {/* 背包提醒（房間內版） */}
          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-600 text-slate-200 text-xs relative z-20 shrink-0 shadow-lg">
            <Briefcase size={14} className="text-slate-300 shrink-0" />
            <span className="font-mono">每次搜查僅有 3 格背包空間，請謹慎選擇要帶走哪些線索</span>
          </div>

          <div className="flex-1 relative z-10 font-mono bg-slate-900/80 border border-slate-800/80 rounded-xl p-8 shadow-inner overflow-auto">
            {roomView}
          </div>
        </div>
      ) : (
        // ─── 平面圖檢視 ──────────────────────────────
        <div className="absolute inset-0" style={{ backgroundColor: '#0f172a' }}>
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}
          />

          {/* 背包提醒：移至左下角，避開頂部人物頭像 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-20 left-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/95 backdrop-blur-md border border-slate-500/80 text-slate-100 text-xs shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap"
          >
            <Briefcase size={13} className="text-slate-300 shrink-0" />
            <span className="font-mono tracking-wide">每次搜查僅有 3 格背包空間，請謹慎選擇</span>
          </motion.div>

          {/* 平面圖區域：佔滿全畫面，按鈕以 z-index 浮在上層 */}
          <div className="absolute inset-0">
            {floorPlan}
          </div>
        </div>
      )}

      {/* 右側懸浮按鈕 */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsShopOpen(true)}
          className="w-14 h-14 bg-slate-800 border border-slate-500 rounded-full flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm relative hover:bg-slate-700 hover:border-slate-400 transition-colors"
        >
          <ShoppingCart size={22} />
          <span className="absolute -top-1 -right-1 bg-amber-500 text-amber-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow">
            {coinCount}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsBackpackOpen(!isBackpackOpen)}
          className="w-14 h-14 bg-slate-800 border border-slate-500 rounded-full flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm relative hover:bg-slate-700 hover:border-slate-400 transition-colors"
        >
          <Briefcase size={22} />
          {backpack.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow">
              {backpack.length}
            </span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsNotebookOpen(true)}
          className="w-14 h-14 bg-slate-800 border border-slate-500 rounded-full flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm hover:bg-slate-700 hover:border-slate-400 transition-colors"
        >
          <BookOpen size={22} />
        </motion.button>
      </div>

      {/* 底部計時器 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-slate-700/60 px-7 py-3 rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex items-center gap-3">
        <Clock
          className={timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-amber-500'}
          size={22}
        />
        <span
          className={cn(
            'text-2xl font-mono font-bold tracking-widest',
            timeLeft <= 30 ? 'text-red-400' : 'text-white'
          )}
        >
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
          {(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>

      {backpackPanel}
      {notebookModal}
      {evidenceModal}
      {shopModal}
    </motion.div>
  );
};