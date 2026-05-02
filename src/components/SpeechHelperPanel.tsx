import React, { useState } from 'react';
import { 
  X, MessageSquareQuote, ArrowLeft, Trash2, GripHorizontal, CheckCircle2
} from 'lucide-react';
import { FRAMEWORK_CATEGORIES, Framework } from '../data/frameworks';

// 定義拖曳進來的項目格式
export interface DroppedItem {
  id: string;
  type: 'clue' | 'note' | 'timeline' | 'text';
  content: string; 
}

interface SpeechHelperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: DroppedItem) => void;
}

export const SpeechHelperPanel: React.FC<SpeechHelperPanelProps> = ({ 
  isOpen, 
  onClose,
  onItemClick
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeFramework, setActiveFramework] = useState<Framework | null>(null); // 👈 加上型別
  
  // 結構 HUD 狀態
  const [activeSpeechStep, setActiveSpeechStep] = useState<number>(0);
  const [assignedItems, setAssignedItems] = useState<Record<number, DroppedItem[]>>({});

  if (!isOpen) return null;

  const handleSelectFramework = (framework: any) => {
    setActiveFramework(framework);
    setActiveSpeechStep(0);
    setAssignedItems({});
  };

  const handleBackToMenu = () => {
    setActiveFramework(null);
  };

  // 處理拖曳放下
  const handleDropItem = (stepIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const item: DroppedItem = JSON.parse(dataStr);
      
      setAssignedItems(prev => {
        const newState = { ...prev };
        // 確保同一個道具不會重複出現在多個框格
        Object.keys(newState).forEach(key => {
          newState[Number(key)] = newState[Number(key)].filter(i => i.id !== item.id);
        });
        newState[stepIdx] = [...(newState[stepIdx] || []), item];
        return newState;
      });
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  const removeAssignedItem = (stepIdx: number, itemId: string) => {
    setAssignedItems(prev => ({
      ...prev,
      [stepIdx]: prev[stepIdx].filter(i => i.id !== itemId)
    }));
  };

  return (
    <div className="w-[25%] min-w-[320px] bg-slate-900 border-l border-slate-700 flex flex-col transition-all duration-300 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] h-full overflow-hidden">
      
      {/* 頭部標題 */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquareQuote size={20} className="text-indigo-400" />
          發言結構助手
        </h3>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* =========================================
            視圖 1：選擇交涉目標與框架
        ========================================== */}
        {!activeFramework && (
          <div className="p-5 space-y-6">
            <div className="text-sm text-slate-400 mb-2">請選擇你當前的交涉目標：</div>
            
            <div className="space-y-3">
              {FRAMEWORK_CATEGORIES.map(category => {
                const isExpanded = expandedCategory === category.id;
                const Icon = category.iconName;
                return (
                  <div key={category.id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? category.borderColor + ' bg-slate-800/50' : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'}`}>
                    
                    <button 
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className={`p-2 rounded-lg ${category.bgColor} ${category.color}`}>
                        <Icon size={20} />
                      </div>
                      <span className="font-bold text-slate-200 flex-1">{category.title}</span>
                      <span className="text-slate-500 text-sm">{isExpanded ? '▼' : '▶'}</span>
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-2 border-t border-slate-700/50 mt-1">
                        {category.frameworks.map((fw, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-indigo-500 transition-colors group">
                            <h4 className="font-bold text-indigo-300 text-sm mb-1">{fw.name}</h4>
                            <p className="text-xs text-slate-400 mb-3">{fw.desc}</p>
                            <button 
                              onClick={() => handleSelectFramework(fw)}
                              className="w-full py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 rounded text-xs font-bold transition-all"
                            >
                              載入此結構
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            視圖 2：結構特徵鎖定 HUD (拖曳填空區)
        ========================================== */}
        {activeFramework && (
          <div className="flex flex-col h-full absolute inset-0 bg-slate-900">
            {/* HUD Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3 shrink-0">
              <button 
                onClick={handleBackToMenu}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-0.5">ACTIVE FRAMEWORK</div>
                <h4 className="font-bold text-white text-sm leading-tight">{activeFramework.name}</h4>
              </div>
            </div>

            {/* 說明列 */}
            <div className="px-5 py-3 bg-indigo-950/30 border-b border-indigo-900/50 text-xs text-indigo-200 flex items-center gap-2 shrink-0">
              <GripHorizontal size={14} className="shrink-0 opacity-70" />
              你可以從左側將線索、筆記或時間線拖曳至下方的對應框格中。
            </div>

            {/* HUD 節點列表 */}
            <div className="p-5 flex-1 overflow-y-auto relative">
              {/* 垂直連線 */}
              <div className="absolute left-[33px] top-8 bottom-8 w-px bg-slate-700" />
              
              <div className="space-y-6">
                {activeFramework.steps.map((step: any, idx: number) => {
                  const isActive = activeSpeechStep === idx;
                  const isPast = activeSpeechStep > idx;
                  const itemsInSlot = assignedItems[idx] || [];

                  return (
                    <div 
                      key={idx}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-900/30'); }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('bg-indigo-900/30')}
                      onDrop={(e) => { e.currentTarget.classList.remove('bg-indigo-900/30'); handleDropItem(idx, e); }}
                      onClick={() => setActiveSpeechStep(idx)}
                      className={`relative pl-12 cursor-pointer transition-all duration-300 ${
                        isActive ? 'opacity-100 scale-100' : 'opacity-60 hover:opacity-100 scale-95'
                      }`}
                    >
                      {/* 圓形節點 */}
                      <div className={`absolute left-0 top-1 w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center bg-slate-900 transition-colors z-10 ${
                        isActive ? 'border-indigo-400 text-indigo-400 bg-indigo-950/50' : 
                        isPast ? 'border-emerald-500 text-emerald-500 bg-slate-900' : 'border-slate-600 text-slate-500'
                      }`}>
                        {isPast ? <CheckCircle2 size={14} /> : <span className="text-xs font-mono">{idx + 1}</span>}
                      </div>

                      {/* 節點內容 */}
                      <div className={`p-4 rounded-xl border transition-colors ${
                        isActive ? 'bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-slate-800/50 border-slate-700'
                      }`}>
                        <h5 className={`font-bold text-sm mb-1 ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>{step.name}</h5>
                        <p className={`text-xs leading-relaxed mb-3 ${isActive ? 'text-indigo-200/80' : 'text-slate-500'}`}>{step.cue}</p>
                        
                        {/* 拖曳放置區 (Drop Zone) */}
                        <div className={`min-h-[40px] rounded-lg border-2 p-2 flex flex-col gap-2 transition-all ${
                          itemsInSlot.length === 0 
                            ? (isActive ? 'border-dashed border-indigo-500/40 bg-indigo-950/30' : 'border-dashed border-slate-700 bg-slate-900/50') 
                            : 'border-solid border-slate-600 bg-slate-900/80'
                        }`}>
                          {itemsInSlot.length === 0 ? (
                            <span className={`text-[10px] text-center my-auto ${isActive ? 'text-indigo-400/70' : 'text-slate-600'}`}>
                              [ 將線索拖曳至此處 ]
                            </span>
                          ) : (
                            itemsInSlot.map(item => (
                              <div 
                                key={item.id}
                                // 👇 外層卡片點擊：觸發跳轉導航
                                onClick={() => onItemClick && onItemClick(item)}
                                className="flex items-center gap-2 bg-slate-800 border border-slate-600 p-2 rounded-md hover:border-indigo-500 hover:bg-slate-800/80 group transition-colors cursor-pointer"
                                title="點擊跳轉至此線索"
                              >
                                <div className={`w-1.5 h-full self-stretch rounded-full ${
                                  item.type === 'clue' ? 'bg-cyan-500' : 
                                  item.type === 'note' ? 'bg-yellow-500' : 
                                  item.type === 'timeline' ? 'bg-purple-500' : 'bg-emerald-500'
                                }`} />
                                <span className="text-xs text-slate-300 flex-1 line-clamp-2 select-none">{item.content}</span>
                                
                                {/* 👇 獨立的垃圾桶按鈕：只有點它才會刪除 */}
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); // 阻止點擊事件往上傳給外層卡片
                                    removeAssignedItem(idx, item.id); 
                                  }}
                                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="從結構中移除"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};