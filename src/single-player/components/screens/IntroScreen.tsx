import { motion } from 'motion/react';
import { Mic, Sparkles, Sword } from 'lucide-react';

interface IntroScreenProps {
  onStartStory: () => void;
  onCustomSetup: () => void;
}

export const IntroScreen = ({ onStartStory, onCustomSetup }: IntroScreenProps) => {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="game-card p-8 sm:p-16 text-center max-w-3xl mx-auto"
    >
      <div className="flex justify-center mb-8">
        <div className="relative">
          <motion.div 
            className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="relative bg-white p-6 rounded-full shadow-lg border border-slate-100">
            <Mic className="w-16 h-16 text-indigo-600" />
          </div>
          <motion.div 
            className="absolute -top-2 -right-2 bg-emerald-500 p-2 rounded-xl text-white shadow-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">
        開口說，<span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">贏得冒險</span>
      </h2>
      
      <div className="text-lg text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed space-y-4">
        <p>
          這不是普通的課程，而是一場透過"口語魅力"來推動劇情的冒險。
        </p>
        <p className="font-medium text-slate-600">
          你將面對各種緊急情境，唯有組織出邏輯嚴密的「說詞」，才能突破關卡獲取勝利。
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <button
          onClick={onStartStory}
          className="group primary-button flex items-center justify-center gap-3 px-10"
        >
          <Sword className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span>開啟主線劇情</span>
        </button>

        <button
          onClick={onCustomSetup}
          className="secondary-button flex items-center justify-center gap-3"
        >
          <span>自訂訓練情境</span>
        </button>
      </div>
    </motion.div>
  );
};
