import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { RoomState, User, cn } from '../types';
import { SCRIPTS } from '../data/scripts';
import { Socket } from 'socket.io-client';

export interface VotingScreenProps {
  roomState: RoomState | null;
  previewScript: typeof SCRIPTS[0] | null;
  user: User | null;
  socket: Socket | null;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({
  roomState,
  previewScript,
  user,
  socket,
}) => {
  // 紀錄玩家選中的角色名字
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  // 紀錄是否已經送出投票（送出後鎖定介面）
  const [hasVoted, setHasVoted] = useState(false);

  // 取得目前房間內有被分配到的角色清單
  const activeUsers = roomState?.users.filter(u => u.assignedCharacter) || [];

  const handleVoteSubmit = () => {
    if (!selectedCharacter || !socket) return;
    
    // 再次確認
    if (window.confirm(`你確定要指認【${selectedCharacter}】為兇手嗎？投票後無法更改喔！`)) {
      setHasVoted(true);
      // 發送投票結果給 Server
      socket.emit('submit_vote', { targetCharacter: selectedCharacter });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-start overflow-y-auto pt-20 pb-10 px-6"
    >
      {/* 標題區 */}
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-5xl font-black text-red-500 mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        >
          最終指認
        </motion.h1>
        <p className="text-slate-400 text-lg">
          {hasVoted ? '你已完成投票，請等待其他玩家...' : '請根據線索與討論，投出你認為的真兇（單選）。'}
        </p>
      </div>

      {/* 角色卡片網格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-12">
        {/* 🌟 修正：直接從劇本資料中抓取所有角色，不管有沒有真人扮演 */}
        {previewScript?.characters.map((charData) => {
          // 找出這個角色是否有真人扮演 (為了顯示 "你自己" 標籤)
          const realUser = roomState?.users.find(u => u.assignedCharacter === charData.name);
          const isSelected = selectedCharacter === charData.name;
          const isMe = realUser?.email === user?.email;

          return (
            <motion.div
              key={charData.name}
              whileHover={!hasVoted ? { scale: 1.05 } : {}}
              whileTap={!hasVoted ? { scale: 0.95 } : {}}
              onClick={() => {
                if (!hasVoted) setSelectedCharacter(charData.name);
              }}
              className={cn(
                "relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300",
                hasVoted ? "opacity-50 cursor-not-allowed grayscale" : "",
                isSelected 
                  ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]" 
                  : "border-slate-800 hover:border-slate-600 bg-slate-900/50"
              )}
            >
              {/* 角色頭像 */}
              <div className="aspect-square w-full relative">
                <img 
                  src={charData.image} // 直接使用劇本設定的圖片
                  alt={charData.name} 
                  className="w-full h-full object-cover bg-slate-800"
                />
                {/* 遮罩漸層 */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              </div>

              {/* 角色資訊 */}
              <div className="absolute bottom-0 w-full p-4 text-center">
                <div className="text-xl font-bold text-white mb-1">
                  {charData.name}
                </div>
                {/* 顯示是不是自己 */}
                {isMe && (
                  <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700 mt-1">
                    你自己
                  </span>
                )}
                {/* 可以順便標示 AI 託管 (選用) */}
                {!realUser && (
                  <span className="inline-block px-2 py-0.5 bg-slate-800/50 text-slate-500 text-xs rounded-full border border-slate-700 mt-1">
                    無人扮演
                  </span>
                )}
              </div>

              {/* 選中時的打勾圖示 */}
              {isSelected && !hasVoted && (
                <div className="absolute top-3 right-3 text-red-500 bg-slate-900 rounded-full shadow-lg">
                  <CheckCircle2 size={32} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 底部確認按鈕 */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-auto"
      >
        {!hasVoted ? (
          <button
            onClick={handleVoteSubmit}
            disabled={!selectedCharacter}
            className={cn(
              "px-10 py-4 rounded-2xl font-black text-xl transition-all flex items-center gap-3",
              selectedCharacter
                ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] hover:-translate-y-1"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            <AlertCircle size={24} />
            確認指認 {selectedCharacter ? `【${selectedCharacter}】` : ''}
          </button>
        ) : (
          <div className="px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-lg flex items-center gap-3 shadow-inner">
            <Lock size={20} className="text-red-400" />
            投票已鎖定，等待結果統計...
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};