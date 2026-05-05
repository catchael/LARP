import { motion } from 'motion/react';
import { ChevronRight, Bookmark } from 'lucide-react';
import { Typewriter } from '../ui/Typewriter';

interface NarrativeScreenProps {
  levelTitle: string;
  levelScenario: string;
  currentLevelIndex: number;
  totalLevels: number;
  onStartPlaying: () => void;
}

export const NarrativeScreen = ({ 
  levelTitle, 
  levelScenario, 
  currentLevelIndex, 
  totalLevels, 
  onStartPlaying 
}: NarrativeScreenProps) => {
  return (
    <motion.div
      key="narrative"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="game-card p-8 sm:p-12 relative"
    >
      <div className="absolute top-0 right-12">
        <div className="bg-indigo-600 text-white px-4 py-6 rounded-b-2xl shadow-lg flex flex-col items-center">
          <Bookmark className="w-5 h-5 mb-1 opacity-80" />
          <span className="text-xs font-bold uppercase tracking-tighter text-indigo-100">Level</span>
          <span className="text-2xl font-black">{currentLevelIndex + 1}</span>
        </div>
      </div>

      <div className="text-xs font-bold text-indigo-600 mb-4 tracking-widest uppercase flex items-center gap-2">
        <span className="w-8 h-[2px] bg-indigo-600" />
        <span>任務簡報 / Mission Briefing</span>
      </div>
      
      <h2 className="text-3xl font-extrabold text-slate-900 mb-8 max-w-[80%] leading-tight">
        <Typewriter text={levelTitle} />
      </h2>
      
      <div className="text-xl text-slate-600 leading-relaxed mb-12 min-h-[140px] bg-slate-50 p-8 rounded-2xl border-l-4 border-indigo-600 italic">
        <Typewriter text={levelScenario} />
      </div>

      <div className="flex justify-center sm:justify-start">
        <button
          onClick={onStartPlaying}
          className="primary-button group flex items-center gap-2 px-12"
        >
          <span>開始交涉挑戰</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
};
