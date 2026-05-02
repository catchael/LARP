import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RoomState, User } from '../types';
import { SCRIPTS } from '../data/scripts';
import { CHARACTER_PROFILES } from '../data/profileContent';

interface GameProfileScreenProps {
  previewScript: typeof SCRIPTS[0] | null;
  roomState: RoomState | null;
  user: User | null;
  isProfileFlipped: boolean;
  setIsProfileFlipped: (v: boolean) => void;
}

// ── 頁面切換動畫方向 ────────────────────────────────────────
const SLIDE_VARIANTS = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

// ── 裝飾用細線背景 ──────────────────────────────────────────
const PAPER_LINES = `repeating-linear-gradient(
  0deg,
  rgba(255, 255, 255, 0.03),
  rgba(255, 255, 255, 0.03) 1px,
  transparent 1px,
  transparent 28px
)`;

// ── 頁籤標籤 ────────────────────────────────────────────────
const PAGE_LABELS = ['身分總覽', '調查卷一', '調查卷二'] as const;

export const GameProfileScreen: React.FC<GameProfileScreenProps> = ({
  previewScript,
  roomState,
  user,
}) => {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);

  if (!previewScript || !roomState) return null;

  const myUser = roomState.users.find(u => u.email === user?.email);
  const character =
    previewScript.characters.find(c => c.name === myUser?.assignedCharacter) ||
    previewScript.characters[0];

  const scriptId = roomState?.scriptId ?? previewScript?.id ?? 1;
  const profileContent = CHARACTER_PROFILES[scriptId]?.[character.name];

  const goTo = (next: number) => {
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  return (
    <div className="max-w-3xl w-full mx-auto select-none">

      {/* ── 頁籤列 ─────────────────────────────────────────── */}
      <div className="flex mb-0 relative z-10 gap-1 px-1">
        {PAGE_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative px-6 py-2.5 text-sm font-bold tracking-widest font-serif transition-all"
            style={{
              color: page === i ? '#f5e8c8' : '#93b8cc',
              background: page === i
                ? 'linear-gradient(180deg, #2e3a46 0%, #273240 100%)'
                : 'linear-gradient(180deg, #1e2830 0%, #1a2330 100%)',
              borderTop: `1px solid ${page === i ? '#4a6070' : '#2a3a48'}`,
              borderLeft: `1px solid ${page === i ? '#4a6070' : '#2a3a48'}`,
              borderRight: `1px solid ${page === i ? '#4a6070' : '#2a3a48'}`,
              borderBottom: page === i ? '1px solid #273240' : '1px solid #2a3a48',
              borderRadius: '4px 4px 0 0',
              marginBottom: page === i ? '-1px' : '2px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 主卡片 ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)]"
        style={{
          background: 'linear-gradient(160deg, #2e3a46 0%, #273240 60%, #222c38 100%)',
          backgroundImage: `${PAPER_LINES}, linear-gradient(160deg, #2e3a46 0%, #273240 60%, #222c38 100%)`,
          border: '1px solid #4a6070',
          borderRadius: '0 4px 4px 4px',
          minHeight: '620px',
        }}
      >
        {/* 頁角裝飾 */}
        <div
          className="absolute top-0 right-0 w-10 h-10 pointer-events-none"
          style={{
            background: 'linear-gradient(225deg, #4a6070 40%, transparent 40%)',
            opacity: 0.6,
          }}
        />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={page}
            custom={dir}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
            className="absolute inset-0 flex flex-col"
          >
            {/* ── 頁面 0：身分總覽 ───────────────────────────── */}
            {page === 0 && (
              <Page0 character={character} />
            )}

            {/* ── 頁面 1：調查卷一 ───────────────────────────── */}
            {page === 1 && (
              <ProfilePage
                data={profileContent?.profile1}
                fallbackTitle="個人背景調查　第一卷"
              />
            )}

            {/* ── 頁面 2：調查卷二 ───────────────────────────── */}
            {page === 2 && (
              <ProfilePage
                data={profileContent?.profile2}
                fallbackTitle="個人背景調查　第二卷"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── 翻頁控制 ───────────────────────────────────────── */}
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-between px-8 z-10">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded font-bold text-sm tracking-widest transition-all disabled:opacity-25"
            style={{
              color: '#c8dce8',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <ChevronLeft size={16} /> 上一頁
          </button>

          {/* 頁碼點 */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: page === i ? '#93cfe8' : 'rgba(147,207,232,0.25)',
                  transform: page === i ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(page + 1)}
            disabled={page === 2}
            className="flex items-center gap-1.5 px-5 py-2 rounded font-bold text-sm tracking-widest transition-all disabled:opacity-25"
            style={{
              color: '#c8dce8',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            下一頁 <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 第一頁：身分總覽
// ════════════════════════════════════════════════════════════
function Page0({ character }: { character: any }) {
  return (
    <div className="flex flex-col h-full px-10 pt-10 pb-24 overflow-y-auto">

      {/* 頁眉 */}
      <PageHeader label="機密檔案　CONFIDENTIAL" />

      <div className="flex gap-8 mt-6">
        {/* 照片 */}
        <div className="shrink-0">
          <div
            className="w-36 h-48 overflow-hidden shadow-md"
            style={{
              border: '2px solid #6a8fa8',
              outline: '4px solid rgba(106,143,168,0.2)',
              outlineOffset: '3px',
              transform: 'rotate(-1.5deg)',
            }}
          >
            <img
              src={character.image}
              alt={character.name}
              className="w-full h-full object-cover"
              style={{ filter: 'sepia(20%) contrast(1.1) brightness(0.9)' }}
              referrerPolicy="no-referrer"
            />
          </div>
          {/* 身分標籤 */}
          <div
            className="mt-3 text-center text-xs font-bold tracking-widest py-1"
            style={{
              color: '#93cfe8',
              borderTop: '1px solid #6a8fa8',
              borderBottom: '1px solid #6a8fa8',
            }}
          >
            {character.role}
          </div>
        </div>

        {/* 右側資訊 */}
        <div className="flex-1 space-y-5 pt-1">
          <div>
            <p className="text-xs font-bold tracking-[0.4em] uppercase mb-1" style={{ color: '#93b8cc' }}>
              姓名
            </p>
            <h2
              className="text-4xl font-black tracking-widest font-serif"
              style={{ color: '#f5e8c8' }}
            >
              {character.name}
            </h2>
          </div>

          <Divider />

          <FieldRow label="身分" value={character.identity} />
          <FieldRow label="性格" value={character.personality} />
        </div>
      </div>

      <Divider className="mt-8" />

      {/* 秘密與過去 */}
      <div className="mt-6 space-y-3">
        <SectionHeading>你的秘密與過去</SectionHeading>
        <div
          className="p-5 text-sm leading-7 font-serif whitespace-pre-wrap"
          style={{
            color: '#e8f0f4',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '2px',
          }}
        >
          {(character as any).story}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 第二、三頁：通用個人檔案頁
// ════════════════════════════════════════════════════════════
function ProfilePage({
  data,
  fallbackTitle,
}: {
  data?: { title: string; sections: { heading: string; content: string }[] };
  fallbackTitle: string;
}) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-serif" style={{ color: '#93b8cc' }}>
          尚未填入檔案內容
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-10 pt-10 pb-24 overflow-y-auto">
      <PageHeader label={data.title || fallbackTitle} />

      <div className="mt-6 space-y-6">
        {data.sections.map((sec, i) => (
          <div key={i} className="space-y-2">
            <SectionHeading>{sec.heading}</SectionHeading>
            <div
              className="p-5 text-sm leading-7 font-serif whitespace-pre-wrap"
              style={{
                color: '#e8f0f4',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '2px',
              }}
            >
              {sec.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 共用小元件
// ════════════════════════════════════════════════════════════
function PageHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #4a6070' }}>
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: '#7ab0c8' }} />
        <p className="text-xs font-bold tracking-[0.5em] uppercase font-serif" style={{ color: '#93cfe8' }}>
          {label}
        </p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-1 h-1 rounded-full" style={{ background: 'rgba(122,176,200,0.3)' }} />
        ))}
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.3em] uppercase mb-0.5" style={{ color: '#93b8cc' }}>
        {label}
      </p>
      <p className="text-base font-serif" style={{ color: '#f0f6f8' }}>{value}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-black tracking-[0.3em] uppercase pl-3 font-serif"
      style={{
        color: '#c0dcea',
        borderLeft: '3px solid #6a8fa8',
      }}
    >
      {children}
    </h3>
  );
}

function Divider({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-full h-px ${className}`}
      style={{ background: 'linear-gradient(90deg, transparent, #4a6070 30%, #4a6070 70%, transparent)' }}
    />
  );
}