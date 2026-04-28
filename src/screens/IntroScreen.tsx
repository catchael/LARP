import React from 'react';
import { motion } from 'motion/react';
import { AppPhase } from '../types';
import { Mascot } from '../components/Mascot';

interface IntroScreenProps {
  setPhase: (phase: AppPhase) => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ setPhase }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl text-center space-y-12">
    <Mascot message="歡迎來到表達學院！" />
    <div className="space-y-6">
      <h2 className="text-4xl font-bold text-slate-900 leading-tight">
        我們想要藉由劇本殺，讓你在遊玩期間一邊娛樂、一邊提升自己的表達能力。
      </h2>
      <p className="text-xl text-slate-600">
        在這裡，每一場推理都是一次口語訓練。
      </p>
    </div>
    <button onClick={() => setPhase('survey')} className="btn-primary text-lg px-10 py-4">
      開始填寫問卷
    </button>
  </motion.div>
);