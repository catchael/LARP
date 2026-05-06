import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PRINCIPLES = [
  {
    num: '原則一',
    title: '結論先行',
    en: 'Top-Down Approach',
    accent: '#7F77DD',
    accentBg: '#EEEDFE',
    icon: '⬆',
    body: '在溝通開場的第一句話，就毫不猶豫拋出核心論點或最終建議。這讓聽眾大腦立刻獲得「認知錨點」——即使對話因突發狀況中斷，最重要的訊息已經傳達。在高壓的商業簡報中，高階主管往往只有前 30 秒的注意力，結論先行確保訊息「永不走光」。',
    example: {
      label: '❌ 舊思維',
      bad: '「我研究了市場、分析了競品、做了問卷……所以建議進軍東南亞。」',
      good: '✅ 金字塔：「建議立刻進軍東南亞。原因有三：市場空白、競品弱、技術正好契合。」',
    },
  },
  {
    num: '原則二',
    title: '以上統下',
    en: 'Vertical Relationship',
    accent: '#1D9E75',
    accentBg: '#E1F5EE',
    icon: '↕',
    body: '金字塔每一層級的論點，都必須是下一層所有論點的完整概括。這種「母論點 → 子論點 → 數據/事實」的垂直支撐結構，讓頂層結論擁有無懈可擊的邏輯基石。下層數據存在的唯一目的，是服務上層的次結論；若某個數據無法支撐任何上層論點，它就不該出現在金字塔中。',
    example: {
      label: '📐 結構示範',
      bad: '',
      good: '【次結論】新事業可善用既有優勢\n  ├─ 通路數量顯著高於競爭對手（數據）\n  └─ 核心技術可無縫移植至新事業（事實）',
    },
  },
  {
    num: '原則三',
    title: '歸類分組',
    en: 'Horizontal Relationship (MECE)',
    accent: '#BA7517',
    accentBg: '#FAEEDA',
    icon: '⊞',
    body: '同一層級的論點必須屬於同一邏輯範疇，且符合「相互獨立、完全窮盡」（MECE）原則。根據米勒法則，人腦短期記憶一次能處理的並列資訊在高壓口語環境下往往降至 3–4 個，因此把複雜資訊歸類為少數易理解的群組，是結構化溝通的關鍵步驟。',
    example: {
      label: '🧠 米勒法則應用',
      bad: '',
      good: '把 12 條風險拆成 3 組：\n「財務風險（4條）× 法規風險（4條）× 執行風險（4條）」\n聽眾記住 3 個標題，細節自然落位。',
    },
  },
  {
    num: '原則四',
    title: '邏輯遞進',
    en: 'Logical Progression',
    accent: '#D4537E',
    accentBg: '#FBEAF0',
    icon: '→',
    body: '同一層級的論點不能隨機排列，必須按讓聽眾「順水推舟」的邏輯展開。常見維度：時間順序（過去痛點 → 現在解法 → 未來效益）、結構順序（北區 → 南區）、程度順序（最核心戰略衝擊 → 次要操作細節）。正確的順序讓思維如水流般沿著講者脈絡前進。',
    example: {
      label: '⏱ 時間順序範例',
      bad: '',
      good: '過去：客服電話量每月成長 40%（痛點）\n現在：AI 分流系統解決率 68%（解法）\n未來：預估 Q3 可降低人工成本 35%（效益）',
    },
  },
];

// Pyramid layer shapes (trapezoidal via clip-path polygon %)
const LAYERS = [
  // top → bottom: index 0 = 結論先行 (apex), 3 = 邏輯遞進 (base)
  { clip: 'polygon(27% 0%, 73% 0%, 88% 100%, 12% 100%)', label: '抽象結論', height: '22%' },
  { clip: 'polygon(12% 0%, 88% 0%, 96% 100%, 4% 100%)',  label: '',         height: '24%' },
  { clip: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',  label: '',         height: '26%' },
  { clip: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', label: '具體數據', height: '28%' },
];

export const PyramidPrinciple: React.FC = () => {
  const [active, setActive] = React.useState(0);
  const d = PRINCIPLES[active];

  return (
    <div className="w-full space-y-5">
      {/* Pyramid */}
      <div className="flex gap-6 items-start">
        {/* The pyramid */}
        <div className="flex flex-col-reverse w-52 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200">
          {LAYERS.map((layer, i) => {
            const p = PRINCIPLES[i];
            const isActive = i === active;
            return (
              <motion.div
                key={i}
                style={{
                  clipPath: layer.clip,
                  background: isActive ? p.accent : p.accentBg,
                  cursor: 'pointer',
                  height: layer.height,
                  minHeight: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onClick={() => setActive(i)}
                whileHover={{ opacity: 0.85 }}
              >
                <span
                  className="text-xs font-bold select-none text-center px-2"
                  style={{ color: isActive ? '#fff' : p.accent }}
                >
                  {p.title}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 rounded-2xl border p-5 space-y-3"
            style={{ borderColor: d.accent + '66', background: d.accentBg + 'CC' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: d.accent + '22', color: d.accent }}
              >
                {d.icon}
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: d.accent }}>
                  {d.num}　{d.title}
                </p>
                <p className="text-xs text-slate-500">{d.en}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{d.body}</p>
            <div
              className="rounded-xl p-3 text-xs leading-relaxed space-y-1"
              style={{ borderLeft: `3px solid ${d.accent}`, background: '#fff8' }}
            >
              <p className="font-semibold text-slate-600">{d.example.label}</p>
              {d.example.bad && (
                <p className="text-slate-500 whitespace-pre-line">{d.example.bad}</p>
              )}
              <p className="text-slate-700 whitespace-pre-line">{d.example.good}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom pill nav */}
      <div className="flex gap-3 justify-center flex-wrap">
        {PRINCIPLES.map((p, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: i === active ? p.accent : p.accentBg,
              color: i === active ? '#fff' : p.accent,
              border: `1.5px solid ${p.accent}55`,
            }}
          >
            {p.num}　{p.title}
          </button>
        ))}
      </div>
    </div>
  );
};