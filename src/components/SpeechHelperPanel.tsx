import React, { useState } from 'react';
import { MessageSquareQuote, ChevronDown, ChevronLeft } from 'lucide-react';
import { FRAMEWORK_CATEGORIES, Framework, FrameworkCategory } from '../data/frameworks';

interface SpeechHelperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: any) => void;
  meetingStage: string;
}

// ── 步驟卡片色系（淺暖背板上的中飽和色卡）─────────────────────
// 背板是 #f5ede2（暖米），卡片用各自的淺暖色調，文字向深色走
const STEP_COLORS = [
  {
    bg: 'bg-[#fce8d8]',
    border: 'border-[#e8b99a]',
    num: 'bg-[#b85c2a] text-white',
    label: 'text-[#7a3a18]',
    cue: 'text-[#3d1a08]',
  },
  {
    bg: 'bg-[#fdf0d0]',
    border: 'border-[#ddc87a]',
    num: 'bg-[#a07818] text-white',
    label: 'text-[#6b5010]',
    cue: 'text-[#332400]',
  },
  {
    bg: 'bg-[#d8f0e8]',
    border: 'border-[#8ecfb0]',
    num: 'bg-[#2a7a58] text-white',
    label: 'text-[#1a5038]',
    cue: 'text-[#0a2818]',
  },
  {
    bg: 'bg-[#d8e8f8]',
    border: 'border-[#88aad8]',
    num: 'bg-[#2a50a0] text-white',
    label: 'text-[#1a3068]',
    cue: 'text-[#081830]',
  },
];

export const SpeechHelperPanel: React.FC<SpeechHelperPanelProps> = ({
  isOpen,
  onClose,
  meetingStage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FrameworkCategory | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  if (!isOpen) return null;

  const categories = FRAMEWORK_CATEGORIES.filter(
    c => !c.title.includes('私聊') && !c.title.includes('盟友')
  );

  // ── 視圖 1：選擇發言目標 ──────────────────────────────────
  if (!selectedCategory) {
    return (
      <PanelShell onClose={onClose}>
        <div className="p-4">
          <p className="text-center text-[#8a6a50] text-xs font-semibold mb-4 tracking-widest uppercase">
            你現在想做什麼？
          </p>
          <div className="grid grid-cols-1 gap-2">
            {categories.map(cat => {
              const Icon = cat.iconName;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setSelectedFramework(null); }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#d8c4b0] bg-white/60 hover:border-[#b89880] hover:bg-white/80 transition-all text-left group shadow-sm"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat.bgColor} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={cat.color} />
                  </div>
                  <span className="font-bold text-[#3d2810] text-sm leading-snug">{cat.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </PanelShell>
    );
  }

  // ── 視圖 2：選擇框架 ─────────────────────────────────────
  if (!selectedFramework) {
    const Icon = selectedCategory.iconName;
    return (
      <PanelShell onClose={onClose}>
        <div className="p-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 text-[#8a6a50] hover:text-[#3d2810] text-xs font-semibold mb-3 transition-colors"
          >
            <ChevronLeft size={14} /> 返回
          </button>

          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-4 ${selectedCategory.bgColor} border ${selectedCategory.borderColor}`}>
            <Icon size={18} className={selectedCategory.color} />
            <span className={`font-bold text-sm ${selectedCategory.color}`}>{selectedCategory.title}</span>
          </div>

          <p className="text-[#8a6a50] text-xs font-semibold mb-2.5 tracking-widest uppercase">選擇發言框架</p>

          <div className="flex flex-col gap-2.5">
            {selectedCategory.frameworks.map(fw => (
              <button
                key={fw.name}
                onClick={() => setSelectedFramework(fw)}
                className="text-left px-4 py-3.5 rounded-xl border border-[#d8c4b0] bg-white/60 hover:border-[#b89880] hover:bg-white/80 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#2a1808] text-base mb-1">{fw.name}</p>
                    <p className="text-[#7a5a40] text-xs leading-relaxed">{fw.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0 mt-0.5">
                    {fw.steps.map((s, i) => (
                      <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STEP_COLORS[i % STEP_COLORS.length].num}`}>
                        {s.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PanelShell>
    );
  }

  // ── 視圖 3：框架步驟提示卡 ───────────────────────────────
  return (
    <PanelShell onClose={onClose}>
      <div className="p-4">
        <button
          onClick={() => setSelectedFramework(null)}
          className="flex items-center gap-1.5 text-[#8a6a50] hover:text-[#3d2810] text-xs font-semibold mb-3 transition-colors"
        >
          <ChevronLeft size={14} /> 換框架
        </button>

        <div className="mb-4 px-3 py-2.5 rounded-lg bg-white/50 border border-[#d8c4b0]">
          <p className="font-black text-[#2a1808] text-base">{selectedFramework.name}</p>
          <p className="text-[#7a5a40] text-xs mt-0.5">{selectedFramework.desc}</p>
        </div>

        {/* 步驟卡片 */}
        <div className="flex gap-2.5">
          {selectedFramework.steps.map((step, i) => {
            const c = STEP_COLORS[i % STEP_COLORS.length];
            return (
              <div
                key={i}
                className={`flex-1 rounded-xl border ${c.bg} ${c.border} p-3 flex flex-col gap-1.5 min-w-0`}
              >
                {/* 步驟 badge */}
                <span className={`self-start text-[10px] font-black px-2 py-0.5 rounded-md ${c.num} tracking-wide`}>
                  {step.name.split(' ')[0]}
                </span>

                {/* 步驟名（小） */}
                <p className={`font-bold text-xs leading-tight ${c.label}`}>
                  {step.name.split(' ').slice(1).join(' ') || step.name}
                </p>

                {/* 提示文字（大且醒目） */}
                <p className={`text-sm leading-snug font-semibold ${c.cue} mt-1`}>
                  {step.cue}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </PanelShell>
  );
};

// ── 共用外殼 ──────────────────────────────────────────────────
function PanelShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-5xl shadow-[0_-8px_40px_rgba(60,30,10,0.25)] transition-all duration-300">
      <div className="bg-[#f5ede2] border border-[#d8c4b0] border-b-0 rounded-t-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-2.5 border-b border-[#d8c4b0] flex justify-between items-center bg-[#ede0d0]">
          <h3 className="text-sm font-black text-[#3d2810] flex items-center gap-2 tracking-wide">
            <MessageSquareQuote size={16} className="text-amber-700" />
            發言結構助手
          </h3>
          <button
            onClick={onClose}
            className="text-[#8a6a50] hover:text-[#3d2810] hover:bg-[#d8c4b0] p-1.5 rounded-lg transition-colors"
          >
            <ChevronDown size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}