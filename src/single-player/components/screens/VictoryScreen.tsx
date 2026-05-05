import { motion } from 'motion/react';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface VictoryScreenProps {
  onRestart: () => void;
}

export const VictoryScreen = ({ onRestart }: VictoryScreenProps) => {
  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="victory"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="game-card p-16 text-center max-w-2xl mx-auto shadow-2xl shadow-indigo-100"
    >
      <div className="relative inline-block mb-10">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <Trophy className="w-24 h-24 text-amber-400 mx-auto" />
        </motion.div>
        <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-indigo-500 animate-pulse" />
      </div>
      
      <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">
        傳奇交涉家 <span className="text-indigo-600">達成！</span>
      </h2>
      <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-md mx-auto">
        所有突發狀況均已完美解除。你展現了卓越的邏輯構建與臨場反應，你的言辭已經成為最強大的武器。
      </p>
      
      <button
        onClick={onRestart}
        className="primary-button group flex items-center justify-center gap-3 px-12 mx-auto"
      >
        <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" /> 
        <span>重啟新的冒險之旅</span>
      </button>
    </motion.div>
  );
};
