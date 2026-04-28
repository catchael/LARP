import React from 'react';
import { motion } from 'motion/react';
import { AppPhase } from '../types';

interface ExitModalProps {
  setPhase: (p: AppPhase) => void;
  setShowExitModal: (v: boolean) => void;
}

export const ExitModal: React.FC<ExitModalProps> = ({ setPhase, setShowExitModal }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6"
    >
      <h3 className="text-2xl font-bold text-center">您想去哪裡？</h3>
      <p className="text-slate-500 text-center">您可以選擇返回教學大廳繼續學習，或是直接進入劇本大廳開始遊戲。</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => { setPhase('lobby'); setShowExitModal(false); }}
          className="btn-secondary w-full"
        >
          返回教學大廳
        </button>
        <button
          onClick={() => { setPhase('script_lobby'); setShowExitModal(false); }}
          className="btn-primary w-full"
        >
          進入劇本大廳
        </button>
        <button
          onClick={() => setShowExitModal(false)}
          className="text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
        >
          取消
        </button>
      </div>
    </motion.div>
  </motion.div>
);