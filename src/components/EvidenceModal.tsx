import React from 'react';
import { motion } from 'motion/react';
import { X, Eye } from 'lucide-react';
import { Evidence, ROOMS } from '../gameData';

interface EvidenceModalProps {
  selectedEvidence: Evidence | null;
  viewingEvidence: Evidence | null;
  setSelectedEvidence: React.Dispatch<React.SetStateAction<Evidence | null>>;
  setViewingEvidence: React.Dispatch<React.SetStateAction<Evidence | null>>;
  backpack: (Evidence & { locationId?: string; locationName?: string })[];
  setBackpack: React.Dispatch<React.SetStateAction<(Evidence & { locationId?: string; locationName?: string })[]>>;
  allCollectedEvidence: (Evidence & { locationId?: string; locationName?: string })[];
  setAllCollectedEvidence: React.Dispatch<React.SetStateAction<(Evidence & { locationId?: string; locationName?: string })[]>>;
  backpackCapacity: number;
  activeSearchRoomId: string | null;
  scriptId: number;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  selectedEvidence,
  viewingEvidence,
  setSelectedEvidence,
  setViewingEvidence,
  backpack,
  setBackpack,
  allCollectedEvidence,
  setAllCollectedEvidence,
  backpackCapacity,
  activeSearchRoomId,
  scriptId,
}) => {
  if (!selectedEvidence && !viewingEvidence) return null;

  const item = selectedEvidence || viewingEvidence;
  const isViewing = !!viewingEvidence;

  if (!item) return null;
  const Icon = item.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center text-center relative">
          <button
            onClick={() => {
              setSelectedEvidence(null);
              setViewingEvidence(null);
            }}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center mb-6 shadow-inner">
            <Icon size={48} className="text-slate-300" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
          <p className="text-amber-400 font-medium mb-6">{item.brief}</p>

          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 w-full text-left mb-8">
            <p className="text-slate-300 leading-relaxed text-sm">
              {isViewing ? item.details : "這件物品似乎隱藏著某些線索，是否要仔細查看並收入背包？(收入後無法丟棄)"}
            </p>
          </div>

          {!isViewing && (
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="flex-1 py-3 px-4 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold transition-colors"
              >
                放回去
              </button>
              <button
                onClick={() => {
                  if (backpack.length < backpackCapacity) {
                    const enrichedItem = { ...item, locationId: activeSearchRoomId || undefined, locationName: activeSearchRoomId ? ROOMS[scriptId]?.[activeSearchRoomId]?.name : undefined };
                    setBackpack([...backpack, enrichedItem]);
                    setAllCollectedEvidence(prev => {
                      if (prev.some(e => e.id === item.id)) return prev;
                      return [...prev, enrichedItem];
                    });
                    setSelectedEvidence(null);
                    setViewingEvidence(item); // Show details immediately after collecting
                  }
                }}
                disabled={backpack.length >= backpackCapacity}
                className="flex-1 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Eye size={18} /> 查看詳情並收入
              </button>
            </div>
          )}

          {isViewing && (
            <button
              onClick={() => setViewingEvidence(null)}
              className="w-full py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              關閉
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};