import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, BookOpen, FileText, ClipboardList, ChevronDown, ChevronUp, X, Search, Activity, MessageSquare, Clock, TrendingUp, Shield, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

// ─── 型別 ──────────────────────────────────────────────────
interface DialogueLine { speaker: string; text: string; }
interface ScriptRecord { id: number; script_name: string; dialogue: DialogueLine[]; created_at: string; }
interface SurveyData { [key: number]: number; }
interface Survey { id: number; data: SurveyData; created_at: string; }
interface ReportData { scriptName: string; totalLines: number; totalChars: number; avgCPM: number; scores: Record<string, number>; summary: string; }
interface AssessmentReport { id: number; report_data: ReportData; created_at: string; }
interface UserData {
  id: number; email: string; last_played: string;
  surveys: Survey[]; scripts: ScriptRecord[]; reports: AssessmentReport[];
}

// ─── PRCA 分數計算 ─────────────────────────────────────────
function calcPRCA(data: SurveyData) {
  const g = (id: number) => data[id] || 0;
  const group = 18 - g(1) + g(2) - g(3) + g(4) - g(5) + g(6);
  const meeting = 18 - g(7) + g(8) + g(9) - g(10) - g(11) + g(12);
  const dyadic = 18 + g(13) + g(14) + g(15) + g(16) + g(17) + g(18);
  const pub = 18 + g(19) - g(20) + g(21) - g(22) + g(23) - g(24);
  return { group, meeting, dyadic, pub, total: group + meeting + dyadic + pub };
}

// ─── 主元件 ────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [tab, setTab] = useState<'overview' | 'scripts' | 'surveys' | 'reports'>('overview');
  const [expandedScript, setExpandedScript] = useState<number | null>(null);

  const login = () => {
    if (keyInput === 'admin-secret-2024') {
      setAuthed(true);
      setKeyError(false);
    } else {
      setKeyError(true);
    }
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch('/api/admin/users', { headers: { 'x-admin-key': 'admin-secret-2024' } })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authed]);

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  // ── 登入畫面 ───────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">管理後台</h1>
            <p className="text-slate-500 text-sm mt-1">輸入管理員金鑰以繼續</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => { setKeyInput(e.target.value); setKeyError(false); }}
                onKeyDown={e => e.key === 'Enter' && login()}
                placeholder="Admin Key"
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none font-mono text-sm pr-12 transition-colors ${keyError ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'}`}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {keyError && <p className="text-red-400 text-xs">金鑰錯誤，請再試一次</p>}
            <button
              onClick={login}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
            >
              進入後台
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 使用者詳情側邊欄 ──────────────────────────────────
  const UserDetail = ({ u }: { u: UserData }) => {
    const chartData = [...u.surveys].reverse().map(s => ({
      date: new Date(s.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      total: calcPRCA(s.data).total
    }));

    const latestSurvey = u.surveys[0];
    const latestScores = latestSurvey ? calcPRCA(latestSurvey.data) : null;
    const radarData = latestScores ? [
      { subject: '小組討論', value: latestScores.group, fullMark: 30 },
      { subject: '會議', value: latestScores.meeting, fullMark: 30 },
      { subject: '人際對話', value: latestScores.dyadic, fullMark: 30 },
      { subject: '公開演講', value: latestScores.pub, fullMark: 30 },
    ] : [];

    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="font-bold text-white text-lg">{u.email}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              最後遊玩：{new Date(u.last_played).toLocaleString('zh-TW')}
            </div>
          </div>
          <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-4 pt-2">
          {([['overview', '總覽'], ['scripts', '對話紀錄'], ['surveys', '問卷'], ['reports', '評估報告']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 總覽 */}
          {tab === 'overview' && (
            <>
              {/* 統計卡片 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '劇本場次', value: u.scripts.length, iconName: BookOpen, color: 'indigo' },
                  { label: '問卷填寫', value: u.surveys.length, iconName: ClipboardList, color: 'emerald' },
                  { label: '評估報告', value: u.reports.length, iconName: FileText, color: 'amber' },
                ].map(({ label, value, iconName: Icon, color }) => (
                  <div key={label} className={`bg-${color}-950/40 border border-${color}-900/50 rounded-xl p-4 text-center`}>
                    <Icon size={20} className={`text-${color}-400 mx-auto mb-2`} />
                    <div className={`text-2xl font-black text-${color}-400`}>{value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* PRCA 趨勢圖 */}
              {chartData.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" /> PRCA 總分趨勢
                  </h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                      <YAxis domain={[24, 120]} stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} />
                      <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 最新 PRCA 雷達圖 */}
              {radarData.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" /> 最新問卷分佈
                    <span className="text-xs text-slate-500 font-normal">（{new Date(latestSurvey!.created_at).toLocaleDateString('zh-TW')}）</span>
                  </h4>
                  <div className="flex gap-6 items-center">
                    <ResponsiveContainer width={180} height={160}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {[
                        { label: '小組討論', value: latestScores!.group },
                        { label: '會議', value: latestScores!.meeting },
                        { label: '人際對話', value: latestScores!.dyadic },
                        { label: '公開演講', value: latestScores!.pub },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(value / 30) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-300 w-6 text-right">{value}</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-700 flex justify-between">
                        <span className="text-xs text-slate-400">總分</span>
                        <span className="text-sm font-black text-indigo-400">{latestScores!.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 對話紀錄 */}
          {tab === 'scripts' && (
            <div className="space-y-3">
              {u.scripts.length === 0 ? (
                <p className="text-sm text-slate-500 italic">尚無對話紀錄</p>
              ) : u.scripts.map(r => (
                <div key={r.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedScript(expandedScript === r.id ? null : r.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors text-left"
                  >
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{r.script_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <Clock size={10} />
                        {new Date(r.created_at).toLocaleString('zh-TW')}
                        <MessageSquare size={10} />
                        {r.dialogue.length} 則對話
                      </div>
                    </div>
                    {expandedScript === r.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {expandedScript === r.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-700/50">
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                          {r.dialogue.map((d, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="text-indigo-400 font-medium shrink-0">{d.speaker}</span>
                              <span className="text-slate-300">：{d.text}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* 問卷 */}
          {tab === 'surveys' && (
            <div className="space-y-3">
              {u.surveys.length === 0 ? (
                <p className="text-sm text-slate-500 italic">尚無問卷紀錄</p>
              ) : u.surveys.map(s => {
                const sc = calcPRCA(s.data);
                return (
                  <div key={s.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString('zh-TW')}</div>
                      <div className="text-lg font-black text-indigo-400">{sc.total} 分</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[['小組', sc.group], ['會議', sc.meeting], ['人際', sc.dyadic], ['演講', sc.pub]].map(([label, val]) => (
                        <div key={label as string} className="text-center bg-slate-900/50 rounded-lg p-2">
                          <div className="text-xs text-slate-500">{label}</div>
                          <div className="text-sm font-bold text-slate-200">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 評估報告 */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {u.reports.length === 0 ? (
                <p className="text-sm text-slate-500 italic">尚無評估報告</p>
              ) : u.reports.map(r => (
                <div key={r.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-200 text-sm">{r.report_data.scriptName}</div>
                    <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString('zh-TW')}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['發言次數', r.report_data.totalLines, '次'],
                      ['累計字數', r.report_data.totalChars, '字'],
                      ['語速', r.report_data.avgCPM, 'CPM'],
                    ].map(([label, val, unit]) => (
                      <div key={label as string} className="bg-slate-900/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="text-sm font-bold text-slate-200">{val}<span className="text-xs text-slate-500 ml-0.5">{unit}</span></div>
                      </div>
                    ))}
                  </div>
                  {Object.entries(r.report_data.scores || {}).length > 0 && (
                    <div className="space-y-1.5">
                      {Object.entries(r.report_data.scores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-16 shrink-0">{key}</span>
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, val as number)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-300 w-8 text-right">{val}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg">{r.report_data.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ── 主畫面 ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tight">管理後台</h1>
          <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Users size={14} />
          {users.length} 位使用者
        </div>
      </div>

      <div className="p-8">
        {/* 搜尋 */}
        <div className="relative mb-6 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋使用者 Email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-indigo-600 transition-colors placeholder-slate-600"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => {
              const latestSurvey = u.surveys[0];
              const score = latestSurvey ? calcPRCA(latestSurvey.data).total : null;
              return (
                <motion.button
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setSelectedUser(u); setTab('overview'); setExpandedScript(null); }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left hover:border-indigo-700 hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-black text-lg">
                      {u.email[0].toUpperCase()}
                    </div>
                    {score !== null && (
                      <div className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded-full font-bold">
                        {score} 分
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-slate-200 text-sm truncate group-hover:text-white transition-colors">{u.email}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {new Date(u.last_played).toLocaleString('zh-TW')}
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                    {[
                      { iconName: BookOpen, count: u.scripts.length, label: '劇本' },
                      { iconName: ClipboardList, count: u.surveys.length, label: '問卷' },
                      { iconName: FileText, count: u.reports.length, label: '報告' },
                    ].map(({ iconName: Icon, count, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Icon size={11} />
                        <span>{count} {label}</span>
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-slate-600">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p>找不到符合的使用者</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && <UserDetail u={selectedUser} />}
      </AnimatePresence>
    </div>
  );
}
