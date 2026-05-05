import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, ChevronRight, Sparkles, RotateCcw, Award, Target, Zap } from 'lucide-react';
import { PuzzleEvaluation } from '../../services/ai';
import { Level } from '../../lib/levels';

interface ResultScreenProps {
  result: PuzzleEvaluation;
  currentLevel: Level;
  onNext: () => void;
  onRetry: () => void;
}

export const ResultScreen = ({ result, currentLevel, onNext, onRetry }: ResultScreenProps) => {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      {/* Status Header */}
      <div className={`game-card overflow-hidden border-none text-white ${result.passed ? 'bg-indigo-600' : 'bg-rose-500'}`}>
        <div className="p-8 sm:p-12 relative overflow-hidden">
          <motion.div 
            className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md border border-white/30">
              {result.passed ? (
                <Award className="w-16 h-16 text-white" />
              ) : (
                <RotateCcw className="w-16 h-16 text-white" />
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-2 block">
                {currentLevel.npcName} 的回覆
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold leading-tight italic">
                「 {result.npcResponse} 」
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-black/20 p-4 flex justify-between items-center px-12">
           <div className="flex items-center gap-2">
             {result.passed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-200" />}
             <span className="font-black uppercase tracking-widest text-sm">
               {result.passed ? '交涉成功 - 關卡達成' : '交涉失敗 - 需再次調整'}
             </span>
           </div>
           <div className="text-xl font-black">
             {result.score}<span className="text-xs opacity-60 ml-1">pts</span>
           </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="grid md:grid-cols-12 gap-8">
        {/* Scores & Progress */}
        <div className="md:col-span-4 space-y-4">
          <div className="game-card p-6 bg-white">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" /> 指標分析
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">邏輯整合</label>
                  <span className="text-lg font-black text-slate-900">{result.structureScore}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.structureScore / 50) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">口說流暢</label>
                  <span className="text-lg font-black text-slate-900">{result.fluencyScore}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.fluencyScore / 50) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-2 ${result.passed ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                {result.passed ? <Sparkles /> : <Target />}
             </div>
             <p className="text-xs font-bold text-slate-500 max-w-[120px]">
               {result.passed ? "驚人的說服力！你已經掌握了這關的核心技巧。" : "沒關係，這是練習的好機會，調整後再戰！"}
             </p>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="md:col-span-8 space-y-6">
          <div className="game-card p-8 bg-white h-full flex flex-col">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <Zap className="w-4 h-4 text-indigo-600" /> 教練專業講評
            </h3>
            
            <ul className="space-y-4 flex-1">
              {result.coachFeedback.map((fb, idx) => (
                <motion.li 
                  key={idx} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 hover:bg-white transition-all cursor-default"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-[10px] font-black">{idx + 1}</div>
                  <span className="text-slate-600 font-medium leading-relaxed">{fb}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative group">
              <div className="absolute -top-3 left-6 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm text-[10px] font-black text-indigo-600 uppercase italic">
                最佳示範參考 / GOLDEN REFERENCE
              </div>
              <p className="text-slate-700 text-sm leading-relaxed font-semibold italic group-hover:text-indigo-900 transition-colors">
                「{result.rewritten}」
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
        {result.passed ? (
          <button
            onClick={onNext}
            className="primary-button flex items-center justify-center gap-2 group px-12"
          >
            <span>進行下一冒險階段</span>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="secondary-button flex items-center justify-center gap-2 px-12 border-rose-100 text-rose-600 hover:bg-rose-50"
          >
            <RotateCcw className="w-6 h-6 h-5" /> 
            <span>不服氣，重新挑戰</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
