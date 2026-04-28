// ═══════════════════════════════════════════════════════════
// ActScreen.tsx — 「幕」演出主畫面
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Mic, MicOff, Volume2, CheckCircle2, Check } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { RoomState, User, cn } from '../types';
import { SCRIPTS } from '../data/scripts';
import {
  Act,
  Beat,
  PlayerDialogueBeat,
  ACT_REGISTRY,
} from '../data/actScripts';
import { ENDING_REGISTRY } from '../data/endingScripts';

// ═══════════════════════════════════════════════════════════
// 1) NarrationLine —— 旁白文字（劇情內文）
// ═══════════════════════════════════════════════════════════
export interface NarrationLineProps {
  text: string;
}

export const NarrationLine: React.FC<NarrationLineProps> = ({ text }) => (
  <motion.div
    key={text}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -24, transition: { duration: 0.3 } }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className="w-full max-w-3xl mx-auto text-center px-8"
  >
    <p className="text-white/95 text-2xl md:text-3xl leading-loose font-serif tracking-wide whitespace-pre-wrap drop-shadow-2xl">
      {text}
    </p>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// 2) DialogueBubble —— 玩家對話氣泡
// ═══════════════════════════════════════════════════════════
export interface DialogueBubbleProps {
  characterName: string;
  avatarUrl: string;
  isCurrentPlayer: boolean;
  subtitle: string;
  isMicOn: boolean;
  prompt?: string;
}

export const DialogueBubble: React.FC<DialogueBubbleProps> = ({
  characterName,
  avatarUrl,
  isCurrentPlayer,
  subtitle,
  isMicOn,
  prompt,
}) => (
  <motion.div
    key={characterName}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    className="flex items-start gap-4 w-full max-w-3xl mx-auto px-8"
  >
    <img
      src={avatarUrl}
      alt={characterName}
      className="w-16 h-16 rounded-full border-2 border-white/30 shadow-lg shrink-0 object-cover bg-slate-700"
    />

    <div className="flex-1 min-w-0">
      <div className="text-base font-bold text-white/70 mb-2 tracking-wide">
        {characterName}
      </div>

      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-sm px-6 py-5 shadow-xl">
        {subtitle && subtitle.trim() !== '' ? (
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
            {subtitle}
          </p>
        ) : (
          <p className="text-white/40 italic text-base">
            {isCurrentPlayer
              ? isMicOn
                ? '正在聆聽…（請依提示發言）'
                : '請點擊右下角「開始發言」'
              : '等待發言中…'}
          </p>
        )}
        {prompt && (!subtitle || subtitle.trim() === '') && (
          <p className="mt-3 text-sm text-white/50 italic">{prompt}</p>
        )}
      </div>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════
// 3) ReadyControl —— 右下角整合按鈕
// ═══════════════════════════════════════════════════════════
export interface ReadyControlProps {
  isHost: boolean;
  isMeReady: boolean;
  readyCount: number;
  totalCount: number;
  onReady: () => void;
  onAdvance: () => void;
  allReady: boolean;

  beatType: 'narration' | 'player_dialogue' | null;
  isMeSpeaker: boolean;
  speakerName?: string;
  
  isActingMic: boolean;
  hasStartedActing: boolean;
  onToggleActingMic: () => void;
  onUseFallback: () => void;
  speakerCompleted: boolean;
  onSpeakerAdvance: () => void;
  isUnassignedDialogue: boolean;
}

export const ReadyControl: React.FC<ReadyControlProps> = ({
  isHost,
  isMeReady,
  readyCount,
  totalCount,
  allReady,
  onReady,
  onAdvance,
  beatType,
  isMeSpeaker,
  speakerName,
  isActingMic,
  hasStartedActing,
  onToggleActingMic,
  onUseFallback,
  speakerCompleted,
  onSpeakerAdvance,
  isUnassignedDialogue,
}) => {
  // ─── 對話模式 ─────────────────────────────
  if (beatType === 'player_dialogue') {
    if (isUnassignedDialogue) {
      if (isHost) {
        return (
          <div className="fixed bottom-8 right-8 z-[90] flex items-center gap-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onSpeakerAdvance}
              className="group relative px-7 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)] transition-all flex items-center gap-3"
            >
              下一步
              <ChevronRight size={22} />
            </motion.button>
          </div>
        );
      }
      return (
        <div className="fixed bottom-8 right-8 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-5 py-4 rounded-2xl bg-slate-900/50 border border-white/15 text-white/60 text-sm flex items-center gap-2"
          >
            <Volume2 size={16} />
            等待主持人推進
          </motion.div>
        </div>
      );
    }

    if (isMeSpeaker) {
      return (
        <div className="fixed bottom-8 right-8 z-[90] flex items-center gap-3">
          {/* 開始發言 / 結束發言 (含浮動文字提示) */}
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {!hasStartedActing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute -top-12 whitespace-nowrap bg-indigo-600/90 border border-indigo-400 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-bold z-50 backdrop-blur-sm"
                >
                  請依提示念出你的台詞~
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600/90 border-b border-r border-indigo-400 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onToggleActingMic}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-2xl text-base font-bold shadow-lg transition-all relative z-40',
                isActingMic
                  ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
              )}
            >
              {isActingMic ? <Mic size={18} /> : <MicOff size={18} />}
              {isActingMic ? '結束發言' : '開始發言'}
            </motion.button>
          </div>

          {/* 繼續（預設台詞）*/}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onUseFallback}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-base font-bold shadow-lg"
            title="麥克風有問題？點此使用預設台詞跳過"
          >
            <ChevronRight size={18} />
            繼續（預設台詞）
          </motion.button>

          {/* 下一步 */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={speakerCompleted ? onSpeakerAdvance : undefined}
            disabled={!speakerCompleted}
            className={cn(
              'group relative px-7 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3',
              speakerCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            )}
            title={speakerCompleted ? '進入下一段' : '請先按「結束發言」或「繼續（預設台詞）」'}
          >
            下一步
            <ChevronRight size={22} />
          </motion.button>
        </div>
      );
    }
    // 不是 speaker
    return (
      <div className="fixed bottom-8 right-8 z-[90]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-white/60 text-sm font-bold flex items-center gap-2"
        >
          <Volume2 size={16} />
          等待 {speakerName} 發言中⋯⋯
        </motion.div>
      </div>
    );
  }

  // ─── 旁白模式 ─────────────────────
  return (
    <div className="fixed bottom-8 right-8 z-[90] flex items-center gap-3">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-2 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-white/80 text-sm font-bold shadow-lg"
      >
        已準備 {readyCount} / {totalCount}
      </motion.div>

      {!isMeReady && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onReady}
          className="group relative px-7 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)] transition-all flex items-center gap-3 overflow-hidden"
        >
          <CheckCircle2 size={22} />
          準備好了，下一步
        </motion.button>
      )}

      {isMeReady && !allReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-7 py-4 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 text-base font-bold flex items-center gap-2 shadow-md"
        >
          <Check size={20} />
          已準備（等其他人）
        </motion.div>
      )}

      {allReady && isHost && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onAdvance}
          className="group relative px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center gap-3"
        >
          繼續
          <ChevronRight size={22} />
        </motion.button>
      )}

      {allReady && !isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-4 rounded-2xl bg-slate-900/50 border border-white/15 text-white/60 text-sm flex items-center gap-2"
        >
          <Volume2 size={16} />
          等待主持人推進
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 4) ActScreen —— 主畫面
// ═══════════════════════════════════════════════════════════
export interface ActScreenProps {
  actId: string;
  previewScript: typeof SCRIPTS[0] | null;
  roomState: RoomState | null;
  user: User | null;
  isHost: boolean;
  socket: Socket | null;
  isMicOn: boolean;
  toggleMic: () => void;
  currentSubtitle: string;
  onActComplete?: () => void;
}

export const ActScreen: React.FC<ActScreenProps> = ({
  actId,
  previewScript,
  roomState,
  user,
  isHost,
  socket,
  isMicOn,
  toggleMic,
  currentSubtitle,
  onActComplete,
}) => {
  const act: Act | null = ACT_REGISTRY[actId] ?? ENDING_REGISTRY[actId] ?? null;
  
  // ── 狀態 ──────────────────────────────────────────────
  const [beatIndex, setBeatIndex] = useState((roomState as any)?.currentActBeatIndex ?? 0);
  const [readyEmails, setReadyEmails] = useState<string[]>((roomState as any)?.actBeatReady ?? []);
  const [allReadyFromServer, setAllReadyFromServer] = useState(false);
  const [lastContentBeat, setLastContentBeat] = useState<Beat | null>(null); 
  const [dialogueSubtitle, setDialogueSubtitle] = useState<string>('');
  
  // 🌟 新增的互動狀態
  const [speakerCompleted, setSpeakerCompleted] = useState<boolean>(false);
  const [isActingMic, setIsActingMic] = useState(false);
  const [hasStartedActing, setHasStartedActing] = useState(false);
  
  const [dialogueLog, setDialogueLog] = useState<{ id: string; characterName: string; text: string }[]>([]);

  const wasMicOnRef = useRef(false);
  const beatIndexRef = useRef(beatIndex);
  beatIndexRef.current = beatIndex;
  const dialogueSubtitleRef = useRef('');
  dialogueSubtitleRef.current = dialogueSubtitle;

  useEffect(() => {
    const serverBeatIndex = (roomState as any)?.currentActBeatIndex;
    if (serverBeatIndex !== undefined && serverBeatIndex > beatIndexRef.current) {
      setBeatIndex(serverBeatIndex);
    }
    
    const serverReady = (roomState as any)?.actBeatReady;
    if (serverReady) {
      setReadyEmails(prev => {
        if (prev.length === serverReady.length && prev.every((e, i) => e === serverReady[i])) {
          return prev;
        }
        return serverReady;
      });

      const onlineCount = roomState?.users.filter(u => u.connectionStatus !== 'offline').length ?? 1;
      const nextAllReady = serverReady.length >= onlineCount;
      setAllReadyFromServer(prev => prev === nextAllReady ? prev : nextAllReady);
    }
  }, [roomState]);

  const myUser = roomState?.users.find(u => u.email === user?.email);
  const myCharacter = myUser?.assignedCharacter ?? '';

  const totalCount = roomState?.users.filter(u => u.connectionStatus !== 'offline').length ?? 1;
  const readyCount = readyEmails.length;
  const isMeReady = !!user?.email && readyEmails.includes(user.email);

  const getAvatarUrl = (characterName: string): string => {
    const c = previewScript?.characters.find(x => x.name === characterName);
    return c?.image ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(characterName)}`;
  };

  const advanceBeat = useCallback(() => {
    if (!act) return;
    let next = beatIndexRef.current + 1;

    while (next < act.beats.length && act.beats[next].type === 'pause') {
      if (next === act.beats.length - 1) break;
      next++;
    }

    const curBeat = act.beats[beatIndexRef.current];
    const nxtBeat = act.beats[next];
    setDialogueLog(prev => {
      let newLog = prev;
      if (curBeat?.type === 'player_dialogue') {
        const text = dialogueSubtitleRef.current || curBeat.defaultLine;
        newLog = [...prev, { id: curBeat.id, characterName: curBeat.characterName, text }];
      }
      if (!nxtBeat || nxtBeat.type !== 'player_dialogue') newLog = [];
      return newLog;
    });

    socket?.emit('act_beat_advance', { actId, beatIndex: next });
    if (next >= act.beats.length) {
      onActComplete?.();
      return;
    }
    
    // Reset states
    setBeatIndex(next);
    setReadyEmails([]);
    setAllReadyFromServer(false);
    setDialogueSubtitle('');
    setSpeakerCompleted(false);
    setIsActingMic(false);
    setHasStartedActing(false);
    wasMicOnRef.current = false;
  }, [act, actId, socket, onActComplete]);

  // 🌟 下一步同時防呆關麥
  const handleSpeakerAdvance = useCallback(() => {
    if (isMicOn) toggleMic();
    advanceBeat();
  }, [isMicOn, toggleMic, advanceBeat]);

  const sendReady = useCallback(() => {
    if (!user?.email) return;
    if (isMeReady) return;
    socket?.emit('act_beat_ready', { beatIndex });
    setReadyEmails(prev => {
      const next = prev.includes(user.email) ? prev : [...prev, user.email];
      const onlineCount = roomState?.users.filter(u => u.connectionStatus !== 'offline').length ?? 1;
      if (next.length >= onlineCount) {
        setAllReadyFromServer(true);
      }
      return next;
    });
  }, [socket, beatIndex, user?.email, isMeReady, roomState]);

  useEffect(() => {
    if (!act) return;
    const beat = act.beats[beatIndex];
    if (beat && beat.type !== 'pause') {
      setLastContentBeat(beat);
    }
  }, [beatIndex, act]);

  // 🌟 beat 變動重設狀態
  useEffect(() => {
    setDialogueSubtitle('');
    setSpeakerCompleted(false);
    setIsActingMic(false);
    setHasStartedActing(false);
    wasMicOnRef.current = false;
  }, [beatIndex]);

  // 🌟 偵測 Acting Mic 的完成狀態
  useEffect(() => {
    if (!act) return;
    const beat = act.beats[beatIndex];
    if (beat?.type !== 'player_dialogue') return;
    if (beat.characterName !== myCharacter) return;

    if (isActingMic) {
      wasMicOnRef.current = true;
    } else if (wasMicOnRef.current && !isActingMic) {
      setSpeakerCompleted(true);
    }
  }, [isActingMic, beatIndex, act, myCharacter]);

  // ── 🌟 互斥麥克風開關控制 ─────────────────────────────
  const handleToggleGeneralMic = () => {
    if (isMicOn) {
      if (isActingMic) setIsActingMic(false); // 切換到一般麥
      else toggleMic(); // 關閉
    } else {
      toggleMic();
      setIsActingMic(false);
    }
  };

  const handleToggleActingMic = () => {
    setHasStartedActing(true);
    if (isMicOn) {
      if (!isActingMic) setIsActingMic(true); // 切換到演戲麥
      else {
        toggleMic();
        setIsActingMic(false);
      }
    } else {
      toggleMic();
      setIsActingMic(true);
    }
  };

  // ── host 自動處理斷線 ─────────────────────────────
  useEffect(() => {
    if (!isHost || !act) return;
    const beat = act.beats[beatIndex];
    if (beat?.type !== 'player_dialogue') return;

    const speakerUser = roomState?.users.find(u => u.assignedCharacter === beat.characterName);
    if (speakerUser?.connectionStatus !== 'offline') return;

    const timer = setTimeout(() => {
      socket?.emit('speaking_data', { subtitle: `${beat.characterName}：${beat.defaultLine}` });
      setDialogueSubtitle(beat.defaultLine);
      advanceBeat();
    }, 2000);
    return () => clearTimeout(timer);
  }, [act, beatIndex, isHost, roomState, socket, advanceBeat]);

  useEffect(() => {
    if (!act) return;
    const beat = act.beats[beatIndex];
    if (beat?.type !== 'player_dialogue') return;

    const hasRealUser = roomState?.users.some(u => u.assignedCharacter === beat.characterName);
    if (!hasRealUser) {
      setDialogueSubtitle(beat.defaultLine);
    }
  }, [beatIndex, act, roomState]);

  // ── Socket 事件監聽 ─────────────────────────────
  useEffect(() => {
    if (!socket || !act) return;

    const handleAdvance = (data: { actId: string; beatIndex: number }) => {
      if (data.actId !== actId) return;
      if (data.beatIndex >= act.beats.length) {
        onActComplete?.();
        return;
      }
      
      const curBeat = act.beats[beatIndexRef.current];
      const nxtBeat = act.beats[data.beatIndex];
      setDialogueLog(prev => {
        let newLog = prev;
        if (curBeat?.type === 'player_dialogue') {
          const text = dialogueSubtitleRef.current || curBeat.defaultLine;
          newLog = [...prev, { id: curBeat.id, characterName: curBeat.characterName, text }];
        }
        if (!nxtBeat || nxtBeat.type !== 'player_dialogue') newLog = [];
        return newLog;
      });

      setBeatIndex(data.beatIndex);
      setReadyEmails([]);
      setAllReadyFromServer(false);
      setDialogueSubtitle('');
      setSpeakerCompleted(false);
      setIsActingMic(false);
      setHasStartedActing(false);
      wasMicOnRef.current = false;
    };

    const handleReadyState = (data: { beatIndex: number; readyEmails: string[]; allReady?: boolean }) => {
      if (data.beatIndex !== beatIndexRef.current) return;
      setReadyEmails(data.readyEmails);
      setAllReadyFromServer(data.allReady ?? false);
    };

    const handleSpeakingData = (data: { subtitle?: string }) => {
      if (!data.subtitle) return;
      const beat = act.beats[beatIndexRef.current];
      if (beat?.type !== 'player_dialogue') return;

      if (data.subtitle.includes(beat.characterName)) {
        const parts = data.subtitle.split(/[:：]/);
        const textOnly = parts.length > 1 ? parts.slice(1).join('：').trim() : data.subtitle.trim();
        setDialogueSubtitle(prev => prev === textOnly ? prev : textOnly);
      }
    };

    socket.on('act_beat_advance', handleAdvance);
    socket.on('act_beat_ready_state', handleReadyState);
    socket.on('speaking_data', handleSpeakingData);

    return () => {
      socket.off('act_beat_advance', handleAdvance);
      socket.off('act_beat_ready_state', handleReadyState);
      socket.off('speaking_data', handleSpeakingData);
    };
  }, [socket, actId, act, onActComplete]);

  // ── 🌟 STT 字幕控制：僅在 isActingMic 下接收 ─────────────────────────────
  useEffect(() => {
    if (!act) return;
    const beat = act.beats[beatIndex];
    if (beat?.type !== 'player_dialogue') return;
    if (beat.characterName !== myCharacter) return;
    
    if (!isActingMic) return;

    if (currentSubtitle && currentSubtitle.includes(myCharacter)) {
      const parts = currentSubtitle.split(/[:：]/);
      const textOnly = parts.length > 1 ? parts.slice(1).join('：').trim() : currentSubtitle.trim();
      setDialogueSubtitle(prev => prev === textOnly ? prev : textOnly);
    }
  }, [currentSubtitle, beatIndex, act, myCharacter, isActingMic]);

  // ── 用預設台詞跳過 ────────────────────────────────────
  const handleUseFallback = (beat: PlayerDialogueBeat) => {
    setHasStartedActing(true);
    setDialogueSubtitle(beat.defaultLine);
    socket?.emit('speaking_data', { subtitle: `${beat.characterName}：${beat.defaultLine}` });
    setSpeakerCompleted(true);
  };

  // ── 渲染當前 beat ─────────────────────────
  const renderCurrentBeat = (beat: Beat | null): React.ReactNode => {
    if (!beat) return null;

    switch (beat.type) {
      case 'narration':
        return <NarrationLine key={beat.id} text={beat.text} />;

      case 'player_dialogue': {
        const isMyTurn = beat.characterName === myCharacter;
        return (
          <DialogueBubble
            key={beat.id}
            characterName={beat.characterName}
            avatarUrl={getAvatarUrl(beat.characterName)}
            isCurrentPlayer={isMyTurn}
            subtitle={dialogueSubtitle}
            isMicOn={isActingMic}
            prompt={isMyTurn ? beat.prompt : undefined}
          />
        );
      }
      case 'pause':
        return null;
    }
  };

  if (!act) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900 text-white">
        <p className="text-slate-400">找不到幕 ID：{actId}</p>
      </div>
    );
  }

  const currentBeatRaw = act.beats[beatIndex] ?? null;
  const currentBeat = currentBeatRaw?.type === 'pause' ? lastContentBeat : currentBeatRaw;

  const isDialogueBeat = currentBeat?.type === 'player_dialogue';
  const isMeSpeaker = isDialogueBeat && currentBeat.characterName === myCharacter;
  const speakerName = isDialogueBeat ? currentBeat.characterName : undefined;
  const isUnassignedDialogue =
    isDialogueBeat &&
    !roomState?.users.some(u => u.assignedCharacter === currentBeat.characterName);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: act.backgroundImage ?? '#0f172a' }}
    >
      <div className="absolute top-6 left-0 right-0 text-center pointer-events-none">
        <span className="text-white/50 text-sm font-serif tracking-[0.3em] uppercase">
          {act.title}
        </span>
      </div>

      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div
          className="h-full bg-white/40"
          animate={{ width: `${(beatIndex / Math.max(1, act.beats.length)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 px-4 overflow-y-auto py-8">
        {dialogueLog.map(entry => (
          <DialogueBubble
            key={`log-${entry.id}`}
            characterName={entry.characterName}
            avatarUrl={getAvatarUrl(entry.characterName)}
            isCurrentPlayer={false}
            subtitle={entry.text}
            isMicOn={false}
          />
        ))}
        {renderCurrentBeat(currentBeat)}
      </div>

      {/* 🌟 左下角：全域語音按鈕 (與右側演戲按鈕互斥) */}
      <div className="fixed bottom-8 left-8 z-[90]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleGeneralMic}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold shadow-xl transition-all border",
            (isMicOn && !isActingMic)
              ? "bg-red-500/90 hover:bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
              : "bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md text-slate-300 border-slate-600"
          )}
        >
          {(isMicOn && !isActingMic) ? <Mic size={20} /> : <MicOff size={20} />}
          <span className="hidden sm:inline">{(isMicOn && !isActingMic) ? "收音中" : "開啟麥克風"}</span>
        </motion.button>
      </div>

      <ReadyControl
        isHost={isHost}
        isMeReady={isMeReady}
        readyCount={readyCount}
        totalCount={totalCount}
        allReady={allReadyFromServer}
        onReady={sendReady}
        onAdvance={advanceBeat}
        beatType={
          currentBeat?.type === 'narration' || currentBeat?.type === 'player_dialogue'
            ? currentBeat.type
            : null
        }
        isMeSpeaker={isMeSpeaker}
        speakerName={speakerName}
        isActingMic={isActingMic}
        hasStartedActing={hasStartedActing}
        onToggleActingMic={handleToggleActingMic}
        onUseFallback={() => {
          if (currentBeat?.type === 'player_dialogue') handleUseFallback(currentBeat);
        }}
        speakerCompleted={speakerCompleted}
        onSpeakerAdvance={handleSpeakerAdvance}
        isUnassignedDialogue={isUnassignedDialogue}
      />
    </motion.div>
  );
};

export default ActScreen;