import React, { useState } from 'react';
import { MessageSquareQuote, ChevronDown, ChevronLeft } from 'lucide-react';
import { FRAMEWORK_CATEGORIES, Framework, FrameworkCategory } from '../data/frameworks';

interface SpeechHelperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: any) => void;
  meetingStage: string;
}

// ── 暖色深色系（低飽和、高亮度） ─────────────────────────────
const STEP_COLORS = [
  {
    bg: 'bg-[#3a2a1e]',
    border: 'border-[#6b3e26]/60',
    num: 'bg-[#c27a4a] text-[#1a0e08]',
    label: 'text-[#d4956a]',
    cue: 'text-[#f2d5bc]',
  },
  {
    bg: 'bg-[#2e2a18]',
    border: 'border-[#5c5020]/60',
    num: 'bg-[#b09840] text-[#150f00]',
    label: 'text-[#c8b05a]',
    cue: 'text-[#ede3b8]',
  },
  {
    bg: 'bg-[#1e2e28]',
    border: 'border-[#2d5040]/60',
    num: 'bg-[#4a9070] text-[#0a1810]',
    label: 'text-[#70c4a0]',
    cue: 'text-[#bae8d4]',
  },
  {
    bg: 'bg-[#1e2438]',
    border: 'border-[#2d3a60]/60',
    num: 'bg-[#4a68b0] text-[#080e1c]',
    label: 'text-[#7090d8]',
    cue: 'text-[#bccdf0]',
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
          <p className="text-center text-slate-400 text-xs font-semibold mb-4 tracking-widest uppercase">
            你現在想做什麼？
          </p>
          <div className="grid grid-cols-1 gap-2">
            {categories.map(cat => {
              const Icon = cat.iconName;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setSelectedFramework(null); }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-700/60 transition-all text-left group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat.bgColor} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={cat.color} />
                  </div>
                  <span className="font-bold text-slate-200 text-sm leading-snug">{cat.title}</span>
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
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold mb-3 transition-colors"
          >
            <ChevronLeft size={14} /> 返回
          </button>

          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-4 ${selectedCategory.bgColor} border ${selectedCategory.borderColor}`}>
            <Icon size={18} className={selectedCategory.color} />
            <span className={`font-bold text-sm ${selectedCategory.color}`}>{selectedCategory.title}</span>
          </div>

          <p className="text-slate-500 text-xs font-semibold mb-2.5 tracking-widest uppercase">選擇發言框架</p>

          <div className="flex flex-col gap-2.5">
            {selectedCategory.frameworks.map(fw => (
              <button
                key={fw.name}
                onClick={() => setSelectedFramework(fw)}
                className="text-left px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-700/60 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-100 text-base mb-1">{fw.name}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{fw.desc}</p>
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
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold mb-3 transition-colors"
        >
          <ChevronLeft size={14} /> 換框架
        </button>

        <div className="mb-4 px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
          <p className="font-black text-slate-100 text-base">{selectedFramework.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">{selectedFramework.desc}</p>
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
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-5xl shadow-[0_-8px_40px_rgba(0,0,0,0.4)] transition-all duration-300">
      <div className="bg-slate-900 border border-slate-700 border-b-0 rounded-t-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-2.5 border-b border-slate-700/60 flex justify-between items-center bg-slate-800/80">
          <h3 className="text-sm font-black text-slate-300 flex items-center gap-2 tracking-wide">
            <MessageSquareQuote size={16} className="text-indigo-400" />
            發言結構助手
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <ChevronDown size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}