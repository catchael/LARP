import { motion } from 'motion/react';
import { PenTool, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';

interface CustomSetupScreenProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  systemError: string | null;
  onBack: () => void;
  onGenerate: () => void;
}

export const CustomSetupScreen = ({ 
  customPrompt, 
  setCustomPrompt, 
  systemError, 
  onBack, 
  onGenerate 
}: CustomSetupScreenProps) => {
  return (
    <motion.div
      key="custom-setup"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="game-card p-8 sm:p-12 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <PenTool className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">自訂挑戰產生器</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custom Scenario Blueprint</p>
        </div>
      </div>
      
      <div className="mb-8 space-y-4">
        <p className="text-slate-600 font-medium leading-relaxed">
          描述你即將面對的真實挑戰。AI 將為你打造專屬的「說服結構」與「談判對手」。
        </p>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm italic text-slate-500 relative">
          <div className="absolute top-0 right-4 translate-y-[-50%] bg-white px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            範例參考
          </div>
          「明天要向主管爭取加薪，但預算有限」、「要說服長輩換新的智慧型手機」、「向客戶解釋專案延期的原因」
        </div>
      </div>

      <textarea
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        placeholder="在此輸入你的挑戰細節..."
        className="w-full h-40 bg-white border-2 border-slate-100 rounded-2xl p-5 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-8"
      />

      {systemError && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold">{systemError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <button
          onClick={onBack}
          className="secondary-button flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        <button
          onClick={onGenerate}
          disabled={!customPrompt.trim()}
          className="primary-button flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>生成專屬冒險卡</span>
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};
