import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, MessageSquare, GitMerge, ChevronRight, 
  CheckCircle2, Circle, Search, Users,
} from 'lucide-react';
import { Evidence } from '../gameData';
import { cn } from '../types';

interface SelfReflectionProps {
  transcript: any[];
  clues: Evidence[]; // 這裡接收 App 傳來的 allCollectedEvidence
  onComplete: (data: any) => void;
}

interface MenuCardProps {
  icon: React.ReactElement<{ size?: number }>;
  title: string;
  desc: string;
  onClick: () => void;
}

export function SelfReflectionScreen({ transcript, clues, onComplete }: SelfReflectionProps) {
  const [subStep, setSubStep] = useState<'menu' | 'cognitive' | 'clarity' | 'coherence'>('menu');
  
  // 🌟 新增：紀錄勾選的證據 ID
  const [selectedClueIds, setSelectedClueIds] = useState<string[]>([]);

  const toggleClue = (id: string) => {
    setSelectedClueIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (subStep === 'menu') {
    return (
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-black mb-8 text-white">剛才的討論中，你想提升哪方面的表達能力？</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MenuCard 
            icon={<Brain />} title="認知負荷" 
            desc="聽你說話的人，需要一次接收很多資訊嗎？"
            onClick={() => setSubStep('cognitive')}
          />
          <MenuCard 
            icon={<MessageSquare />} title="語意明確性" 
            desc="會讓聽眾無法直接理解或誤解你的意思嗎？"
            onClick={() => setSubStep('clarity')}
          />
          <MenuCard 
            icon={<GitMerge />} title="結構及連貫性" 
            desc="話題是否跳躍、分散，缺乏層次感？"
            onClick={() => setSubStep('coherence')}
          />
        </div>
      </div>
    );
  }

  // 以「結構及連貫性」子頁面為例
  if (subStep === 'coherence') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 bg-slate-900 p-8 rounded-3xl border border-slate-700 max-w-2xl mx-auto">
        <div className="border-l-4 border-indigo-500 pl-4">
          <h3 className="text-2xl font-bold text-white">結構連貫性檢核 (RST)</h3>
          <p className="text-slate-400">請嘗試將你的發言進行「遞迴式向上建構」。</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <label className="text-indigo-400 text-xs font-black uppercase tracking-wider">頂層：動機/結論 (Root)</label>
            <textarea className="w-full bg-transparent p-2 text-white outline-none" placeholder="你的核心觀點是？" rows={2} />
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <label className="text-emerald-400 text-xs font-black uppercase tracking-wider">中層：行為/邏輯 (Branch)</label>
            <textarea className="w-full bg-transparent p-2 text-white outline-none" placeholder="支撐結論的邏輯行為？" rows={2} />
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <label className="text-amber-400 text-xs font-black uppercase tracking-wider">底層：證據/實體 (Leaf)</label>
            <textarea className="w-full bg-transparent p-2 text-white outline-none" placeholder="具體的證物或線索？" rows={2} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. 引用線索勾選區 (左側/上方) */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-indigo-400 font-black mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Search size={14} /> 引用線索 (多選)
            </p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {clues.length > 0 ? (
                clues.map((c) => {
                  const isSelected = selectedClueIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleClue(c.id)}
                      className={cn(
                        "text-[11px] px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5",
                        isSelected 
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-lg" 
                          : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500"
                      )}
                    >
                      {isSelected ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {c.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-[11px] text-slate-500 italic">尚未收集任何證據...</p>
              )}
            </div>
          </div>

          {/* 2. 他人回應選擇區 (右側/下方) - 把它加回來了！ */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-indigo-400 font-black mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Users size={14} /> 他人回應
            </p>
            <div className="relative">
              <select 
                className="w-full bg-slate-700/50 text-sm text-slate-200 p-3 rounded-xl border border-slate-600 outline-none focus:border-indigo-500 appearance-none transition-all"
                onChange={(e) => {/* 這裡可以紀錄玩家選擇的回應類型 */}}
              >
                <option value="support">有人支持我的論點</option>
                <option value="rebut">有人反駁/質疑我的論點</option>
                <option value="none">沒有人針對我的論點回應</option>
                <option value="unsure">不確定/話題被帶走</option>
              </select>
              {/* 下拉選單小箭頭 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 italic">
              提示：這有助於評估你的「影響力」與「說服力」。
            </p>
          </div>
        </div>

        <button 
          onClick={onComplete}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/20"
        >
          完成檢核
        </button>
      </motion.div>
    );
  }

  return (
    <div className="text-white text-center">
      <p>此類別開發中...</p>
      <button onClick={() => setSubStep('menu')} className="mt-4 text-indigo-400">返回</button>
    </div>
  );
}

// ── 子組件 ────────────────────────────────────────────────

function MenuCard({ icon, title, desc, onClick }: MenuCardProps) {
  return (
    <button onClick={onClick} className="p-8 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-3xl transition-all group text-left">
      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {/* 修復 cloneElement 型別問題 */}
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      <div className="mt-6 flex items-center text-indigo-400 font-bold text-sm">
        開始檢核 <ChevronRight size={16} />
      </div>
    </button>
  );
}