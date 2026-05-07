import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase } from 'lucide-react';
import { cn } from '../types';
import { Evidence } from '../gameData';
import { Search } from 'lucide-react';
import { EVIDENCE_ICON_MAP } from './EvidenceModal'; // 或把 map 抽到共用檔

interface BackpackProps {
  isBackpackOpen: boolean;
  backpack: Evidence[];
  backpackCapacity: number;
  setViewingEvidence: (e: Evidence | null) => void;
}

export const Backpack: React.FC<BackpackProps> = ({
  isBackpackOpen,
  backpack,
  backpackCapacity,
  setViewingEvidence,
}) => (
  <AnimatePresence>
    {isBackpackOpen && (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        className="absolute right-24 top-1/2 -translate-y-1/2 w-80 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700 rounded-xl p-6 flex flex-col shadow-2xl z-40 h-[60vh] max-h-[600px] before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] before:opacity-20 before:pointer-events-none"
      >
        <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4 relative z-10">
          <Briefcase className="text-amber-500" size={24} />
          <h3 className="text-xl font-bold text-white tracking-widest">搜查背包</h3>
          <span className="ml-auto text-sm font-mono text-slate-400">{backpack.length} / {backpackCapacity}</span>
        </div>

        <div className="mb-4 p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-400 relative z-10">
          每次搜查僅有 <span className="text-amber-400 font-bold">{backpackCapacity} 格</span>背包空間，請謹慎選擇。<br/>
          <span className="text-slate-500">搜查結束後背包會清空，但收集過的線索仍可在筆記本中查閱。</span>
        </div>

        <div className="flex-1 flex flex-col gap-3 relative z-10 overflow-y-auto pr-2">
          {Array.from({ length: backpackCapacity }).map((_, index) => {
            const item = backpack[index];
            const Icon = typeof item?.iconName === 'function'   // ← 加在這裡，注意 item 可能是 undefined
              ? item.iconName
              : EVIDENCE_ICON_MAP[item?.iconStringId ?? ''] ?? Search;
            return (
              <div
                key={index}
                className={cn(
                  "h-20 rounded-lg border-2 flex items-center px-4 transition-all shrink-0",
                  item
                    ? "border-slate-600 bg-slate-800 cursor-pointer hover:border-amber-500/50"
                    : "border-slate-800 border-dashed bg-slate-900/50"
                )}
                onClick={() => item && setViewingEvidence(item)}
              >
                {item ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center shrink-0">
                      <Icon size={24} className="text-slate-300" />

                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-200 truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 truncate">{item.brief}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-center text-slate-600 font-mono text-sm">
                    [ 空欄位 ]
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {backpack.length >= backpackCapacity && (
          <div className="mt-4 p-4 bg-amber-950/30 border border-amber-900/50 rounded-lg text-amber-400 text-sm text-center relative z-10 shrink-0">
            背包已滿，無法再收集更多證物。
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);