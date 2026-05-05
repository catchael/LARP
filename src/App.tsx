import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, AlertTriangle, LogOut, Check, CheckCircle, CheckCircle2, Mic, MicOff, Clock, ClipboardList } from 'lucide-react';
import { User, Survey, AppPhase, TeachingModule, ScriptRecord, AssessmentReport, RoomState, cn } from './types';
import { Evidence } from './gameData';
import { io, Socket } from 'socket.io-client';
import { useSubtitles } from './hooks/useSubtitles';
import { useTranscript } from './hooks/useTranscript';

// Data
import { SCRIPTS } from './data/scripts';
import { DIARY_CONTENT } from './data/diaryContent';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { IntroScreen } from './screens/IntroScreen';
import { SurveyScreen } from './screens/SurveyScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { TeachingScreen } from './screens/TeachingScreen';
import { ScriptLobbyScreen } from './screens/ScriptLobbyScreen';
import { ScriptDetailScreen } from './screens/ScriptDetailScreen';
import { RoomLobbyScreen } from './screens/RoomLobbyScreen';
import { CharacterPreviewScreen } from './screens/CharacterPreviewScreen';
import { GameProfileScreen } from './screens/GameProfileScreen';
import { MissionBriefingScreen } from './screens/MissionBriefingScreen';
import { GameSearchScreen } from './screens/GameSearchScreen';
import { SearchEndScreen } from './screens/SearchEndScreen';
import { GameMeetingScreen, CharacterNote } from './screens/GameMeetingScreen';
import { ActScreen } from './screens/ActScreen';
import { VotingScreen } from './screens/VotingScreen';
import { VoteRevealScreen } from './screens/VoteRevealScreen';
import { GameEndingScreen } from './screens/GameEndingScreen';
import { TruthScreen } from './screens/TruthScreen';
// 把原本的 TIE_ENDING_ID 改成 TIE_ENDING_IDS
import { CHARACTER_TO_ENDING_ID, TRUE_KILLERS, TIE_ENDING_IDS } from './data/endingScripts';
import { DiaryRevealScreen } from './screens/DiaryRevealScreen';
import { AvatarSelectionScreen } from './screens/AvatarSelectionScreen';

// Components
import { ExitModal } from './components/ExitModal';
import { JoinModal } from './components/JoinModal';
import { ScriptIntroModal } from './components/ScriptIntroModal';
import { RecordsPanel } from './components/RecordsPanel';
import { FloorPlan } from './components/FloorPlan';
import { RoomView } from './components/RoomView';
import { Backpack } from './components/Backpack';
import { NotebookModal } from './components/NotebookModal';
import { EvidenceModal } from './components/EvidenceModal';
import { ShopModal } from './components/ShopModal';
import { Mascot } from './components/Mascot';
import { ReportPage } from './components/ReportModal';
import SinglePlayerApp from './single-player/SinglePlayerApp';

export default function App() {
  const scriptIdRef = useRef<number>(1);
  const [phase, setPhase] = useState<AppPhase>('login');
  // 🌟 新增：用來控制問卷彈窗的顯示，以及記住剛玩完的劇本名稱
  const [isNewUser, setIsNewUser] = useState(false);
  const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);
  const [lastPlayedScript, setLastPlayedScript] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [currentSurvey, setCurrentSurvey] = useState<Record<number, number>>({});
  const [activeModule, setActiveModule] = useState<TeachingModule | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [speechRateHistory, setSpeechRateHistory] = useState<{ time: string; rate: number }[]>([]);
  const [showRecordsPanel, setShowRecordsPanel] = useState(false);
  const [recordsView, setRecordsView] = useState<'menu' | 'scripts' | 'surveys' | 'reports'>('menu');
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [scriptRecords, setScriptRecords] = useState<ScriptRecord[]>([]);
  const [assessmentReports, setAssessmentReports] = useState<AssessmentReport[]>([]);
  const [analyzingState, setAnalyzingState] = useState<'idle' | 'analyzing' | 'ready'>('idle');
  const [readyReport, setReadyReport] = useState<any>(null);
  const [viewingFullReport, setViewingFullReport] = useState<any>(null);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [previewScript, setPreviewScript] = useState<typeof SCRIPTS[0] | null>(null);
  const [showScriptIntro, setShowScriptIntro] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isProfileFlipped, setIsProfileFlipped] = useState(false);
  const [currentFloor, setCurrentFloor] = useState<'2F' | '1F' | 'B1'>('2F');
  const [gameRoomId, setGameRoomId] = useState<string | null>(null);
  const [activeSearchRoomId, setActiveSearchRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<Record<number, { email: string, socketId: string }[]>>({});
  const [publicRooms, setPublicRooms] = useState<Record<number, { id: string, hostEmail: string, currentPlayers: number }[]>>({});
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [backpack, setBackpack] = useState<Evidence[]>([]); // 當前搜查回合的背包（每回合清空）
  const [allCollectedEvidence, setAllCollectedEvidence] = useState<Evidence[]>([]); // 跨回合永久紀錄
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<Evidence | null>(null);

  // Notebook & Backpack State
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [notebookTab, setNotebookTab] = useState<'personal' | 'timeline' | 'profiles' | 'backpack' | 'info'>('timeline');
  const [infoSubTab, setInfoSubTab] = useState<'personal' | 'other'>('personal'); // 控制「個人/其他」
  const [selectedInfoId, setSelectedInfoId] = useState<string | null>(null);      // 紀錄目前正在看的文本 ID
  const [readInfoIds, setReadInfoIds] = useState<string[]>([]);                   // 紀錄「已經讀過」的文本 ID
  const [timelineNodes, setTimelineNodes] = useState<string[]>([]);
  const [privateCustomNodes, setPrivateCustomNodes] = useState<string[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<Record<string, Record<number, string>>>({});

  // Meeting Room State
  const [meetingTab, setMeetingTab] = useState<'notebook' | 'map' | 'script' | 'clues' | 'tasks'>('clues');
  const [meetingNotebookTab, setMeetingNotebookTab] = useState<'timeline' | 'profiles'>('timeline');
  const [newProfileNote, setNewProfileNote] = useState({ title: '', content: '', clueId: '' });
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const [isMicOn, setIsMicOn] = useState(false);

  const subtitlesHook = useSubtitles(['系統：歡迎來到會議室，請開始討論。']);
  const subtitles = subtitlesHook.displaySubtitles;   // 給 render 用，現有 subtitles 變數名不用改
  const transcriptHook = useTranscript();
  const allRoundsTranscript = transcriptHook.ordered; // 同上，render 不用改
  const currentRoundRef = useRef<number>(1);

  // 計算是否解鎖第二劇本 (條件：玩過劇本一 且 填寫過問卷)
  const hasPlayedScript1 = scriptRecords.some(r => r.script_name === SCRIPTS[0].title);
  const hasPlayedScript2 = scriptRecords.some(r => r.script_name === SCRIPTS[1].title);
  const hasFilledSurvey = surveys.length > 0;
  const isScript2Unlocked = hasPlayedScript1 && hasFilledSurvey;

  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentCPM, setCurrentCPM] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [meetingUsers, setMeetingUsers] = useState<any[]>([]);


  useEffect(() => {
    const savedUser = localStorage.getItem('larp_user');
    if (!savedUser) return;
    try {
      const parsed = JSON.parse(savedUser);
      const savedRoomId = localStorage.getItem(`larp_active_room_${parsed.email}`);

      if (savedRoomId) {
        // 🌟 情況 A：有未結束的房間，代表是斷線，執行自動重連
        setUser(parsed);
        setPhase(prev => prev === 'login' ? 'lobby' : prev);
        fetchSurveys(parsed.id);
        fetchRecords(parsed.id);
      } else {
        // 🌟 情況 B：正常結束遊戲，取消自動登入！
        // 我們幫玩家把 Email 預先填入輸入框，省去重打的麻煩，但維持在登入畫面
        setEmail(parsed.email);
      }
    } catch {}
  }, []);

  // Autoplay resume
  useEffect(() => {
    const resumeAudio = () => {
      const audios = document.querySelectorAll('audio[id^="audio-"]');
      audios.forEach(a => {
        const audio = a as HTMLAudioElement;
        if (audio.paused && audio.srcObject) {
          audio.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', resumeAudio);
    return () => window.removeEventListener('click', resumeAudio);
  }, []);

  const [currentSpeaker, setCurrentSpeaker] = useState<{ id: string; email: string; character: string; isMicOn: boolean; isAI?: boolean } | null>(null);
  const [turnEndTime, setTurnEndTime] = useState<number>(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(0);
  const [silenceWarning, setSilenceWarning] = useState<{ active: boolean; countdown: number }>({ active: false, countdown: 0 });

  // WebRTC State
  const [peerStatuses, setPeerStatuses] = useState<Record<string, 'connecting' | 'connected' | 'failed' | 'disconnected'>>({});

  const [newTimeNode, setNewTimeNode] = useState('');
  const [hasLoadedScriptTimeline, setHasLoadedScriptTimeline] = useState(false);
  const [selectedTimelineChar, setSelectedTimelineChar] = useState(0);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [selectedNotebookChar, setSelectedNotebookChar] = useState(0);
  const [characterNotes, setCharacterNotes] = useState<CharacterNote[]>([]);
  const [newNote, setNewNote] = useState({ time: '', text: '', title: '', clueId: ''  });
  const [evidenceAssociations, setEvidenceAssociations] = useState<Record<string, number>>({});
  const [notebookSelectedEvidence, setNotebookSelectedEvidence] = useState<Evidence | null>(null);
  const [isActPlaying, setIsActPlaying] = useState(false);
  const [currentActId, setCurrentActId] = useState<string>('');

  // 🌟 投票結果轉場
  const [votingReveal, setVotingReveal] = useState<{
    winner: string;
    voteCount: Record<string, number>;
  } | null>(null);
  const [isKillerCaught, setIsKillerCaught] = useState(false);
  const [showTieRevoteNotice, setShowTieRevoteNotice] = useState(false);
  const [fadeToBlack, setFadeToBlack] = useState(false);

  // Shop & Coins State
  const [coinCount, setCoinCount] = useState(0);
  const [backpackCapacity, setBackpackCapacity] = useState(4);
  const [unlockedAdvancedDetails, setUnlockedAdvancedDetails] = useState<string[]>([]);
  const [unlockedCharacterAdvanced, setUnlockedCharacterAdvanced] = useState<string[]>([]); 
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [collectedCoins, setCollectedCoins] = useState<string[]>([]);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const lastTimelineState = useRef<string>('');
  // 斷線重連狀態
  const [disconnectedUserEmail, setDisconnectedUserEmail] = useState<string | null>(null);
  const [reconnectTimeLeft, setReconnectTimeLeft] = useState(0);

  // WebRTC Refs
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentVolumeRef = useRef(0);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const isMicRequestingRef = useRef(false); // ✅ 防止重複請求麥克風
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const roomStateRef = useRef<RoomState | null>(null);
  useEffect(() => { roomStateRef.current = roomState; }, [roomState]);

  // 🌟 累積這局所有發言
  const dialogueRef = useRef<{ speaker: string; text: string }[]>([]);
  const me = roomState?.users.find(u => u.email === user?.email);
  const isHost = !!me?.isHost;

  // 監聽麥克風開關，控制錄音與上傳
  useEffect(() => {
    if (isMicOn && localStreamRef.current && phase === 'game_meeting') {
      const stream = localStreamRef.current;

      // 🌟 嘗試用 Opus 編碼，比預設品質好
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // 🌟 關鍵修正：每段錄音用「自己的」chunks 陣列（closure 捕獲），
      //    不再共用 audioChunksRef，避免被下一次錄音清掉
      const localChunks: BlobPart[] = [];

      // 🌟 在錄音開始那瞬間就鎖定回合
      const lockedRound = currentRoundRef.current;
      const lockedTimestamp = Date.now();
      const lockedPhase: 'turn' | 'free' = 
        (roomStateRef.current as any)?.meetingStage === 'free_discussion' ? 'free' : 'turn';

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        console.log(`[錄音] stop 觸發，chunks=${localChunks.length}, 總 byte=${
          localChunks.reduce((s, c: any) => s + (c.size || 0), 0)
        }`);

        if (localChunks.length === 0) {
          console.warn('[錄音] 沒有收到任何 chunk，可能是太短或瀏覽器問題');
          return;
        }
        const audioBlob = new Blob(localChunks, { type: mimeType });

        const currentRoom = roomStateRef.current;
        const myUser = currentRoom?.users.find(u => u.email === user?.email);
        const myCharName = myUser?.assignedCharacter || user?.email || '';
        const scriptId = currentRoom?.scriptId || 1;

        const formData = new FormData();
        formData.append('audio', audioBlob, 'turn.webm');
        formData.append('character', myCharName);
        formData.append('scriptId', String(scriptId));
        formData.append('userId', String(user?.id));
        formData.append('startTimestamp', String(lockedTimestamp));
        formData.append('phase', lockedPhase);

        try {
          const res = await fetch('/api/process-voice-turn', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          console.log(`[STT] 收到回傳：${data.text?.length || 0} 字`);
          if (data.success && data.text) {
            subtitlesHook.appendFinal(data.text);
            dialogueRef.current.push({ speaker: myCharName, text: data.text });
            transcriptHook.append({
              round: lockedRound,
              line: data.text,
              startTimestamp: lockedTimestamp,
              phase: lockedPhase,
            });
            socket?.emit('final_transcript', {
              line: data.text,
              round: lockedRound,
              startTimestamp: lockedTimestamp,
              phase: lockedPhase,
            });
          }
        } catch (e) {
          console.error("[STT] 上傳失敗", e);
        }
      };

      // 🌟 加 timeslice 1000ms：每秒 flush 一次 chunk，
      //    就算瀏覽器或 stream 突然中斷，也不會把整段語音弄丟
      mediaRecorder.start(1000);
      console.log(`[錄音] 開始（mimeType=${mimeType}, round=${lockedRound}）`);

    } else if (!isMicOn && mediaRecorderRef.current?.state === 'recording') {
      console.log('[錄音] 偵測到 isMicOn=false，呼叫 stop()');
      mediaRecorderRef.current.stop();
    }
  }, [isMicOn, phase, user?.id]);

  // 🌟 修改：控制吉祥物「飛出來幾秒就回去」的廣播事件
  useEffect(() => {
    if (phase === 'lobby') {
      if (analyzingState === 'analyzing') {
        window.dispatchEvent(new CustomEvent('mascot-alert', {
          detail: { message: "分析報告正在生成中，等好了，鳥會提醒你啾！", isCentered: true }
        }));
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mascot-alert', { detail: { message: "", isCentered: false } }));
        }, 4000);
        return () => clearTimeout(timer);
      } else if (analyzingState === 'ready') {
        window.dispatchEvent(new CustomEvent('mascot-alert', {
          detail: { message: `你的《${lastPlayedScript}》劇本分析出爐了！現在要看嗎~`, isCentered: true }
        }));
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mascot-alert', { detail: { message: "點擊下方的按鈕可以查看報告喔！", isCentered: false } }));
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        window.dispatchEvent(new CustomEvent('mascot-alert', { detail: null }));
      }
    } 
    // 🌟 劇本大廳專屬吉祥物引導
    else if (phase === 'script_lobby') {
      if (!isScript2Unlocked) {
        window.dispatchEvent(new CustomEvent('mascot-alert', {
          detail: { message: "新手偵探，請先從《窒息地下室》開始調查啾！", isCentered: false }
        }));
      } else if (!hasPlayedScript2) { // 👈 加入還沒玩過劇本二的判斷
        window.dispatchEvent(new CustomEvent('mascot-alert', {
          detail: { message: "太棒了！《窒息地下室》已破案，快來挑戰下一個劇本啾！", isCentered: false }
        }));
      } else { // 👈 兩個都破案了！
        window.dispatchEvent(new CustomEvent('mascot-alert', {
          detail: { message: "恭喜大偵探！所有懸案都已偵破！快來試試專屬的單人挑戰吧啾！", isCentered: false }
        }));
      }
    }
  }, [phase, analyzingState, lastPlayedScript, isScript2Unlocked]);

  // 🌟 新增：把 currentRound 映射到 ref，方便在 setter callback 裡讀
  useEffect(() => {
    currentRoundRef.current = (roomState as any)?.currentRound ?? 1;
  }, [roomState]);

  // 🌟 每次進入搜查階段時清空當前背包、已撿金幣、已解鎖進階特徵（人物+證物）
  useEffect(() => {
    if (phase === 'game_search') {
      setBackpack([]);
      setCollectedCoins([]);
      setUnlockedAdvancedDetails([]);
    setUnlockedCharacterAdvanced([]);
      setUnlockedCharacterAdvanced([]);
    }
  }, [phase]);

  // 🌟 新增：當進入會議階段時，強制清空之前演出或搜查殘留的 STT 字幕
  useEffect(() => {
    if (phase === 'game_meeting') {
      subtitlesHook.reset(['系統：歡迎來到會議室，請開始討論。']);
    }
  }, [phase]);

  // 🌟 進入封麥階段（整理思緒、投票）時，強制關掉已開啟的麥克風
  //    避免玩家在 search_end 開麥後進會議室，整理思緒階段仍顯示為開麥狀態
  useEffect(() => {
    const meetingStage = (roomState as any)?.meetingStage;
    const isSealedStage = meetingStage === 'organizing' || meetingStage === 'pre_round_organizing' || meetingStage === 'voting_prompt';
    if (isSealedStage && isMicOn) {
      setIsMicOn(false);
      socket?.emit('toggle_mic', false);
    }
  }, [(roomState as any)?.meetingStage]);

  const resetRoomState = () => {

    if (user?.email) {
      localStorage.removeItem(`larp_active_room_${user.email}`);
    }

    setDisconnectedUserEmail(null);
    setReconnectTimeLeft(0);
    if ((window as any).reconnectInterval) clearInterval((window as any).reconnectInterval);

    // 1. 清空房間與玩家狀態
    setRoomState(null);
    setGameRoomId(null);
    setMeetingUsers([]);
    setCurrentSpeaker(null);
    setIsGameStarted(false);
    setCurrentFloor('2F');
    setActiveSearchRoomId(null);

    // 2. 清空遊戲進度與背包
    setBackpack([]);
    setAllCollectedEvidence([]);
    setSelectedEvidence(null);
    setViewingEvidence(null);
    setCollectedCoins([]);
    setCoinCount(0);
    setBackpackCapacity(4);
    setUnlockedAdvancedDetails([]);
    setUnlockedCharacterAdvanced([]);

    // 3. 清空筆記本與會議室字幕
    setTimelineNodes([]);
    setPrivateCustomNodes([]); // 🌟 新增這行
    setHasLoadedScriptTimeline(false);
    setTimelineEvents({});
    setCharacterNotes([]);
    subtitlesHook.reset(['系統：歡迎來到會議室，請開始討論。']);
    transcriptHook.reset();
    setMeetingTab('clues');
    setIsNotebookOpen(false);
    setIsBackpackOpen(false);
    setIsShopOpen(false);
    setNotebookTab('personal');
    setNotebookSelectedEvidence(null);
    setEvidenceAssociations({});
    setExpandedNoteId(null);
    setReadInfoIds([]);
    setNewProfileNote({ title: '', content: '', clueId: '' });
    setSelectedInfoId(null);
    setInfoSubTab('personal');
    setNewTimeNode('');
    setUnlockedCharacterAdvanced([]);
    setShowTieRevoteNotice(false);
    setIsKillerCaught(false);

    // 4. 清理 WebRTC 連線與音效資源 (避免聽到上一個房間的聲音)
    Object.values(peerConnections.current).forEach((pc: any) => pc.close());
    peerConnections.current = {};
    const audios = document.querySelectorAll('audio[id^="audio-"]');
    audios.forEach(a => a.remove());

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 🌟 5. 新增：清空麥克風與計時器狀態
    setIsMicOn(false);
    setTurnTimeLeft(0);
    setTimeLeft(120);
    setSilenceWarning({ active: false, countdown: 0 });
    setIsProfileFlipped(false);
  };

  const handleActComplete = useCallback(() => {
    // 🌟 修正 1：改用 .includes('ending') 來捕捉所有包含 ending 的劇本 ID
    if (currentActId.includes('ending')) {
      setIsActPlaying(false);
      setCurrentActId('');
      
      // 🌟 修正 2：移除錯誤的 local state 設定，直接由房主觸發勝負結算
      // (原本的 setPhase('truth_revealed') 是錯的，因為下一步其實是進入 game_ending)
      if (isHost) socket?.emit('start_ending_phase');
      return;
    }
    
    setIsActPlaying(false);
    setCurrentActId('');
    socket?.emit('end_act');
  }, [currentActId, socket, isHost]);

  const createPeerConnection = (targetId: string, socket: Socket) => {
    if (peerConnections.current[targetId]) return peerConnections.current[targetId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
    });

    // 🌟 核心修正：強制建立音訊雙向通道，確保後續操作不用重新協商 (避免 Signaling Glare)
    pc.addTransceiver('audio', { direction: 'sendrecv' });

    setPeerStatuses(prev => ({ ...prev, [targetId]: 'connecting' }));

    pc.oniceconnectionstatechange = () => {
      setPeerStatuses(prev => ({ ...prev, [targetId]: pc.iceConnectionState as any }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice', { target: targetId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      let audio = document.getElementById(`audio-${targetId}`) as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = `audio-${targetId}`;
        audio.autoplay = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = remoteStream;
      audio.play().catch(e => {
        console.error("Audio play failed", e);
      });
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { target: targetId, sdp: offer });
      } catch (err) {
        console.error("Negotiation error", err);
      }
    };

    // 🌟 若麥克風已就緒，將音軌直接綁入剛建立的通道中
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      const sender = pc.getSenders()[0];
      if (sender && track) {
        sender.replaceTrack(track).catch(e => console.warn(e));
      }
    }

    peerConnections.current[targetId] = pc;
    return pc;
  };

  const handleDeleteTimeNode = (timeToDelete: string) => {
    if (window.confirm(`確定要刪除「${timeToDelete}」這個時間點嗎？這會同時清空該時間點的所有紀錄喔！`)) {
      setTimelineNodes(prev => prev.filter(t => t !== timeToDelete));
      setPrivateCustomNodes(prev => prev.filter(t => t !== timeToDelete));
      
      setTimelineEvents(prev => {
        const newEvents = { ...prev };
        delete newEvents[timeToDelete];
        return newEvents;
      });
      socket?.emit('delete_timeline_node', { time: timeToDelete });
    }
  };

  const handleUnlockCharacterAdvanced = (characterName: string) => {
    setUnlockedCharacterAdvanced(prev =>
      prev.includes(characterName) ? prev : [...prev, characterName]
    );
  };

  // Socket Management
  useEffect(() => {
    if (!user) return;

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket 連線成功');

      // ✅ 確保 user 存在（可能從 localStorage 讀回）
      const currentUser = user; // 如果你有把 user 存 localStorage 的話，這裡要讀回
      if (currentUser?.email) {
        const savedRoomId = localStorage.getItem(`larp_active_room_${currentUser.email}`);
        if (savedRoomId) {
          newSocket.emit('rejoin_room', { email: currentUser.email, roomId: savedRoomId });
        }
      }
    });

    newSocket.on('online_players_update', (data: { scriptId: number, players: any[] }) => {
      setOnlinePlayers(prev => ({ ...prev, [data.scriptId]: data.players }));
    });

    newSocket.on('public_rooms_update', (data: { scriptId: number, rooms: any[] }) => {
      setPublicRooms(prev => ({ ...prev, [data.scriptId]: data.rooms }));
    });

    newSocket.on('room_state', (state: any) => {
      setRoomState(state);
      setGameRoomId(state.id);

      if (user?.email) {
        localStorage.setItem(`larp_active_room_${user.email}`, state.id);
      }

      // 🌟 新增：重連後 meetingUsers 的 socket id 會變動，
      //         把對不到新清單的舊 peer 全部關掉，避免殘留爆音 / 殭屍連線
      if (state.meetingUsers) {
        const currentIds = state.meetingUsers.map((u: any) => u.id);
        Object.keys(peerConnections.current).forEach(id => {
          if (!currentIds.includes(id)) {
            peerConnections.current[id].close();
            delete peerConnections.current[id];
            document.getElementById(`audio-${id}`)?.remove();
          }
        });
      }

      if (state.timelineNodes && state.timelineNodes.length > 0) {
        setTimelineNodes(state.timelineNodes);
        setTimelineEvents(state.timelineEvents || {});
        setHasLoadedScriptTimeline(true); // 標記已載入，防止劇本預設值再次觸發
      }

      setMeetingUsers(state.meetingUsers || []);
      setCurrentSpeaker(state.currentSpeaker || null);
      setTurnEndTime(state.turnEndTime || 0);

      if (state.scriptId) {
        scriptIdRef.current = state.scriptId;
        const script = SCRIPTS.find(s => s.id === state.scriptId);
        if (script) setPreviewScript(script);
      }

      if (state.currentActId) {
        setCurrentActId(state.currentActId);
        setIsActPlaying(true);
      }

      if (state.status === 'playing') {
        setIsGameStarted(true);

        setPhase(state.phase);
        if (state.phaseEndTime) {
          const remaining = Math.max(0, Math.floor((state.phaseEndTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        } else if (state.phase === 'game_search') {
          // 🌟 如果沒有收到 phaseEndTime（代表第二幕正在演），先把畫面數字凍結在 300
          setTimeLeft(300);
        }

        // 進入會議室時清掉搜索階段遺留的房間 id，避免地圖顯示小區域
        if (state.phase === 'game_meeting') {
          setActiveSearchRoomId(null);
        }
      } else {
        setIsGameStarted(false);
        setPhase(state.phase);
      }
      
      // 🌟 Initiate WebRTC calls in any voice-enabled phase (角色預覽開始就能通話)
      const VOICE_PHASES = ['room_lobby', 'character_preview', 'game_profile', 'mission_briefing', 'game_search', 'search_end', 'game_meeting', 'truth_revealed']; 
        if (VOICE_PHASES.includes(state.phase) && newSocket) {
          state.meetingUsers?.forEach((u: any) => {
            if (u.id !== newSocket.id && !u.isAI && !peerConnections.current[u.id]) {
              // Simple rule to decide who initiates the call (lexicographical order of socket IDs)
              const currentSocketId = newSocket.id || "";
              if (currentSocketId < u.id) {
                const pc = createPeerConnection(u.id, newSocket);
                pc.createOffer().then(offer => {
                  pc.setLocalDescription(offer);
                  newSocket.emit('webrtc_offer', { target: u.id, sdp: offer });
                });
              }
            }
          });
        }
    });

    newSocket.on('game_started', (data: { users: any[] }) => {
      const myUser = data.users.find(u => u.email === user.email);
      if (myUser) {
        // 🌟 修正 1：這裡也改用 scriptIdRef，確保抓到正確的劇本角色索引
        const script = SCRIPTS.find(s => s.id === scriptIdRef.current) || SCRIPTS[0];
        const charIdx = script.characters.findIndex(c => c.name === myUser.assignedCharacter);
        if (charIdx >= 0) setCurrentCharacterIndex(charIdx);
      }

      setIsActPlaying(prev => {
        if (!prev) {
          // 🌟 修正 2：在 useEffect 閉包內，必須使用 scriptIdRef.current 才能拿到最新值！
          // 這樣就不會永遠 fallback 到 1 了。
          const scriptId = Number(scriptIdRef.current) || 1;
          setCurrentActId(`script${scriptId}_prologue`); 
          return true;
        }
        return prev;
      });
    });

    newSocket.on('act_ended', () => {
      setIsActPlaying(false);
      setCurrentActId('');
    });

    // 🌟 確保這段存在：把演出畫面叫出來的關鍵！
    newSocket.on('act_started', (data: { actId: string }) => {
      setCurrentActId(data.actId);
      setIsActPlaying(true);
    });

    newSocket.on('tie_revote_started', () => {
      setShowTieRevoteNotice(true);
      setTimeout(() => setShowTieRevoteNotice(false), 4000);
    });

    newSocket.on('voting_finished', (votes: Record<string, string>) => {
      const currentScriptId = scriptIdRef.current; 

      const voteCount: Record<string, number> = {};
      Object.values(votes).forEach(t => { voteCount[t] = (voteCount[t] || 0) + 1; });
      const max = Math.max(...Object.values(voteCount));
      const topChars = Object.keys(voteCount).filter(c => voteCount[c] === max);
      const isTie = topChars.length > 1;

      if (isTie) {
        setIsKillerCaught(false);
        setFadeToBlack(true);
        setTimeout(() => {
          // 🌟 修改：根據當前劇本 ID 取得平局結局
          setCurrentActId(TIE_ENDING_IDS[currentScriptId]);
          setIsActPlaying(true);
        }, 800);
        setTimeout(() => setFadeToBlack(false), 1600);
      } else {
        const winner = topChars[0];
        setIsKillerCaught(winner === TRUE_KILLERS[currentScriptId]);
        setVotingReveal({ winner, voteCount });
        setTimeout(() => {
          setVotingReveal(null);
          setFadeToBlack(true);
        }, 3500);
        setTimeout(() => {
          // 🌟 修改：最後的防呆備用平局也改為動態獲取
          setCurrentActId(CHARACTER_TO_ENDING_ID[currentScriptId]?.[winner] ?? TIE_ENDING_IDS[currentScriptId]);
          setIsActPlaying(true);
        }, 4300);
        setTimeout(() => setFadeToBlack(false), 5100);
      }
    });

    // room_error
    newSocket.on('room_error', (msg: string) => {
      const isFatal = msg.includes('不存在') || msg.includes('解散') || msg.includes('不在房間內');

      if (isFatal) {
        if (user?.email) {
          localStorage.removeItem(`larp_active_room_${user.email}`);
        }
        resetRoomState();
        setPhase('lobby');
        setTimeout(() => alert(`發生錯誤：${msg}`), 0);
      } else {
        alert(`發生錯誤：${msg}`);
      }
    });

    // 監聽斷線與解散事件
    newSocket.on('player_disconnected', (data: { email: string, timeLimit: number }) => {
      setDisconnectedUserEmail(data.email);
      setReconnectTimeLeft(data.timeLimit);

      const interval = setInterval(() => {
        setReconnectTimeLeft(prev => {
          if (prev <= 1) clearInterval(interval);
          return prev - 1;
        });
      }, 1000);
      (window as any).reconnectInterval = interval;
    });

    newSocket.on('player_reconnected', (data: { email: string }) => {
      setDisconnectedUserEmail(null);
      if ((window as any).reconnectInterval) clearInterval((window as any).reconnectInterval);

      if (data?.email === user?.email) {
        console.log('[重連] 我自己重連成功，等待 room_state 恢復畫面');
      }
    });

    newSocket.on('your_player_state', (state: {
      backpack: any[];
      allCollectedEvidence: any[];
      characterNotes: any[];
      coinCount: number;
      collectedCoins: string[];
      evidenceAssociations: Record<string, number>;
      readInfoIds: string[];
      unlockedAdvancedDetails: string[];
      unlockedCharacterAdvanced?: string[];
    }) => {
      console.log('[重連] 還原個人遊戲進度', state);
      if (state.backpack)               setBackpack(state.backpack);
      if (state.allCollectedEvidence)   setAllCollectedEvidence(state.allCollectedEvidence);
      if (state.characterNotes)         setCharacterNotes(state.characterNotes);
      if (state.coinCount !== undefined) setCoinCount(state.coinCount);
      if (state.collectedCoins)         setCollectedCoins(state.collectedCoins);
      if (state.evidenceAssociations)   setEvidenceAssociations(state.evidenceAssociations);
      if (state.readInfoIds)            setReadInfoIds(state.readInfoIds);
      if (state.unlockedAdvancedDetails) setUnlockedAdvancedDetails(state.unlockedAdvancedDetails);
      if ((state as any).unlockedCharacterAdvanced) setUnlockedCharacterAdvanced((state as any).unlockedCharacterAdvanced);
    });

    newSocket.on('room_disbanded', (msg: string) => {
      // 🌟 先把畫面切回大廳，再彈提示，避免 alert 期間背景一片黑看起來像當機
      resetRoomState();
      setPhase('lobby');
      // 用 setTimeout 讓 React 先 commit 一次 render
      setTimeout(() => alert(msg), 0);
    });

    // WebRTC Signaling Listeners (Main)
    newSocket.on('webrtc_offer', async (data: { sender: string, sdp: RTCSessionDescriptionInit }) => {
      const pc = createPeerConnection(data.sender, newSocket);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit('webrtc_answer', { target: data.sender, sdp: answer });
    });

    newSocket.on('webrtc_answer', async (data: { sender: string, sdp: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current[data.sender];
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    });

    // Buffer ICE candidates until remote description is ready
    const icePendingCandidates: Record<string, RTCIceCandidateInit[]> = {};
    newSocket.on('webrtc_ice', async (data: { sender: string, candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current[data.sender];
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.warn('ICE error', e));
        // Flush any buffered candidates
        if (icePendingCandidates[data.sender]?.length) {
          for (const c of icePendingCandidates[data.sender]) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          icePendingCandidates[data.sender] = [];
        }
      } else {
        // Buffer until remote description is set
        if (!icePendingCandidates[data.sender]) icePendingCandidates[data.sender] = [];
        icePendingCandidates[data.sender].push(data.candidate);
      }
    });

    return () => {
      newSocket.disconnect();
      Object.values(peerConnections.current).forEach((pc: any) => pc.close());
      peerConnections.current = {};
      const audios = document.querySelectorAll('audio[id^="audio-"]');
      audios.forEach(a => a.remove());
    };
  }, [user]);

  // 1. 每當本地狀態改變時，同步給伺服器 (防迴圈版)
  useEffect(() => {
    const isActivePhase = ['game_search', 'game_meeting'].includes(phase);

    if (isGameStarted && socket && gameRoomId && isActivePhase && timelineNodes.length > 0) {
      // 🌟 新增防火牆：只抽出「全域公開節點 (timelineNodes)」的內容來同步，徹底隔離私密節點
      const publicEvents: Record<string, Record<number, string>> = {};
      timelineNodes.forEach(node => {
        if (timelineEvents[node]) {
          publicEvents[node] = timelineEvents[node];
        }
      });
      
      const currentStateStr = JSON.stringify({ nodes: timelineNodes, events: timelineEvents });
      
      // 🌟 只有當「目前的狀態」跟「最後一次同步的狀態」不同時，才發送
      if (lastTimelineState.current !== currentStateStr) {
        lastTimelineState.current = currentStateStr;
        socket.emit('update_timeline', {
          nodes: timelineNodes,
          events: publicEvents
        });
      }
    }
  }, [timelineNodes, timelineEvents, isGameStarted, socket, gameRoomId, phase]);

  // 個人遊戲進度同步到伺服器（用於斷線重連恢復）
  useEffect(() => {
    const isActivePhase = ['game_search', 'game_meeting', 'search_end'].includes(phase);
    if (!isGameStarted || !socket || !gameRoomId || !isActivePhase) return;

    // 🌟 連續變動時 debounce 500ms，最後一筆才送
    const timer = setTimeout(() => {
      socket.emit('save_player_state', {
        backpack,
        allCollectedEvidence,
        characterNotes,
        coinCount,
        collectedCoins,
        evidenceAssociations,
        readInfoIds,
        unlockedAdvancedDetails,
        unlockedCharacterAdvanced,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    backpack,
    characterNotes,
    coinCount,
    collectedCoins,
    evidenceAssociations,
    readInfoIds,
    unlockedAdvancedDetails,
    isGameStarted,
    socket,
    gameRoomId,
    phase,
  ]);

  // 2. 監聽來自伺服器的更新
  useEffect(() => {
    if (!socket) return;

    socket.on('timeline_updated', (data: { nodes: string[], events: any }) => {
      // 🌟 收到伺服器更新時，先更新 lastTimelineState 基準，防止觸發上方的 emit
      lastTimelineState.current = JSON.stringify(data);
      setTimelineNodes(data.nodes);
      setTimelineEvents(data.events);
    });

    return () => {
      socket.off('timeline_updated');
    };
  }, [socket]);

  useEffect(() => {
    if (socket && phase === 'script_detail' && previewScript) {
      socket.emit('enter_script_lobby', { email: user?.email, scriptId: previewScript.id });
      return () => {
        socket.emit('leave_script_lobby');
      };
    }
  }, [socket, phase, previewScript]);

  // 當打開筆記本時，自動切換到「預設頁面」
  useEffect(() => {
    if (isNotebookOpen && roomState && previewScript) {
      // 找出自己的身分 Index
      const myUser = roomState.users.find(u => u.email === user?.email);
      const myIndex = previewScript.characters.findIndex(c => c.name === myUser?.assignedCharacter);
      const finalIndex = myIndex !== -1 ? myIndex : 0;

      // 🌟 判斷：如果是會議室，預設跳到時間線；否則跳到個人檔案
      const isMeeting = roomState.phase === 'game_meeting';
      setNotebookTab(isMeeting ? 'timeline' : 'personal');

      // 強制將預設分頁設定為自己
      setSelectedNotebookChar(finalIndex);
      setSelectedTimelineChar(finalIndex);
    }
  }, [isNotebookOpen, roomState?.phase]);

  // 🌟 Always-on meeting_state：任何語音階段都要更新 meetingUsers (用於頭像麥克風圖示)
  //    注意：強制關麥邏輯已在 game_meeting 專用 effect 處理，這裡只做狀態同步
  useEffect(() => {
    if (!socket) return;

    const onMeetingStateGlobal = (state: any) => {
      setMeetingUsers(state.users || []);
      // 🌟 修正：只在 currentSpeaker 的 id 實際改變時才更新，
      //    避免 server 每次推播都重算 isMyTurn → 反覆觸發發言提醒彈窗
      setCurrentSpeaker(prev => {
        const next = state.currentSpeaker ?? null;
        if (prev?.id === next?.id) return prev;
        return next;
      });
      setTurnEndTime(state.turnEndTime);

      // Cleanup peer connections for users who left
      const currentIds = (state.users || []).map((u: any) => u.id);
      Object.keys(peerConnections.current).forEach(id => {
        if (!currentIds.includes(id)) {
          peerConnections.current[id].close();
          delete peerConnections.current[id];
          document.getElementById(`audio-${id}`)?.remove();
        }
      });
    };

    socket.on('meeting_state', onMeetingStateGlobal);
    return () => { socket.off('meeting_state', onMeetingStateGlobal); };
  }, [socket]);

  // 🌟 新增：進入閱讀檔案或地圖搜查時（且不是在演戲），自動強制關閉麥克風
  useEffect(() => {
    const isSilentPhase = ['game_profile', 'game_search'].includes(phase);
    if (isSilentPhase && !isActPlaying && isMicOn) {
      setIsMicOn(false);
      socket?.emit('toggle_mic', false);
    }
  }, [phase, isActPlaying]);

  // Meeting Room Logic (會議室專用：輪流制強制關麥、靜音警告、字幕/音量轉播)
  useEffect(() => {
    if (phase === 'game_meeting' && socket && user) {
      const onMeetingStateMeeting = (state: any) => {
        if (!state.isWarningActive) {
          setSilenceWarning({ active: false, countdown: 0 });
        }
        // 🌟 修正：強制關麥條件收緊
        //    1. 必須是「輪到別人說話」(不是自己)
        //    2. 且目前麥克風確實是開著的（避免冗餘的 setState）
        //    用 setIsMicOn functional form，讀取最新值再決定要不要關
        if (state.currentSpeaker?.id !== socket.id) {
          setIsMicOn(prev => {
            if (prev) {
              socket.emit('toggle_mic', false);
              return false;
            }
            return prev;
          });
        }
      };

      const onSilenceWarning = (data: any) => {
        if (data.speakerId === socket.id) {
          setSilenceWarning({ active: true, countdown: data.countdown });
        }
      };

      const onWarningCancelled = () => {
        setSilenceWarning({ active: false, countdown: 0 });
      };

      const onSpeakingData = (data: { volume?: number; cpm?: number; subtitle?: string }) => {
        if (data.volume !== undefined) setCurrentVolume(data.volume);
        if (data.cpm !== undefined) setCurrentCPM(data.cpm);
        if (data.subtitle) {
          const idx = data.subtitle.indexOf('：');
          if (idx > 0) {
            const speaker = data.subtitle.slice(0, idx);
            const text = data.subtitle.slice(idx + 1);
            subtitlesHook.updateLive(speaker, text);
          }
        }
      };

      socket.on('meeting_state', onMeetingStateMeeting);
      socket.on('silence_warning', onSilenceWarning);
      socket.on('warning_cancelled', onWarningCancelled);
      socket.on('speaking_data', onSpeakingData);

      const onFinalTranscript = (data: {
        line: string;
        round: number;
        startTimestamp?: number;
        phase?: 'turn' | 'free';
      }) => {
        console.log(`[final_transcript] 收到：${data.line.slice(0, 30)}...`);
        transcriptHook.append({
          round: data.round,
          line: data.line,
          startTimestamp: data.startTimestamp ?? Date.now(),
          phase: data.phase ?? 'turn',
        });
        const speaker = data.line.split('：')[0];
        if (speaker) subtitlesHook.clearLive(speaker);
      };
      socket.on('final_transcript', onFinalTranscript);

      return () => {
        socket.off('meeting_state', onMeetingStateMeeting);
        socket.off('silence_warning', onSilenceWarning);
        socket.off('warning_cancelled', onWarningCancelled);
        socket.off('speaking_data', onSpeakingData);
        socket.off('final_transcript', onFinalTranscript);
      };
    }
  }, [phase, socket, user]);

  // 🌟 語音相關階段：角色預覽、個人檔案、搜證、搜證結束、會議室都可以開麥通話
  const isVoicePhase = ['room_lobby', 'character_preview', 'game_profile', 'mission_briefing', 'game_search', 'search_end', 'game_meeting', 'truth_revealed'].includes(phase);

  // 🌟 離開所有語音階段時，關閉麥克風
  useEffect(() => {
    if (!isVoicePhase && isMicOn) {
      setIsMicOn(false);
      socket?.emit('toggle_mic', false);
    }
  }, [isVoicePhase]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (silenceWarning.active && silenceWarning.countdown > 0) {
      timer = setTimeout(() => {
        setSilenceWarning(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [silenceWarning]);

  useEffect(() => {
    if (turnEndTime > 0) {
      const interval = setInterval(() => {
        const left = Math.max(0, Math.floor((turnEndTime - Date.now()) / 1000));
        setTurnTimeLeft(left);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [turnEndTime]);

  // Pre-acquire mic stream when entering any voice-enabled phase
  // 使用 isVoicePhase (primitive bool) 當 dep — 同一連續語音旅程中不會重複取得
  useEffect(() => {
    if (!isVoicePhase) return;

    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: true,    // 維持，避免回音
        noiseSuppression: false,   // 🌟 關掉，不要砍掉低音量
        autoGainControl: true,     // 維持，自動放大
        channelCount: 1,
        sampleRate: 16000,
      } 
    }).then(s => {
      stream = s;
      localStreamRef.current = s;
      // Keep tracks muted until mic is toggled on — this pre-warms the WebRTC connection
      s.getTracks().forEach(t => { t.enabled = false; });

      // 🌟 核心修正：使用 replaceTrack 將麥克風綁入通道，不觸發 renegotiation
      Object.values(peerConnections.current).forEach((pc: any) => {
        const track = s.getAudioTracks()[0];
        const sender = pc.getSenders()[0]; // 取得剛剛 addTransceiver 建立的通道
        if (sender && track) {
          sender.replaceTrack(track).catch((e: any) => console.warn(e));
        }
      });

      audioContextRef.current = new AudioContext();
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      const microphone = audioContextRef.current.createMediaStreamSource(s);
      microphone.connect(analyser);
      analyserRef.current = analyser;
      micSourceRef.current = microphone;

    }).catch(err => console.error("Mic pre-acquire error", err));

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      stopRecognition();
    };
  }, [isVoicePhase]);

  const stopRecognition = () => {
    recognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
  };

  const startRecognition = (speakerCharacter: string, socket: Socket) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopRecognition();
    recognitionActiveRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-TW';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalBuffer = '';

    recognition.onresult = (event: any) => {
      let text = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        text += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      text = text.trim();
      if (!text) return;

      subtitlesHook.updateLive(speakerCharacter, text);
      socket.emit('speaking_data', { subtitle: `${speakerCharacter}：${text}` });
      socket.emit('user_speaking');
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' and 'aborted' are non-fatal; restart silently
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error("Speech recognition error:", event.error);
    };

    // KEY FIX: Chrome stops SpeechRecognition automatically after ~60s of continuous mode.
    // Re-start immediately when it ends, as long as mic is still active.
    recognition.onend = () => {
      if (recognitionActiveRef.current) {
        try { recognition.start(); } catch (_) {}
      }
    };

    try { recognition.start(); } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  };

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let cpmInterval: NodeJS.Timeout; // 確保 cpmInterval 也能被清理

    const stream = localStreamRef.current;
    if (!stream) return;

    const meetingStage = (roomState as any)?.meetingStage;
    const isFreeMicPhase = ['room_lobby','character_preview', 'game_profile', 'game_search', 'search_end', 'truth_revealed'].includes(phase) || meetingStage === 'free_discussion';
    const canSpeak = isFreeMicPhase || (socket && currentSpeaker?.id === socket.id);

    if (isMicOn && socket && canSpeak) {
      // Enable the pre-acquired tracks
      stream.getTracks().forEach(t => { t.enabled = true; });

      // ✅ 直接用已建好的 analyserRef，不重新建立
      const audioContext = audioContextRef.current;
      if (audioContext && audioContext.state === 'suspended') audioContext.resume();

      // 🌟 【修復重點 1】：加上這三行來啟動即時語音辨識
      const me = roomState?.users.find(u => u.email === user?.email);
      const myCharName = me?.assignedCharacter || '系統';
      startRecognition(myCharName, socket);

      const analyser = analyserRef.current;
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        checkInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;
          const newVolume = Math.min(100, average * 2);
          currentVolumeRef.current = newVolume;

          // 只有會議室 UI 才需要顯示音量條，其他階段不必觸發 re-render
          if (phase === 'game_meeting') setCurrentVolume(newVolume);

          if (average > 10) {
            socket.emit('user_speaking');
            socket.emit('speaking_data', { volume: newVolume });
          } else {
            if (phase === 'game_meeting') setCurrentVolume(0);
            socket.emit('speaking_data', { volume: 0 });
          }
        }, 200);
      }

      // Calculate real CPM from transcript
      cpmInterval = setInterval(() => {
        setCurrentCPM(prev => {
          const lastSub = subtitles[subtitles.length - 1] || '';
          const chars = lastSub.split('：')[1]?.length || 0;
          return chars > 0 ? Math.round(chars * (60 / 30)) : prev;
        });
      }, 3000);

      return () => {
        clearInterval(checkInterval);
        clearInterval(cpmInterval);
        // ⚠️ 注意：不要在這裡 stopRecognition()，否則音量一變動就會中斷辨識
      };
    } else {
      stream.getTracks().forEach(t => { t.enabled = false; });
      stopRecognition();
      setCurrentVolume(0);
    }
  }, [isMicOn, socket, currentSpeaker?.id, phase]); // ⚠️ 加上 phase 以便在進入/離開自由開麥階段時重新判斷

  const toggleMic = () => {
    if (!socket) return;

    // 🌟 新增：取得當前階段，並判斷是否在封麥環節
    const meetingStage = (roomState as any)?.meetingStage;
    // truth_revealed 是遊戲結束後的自由討論，不受 meetingStage 限制
    if (phase !== 'truth_revealed' && (meetingStage === 'organizing' || meetingStage === 'voting_prompt')) { console.log('[toggleMic] blocked: meetingStage', meetingStage); return; }

    // 🌟 修改：加入 free_discussion 的判斷
    const isFreeMicPhase = ['room_lobby', 'character_preview', 'game_profile', 'game_search', 'search_end', 'truth_revealed'].includes(phase) || meetingStage === 'free_discussion';
    const allowed = isFreeMicPhase || currentSpeaker?.id === socket.id;
    if (!allowed) return;

    if (!localStreamRef.current) {
      if (isMicRequestingRef.current) return; // ✅ 已經在請求中，不重複
      isMicRequestingRef.current = true;
      
      // 🌟 建議加上 autoGainControl: true，聲音會比較大聲
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
        .then(s => {
          localStreamRef.current = s;
          
          // 🌟 修正 1：既然是開啟麥克風，音軌必須是 true！
          s.getTracks().forEach(t => { t.enabled = true; }); 
          
          Object.values(peerConnections.current).forEach((pc: any) => {
            const track = s.getAudioTracks()[0];
            const senders = pc.getSenders();
            // 找出負責傳送 audio 的 sender
            const sender = senders.find((s: any) => s.track?.kind === 'audio' || !s.track);
            
            // 🌟 修正 2：如果本來有 sender 就替換，如果連線是空的，就直接 addTrack 加入新軌道
            if (sender && track) {
              sender.replaceTrack(track).catch((e: any) => console.warn("取代音軌失敗:", e));
            } else if (track) {
              pc.addTrack(track, s); 
            }
          });
          
          setIsMicOn(true);
          if (socket) socket.emit('toggle_mic', true);
        })
        .catch(err => console.error("Mic access denied:", err))
        .finally(() => { isMicRequestingRef.current = false; }); // ✅ 無論成功失敗都解鎖
      return;
    }

    const newState = !isMicOn;
    
    // 🌟 關鍵修復：真正把麥克風的「硬體收音」切斷或打開！
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      track.enabled = newState; // true 就繼續收音，false 就實體靜音
    }

    setIsMicOn(newState);
    socket.emit('toggle_mic', newState);
  };

  const skipTurn = () => {
    if (socket && currentSpeaker?.id === socket.id) {
      socket.emit('skip_turn');
      setIsMicOn(false);
    }
  };

  useEffect(() => {
    // 🌟 加上 !isActPlaying 判斷，演戲時徹底凍結倒數
    if (timeLeft > 0 && !isActPlaying) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isActPlaying]); 

  // =====================================================================
  // Handlers: login, data fetching, survey submit
  // =====================================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.user) {
      // 🌟 1. 嘗試從瀏覽器紀錄找回這個玩家的舊頭貼和暱稱
      const savedStr = localStorage.getItem('larp_user');
      let existingAvatar = '';
      let existingName = '';
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        // 確認信箱一致，才套用舊資料
        if (saved.email === data.user.email) {
          existingAvatar = saved.avatar || '';
          existingName = saved.name || '';
        }
      }

      // 🌟 2. 將舊資料與後端回傳的 user 合併
      const finalUser = { ...data.user, avatar: existingAvatar, name: existingName };
      setUser(finalUser);
      localStorage.setItem('larp_user', JSON.stringify(finalUser));
      setSpeechRateHistory([]);
      
      // 🌟 3. 判斷：如果是第一次登入 (沒有頭貼/暱稱)，才去選頭貼；老玩家直接進遊戲
      if (existingAvatar && existingName) {
        setPhase('intro'); 
      } else {
        setPhase('avatar_selection'); 
      }
      
      fetchSurveys(data.user.id);
      fetchRecords(data.user.id);
    }
  };

  const fetchRecords = async (userId: number) => {
    const res = await fetch(`/api/records/${userId}`);
    const data = await res.json();
    setScriptRecords(data.scripts || []);
    setAssessmentReports(data.reports || []);
  };

  const fetchSurveys = async (userId: number) => {
    const res = await fetch(`/api/surveys/${userId}`);
    const data = await res.json();
    setSurveys(data.surveys || []);
  };

  const submitSurvey = async () => {
    if (!user) return;
    
    // 1. 儲存問卷到後端
    await fetch('/api/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, data: currentSurvey })
    });
    
    // 2. 重新抓取問卷紀錄 (這會更新 surveys.length，解開彈窗的鎖)
    await fetchSurveys(user.id);

    // 🌟 關鍵修復：清空作答紀錄，讓下一份問卷是白紙狀態
    setCurrentSurvey({});

    // 3. 填寫完畢，不論新老玩家，通通回到大廳繼續他們的流程
    setPhase('lobby');
  };

  // =====================================================================
  // Inline helper components used across multiple phases
  // =====================================================================

  const renderUserPresenceBar = () => {
    if (!roomState) return null;
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl">
        {roomState.users.map((u) => {
          // 🌟 從 meetingUsers 找出此玩家目前是否開麥
          const meetingUser = meetingUsers.find(mu => mu.email === u.email);
          const isUserMicOn = !!meetingUser?.isMicOn;
          return (
            <div key={u.id} className="relative group">
              <div className={cn(
                "w-10 h-10 rounded-full border-2 overflow-hidden transition-all",
                isUserMicOn
                  ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                  : u.isReady
                    ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "border-slate-600"
              )}>
                <img src={u.avatar} alt={u.email} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              {/* 🌟 右下角麥克風圖示：開麥=紅色 Mic；未開麥但已準備=綠色 Check */}
              {isUserMicOn ? (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg border border-slate-900 animate-pulse">
                  <Mic size={10} strokeWidth={3} />
                </div>
              ) : u.isReady ? (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border border-slate-900">
                  <Check size={10} strokeWidth={4} />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 bg-slate-700 text-slate-400 rounded-full p-0.5 shadow-lg border border-slate-900">
                  <MicOff size={10} strokeWidth={3} />
                </div>
              )}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
                {u.email}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 🌟 獨立的懸浮麥克風按鈕 — 出現在「準備好了，下一步」按鈕的左邊
  const renderFloatingMicButton = () => {
    if (!isGameStarted && phase !== 'room_lobby') return null; 
    if (phase === 'game_meeting') return null;

    // 🌟 大廳的麥克風改由 RoomLobbyScreen 獨立渲染一個更明顯的，所以這裡隱藏
    if (phase === 'room_lobby') return null;

    const isFreeMicPhase = ['character_preview', 'search_end'].includes(phase);
    if (!isFreeMicPhase) return null;

    return (
      <button
        onClick={toggleMic}
        className={cn(
          "group relative px-5 py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center gap-2 overflow-hidden",
          isMicOn
            ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse"
            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:scale-[1.02]"
        )}
        title={isMicOn ? "點擊關閉麥克風" : "點擊開啟麥克風"}
      >
        {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
        <span className="hidden sm:inline">{isMicOn ? "收音中" : "開麥"}</span>
      </button>
    );
  };

  const renderNextPhaseButton = () => {
    if (!isGameStarted) return null;

    const me = roomState?.users.find(u => u.email === user?.email);
    if (!me || me.isReady) return null;

    return (
      <button
        onClick={() => {
          // 🌟 加入選角防呆邏輯
          if (phase === 'character_preview') {
            const hasConflict = Object.values(roomState?.characterSelections || {}).some(emails => emails.length > 1);
            if (hasConflict) {
              alert('有角色被超過一人選取！請大家協調後再按下準備。');
              return;
            }
            if (!me.selectedCharacter) {
              alert('請先選擇一個角色！');
              return;
            }
          }
          socket?.emit('player_ready');
        }}
        className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all flex items-center gap-3 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        <CheckCircle2 size={24} />
        準備好了，下一步
      </button>
    );
  };

  const renderBottomRightControls = () => {
    // 🌟 給大廳特權：即使遊戲還沒開始，大廳也可以顯示底部控制區
    if (!isGameStarted && phase !== 'room_lobby') return null; 
    const allowedPhases = ['room_lobby', 'character_preview', 'game_profile', 'game_search', 'search_end'];
    if (!allowedPhases.includes(phase)) return null;

    return (
      <div className="fixed bottom-8 right-8 z-[60] flex items-center gap-4">
        {renderFloatingMicButton()} {/* 👈 改為函式呼叫 */}
        {renderNextPhaseButton()}   {/* 👈 改為函式呼叫 */}
      </div>
    );
  };

  // 👇 新增這個：專屬於個人檔案與任務發放的底部計時器
  // 👇 更新這個專屬於個人檔案、任務發放與日記的計時器[cite: 3]
  // 👇 更新這個專屬於個人檔案、任務發放與日記的計時器
  const renderPhaseTimer = () => {
    if (!isGameStarted) return null;
    
    // 只有這三個階段顯示這個計時器
    if (!['game_profile', 'mission_briefing', 'diary_reveal'].includes(phase)) return null;

    // 🌟 判斷當前是否為日記階段
    const isDiaryPhase = phase === 'diary_reveal';

    return (
      <motion.div 
        // 🌟 動畫：因為都在下方了，統一設定為從下方浮現 (y: 50 -> 0)
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed z-[200] bg-slate-950/95 border border-slate-700/60 px-7 py-3 rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex items-center gap-3",
          // 🌟 核心修改：如果是日記，就定位在左下角 (bottom-8 left-8)
          // 否則維持原本的正下方居中 (bottom-8 left-1/2 -translate-x-1/2)
          isDiaryPhase 
            ? "bottom-8 left-8" 
            : "bottom-8 left-1/2 -translate-x-1/2"
        )}
      >
        <Clock
          className={timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}
          size={22}
        />
        <span
          className={cn(
            'text-2xl font-mono font-bold tracking-widest',
            timeLeft <= 30 ? 'text-red-400' : 'text-white'
          )}
        >
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
          {(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </motion.div>
    );
  };

  // =====================================================================
  // Pre-built modal/children instances (for GameSearchScreen composition)
  // =====================================================================

  const floorPlanNode = useMemo(() => (
    <FloorPlan
      currentFloor={currentFloor}
      setCurrentFloor={setCurrentFloor}
      phase={phase}
      setActiveSearchRoomId={setActiveSearchRoomId}
      scriptId={roomState?.scriptId ?? 1}                          // 🌟 新增
    />
  ), [currentFloor, phase, roomState?.scriptId]); // setCurrentFloor / setActiveSearchRoomId 是穩定的 setter，不需列入

  const roomViewNode = useMemo(() => (
    <RoomView
      activeSearchRoomId={activeSearchRoomId}
      backpack={backpack}
      allCollectedEvidence={allCollectedEvidence}
      setSelectedEvidence={setSelectedEvidence}
      collectedCoins={collectedCoins}
      setCollectedCoins={setCollectedCoins}
      setCoinCount={setCoinCount}
      scriptId={roomState?.scriptId ?? 1}
    />
  ), [activeSearchRoomId, backpack, allCollectedEvidence, collectedCoins, roomState?.scriptId]);

  const backpackNode = (
    <Backpack
      isBackpackOpen={isBackpackOpen}
      backpack={backpack}
      backpackCapacity={backpackCapacity}
      setViewingEvidence={setViewingEvidence}
    />
  );

  const notebookModalNode = (
    <NotebookModal
      isNotebookOpen={isNotebookOpen}
      setIsNotebookOpen={setIsNotebookOpen}
      notebookTab={notebookTab}
      setNotebookTab={setNotebookTab}
      showFullTimeline={showFullTimeline}
      setShowFullTimeline={setShowFullTimeline}
      previewScript={previewScript}
      roomState={roomState}
      user={user}
      timelineNodes={timelineNodes}
      setTimelineNodes={setTimelineNodes}
      privateCustomNodes={privateCustomNodes}     // 🌟 新增這行
      setPrivateCustomNodes={setPrivateCustomNodes} // 🌟 新增這行
      timelineEvents={timelineEvents}
      setTimelineEvents={setTimelineEvents}
      selectedTimelineChar={selectedTimelineChar}
      setSelectedTimelineChar={setSelectedTimelineChar}
      newTimeNode={newTimeNode}
      setNewTimeNode={setNewTimeNode}
      selectedNotebookChar={selectedNotebookChar}
      setSelectedNotebookChar={setSelectedNotebookChar}
      characterNotes={characterNotes}
      setCharacterNotes={setCharacterNotes}
      newNote={newNote}
      setNewNote={setNewNote}
      infoSubTab={infoSubTab}
      setInfoSubTab={setInfoSubTab}
      selectedInfoId={selectedInfoId}
      setSelectedInfoId={setSelectedInfoId}
      readInfoIds={readInfoIds}
      setReadInfoIds={setReadInfoIds}
      backpack={allCollectedEvidence}
      notebookSelectedEvidence={notebookSelectedEvidence}
      setNotebookSelectedEvidence={setNotebookSelectedEvidence}
      unlockedAdvancedDetails={unlockedAdvancedDetails}
      unlockedCharacterAdvanced={unlockedCharacterAdvanced}            // 🌟
      onUnlockCharacterAdvanced={handleUnlockCharacterAdvanced} 
      evidenceAssociations={evidenceAssociations}
      setEvidenceAssociations={setEvidenceAssociations}
      expandedNoteId={expandedNoteId}
      setExpandedNoteId={setExpandedNoteId}
    />
  );

  const evidenceModalNode = (
    <EvidenceModal
      selectedEvidence={selectedEvidence}
      viewingEvidence={viewingEvidence}
      setSelectedEvidence={setSelectedEvidence}
      setViewingEvidence={setViewingEvidence}
      backpack={backpack as any}
      setBackpack={setBackpack as any}
      allCollectedEvidence={allCollectedEvidence as any}
      setAllCollectedEvidence={setAllCollectedEvidence as any}
      backpackCapacity={backpackCapacity}
      activeSearchRoomId={activeSearchRoomId}
      scriptId={roomState?.scriptId ?? 1} 
    />
  );

  const shopModalNode = (
    <ShopModal
      isShopOpen={isShopOpen}
      setIsShopOpen={setIsShopOpen}
      coinCount={coinCount}
      setCoinCount={setCoinCount}
      backpack={backpack as any}
      backpackCapacity={backpackCapacity}
      setBackpackCapacity={setBackpackCapacity}
      unlockedAdvancedDetails={unlockedAdvancedDetails}
      setUnlockedAdvancedDetails={setUnlockedAdvancedDetails}
    />
  );

  // =====================================================================
  // Main Render
  // =====================================================================

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-1000",
      isGameStarted ? "bg-slate-950 text-slate-200" : "bg-gradient-to-br from-slate-50 to-indigo-50"
    )}>
      {/* Persistent Header Icon — 顯示玩家選擇的自訂頭貼與下拉選單 */}
      {user && (
        <div className="fixed top-6 right-6 z-40 group flex flex-col items-end">
          {/* 主按鈕：維持原本點擊打開個人紀錄的功能 */}
          <button
            onClick={() => setShowRecordsPanel(true)}
            className="relative w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden group-hover:scale-105 transition-transform active:scale-95 flex items-center justify-center z-10"
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="個人紀錄" 
                className="w-full h-full object-cover bg-slate-50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserCircle size={28} className="text-indigo-600" />
            )}
            
            {/* 懸浮提示文字 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
          </button>

          {/* 懸浮暱稱提示（只顯示名稱，不含按鈕） */}
          <div className="absolute top-16 right-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-0 pointer-events-none">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg px-3 py-1.5 whitespace-nowrap">
              <span className="text-xs font-bold text-white">{user.name || user.email.split('@')[0]}</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'login' && (
          <LoginScreen
            key="login"
            email={email}
            setEmail={setEmail}
            handleLogin={handleLogin}
          />
        )}
        {(phase as any) === 'avatar_selection' && (
          <AvatarSelectionScreen 
            key="avatar_selection"
            initialName={user?.name || ''}
            onConfirm={(url, playerName) => {
              let oldUser = false;
              
              if (user) {
                oldUser = !!(user.avatar && user.name); // 判斷是不是老玩家
                
                const finalName = playerName.trim() || user.email.split('@')[0];
                const updatedUser = { ...user, avatar: url, name: finalName };
                setUser(updatedUser);
                localStorage.setItem('larp_user', JSON.stringify(updatedUser));
              }
              
              // 🌟 修正跳轉邏輯：分流處理
              if (oldUser) {
                setPhase('lobby'); // 老玩家修改完，直接順暢地回到大廳
              } else {
                setIsNewUser(true); // 標記為新手
                setPhase('intro');  // 帶去看蜜桃鳥的新手 5 步驟教學
              }
            }} 
          />
        )}
        {phase === 'intro' && (
          <IntroScreen key="intro" setPhase={setPhase} isNewUser={isNewUser} />
        )}
        {phase === 'survey' && (
          <SurveyScreen
            key="survey"
            setPhase={setPhase}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            surveys={surveys}
            currentSurvey={currentSurvey}
            setCurrentSurvey={setCurrentSurvey}
            submitSurvey={submitSurvey}
            surveyCount={surveys.length}
          />
        )}
        {phase === 'lobby' && (
          <>
            <LobbyScreen
              key="lobby"
              setPhase={setPhase}
              setActiveModule={setActiveModule}
              setCurrentPage={setCurrentPage}
            />

            {/* 🌟 淺色系的提醒橫幅 */}
            <AnimatePresence>
              {analyzingState !== 'idle' && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  // 👇 主要改了這裡的背景色(bg-white/95)、邊框色(border-slate-200) 與陰影
                  className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between px-10 z-[100]"
                >
                  <div className="flex items-center gap-3">
                    {analyzingState === 'analyzing' ? (
                      // 讀取圈圈改深一點的紫色
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={20} className="text-emerald-500" />
                    )}
                    {/* 👇 文字改為深灰色 */}
                    <span className="text-slate-800 font-bold">
                      {analyzingState === 'analyzing' ? "分析報告生成中..." : "分析報告出爐！"}
                    </span>
                  </div>
                  
                  {analyzingState === 'ready' && (
                    <button
                      onClick={() => {
                        setViewingFullReport(readyReport); 
                        setShowRecordsPanel(false);
                        setAnalyzingState('idle'); 
                      }}
                      // 👇 按鈕稍微加上陰影跟點擊縮放效果
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                    >
                      點擊查看
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {phase === 'teaching' && (
          <TeachingScreen
            key="teaching"
            activeModule={activeModule}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setShowExitModal={setShowExitModal}
            setPhase={setPhase}
            speechRateHistory={speechRateHistory}
            setSpeechRateHistory={setSpeechRateHistory}
          />
        )}
        {phase === 'script_lobby' && (
          <ScriptLobbyScreen
            key="script_lobby"
            setPhase={setPhase}
            setPreviewScript={setPreviewScript}
            isScript2Unlocked={isScript2Unlocked}
            hasPlayedScript2={hasPlayedScript2}
          />
        )}
        {phase === 'script_detail' && (
          <ScriptDetailScreen
            key="script_detail"
            previewScript={previewScript}
            setPhase={setPhase}
            setShowScriptIntro={setShowScriptIntro}
            onlinePlayers={onlinePlayers}
            isPublicRoom={isPublicRoom}
            setIsPublicRoom={setIsPublicRoom}
            socket={socket}
            user={user}
            setShowJoinModal={setShowJoinModal}
            setCurrentCharacterIndex={setCurrentCharacterIndex}
          />
        )}
        {phase === 'room_lobby' && (
          <RoomLobbyScreen
            key="room_lobby"
            roomState={roomState}
            previewScript={previewScript}
            user={user}
            socket={socket}
            resetRoomState={resetRoomState}
            setPhase={setPhase}
            setCurrentCharacterIndex={setCurrentCharacterIndex}
            isMicOn={isMicOn}         // 🌟 新增：傳入麥克風狀態
            toggleMic={toggleMic}     // 🌟 新增：傳入切換函式
          />
        )}
        {phase === 'character_preview' && (
          <CharacterPreviewScreen
            key="character_preview"
            previewScript={previewScript}
            currentCharacterIndex={currentCharacterIndex}
            setCurrentCharacterIndex={setCurrentCharacterIndex}
            isGameStarted={isGameStarted}
            roomState={roomState}
            setPhase={setPhase}
            socket={socket}
            user={user}
          />
        )}
        {phase === 'game_profile' && (
          <GameProfileScreen
            key="game_profile"
            previewScript={previewScript}
            roomState={roomState}
            user={user}
            isProfileFlipped={isProfileFlipped}
            setIsProfileFlipped={setIsProfileFlipped}
          />
        )}
        {phase === 'mission_briefing' && (
          <MissionBriefingScreen
            key="mission_briefing"
            previewScript={previewScript}
            roomState={roomState}
            user={user}
            isMeReady={!!me?.isReady}
            onConfirm={(clues) => {
              // 初始線索只記入永久收集紀錄（筆記本/會議室可見），不佔搜查背包空間
              setAllCollectedEvidence(prev => {
                const existingIds = new Set(prev.map(e => e.id));
                const additions = clues.filter(c => !existingIds.has(c.id)).map(c => ({...c, locationName: '初始攜帶'}));                return [...prev, ...additions];
                return [...prev, ...additions];
              });
              socket?.emit('player_ready');
            }}
            onOpenTimeline={() => {
              // 🌟 開筆記本 → 時間線分頁 → 鎖定自己這欄
              const myIndex = previewScript?.characters.findIndex(
                c => c.name === me?.assignedCharacter
              ) ?? 0;
              setSelectedTimelineChar(myIndex >= 0 ? myIndex : 0);
              setNotebookTab('timeline');
              setIsNotebookOpen(true);
            }}
          />
        )}

        {phase === 'game_search' && !isActPlaying && (
          <GameSearchScreen
            key="game_search"
            previewScript={previewScript}
            roomState={roomState}
            user={user}
            activeSearchRoomId={activeSearchRoomId}
            setActiveSearchRoomId={setActiveSearchRoomId}
            timeLeft={timeLeft}
            setIsShopOpen={setIsShopOpen}
            coinCount={coinCount}
            isBackpackOpen={isBackpackOpen}
            setIsBackpackOpen={setIsBackpackOpen}
            backpack={backpack}
            setIsNotebookOpen={setIsNotebookOpen}
            floorPlan={floorPlanNode}
            roomView={roomViewNode}
            backpackPanel={backpackNode}
            notebookModal={notebookModalNode}
            evidenceModal={evidenceModalNode}
            shopModal={shopModalNode}
          />
        )}

        {phase === 'search_end' && (
          <SearchEndScreen
            key="search_end"
            backpack={backpack as any}
            collectedCoins={collectedCoins}
          />
        )}

        {phase === 'game_meeting' && (
          <GameMeetingScreen
            key="game_meeting"
            previewScript={previewScript}
            roomState={roomState}
            user={user}
            isHost={isHost}
            socket={socket}
            meetingTab={meetingTab}
            setMeetingTab={setMeetingTab}
            meetingUsers={meetingUsers}
            currentSpeaker={currentSpeaker as any}
            peerStatuses={peerStatuses}
            meetingNotebookTab={meetingNotebookTab}
            setMeetingNotebookTab={setMeetingNotebookTab}
            timelineNodes={timelineNodes}
            setTimelineNodes={setTimelineNodes}
            privateCustomNodes={privateCustomNodes}     // 🌟 新增這行
            setPrivateCustomNodes={setPrivateCustomNodes} // 🌟 新增這行
            newTimeNode={newTimeNode}
            setNewTimeNode={setNewTimeNode}
            timelineEvents={timelineEvents}
            setTimelineEvents={setTimelineEvents}
            handleDeleteTimeNode={handleDeleteTimeNode}
            selectedNotebookChar={selectedNotebookChar}
            setSelectedNotebookChar={setSelectedNotebookChar}
            characterNotes={characterNotes}
            setCharacterNotes={setCharacterNotes}
            expandedNoteId={expandedNoteId}
            setExpandedNoteId={setExpandedNoteId}
            isAddNoteModalOpen={isAddNoteModalOpen}
            setIsAddNoteModalOpen={setIsAddNoteModalOpen}
            newProfileNote={newProfileNote}
            setNewProfileNote={setNewProfileNote}
            backpack={allCollectedEvidence}
            infoSubTab={infoSubTab}
            setInfoSubTab={setInfoSubTab}
            selectedInfoId={selectedInfoId}
            setSelectedInfoId={setSelectedInfoId}
            readInfoIds={readInfoIds}
            setReadInfoIds={setReadInfoIds}
            turnTimeLeft={turnTimeLeft}
            timeLeft={timeLeft}
            isMicOn={isMicOn}
            toggleMic={toggleMic}
            currentVolume={currentVolume}
            subtitles={subtitles}
            currentCPM={currentCPM}
            skipTurn={skipTurn}
            resetRoomState={resetRoomState}
            setPhase={setPhase}
            silenceWarning={silenceWarning}
            setSilenceWarning={setSilenceWarning}
            floorPlan={floorPlanNode}
            evidenceAssociations={evidenceAssociations}
            unlockedAdvancedDetails={unlockedAdvancedDetails}
            unlockedCharacterAdvanced={unlockedCharacterAdvanced}
          />
        )}
      </AnimatePresence>

      {phase === 'diary_reveal' && (
          <DiaryRevealScreen
            key="diary_reveal"
            // 🌟 根據當前房間的劇本 ID 動態抓取日記內容
            diaryTitle={DIARY_CONTENT[roomState?.scriptId || 1]?.title}
            pages={DIARY_CONTENT[roomState?.scriptId || 1]?.pages || []}
            isMeReady={!!me?.isReady}
            onComplete={() => {
              // 🌟 點擊確認後，送出 ready 訊號給伺服器
              socket?.emit('player_ready');
            }}
          />
        )}

      {phase === 'game_voting' && (
        <VotingScreen
          key="game_voting"
          roomState={roomState}
          previewScript={previewScript}
          user={user}
          socket={socket}
        />
      )}

      {phase === 'game_ending' && (
        <GameEndingScreen
          key="game_ending"
          isKiller={me?.assignedCharacter === TRUE_KILLERS[roomState?.scriptId || 1]}
          isKillerCaught={isKillerCaught}
          isHost={isHost}
          onNextPhase={() => {
            // 房主點擊後，通知所有人進入最後的真相大白
            if (isHost) socket?.emit('start_truth_phase');
          }}
          surveyCount={surveys.length}
        />
      )}

      {phase === 'truth_revealed' && (
        <TruthScreen
          onLeaveRoom={async () => {
            const currentScript = SCRIPTS.find((s: any) => s.id === roomState?.scriptId);
            const scriptTitle = currentScript?.title || '劇本';
            setLastPlayedScript(scriptTitle);

            const myCharacterName = me?.assignedCharacter ?? '';

            // 1. 給 save-dialogue 用 — 含 free + turn，所有人，按時間排序
            const packagedDialogue: { speaker: string; text: string }[] = [];
            for (const round of [1, 2] as const) {
              const lines = transcriptHook.fullDialogueByRound(round);
              if (lines.length > 0) {
                packagedDialogue.push({ speaker: '系統', text: `【第${round === 1 ? '一' : '二'}輪討論】` });
                packagedDialogue.push(...lines);
              }
            }

            // 2. 給 /analyse 用 — 只取 turn 階段、只取自己
            const myTurns: string[] = [];
            for (const round of [1, 2]) {
              const myLines = transcriptHook.turnsByRoundForCharacter(round, myCharacterName);
              if (myLines.length > 0) {
                myTurns.push(`[第${round === 1 ? '一' : '二'}輪]\n${myLines.join('\n')}`);
              }
            }

            // 🌟 4. 玩到結局才送分析（這個 onLeaveRoom 只在 truth_revealed 觸發，本身就是條件）
            if (user?.id && packagedDialogue.length > 0) {
              try {
                await fetch('/api/save-dialogue', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, scriptName: scriptTitle, dialogue: packagedDialogue }),
                });
                fetchRecords(user.id);
              } catch (e) { console.error('save-dialogue failed', e); }
            }

            if (user?.id && myTurns.length > 0) {
              try {
                setAnalyzingState('analyzing'); // 🌟 狀態設為分析中
                const res = await fetch('/api/analyse', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    userId: user.id, 
                    scriptName: scriptTitle, 
                    turns: myTurns,
                    // 🌟 新增：完整對話 + 角色名稱，給 AI 當脈絡
                    fullDialogue: packagedDialogue, 
                    targetCharacter: myCharacterName,
                  }),
                });
                const data = await res.json();
                
                if (data.jobId) {
                  // 🌟 開始輪詢
                  const pollInterval = setInterval(async () => {
                    const statusRes = await fetch(`/api/analyse/status/${data.jobId}?userId=${user.id}`);
                    const statusData = await statusRes.json();
                    
                    if (statusData.status === 'done') {
                      clearInterval(pollInterval);
                      setAnalyzingState('ready');
                      setReadyReport({ summary: statusData.result.summary, turns: statusData.result.turns });
                      fetchRecords(user.id); // 重新抓取資料，更新歷史紀錄
                    } else if (statusData.status === 'error') {
                      clearInterval(pollInterval);
                      setAnalyzingState('idle');
                    }
                  }, 5000); // 每 5 秒問一次
                }
              } catch (e) { console.error('analyse failed', e); setAnalyzingState('idle'); }
            }

            // 5. 才開始離開
            socket?.emit('leave_room');
            resetRoomState();
            setShowSurveyPrompt(true);

            // 改成 3 秒備援刷新（以防 save-dialogue 還沒完成就已經看到空列表）
            if (user?.id) {
              setTimeout(() => fetchRecords(user.id), 3000);
            }
          }}
          isMicOn={isMicOn}
          toggleMic={toggleMic}
          meetingUsers={meetingUsers}
          isKillerCaught={isKillerCaught}
          scriptId={roomState?.scriptId ?? 1}
          surveyCount={surveys.length}
        />
      )}

      {/* 新增的單人劇本體驗畫面 */}
      {phase === 'single_player' && (
        <motion.div
          key="single_player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto"
        >
          {/* 返回按鈕：懸浮在左上角，讓使用者隨時能離開單人劇本 */}
          <button
            onClick={() => setPhase('script_lobby')}
            className="fixed top-6 left-6 z-[300] px-5 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            返回劇本大廳
          </button>

          {/* 載入獨立的單人劇本 App 元件 */}
          <SinglePlayerApp />
        </motion.div>
      )}

      {phase === 'mission_briefing' && notebookModalNode}

      {/* 幕演出畫面：z-[80] 蓋住遊戲畫面但低於彈窗 */}
      <AnimatePresence>
        {isActPlaying && (
          <ActScreen
            actId={currentActId}
            previewScript={previewScript}
            roomState={roomState}
            user={user}
            isHost={isHost}
            socket={socket}
            isMicOn={isMicOn}
            toggleMic={toggleMic}
            currentSubtitle={subtitles[subtitles.length - 1] ?? ''}
            onActComplete={handleActComplete}
          />
        )}
      </AnimatePresence>

      {/* 🌟 投票結果 reveal 畫面 */}
      <AnimatePresence>
        {votingReveal && (
          <VoteRevealScreen
            winner={votingReveal.winner}
            voteCount={votingReveal.voteCount}
            previewScript={previewScript}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTieRevoteNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/85 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center px-8"
            >
              <p className="text-amber-400 text-xs tracking-[0.5em] uppercase mb-4 font-serif">
                Tied Vote
              </p>
              <h2 className="text-7xl font-black text-amber-400 mb-6 tracking-widest drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                平票
              </h2>
              <p className="text-xl text-white/90 font-bold mb-2">
                剛剛投票結果為平票
              </p>
              <p className="text-sm text-slate-300">
                回到會議室自由討論 4 分鐘後重投
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 黑屏漸暗轉場 */}
      <AnimatePresence>
        {fadeToBlack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[95] bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJoinModal && (
          <JoinModal
            showJoinModal={showJoinModal}
            previewScript={previewScript}
            setShowJoinModal={setShowJoinModal}
            socket={socket}
            user={user}
            publicRooms={publicRooms}
          />
        )}
        {showExitModal && (
          <ExitModal
            setPhase={setPhase}
            setShowExitModal={setShowExitModal}
          />
        )}
        {showRecordsPanel && (
          <RecordsPanel
            recordsView={recordsView}
            setRecordsView={setRecordsView}
            setShowRecordsPanel={setShowRecordsPanel}
            surveys={surveys}
            selectedSurveyId={selectedSurveyId}
            setSelectedSurveyId={setSelectedSurveyId}
            scriptRecords={scriptRecords}
            assessmentReports={assessmentReports}
            expandedRecord={expandedRecord}
            setExpandedRecord={setExpandedRecord}
            onOpenReport={(report) => {
              setShowRecordsPanel(false); // 關閉側邊欄
              setViewingFullReport(report); // 設定要觀看的報告
            }}
            myCharacter={roomState?.users.find(u => u.email === user?.email)?.assignedCharacter}
            onEditAvatar={() => setPhase('avatar_selection')}
          />
        )}
        {showScriptIntro && (
          <ScriptIntroModal
            previewScript={previewScript}
            setShowScriptIntro={setShowScriptIntro}
          />
        )}
      </AnimatePresence>

      {['room_lobby', 'character_preview', 'game_profile', 'mission_briefing', 'game_search', 'search_end', 'game_meeting'].includes(phase) && renderUserPresenceBar()}
      {['room_lobby', 'character_preview', 'game_profile', 'game_search', 'search_end'].includes(phase) && renderBottomRightControls()}

      {renderPhaseTimer()}

      {user && (
        <div className="fixed bottom-6 left-6 flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 text-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-600 font-medium">{user.email}</span>
        </div>
      )}

      {/* 放在所有畫面的最下面，搭配 fixed inset-0 就能完美覆蓋全螢幕 */}
      <AnimatePresence>
        {disconnectedUserEmail && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white"
          >
            <AlertTriangle size={64} className="text-yellow-400 mb-6 animate-pulse" />
            <h2 className="text-3xl font-bold mb-2">遊戲暫停</h2>
            <p className="text-slate-300 text-lg mb-8">
              玩家 <span className="font-bold text-yellow-400">{disconnectedUserEmail}</span> 失去連線
            </p>
            <div className="bg-slate-800 px-8 py-6 rounded-2xl flex flex-col items-center shadow-2xl">
              <div className="text-sm text-slate-400 mb-2">等待重連倒數</div>
              <div className="text-5xl font-mono tracking-widest text-white">
                {Math.floor(reconnectTimeLeft / 60)}:{(reconnectTimeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <p className="mt-8 text-slate-500 text-sm">若倒數結束玩家仍未回歸，房間將會自動解散結算。</p>
            <div className="mt-8 flex gap-4">
              {isHost ? (
                <button
                  onClick={() => {
                    if (window.confirm('確定要強制終止並解散當前遊戲嗎？')) {
                      // 🌟 1. 檢查並印出前端發送狀態 (請開 F12 Console 看有沒有印出這行)
                      console.log('[前端] 準備發送 disband_room，使用房號:', roomState?.id);

                      if (socket) {
                        socket.emit('disband_room', roomState?.id);
                      } else {
                        alert('Socket 連線異常，無法發送解散指令');
                      }
                    }
                  }}
                  className="px-6 py-3 bg-red-900/50 hover:bg-red-900/70 text-red-400 border border-red-900/50 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <AlertTriangle size={20} /> 強制解散房間
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm('確定要在遊戲中途退出嗎？這可能導致遊戲無法繼續。')) {
                      socket?.emit('leave_room');
                      resetRoomState(); // 清除剛剛加的斷線畫面狀態與房間資料
                      setPhase('lobby'); // 退回遊戲準備大廳
                    }
                  }}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <LogOut size={20} /> 退出房間
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 遊戲結束後的感謝與問卷引導彈窗 */}
      <AnimatePresence>
        {showSurveyPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* 頂部裝飾背景 */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-900/40 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <ClipboardList size={40} />
                </div>
                
                <h2 className="text-3xl font-black text-white mb-4 tracking-wide">
                  感謝您的遊玩！
                </h2>
                
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  希望你喜歡<span className="text-amber-400 font-bold mx-1">《{lastPlayedScript}》</span>的故事。<br/><br/>
                  為了提供更完美的遊戲體驗，請幫我們填寫一份簡短的課後問卷，你的回饋對我們非常重要！
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowSurveyPrompt(false);
                      setPhase('survey'); // 🌟 跳轉到問卷階段
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                  >
                    <ClipboardList size={20} /> 前往填寫問卷
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSurveyPrompt(false);
                      setPhase('lobby'); // 🌟 婉拒填寫，回大廳
                    }}
                    // 🌟 核心修改：判斷問卷數量是否達到 3 份 (代表完整完成一次流程)
                    disabled={surveys.length < 3} 
                    className={cn(
                      "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                      surveys.length < 3
                        ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50" // 🔒 鎖定樣式
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors" // 🔓 解鎖樣式
                    )}
                  >
                    {surveys.length < 3 ? (
                      <>
                        <span className="opacity-60 text-xs">🔒 培訓期間，需完成問卷才能回大廳</span>
                      </>
                    ) : (
                      "稍後再說，先回大廳"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 放在這裡！加在最後一個 </div> 的上方 */}
      {viewingFullReport && (
        <div className="fixed inset-0 z-[300] bg-slate-950 overflow-y-auto">
          <ReportPage
            reports={assessmentReports}
            latestReport={viewingFullReport.id ? null : viewingFullReport} 
            onBack={() => {
              setViewingFullReport(null);
              setShowRecordsPanel(true); // 返回時重新打開側邊欄
            }}
          />
        </div>
      )}
    </div>
  );
}