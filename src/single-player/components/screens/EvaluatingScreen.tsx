import { motion } from 'motion/react';

export const EvaluatingScreen = () => {
  return (
    <motion.div
      key="evaluating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="relative w-32 h-32 mb-8">
        <svg className="animate-spin w-full h-full text-cyan-500/20" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
          <path className="opacity-75 text-cyan-400" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs text-cyan-400 font-bold tracking-widest">
          ANALYZING
        </div>
      </div>
      <p className="text-slate-400 tracking-widest">系統正在驗證你的邏輯與情緒波紋...</p>
    </motion.div>
  );
};
