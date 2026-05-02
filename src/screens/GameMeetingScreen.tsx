import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, MapPin, FileText, Search, ClipboardList, Clock, Users, Plus, Trash2, X,
  CircleDot, Mic2, AlertTriangle, Tag, ChevronLeft, GripHorizontal, Pin, PinOff, Package
} from 'lucide-react';
import {
  Mic,
  Newspaper,
  Lock,
  Footprints,
  Skull,
  Cigarette,
  Droplets,
  Laptop,
  Cable,
  Wrench,
  GlassWater,
  Umbrella,
  Smartphone,
  Crosshair,
  Shirt,
  Bandage,
  Camera,
  Waves,
  Mountain,
} from 'lucide-react'; // 地圖證物
import { RoomState, RoomUser, User, AppPhase, cn } from '../types';
import { SCRIPTS } from '../data/scripts';
import { SpeechHelperPanel } from '../components/SpeechHelperPanel';
import { CharacterTraitsPanel } from '../components/CharacterTraitsPanel';
import { 
  NARRATIONS_SCRIPT1_PROLOGUE, 
  NARRATIONS_SCRIPT1_ACT2, 
  NARRATIONS_SCRIPT2_PROLOGUE, 
  NARRATIONS_SCRIPT2_ACT2 
} from '../data/narrations';
import { CHARACTER_PROFILES } from '../data/profileContent';
import { PERSONAL_MISSIONS } from '../data/personalMissions';
import { DIARY_CONTENT } from '../data/diaryContent';

const EVIDENCE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  search: Search,
  package: Package,
  bookOpen: BookOpen,
  fileText: FileText,
  mapPin: MapPin,
  tag: Tag,
  // 把你 evidence 資料會用到的 icon 都列上
  cs_mic: Mic,
  cs_old_news: Newspaper,
  cs_secret_compartment: Lock,
  es_locked_door: Lock,
  cs_drag_marks: Footprints,
  cs_shoeprint: Footprints,
  es_muddy_steps: Footprints,
  pv_footprints: Footprints,
  ls_slip_marks: Footprints,
  cs_autopsy: Skull,
  pv_autopsy: Skull,
  dp_cigarette_butt: Cigarette,
  cv_cigarettes: Cigarette,
  sk_wet_sink: Droplets,
  ws_sink_clean: Droplets,
  cg_sink: Droplets,
  lk_laptop: Laptop,
  lk_rope: Cable,
  pv_rope: Cable,
  es_plastic_part: Package,
  lk_plastic_bags: Package,
  bp_backpack: Package,
  np_disposal_list: FileText,
  np_old_proposal: FileText,
  bp_business_card: FileText,
  ws_pi_card: FileText,
  cg_metal_debris: Wrench,
  dp_water_bottle: GlassWater,
  pv_black_umbrella: Umbrella,
  ws_big_umbrella: Umbrella,
  ws_metal_umbrella: Umbrella,
  bp_phone: Smartphone,
  bp_gun: Crosshair,
  bp_lawbooks: BookOpen,
  ws_fabric: Shirt,
  cg_medical: Bandage,
  cg_cctv: Camera,
  bp_swimwear: Waves,
  ls_sand_compare: Mountain,
};

function resolveEvidenceIcon(evidence: any) {
  // 如果 evidence.iconName 本來就是函式（同一個 session、沒走過序列化），直接用
  if (typeof evidence?.iconName === 'function') return evidence.iconName;
  // 如果有字串名稱（推薦的長期解法），查表
  if (typeof evidence?.iconName === 'string' && EVIDENCE_ICON_MAP[evidence.iconName]) {
    return EVIDENCE_ICON_MAP[evidence.iconName];
  }
  // 兜底
  return Search;
}

export interface CharacterNote {
  id: string;
  charIdx: number;
  time: string;
  title: string;
  text: string;
  clueId?: string;
}

interface ProfileNoteDraft {
  title: string;
  content: string;
  clueId: string;
}

interface SilenceWarning {
  active: boolean;
  countdown: number;
}

interface GameMeetingScreenProps {
  previewScript: any | null;
  roomState: RoomState | null;
  user: User | null;
  isHost: boolean;
  socket: any | null;

  meetingTab: 'notebook' | 'map' | 'script' | 'clues' | 'tasks';
  setMeetingTab: React.Dispatch<React.SetStateAction<'notebook' | 'map' | 'script' | 'clues' | 'tasks'>>;

  meetingUsers: RoomUser[];
  currentSpeaker: RoomUser | null;
  peerStatuses: Record<string, string>;

  meetingNotebookTab: 'timeline' | 'profiles';
  setMeetingNotebookTab: React.Dispatch<React.SetStateAction<'timeline' | 'profiles'>>;

  timelineNodes: string[];
  setTimelineNodes: React.Dispatch<React.SetStateAction<string[]>>;
  newTimeNode: string;
  setNewTimeNode: React.Dispatch<React.SetStateAction<string>>;
  privateCustomNodes: string[]; // 🌟 新增這行
  setPrivateCustomNodes: React.Dispatch<React.SetStateAction<string[]>>; // 🌟 新增這行

  timelineEvents: Record<string, Record<number, string>>;
  setTimelineEvents: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
  handleDeleteTimeNode: (time: string) => void;

  selectedNotebookChar: number;
  setSelectedNotebookChar: React.Dispatch<React.SetStateAction<number>>;
  characterNotes: CharacterNote[];
  setCharacterNotes: React.Dispatch<React.SetStateAction<CharacterNote[]>>;
  expandedNoteId: string | null;
  setExpandedNoteId: React.Dispatch<React.SetStateAction<string | null>>;

  isAddNoteModalOpen: boolean;
  setIsAddNoteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newProfileNote: ProfileNoteDraft;
  setNewProfileNote: React.Dispatch<React.SetStateAction<ProfileNoteDraft>>;

  backpack: any[];

  infoSubTab: 'personal' | 'other';
  setInfoSubTab: React.Dispatch<React.SetStateAction<'personal' | 'other'>>;
  selectedInfoId: string | null;
  setSelectedInfoId: React.Dispatch<React.SetStateAction<string | null>>;
  readInfoIds: string[];
  setReadInfoIds: React.Dispatch<React.SetStateAction<string[]>>;

  turnTimeLeft: number;
  isMicOn: boolean;
  toggleMic: () => void;
  currentVolume: number;
  subtitles: string[];
  currentCPM: number;
  skipTurn: () => void;
  resetRoomState: () => void;
  setPhase: (p: AppPhase) => void;
  silenceWarning: SilenceWarning;
  setSilenceWarning: React.Dispatch<React.SetStateAction<SilenceWarning>>;

  evidenceAssociations: Record<string, number>;
  unlockedAdvancedDetails: string[];
  floorPlan: React.ReactNode;
  timeLeft: number;
  unlockedCharacterAdvanced: string[];
}



export const GameMeetingScreen: React.FC<GameMeetingScreenProps> = ({
  previewScript,
  roomState,
  user,
  isHost,
  socket,
  meetingTab,
  setMeetingTab,
  meetingUsers,
  currentSpeaker,
  peerStatuses,
  meetingNotebookTab,
  setMeetingNotebookTab,
  timelineNodes,
  setTimelineNodes,
  newTimeNode,
  setNewTimeNode,
  privateCustomNodes,
  setPrivateCustomNodes,
  timelineEvents,
  setTimelineEvents,
  handleDeleteTimeNode,
  selectedNotebookChar,
  setSelectedNotebookChar,
  characterNotes,
  setCharacterNotes,
  expandedNoteId,
  setExpandedNoteId,
  isAddNoteModalOpen,
  setIsAddNoteModalOpen,
  newProfileNote,
  setNewProfileNote,
  backpack,
  infoSubTab,
  setInfoSubTab,
  selectedInfoId,
  setSelectedInfoId,
  readInfoIds,
  setReadInfoIds,
  turnTimeLeft,
  isMicOn,
  toggleMic,
  currentVolume,
  subtitles,
  currentCPM,
  skipTurn,
  resetRoomState,
  setPhase,
  silenceWarning,
  setSilenceWarning,
  evidenceAssociations,
  unlockedAdvancedDetails,
  floorPlan,
  timeLeft,
  unlockedCharacterAdvanced,
}) => {
  const characters = previewScript?.characters || SCRIPTS[0].characters;
  if (!previewScript) return null;

  // 先確認 user.email 存在，才去尋找物件或陣列的內容，避免 undefined 報錯
  const meetingStage = (roomState as any)?.meetingStage || 'round_robin';
  const isMeReady = user?.email ? (roomState as any)?.meetingReadyUsers?.includes(user.email) : false;
  const hasVotedDiscussion = user?.email ? (roomState as any)?.moreDiscussionVotes?.[user.email] !== undefined : false;

  const myMeetingUser = meetingUsers.find((u: any) => u.email === user?.email);
  const isMyTurn = meetingStage === 'round_robin' && !!myMeetingUser && currentSpeaker?.email === myMeetingUser.email;
  const [showTurnAlert, setShowTurnAlert] = useState(false);
  const [isHelperPanelOpen, setIsHelperPanelOpen] = useState(false);
  const [dismissedOrganizeAlert, setDismissedOrganizeAlert] = useState(false);
  const [dismissedFreeDiscussionAlert, setDismissedFreeDiscussionAlert] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  // 🌟 會議室時間線的釘選功能
  const [pinnedChars, setPinnedChars] = useState<Set<number>>(new Set());
  const [pinScale, setPinScale] = useState<number>(1.5); // 1.5 ~ 2.0 玩家可調
  const togglePin = (idx: number) => {
    setPinnedChars(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };
  const BASE_COL_W = 150; // 每欄基準寬 (px)
  
  // 處理點擊發言助手卡片時的畫面跳轉
  const handleHelperItemClick = (item: any) => {
    switch (item.type) {
      case 'clue':
        // 跳至線索分頁
        setMeetingTab('clues');
        break;

      case 'text':
        // 跳至文本分頁並自動選中該標題
        setMeetingTab('script');
        setSelectedInfoId(item.id);
        // (簡易防呆) 假設 1、2 是個人，3、4 是其他，自動切換左側列表
        if (item.id.includes('1') || item.id.includes('2')) setInfoSubTab('personal');
        else setInfoSubTab('other');
        break;

      case 'note':
        // 跳至角色檔案筆記，自動切換到該角色，並展開該篇筆記
        setMeetingTab('notebook');
        setMeetingNotebookTab('profiles');
        const targetNote = characterNotes.find(n => n.id === item.id);
        if (targetNote) {
          setSelectedNotebookChar(targetNote.charIdx);
          // 稍微延遲以確保畫面已經切換到該分頁，再執行展開
          setTimeout(() => setExpandedNoteId(targetNote.id), 50);
        }
        break;

      case 'timeline':
        // 跳至時間線分頁
        setMeetingTab('notebook');
        setMeetingNotebookTab('timeline');
        break;
    }
  };

  // 當離開整理思緒階段時，重置彈窗狀態
  useEffect(() => {
    if (meetingStage !== 'organizing') {
      setDismissedOrganizeAlert(false);
    }
    if (meetingStage !== 'free_discussion') {
      setDismissedFreeDiscussionAlert(false);
    }
  }, [meetingStage]);

  useEffect(() => {
    console.log('[TurnAlert] effect run, isMyTurn=', isMyTurn, 'currentSpeaker=', currentSpeaker?.email, 'me=', myMeetingUser?.email);
    if (isMyTurn) {
      console.log('[TurnAlert] -> 顯示彈窗，4 秒後自動關閉');
      setShowTurnAlert(true);
      const t = setTimeout(() => {
        console.log('[TurnAlert] -> 4s timeout 觸發，關閉彈窗');
        setShowTurnAlert(false);
      }, 4000);
      return () => {
        console.log('[TurnAlert] cleanup: clearTimeout');
        clearTimeout(t);
      };
    } else {
      console.log('[TurnAlert] -> else 分支，強制關閉彈窗');
      setShowTurnAlert(false);
    }
  }, [isMyTurn]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-slate-200"
    >
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column (1/6 width approx, 1:5 ratio) */}
        <div className={cn(
          "border-r border-slate-700 bg-slate-800 flex flex-col transition-all duration-300 ease-in-out z-20 relative",
          isHelperPanelOpen ? "w-[7%] min-w-[70px] items-center" : "w-1/6 min-w-[200px]"
        )}>
          {/* Top: Function Buttons */}
          <div className="p-4 space-y-2 border-b border-slate-700 w-full flex flex-col items-center">
            {[
              { id: 'notebook', iconName: BookOpen, label: '筆記本' },
              { id: 'map', iconName: MapPin, label: '地圖' },
              { id: 'script', iconName: FileText, label: '文本' },
              { id: 'clues', iconName: Search, label: '線索' },
              { id: 'tasks', iconName: ClipboardList, label: '任務' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMeetingTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center rounded-xl transition-colors relative group",
                  isHelperPanelOpen ? "justify-center p-3" : "gap-3 px-4 py-3",
                  meetingTab === tab.id ? "bg-indigo-600 text-white" : "hover:bg-slate-700 text-slate-300"
                )}
              >
                <tab.iconName size={20} className="shrink-0" />
                {!isHelperPanelOpen && <span className="font-medium whitespace-nowrap">{tab.label}</span>}
                
                {/* 折疊時的懸浮提示 (Tooltip) */}
                {isHelperPanelOpen && (
                  <div className="absolute left-[calc(100%+8px)] px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-[60] pointer-events-none shadow-lg border border-slate-600">
                    {tab.label}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Bottom: People in the meeting room */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 w-full overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!isHelperPanelOpen && <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">與會人員</h3>}
            {characters.map((charData: any, idx: number) => {
              const connectedUser = meetingUsers.find((u: any) => u.character === charData.name);
              const isSpeaking = meetingStage === 'round_robin' && (currentSpeaker as any)?.character === charData.name;
              const isOnline = !!connectedUser;
              const peerStatus = connectedUser ? peerStatuses[connectedUser.id] : null;

              return (
                <div key={idx} className={cn("flex items-center gap-3 relative group", isHelperPanelOpen && "justify-center")}>
                  <div className={cn(
                    "w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 transition-all duration-300 relative",
                    isSpeaking ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110" : "border-slate-600",
                    !isOnline && "opacity-50 grayscale"
                  )}>
                    <img src={charData.image} alt={charData.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {isOnline && (
                      <div className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800",
                        peerStatus === 'connected' ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                    )}
                  </div>

                  {!isHelperPanelOpen && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200 truncate">{charData.name}</div>
                      <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                        {connectedUser ? connectedUser.email : 'AI 託管'}
                      </div>
                    </div>
                  )}

                  {isSpeaking && !isHelperPanelOpen && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  )}

                  {/* 折疊時的人物懸浮提示 (Tooltip) */}
                  {isHelperPanelOpen && (
                    <div className="absolute left-[calc(100%+8px)] px-3 py-2 bg-slate-800 border border-slate-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-[60] pointer-events-none shadow-xl flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-indigo-300">{charData.name}</span>
                        {isSpeaking && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <span className="text-slate-400">{connectedUser ? connectedUser.email : 'AI 託管'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* === 中間主畫面 (Middle Column) ===
            🌟 中間欄與右側發言助手比例約 19:11（可調整 flex-[19] / flex-[11] 數字）
        */}
        <div className={cn(
          "bg-slate-900 p-8 overflow-hidden relative flex flex-col h-full min-h-0 transition-all duration-300 min-w-0",
          isHelperPanelOpen ? "flex-[19]" : "flex-1"
        )}>
          
          {/* 呼叫發言助手的懸浮按鈕 (只在右側面板關閉時顯示) */}
          {!isHelperPanelOpen && (
            <button
              onClick={() => setIsHelperPanelOpen(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-indigo-600 border border-r-0 border-slate-600 text-slate-300 hover:text-white py-4 px-1 rounded-l-xl shadow-[-5px_0_15px_rgba(0,0,0,0.3)] z-[50] transition-all flex items-center justify-center group"
              title="展開發言助手"
            >
              <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          <div className="w-full flex flex-col flex-1 min-h-0">
            {meetingTab === 'notebook' && (() => {
              // 🌟 獲取自己的 Index (防呆用)
              const myUser = roomState?.users.find(u => u.email === user?.email);
              const myCharacterIndex = previewScript?.characters.findIndex((c: any) => c.name === myUser?.assignedCharacter) ?? 0;
              const myCharacter = previewScript?.characters[myCharacterIndex];

              // 🌟 動態組合顯示節點 (全域公開節點 + 我的私密初始節點)
              const myInitialNodes = myCharacter?.timeline?.map((t: any) => t.time) || [];
              const displayNodes = Array.from(new Set([...timelineNodes, ...myInitialNodes, ...privateCustomNodes])).sort();

              return (
                <div className="flex flex-col h-full">
                  {/* 頂部標題與子分頁切換 */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <BookOpen className="text-indigo-400" /> 筆記本
                    </h2>
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-sm">
                      <button
                        onClick={() => setMeetingNotebookTab('timeline')}
                        className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2", meetingNotebookTab === 'timeline' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
                      >
                        <Clock size={16} /> 時間線盤問
                      </button>
                      <button
                        onClick={() => setMeetingNotebookTab('profiles')}
                        className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2", meetingNotebookTab === 'profiles' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
                      >
                        <Users size={16} /> 角色檔案
                      </button>
                    </div>
                  </div>

                  {/* 筆記本主內容區塊 */}
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full h-[650px] max-h-[75vh] min-h-0 overflow-hidden shadow-lg flex flex-col">
                    {/* 🌟 內容 A：時間線盤問 (深色大表格) */}
                    {meetingNotebookTab === 'timeline' && (
                      <div className="flex-1 p-6 overflow-auto">
                        <p className="text-slate-400 mb-4 text-sm flex items-center gap-2">
                          <Clock size={14} /> 此處顯示大家在搜查階段所記錄的時間線，可直接進行編輯或核對。
                        </p>

                        {/* 🌟 新增時間點的控制列 */}
                        <div className="flex items-center gap-3 mb-4 shrink-0 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                          <span className="text-slate-300 font-bold text-sm">增加時間點：</span>
                          <input
                            type="text"
                            value={newTimeNode}
                            onChange={e => setNewTimeNode(e.target.value)}
                            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm outline-none focus:border-indigo-500 w-32"
                            placeholder="如 19:15"
                          />
                          <button
                            onClick={() => {
                              const timeStr = newTimeNode.trim();
                              if (!timeStr) return;

                              const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                              if (!timeRegex.test(timeStr)) {
                                alert('請輸入有效的 24 小時制時間格式！\n正確範例：08:30 或 19:15');
                                return;
                              }

                              // 檢查是否已經存在相同時間
                              if (displayNodes.includes(timeStr)) {
                                alert('這個時間點已經存在囉！');
                                return;
                              }

                              // 🌟 格式正確且不重複，加入到【私密節點】中，不要觸發全域同步
                              setPrivateCustomNodes(prev => [...prev, timeStr]);
                              setNewTimeNode(''); // 清空輸入框
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-1"
                          >
                            <Plus size={16} /> 新增
                          </button>
                        </div>

                        {/* 🌟 釘選比例調整 slider */}
                        <div className="flex items-center gap-3 mb-3 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700 w-fit">
                          <Pin size={14} className="text-indigo-400" />
                          <span className="text-xs text-slate-400">釘選欄寬 ×{pinScale.toFixed(1)}</span>
                          <input
                            type="range"
                            min={1.5}
                            max={2.0}
                            step={0.1}
                            value={pinScale}
                            onChange={e => setPinScale(parseFloat(e.target.value))}
                            className="accent-indigo-500 w-32"
                          />
                          {pinnedChars.size > 0 && (
                            <button
                              onClick={() => setPinnedChars(new Set())}
                              className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                              title="清除所有釘選"
                            >
                              <PinOff size={12} /> 清除釘選
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto pb-4">
                          <table className="text-left border-collapse" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
                            <thead>
                              <tr>
                                <th className="p-3 border-b-2 border-slate-600 w-24 bg-slate-800 sticky left-0 z-10 text-slate-300">時間</th>
                                {previewScript!.characters.map((c: any, i: number) => {
                                  const isPinned = pinnedChars.has(i);
                                  const colW = isPinned ? Math.round(BASE_COL_W * pinScale) : BASE_COL_W;
                                  return (
                                    <th
                                      key={c.name}
                                      className={cn(
                                        "p-3 border-b-2 border-slate-600 text-slate-300 transition-all",
                                        isPinned && "bg-indigo-900/30"
                                      )}
                                      style={{ width: `${colW}px`, minWidth: `${colW}px` }}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">{i === myCharacterIndex ? '你' : c.name}</span>
                                        <button
                                          onClick={() => togglePin(i)}
                                          className={cn(
                                            "p-1 rounded transition-colors shrink-0",
                                            isPinned
                                              ? "text-indigo-400 hover:text-indigo-300"
                                              : "text-slate-500 hover:text-slate-300"
                                          )}
                                          title={isPinned ? "取消釘選" : "釘選此角色 (欄寬放大)"}
                                        >
                                          <Pin size={14} className={isPinned ? "fill-current" : ""} />
                                        </button>
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {displayNodes.map(time => (
                                <tr key={time} className="hover:bg-slate-700/50 transition-colors">
                                  <td className="p-3 border-b border-slate-700 font-bold text-indigo-300 bg-slate-800 sticky left-0 z-10 shadow-[1px_0_0_#334155] group">
                                    <div className="flex items-center justify-between">
                                      <span>{time}</span>
                                      {/* 🌟 垃圾桶按鈕：平時隱藏 (opacity-0)，滑鼠移到這格時才顯示 (group-hover:opacity-100) */}
                                      <button
                                        onClick={() => handleDeleteTimeNode(time)}
                                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300 hover:scale-110 p-1"
                                        title="刪除此時間點"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                  {previewScript!.characters.map((c: any, i: number) => {
                                    const isPinned = pinnedChars.has(i);
                                    const colW = isPinned ? Math.round(BASE_COL_W * pinScale) : BASE_COL_W;
                                    return (
                                    <td
                                      key={c.name}
                                      className={cn(
                                        "p-3 border-b border-slate-700 align-top relative group/cell transition-all",
                                        isPinned && "bg-indigo-900/10"
                                      )}
                                      style={{ width: `${colW}px`, minWidth: `${colW}px` }}
                                    >
                                        {/* 👇 新增這個專屬的拖曳把手 */}
                                        <div
                                          draggable
                                          onDragStart={(e) => {
                                            const content = timelineEvents[time]?.[i] || '無紀錄';
                                            const charName = i === myCharacterIndex ? '你' : c.name;
                                            e.dataTransfer.setData('application/json', JSON.stringify({
                                              id: `timeline-${time}-${i}`,
                                              type: 'timeline',
                                              content: `[${time} ${charName}動向：${content}]`
                                            }));
                                          }}
                                          className="absolute top-4 right-4 opacity-0 group-hover/cell:opacity-100 cursor-grab active:cursor-grabbing text-slate-500 hover:text-indigo-400 p-1 bg-slate-800 rounded z-20 shadow-sm transition-opacity"
                                          title="按住拖曳此動向"
                                        >
                                          <GripHorizontal size={14} />
                                        </div>
                                      <textarea
                                        ref={el => {
                                          if (el) {
                                            el.style.height = 'auto';
                                            el.style.height = el.scrollHeight + 'px';
                                          }
                                        }}
                                        className="w-full bg-slate-900/50 border border-transparent hover:border-slate-600 focus:border-indigo-500 focus:bg-slate-900 rounded p-2 outline-none resize-none text-sm transition-all text-slate-300 placeholder-slate-600 overflow-hidden whitespace-pre-wrap break-words"
                                        value={
                                          timelineEvents[time]?.[i] !== undefined
                                            ? timelineEvents[time][i]
                                            : (i === myCharacterIndex 
                                                ? (previewScript!.characters[i].timeline?.find((t: any) => t.time === time)?.event || '') 
                                                : '')
                                        }
                                        onChange={(e) => {
                                          setTimelineEvents(prev => ({
                                            ...prev,
                                            [time]: { ...(prev[time] || {}), [i]: e.target.value }
                                          }));
                                          e.target.style.height = 'auto';
                                          e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="..."
                                        rows={1}
                                      />
                                    </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 🌟 內容 B：角色檔案 (寬螢幕版 + 局部滾動筆記) */}
                    {meetingNotebookTab === 'profiles' && (
                      <div className="flex flex-1 overflow-hidden">

                        {/* === 左側：改成固定寬度 (w-64)，把空間讓給右邊 === */}
                        <div className="w-64 border-r border-slate-700 bg-slate-800/80 p-5 flex flex-col overflow-hidden shrink-0">
                          {(() => {
                            const char = previewScript!.characters[selectedNotebookChar];
                            return (
                              <div className="flex flex-col items-center mb-6 pb-6 border-b border-slate-700 shrink-0 mt-4">
                                <img src={char.image} alt={char.name} className="w-24 h-24 object-cover rounded-full shadow-lg border-2 border-slate-600 mb-3" />
                                <h3 className="text-xl font-bold text-white text-center">
                                  {selectedNotebookChar === myCharacterIndex ? '你 (' + char.name + ')' : char.name}
                                </h3>
                                <p className="text-indigo-400 font-bold text-sm mt-1">{char.role}</p>
                              </div>
                            );
                          })()}

                          <div className="flex flex-col gap-2 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {previewScript!.characters.map((c: any, i: number) => (
                              <button
                                key={i}
                                onClick={() => setSelectedNotebookChar(i)}
                                className={cn("text-left px-4 py-3 rounded-xl transition-all font-bold text-sm", selectedNotebookChar === i ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200")}
                              >
                                {i === myCharacterIndex ? '你 (' + c.name + ')' : c.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* === 右側：改成 flex-1 (佔滿剩餘寬度)，且嚴格禁止外層滾動 (overflow-hidden) === */}
                        <div className="flex-1 p-8 bg-slate-900/50 flex flex-col overflow-hidden relative z-0 h-full min-h-0">
                          {(() => {
                            const char = previewScript!.characters[selectedNotebookChar];
                            return (
                              <>
                                {/* 🌟 角色專屬推理筆記區塊 (修改 CSS 選擇器，讓被禁用的按鈕保持灰階) */}
                                <div 
                                  className="mb-6 cursor-grab active:cursor-grabbing [&_button:not(:disabled)]:!bg-slate-800 [&_button:not(:disabled)]:!text-slate-300 [&_button:not(:disabled)]:!border-slate-600 hover:[&_button:not(:disabled)]:!bg-slate-700 [&_button:disabled]:!bg-slate-900/50 [&_button:disabled]:!text-slate-600 [&_button:disabled]:!border-slate-800"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                      id: `trait-${char.name}`,
                                      type: 'note',
                                      content: `[角色特徵]：這是關於 ${char.name} 的特徵資訊。` 
                                    }));
                                  }}
                                >
                                  <CharacterTraitsPanel
                                    scriptId={Number(roomState?.scriptId) || 1}
                                    characterName={char.name}
                                    unlockedCharacters={unlockedCharacterAdvanced}
                                    onUnlockAdvanced={() => {}}    
                                    canUnlock={false}               
                                    onAddTraitToNote={(traitType, content) => {
                                      const title = `[${traitType}] ${char.name}`;
                                      const exists = characterNotes.some(n => n.charIdx === selectedNotebookChar && n.title === title);
                                      if (exists) {
                                        const existingNote = characterNotes.find(n => n.charIdx === selectedNotebookChar && n.title === title);
                                        if (existingNote) setExpandedNoteId(existingNote.id);
                                        return;
                                      }

                                      const newId = Date.now().toString();
                                      setCharacterNotes(prev => [...prev, {
                                        id: newId,
                                        charIdx: selectedNotebookChar,
                                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        title: title,
                                        text: content,
                                        clueId: ''
                                      }]);
                                      setExpandedNoteId(newId);
                                    }}
                                  />
                                </div>

                                <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2 shrink-0">
                                    <BookOpen size={20} className="text-indigo-400"/> 關於此人的推理筆記
                                  </h4>

                                  {/* 🌟 筆記列表：分離特徵筆記(置頂)與一般筆記 (深色版) */}
                                  <div className="space-y-3 mb-6 overflow-y-auto flex-1 pr-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    {(() => {
                                      const charNotes = characterNotes.filter(n => n.charIdx === selectedNotebookChar);
                                      const traitNotes = charNotes.filter(n => n.title.startsWith('[基礎特徵]') || n.title.startsWith('[進階特徵]'));
                                      const regularNotes = charNotes.filter(n => !n.title.startsWith('[基礎特徵]') && !n.title.startsWith('[進階特徵]'));

                                      return (
                                        <>
                                          {/* 1. 特徵筆記 (深色特殊樣式) */}
                                          {traitNotes.map(note => {
                                            const isExpanded = expandedNoteId === note.id;
                                            const isAdvanced = note.title.includes('[進階特徵]');
                                            return (
                                              <div 
                                                key={note.id} 
                                                draggable
                                                onDragStart={(e) => {
                                                  e.dataTransfer.setData('application/json', JSON.stringify({ id: note.id, type: 'note', content: `[${note.title}]：${note.text}` }));
                                                }}
                                                className={cn("border rounded-xl shadow-sm overflow-hidden transition-all cursor-grab active:cursor-grabbing", isAdvanced ? "bg-amber-950/30 border-amber-800/50" : "bg-indigo-950/30 border-indigo-800/50")}
                                              >
                                                <button onClick={() => setExpandedNoteId(isExpanded ? null : note.id)} className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors text-left">
                                                  <div className={cn("font-bold text-lg flex items-center gap-2", isAdvanced ? "text-amber-400" : "text-indigo-400")}>
                                                    <span className="text-sm opacity-60">{isExpanded ? '▼' : '▶'}</span>
                                                    {note.title}
                                                  </div>
                                                  <div className="text-xs opacity-50 font-mono text-slate-400">{note.time}</div>
                                                </button>
                                                {isExpanded && (
                                                  <div className={cn("p-4 pt-0 border-t bg-black/20", isAdvanced ? "border-amber-900/50" : "border-indigo-900/50")}>
                                                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed mt-3 mb-4 text-sm">{note.text}</p>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}

                                          {/* 2. 一般筆記 */}
                                          {regularNotes.map(note => {
                                            const isExpanded = expandedNoteId === note.id;
                                            return (
                                              <div 
                                                key={note.id} 
                                                draggable
                                                onDragStart={(e) => {
                                                  e.dataTransfer.setData('application/json', JSON.stringify({ id: note.id, type: 'note', content: `[${note.title || '筆記'}：${note.text}]` }));
                                                }}
                                                className="bg-slate-800 border border-slate-600 rounded-xl shadow-sm overflow-hidden transition-all hover:border-indigo-500 cursor-grab active:cursor-grabbing"
                                              >
                                                <button onClick={() => setExpandedNoteId(isExpanded ? null : note.id)} className="w-full flex justify-between items-center p-4 hover:bg-slate-700/80 transition-colors text-left">
                                                  <div className="font-bold text-indigo-300 text-lg flex items-center gap-2">
                                                    <span className="text-slate-500 text-sm">{isExpanded ? '▼' : '▶'}</span>
                                                    {note.title || '無標題筆記'}
                                                  </div>
                                                  <div className="text-xs text-slate-500 font-mono">{note.time}</div>
                                                </button>
                                                {isExpanded && (
                                                  <div className="p-4 pt-0 border-t border-slate-700/50 bg-slate-900/30">
                                                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed mt-3 mb-4 text-sm">{note.text}</p>
                                                    {note.clueId && backpack.find(b => b.id === note.clueId) && (
                                                      <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-600 px-3 py-1.5 rounded-lg text-xs text-slate-400">
                                                        <Search size={14} className="text-indigo-400" />
                                                        關聯線索：<span className="text-slate-300 font-bold">{backpack.find(b => b.id === note.clueId)?.name}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                          {charNotes.length === 0 && (
                                            <div className="text-center text-slate-500 italic p-6 border-2 border-dashed border-slate-700 rounded-xl">
                                              尚未建立關於此人的筆記。
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* 3. 新增筆記表單 (固定在最下方，縮減高度) */}
                                  {/* 🌟 懸浮按鈕 (Floating Action Button) */}
                                  <button
                                    onClick={() => setIsAddNoteModalOpen(true)}
                                    className="absolute bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center transition-transform hover:scale-110 z-10"
                                  >
                                    <Plus size={28} />
                                  </button>

                                  {/* 🌟 彈出式新增筆記視窗 (Modal) */}
                                  {isAddNoteModalOpen && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">

                                        {/* 關閉按鈕 */}
                                        <button
                                          onClick={() => setIsAddNoteModalOpen(false)}
                                          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                                        >
                                          <X size={24} />
                                        </button>

                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                          <div className="w-2 h-2 bg-indigo-500 rounded-full" /> 新增推理筆記
                                        </h3>

                                        <div className="space-y-4">
                                          <div>
                                            <label className="block text-slate-400 text-sm font-bold mb-2">筆記標題</label>
                                            <input
                                              type="text"
                                              placeholder="例如：案發時的嫌疑..."
                                              value={newProfileNote.title}
                                              onChange={e => setNewProfileNote({...newProfileNote, title: e.target.value})}
                                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-slate-400 text-sm font-bold mb-2">關聯線索 (選填)</label>
                                            <select
                                              value={newProfileNote.clueId}
                                              onChange={e => setNewProfileNote({...newProfileNote, clueId: e.target.value})}
                                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500"
                                            >
                                              <option value="">-- 無關聯線索 --</option>
                                              {backpack.map(item => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                              ))}
                                            </select>
                                          </div>

                                          <div>
                                            <label className="block text-slate-400 text-sm font-bold mb-2">推論內容</label>
                                            <textarea
                                              placeholder="記錄你的發現與推論細節..."
                                              value={newProfileNote.content}
                                              onChange={e => setNewProfileNote({...newProfileNote, content: e.target.value})}
                                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 min-h-[120px] resize-none"
                                            />
                                          </div>
                                        </div>

                                        <div className="mt-8 flex justify-end gap-3">
                                          <button
                                            onClick={() => setIsAddNoteModalOpen(false)}
                                            className="px-6 py-2.5 rounded-lg font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                                          >
                                            取消
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (newProfileNote.title || newProfileNote.content) {
                                                const newId = Date.now().toString();
                                                setCharacterNotes(prev => [...prev, {
                                                  id: newId,
                                                  charIdx: selectedNotebookChar,
                                                  time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                                                  title: newProfileNote.title,
                                                  text: newProfileNote.content,
                                                  clueId: newProfileNote.clueId
                                                }]);
                                                setNewProfileNote({ title: '', content: '', clueId: '' });
                                                setExpandedNoteId(newId); // 儲存後自動展開新筆記
                                                setIsAddNoteModalOpen(false); // 🌟 儲存後自動關閉彈窗
                                              }
                                            }}
                                            className="px-6 py-2.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                                          >
                                            儲存筆記
                                          </button>
                                        </div>

                                      </div>
                                    </div>
                                  )}

                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {meetingTab === 'map' && (
              <div className="flex flex-col h-full min-h-0">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 shrink-0"><MapPin className="text-indigo-400" /> 地圖</h2>
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex-1 min-h-[500px] overflow-auto">
                  {floorPlan}
                </div>
              </div>
            )}

            {meetingTab === 'script' && (() => {
              // 🌟 1. 取得自己的角色名稱與對應的專屬檔案
              const myUser = roomState?.users.find(u => u.email === user?.email);
              const myCharacterName = myUser?.assignedCharacter || '';
              const myProfile = (CHARACTER_PROFILES as any)[myCharacterName]; // 👈 加上 as any

              // 🌟 2. 修改：根據劇本 ID 自動選擇序章文案
              const currentScriptId = Number((roomState as any)?.scriptId) || 1;
              const prologueData = currentScriptId === 2 ? NARRATIONS_SCRIPT2_PROLOGUE : NARRATIONS_SCRIPT1_PROLOGUE;

              const dynamicInfoTexts: any[] = [
                { 
                  id: 'info_prologue', 
                  title: '序章劇情', 
                  content: prologueData.map(p => p.text).join('\n\n'), 
                  type: 'other' 
                }
              ];

              // 🌟 3. 判斷階段：只有在進入搜查階段（含）以後，才發放第二幕資訊
              const isAct2Finished = ['game_search', 'search_end', 'game_meeting', 'game_voting', 'truth_revealed'].includes(roomState?.phase || '');
              if (isAct2Finished) {
                // 🌟 根據劇本 ID 自動切換第二幕文案
                const act2Data = currentScriptId === 2 ? NARRATIONS_SCRIPT2_ACT2 : NARRATIONS_SCRIPT1_ACT2;
                dynamicInfoTexts.push({ 
                  id: 'info_act2', 
                  title: '第二幕劇情', 
                  content: act2Data.map(p => p.text).join('\n\n'), 
                  type: 'other' 
                });
              }

              // 🌟 4. 修改：強制轉換 Number 防呆
              if (Number((roomState as any)?.scriptId) === 2 && Number((roomState as any)?.currentRound) >= 2) {
                const diary = (DIARY_CONTENT as any)[2];
                if (diary) {
                  // 把日記的每一頁當作一篇文本加入
                  diary.pages.forEach((page: any, idx: number) => {
                    dynamicInfoTexts.push({
                      id: `diary_page_${idx}`,
                      title: `【日記】${page.title}`,
                      content: page.content,
                      type: 'other' // 'other' 代表歸類在「其他公開資訊」
                    });
                  });
                }
              }

              // 若有找到該角色的私密檔案，則加入到「個人專屬」中
              if (myProfile) {
                dynamicInfoTexts.push({
                  id: 'info_profile1',
                  title: myProfile.profile1.title,
                  content: myProfile.profile1.sections.map((s: any) => `【${s.heading}】\n${s.content}`).join('\n\n'),
                  type: 'personal'
                });
                dynamicInfoTexts.push({
                  id: 'info_profile2',
                  title: myProfile.profile2.title,
                  content: myProfile.profile2.sections.map((s: any) => `【${s.heading}】\n${s.content}`).join('\n\n'),
                  type: 'personal'
                });
              }

              // 🌟 新增：將個人的初始時間線也加進「個人專屬」中
              const myCharacterIndex = previewScript?.characters.findIndex((c: any) => c.name === (myUser?.assignedCharacter || '')) ?? 0;
              const myCharacter = previewScript?.characters[myCharacterIndex];
              
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
                <div className="flex flex-col h-full">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><FileText className="text-indigo-400" /> 文本與資訊</h2>

                  {/* 深色版雙欄外框 */}
                  <div className="flex bg-slate-800 rounded-2xl border border-slate-700 flex-1 min-h-[500px] overflow-hidden shadow-lg">

                    {/* 左側：列表清單 (暗色主題) */}
                    <div className="w-1/3 p-6 border-r border-slate-700 overflow-y-auto bg-slate-800/80">
                      {/* 子分頁按鈕：個人 / 其他 */}
                      <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-lg">
                        <button
                          onClick={() => { setInfoSubTab('personal'); setSelectedInfoId(null); }}
                          className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-all", infoSubTab === 'personal' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
                        >
                          個人專屬
                        </button>
                        <button
                          onClick={() => { setInfoSubTab('other'); setSelectedInfoId(null); }}
                          className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-all", infoSubTab === 'other' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
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
                              draggable
                              onDragStart={(e) => {
                                // 將文本內容轉為純文字，移除可能的 HTML 標籤 (例如：日記本裡的 highlight <span>)
                                const tempDiv = document.createElement("div");
                                tempDiv.innerHTML = item.content;
                                const plainTextContent = tempDiv.textContent || tempDiv.innerText || "";
                                
                                e.dataTransfer.setData('application/json', JSON.stringify({
                                  id: item.id,
                                  type: 'text',
                                  content: `[文本資訊] ${item.title}：\n${plainTextContent}`
                                }));
                              }}
                              onClick={() => {
                                setSelectedInfoId(item.id);
                                if (!isRead) setReadInfoIds(prev => [...prev, item.id]);
                              }}
                              className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing",
                                selectedInfoId === item.id ? "border-indigo-500 bg-slate-700" : "border-slate-700 hover:border-slate-600",
                                !isRead ? "bg-indigo-900/40" : "bg-transparent"
                              )}
                            >
                              <span className={cn("font-medium truncate", !isRead ? "text-indigo-300 font-bold" : "text-slate-400")}>
                                {item.title}
                              </span>
                              {/* 未讀小紅點 */}
                              {!isRead && <CircleDot size={12} className="text-red-400 shrink-0 animate-pulse" />}
                            </button>
                          );
                        })}
                        {currentList.length === 0 && (
                          <div className="text-center text-slate-500 italic p-6 border-2 border-dashed border-slate-700 rounded-xl">
                            目前沒有新的資訊。
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右側：文本內容顯示 (暗色主題) */}
                    <div className="w-2/3 p-8 overflow-y-auto relative z-0 bg-slate-900/50">
                      {selectedText ? (
                        <div className="h-full flex flex-col">
                          <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                            <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-400 shrink-0">
                              <FileText size={20} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">{selectedText.title}</h3>
                          </div>
                          <div className="text-slate-300 leading-loose whitespace-pre-wrap text-lg font-serif">
                            {selectedText.content}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 italic gap-4">
                          <BookOpen size={48} className="opacity-20" />
                          請從左側選擇標題進行閱讀
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

            {meetingTab === 'clues' && (
              <div className="flex flex-col h-full min-h-0">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 shrink-0">
                  <Search className="text-indigo-400" /> 已公開線索
                </h2>

                {/* 左右分欄容器，確保有 flex-1 與 min-h-0 */}
                <div className="flex gap-6 flex-1 min-h-0">
                  
                  {/* 左側：證物網格 (加上 overflow-y-auto 獨立滾動) */}
                  <div className="flex-1 overflow-y-auto pr-2 pb-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {backpack.length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        {backpack.map((evidence: any, idx) => {
                          const Icon = resolveEvidenceIcon(evidence);
                          const isSelected = selectedEvidence?.id === evidence.id;
                          return (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedEvidence(evidence)}
                              className={cn(
                                "cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col",
                                isSelected
                                  ? "bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                  : "bg-slate-800/60 border-slate-700 hover:bg-slate-700/80 hover:border-slate-500"
                              )}
                            >
                              {/* 移除原本上方獨立的灰色方塊，將圖示與文字完美整合 */}
                              <div className="p-5 flex flex-col h-full">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className={cn(
                                    "p-2.5 rounded-xl shrink-0 transition-colors", 
                                    isSelected ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-700 text-slate-400"
                                  )}>
                                    <Icon size={20} />
                                  </div>
                                  <div className="pt-1">
                                    <div className="font-bold text-white text-base leading-tight">{evidence.name}</div>
                                  </div>
                                </div>
                                <div className="text-xs text-indigo-300 flex items-center gap-1.5 mb-2.5 shrink-0">
                                  <MapPin size={12} /> 發現地點：{evidence.locationName || '未知'}
                                </div>
                                <div className="text-sm text-slate-400 leading-relaxed flex-1">
                                  {evidence.brief}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <Package size={48} className="mb-4" />
                        <p className="text-lg">目前還沒有人公開任何線索</p>
                      </div>
                    )}
                  </div>

                  {/* 右側：證物詳情面板 (加上 overflow-y-auto 獨立滾動) */}
                  <div className="w-[35%] bg-slate-900/80 border border-slate-700 rounded-2xl flex flex-col shrink-0 shadow-xl overflow-hidden">
                    {selectedEvidence ? (
                      <div className="p-6 overflow-y-auto h-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <div className="flex items-start gap-4 mb-6 pb-5 border-b border-slate-700">
                           <div className="p-3.5 bg-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
                              {selectedEvidence.iconName ? React.createElement(selectedEvidence.iconName as any, { size: 28 }) : <Search size={28} />}
                           </div>
                           <div>
                             <h3 className="text-xl font-bold text-white mb-2">{selectedEvidence.name}</h3>
                             <div className="text-xs font-medium text-indigo-300/80 flex items-center gap-1.5 bg-indigo-950/30 px-2.5 py-1 rounded-md inline-flex">
                               <MapPin size={12} /> {selectedEvidence.locationName || '未知'}
                             </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-black text-slate-500 mb-2 tracking-widest uppercase">基本描述</h4>
                            <p className="text-slate-300 leading-relaxed text-base bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                              {selectedEvidence.details}
                            </p>
                          </div>

                          {/* 深層線索 */}
                          {selectedEvidence.advancedDetails && unlockedAdvancedDetails.includes(selectedEvidence.id) && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                              <h4 className="text-xs font-black text-amber-500 mb-2 tracking-widest uppercase flex items-center gap-1.5">
                                 <Search size={14}/> 深層線索
                              </h4>
                              <p className="text-amber-100/90 leading-relaxed text-base bg-amber-900/20 p-4 rounded-xl border border-amber-500/30">
                                {selectedEvidence.advancedDetails}
                              </p>
                            </motion.div>
                          )}

                          {/* 關聯狀態 */}
                          {evidenceAssociations[selectedEvidence.id] !== undefined && (
                            <div>
                              <h4 className="text-xs font-black text-slate-500 mb-2 tracking-widest uppercase">目前關聯人物</h4>
                              <div className="px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300 flex items-center gap-2">
                                <Tag size={16} className="text-indigo-400"/> 
                                {previewScript?.characters[evidenceAssociations[selectedEvidence.id]]?.name || '未知'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-full">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>請點擊左側線索卡片<br/>查看詳細資訊與關聯</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
            
            {meetingTab === 'tasks' && (() => {
              // 🌟 1. 取得自己的角色名稱
              const myUser = roomState?.users.find(u => u.email === user?.email);
              const characterName = myUser?.assignedCharacter || '';
              
              // 🌟 2. 從 personalMissions.ts 取得專屬任務
              const personalMission = (PERSONAL_MISSIONS as any)[characterName];
              
              // 若找不到則給予防呆預設值
              const mainTasks = personalMission?.mainTasks || ['找出真兇：還原案發當天的真相，並找出殺害死者的真正兇手。'];
              const hiddenTasks = personalMission?.hiddenTasks || [];
              const hiddenTaskNote = personalMission?.hiddenTaskNote || '';

              return (
                <div className="flex flex-col h-full min-h-0">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 shrink-0">
                    <ClipboardList className="text-indigo-400" /> 任務目標
                  </h2>
                  <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full">
                    
                    {/* 主要任務 (靛藍色視覺) */}
                    {mainTasks.map((task: string, idx: number) => (
                      <div key={`main-${idx}`} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg tracking-wide flex items-center gap-2">
                            公開任務 {idx + 1}
                          </div>
                          <div className="text-sm text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap">{task}</div>
                        </div>
                      </div>
                    ))}

                    {/* 隱藏任務 (紅色警戒視覺) */}
                    {hiddenTasks.map((task: string, idx: number) => (
                      <div key={`hidden-${idx}`} className="flex items-start gap-3 p-4 bg-rose-950/20 rounded-xl border border-rose-900/50 relative overflow-hidden">
                        {/* 背景警戒斜線裝飾 */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #e11d48 10px, #e11d48 20px)' }} />
                        
                        <div className="w-6 h-6 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0 mt-0.5 relative z-10 shadow-[0_0_10px_rgba(225,29,72,0.3)]">
                          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                        </div>
                        <div className="relative z-10 w-full">
                          <div className="font-bold text-rose-400 text-lg tracking-wide flex flex-wrap items-center gap-2">
                            個人隱藏任務 {idx + 1}
                            {/* 如果有特別註記 (如: 極度危險！)，則顯示為紅色標籤 */}
                            {hiddenTaskNote && idx === 0 && (
                              <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-mono tracking-wider ml-auto sm:ml-2">
                                {hiddenTaskNote}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap">{task}</div>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        {/* 🌟 Wrapper 強制 flex-[11] 比例，讓發言助手在打開時撐滿 11/30 的寬度
            [&>*]:!w-full 確保內部 SpeechHelperPanel 填滿 wrapper 寬度 */}
        <div className={cn(
          "transition-all duration-300 flex overflow-hidden",
          isHelperPanelOpen ? "flex-[11] min-w-[420px] [&>*]:!w-full" : "w-0"
        )}>
          <SpeechHelperPanel
            isOpen={isHelperPanelOpen}
            onClose={() => setIsHelperPanelOpen(false)}
            onItemClick={handleHelperItemClick}
          />
        </div>
      </div>

      {/* Bottom Subtitle & Mic Bar */}
      <div className="h-24 bg-slate-950 border-t border-slate-800 flex items-center px-8 gap-6 shrink-0 relative">

        {/* 🌟 替換這裡：讓輪流發言與自由討論共用這個膠囊計時器，並改變顏色與時間來源 */}
        {(meetingStage === 'round_robin' || meetingStage === 'free_discussion') && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-t-xl px-6 py-2 flex items-center gap-3 shadow-lg">
            <Clock size={16} className={meetingStage === 'round_robin' ? "text-indigo-400" : "text-amber-400"} />
            <span className="text-slate-300 font-medium">
              {meetingStage === 'round_robin' ? '發言剩餘時間' : '自由討論時間'}
            </span>
            <span className={cn(
              "text-xl font-mono font-bold",
              meetingStage === 'round_robin' ? "text-white" : "text-amber-400"
            )}>
              {meetingStage === 'round_robin' 
                ? `${Math.floor(turnTimeLeft / 60).toString().padStart(2, '0')}:${(turnTimeLeft % 60).toString().padStart(2, '0')}`
                : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
              }
            </span>
          </div>
        )}

        {/* 🌟 修正 4：麥克風按鈕的禁用邏輯 (封麥階段鎖死) */}
        {(() => {
          const isMicDisabled = 
            (meetingStage === 'round_robin' && currentSpeaker?.id !== socket?.id) || 
            meetingStage === 'organizing' || 
            meetingStage === 'voting_prompt';
          
          return (
            <button
              onClick={toggleMic}
              disabled={isMicDisabled}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all shadow-lg",
                isMicOn
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700",
                isMicDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isMicOn ? <Mic2 size={24} /> : <div className="relative"><Mic2 size={24} /><div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-0.5 bg-slate-400 rotate-45" /></div></div>}
            </button>
          );
        })()}

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl h-16 flex items-center overflow-hidden relative">
          <div
            className="absolute left-0 top-0 bottom-0 bg-emerald-900/30 transition-all duration-200 ease-out"
            style={{ width: `${currentVolume}%` }}
          />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 z-10" />
          {/* 將原本顯示字幕的行替換成以下狀態提示 */}
          <div className="text-slate-300 text-lg font-medium px-4 relative z-10 flex items-center gap-3">
            {isMicOn ? (
              <>
                <Mic2 size={18} className="animate-pulse text-emerald-400" /> 
                <span className="text-emerald-400">發言錄製中...</span>
              </>
            ) : (
              <span className="text-slate-500">等待發言...</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-800 border border-slate-700 rounded-xl px-4 h-16 min-w-[80px]">
          <div className="text-xs text-slate-400 font-medium mb-0.5">語速</div>
          <div className="text-emerald-400 font-mono font-bold flex items-baseline gap-1">
            {currentCPM} <span className="text-[10px] text-slate-500">CPM</span>
          </div>
        </div>

        {/* 🌟 修正 5：結束發言按鍵只在輪流階段出現 */}
        {meetingStage === 'round_robin' && currentSpeaker?.id === socket?.id && (
          <button
            onClick={() => {
              setShowTurnAlert(false);
              skipTurn();
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30"
          >
            結束發言
          </button>
        )}

        {/* 🌟 修改 2：右下角的按鈕區塊，把倒數計時整合進「已就緒」按鈕中 */}
        <div className="flex gap-4">
          {isHost && (
            <button
              onClick={() => {
                if (window.confirm('確定要強制終止並解散當前遊戲嗎？')) {
                  socket?.emit('disband_room');
                }
              }}
              className="px-6 py-3 bg-red-900/50 hover:bg-red-900/70 text-red-400 border border-red-900/50 rounded-xl font-medium transition-colors"
            >
              解散遊戲
            </button>
          )}

          {(meetingStage === 'organizing' || meetingStage === 'free_discussion') && (
            <button
              disabled={isMeReady}
              onClick={() => socket?.emit('meeting_ready')}
              className={cn(
                "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                isMeReady 
                  ? "bg-slate-800 text-emerald-500 border border-emerald-900 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              )}
            >
              {isMeReady ? (
                <span>已就緒 (等待其他人)</span>
              ) : (
                <>
                  <Clock size={18} className="animate-pulse text-emerald-200" />
                  <span>
                    我已就緒
                    {/* 這裡把倒數計時用明顯的黑底包裝起來 */}
                    <span className="ml-2 font-mono bg-black/20 px-2 py-0.5 rounded text-lg tracking-wider">
                      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 輪到我發言提示 */}
      <AnimatePresence>
        {showTurnAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-4 border border-emerald-400"
          >
            <Mic2 size={28} className="animate-pulse" />
            <div>
              <div className="text-lg font-black tracking-wide">輪到你發言了！</div>
              <div className="text-emerald-200 text-sm">請開啟麥克風開始說話</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Silence Warning Modal */}
      <AnimatePresence>
        {silenceWarning.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-red-500/50 p-10 rounded-3xl text-center max-w-md shadow-[0_0_50px_rgba(239,68,68,0.2)] relative">
              <button
                onClick={() => {
                  setSilenceWarning({ active: false, countdown: 0 });
                  if (socket) socket.emit('user_speaking'); // Cancel warning on server
                }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <AlertTriangle size={64} className="text-red-500 mx-auto mb-6 animate-pulse" />
              <h3 className="text-3xl font-bold text-white mb-4 tracking-wider">請開始發言</h3>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">偵測到您長時間未發言，若不發言將自動跳過您的回合。</p>
              <div className="text-8xl font-black text-red-500 font-mono mb-4">{silenceWarning.countdown}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* 階段一：整理思緒時間 */}
        {meetingStage === 'organizing' && !dismissedOrganizeAlert && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-4 tracking-widest text-shadow-sm">整理思緒時間</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                所有人發言完畢，麥克風已暫時關閉。<br/>請利用這段時間重新檢視線索與筆記。<br/><br/>
                <span className="text-emerald-400 font-bold">準備好後，請點擊右下角的「已就緒」。</span>
              </p>
              <button
                onClick={() => setDismissedOrganizeAlert(true)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-lg w-full"
              >
                我知道了
              </button>
            </div>
          </motion.div>
        )}

        {/* 🌟 新增：第一輪自由討論的開場彈窗 */}
        {meetingStage === 'free_discussion' && (roomState as any)?.currentRound === 1 && !dismissedFreeDiscussionAlert && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md shadow-2xl">
              <h2 className="text-3xl font-black text-amber-400 mb-4 tracking-widest text-shadow-sm">自由討論環節</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                現在是第一輪自由討論時間，<span className="text-amber-400 font-bold">限時 5 分鐘</span>。<br/><br/>
                請開啟麥克風，與大家交流剛才搜查到的線索與推理！
              </p>
              <button
                onClick={() => setDismissedFreeDiscussionAlert(true)}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-lg w-full"
              >
                開始討論
              </button>
            </div>
          </motion.div>
        )}

        {/* 🌟 階段二：詢問是否延長討論 */}
        {meetingStage === 'voting_prompt' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-black text-white mb-6">是否需要延長討論？</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl">
              如果有人認為需要，將增加 5 分鐘自由討論時間。<br/>
              {/* 👇 根據回合數顯示不同文字 */}
              若所有人都準備好，將進入<strong className="text-amber-400">{(roomState as any)?.currentRound === 1 ? '第二輪搜查' : '最終投票指認'}</strong>。
            </p>
            {!hasVotedDiscussion ? (
              <div className="flex flex-col sm:flex-row gap-6">
                <button onClick={() => socket?.emit('vote_more_discussion', true)} className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-xl transition-transform hover:scale-105 shadow-lg">
                  是，我還需要討論
                </button>
                <button onClick={() => socket?.emit('vote_more_discussion', false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-xl transition-transform hover:scale-105 shadow-lg">
                  {/* 👇 按鈕文字也動態顯示 */}
                  否，進入{(roomState as any)?.currentRound === 1 ? '第二輪搜查' : '投票'}
                </button>
              </div>
            ) : (
              <div className="text-2xl text-amber-500 font-bold animate-pulse">已送出意願，等待其他人完成選擇...</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 輪到我發言提示 */}
      <AnimatePresence>
        {showTurnAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-4 border border-emerald-400"
          >
            <Mic2 size={28} className="animate-pulse" />
            <div>
              <div className="text-lg font-black tracking-wide">輪到你發言了！</div>
              <div className="text-emerald-200 text-sm">請開啟麥克風開始說話</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Silence Warning Modal */}
      <AnimatePresence>
        {silenceWarning.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-red-500/50 p-10 rounded-3xl text-center max-w-md shadow-[0_0_50px_rgba(239,68,68,0.2)] relative">
              <button
                onClick={() => {
                  setSilenceWarning({ active: false, countdown: 0 });
                  if (socket) socket.emit('user_speaking'); // Cancel warning on server
                }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <AlertTriangle size={64} className="text-red-500 mx-auto mb-6 animate-pulse" />
              <h3 className="text-3xl font-bold text-white mb-4 tracking-wider">請開始發言</h3>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">偵測到您長時間未發言，若不發言將自動跳過您的回合。</p>
              <div className="text-8xl font-black text-red-500 font-mono mb-4">{silenceWarning.countdown}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* 🌟 階段一：整理思緒時間 (改成可關閉的輕量彈窗) */}
        {meetingStage === 'organizing' && !dismissedOrganizeAlert && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-4 tracking-widest text-shadow-sm">整理思緒時間</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                所有人發言完畢，麥克風已暫時關閉。<br/>請利用這段時間重新檢視線索與筆記。<br/><br/>
                <span className="text-emerald-400 font-bold">準備好後，請點擊右下角的「已就緒」。</span>
              </p>
              <button
                onClick={() => setDismissedOrganizeAlert(true)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-lg w-full"
              >
                我知道了
              </button>
            </div>
          </motion.div>
        )}

        {/* 🌟 階段二：詢問是否延長討論 */}
        {meetingStage === 'voting_prompt' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-black text-white mb-6">是否需要延長討論？</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl">
              如果有人認為需要，將增加 5 分鐘自由討論時間。<br/>若所有人都準備好，將直接進入最終投票指認。
            </p>
            {!hasVotedDiscussion ? (
              <div className="flex flex-col sm:flex-row gap-6">
                <button onClick={() => socket?.emit('vote_more_discussion', true)} className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-xl transition-transform hover:scale-105 shadow-lg">
                  是，我還需要討論
                </button>
                <button onClick={() => socket?.emit('vote_more_discussion', false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-xl transition-transform hover:scale-105 shadow-lg">
                  否，直接進入投票
                </button>
              </div>
            ) : (
              <div className="text-2xl text-amber-500 font-bold animate-pulse">已送出意願，等待其他人完成選擇...</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};