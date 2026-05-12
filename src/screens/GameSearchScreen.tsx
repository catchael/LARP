import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, ShoppingCart, Briefcase, BookOpen, HelpCircle, X } from 'lucide-react';
import { RoomState, User, cn } from '../types';
import { ROOMS } from '../gameData';
import { CharacterMessageBubble } from '../components/CharacterMessageBubble';
import { SEARCH_MESSAGES } from '../data/searchMessages';

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
  const [showTutorial, setShowTutorial] = useState(true);

  // 🌟 新增：取得當前劇本 ID 與房間資料
  const scriptId = roomState.scriptId ?? 1;
  const currentRoom = activeSearchRoomId ? ROOMS[scriptId]?.[activeSearchRoomId] : null;

  // 🌟 取得當前玩家的角色與內心訊息
  const currentRound = (roomState as any).currentRound ?? 1;
  const myUser = roomState.users.find(u => u.email === user?.email);
  const myCharacterName = myUser?.assignedCharacter ?? '';
  const myCharacter = previewScript.characters.find((c: any) => c.name === myCharacterName);
  const myMessages = SEARCH_MESSAGES[scriptId]?.[currentRound]?.[myCharacterName] ?? [];

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
                 {currentRoom?.name ?? ''}
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-slate-500 font-mono text-sm">
                  SEARCH PHASE - {currentRoom?.floor ?? ''} {currentRoom?.name ?? ''}
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
            <span className="font-mono">每次搜查僅有 4 格背包空間，請謹慎選擇要帶走哪些線索</span>
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
            <span className="font-mono tracking-wide">每次搜查僅有 4 格背包空間，請謹慎選擇</span>
          </motion.div>

          {/* 平面圖區域：佔滿全畫面，按鈕以 z-index 浮在上層 */}
          <div className="absolute inset-0">
            {floorPlan}
            {/* 🌟 新增：左上場景資訊卡下方的角色內心泡泡 */}
            {myMessages.length > 0 && (
              <div className="absolute top-[300px] left-6 z-30 pointer-events-none">
                <CharacterMessageBubble
                  avatar={myCharacter?.image}
                  characterName={myCharacterName}
                  messages={myMessages}
                  autoPlayKey={`${scriptId}_${currentRound}_${myCharacterName}`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 右側懸浮按鈕 */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
        {/* 🌟 新增：教學提示按鈕 */}
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTutorial(true)}
          className="w-14 h-14 bg-slate-800 border border-slate-500 rounded-full flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm relative hover:bg-slate-700 hover:border-slate-400 transition-colors"
        >
          <HelpCircle size={24} />
        </motion.button>
        
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

      {/* 原本的背包、筆記本等彈窗 */}
      {backpackPanel}
      {notebookModal}
      {evidenceModal}
      {shopModal}

      {/* 🌟 新增：搜查階段指南彈窗 */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="bg-indigo-900/50 border-b border-indigo-500/30 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-indigo-100 flex items-center gap-2">
                  <HelpCircle size={20} className="text-indigo-400" />
                  搜查階段指南
                </h3>
                <button onClick={() => setShowTutorial(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 text-slate-300 text-sm leading-relaxed">
                <ul className="space-y-3 list-disc pl-5">
                  <li>背包空間僅有 <span className="text-red-400 font-bold">4格</span>，請謹慎使用。</li>
                  <li>進階人物特徵可在右側 <span className="text-amber-300 font-bold">🛒 購物車</span> 內解鎖。</li>
                  <li>可在商店購買背包空間及證物深層線索。</li>
                  <li>深層線索請在「筆記本 - 背包」中點擊查看。</li>
                </ul>
                <div className="h-2"></div>
                <p className="text-amber-300 font-bold text-center text-base tracking-wide">
                  搜索完成後，利用剩餘的時間，<br/>用筆記本整理你的思緒吧！
                </p>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                <p className="text-[#f5ede2]/80 text-xs text-center mb-3 bg-[#3d2810]/40 border border-[#d8c4b0]/20 rounded-lg px-3 py-2">
                  💡 進階特徵可在右側購物車內解鎖
                </p>                
                <button
                  onClick={() => setShowTutorial(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-900/50"
                >
                  確認
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};