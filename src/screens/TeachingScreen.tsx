import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppPhase, TeachingModule } from '../types';
import { Mascot } from '../components/Mascot';
import { LivePauseDemo, SpeedChart } from '../components/Visualizations';
import { PyramidPrinciple } from '../components/PyramidPrinciple';

interface TeachingScreenProps {
  activeModule: TeachingModule | null;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  setShowExitModal: (v: boolean) => void;
  setPhase: (p: AppPhase) => void;
  speechRateHistory: { time: string; rate: number }[];
  setSpeechRateHistory: React.Dispatch<React.SetStateAction<{ time: string; rate: number }[]>>;
}

export const TeachingScreen: React.FC<TeachingScreenProps> = ({
  activeModule,
  currentPage,
  setCurrentPage,
  setShowExitModal,
  setPhase,
  speechRateHistory,
  setSpeechRateHistory,
}) => {
  if (!activeModule) return null;
  const page = activeModule.pages[currentPage];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl w-full space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExitModal(true)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">{activeModule.title}</h2>
        </div>
        <div className="text-sm font-bold text-slate-400">
          頁面 {currentPage + 1} / {activeModule.pages.length}
        </div>
      </div>

      <div className="glass p-10 rounded-3xl min-h-[500px] flex flex-col">
        <div className="flex-1 space-y-8">
          <h3 className="text-3xl font-bold text-indigo-600">{page.title}</h3>
          <p className="text-xl text-slate-700 leading-relaxed">{page.content}</p>
          <div className="mt-12">
            {activeModule.id === 'delivery' && currentPage === 0 ? (
              <LivePauseDemo onHistoryChange={setSpeechRateHistory} />
            ) : activeModule.id === 'delivery' && currentPage === 1 ? (
              <SpeedChart data={speechRateHistory} />
            ) : (
              page.visualization
            )}
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center">
          <Mascot />
          <div className="flex gap-4">
            {currentPage > 0 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft size={20} /> 上一頁
              </button>
            )}
            <button
              onClick={() => {
                if (currentPage < activeModule.pages.length - 1) {
                  setCurrentPage(currentPage + 1);
                } else {
                  setPhase('script_lobby');
                }
              }}
              className="btn-primary flex items-center gap-2"
            >
              {currentPage < activeModule.pages.length - 1 ? '下一頁' : '完成教學'} <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};