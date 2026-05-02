import React from 'react';
import { motion } from 'motion/react';
import {
  DoorOpen,
  Trash2,
  Droplets,
  Archive,
  FileText,
  Skull,
  // 🌟 劇本 2 新增 icons
  TreeDeciduous,
  Footprints,
  Mountain,
  ShoppingBag,
} from 'lucide-react';
import { AppPhase, cn } from '../types';

interface FloorPlanProps {
  currentFloor: '2F' | '1F' | 'B1';
  setCurrentFloor: (f: '2F' | '1F' | 'B1') => void;
  phase: AppPhase;
  setActiveSearchRoomId: (id: string | null) => void;
  scriptId: number; // 🌟 新增
}

interface Zone {
  id: string;
  name: string;
  subtitle: string;
  iconName: React.ElementType;
  x: number; y: number; w: number; h: number;
  accent: string;
}

// 🌟 劇本對應的 ZONES：外層 key 是 scriptId
const ZONES_BY_SCRIPT: Record<number, Zone[]> = {
  // ═══════════════════════════════════════════════════════════
  // 劇本 1 — 廢棄商業大樓地下室
  // ═══════════════════════════════════════════════════════════
  1: [
    { id: 'entrance_stairs', name: '入口樓梯與鐵門',     subtitle: '密室證明',         iconName: DoorOpen, x: 50, y: 10, w: 28, h: 16, accent: 'slate'  },
    { id: 'newspapers',      name: '散落的紙箱與舊報紙', subtitle: '隱藏文件',         iconName: FileText, x: 18, y: 40, w: 24, h: 20, accent: 'amber'  },
    { id: 'crime_scene',     name: '地下室正中央',       subtitle: '案發現場',         iconName: Skull,    x: 50, y: 44, w: 28, h: 26, accent: 'red'    },
    { id: 'lockers',         name: '破舊的員工置物櫃',   subtitle: '真兇的臨時基地',   iconName: Archive,  x: 82, y: 40, w: 24, h: 20, accent: 'indigo' },
    { id: 'debris_pile',     name: '陰暗的廢棄物堆',     subtitle: '完美栽贓點',       iconName: Trash2,   x: 22, y: 80, w: 26, h: 18, accent: 'purple' },
    { id: 'cleaning_sink',   name: '廢棄的清潔水槽',     subtitle: '異樣的水跡',       iconName: Droplets, x: 78, y: 80, w: 26, h: 18, accent: 'cyan'   },
  ],
  // ═══════════════════════════════════════════════════════════
  // 劇本 2 — 生態郊野公園及周圍社區
  // 上半部：公園（深處 → 淺處）
  // 下半部：社區與外圍街道
  // ═══════════════════════════════════════════════════════════
  2: [
    // ── 公園深處（最頂端 = 案發現場 + 周遭草叢）──
    { id: 'pavilion',        name: '廢棄涼亭',             subtitle: '案發現場',         iconName: Skull,         x: 50, y: 12, w: 30, h: 18, accent: 'red'    },
    { id: 'bushes_pit',      name: '涼亭周遭草叢與深坑',   subtitle: '凶器與棄置物',     iconName: TreeDeciduous, x: 22, y: 32, w: 26, h: 20, accent: 'purple' },
    // ── 公園淺處（步道、洗手台、泥沙區）──
    { id: 'walkway_sink',    name: '公園步道與公共洗手台', subtitle: '清洗痕跡',         iconName: Droplets,      x: 78, y: 36, w: 26, h: 20, accent: 'cyan'   },
    { id: 'landscape_sand',  name: '景觀工程泥沙區',       subtitle: '腳印與土質比對',   iconName: Mountain,      x: 50, y: 55, w: 26, h: 16, accent: 'amber'  },
    // ── 社區與外圍（最底端，距公園步行 10 分鐘）──
    { id: 'community_guard', name: '社區大門與警衛室',     subtitle: '監視器與急救痕跡', iconName: DoorOpen,      x: 22, y: 80, w: 26, h: 18, accent: 'slate'  },
    { id: 'convenience',     name: '便利商店與外圍街道',   subtitle: '避雨者的菸蒂',     iconName: ShoppingBag,   x: 78, y: 80, w: 26, h: 18, accent: 'indigo' },
  ],
};

// 🌟 場景資訊卡：劇本對應的 floor 標籤、標題、描述
const SCENE_INFO_BY_SCRIPT: Record<number, { floor: string; title: string; description: string }> = {
  1: {
    floor: 'B1 — Basement',
    title: '廢棄商業大樓地下室',
    description:
      '約五十坪大的廢棄地下室。空氣瀰漫著濃烈的潮濕霉味與灰塵。天花板上只有幾盞接觸不良的黃色燈泡閃爍著。原本的水泥地面因為年久失修，積了一層厚厚且粗糙的砂土。空間被幾根粗大的水泥柱分割，周圍堆滿了廢棄物，形成許多視線死角。',
  },
  2: {
    floor: 'OUTDOOR — Park & Community',
    title: '生態郊野公園及周圍社區',
    description:
      '一場狂風暴雨正在肆虐。社區後方尚未完全開發的生態郊野公園被黑暗與雨水吞噬。現場滿是泥濘，視線極差，雨水沖刷的聲音掩蓋了周遭所有的動靜。距離公園步行約十分鐘的距離，則是死者居住的社區大樓與外圍街道。',
  },
};

const accentMap: Record<string, { border: string; bg: string; text: string; glow: string; iconGlow: string }> = {
  slate:  { border: 'border-slate-500/50',  bg: 'bg-slate-800/60',  text: 'text-slate-200',  glow: 'hover:shadow-[0_0_40px_rgba(148,163,184,0.25)] hover:border-slate-400/70',  iconGlow: 'drop-shadow(0 0 6px rgba(148,163,184,0.6))' },
  red:    { border: 'border-red-500/60',    bg: 'bg-red-950/50',    text: 'text-red-200',    glow: 'hover:shadow-[0_0_50px_rgba(239,68,68,0.45)] hover:border-red-400/80',    iconGlow: 'drop-shadow(0 0 8px rgba(239,68,68,0.8))'   },
  amber:  { border: 'border-amber-500/55',  bg: 'bg-amber-950/50',  text: 'text-amber-200',  glow: 'hover:shadow-[0_0_40px_rgba(251,191,36,0.35)] hover:border-amber-400/75',  iconGlow: 'drop-shadow(0 0 6px rgba(251,191,36,0.7))'  },
  indigo: { border: 'border-indigo-500/55', bg: 'bg-indigo-950/50', text: 'text-indigo-200', glow: 'hover:shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:border-indigo-400/75', iconGlow: 'drop-shadow(0 0 6px rgba(99,102,241,0.7))'  },
  purple: { border: 'border-purple-500/55', bg: 'bg-purple-950/50', text: 'text-purple-200', glow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] hover:border-purple-400/75', iconGlow: 'drop-shadow(0 0 6px rgba(168,85,247,0.7))'  },
  cyan:   { border: 'border-cyan-500/55',   bg: 'bg-cyan-950/50',   text: 'text-cyan-200',   glow: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.35)] hover:border-cyan-400/75',   iconGlow: 'drop-shadow(0 0 6px rgba(6,182,212,0.7))'   },
};

export const FloorPlan: React.FC<FloorPlanProps> = ({
  phase,
  setActiveSearchRoomId,
  scriptId,
}) => {
  // 🌟 依 scriptId 動態選擇地圖區域與場景描述（fallback 到劇本 1）
  const zones = ZONES_BY_SCRIPT[scriptId] ?? ZONES_BY_SCRIPT[1];
  const sceneInfo = SCENE_INFO_BY_SCRIPT[scriptId] ?? SCENE_INFO_BY_SCRIPT[1];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 氛圍漸層背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(127,29,29,0.08) 0%, transparent 65%), radial-gradient(ellipse at 20% 80%, rgba(88,28,135,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(22,78,99,0.06) 0%, transparent 50%)',
        }}
      />

      {/* 左上 dock：場景資訊卡 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-6 left-6 z-30 max-w-xs"
      >
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.1)] overflow-hidden">

          <div className="px-5 py-3 border-b border-slate-500/50" style={{ background: 'linear-gradient(135deg, rgba(71,85,105,0.6) 0%, rgba(30,41,59,0.4) 100%)' }}>
            <p className="text-cyan-400 text-[10px] tracking-[0.5em] uppercase font-mono mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
              {sceneInfo.floor}
            </p>
            <h3 className="text-white font-bold text-sm font-serif tracking-wide">
              {sceneInfo.title}
            </h3>
          </div>

          <div className="px-5 py-4">
            <p className="text-slate-200 text-xs leading-relaxed font-serif drop-shadow-sm">
              {sceneInfo.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 平面圖容器：佔滿全頁，flex 置中，底部讓出計時器空間 */}
      <div className="absolute flex items-center justify-center" style={{ inset: 0, bottom: '80px' }}>
        <div className="relative w-full max-w-3xl h-full max-h-[560px] min-h-[380px]" style={{ marginLeft: '-160px' }}>
          {/* 動態渲染區域 */}
          {zones.map((zone, i) => {
            const accent = accentMap[zone.accent];
            const Icon = zone.iconName;
            const clickable = phase === 'game_search';

            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: 'easeOut' }}
                onClick={() => clickable && setActiveSearchRoomId(zone.id)}
                className={cn(
                  'absolute rounded-2xl border backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center text-center px-3 py-3',
                  accent.border,
                  accent.bg,
                  accent.glow,
                  clickable
                    ? 'cursor-pointer hover:scale-[1.05] hover:-translate-y-1.5'
                    : 'cursor-not-allowed opacity-60'
                )}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                <Icon
                  size={24}
                  className={cn('mb-1.5 transition-all duration-300', accent.text)}
                  style={{ filter: accent.iconGlow }}
                />
                <h4 className={cn('font-bold text-sm leading-tight tracking-wide', accent.text)}>
                  {zone.name}
                </h4>
                <p className="text-slate-400/70 text-[10px] mt-1 font-serif tracking-wider">
                  {zone.subtitle}
                </p>
                {clickable && (
                  <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};