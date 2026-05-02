import React from 'react';
import { motion } from 'motion/react';
import { ROOMS, Evidence } from '../gameData';

interface RoomViewProps {
  activeSearchRoomId: string | null;
  backpack: Evidence[];
  setSelectedEvidence: (e: Evidence | null) => void;
  collectedCoins: string[];
  setCollectedCoins: React.Dispatch<React.SetStateAction<string[]>>;
  setCoinCount: React.Dispatch<React.SetStateAction<number>>;
  allCollectedEvidence: Evidence[];
  scriptId:number;
}

export const RoomView: React.FC<RoomViewProps> = ({
  activeSearchRoomId,
  backpack,
  setSelectedEvidence,
  collectedCoins,
  setCollectedCoins,
  setCoinCount,
  allCollectedEvidence,
  scriptId
}) => {
  if (!activeSearchRoomId) return null;
  const room = ROOMS[scriptId]?.[activeSearchRoomId];

  // 🌟 暫時加這行看 console
  console.log('[RoomView Debug]', { 
    scriptId, 
    activeSearchRoomId, 
    hasRoom: !!room,
    scriptIdType: typeof scriptId,
    availableRoomsInScript: ROOMS[scriptId] ? Object.keys(ROOMS[scriptId]) : 'NO_SCRIPT',
  });

  if (!room) return null;   // 🌟 新增防呆

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
      {/* Room Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #334155 0%, transparent 70%)' }} />

      {/* Evidences */}
      {room.evidences.map((evidence) => {
        const isCollected = allCollectedEvidence.some(e => e.id === evidence.id);
        if (isCollected) return null; // Hide collected evidence from map

        const Icon = evidence.iconName;
        return (
          <motion.div
            key={evidence.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.2 }}
            className="absolute cursor-pointer flex flex-col items-center gap-1 group z-20"
            style={{ left: `${evidence.x}%`, top: `${evidence.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => setSelectedEvidence(evidence)}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all">
              <Icon size={20} className="text-slate-300 group-hover:text-amber-400" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 bg-slate-900/90 text-xs px-2 py-1 rounded border border-slate-700 whitespace-nowrap transition-opacity pointer-events-none text-slate-200">
              {evidence.name}
            </div>
          </motion.div>
        );
      })}

      {/* Coins */}
      {room.coins?.map((coin) => {
        if (collectedCoins.includes(coin.id)) return null;
        return (
          <motion.div
            key={coin.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.2 }}
            className="absolute cursor-pointer z-10"
            style={{ left: `${coin.x}%`, top: `${coin.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => {
              setCollectedCoins(prev => [...prev, coin.id]);
              setCoinCount(prev => prev + 1);
            }}
          >
            <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce">
              <span className="text-amber-900 font-bold text-xs">$</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};