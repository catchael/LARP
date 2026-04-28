import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, X } from 'lucide-react';
import { SCRIPTS } from '../data/scripts';

interface ScriptIntroModalProps {
  previewScript: typeof SCRIPTS[0] | null;
  setShowScriptIntro: (v: boolean) => void;
}

export const ScriptIntroModal: React.FC<ScriptIntroModalProps> = ({ previewScript, setShowScriptIntro }) => {
  if (!previewScript) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <BookOpen size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{previewScript.title} - 劇本簡介</h3>
          </div>
          <button
            onClick={() => setShowScriptIntro(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={28} className="text-slate-400" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto flex-1 space-y-6">
          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 italic text-indigo-900 text-lg leading-relaxed text-center">
            「{previewScript.brief}」
          </div>
          <div className="space-y-4">
            {previewScript.description.split('\n\n').map((para, idx) => (
              <p key={idx} className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
                {para.includes('**') ? (
                  para.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-indigo-600">{part}</strong> : part)
                ) : para}
              </p>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button
            onClick={() => setShowScriptIntro(false)}
            className="w-full btn-primary py-4 text-lg"
          >
            我了解了
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};