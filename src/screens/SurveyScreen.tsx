import React from 'react';
import { motion } from 'motion/react';
import { History, Send, ArrowRight } from 'lucide-react';
import { AppPhase, Survey, cn } from '../types';
import { SURVEY_SECTIONS, calculatePRCAScores } from '../data/surveySections';

interface SurveyScreenProps {
  setPhase: (phase: AppPhase) => void;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  surveys: Survey[];
  currentSurvey: Record<number, number>;
  setCurrentSurvey: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  submitSurvey: () => Promise<void> | void;
}

export const SurveyScreen: React.FC<SurveyScreenProps> = ({
  setPhase,
  showHistory,
  setShowHistory,
  surveys,
  currentSurvey,
  setCurrentSurvey,
  submitSurvey,
}) => {
  const allAnswered = SURVEY_SECTIONS.every(section =>
    section.questions.every(q => currentSurvey[q.id] !== undefined)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl w-full space-y-8 pb-20">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10">
        <h2 className="text-3xl font-bold">表達能力自我評估</h2>
        <div className="flex items-center gap-4">
          <button onClick={() => setPhase('lobby')} className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
            跳過問卷
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            <History size={20} /> {showHistory ? '返回填寫' : '查看上次紀錄'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="space-y-4">
          {surveys.length === 0 ? (
            <div className="p-10 text-center bg-slate-100 rounded-2xl text-slate-500 italic">尚無歷史紀錄</div>
          ) : (
            surveys.map((s) => {
              const scores = calculatePRCAScores(s.data);
              return (
                <div key={s.id} className="glass p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">{new Date(s.created_at).toLocaleDateString()}</div>
                      <div className="font-bold text-lg text-indigo-600">問卷紀錄 #{s.id}</div>
                    </div>
                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      總分: {scores.total}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate">小組討論</div>
                      <div className="text-lg font-black text-slate-700">{scores.group}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate">會議</div>
                      <div className="text-lg font-black text-slate-700">{scores.meeting}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate">人際對話</div>
                      <div className="text-lg font-black text-slate-700">{scores.dyadic}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate">公開演講</div>
                      <div className="text-lg font-black text-slate-700">{scores.publicScore}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-12">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-indigo-800 font-medium">請根據您的實際感受進行評分：</p>
            <p className="text-indigo-600 text-sm mt-1">1 為極不同意，5 為極同意</p>
          </div>

          {SURVEY_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-500 pl-4">{section.title}</h3>
              <div className="space-y-4">
                {section.questions.map((q) => (
                  <div key={q.id} className="glass p-6 rounded-2xl space-y-4">
                    <p className="text-lg font-medium text-slate-700">{q.id}. {q.text}</p>
                    <div className="flex justify-between items-center gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setCurrentSurvey(prev => ({ ...prev, [q.id]: val }))}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-bold transition-all border-2",
                            currentSurvey[q.id] === val
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105"
                              : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-8 space-y-4">
            <button
              onClick={submitSurvey}
              disabled={!allAnswered}
              className={cn(
                "w-full btn-primary flex items-center justify-center gap-2 py-5 text-xl",
                !allAnswered && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              {allAnswered ? '提交並進入教學' : '請完成所有題目'} <Send size={24} />
            </button>
            <button
              onClick={() => setPhase('lobby')}
              className="w-full py-4 text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center justify-center gap-2"
            >
              跳過問卷直接開始 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};