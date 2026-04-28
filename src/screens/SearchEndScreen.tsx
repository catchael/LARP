import React from 'react';
import { motion } from 'motion/react';
import { Users, ClipboardList } from 'lucide-react';
import { Evidence } from '../gameData';

interface SearchEndScreenProps {
  backpack: (Evidence & { locationId?: string; locationName?: string })[];
  collectedCoins: string[];
}

export const SearchEndScreen: React.FC<SearchEndScreenProps> = ({ backpack, collectedCoins }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6"
    >
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-12 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

        <div className="w-24 h-24 bg-red-900/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <Users size={40} className="text-red-500" />
        </div>

        <h2 className="text-4xl font-black text-white tracking-widest mb-4 font-serif">搜查時間結束</h2>
        <p className="text-xl text-slate-400 mb-12 font-medium">所有人請前往一樓大廳集合，準備進行第一輪公審。</p>

        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl text-left mb-12">
          <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-indigo-400" /> 你的搜查成果
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-500 mb-1">收集證物</div>
              <div className="text-3xl font-bold text-white font-mono">{backpack.length} <span className="text-lg text-slate-500">件</span></div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-500 mb-1">獲得金幣</div>
              <div className="text-3xl font-bold text-amber-400 font-mono">{collectedCoins.length} <span className="text-lg text-slate-500">枚</span></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};