import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X, Briefcase, Eye } from 'lucide-react';
import { Evidence } from '../gameData';
import { Search } from 'lucide-react';
import { EVIDENCE_ICON_MAP } from './EvidenceModal'; // 或把 map 抽到共用檔

interface ShopModalProps {
  isShopOpen: boolean;
  setIsShopOpen: (v: boolean) => void;
  coinCount: number;
  setCoinCount: React.Dispatch<React.SetStateAction<number>>;
  backpack: (Evidence & { locationId?: string; locationName?: string })[];
  backpackCapacity: number;
  setBackpackCapacity: React.Dispatch<React.SetStateAction<number>>;
  unlockedAdvancedDetails: string[];
  setUnlockedAdvancedDetails: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isShopOpen,
  setIsShopOpen,
  coinCount,
  setCoinCount,
  backpack,
  backpackCapacity,
  setBackpackCapacity,
  unlockedAdvancedDetails,
  setUnlockedAdvancedDetails,
}) => {
  if (!isShopOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-emerald-400" /> 搜查補給站
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs">$</span>
              <span className="text-amber-400 font-bold">{coinCount}</span>
            </div>
            <button onClick={() => setIsShopOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backpack Upgrade */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col">
              <div className="w-12 h-12 bg-indigo-900/50 text-indigo-400 rounded-lg flex items-center justify-center mb-4 border border-indigo-500/30">
                <Briefcase size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">擴充背包容量</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">增加可攜帶的證物數量，讓你能在搜查階段帶走更多關鍵線索。目前容量：{backpackCapacity}</p>

              <button
                onClick={() => {
                  if (coinCount >= 5) {
                    setCoinCount(prev => prev - 5);
                    setBackpackCapacity(prev => prev + 1);
                  }
                }}
                disabled={coinCount < 5}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-[10px]">$</span>
                5 購買擴充 (+1)
              </button>
            </div>

            {/* Advanced Details Unlock */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col">
              <div className="w-12 h-12 bg-emerald-900/50 text-emerald-400 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/30">
                <Eye size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">解鎖深層線索</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">花費金幣解鎖背包中特定證物的隱藏細節，可能包含破案的關鍵。</p>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {backpack.filter(item => item.advancedDetails && !unlockedAdvancedDetails.includes(item.id)).length === 0 ? (
                  <div className="text-slate-500 text-sm italic text-center py-4 border border-dashed border-slate-700 rounded-lg">
                    目前背包中沒有可解鎖深層線索的證物
                  </div>
                ) : (
                  backpack.filter(item => item.advancedDetails && !unlockedAdvancedDetails.includes(item.id))
                    .map(item => {
                      const Icon = typeof item.iconName === 'function'
                        ? item.iconName
                        : EVIDENCE_ICON_MAP[item.iconStringId ?? ''] ?? Search;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Icon size={16} className="text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-300 truncate">{item.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (coinCount >= 3) {
                                setCoinCount(prev => prev - 3);
                                setUnlockedAdvancedDetails(prev => [...prev, item.id]);
                              }
                            }}
                            disabled={coinCount < 3}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                          >
                            <span className="w-3 h-3 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-[8px]">$</span>
                            3 解鎖
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};