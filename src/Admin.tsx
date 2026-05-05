import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, BookOpen, FileText, ClipboardList, ChevronDown, ChevronUp, X, Search, Activity, MessageSquare, Clock, TrendingUp, Shield, Eye, EyeOff, LayoutDashboard, ArrowLeft, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

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

// ─── 工具函數 ──────────────────────────────────────────────
function calcPRCA(data: SurveyData) {
  const g = (id: number) => data[id] || 0;
  const group = 18 - g(1) + g(2) - g(3) + g(4) - g(5) + g(6);
  const meeting = 18 - g(7) + g(8) + g(9) - g(10) - g(11) + g(12);
  const dyadic = 18 + g(13) + g(14) + g(15) + g(16) + g(17) + g(18);
  const pub = 18 + g(19) - g(20) + g(21) - g(22) + g(23) - g(24);
  return { group, meeting, dyadic, pub, total: group + meeting + dyadic + pub };
}

const getScoreColor = (score: number) => {
  if (score >= 24) return 'text-emerald-400';
  if (score >= 18) return 'text-indigo-400';
  if (score >= 12) return 'text-amber-400';
  return 'text-red-400';
};

const getScoreBg = (score: number) => {
  if (score >= 24) return 'bg-emerald-500';
  if (score >= 18) return 'bg-indigo-500';
  if (score >= 12) return 'bg-amber-500';
  return 'bg-red-500';
};

// 共用的空狀態元件
const EmptyState = ({ icon: Icon, message }: { icon: any, message: string }) => (
  <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center w-full mt-4">
    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon size={24} className="text-slate-500" />
    </div>
    <p className="text-slate-400 font-medium">{message}</p>
  </div>
);

// ─── 主元件 ────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // 🌟 改存 ID，這樣刪除資料時不用手動同步兩個 state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const [tab, setTab] = useState<'overview' | 'scripts' | 'surveys' | 'reports'>('overview');
  const [expandedScript, setExpandedScript] = useState<number | null>(null);

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId) || null, [users, selectedUserId]);

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
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      });
  }, [authed]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  // 🌟 刪除紀錄的通用處理函式
  const handleDeleteRecord = async (type: 'script' | 'survey' | 'report', recordId: number, userId: number) => {
    if (!window.confirm(`確定要永久刪除這筆${type === 'script' ? '劇本' : type === 'survey' ? '問卷' : '報告'}紀錄嗎？\n此動作無法復原！`)) {
      return;
    }

    try {
      // 呼叫後端 API (如果有後端的話)
      await fetch(`/api/admin/records/${type}/${recordId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'admin-secret-2024' }
      });
    } catch (err) {
      console.warn("API 刪除失敗，僅在本地移除 (測試模式):", err);
    }

    // 更新本地狀態，UI 會即時反映
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        scripts: type === 'script' ? u.scripts.filter(r => r.id !== recordId) : u.scripts,
        surveys: type === 'survey' ? u.surveys.filter(r => r.id !== recordId) : u.surveys,
        reports: type === 'report' ? u.reports.filter(r => r.id !== recordId) : u.reports,
      };
    }));
  };

  // ── 登入畫面 ───────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
              <Shield size={40} className="text-white drop-shadow-md" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">管理員登入</h1>
            <p className="text-slate-400 text-sm">請輸入授權金鑰以存取系統後台</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={e => { setKeyInput(e.target.value); setKeyError(false); }}
                    onKeyDown={e => e.key === 'Enter' && login()}
                    placeholder="Enter secret key..."
                    className={`w-full bg-slate-950/50 border rounded-xl px-5 py-4 text-white placeholder-slate-600 outline-none font-mono text-sm pr-12 transition-all ${
                      keyError ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-800 focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                    }`}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {keyError && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs mt-2 font-medium">驗證失敗，請檢查金鑰是否正確</motion.p>}
              </div>
              <button onClick={login} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] mt-2">
                登入系統
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 🌟 全頁面：使用者詳情 ───────────────────────────────
  if (selectedUser) {
    const chartData = [...selectedUser.surveys].reverse().map(s => ({
      date: new Date(s.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      total: calcPRCA(s.data).total
    }));

    const latestSurvey = selectedUser.surveys[0];
    const latestScores = latestSurvey ? calcPRCA(latestSurvey.data) : null;
    const radarData = latestScores ? [
      { subject: '小組', value: latestScores.group, fullMark: 30 },
      { subject: '會議', value: latestScores.meeting, fullMark: 30 },
      { subject: '人際', value: latestScores.dyadic, fullMark: 30 },
      { subject: '公開', value: latestScores.pub, fullMark: 30 },
    ] : [];

    const TABS = [
      { id: 'overview', label: '總覽', icon: LayoutDashboard, count: undefined },
      { id: 'surveys', label: '問卷紀錄', icon: ClipboardList, count: selectedUser.surveys.length },
      { id: 'scripts', label: '劇本紀錄', icon: BookOpen, count: selectedUser.scripts.length },
      { id: 'reports', label: '分析報告', icon: FileText, count: selectedUser.reports.length },
    ] as const;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-950 flex flex-col selection:bg-indigo-500/30">
        
        {/* Header - 返回與基本資訊 */}
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setSelectedUserId(null); setTab('overview'); }}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xl shadow-inner">
                {selectedUser.email[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-white text-xl tracking-tight leading-none">{selectedUser.email}</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <Clock size={14} /> 最後活動：{new Date(selectedUser.last_played).toLocaleString('zh-TW')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 內容區塊與功能列 */}
        <div className="flex-1 max-w-6xl w-full mx-auto p-8">
          
          {/* Navigation Tabs */}
          <div className="flex gap-3 mb-8">
            {TABS.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-base font-bold transition-all ${
                  tab === id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-100'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {count !== undefined && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full ml-1 ${tab === id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 🌟 拔除 AnimatePresence，改用單純的 motion.div 淡入，徹底解決上下跳動問題 */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* ─── 總覽 ─── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: '參與劇本', value: selectedUser.scripts.length, icon: BookOpen, color: 'indigo' },
                    { label: '填寫問卷', value: selectedUser.surveys.length, icon: ClipboardList, color: 'emerald' },
                    { label: '分析報告', value: selectedUser.reports.length, icon: FileText, color: 'amber' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={`bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-${color}-500/30 transition-colors`}>
                      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/5 rounded-full blur-2xl group-hover:bg-${color}-500/10 transition-colors`} />
                      <Icon size={28} className={`text-${color}-400 mb-4 relative z-10`} />
                      <div className="text-4xl font-black text-white relative z-10 mb-1">{value}</div>
                      <div className="text-slate-400 relative z-10 font-medium">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {chartData.length > 0 && (
                    <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800/80">
                      <h4 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-400" /> PRCA 總分變化趨勢
                      </h4>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis domain={[24, 120]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }} itemStyle={{ color: '#818cf8', fontWeight: 'bold' }} labelStyle={{ color: '#94a3b8', marginBottom: '4px' }} />
                            <Line type="monotone" dataKey="total" name="總分" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#6366f1' }} activeDot={{ r: 6, fill: '#6366f1' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {radarData.length > 0 && latestScores && (
                    <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <Activity size={20} className="text-emerald-400" /> 最新問卷能力雷達
                        </h4>
                        <span className="text-xs px-3 py-1 bg-slate-800 rounded-full text-slate-400 border border-slate-700">
                          {new Date(latestSurvey!.created_at).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex flex-col xl:flex-row gap-8 items-center">
                        <div className="w-[200px] h-[200px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="#334155" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                              <PolarRadiusAxis domain={[0, 30]} tick={false} axisLine={false} />
                              <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 w-full space-y-4">
                          {[
                            { label: '小組討論', value: latestScores.group },
                            { label: '參與會議', value: latestScores.meeting },
                            { label: '人際對話', value: latestScores.dyadic },
                            { label: '公開演講', value: latestScores.pub },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-slate-400">{label}</span>
                                <span className={`text-sm font-bold ${getScoreColor(value)}`}>{value} <span className="text-xs font-normal text-slate-600">/ 30</span></span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getScoreBg(value)}`} style={{ width: `${(value / 30) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                          <div className="pt-4 mt-2 border-t border-slate-800 flex justify-between items-end">
                            <span className="text-sm text-slate-500 font-bold">總分 (PRCA-24)</span>
                            <div className="text-right">
                              <span className={`text-3xl font-black ${getScoreColor(latestScores.total / 4)}`}>{latestScores.total}</span>
                              <span className="text-sm text-slate-600 ml-1">/ 120</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── 問卷紀錄 ─── */}
            {tab === 'surveys' && (
              <div className="grid grid-cols-2 gap-4">
                {selectedUser.surveys.length === 0 ? <EmptyState icon={ClipboardList} message="尚無問卷填寫紀錄" /> : selectedUser.surveys.map((s) => {
                  const sc = calcPRCA(s.data);
                  return (
                    <div key={s.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative group hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                            <ClipboardList size={20} className="text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white">表達焦慮量表 (PRCA-24)</div>
                            <div className="text-xs text-slate-500 mt-0.5">{new Date(s.created_at).toLocaleString('zh-TW')}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-2xl font-black ${getScoreColor(sc.total / 4)}`}>{sc.total}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Total Score</div>
                          </div>
                          {/* 🌟 刪除按鈕 */}
                          <button onClick={() => handleDeleteRecord('survey', s.id, selectedUser.id)} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[{ l: '小組', v: sc.group }, { l: '會議', v: sc.meeting }, { l: '人際', v: sc.dyadic }, { l: '演講', v: sc.pub }].map(({ l, v }) => (
                          <div key={l} className="bg-slate-900/80 rounded-xl p-3 text-center border border-slate-800/50">
                            <div className="text-xs text-slate-400 mb-1">{l}</div>
                            <div className={`text-lg font-bold ${getScoreColor(v)}`}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── 劇本紀錄 ─── */}
            {tab === 'scripts' && (
              <div className="space-y-4">
                {selectedUser.scripts.length === 0 ? <EmptyState icon={BookOpen} message="尚無劇本遊玩紀錄" /> : selectedUser.scripts.map((r) => (
                  <div key={r.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden group">
                    <div className="flex items-center">
                      <button onClick={() => setExpandedScript(expandedScript === r.id ? null : r.id)} className="flex-1 p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-900/20 flex items-center justify-center border border-indigo-500/20">
                            <BookOpen size={20} className="text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{r.script_name}</div>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(r.created_at).toLocaleString('zh-TW')}</span>
                              <span className="flex items-center gap-1.5 text-indigo-400/80"><MessageSquare size={14} /> {r.dialogue.length} 則對話</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                          {expandedScript === r.id ? <ChevronUp size={20} className="text-white" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                      </button>
                      
                      {/* 🌟 刪除按鈕獨立在右側 */}
                      <div className="pr-6 pl-2">
                        <button onClick={() => handleDeleteRecord('script', r.id, selectedUser.id)} className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedScript === r.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-800 bg-slate-950/50">
                          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {r.dialogue.map((d, i) => {
                              const isSystem = d.speaker === '系統';
                              return (
                                <div key={i} className={`flex flex-col ${isSystem ? 'items-center' : 'items-start'} mb-4 last:mb-0`}>
                                  {!isSystem && <span className="text-[11px] font-bold text-slate-500 mb-1 ml-1">{d.speaker}</span>}
                                  <div className={`px-5 py-3 rounded-2xl text-sm max-w-[85%] ${isSystem ? 'bg-slate-800/50 text-slate-400 text-xs border border-slate-700/50 rounded-xl' : 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-tl-sm'}`}>
                                    {d.text}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* ─── 評估報告 ─── */}
            {tab === 'reports' && (
              <div className="grid grid-cols-2 gap-6">
                {selectedUser.reports.length === 0 ? <EmptyState icon={FileText} message="尚無 AI 分析報告" /> : selectedUser.reports.map((r) => (
                  <div key={r.id} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 relative hover:border-slate-700 transition-colors group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-900/20 flex items-center justify-center border border-amber-500/20">
                          <FileText size={24} className="text-amber-400" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{r.report_data.scriptName || '劇本分析'}</div>
                          <div className="text-sm text-slate-500 mt-1">{new Date(r.created_at).toLocaleString('zh-TW')}</div>
                        </div>
                      </div>
                      
                      {/* 🌟 刪除按鈕 */}
                      <button onClick={() => handleDeleteRecord('report', r.id, selectedUser.id)} className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20">
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {[{ label: '發言次數', val: r.report_data.totalLines, unit: '次' }, { label: '累計字數', val: r.report_data.totalChars, unit: '字' }, { label: '平均語速', val: r.report_data.avgCPM, unit: 'CPM' }].map(({ label, val, unit }) => (
                        <div key={label} className="bg-slate-900/80 rounded-2xl p-4 text-center border border-slate-800/50">
                          <div className="text-xs text-slate-400 mb-1">{label}</div>
                          <div className="text-xl font-bold text-white">{val || 0} <span className="text-xs text-slate-500 font-normal">{unit}</span></div>
                        </div>
                      ))}
                    </div>

                    {Object.entries(r.report_data.scores || {}).length > 0 && (
                      <div className="space-y-4 mb-8">
                        {Object.entries(r.report_data.scores).map(([key, val]) => {
                          const displayScore = typeof val === 'number' ? (val <= 7 ? val : (val / 100) * 7) : 0;
                          const percentage = (displayScore / 7) * 100;
                          const keyMap: Record<string, string> = { logic_score: '邏輯精確', accessibility_score: '表達友善', coherence_score: '內容連貫' };
                          
                          return (
                            <div key={key} className="flex items-center gap-4">
                              <span className="text-sm text-slate-300 w-20 shrink-0 font-bold">{keyMap[key] || key}</span>
                              <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div className={`h-full rounded-full ${getScoreBg(displayScore * 4)}`} style={{ width: `${percentage}%` }} />
                              </div>
                              <span className={`text-sm font-bold w-10 text-right ${getScoreColor(displayScore * 4)}`}>{displayScore.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {r.report_data.summary && (
                      <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-2xl relative">
                        <div className="absolute top-0 left-5 -translate-y-1/2 bg-slate-900 px-3 text-xs font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20 rounded-full">AI 總結評語</div>
                        <p className="text-sm text-indigo-100/80 leading-relaxed pt-2">{r.report_data.summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ── 🌟 大廳畫面：使用者列表 ───────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* 頂部導航欄 */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">系統管理中心</h1>
            <div className="text-xs text-indigo-400 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 伺服器運作中
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-white">{users.length}</span>
            <span className="text-xs text-slate-500">位註冊玩家</span>
          </div>
          <button onClick={() => { setAuthed(false); setKeyInput(''); }} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors">
            登出
          </button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="輸入玩家 Email 進行搜尋..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium animate-pulse">載入玩家資料中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredUsers.map(u => {
              const latestSurvey = u.surveys[0];
              const score = latestSurvey ? calcPRCA(latestSurvey.data).total : null;
              
              return (
                <motion.button
                  key={u.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => { setSelectedUserId(u.id); setTab('overview'); setExpandedScript(null); }}
                  className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 text-left hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 font-black text-xl shadow-inner group-hover:from-indigo-900 group-hover:to-slate-900 group-hover:text-indigo-400 group-hover:border-indigo-700/50 transition-all">
                      {u.email[0].toUpperCase()}
                    </div>
                    {score !== null && (
                      <div className="flex flex-col items-end">
                        <span className={`text-xl font-black ${getScoreColor(score / 4)} leading-none mb-1`}>{score}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">PRCA 分數</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors mb-1" title={u.email}>{u.email}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock size={12} /> {new Date(u.last_played).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-800/80">
                    {[
                      { icon: BookOpen, count: u.scripts.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                      { icon: ClipboardList, count: u.surveys.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { icon: FileText, count: u.reports.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((item, idx) => (
                      <div key={idx} className={`flex flex-col items-center justify-center p-2 rounded-xl ${item.bg} border border-transparent group-hover:border-white/5 transition-colors`}>
                        <item.icon size={14} className={`${item.color} mb-1`} />
                        <span className="text-sm font-bold text-slate-300">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 bg-slate-900/20 border border-slate-800 border-dashed rounded-3xl">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-slate-600" />
                </div>
                <p className="text-lg font-bold text-white mb-2">找不到符合的玩家</p>
                <p className="text-slate-500 text-sm">請嘗試使用其他 Email 關鍵字進行搜尋</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}