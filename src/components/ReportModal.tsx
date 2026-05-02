import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronDown, ChevronUp, Star, TrendingUp, AlertCircle, CheckCircle, Lightbulb, MessageSquare, Brain, Users, Layers, FileText, Calendar, Hash } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { cn } from '../types';

// ─── 型別 ─────────────────────────────────────────────────
interface Scores {
  logic_score: number | null;
  clarity_score: number | null;
  accessibility_score: number | null;
  coherence_score: number | null;
}

interface TurnResult {
  turn: number;
  raw: string;
  repaired: string;
  golden: string;
  verdicts: { a: any; b: any };
}

interface ReportSummary {
  scores: Scores;
  strengths: string[];
  weaknesses: string[];
  top_fixes: string[];
  total_turns: number;
  total_chars: number;
  script_name?: string;
}

interface Report {
  summary: ReportSummary;
  turns: TurnResult[];
}

export interface StoredReport {
  id: number;
  created_at: string;
  report_data: any;
}

interface ReportPageProps {
  reports: StoredReport[];
  latestReport?: Report | null;
  onBack: () => void;
}

// ─── 常數 ─────────────────────────────────────────────────
const SCORE_MAX = 7;

// ─── 工具：1-7 分制顏色與標籤 ─────────────────────────────
const scoreColor = (s: number | null) => {
  if (s === null) return 'text-slate-400';
  if (s >= 6)   return 'text-emerald-600';
  if (s >= 4.5) return 'text-indigo-600';
  if (s >= 3)   return 'text-amber-600';
  return 'text-red-500';
};
const scoreBg = (s: number | null) => {
  if (s === null) return 'bg-slate-200';
  if (s >= 6)   return 'bg-emerald-500';
  if (s >= 4.5) return 'bg-indigo-500';
  if (s >= 3)   return 'bg-amber-500';
  return 'bg-red-500';
};
const scoreRing = (s: number | null) => {
  if (s === null) return 'stroke-slate-300';
  if (s >= 6)   return 'stroke-emerald-500';
  if (s >= 4.5) return 'stroke-indigo-500';
  if (s >= 3)   return 'stroke-amber-500';
  return 'stroke-red-500';
};
const scoreLabel = (s: number | null) => {
  if (s === null) return '未評';
  if (s >= 6)   return '優秀';
  if (s >= 4.5) return '良好';
  if (s >= 3)   return '尚可';
  return '待改進';
};

// ─── 圓環 ─────────────────────────────────────────────────
const ScoreRing = ({ score, label, iconName: Icon, size = 'md' }: {
  score: number | null; label: string; iconName: React.ElementType; size?: 'sm' | 'md' | 'lg';
}) => {
  const r = size === 'lg' ? 44 : size === 'md' ? 32 : 22;
  const circ = 2 * Math.PI * r;
  const pct = score !== null ? (score / SCORE_MAX) * 100 : 0;
  const dash = (pct / 100) * circ;
  const sz = size === 'lg' ? 108 : size === 'md' ? 78 : 56;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: sz, height: sz }}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="-rotate-90">
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size === 'lg' ? 8 : 6} />
          <motion.circle cx={sz/2} cy={sz/2} r={r} fill="none"
            strokeWidth={size === 'lg' ? 8 : 6} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ-dash}`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ-dash}` }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            className={scoreRing(score)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={size === 'lg' ? 14 : 10} className={cn('mb-0.5', scoreColor(score))} />
          <span className={cn('font-black leading-none', scoreColor(score),
            size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs')}>
            {score !== null ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className={cn('font-medium', size === 'lg' ? 'text-sm text-slate-700' : 'text-xs text-slate-500')}>{label}</div>
        <div className={cn('text-[10px] font-bold', scoreColor(score))}>{scoreLabel(score)}</div>
      </div>
    </div>
  );
};

// ─── 單份報告詳情（全螢幕）───────────────────────────────
const ReportDetail = ({ report, scriptName, onBack }: {
  report: Report; scriptName: string; onBack: () => void;
}) => {
  const [tab, setTab] = useState<'overview' | 'turns'>('overview');
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);
  const { summary, turns } = report;
  const { scores, strengths, weaknesses, top_fixes, total_turns, total_chars } = summary ?? {};

  const scoreValues = scores
    ? [scores.logic_score, scores.clarity_score, scores.accessibility_score, scores.coherence_score]
        .filter((v): v is number => v !== null && v !== undefined)
    : [];
  const overallScore: number | null = scoreValues.length > 0
    ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : null;

  const radarData = [
    { subject: '邏輯精確', value: scores?.logic_score ?? 0, fullMark: SCORE_MAX },
    { subject: '易讀性',   value: scores?.clarity_score ?? 0, fullMark: SCORE_MAX },
    { subject: '友善度',   value: scores?.accessibility_score ?? 0, fullMark: SCORE_MAX },
    { subject: '連貫性',   value: scores?.coherence_score ?? 0, fullMark: SCORE_MAX },
  ];

  const dims: Array<{ scoreKey: keyof Scores; label: string; iconName: React.ElementType; desc: string }> = [
    { scoreKey: 'logic_score',         label: '邏輯精確度', iconName: Brain,      desc: '陳述清晰，無歧義廢話' },
    { scoreKey: 'clarity_score',       label: '易讀性',     iconName: Layers,     desc: '認知負擔低，句式清晰' },
    { scoreKey: 'accessibility_score', label: '友善度',     iconName: Users,      desc: '無行話，背景鋪陳完整' },
    { scoreKey: 'coherence_score',     label: '連貫性',     iconName: TrendingUp, desc: '論點有序，不跑題' },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">

      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-8 pt-8 pb-6 border-b border-slate-200">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-purple-300/20 rounded-full blur-2xl" />
        </div>
        <button onClick={onBack} className="relative flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-5 text-sm font-medium">
          <ArrowLeft size={16} /> 返回報告列表
        </button>
        <div className="relative flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 bg-white/80 border border-indigo-200 px-2.5 py-1 rounded-full shadow-sm">AI 表達分析報告</span>
              <span className="text-xs text-slate-500">《{scriptName}》</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">發言能力評估</h1>
            <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1"><Hash size={11} />{total_turns ?? 0} 輪發言</span>
              <span className="flex items-center gap-1"><MessageSquare size={11} />{total_chars ?? 0} 字</span>
            </p>
          </div>
          <div className="shrink-0">
            <ScoreRing score={overallScore} label="綜合評分" iconName={Star} size="lg" />
          </div>
        </div>
        <div className="relative flex gap-8 mt-7">
          {dims.map(({ scoreKey, label, iconName }) => (
            <div key={scoreKey}>
              <ScoreRing score={scores?.[scoreKey] ?? null} label={label} iconName={iconName} size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-8 bg-white sticky top-0 z-10">
        {(['overview', 'turns'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>
            {t === 'overview' ? '📊 總覽' : `🗣️ 逐輪分析（${turns?.length ?? 0}）`}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 px-8 py-6 max-w-4xl w-full mx-auto space-y-5">
        {tab === 'overview' && (
          <>
            {/* 雷達圖 + 維度條 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-8 items-center">
              <div className="shrink-0">
                <ResponsiveContainer width={200} height={190}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, SCORE_MAX]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3.5">
                {dims.map(({ scoreKey, label, iconName: Icon, desc }) => {
                  const s = scores?.[scoreKey] ?? null;
                  return (
                    <div key={scoreKey}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon size={12} className="text-slate-500" />
                          <span className="text-sm text-slate-700 font-medium">{label}</span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">{desc}</span>
                        </div>
                        <span className={cn('text-sm font-black', scoreColor(s))}>
                          {s !== null ? s.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-400">/ {SCORE_MAX}</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className={cn('h-full rounded-full', scoreBg(s))}
                          initial={{ width: 0 }}
                          animate={{ width: `${s !== null ? (s / SCORE_MAX) * 100 : 0}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {strengths && strengths.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-emerald-700 font-bold mb-4"><CheckCircle size={16} /> 你做得好的地方</h3>
                <ul className="space-y-2.5">
                  {strengths.map((s, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                      <span className="text-emerald-600 shrink-0 font-bold mt-0.5">✓</span>{s}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {weaknesses && weaknesses.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-amber-700 font-bold mb-4"><AlertCircle size={16} /> 最需要改進的地方</h3>
                <ul className="space-y-2.5">
                  {weaknesses.map((w, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                      <span className="text-amber-600 shrink-0 font-bold mt-0.5">!</span>{w}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {top_fixes && top_fixes.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-indigo-700 font-bold mb-4"><Lightbulb size={16} /> 具體改進建議</h3>
                {top_fixes.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl p-4 text-sm text-slate-700 leading-relaxed mt-3 first:mt-0 border border-indigo-100">
                    {f}
                  </motion.div>
                ))}
              </div>
            )}

            {scoreValues.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-slate-500 text-sm">本份報告的評分資料不完整，可能是分析過程中 API 發生錯誤。</p>
              </div>
            )}
          </>
        )}

        {tab === 'turns' && (
          <div className="space-y-3">
            {(!turns || turns.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-12">無逐輪分析資料</p>
            )}
            {turns?.map((turn, i) => {
              const jA = turn.verdicts?.a || {};
              const jB = turn.verdicts?.b || {};
              const sc: Record<string, number | null> = {};
              ['logic_score','clarity_score','accessibility_score','coherence_score'].forEach(k => {
                const sA = (jA.scores ?? jA.final_scores ?? {})[k];
                const sB = (jB.scores ?? jB.final_scores ?? {})[k];
                sc[k] = (sA != null && sB != null) ? (sA + sB) / 2 : (sA ?? sB ?? null);
              });
              const avg = Object.values(sc).filter((v): v is number => v !== null);
              const turnScore = avg.length > 0 ? avg.reduce((a, b) => a + b, 0) / avg.length : null;

              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setExpandedTurn(expandedTurn === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0',
                      turnScore !== null && turnScore >= 5.5 ? 'bg-emerald-100 text-emerald-700' :
                      turnScore !== null && turnScore >= 4   ? 'bg-indigo-100 text-indigo-700' :
                      'bg-amber-100 text-amber-700')}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        {turn.raw?.slice(0, 70)}{(turn.raw?.length ?? 0) > 70 ? '...' : ''}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {['logic_score','clarity_score','accessibility_score','coherence_score'].map(k => (
                          <span key={k} className={cn('text-[10px] font-bold', scoreColor(sc[k]))}>
                            {sc[k]?.toFixed(1) ?? '—'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-xl font-black', scoreColor(turnScore))}>{turnScore?.toFixed(1) ?? '—'}</span>
                      {expandedTurn === i ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedTurn === i && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-200 bg-slate-50">
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                              <div className="flex items-center gap-1.5 mb-2">
                                <MessageSquare size={11} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">你的發言</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{turn.repaired}</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Star size={11} className="text-indigo-600" />
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">黃金答案</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{turn.golden}</p>
                            </div>
                          </div>
                          {(jA.one_line || jB.one_line) && (
                            <div className="bg-white rounded-xl p-4 border border-slate-200">
                              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">AI 評語</p>
                              <p className="text-sm text-slate-700">{jA.one_line || jB.one_line}</p>
                            </div>
                          )}
                          {(jA.top_fix || jB.top_fix || jA.critical_fix || jB.critical_fix) && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Lightbulb size={11} className="text-indigo-600" />
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">改進建議</span>
                              </div>
                              <p className="text-sm text-slate-700">{jA.top_fix || jB.top_fix || jA.critical_fix || jB.critical_fix}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-8 py-4 border-t border-slate-200 bg-white">
        <p className="text-xs text-slate-400 text-center">由 Llama 3.3 + DeepSeek 驅動的多 Agent 分析</p>
      </div>
    </motion.div>
  );
};

// ─── 報告列表頁 ───────────────────────────────────────────
const ReportList = ({ reports, latestReport, onSelectStored, onSelectLatest }: {
  reports: StoredReport[];
  latestReport?: Report | null;
  onSelectStored: (r: StoredReport) => void;
  onSelectLatest: () => void;
}) => (
  <div className="space-y-3">
    {latestReport && (
      <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        onClick={onSelectLatest}
        className="w-full bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-left hover:border-indigo-400 hover:bg-indigo-100 transition-all group shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Star size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{latestReport.summary?.script_name || '最新報告'}</p>
              <p className="text-xs text-indigo-600 mt-0.5">剛剛完成</p>
            </div>
          </div>
          <ArrowLeft size={16} className="text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.button>
    )}

    {reports.length === 0 && !latestReport && (
      <div className="text-center py-16">
        <FileText size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">尚無評估報告</p>
        <p className="text-slate-400 text-xs mt-1">完成一場劇本殺遊戲後，AI 會自動生成發言分析報告</p>
      </div>
    )}

    {reports.map((r, i) => {
      const rd = r.report_data;
      const sc = rd?.scores ?? rd?.summary?.scores;
      const scriptName = rd?.script_name ?? rd?.summary?.script_name ?? '劇本殺';
      const vals = sc ? Object.values(sc).filter((v): v is number => v !== null && typeof v === 'number') : [];
      const avg = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;

      return (
        <motion.button key={r.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          onClick={() => onSelectStored(r)}
          className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-slate-400 hover:bg-slate-50 transition-all group shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText size={18} className="text-slate-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{scriptName}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} />{new Date(r.created_at).toLocaleString('zh-TW')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {avg !== null && <span className={cn('text-lg font-black', scoreColor(avg))}>{(avg as number).toFixed(1)}</span>}
              <ArrowLeft size={16} className="text-slate-300 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>
);

// ─── 主頁面（全螢幕，含列表 + 詳情）────────────────────
export const ReportPage: React.FC<ReportPageProps> = ({ reports, latestReport, onBack }) => {
  const [selectedStored, setSelectedStored] = useState<StoredReport | null>(null);
  const [showLatest, setShowLatest] = useState(false);

  if (showLatest && latestReport) {
    return <ReportDetail report={latestReport}
      scriptName={latestReport.summary?.script_name || '劇本殺'}
      onBack={() => setShowLatest(false)} />;
  }

  if (selectedStored) {
    const rd = selectedStored.report_data;
    const normalised: Report = rd.turns
      ? { summary: rd.summary ?? rd, turns: rd.turns }
      : { summary: rd, turns: [] };
    return <ReportDetail report={normalised}
      scriptName={rd.script_name ?? rd.summary?.script_name ?? '劇本殺'}
      onBack={() => setSelectedStored(null)} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="px-8 pt-8 pb-6 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">表達能力評估報告</h1>
          <p className="text-xs text-slate-500 mt-0.5">共 {reports.length + (latestReport ? 1 : 0)} 份報告</p>
        </div>
      </div>
      <div className="px-8 py-6 max-w-2xl mx-auto">
        <ReportList reports={reports} latestReport={latestReport}
          onSelectStored={setSelectedStored} onSelectLatest={() => setShowLatest(true)} />
      </div>
    </motion.div>
  );
};

// 向下相容舊的 ReportModal 名稱
export const ReportModal = ReportPage;