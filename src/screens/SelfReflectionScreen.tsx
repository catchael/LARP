import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Brain, MessageSquare, GitMerge, ChevronRight,
  CheckCircle2, Circle, Search, Users, Clock, Target,
  Highlighter, AlertCircle, Volume2,
} from 'lucide-react';
import { Evidence } from '../gameData';
import { cn } from '../types';

interface SelfReflectionProps {
  transcript: string[];
  clues: Evidence[];
  onComplete: (data: any) => void;
}

interface MenuCardProps {
  icon: React.ReactElement<{ size?: number }>;
  title: string;
  desc: string;
  onClick: () => void;
}

const TIMER_SECONDS = 240; // 4 分鐘

// ── 顏色系統（淺暖色） ──────────────────────────────────────
const warm = {
  bg: 'bg-amber-50',
  border: 'border-amber-200',
  card: 'bg-white',
  cardBorder: 'border-amber-100',
  label: 'text-amber-700',
  labelBg: 'bg-amber-100',
  accent: 'text-orange-600',
  accentBg: 'bg-orange-50',
  accentBorder: 'border-orange-200',
  selected: 'bg-orange-500 border-orange-400 text-white',
  unselected: 'bg-white border-amber-200 text-amber-800 hover:border-orange-300',
  btn: 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-200',
  timer: 'text-orange-600',
  timerBg: 'bg-orange-50 border-orange-200',
  transcript: 'bg-amber-50 border-amber-200',
  transcriptText: 'text-amber-900',
  heading: 'text-stone-800',
  sub: 'text-stone-500',
  inputBg: 'bg-white border-amber-200 text-stone-800 focus:border-orange-400',
  selectBg: 'bg-white border-amber-200 text-stone-700',
};

// ── 主組件 ──────────────────────────────────────────────────

export function SelfReflectionScreen({ transcript, clues, onComplete }: SelfReflectionProps) {
  const [subStep, setSubStep] = useState<'menu' | 'cognitive' | 'clarity' | 'coherence'>('menu');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  // 倒數計時
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // 時間到自動完成，傳空資料
          onComplete({ timedOut: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const timerUrgent = timeLeft <= 60;

  // ── 文字稿區塊（共用） ───────────────────────────────────

  const TranscriptBlock = () => {
    if (!transcript || transcript.length === 0) return null;
    return (
      <div className={cn('rounded-2xl border p-4 mb-6', warm.transcript)}>
        <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', warm.label)}>
          📝 你在此輪的發言紀錄
        </p>
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {transcript.map((line: string, i: number) => (
            <p key={i} className={cn('text-sm leading-relaxed', warm.transcriptText)}>
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  };

  // ── 計時器元件 ───────────────────────────────────────────

  const Timer = () => (
    <div className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-mono font-bold transition-colors',
      timerUrgent ? 'bg-red-50 border-red-300 text-red-600 animate-pulse' : cn(warm.timerBg, warm.timer)
    )}>
      <Clock size={14} />
      {mins}:{secs}
    </div>
  );

  // ── Menu ─────────────────────────────────────────────────

  if (subStep === 'menu') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 bg-amber-50 overflow-y-auto z-10"
      >
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={cn('text-2xl font-black mb-1', warm.heading)}>會後自我反思</h2>
            <p className={cn('text-sm', warm.sub)}>選擇這次會議中你想檢視的發言面向</p>
          </div>
          <Timer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </motion.div>
    );
  }

  // ── Cognitive ────────────────────────────────────────────

  if (subStep === 'cognitive') {
    return (
      <CognitiveScreen
        transcript={transcript}
        onBack={() => setSubStep('menu')}
        onComplete={onComplete}
        TranscriptBlock={TranscriptBlock}
        Timer={Timer}
      />
    );
  }

  // ── Clarity ──────────────────────────────────────────────

  if (subStep === 'clarity') {
    return (
      <ClarityScreen
        transcript={transcript}
        onBack={() => setSubStep('menu')}
        onComplete={onComplete}
        TranscriptBlock={TranscriptBlock}
        Timer={Timer}
      />
    );
  }

  // ── Coherence ────────────────────────────────────────────

  if (subStep === 'coherence') {
    return (
      <CoherenceScreen
        transcript={transcript}
        clues={clues}
        timeLeft={timeLeft}
        timerUrgent={timerUrgent}
        onBack={() => setSubStep('menu')}
        onComplete={onComplete}
        TranscriptBlock={TranscriptBlock}
        Timer={Timer}
      />
    );
  }

  // fallback（不應執行到這裡）
  return null;
}

// ── Coherence 子頁面 ─────────────────────────────────────────

interface CoherenceScreenProps {
  transcript: string[];
  clues: Evidence[];
  timeLeft: number;
  timerUrgent: boolean;
  onBack: () => void;
  onComplete: (data: any) => void;
  TranscriptBlock: React.FC;
  Timer: React.FC;
}

const STANCE_OPTIONS = [
  { value: 'accuse', label: '懷疑某人' },
  { value: 'defend', label: '為自己辯護' },
  { value: 'new_info', label: '提出新資訊' },
  { value: 'none', label: '沒有明確立場' },
];

const RESPONSE_OPTIONS = [
  { value: 'support', label: '有人支持我的論點' },
  { value: 'rebut', label: '有人反駁／質疑我的論點' },
  { value: 'none', label: '沒有人針對我的論點回應' },
  { value: 'unsure', label: '不確定／話題被帶走' },
];

function CoherenceScreen({
  transcript, clues, onBack, onComplete, TranscriptBlock, Timer
}: CoherenceScreenProps) {
  const [stance, setStance] = useState<string>('');
  const [selectedClueIds, setSelectedClueIds] = useState<string[]>([]);
  const [response, setResponse] = useState<string>('');

  const toggleClue = (id: string) => {
    setSelectedClueIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const canSubmit = stance !== '' && response !== '';

  const handleComplete = () => {
    if (!canSubmit) return;
    onComplete({
      type: 'coherence',
      stance,
      clueIds: selectedClueIds,
      response,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-amber-50 overflow-y-auto z-10"
    >
    <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
      {/* 頂部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={cn('text-sm font-medium', warm.sub, 'hover:text-stone-700')}
          >
            ← 返回
          </button>
          <div className="w-px h-4 bg-amber-200" />
          <div>
            <h2 className={cn('text-lg font-black', warm.heading)}>結構及連貫性</h2>
            <p className={cn('text-sm', warm.sub)}>RST 修辭結構理論</p>
          </div>
        </div>
        <Timer />
      </div>

      {/* 說明卡 */}
      <div className={cn('rounded-2xl border p-4 mb-6', warm.accentBg, warm.accentBorder)}>
        <p className={cn('text-sm font-bold mb-2', warm.accent)}>📌 什麼是好的結構發言？</p>
        <div className="space-y-1 text-sm text-stone-600 leading-relaxed">
          <p><span className="font-bold text-orange-600">動機層（Root）</span>：你的核心主張或結論</p>
          <p><span className="font-bold text-amber-600">行為層（Branch）</span>：支撐結論的邏輯行為</p>
          <p><span className="font-bold text-yellow-600">證據層（Leaf）</span>：具體的線索或事實</p>
        </div>
        <div className={cn('mt-3 pt-3 border-t text-sm', warm.accentBorder, 'text-stone-500 italic')}>
          範例：「我認為張警衛有殺人動機（動機）→ 因為他利用職務進入地下室（行為）→ 案發後他手持帶血鐵撬出現在地下室出口（證據）」
        </div>
      </div>

      {/* 文字稿 */}
      <TranscriptBlock />

      {/* Q1：立場 */}
      <Section label="你表達的立場是？" icon={<Target size={14} />}>
        <div className="grid grid-cols-2 gap-2">
          {STANCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStance(opt.value)}
              className={cn(
                'py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2',
                stance === opt.value ? warm.selected : warm.unselected
              )}
            >
              {stance === opt.value ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Q2：引用線索 */}
      <Section label="你引用的線索是？（可多選）" icon={<Search size={14} />}>
        {clues.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {clues.map(c => {
              const isSelected = selectedClueIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleClue(c.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5',
                    isSelected ? warm.selected : warm.unselected
                  )}
                >
                  {isSelected ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                  {c.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className={cn('text-xs italic', warm.sub)}>尚未收集任何證據</p>
        )}
        <p className={cn('text-xs mt-2', warm.sub)}>若此次發言未引用任何線索，可略過不選。</p>
      </Section>

      {/* Q3：他人回應 */}
      <Section label="其他人有沒有回應你的論點？" icon={<Users size={14} />}>
        <div className="grid grid-cols-1 gap-2">
          {RESPONSE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setResponse(opt.value)}
              className={cn(
                'py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 text-left',
                response === opt.value ? warm.selected : warm.unselected
              )}
            >
              {response === opt.value ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              {opt.label}
            </button>
          ))}
        </div>
        <p className={cn('text-xs mt-2', warm.sub)}>
          提示：這有助於評估你的「影響力」與「說服力」。
        </p>
      </Section>

      {/* 送出 */}
      <button
        onClick={handleComplete}
        disabled={!canSubmit}
        className={cn(
          'w-full py-4 rounded-2xl font-black text-base transition-all mt-2',
          canSubmit
            ? cn(warm.btn, 'shadow-lg')
            : 'bg-amber-100 text-amber-300 cursor-not-allowed'
        )}
      >
        {canSubmit ? '完成檢核 →' : '請完成上方所有必填題目'}
      </button>
    </div>
    </motion.div>
  );
}

// ── Section 包裝 ─────────────────────────────────────────────

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border p-4 mb-4', warm.card, warm.cardBorder)}>
      <p className={cn('text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', warm.label)}>
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

// ── 共用 HighlightText 元件 ─────────────────────────────────
// 讓玩家點擊文字段落來反白/取消反白選取區段

interface HighlightRange {
  start: number;
  end: number;
  color: 'yellow' | 'red' | 'blue';
}

function HighlightableText({
  text,
  highlights,
  color,
  onToggle,
}: {
  text: string;
  highlights: HighlightRange[];
  color: HighlightRange['color'];
  onToggle: (range: HighlightRange) => void;
}) {
  const colorMap = {
    yellow: 'bg-yellow-200 text-yellow-900',
    red: 'bg-red-200 text-red-900',
    blue: 'bg-blue-200 text-blue-900',
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const container = document.getElementById(`highlight-${color}-${text.slice(0, 8)}`);
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    // 計算相對於整段文字的 offset
    const preRange = document.createRange();
    preRange.setStart(container, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + selection.toString().length;

    if (end > start) {
      onToggle({ start, end, color });
      selection.removeAllRanges();
    }
  };

  // 把文字依照 highlight 區段分割成帶顏色的 spans
  const segments: { text: string; isHighlighted: boolean }[] = [];
  let pos = 0;
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  for (const h of sorted) {
    if (h.start > pos) segments.push({ text: text.slice(pos, h.start), isHighlighted: false });
    segments.push({ text: text.slice(h.start, h.end), isHighlighted: true });
    pos = h.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), isHighlighted: false });

  return (
    <p
      id={`highlight-${color}-${text.slice(0, 8)}`}
      onMouseUp={handleMouseUp}
      className="text-sm leading-relaxed text-stone-700 select-text cursor-text"
    >
      {segments.map((seg, i) =>
        seg.isHighlighted
          ? <mark key={i} className={cn('rounded px-0.5', colorMap[color])}>{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </p>
  );
}

// ── CognitiveScreen ──────────────────────────────────────────

interface SimpleScreenProps {
  transcript: string[];
  onBack: () => void;
  onComplete: (data: any) => void;
  TranscriptBlock: React.FC;
  Timer: React.FC;
}

function CognitiveScreen({ transcript, onBack, onComplete, TranscriptBlock, Timer }: SimpleScreenProps) {
  const [infoScore, setInfoScore] = useState<number>(0);           // Q1: 1-5
  const [infoHighlights, setInfoHighlights] = useState<Record<number, HighlightRange[]>>({});
  const [hasJargon, setHasJargon] = useState<boolean | null>(null); // Q2: 是/否
  const [jargonHighlights, setJargonHighlights] = useState<Record<number, HighlightRange[]>>({});

  const toggleHighlight = (
    lineIdx: number,
    range: HighlightRange,
    setter: React.Dispatch<React.SetStateAction<Record<number, HighlightRange[]>>>
  ) => {
    setter(prev => {
      const existing = prev[lineIdx] ?? [];
      // 若已存在重疊的反白就移除，否則新增
      const overlaps = existing.filter(h => !(h.end <= range.start || h.start >= range.end));
      if (overlaps.length > 0) {
        return { ...prev, [lineIdx]: existing.filter(h => !overlaps.includes(h)) };
      }
      return { ...prev, [lineIdx]: [...existing, range] };
    });
  };

  const canSubmit = infoScore > 0 && hasJargon !== null;

  const handleComplete = () => {
    if (!canSubmit) return;
    onComplete({ type: 'cognitive', infoScore, infoHighlights, hasJargon, jargonHighlights });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-amber-50 overflow-y-auto z-10">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* 頂部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={cn('text-sm font-medium', warm.sub, 'hover:text-stone-700')}>← 返回</button>
            <div className="w-px h-4 bg-amber-200" />
            <div>
              <h2 className={cn('text-lg font-black', warm.heading)}>認知負荷</h2>
              <p className={cn('text-sm', warm.sub)}>檢視你的發言是否讓對方難以消化</p>
            </div>
          </div>
          <Timer />
        </div>

        {/* 說明卡 */}
        <div className={cn('rounded-2xl border p-4 mb-6', warm.accentBg, warm.accentBorder)}>
          <p className={cn('text-sm font-bold mb-1', warm.accent)}>📌 什麼是認知負荷過高？</p>
          <p className="text-sm text-stone-600 leading-relaxed">
            一句話中塞入太多資訊，或使用對方不熟悉的詞彙而沒有解釋，都會讓聽者難以即時理解。
          </p>
          <p className="text-sm text-stone-400 mt-2 italic">
            例：「我是2020/12/20農曆11月25日丑時凌晨3:45出生在高雄醫學院」→ 大部分細節不必要
          </p>
        </div>

        <TranscriptBlock />

        {/* Q1：資訊量評分 */}
        <Section label="是否在一句話中塞入了過多資訊量？" icon={<Brain size={14} />}>
          <div className="flex gap-2 mb-4">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setInfoScore(n)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-bold transition-all',
                  infoScore === n ? warm.selected : warm.unselected
                )}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-stone-400 mb-4 px-1">
            <span>很少</span><span>很多</span>
          </div>
          {transcript.length > 0 && (
            <div className={cn('rounded-xl border p-3', warm.transcript)}>
              <p className={cn('text-xs mb-2 flex items-center gap-1', warm.label)}>
                <Highlighter size={12} /> 反白你認為資訊量過多的地方（人、事、時、地、物）
              </p>
              <div className="space-y-2">
                {transcript.map((line, i) => (
                  <HighlightableText key={i} text={line}
                    highlights={infoHighlights[i] ?? []}
                    color="yellow"
                    onToggle={range => toggleHighlight(i, range, setInfoHighlights)}
                  />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Q2：術語/陌生詞彙 */}
        <Section label="是否用了陌生詞彙/術語，但沒有充分解釋？" icon={<AlertCircle size={14} />}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[{ v: false, l: '否' }, { v: true, l: '是' }].map(opt => (
              <button key={String(opt.v)} onClick={() => setHasJargon(opt.v)}
                className={cn(
                  'py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2',
                  hasJargon === opt.v ? warm.selected : warm.unselected
                )}>
                {hasJargon === opt.v ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {opt.l}
              </button>
            ))}
          </div>
          {hasJargon && transcript.length > 0 && (
            <div className={cn('rounded-xl border p-3', warm.transcript)}>
              <p className={cn('text-xs mb-2 flex items-center gap-1', warm.label)}>
                <Highlighter size={12} /> 反白你認為對方可能不熟悉的詞彙
              </p>
              <div className="space-y-2">
                {transcript.map((line, i) => (
                  <HighlightableText key={i} text={line}
                    highlights={jargonHighlights[i] ?? []}
                    color="red"
                    onToggle={range => toggleHighlight(i, range, setJargonHighlights)}
                  />
                ))}
              </div>
            </div>
          )}
          <p className={cn('text-xs mt-2', warm.sub)}>備註：如果之前會議已提過並解釋的詞彙，不算在內。</p>
        </Section>

        <button onClick={handleComplete} disabled={!canSubmit}
          className={cn('w-full py-4 rounded-2xl font-black text-base transition-all mt-2',
            canSubmit ? cn(warm.btn, 'shadow-lg') : 'bg-amber-100 text-amber-300 cursor-not-allowed'
          )}>
          {canSubmit ? '完成檢核 →' : '請完成上方所有必填題目'}
        </button>
      </div>
    </motion.div>
  );
}

// ── ClarityScreen ────────────────────────────────────────────

function ClarityScreen({ transcript, onBack, onComplete, TranscriptBlock, Timer }: SimpleScreenProps) {
  const [pronounScore, setPronounScore] = useState<number>(0);     // Q1: 1-5
  const [pronounHighlights, setPronounHighlights] = useState<Record<number, HighlightRange[]>>({});
  const [hasWeakArg, setHasWeakArg] = useState<boolean | null>(null); // Q2: 是/否
  const [weakArgHighlights, setWeakArgHighlights] = useState<Record<number, HighlightRange[]>>({});
  const [fillerScore, setFillerScore] = useState<number | null>(null); // Q3: 0-5

  const toggleHighlight = (
    lineIdx: number,
    range: HighlightRange,
    setter: React.Dispatch<React.SetStateAction<Record<number, HighlightRange[]>>>
  ) => {
    setter(prev => {
      const existing = prev[lineIdx] ?? [];
      const overlaps = existing.filter(h => !(h.end <= range.start || h.start >= range.end));
      if (overlaps.length > 0) {
        return { ...prev, [lineIdx]: existing.filter(h => !overlaps.includes(h)) };
      }
      return { ...prev, [lineIdx]: [...existing, range] };
    });
  };

  const canSubmit = pronounScore > 0 && hasWeakArg !== null && fillerScore !== null;

  const handleComplete = () => {
    if (!canSubmit) return;
    onComplete({ type: 'clarity', pronounScore, pronounHighlights, hasWeakArg, weakArgHighlights, fillerScore });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-amber-50 overflow-y-auto z-10">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* 頂部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={cn('text-sm font-medium', warm.sub, 'hover:text-stone-700')}>← 返回</button>
            <div className="w-px h-4 bg-amber-200" />
            <div>
              <h2 className={cn('text-lg font-black', warm.heading)}>語意明確性</h2>
              <p className={cn('text-sm', warm.sub)}>檢視你的發言是否容易被誤解</p>
            </div>
          </div>
          <Timer />
        </div>

        {/* 說明卡 */}
        <div className={cn('rounded-2xl border p-4 mb-6', warm.accentBg, warm.accentBorder)}>
          <p className={cn('text-sm font-bold mb-1', warm.accent)}>📌 語意不明的常見成因</p>
          <p className="text-sm text-stone-600 leading-relaxed">
            代名詞指涉不清、低說服力的語句、過多口語填充詞，都會讓發言變得模糊，讓聽者難以掌握你的真正意思。
          </p>
        </div>

        <TranscriptBlock />

        {/* Q1：代名詞指涉 */}
        <Section label="發言中是否有指涉不明的代名詞？" icon={<AlertCircle size={14} />}>
          <div className="flex gap-2 mb-4">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setPronounScore(n)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-bold transition-all',
                  pronounScore === n ? warm.selected : warm.unselected
                )}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-stone-400 mb-4 px-1">
            <span>很少</span><span>很多</span>
          </div>
          {transcript.length > 0 && (
            <div className={cn('rounded-xl border p-3', warm.transcript)}>
              <p className={cn('text-xs mb-2 flex items-center gap-1', warm.label)}>
                <Highlighter size={12} /> 反白你認為會讓人誤解的代指詞（他、那個、這件事...）
              </p>
              <div className="space-y-2">
                {transcript.map((line, i) => (
                  <HighlightableText key={i} text={line}
                    highlights={pronounHighlights[i] ?? []}
                    color="blue"
                    onToggle={range => toggleHighlight(i, range, setPronounHighlights)}
                  />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Q2：低說服力語句 */}
        <Section label="發言中是否有不太相關或低說服力的語句？" icon={<Target size={14} />}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[{ v: false, l: '否' }, { v: true, l: '是' }].map(opt => (
              <button key={String(opt.v)} onClick={() => setHasWeakArg(opt.v)}
                className={cn(
                  'py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2',
                  hasWeakArg === opt.v ? warm.selected : warm.unselected
                )}>
                {hasWeakArg === opt.v ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {opt.l}
              </button>
            ))}
          </div>
          {hasWeakArg && transcript.length > 0 && (
            <div className={cn('rounded-xl border p-3', warm.transcript)}>
              <p className={cn('text-xs mb-2 flex items-center gap-1', warm.label)}>
                <Highlighter size={12} /> 反白你認為說服力較低的語句
              </p>
              <div className="space-y-2">
                {transcript.map((line, i) => (
                  <HighlightableText key={i} text={line}
                    highlights={weakArgHighlights[i] ?? []}
                    color="red"
                    onToggle={range => toggleHighlight(i, range, setWeakArgHighlights)}
                  />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Q3：口語填充詞 */}
        <Section label="是否塞入過多口語詞（嗯、ㄟ、哦）？" icon={<Volume2 size={14} />}>
          <div className="flex gap-2 mb-2">
            {[0,1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setFillerScore(n)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-bold transition-all',
                  fillerScore === n ? warm.selected : warm.unselected
                )}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-stone-400 px-1">
            <span>無</span><span>很多</span>
          </div>
          <p className={cn('text-xs mt-2', warm.sub)}>口語填充詞會讓語句被拆得過於分散，降低發言的流暢度。</p>
        </Section>

        <button onClick={handleComplete} disabled={!canSubmit}
          className={cn('w-full py-4 rounded-2xl font-black text-base transition-all mt-2',
            canSubmit ? cn(warm.btn, 'shadow-lg') : 'bg-amber-100 text-amber-300 cursor-not-allowed'
          )}>
          {canSubmit ? '完成檢核 →' : '請完成上方所有必填題目'}
        </button>
      </div>
    </motion.div>
  );
}

// ── MenuCard ─────────────────────────────────────────────────

function MenuCard({ icon, title, desc, onClick }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-6 rounded-2xl border transition-all group text-left',
        warm.card, warm.cardBorder,
        'hover:border-orange-300 hover:shadow-md hover:shadow-orange-100'
      )}
    >
      <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <h3 className={cn('text-base font-bold mb-1', warm.heading)}>{title}</h3>
      <p className={cn('text-xs leading-relaxed', warm.sub)}>{desc}</p>
      <div className={cn('mt-4 flex items-center font-bold text-sm', warm.accent)}>
        開始檢核 <ChevronRight size={14} />
      </div>
    </button>
  );
}