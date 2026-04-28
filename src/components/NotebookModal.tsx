import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Briefcase,
  CircleDot,
  Clock,
  FileText,
  MapPin,
  Plus,
  Search,
  Tag,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { RoomState, User, cn } from '../types';
import { Evidence } from '../gameData';
import { SCRIPTS } from '../data/scripts';
import { CharacterNote } from '../screens/GameMeetingScreen';
import { CharacterTraitsPanel } from '../components/CharacterTraitsPanel';
import { NARRATIONS_SCRIPT1_PROLOGUE, NARRATIONS_SCRIPT1_ACT2 } from '../data/narrations';
import { CHARACTER_PROFILES } from '../data/profileContent';

interface NotebookModalProps {
  isNotebookOpen: boolean;
  setIsNotebookOpen: (v: boolean) => void;
  notebookTab: 'personal' | 'timeline' | 'profiles' | 'backpack' | 'info';
  setNotebookTab: (t: 'personal' | 'timeline' | 'profiles' | 'backpack' | 'info') => void;
  showFullTimeline: boolean;
  setShowFullTimeline: (v: boolean) => void;
  previewScript: typeof SCRIPTS[0] | null;
  roomState: RoomState | null;
  user: User | null;
  timelineNodes: string[];
  setTimelineNodes: React.Dispatch<React.SetStateAction<string[]>>;
  privateCustomNodes: string[]; // 🌟 新增這行
  setPrivateCustomNodes: React.Dispatch<React.SetStateAction<string[]>>; // 🌟 新增這行
  timelineEvents: Record<string, Record<number, string>>;
  setTimelineEvents: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
  selectedTimelineChar: number;
  setSelectedTimelineChar: (n: number) => void;
  newTimeNode: string;
  setNewTimeNode: (v: string) => void;
  selectedNotebookChar: number;
  setSelectedNotebookChar: (n: number) => void;
  characterNotes: CharacterNote[];
  setCharacterNotes: React.Dispatch<React.SetStateAction<CharacterNote[]>>;
  newNote: { time: string; text: string; title: string; clueId: string };
  setNewNote: (n: { time: string; text: string; title: string; clueId: string }) => void;
  expandedNoteId?: string | null;
  setExpandedNoteId?: React.Dispatch<React.SetStateAction<string | null>>;
  infoSubTab: 'personal' | 'other';
  setInfoSubTab: (t: 'personal' | 'other') => void;
  selectedInfoId: string | null;
  setSelectedInfoId: (id: string | null) => void;
  readInfoIds: string[];
  setReadInfoIds: React.Dispatch<React.SetStateAction<string[]>>;
  backpack: Evidence[];
  notebookSelectedEvidence: Evidence | null;
  setNotebookSelectedEvidence: (e: Evidence | null) => void;
  unlockedAdvancedDetails: string[];
  evidenceAssociations: Record<string, number>;
  setEvidenceAssociations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  unlockedCharacterAdvanced: string[];
  onUnlockCharacterAdvanced: (characterName: string) => void;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isNotebookOpen,
  setIsNotebookOpen,
  notebookTab,
  setNotebookTab,
  showFullTimeline,
  setShowFullTimeline,
  previewScript,
  roomState,
  user,
  timelineNodes,
  setTimelineNodes,
  privateCustomNodes,
  setPrivateCustomNodes,
  timelineEvents,
  setTimelineEvents,
  selectedTimelineChar,
  setSelectedTimelineChar,
  newTimeNode,
  setNewTimeNode,
  selectedNotebookChar,
  setSelectedNotebookChar,
  characterNotes,
  setCharacterNotes,
  newNote,
  setNewNote,
  infoSubTab,
  setInfoSubTab,
  selectedInfoId,
  setSelectedInfoId,
  readInfoIds,
  setReadInfoIds,
  backpack,
  notebookSelectedEvidence,
  setNotebookSelectedEvidence,
  unlockedAdvancedDetails,
  unlockedCharacterAdvanced,
  onUnlockCharacterAdvanced,
  evidenceAssociations,
  setEvidenceAssociations,
  expandedNoteId,
  setExpandedNoteId,
}) => {
  if (!isNotebookOpen) return null;

  const handleTimelineChange = (time: string, charIdx: number, text: string) => {    
    setTimelineEvents(prev => ({
      ...prev,
      [time]: {
        ...(prev[time] || {}),
        [charIdx]: text
      }
    }));
  };

  const addTimeNode = () => {
    // 🌟 改為檢查全域與私密節點是否重複，並寫入私密節點
    if (newTimeNode && !timelineNodes.includes(newTimeNode) && !privateCustomNodes.includes(newTimeNode)) {
      setPrivateCustomNodes(prev => [...prev, newTimeNode]);
      setNewTimeNode('');
    }
  };

  // 1. 找出玩家在房間內的真實身分
  const myUser = roomState?.users.find(u => u.email === user?.email);
  const myCharacterIndex = previewScript?.characters.findIndex(c => c.name === myUser?.assignedCharacter) ?? 0;
  const myCharacter = previewScript?.characters[myCharacterIndex];

  // 🌟 將 privateCustomNodes 也加進去動態組合
  const myInitialNodes = myCharacter?.timeline?.map((t: any) => t.time) || [];
  const displayNodes = Array.from(new Set([...timelineNodes, ...myInitialNodes, ...privateCustomNodes])).sort();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-[90vw] max-w-6xl h-[85vh] bg-[#f4f1ea] rounded-r-2xl rounded-l-2xl shadow-2xl flex relative text-slate-800 font-serif"
      >
        {/* Spine */}
        {!(notebookTab === 'timeline' && showFullTimeline) && (
          <div className="absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-[#e6e2d6] via-[#d5d0c3] to-[#e6e2d6] border-x border-[#c8c3b5] z-10 shadow-inner pointer-events-none" />
        )}

        {/* Close Button */}
        <button onClick={() => setIsNotebookOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 z-20">
          <X size={24} />
        </button>

        {/* Tabs */}
        <div className="absolute -left-12 top-12 flex flex-col gap-2 z-0">
          <button onClick={() => setNotebookTab('personal')} className={cn("w-12 h-12 rounded-l-xl font-bold transition-all flex items-center justify-center shadow-md", notebookTab === 'personal' ? "bg-[#f4f1ea] text-slate-800 translate-x-1" : "bg-[#d5d0c3] text-slate-600 hover:bg-[#e6e2d6]")}>
            <UserIcon size={20} />
          </button>
          <button onClick={() => setNotebookTab('profiles')} className={cn("w-12 h-12 rounded-l-xl font-bold transition-all flex items-center justify-center shadow-md", notebookTab === 'profiles' ? "bg-[#f4f1ea] text-slate-800 translate-x-1" : "bg-[#d5d0c3] text-slate-600 hover:bg-[#e6e2d6]")}>
            <Users size={20} />
          </button>
          <button onClick={() => setNotebookTab('timeline')} className={cn("w-12 h-12 rounded-l-xl font-bold transition-all flex items-center justify-center shadow-md", notebookTab === 'timeline' ? "bg-[#f4f1ea] text-slate-800 translate-x-1" : "bg-[#d5d0c3] text-slate-600 hover:bg-[#e6e2d6]")}>
            <Clock size={20} />
          </button>
          <button onClick={() => setNotebookTab('info')} className={cn("w-12 h-12 rounded-l-xl font-bold transition-all flex items-center justify-center shadow-md", notebookTab === 'info' ? "bg-[#f4f1ea] text-slate-800 translate-x-1" : "bg-[#d5d0c3] text-slate-600 hover:bg-[#e6e2d6]")}>
            <FileText size={20} />
          </button>
          <button onClick={() => setNotebookTab('backpack')} className={cn("w-12 h-12 rounded-l-xl font-bold transition-all flex items-center justify-center shadow-md", notebookTab === 'backpack' ? "bg-[#f4f1ea] text-slate-800 translate-x-1" : "bg-[#d5d0c3] text-slate-600 hover:bg-[#e6e2d6]")}>
            <Briefcase size={20} />
          </button>
        </div>

        {/* Content */}
        {notebookTab === 'timeline' && (
          showFullTimeline ? (
            <div className="flex-1 p-10 overflow-auto relative z-0 w-full">
              <div className="flex justify-between items-center mb-6 border-b border-slate-300 pb-2">
                <h2 className="text-2xl font-bold text-slate-800">完整人物時間線</h2>
                <button onClick={() => setShowFullTimeline(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold flex items-center gap-2">
                  <ArrowLeft size={16} /> 返回編輯模式
                </button>
              </div>
              {/* 🌟 還原原本欄寬 (min-w-150)，保留橫向滑軸；textarea 高度自動依字數增長、格內不出滑軸 */}
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-3 border-b-2 border-slate-400 w-24 bg-[#e6e2d6] sticky left-0 z-10">時間</th>
                      {previewScript!.characters.map((c, i) => (
                        <th key={c.name} className="p-3 border-b-2 border-slate-400 min-w-[150px]">{i === myCharacterIndex ? '你' : c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayNodes.map(time => (
                      <tr key={time} className="hover:bg-white/50 transition-colors">
                        <td className="p-3 border-b border-slate-300 font-bold text-slate-600 bg-[#f4f1ea] sticky left-0 z-10 shadow-[1px_0_0_#cbd5e1] align-top">{time}</td>
                        {previewScript!.characters.map((c, i) => (
                          <td key={c.name} className="p-0 border-b border-slate-300 align-top">
                            <textarea
                              ref={el => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                              className="w-full h-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded p-2 outline-none resize-none text-sm transition-all overflow-hidden block"
                              style={{ minHeight: '2.5rem', boxSizing: 'border-box' }}
                              value={
                                timelineEvents[time]?.[i] !== undefined
                                  ? timelineEvents[time][i]
                                  : (i === myCharacterIndex 
                                      ? (previewScript!.characters[i].timeline?.find((t: any) => t.time === time)?.event || '') 
                                      : '')
                              }
                              onChange={(e) => {
                                handleTimelineChange(time, i, e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                              placeholder="..."
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* Left Page: Timeline Axis & Player */}
              <div className="flex-1 p-10 overflow-y-auto relative z-0 border-r border-[#c8c3b5]/50 flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2">時間線管理</h2>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">選擇編輯人物</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewScript!.characters.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTimelineChar(i)}
                        className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all border", selectedTimelineChar === i ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50")}
                      >
                        {i === myCharacterIndex ? '你 (' + c.name + ')' : c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">管理時間節點</h3>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newTimeNode}
                      onChange={e => setNewTimeNode(e.target.value)}
                      placeholder="新增時間 (例: 20:30)"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                    <button onClick={addTimeNode} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
                      <Plus size={20}/>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">新增的時間節點會套用到所有人物的時間線上。</p>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-300">
                  <button
                    onClick={() => setShowFullTimeline(true)}
                    className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Activity size={18} /> 查看完整人物時間線
                  </button>
                </div>
              </div>

              {/* Right Page: Other Characters */}
              <div className="flex-1 p-10 overflow-y-auto relative z-0">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2">
                  {selectedTimelineChar === myCharacterIndex ? '你' : previewScript!.characters[selectedTimelineChar].name} 的時間線
                </h2>
                <div className="space-y-4 relative before:content-[''] before:absolute before:left-[39px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                  {displayNodes.map(time => (
                    <div key={time} className="flex gap-6 items-start relative z-10">
                      <div className="w-20 font-bold text-indigo-600 bg-[#f4f1ea] py-2 text-right relative">
                        {time}
                        <div className="absolute right-[-17px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#f4f1ea]" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                        <textarea
                          ref={el => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = el.scrollHeight + 'px';
                            }
                          }}
                          className="w-full bg-transparent border-none p-3 outline-none resize-none text-slate-700 overflow-hidden"
                          style={{ minHeight: '80px' }}
                          value={
                            timelineEvents[time]?.[selectedTimelineChar] !== undefined
                              ? timelineEvents[time][selectedTimelineChar]
                              : (selectedTimelineChar === myCharacterIndex 
                                  ? (previewScript!.characters[selectedTimelineChar].timeline?.find((t: any) => t.time === time)?.event || '') 
                                  : '')
                          }
                          onChange={(e) => {
                            handleTimelineChange(time, selectedTimelineChar, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder={`輸入 ${selectedTimelineChar === myCharacterIndex ? '你' : previewScript!.characters[selectedTimelineChar].name} 在這個時間點的動向...`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}

        {/*「個人檔案」區塊 */}
        {notebookTab === 'personal' && myCharacter && (
          <>
            {/* 左半頁：基本資訊卡片 */}
            <div className="flex-1 p-10 overflow-y-auto relative z-0 border-r border-[#c8c3b5]/50">
              <h2 className="text-3xl font-bold mb-8 text-slate-800 border-b-2 border-indigo-900/20 pb-4 flex items-center gap-3">
                <UserIcon size={28} className="text-indigo-700" />
                我的專屬檔案
              </h2>

              <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 pointer-events-none" />
                <img src={myCharacter.image} alt={myCharacter.name} className="w-40 h-40 object-cover rounded-xl shadow-md z-10 mx-auto" />
                <div className="z-10 text-center">
                  <h3 className="text-3xl font-bold mb-2 text-slate-800">{myCharacter.name}</h3>
                  <p className="text-indigo-600 font-bold text-lg mb-4">{myCharacter.role}</p>
                </div>
                <div className="z-10 text-slate-600 leading-relaxed text-left border-t border-slate-100 pt-4">
                  {myCharacter.intro}
                </div>
              </div>
            </div>

            {/* 右半頁：私密劇本區塊 */}
            <div className="flex-1 p-10 overflow-y-auto relative z-0">
              <div className="bg-[#f4f1ea] p-8 rounded-2xl border border-[#c8c3b5] shadow-inner min-h-full">
                <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-[#c8c3b5] pb-3">
                  <BookOpen size={24} className="text-slate-600" /> 私密劇本與記憶
                </h4>
                <div className="text-slate-700 leading-loose whitespace-pre-wrap text-lg font-serif">
                  {myCharacter.story || "目前沒有其他專屬劇本內容。"}
                </div>
              </div>
            </div>
          </>
        )}

        {notebookTab === 'profiles' && (
          <>
            {/* Left Page: Character List & Info */}
            <div className="flex-1 p-10 overflow-y-auto relative z-0 border-r border-[#c8c3b5]/50">
              <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2">角色檔案</h2>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {previewScript!.characters.map((c, i) => {
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedNotebookChar(i)}
                      className={cn("px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors", selectedNotebookChar === i ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const char = previewScript!.characters[selectedNotebookChar];
                return (
                  <div className="flex flex-col gap-6">
                    <img src={char.image} alt={char.name} className="w-48 h-48 object-cover rounded-lg shadow-md mx-auto" />
                    <div>
                      <h3 className="text-2xl font-bold text-center mb-1">
                        {selectedNotebookChar === myCharacterIndex ? '你 (' + char.name + ')' : char.name}
                      </h3>
                      <p className="text-indigo-600 font-medium text-center mb-4">{char.role}</p>
                      <p className="text-slate-600 leading-relaxed">{char.intro}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Page: Notes */}
            <div className="flex-1 p-10 overflow-y-auto relative z-0 bg-[#f4f1ea]">
              <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2">調查筆記 - {selectedNotebookChar === myCharacterIndex ? '你' : previewScript!.characters[selectedNotebookChar].name}</h2>
              
              {/* 🌟 1. 角色特徵面板 (加入階段判斷與防重複寫入) */}
              {previewScript && (
                <div className="mb-8">
                  <CharacterTraitsPanel
                    characterName={previewScript.characters[selectedNotebookChar]?.name ?? ''}
                    unlockedCharacters={unlockedCharacterAdvanced}
                    onUnlockAdvanced={onUnlockCharacterAdvanced}
                    canUnlock={
                      roomState?.phase === 'game_search' && 
                      unlockedCharacterAdvanced.length < ((roomState as any)?.currentRound || 1)
                    }

                    onAddTraitToNote={(traitType, content) => {
                      const targetName = previewScript.characters[selectedNotebookChar]?.name;
                      const title = `[${traitType}] ${targetName}`;
                      
                      // 🌟 修改 B：防重複判斷。如果陣列裡已經有這個標題的筆記，就不新增
                      const exists = characterNotes.some(n => n.charIdx === selectedNotebookChar && n.title === title);
                      if (exists) {
                        // 如果已經存在，幫玩家自動把那則筆記展開就好
                        const existingNote = characterNotes.find(n => n.charIdx === selectedNotebookChar && n.title === title);
                        if (existingNote && setExpandedNoteId) setExpandedNoteId(existingNote.id);
                        return; 
                      }

                      // 不存在，則新增筆記
                      const newId = Date.now().toString();
                      setCharacterNotes(prev => [...prev, {
                        id: newId,
                        charIdx: selectedNotebookChar,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        title: title,
                        text: content,
                        clueId: ''
                      }]);
                      if (setExpandedNoteId) setExpandedNoteId(newId);
                    }}
                  />
                </div>
              )}

              {/* 🌟 2. 筆記列表：分離特徵筆記(置頂)與一般筆記 */}
              <div className="space-y-3 mb-8">
                {(() => {
                  // 把目前角色的筆記拉出來
                  const charNotes = characterNotes.filter(n => n.charIdx === selectedNotebookChar);
                  // 篩選出「特徵筆記」
                  const traitNotes = charNotes.filter(n => n.title.startsWith('[基礎特徵]') || n.title.startsWith('[進階特徵]'));
                  // 篩選出「一般筆記」
                  const regularNotes = charNotes.filter(n => !n.title.startsWith('[基礎特徵]') && !n.title.startsWith('[進階特徵]'));

                  return (
                    <>
                      {/* 渲染區塊 A：置頂的特徵筆記 (特製樣式) */}
                      {traitNotes.map(note => {
                        const isExpanded = expandedNoteId === note.id;
                        const isAdvanced = note.title.includes('[進階特徵]');
                        return (
                          <div key={note.id} className={cn("border rounded-xl shadow-sm overflow-hidden transition-all", isAdvanced ? "bg-amber-50 border-amber-300" : "bg-indigo-50 border-indigo-300")}>
                            <button
                              onClick={() => setExpandedNoteId && setExpandedNoteId(isExpanded ? null : note.id)}
                              className="w-full flex justify-between items-center p-4 hover:bg-white/50 transition-colors text-left"
                            >
                              <div className={cn("font-bold text-lg flex items-center gap-2", isAdvanced ? "text-amber-800" : "text-indigo-800")}>
                                <span className={cn("text-sm", isAdvanced ? "text-amber-400" : "text-indigo-400")}>{isExpanded ? '▼' : '▶'}</span>
                                {note.title}
                              </div>
                              <div className="text-xs font-mono opacity-60">{note.time}</div>
                            </button>
                            {isExpanded && (
                              <div className={cn("p-4 pt-0 border-t", isAdvanced ? "border-amber-200" : "border-indigo-200")}>
                                <p className={cn("whitespace-pre-wrap leading-relaxed mt-3 mb-4 text-sm", isAdvanced ? "text-amber-900" : "text-indigo-900")}>{note.text}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* 渲染區塊 B：一般筆記 */}
                      {regularNotes.map(note => {
                        const isExpanded = expandedNoteId === note.id;
                        return (
                          <div key={note.id} className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden transition-all">
                            <button onClick={() => setExpandedNoteId && setExpandedNoteId(isExpanded ? null : note.id)} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors text-left">
                              <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <span className="text-slate-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
                                {note.title || '無標題筆記'}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">{note.time}</div>
                            </button>
                            {isExpanded && (
                              <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mt-3 mb-4 text-sm">{note.text}</p>
                                {note.clueId && backpack.find(b => b.id === note.clueId) && (
                                  <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600 shadow-sm">
                                    <Search size={14} className="text-indigo-600" />
                                    關聯線索：<span className="font-bold">{backpack.find(b => b.id === note.clueId)?.name}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {charNotes.length === 0 && (
                        <div className="text-slate-400 italic text-center p-6 border-2 border-dashed border-slate-300 rounded-xl">尚無關於此人的筆記。</div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* 新增筆記表單 (升級版) */}
              <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
                <h4 className="font-bold text-sm mb-4 text-slate-800 flex items-center gap-2">
                  <Plus size={16} className="text-indigo-600"/> 新增推理筆記
                </h4>

                <input
                  type="text"
                  placeholder="筆記標題 (如：案發時的嫌疑)"
                  value={newNote.title}
                  onChange={e => setNewNote({...newNote, title: e.target.value})}
                  className="w-full mb-3 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-slate-50"
                />

                <div className="flex gap-3 mb-3">
                  <select
                    value={newNote.time}
                    onChange={e => setNewNote({...newNote, time: e.target.value})}
                    className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-slate-50"
                  >
                    <option value="">選擇相關時間點...</option>
                    {displayNodes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <select
                    value={newNote.clueId}
                    onChange={e => setNewNote({...newNote, clueId: e.target.value})}
                    className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-slate-50"
                  >
                    <option value="">-- 無關聯線索 --</option>
                    {backpack.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={newNote.text}
                  onChange={e => setNewNote({...newNote, text: e.target.value})}
                  placeholder="記錄你的發現或推論細節..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-none bg-slate-50 mb-4"
                />

                <button
                  onClick={() => {
                    if (newNote.text || newNote.title) {
                      const newId = Date.now().toString();
                      setCharacterNotes([...characterNotes, { 
                        id: newId, 
                        charIdx: selectedNotebookChar, 
                        time: newNote.time || '未知', 
                        text: newNote.text,
                        title: newNote.title || '新筆記',
                        clueId: newNote.clueId
                      }]);
                      setNewNote({ time: '', text: '', title: '', clueId: '' });
                      if (setExpandedNoteId) setExpandedNoteId(newId); // 儲存後自動展開
                    }
                  }}
                  className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-bold shadow-md"
                >
                  儲存筆記
                </button>
              </div>
            </div>
          </>
        )}

        {/* 🌟 全新的「資訊」區塊 (雙頁設計) */}
        {notebookTab === 'info' && (() => {
          // 🌟 1. 取得自己的角色名稱與對應的專屬檔案
          const myUser = roomState?.users.find(u => u.email === user?.email);
          const myCharacterName = myUser?.assignedCharacter || '';
          const myProfile = CHARACTER_PROFILES[myCharacterName];

          // 🌟 2. 建立動態文本清單 (先只放序章)
          const dynamicInfoTexts: any[] = [
            { 
              id: 'info_prologue', 
              title: '序章劇情', 
              content: NARRATIONS_SCRIPT1_PROLOGUE.map(p => p.text).join('\n\n'), 
              type: 'other' // 公開資訊
            }
          ];

          // 🌟 3. 判斷階段：只有在進入搜查階段（含）以後，才發放第二幕資訊
          const isAct2Finished = ['game_search', 'search_end', 'game_meeting', 'game_voting', 'truth_revealed'].includes(roomState?.phase || '');
          if (isAct2Finished) {
            dynamicInfoTexts.push({ 
              id: 'info_act2', 
              title: '第二幕劇情', 
              content: NARRATIONS_SCRIPT1_ACT2.map(p => p.text).join('\n\n'), 
              type: 'other' // 公開資訊
            });
          }

          if (myProfile) {
            dynamicInfoTexts.push({
              id: 'info_profile1',
              title: myProfile.profile1.title,
              content: myProfile.profile1.sections.map(s => `【${s.heading}】\n${s.content}`).join('\n\n'),
              type: 'personal'
            });
            dynamicInfoTexts.push({
              id: 'info_profile2',
              title: myProfile.profile2.title,
              content: myProfile.profile2.sections.map(s => `【${s.heading}】\n${s.content}`).join('\n\n'),
              type: 'personal'
            });
          }

          // 🌟 新增：將個人的初始時間線也加進「個人專屬」中
          if (myCharacter && myCharacter.timeline) {
            dynamicInfoTexts.push({
              id: 'info_timeline',
              title: '我的初始時間線',
              content: myCharacter.timeline.map((t: any) => `【${t.time}】\n${t.event}`).join('\n\n'),
              type: 'personal'
            });
          }

          const currentList = dynamicInfoTexts.filter(t => t.type === infoSubTab);
          const selectedText = dynamicInfoTexts.find(t => t.id === selectedInfoId);

          return (
            <>
              {/* 左半頁：列表清單 */}
              <div className="flex-1 p-10 overflow-y-auto relative z-0 border-r border-[#c8c3b5]/50">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2 flex items-center gap-3">
                  <FileText size={24} className="text-indigo-700" /> 最新資訊
                </h2>

                {/* 子分頁按鈕：個人 / 其他 */}
                <div className="flex gap-2 mb-6 bg-slate-200 p-1 rounded-lg">
                  <button
                    onClick={() => { setInfoSubTab('personal'); setSelectedInfoId(null); }}
                    className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-all", infoSubTab === 'personal' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    個人專屬
                  </button>
                  <button
                    onClick={() => { setInfoSubTab('other'); setSelectedInfoId(null); }}
                    className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-all", infoSubTab === 'other' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    其他公開資訊
                  </button>
                </div>

                {/* 標題列表 */}
                <div className="space-y-3">
                  {currentList.map(item => {
                    const isRead = readInfoIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedInfoId(item.id);
                          if (!isRead) setReadInfoIds(prev => [...prev, item.id]); // 標記為已讀
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3",
                          selectedInfoId === item.id ? "ring-2 ring-indigo-500 border-transparent" : "border-slate-200 hover:border-indigo-300",
                          // 🌟 這裡判斷「未讀」的樣式：未讀會是鮮豔的底色與粗體，已讀會變淡
                          !isRead ? "bg-indigo-50/50 shadow-sm" : "bg-white opacity-70"
                        )}
                      >
                        <span className={cn("font-medium truncate", !isRead ? "text-indigo-900 font-bold" : "text-slate-600")}>
                          {item.title}
                        </span>
                        {!isRead && <CircleDot size={12} className="text-red-500 shrink-0 animate-pulse" />}
                      </button>
                    );
                  })}
                  {currentList.length === 0 && (
                    <div className="text-center text-slate-400 italic p-6 border-2 border-dashed border-slate-300 rounded-xl">
                      目前沒有新的資訊。
                    </div>
                  )}
                </div>
              </div>

              {/* 右半頁：文本內容顯示 */}
              <div className="flex-1 p-10 overflow-y-auto relative z-0">
                {selectedText ? (
                  <div className="bg-[#f4f1ea] p-8 rounded-2xl border border-[#c8c3b5] shadow-inner min-h-full">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#c8c3b5] pb-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 shrink-0">
                        <FileText size={20} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">{selectedText.title}</h3>
                    </div>
                    <div className="text-slate-700 leading-loose whitespace-pre-wrap text-lg font-serif">
                      {selectedText.content}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-4">
                    <BookOpen size={48} className="opacity-20" />
                    請從左側選擇標題進行閱讀
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {notebookTab === 'backpack' && (
          <>
            {/* Left Page: Evidence List */}
            <div className="flex-1 p-10 overflow-y-auto relative z-0 border-r border-[#c8c3b5]/50">
              <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2">已收集證物</h2>
              <div className="grid grid-cols-2 gap-4">
                {backpack.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setNotebookSelectedEvidence(item)}
                    className={cn("p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3", notebookSelectedEvidence?.id === item.id ? "bg-indigo-50 border-indigo-300 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm")}
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-600 shrink-0">
                      <item.icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 truncate">{item.locationName || '未知地點'}</div>
                    </div>
                  </div>
                ))}
                {backpack.length === 0 && (
                  <div className="col-span-2 text-slate-400 italic p-4 text-center border-2 border-dashed border-slate-300 rounded-lg">
                    背包空空如也
                  </div>
                )}
              </div>
            </div>
            {/* Right Page: Evidence Details */}
            <div className="flex-1 p-10 overflow-y-auto relative z-0">
              <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b border-slate-300 pb-2">證物詳情</h2>
              {notebookSelectedEvidence ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 border border-slate-200 shrink-0">
                      <notebookSelectedEvidence.icon size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{notebookSelectedEvidence.name}</h3>
                      <p className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <MapPin size={14} /> 發現地點：{notebookSelectedEvidence.locationName || '未知'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-slate-700 leading-relaxed">{notebookSelectedEvidence.details}</p>
                    {notebookSelectedEvidence.advancedDetails && unlockedAdvancedDetails.includes(notebookSelectedEvidence.id) && (
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h5 className="font-bold text-indigo-800 text-sm mb-2 flex items-center gap-2"><Search size={16}/> 深層線索</h5>
                        <p className="text-indigo-900 text-sm leading-relaxed">{notebookSelectedEvidence.advancedDetails}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-sm mb-2 text-slate-700 flex items-center gap-2"><Tag size={16}/> 關聯人物</h4>
                    <select
                      value={evidenceAssociations[notebookSelectedEvidence.id] ?? ''}
                      onChange={(e) => setEvidenceAssociations({...evidenceAssociations, [notebookSelectedEvidence.id]: Number(e.target.value)})}
                      className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- 尚未關聯 --</option>
                      {previewScript!.characters.map((c, i) => (
                        <option key={i} value={i}>
                          {i === myCharacterIndex ? '你 (' + c.name + ')' : c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">將此證物與特定人物建立關聯，有助於釐清案情。</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                  請從左側選擇證物查看詳情
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};