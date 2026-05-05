import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, LogOut, ScrollText, Search, Mic, MicOff } from 'lucide-react';
import { STORY_TRUTH_CONTENT, KILLER_DETECTION_CONTENT } from '../data/truthContent';

interface MeetingUser {
  id: string;
  email: string;
  character: string;
  isMicOn: boolean;
  isAI?: boolean;
}

interface TruthScreenProps {
  onLeaveRoom: () => void;
  isMicOn: boolean;
  toggleMic: () => void;
  meetingUsers?: MeetingUser[];
  isKillerCaught: boolean;
  scriptId: number;
  surveyCount: number;
}

type DocumentType = 'story' | 'killer' | null;

const PAPER_LINES_LIGHT = `
  repeating-linear-gradient(
    0deg,
    rgba(120, 53, 15, 0.03),
    rgba(120, 53, 15, 0.03) 1px,
    transparent 1px,
    transparent 26px
  )
`;

const PAPER_LINES_DARK = `
  repeating-linear-gradient(
    0deg,
    rgba(252, 211, 77, 0.04),
    rgba(252, 211, 77, 0.04) 1px,
    transparent 1px,
    transparent 26px
  )
`;

export const TruthScreen: React.FC<TruthScreenProps> = ({
  onLeaveRoom,
  isMicOn,
  toggleMic,
  meetingUsers = [],
  isKillerCaught,
  scriptId,
  surveyCount,
}) => {
  const [activeDoc, setActiveDoc] = useState<DocumentType>(null);
  const activeSpeakers = meetingUsers.filter(u => u.isMicOn);

  // ─── 主題 ──────────────────────────────────────────────
  const T = isKillerCaught
    ? {
        bg: 'linear-gradient(140deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
        docBg: 'linear-gradient(140deg, #fffbeb 0%, #fef3c7 100%)',
        sub: 'text-amber-700',
        title: 'text-amber-950',
        desc: 'text-amber-800/70',
        cardBg: '#f5e9c8',
        cardLines: PAPER_LINES_LIGHT,
        cardBorder: 'border-amber-900/30',
        cardShadow: 'shadow-[0_20px_40px_-15px_rgba(120,53,15,0.4)] hover:shadow-[0_30px_60px_-15px_rgba(120,53,15,0.5)]',
        cardIconRing: 'border-amber-900/30 bg-white/30',
        cardIcon: 'text-amber-900',
        cardName: 'text-amber-950',
        cardSub: 'text-amber-700/80',
        cardTag: 'border-amber-900/40 bg-amber-50/50',
        cardTagText: 'text-amber-900',
        docHeaderBg: 'bg-amber-100/40',
        docHeaderBorder: 'border-amber-900/15',
        docTitle: 'text-amber-950',
        docContentBg: '#fdf6e3',
        docContentBorder: 'rgba(120, 53, 15, 0.2)',
        docContentText: 'text-amber-950',
        docContentLines: PAPER_LINES_LIGHT,
        backBtn: 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50',
        leaveBtn: 'bg-white/70 border-amber-300 text-amber-900 hover:bg-white',
        micBarBg: 'bg-amber-50/95 border-amber-200',
        micOn: 'bg-amber-800 text-amber-50 hover:bg-amber-900',
        micOff: 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50',
        micPing: 'bg-amber-700/30',
        speakerBg: 'bg-white/60 border-amber-200',
        speakerDot: 'bg-amber-600',
        speakerDotPing: 'bg-amber-500',
        speakerName: 'text-amber-900',
      }
    : {
        bg: 'linear-gradient(140deg, #0f172a 0%, #1e293b 50%, #020617 100%)',
        docBg: 'linear-gradient(140deg, #0f172a 0%, #1e293b 100%)',
        sub: 'text-slate-500',
        title: 'text-slate-200',
        desc: 'text-slate-400',
        cardBg: '#1c1814',
        cardLines: PAPER_LINES_DARK,
        cardBorder: 'border-amber-900/40',
        cardShadow: 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]',
        cardIconRing: 'border-amber-700/40 bg-black/30',
        cardIcon: 'text-amber-300/70',
        cardName: 'text-amber-100',
        cardSub: 'text-amber-200/50',
        cardTag: 'border-amber-700/40 bg-black/40',
        cardTagText: 'text-amber-200/80',
        docHeaderBg: 'bg-slate-900/60',
        docHeaderBorder: 'border-slate-700',
        docTitle: 'text-slate-200',
        docContentBg: '#1c1814',
        docContentBorder: 'rgba(252, 211, 77, 0.15)',
        docContentText: 'text-amber-100/90',
        docContentLines: PAPER_LINES_DARK,
        backBtn: 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700',
        leaveBtn: 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700',
        micBarBg: 'bg-slate-900/95 border-slate-700',
        micOn: 'bg-red-600 text-white hover:bg-red-500',
        micOff: 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600',
        micPing: 'bg-red-500/40',
        speakerBg: 'bg-slate-800/70 border-slate-700',
        speakerDot: 'bg-emerald-400',
        speakerDotPing: 'bg-emerald-400',
        speakerName: 'text-slate-200',
      };

  return (
    <>
      {/* ─── 主畫面 ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-8 pb-32 overflow-y-auto"
        style={{ background: T.bg }}
      >
        {/* 標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-12 mt-4"
        >
          <p className={`text-xs tracking-[0.5em] uppercase mb-3 font-serif ${T.sub}`}>
            {isKillerCaught ? 'The Truth Revealed' : 'The Killer Got Away'}
          </p>
          <h1 className={`text-5xl md:text-6xl font-black tracking-tight font-serif ${T.title}`}>
            真相大白
          </h1>
          <p className={`mt-4 text-sm font-medium ${T.desc}`}>
            點擊文件查看完整資訊　•　可自由開麥討論
          </p>
        </motion.div>

        {/* 兩份文件 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex gap-10 flex-wrap justify-center"
        >
          {(['story', 'killer'] as const).map((kind, idx) => (
            <button
              key={kind}
              onClick={() => setActiveDoc(kind)}
              className={`group relative w-72 h-96 rounded-sm border ${T.cardBorder} ${T.cardShadow} transition-all hover:-translate-y-2 ${idx === 0 ? 'hover:rotate-[-1deg]' : 'hover:rotate-[1deg]'}`}
              style={{
                backgroundColor: T.cardBg,
                backgroundImage: `${T.cardLines}, radial-gradient(ellipse at top ${idx === 0 ? 'left' : 'right'}, ${isKillerCaught ? 'rgba(255,255,255,0.6)' : 'rgba(252,211,77,0.06)'}, transparent 60%), radial-gradient(ellipse at bottom ${idx === 0 ? 'right' : 'left'}, ${isKillerCaught ? 'rgba(120,53,15,0.12)' : 'rgba(0,0,0,0.5)'}, transparent 60%)`,
              }}
            >
              <div className="relative h-full flex flex-col items-center justify-center px-8 py-12">
                <div className={`mb-6 p-4 border-2 rounded-full ${T.cardIconRing}`}>
                  {kind === 'story'
                    ? <ScrollText size={48} className={T.cardIcon} strokeWidth={1.5} />
                    : <Search size={48} className={T.cardIcon} strokeWidth={1.5} />
                  }
                </div>
                <h3 className={`text-3xl font-black mb-2 font-serif tracking-tight ${T.cardName}`}>
                  {kind === 'story' ? '真相還原' : '抓出兇手'}
                </h3>
                <p className={`text-xs tracking-[0.3em] uppercase font-serif mb-6 ${T.cardSub}`}>
                  {kind === 'story' ? 'Story Truth' : 'How to Catch the Killer'}
                </p>
                <div className={`px-5 py-2 border rounded-sm ${T.cardTag}`}>
                  <p className={`text-xs font-bold font-serif tracking-widest ${T.cardTagText}`}>
                    點此翻閱
                  </p>
                </div>
              </div>
            </button>
          ))}
        </motion.div>

        {/* 離開房間 */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={onLeaveRoom} // 直接呼叫離開函式
            className={`mt-12 px-6 py-3 rounded-2xl backdrop-blur-sm border font-bold shadow-md transition-colors flex items-center gap-2 ${T.leaveBtn}`}
          >
            <LogOut size={18} />
            離開房間
          </motion.button>
        </div>
      </motion.div>

      {/* ─── 文件閱讀 overlay ─── */}
      <AnimatePresence>
        {activeDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] flex flex-col"
            style={{ background: T.docBg }}
          >
            <div className={`flex items-center justify-between px-8 py-6 border-b backdrop-blur-sm shrink-0 ${T.docHeaderBg} ${T.docHeaderBorder}`}>
              <button
                onClick={() => setActiveDoc(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold transition-colors shadow-sm ${T.backBtn}`}
              >
                <ArrowLeft size={18} />
                返回
              </button>
              <h2 className={`text-2xl font-black tracking-wider font-serif ${T.docTitle}`}>
                {activeDoc === 'story' ? '真相還原' : '抓出兇手'}
              </h2>
              <div className="w-20" />
            </div>

            <div className="flex-1 overflow-y-auto py-12 px-6 pb-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-3xl mx-auto p-12 shadow-xl"
                style={{
                  backgroundColor: T.docContentBg,
                  backgroundImage: T.docContentLines,
                  border: `1px solid ${T.docContentBorder}`,
                }}
              >
                <pre className={`text-sm leading-7 font-serif whitespace-pre-wrap break-words ${T.docContentText}`}>
                  {activeDoc === 'story' ? STORY_TRUTH_CONTENT[scriptId] : KILLER_DETECTION_CONTENT[scriptId]}
                </pre>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 底部 mic 狀態列（兩個視圖都看得到） ─── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[100] border-t backdrop-blur-md ${T.micBarBg}`}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-center gap-4 flex-wrap">
          {/* 麥克風按鈕 */}
          <button
            onClick={() => { console.log('[TruthScreen] mic button clicked, toggleMic:', typeof toggleMic); toggleMic(); }}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all active:scale-95 shadow-md ${
              isMicOn ? T.micOn : T.micOff
            }`}
          >
            {isMicOn && (
              <span className={`absolute inset-0 rounded-xl animate-ping pointer-events-none ${T.micPing}`} />
            )}
            {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
            {isMicOn ? '麥克風開啟中' : '開啟麥克風'}
          </button>

          {/* 發言中玩家清單 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border min-h-[40px] ${T.speakerBg}`}>
            {activeSpeakers.length > 0 ? (
              <>
                {activeSpeakers.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${T.speakerDotPing}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${T.speakerDot}`} />
                    </span>
                    <span className={`text-xs font-semibold font-serif ${T.speakerName}`}>
                      {u.character}
                    </span>
                  </div>
                ))}
                <Mic size={12} className={isKillerCaught ? 'text-amber-600 ml-1' : 'text-emerald-400 ml-1'} />
              </>
            ) : (
              <span className={`text-xs italic ${isKillerCaught ? 'text-amber-700/50' : 'text-slate-500'}`}>
                目前沒有人發言
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};