import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export const GeneratingScreen = () => {
  return (
    <motion.div
      key="generating"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/80 backdrop-blur-md rounded-xl p-12 border border-purple-700/50 flex flex-col items-center justify-center text-center"
    >
      <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2 tracking-widest">系統分析中...</h2>
      <p className="text-purple-300/80 animate-pulse">正在為您量身打造專屬的溝通防線與策略，請稍候</p>
    </motion.div>
  );
};
