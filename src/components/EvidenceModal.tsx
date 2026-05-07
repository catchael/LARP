import React from 'react';
import { motion } from 'motion/react';
import { X, Eye, Search, BookOpen, FileText, MapPin, Tag, Package } from 'lucide-react';
import {
  Mic, Newspaper, Lock, Footprints, Skull, Cigarette, Droplets,
  Laptop, Cable, Wrench, GlassWater, Umbrella, Smartphone,
  Crosshair, Shirt, Bandage, Camera, Waves, Mountain,
} from 'lucide-react';
import { Evidence, ROOMS } from '../gameData';

// 🌟 iconName 可能在 JSON 序列化後丟失函式參考，用字串 id 查表來兜底
export const EVIDENCE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  search: Search, package: Package, bookOpen: BookOpen, fileText: FileText,
  mapPin: MapPin, tag: Tag,
  cs_mic: Mic, cs_old_news: Newspaper, cs_secret_compartment: Lock,
  es_locked_door: Lock, cs_drag_marks: Footprints, cs_shoeprint: Footprints,
  es_muddy_steps: Footprints, pv_footprints: Footprints, ls_slip_marks: Footprints,
  cs_autopsy: Skull, pv_autopsy: Skull, dp_cigarette_butt: Cigarette,
  cv_cigarettes: Cigarette, sk_wet_sink: Droplets, ws_sink_clean: Droplets,
  cg_sink: Droplets, lk_laptop: Laptop, lk_rope: Cable, pv_rope: Cable,
  es_plastic_part: Package, lk_plastic_bags: Package, bp_backpack: Package,
  np_disposal_list: FileText, np_old_proposal: FileText, bp_business_card: FileText,
  ws_pi_card: FileText, cg_metal_debris: Wrench, dp_water_bottle: GlassWater,
  pv_black_umbrella: Umbrella, ws_big_umbrella: Umbrella, ws_metal_umbrella: Umbrella,
  bp_phone: Smartphone, bp_gun: Crosshair, bp_lawbooks: BookOpen,
  ws_fabric: Shirt, cg_medical: Bandage, cg_cctv: Camera,
  bp_swimwear: Waves, ls_sand_compare: Mountain,
};

function resolveEvidenceIcon(evidence: any): React.ComponentType<{ size?: number; className?: string }> {
  if (typeof evidence?.iconName === 'function') return evidence.iconName;
  const key: string | undefined =
    typeof evidence?.iconStringId === 'string' ? evidence.iconStringId :
    typeof evidence?.iconName === 'string'     ? evidence.iconName :
    undefined;
  if (key && EVIDENCE_ICON_MAP[key]) return EVIDENCE_ICON_MAP[key];
  return Search;
}

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
  const Icon = resolveEvidenceIcon(item); // 🌟 用安全的方式取得 icon，防止序列化後炸裂

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
                    const enrichedItem = { 
                      ...item, 
                      locationId: activeSearchRoomId || undefined, 
                      locationName: (activeSearchRoomId && ROOMS[scriptId] && ROOMS[scriptId][activeSearchRoomId]) 
                                    ? ROOMS[scriptId][activeSearchRoomId].name 
                                    : "未知區域" 
                    };
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