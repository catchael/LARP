import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppPhase } from '../types';
import { SCRIPTS } from '../data/scripts';

interface ScriptLobbyScreenProps {
  setPhase: (p: AppPhase) => void;
  setPreviewScript: (s: typeof SCRIPTS[0] | null) => void;
}

export const ScriptLobbyScreen: React.FC<ScriptLobbyScreenProps> = ({ setPhase, setPreviewScript }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl w-full space-y-12">
    <div className="flex items-end justify-between">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold">劇本挑選大廳</h2>
        <p className="text-slate-500">選擇一個感興趣的劇本，開始您的沉浸式表達體驗</p>
      </div>
      <button
        onClick={() => setPhase('lobby')}
        className="btn-secondary flex items-center gap-2"
      >
        <ChevronLeft size={20} /> 返回教學
      </button>
    </div>

    <div className="grid md:grid-cols-2 gap-10">
      {SCRIPTS.map((script) => (
        <motion.div
          key={script.id}
          whileHover={{ y: -10 }}
          onClick={() => { setPreviewScript(script); setPhase('script_detail'); }}
          className="group cursor-pointer bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 transition-all hover:shadow-2xl"
        >
          <div className="relative h-72 overflow-hidden">
            <img
              src={script.image}
              alt={script.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-8 right-8">
              <div className="flex gap-2 mb-3">
                {script.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/30">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight">{script.title}</h3>
            </div>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-slate-600 text-lg font-medium leading-relaxed">「{script.brief}」</p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">難度</span>
                <span className="text-amber-500 font-bold">{script.difficulty}</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">
                查看詳情 <ChevronRight size={20} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);