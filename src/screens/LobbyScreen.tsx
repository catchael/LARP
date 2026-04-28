import React from 'react';
import { motion } from 'motion/react';
import { Mic2, Brain, MessageSquare, ChevronRight } from 'lucide-react';
import { AppPhase, TeachingModule } from '../types';
import { Mascot } from '../components/Mascot';
import { TEACHING_CONTENT } from '../data/teachingContent';

interface LobbyScreenProps {
  setPhase: (phase: AppPhase) => void;
  setActiveModule: (m: TeachingModule | null) => void;
  setCurrentPage: (p: number) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ setPhase, setActiveModule, setCurrentPage }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl w-full space-y-12">
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-4xl font-bold mb-2">教學大廳</h2>
        <p className="text-slate-500">選擇一個領域開始您的表達訓練</p>
      </div>
      <Mascot message="點選方塊開始學習吧！" />
    </div>

    <div className="grid md:grid-cols-3 gap-8">
      <div onClick={() => { setActiveModule(TEACHING_CONTENT[0]); setPhase('teaching'); setCurrentPage(0); }} className="card-block bg-indigo-50 hover:bg-indigo-100 group">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
          <Mic2 size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">表達風格</h3>
        <p className="text-slate-600">掌握停頓與語速，讓您的發言更有節奏感。</p>
      </div>

      <div onClick={() => { setActiveModule(TEACHING_CONTENT[1]); setPhase('teaching'); setCurrentPage(0); }} className="card-block bg-emerald-50 hover:bg-emerald-100 group">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
          <Brain size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">認知習慣</h3>
        <p className="text-slate-600">優化邏輯架構，確保資訊傳達清晰準確。</p>
      </div>

      <div onClick={() => { setActiveModule(TEACHING_CONTENT[2]); setPhase('teaching'); setCurrentPage(0); }} className="card-block bg-amber-50 hover:bg-amber-100 group">
        <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">聲音訓練</h3>
        <p className="text-slate-600">提升音量與自信，展現強大的存在感。</p>
      </div>
    </div>

    <div className="flex justify-end">
      <button onClick={() => setPhase('script_lobby')} className="btn-secondary flex items-center gap-2 group">
        跳過教學，進入劇本大廳 <ChevronRight className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </motion.div>
);