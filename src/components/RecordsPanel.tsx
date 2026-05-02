import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  History,
  X,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AssessmentReport, ScriptRecord, Survey } from '../types';
import { calculatePRCAScores } from '../data/surveySections';

interface RecordsPanelProps {
  recordsView: 'menu' | 'scripts' | 'surveys' | 'reports';
  setRecordsView: (v: 'menu' | 'scripts' | 'surveys' | 'reports') => void;
  setShowRecordsPanel: (v: boolean) => void;
  surveys: Survey[];
  selectedSurveyId: number | null;
  setSelectedSurveyId: (id: number | null) => void;
  scriptRecords: ScriptRecord[];
  assessmentReports: AssessmentReport[];
  expandedRecord: number | null;
  setExpandedRecord: (id: number | null) => void;
  onOpenReport: (report: any) => void;
  myCharacter?: string;
}

export const RecordsPanel: React.FC<RecordsPanelProps> = ({
  recordsView,
  setRecordsView,
  setShowRecordsPanel,
  surveys,
  selectedSurveyId,
  setSelectedSurveyId,
  scriptRecords,
  assessmentReports,
  expandedRecord,
  setExpandedRecord,
  onOpenReport,
  myCharacter,
}) => {
  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId) || surveys[0];

  // Prepare chart data
  const chartData = [...surveys].reverse().map(s => ({
    date: new Date(s.created_at).toLocaleDateString(),
    total: calculatePRCAScores(s.data).total
  }));

  const renderMenu = () => (
    <div className="p-6 space-y-4">
      <button
        onClick={() => setRecordsView('scripts')}
        className="w-full p-6 bg-indigo-50 hover:bg-indigo-100 rounded-2xl border border-indigo-100 flex items-center justify-between group transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <BookOpen size={24} />
          </div>
          <div className="text-left">
            <div className="font-bold text-lg text-slate-800">劇本紀錄</div>
            <div className="text-sm text-slate-500">查看您過去參與的劇本對話</div>
          </div>
        </div>
        <ChevronRight className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
      </button>

      <button
        onClick={() => {
          setRecordsView('surveys');
          if (surveys.length > 0 && !selectedSurveyId) setSelectedSurveyId(surveys[0].id);
        }}
        className="w-full p-6 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-100 flex items-center justify-between group transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <ClipboardList size={24} />
          </div>
          <div className="text-left">
            <div className="font-bold text-lg text-slate-800">問卷填寫紀錄</div>
            <div className="text-sm text-slate-500">追蹤您的表達焦慮變化</div>
          </div>
        </div>
        <ChevronRight className="text-emerald-300 group-hover:translate-x-1 transition-transform" />
      </button>

      <button
        onClick={() => onOpenReport({ id: 'list' })} 
        className="w-full p-6 bg-amber-50 hover:bg-amber-100 rounded-2xl border border-amber-100 flex items-center justify-between group transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white">
            <FileText size={24} />
          </div>
          <div className="text-left">
            <div className="font-bold text-lg text-slate-800">評估報告</div>
            <div className="text-sm text-slate-500">AI 生成的深度表達分析</div>
          </div>
        </div>
        <ChevronRight className="text-amber-300 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const renderScripts = () => (
    <div className="p-6 space-y-4">
      {scriptRecords.length === 0 ? (
        <p className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-xl">尚無劇本紀錄</p>
      ) : (
        scriptRecords.map((record) => (
          <div key={record.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
              className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="text-left">
                <div className="font-bold text-slate-800">{record.script_name}</div>
                <div className="text-xs text-slate-400">{new Date(record.created_at).toLocaleString()}</div>
              </div>
              {expandedRecord === record.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <AnimatePresence>
              {expandedRecord === record.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-slate-50 border-t border-slate-100"
                >
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {record.dialogue.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.speaker === myCharacter ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 mb-1">{msg.speaker}</span>
                        <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                          msg.speaker === myCharacter
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      )}
    </div>
  );

  const renderSurveys = () => (
    <div className="p-6 space-y-8">
      {surveys.length === 0 ? (
        <p className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-xl">尚無問卷紀錄</p>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">選擇紀錄日期</label>
            <select
              value={selectedSurveyId || ''}
              onChange={(e) => setSelectedSurveyId(Number(e.target.value))}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            >
              {surveys.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.created_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedSurvey && (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const scores = calculatePRCAScores(selectedSurvey.data);
                    return (
                      <>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                          <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">小組討論</div>
                          <div className="text-2xl font-black text-emerald-600">{scores.group}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                          <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">會議</div>
                          <div className="text-2xl font-black text-emerald-600">{scores.meeting}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                          <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">人際對話</div>
                          <div className="text-2xl font-black text-emerald-600">{scores.dyadic}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                          <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">公開演講</div>
                          <div className="text-2xl font-black text-emerald-600">{scores.publicScore}</div>
                        </div>
                        <div className="col-span-2 bg-emerald-600 p-4 rounded-xl flex justify-between items-center text-white">
                          <div className="text-xs uppercase font-bold opacity-80">總分 (Total CA)</div>
                          <div className="text-3xl font-black">{scores.total}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs text-slate-600 font-medium">每個部分，最低 6 分，最高 30 分</p>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                  <p className="text-xs text-slate-500">6分：你在該情境下有極高的焦慮 。</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                  <p className="text-xs text-slate-500">30 分：你在該情境下完全沒有焦慮 。</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" />
                  總分變化趨勢
                </h4>
                <div className="h-48 w-full bg-white p-4 rounded-xl border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[24, 120]} stroke="#94a3b8" fontSize={10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[200] flex flex-col border-l border-slate-200"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {recordsView !== 'menu' && (
            <button onClick={() => setRecordsView('menu')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <History className="text-indigo-600" />
            <h2 className="text-xl font-bold">
              {recordsView === 'menu' ? '個人遊玩紀錄' :
               recordsView === 'scripts' ? '劇本紀錄' :
               recordsView === 'surveys' ? '問卷填寫紀錄' : '評估報告'}
            </h2>
          </div>
        </div>
        <button onClick={() => { setShowRecordsPanel(false); setRecordsView('menu'); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {recordsView === 'menu' && renderMenu()}
        {recordsView === 'scripts' && renderScripts()}
        {recordsView === 'surveys' && renderSurveys()}
      </div>
    </motion.div>
  );
};