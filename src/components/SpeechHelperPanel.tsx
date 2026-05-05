import React, { useState } from 'react';
import { X, MessageSquareQuote, Trash2, GripHorizontal, ChevronDown, Save, CheckCircle } from 'lucide-react';
import { FRAMEWORK_CATEGORIES } from '../data/frameworks';

export interface DroppedItem {
  id: string;
  type: 'clue' | 'note' | 'timeline' | 'text';
  content: string; 
}

interface SpeechHelperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: DroppedItem) => void;
  meetingStage: string; 
}

// 🌟 定義儲存狀態的型別
interface CategoryState {
  slotSelections: string[];
  assignedItems: Record<number, DroppedItem[]>;
  customTexts: Record<number, string>;
}

export const SpeechHelperPanel: React.FC<SpeechHelperPanelProps> = ({ 
  isOpen, 
  onClose,
  onItemClick,
  meetingStage
}) => {
  // 正在檢視的交涉目標
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  // 🌟 核心：用一個物件(Record)來分開記憶每一個目標(Category ID)的專屬資料！
  const [savedStates, setSavedStates] = useState<Record<string, CategoryState>>({});
  
  // 目前編輯區的暫存狀態
  const [slotSelections, setSlotSelections] = useState<string[]>(['', '', '', '']);
  const [assignedItems, setAssignedItems] = useState<Record<number, DroppedItem[]>>({ 0: [], 1: [], 2: [], 3: [] });
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({ 0: '', 1: '', 2: '', 3: '' });

  if (!isOpen) return null;

  // 1. 點擊進入分類時，載入專屬該分類的資料
  const handleEnterCategory = (category: any) => {
    setSelectedCategory(category);
    const saved = savedStates[category.id];
    if (saved) {
      // 如果有存過，就把之前的心血載入回來
      setSlotSelections(saved.slotSelections);
      setAssignedItems(saved.assignedItems);
      setCustomTexts(saved.customTexts);
    } else {
      // 否則清空成預設狀態，保證乾淨，不會連通到其他目標
      setSlotSelections(['', '', '', '']);
      setAssignedItems({ 0: [], 1: [], 2: [], 3: [] });
      setCustomTexts({ 0: '', 1: '', 2: '', 3: '' });
    }
  };

  // 2. 點擊「修改目標」退回選單時，自動幫玩家儲存目前的分類
  const handleBackToMenu = () => {
    if (selectedCategory) {
      setSavedStates(prev => ({
        ...prev,
        [selectedCategory.id]: { slotSelections, assignedItems, customTexts }
      }));
    }
    setSelectedCategory(null);
  };

  // 3. 手動點擊「儲存」
  const handleSave = () => {
    if (selectedCategory) {
      setSavedStates(prev => ({
        ...prev,
        [selectedCategory.id]: { slotSelections, assignedItems, customTexts }
      }));
      setSaveStatus('✅ 此目標結構已獨立儲存！');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // 4. 關閉面板時也自動儲存 (防止玩家忘記存)
  const handleClose = () => {
    if (selectedCategory) {
      setSavedStates(prev => ({
        ...prev,
        [selectedCategory.id]: { slotSelections, assignedItems, customTexts }
      }));
    }
    onClose();
  };

  // 檢查該分類是否已經有填寫資料，用來顯示綠色小勾勾
  const checkHasSavedData = (catId: string) => {
    const s = savedStates[catId];
    if (!s) return false;
    const hasSlots = s.slotSelections.some(v => v !== '');
    const hasText = Object.values(s.customTexts).some(v => v !== '');
    const hasItems = Object.values(s.assignedItems).some(arr => arr.length > 0);
    return hasSlots || hasText || hasItems;
  };

  const handleDropItem = (stepIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const item: DroppedItem = JSON.parse(dataStr);
      
      setAssignedItems(prev => {
        const newState = { ...prev };
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

  const renderItemContent = (item: DroppedItem) => {
    if (item.type === 'timeline') {
      const match = item.content.match(/\[(.*?)\]/);
      return match ? match[1] : item.content;
    }
    if (item.type === 'clue') {
      return item.content.replace('[線索] ', '');
    }
    return item.content;
  };

  const getCueForStep = (stepName: string) => {
    if (!stepName || !selectedCategory) return '';
    for (const fw of selectedCategory.frameworks || []) {
      const step = fw.steps?.find((s: any) => s.name === stepName);
      if (step) return step.cue;
    }
    return '';
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-6xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 border-b-0 rounded-t-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquareQuote size={18} className="text-indigo-400" />
            發言結構助手
          </h3>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* 視圖 1：選擇交涉目標 (單選列表) */}
        {!selectedCategory ? (
          <div className="p-4">
            <h4 className="text-center text-slate-400 mb-4 text-sm font-bold tracking-widest">請選擇你當前的發言交涉目標</h4>
            <div className="flex justify-center gap-4 flex-wrap">
              {FRAMEWORK_CATEGORIES.filter(c => !c.title.includes('私聊') && !c.title.includes('盟友')).map(category => {
                const Icon = category.iconName;
                const hasSaved = checkHasSavedData(category.id); // 🌟 檢查是否有存檔
                
                return (
                  <button 
                    key={category.id} 
                    onClick={() => handleEnterCategory(category)}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${category.bgColor} ${category.borderColor} bg-opacity-20`}
                  >
                    {/* 🌟 UX 小驚喜：如果有存檔過，右上角會顯示綠色小勾勾！ */}
                    {hasSaved && (
                      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                        <CheckCircle size={12} />
                      </span>
                    )}
                    <Icon size={20} className={category.color} />
                    <span className="font-bold text-slate-200 text-sm whitespace-nowrap">{category.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* 視圖 2：四個結構編輯框 */
          <div className="p-4 bg-slate-900">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleBackToMenu} // 🌟 點擊返回時自動儲存
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  修改交涉目標
                </button>
                <span className="text-indigo-300 text-sm font-bold flex items-center gap-1.5 bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-500/30">
                  <selectedCategory.iconName size={16} /> {selectedCategory.title}
                </span>
              </div>
              
              {/* 右側的儲存按鍵與狀態提示 */}
              <div className="flex items-center gap-3">
                {saveStatus && (
                  <span className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 animate-pulse">
                    <CheckCircle size={16} /> {saveStatus}
                  </span>
                )}
                <button
                  onClick={handleSave} // 🌟 手動儲存按鍵
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center gap-2 border border-emerald-500 hover:scale-105 active:scale-95"
                >
                  <Save size={16} /> 儲存目前結構
                </button>
              </div>
            </div>

            <div className="flex gap-3 h-[220px]">
              {[0, 1, 2, 3].map(idx => {
                const isEmpty = assignedItems[idx].length === 0 && !customTexts[idx] && !slotSelections[idx];
                if (meetingStage === 'round_robin' && isEmpty) return null;

                return (
                  <div 
                    key={idx}
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-inner"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-900/20'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-900/20'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-900/20'); handleDropItem(idx, e); }}
                  >
                    <div className="bg-slate-800 p-2 border-b border-slate-700">
                      <select
                        value={slotSelections[idx]}
                        onChange={(e) => {
                          const newSels = [...slotSelections];
                          newSels[idx] = e.target.value;
                          setSlotSelections(newSels);
                        }}
                        className="w-full bg-slate-900 border border-slate-600 text-indigo-300 font-bold text-sm outline-none focus:border-indigo-500 rounded p-1"
                      >
                        <option value="">-- 請選擇想放入的結構 --</option>
                        {selectedCategory.frameworks?.map((fw: any) => (
                          <optgroup key={fw.name} label={fw.name}>
                            {fw.steps?.map((step: any) => (
                              <option key={step.name} value={step.name}>{step.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {slotSelections[idx] && (
                        <div className="mt-1 text-[10px] text-slate-400 truncate px-1">
                          {getCueForStep(slotSelections[idx])}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {assignedItems[idx].length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 border border-dashed border-slate-600 rounded-lg">
                          <GripHorizontal size={20} className="mb-1" />
                          <span className="text-xs font-medium">拖曳線索/時間至此</span>
                        </div>
                      ) : (
                        assignedItems[idx].map(item => (
                          <div 
                            key={item.id}
                            onClick={() => onItemClick && onItemClick(item)}
                            className="relative group bg-slate-900 border border-slate-600 p-2 rounded-lg hover:border-indigo-500 cursor-pointer shadow-sm transition-colors"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                              item.type === 'clue' ? 'bg-cyan-500' : 
                              item.type === 'note' ? 'bg-yellow-500' : 
                              item.type === 'timeline' ? 'bg-purple-500' : 'bg-emerald-500'
                            }`} />
                            <div className="text-xs text-slate-300 pl-2 leading-relaxed font-medium line-clamp-3">
                              {renderItemContent(item)}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeAssignedItem(idx, item.id); }}
                              className="absolute top-1 right-1 p-1 text-slate-500 hover:text-white hover:bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-700 bg-slate-900/80">
                      <textarea 
                        value={customTexts[idx]}
                        onChange={(e) => setCustomTexts(prev => ({...prev, [idx]: e.target.value}))}
                        placeholder="若有長文本，可直接複製貼上於此..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-indigo-500 resize-none h-12 placeholder-slate-500 shadow-inner"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};