import React, { useState } from 'react';
import { MessageSquareQuote, ChevronDown, ChevronLeft, CheckCircle } from 'lucide-react';
import { FRAMEWORK_CATEGORIES, Framework, FrameworkCategory } from '../data/frameworks';

interface SpeechHelperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: any) => void;
  meetingStage: string;
}

// ── 顏色對應（淡色系） ───────────────────────────────────────
const STEP_COLORS = [
  { bg: 'bg-rose-50',    border: 'border-rose-200',    num: 'bg-rose-400 text-white',    label: 'text-rose-700',    cue: 'text-rose-600'    },
  { bg: 'bg-amber-50',   border: 'border-amber-200',   num: 'bg-amber-400 text-white',   label: 'text-amber-700',   cue: 'text-amber-600'   },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', num: 'bg-emerald-500 text-white', label: 'text-emerald-700', cue: 'text-emerald-600' },
  { bg: 'bg-blue-50',    border: 'border-blue-200',    num: 'bg-blue-400 text-white',    label: 'text-blue-700',    cue: 'text-blue-600'    },
];

export const SpeechHelperPanel: React.FC<SpeechHelperPanelProps> = ({
  isOpen,
  onClose,
  meetingStage,
}) => {
  // 三層狀態：目標類別 → 框架
  const [selectedCategory, setSelectedCategory] = useState<FrameworkCategory | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  if (!isOpen) return null;

  // 過濾掉私聊/盟友（若有）
  const categories = FRAMEWORK_CATEGORIES.filter(
    c => !c.title.includes('私聊') && !c.title.includes('盟友')
  );

  // ── 視圖 1：選擇發言目標 ──────────────────────────────────
  if (!selectedCategory) {
    return (
      <PanelShell onClose={onClose}>
        <div className="p-5">
          <p className="text-center text-slate-500 text-sm font-semibold mb-5 tracking-wider uppercase">
            你現在想做什麼？
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {categories.map(cat => {
              const Icon = cat.iconName;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setSelectedFramework(null); }}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all text-left shadow-sm hover:shadow-md group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bgColor} group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className={cat.color} />
                  </div>
                  <span className="font-bold text-slate-700 text-base leading-snug">{cat.title}</span>
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
        <div className="p-5">
          {/* 麵包屑 */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-semibold mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> 返回
          </button>

          {/* 目標標題 */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 ${selectedCategory.bgColor} border ${selectedCategory.borderColor}`}>
            <Icon size={20} className={selectedCategory.color} />
            <span className={`font-bold text-base ${selectedCategory.color}`}>{selectedCategory.title}</span>
          </div>

          <p className="text-slate-500 text-sm font-semibold mb-3 tracking-wider uppercase">選擇發言框架</p>

          <div className="flex flex-col gap-3">
            {selectedCategory.frameworks.map(fw => (
              <button
                key={fw.name}
                onClick={() => setSelectedFramework(fw)}
                className="text-left px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-800 text-lg mb-1">{fw.name}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{fw.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0 mt-0.5">
                    {fw.steps.map((s, i) => (
                      <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-lg ${STEP_COLORS[i % STEP_COLORS.length].num}`}>
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
      <div className="p-5">
        {/* 麵包屑 */}
        <button
          onClick={() => setSelectedFramework(null)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-semibold mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> 換框架
        </button>

        {/* 框架名稱 */}
        <div className="mb-5 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200">
          <p className="font-black text-slate-800 text-lg">{selectedFramework.name}</p>
          <p className="text-slate-500 text-sm mt-0.5">{selectedFramework.desc}</p>
        </div>

        {/* 步驟卡片 */}
        <div className="flex gap-3">
          {selectedFramework.steps.map((step, i) => {
            const c = STEP_COLORS[i % STEP_COLORS.length];
            return (
              <div
                key={i}
                className={`flex-1 rounded-2xl border-2 ${c.bg} ${c.border} p-4 flex flex-col gap-2 min-w-0`}
              >
                {/* 步驟編號 badge */}
                <span className={`self-start text-xs font-black px-2.5 py-1 rounded-lg ${c.num} tracking-wide`}>
                  {step.name.split(' ')[0]}
                </span>
                {/* 步驟全名 */}
                <p className={`font-black text-base leading-tight ${c.label}`}>
                  {step.name.split(' ').slice(1).join(' ') || step.name}
                </p>
                {/* 提示文字 — 大且明顯 */}
                <p className={`text-sm leading-relaxed font-medium ${c.cue} mt-auto`}>
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
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-5xl shadow-[0_-8px_40px_rgba(0,0,0,0.18)] transition-all duration-300">
      <div className="bg-white border-2 border-slate-200 border-b-0 rounded-t-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-black text-slate-700 flex items-center gap-2 tracking-wide">
            <MessageSquareQuote size={18} className="text-indigo-500" />
            發言結構助手
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <ChevronDown size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}