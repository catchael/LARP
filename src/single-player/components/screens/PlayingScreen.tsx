import { motion } from 'motion/react';
import { ShieldAlert, Lightbulb, Cpu, MessageSquare, Target, Volume2, Mic, Square, AlertCircle, Info, BookOpen } from 'lucide-react';
import { Level } from '../../lib/levels';

interface PlayingScreenProps {
  currentLevel: Level;
  assignedClues: Record<number, string[]>;
  setAssignedClues: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  activeSpeechStep: number;
  setActiveSpeechStep: React.Dispatch<React.SetStateAction<number>>;
  hintRevealed: boolean;
  setHintRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  isDecryptingHint: boolean;
  setIsDecryptingHint: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcript: string;
  correctedTranscript: string;
  isNPCSpeaking: boolean;
  systemError: string | null;
  onSubmit: () => void;
}

export const PlayingScreen = ({
  currentLevel,
  assignedClues,
  setAssignedClues,
  activeSpeechStep,
  setActiveSpeechStep,
  hintRevealed,
  setHintRevealed,
  isDecryptingHint,
  setIsDecryptingHint,
  isRecording,
  startRecording,
  stopRecording,
  transcript,
  correctedTranscript,
  isNPCSpeaking,
  systemError,
  onSubmit,
}: PlayingScreenProps) => {

  const handleDropClue = (stepIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    const clueId = e.dataTransfer.getData('clueId');
    if (clueId) {
      setAssignedClues(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          newState[Number(key)] = newState[Number(key)].filter(id => id !== clueId);
        });
        newState[stepIdx] = [...(newState[stepIdx] || []), clueId];
        return newState;
      });
    }
  };

  const removeAssignedClue = (stepIdx: number, clueId: string) => {
    setAssignedClues(prev => ({
      ...prev,
      [stepIdx]: prev[stepIdx].filter(id => id !== clueId)
    }));
  };

  return (
    <motion.div
      key="playing"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid lg:grid-cols-12 gap-8"
    >
      {/* Top Panel: Scenario */}
      <div className="lg:col-span-12">
         <div className="game-card p-6 bg-indigo-900 border-none text-white relative overflow-hidden">
            <div className="absolute top-0 right-10 -translate-y-4 opacity-10">
               <BookOpen className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-indigo-300 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="font-bold uppercase tracking-widest text-[10px]">當前情境 / Current Scenario</h3>
                </div>
                <h2 className="text-xl font-black mb-2">{currentLevel.title}</h2>
                <p className="text-indigo-100 text-sm leading-relaxed max-w-4xl font-medium">
                  {currentLevel.scenario}
                </p>
              </div>
            </div>
         </div>
      </div>

      {/* Left Panel: Target & Clues */}
      <div className="lg:col-span-4 space-y-6">
        <div className="game-card p-6 border-l-4 border-l-indigo-600 bg-white">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <Target className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-tight text-sm">任務目標</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">
            {currentLevel.objective}
          </p>
        </div>

        <div className="game-card p-6 bg-white">
          <div className="flex items-center gap-2 text-amber-500 mb-6">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-tight text-sm">本關線索庫</h3>
          </div>
          <ul className="space-y-3">
            {currentLevel.clues.map(clue => {
              const isRevealedIrrelevant = hintRevealed && !clue.isRelevant;
              const isRevealedRelevant = hintRevealed && clue.isRelevant;
              const isAssigned = Object.values(assignedClues).some(list => list.includes(clue.id));

              return (
                <li 
                  key={clue.id} 
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('clueId', clue.id);
                    e.currentTarget.classList.add('scale-95', 'opacity-50');
                  }}
                  onDragEnd={(e) => e.currentTarget.classList.remove('scale-95', 'opacity-50')}
                  className={`flex gap-3 text-sm p-4 rounded-2xl border transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm ${
                    isRevealedIrrelevant 
                      ? 'bg-slate-50 border-slate-200 opacity-40 grayscale' 
                      : isRevealedRelevant 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100' 
                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                  } ${isAssigned ? 'opacity-30 border-dashed border-slate-300' : ''}`}
                >
                  <span className="text-xl flex-shrink-0">{clue.icon}</span>
                  <span className={`leading-snug font-medium ${
                    isRevealedIrrelevant ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}>
                    {clue.text}
                  </span>
                </li>
              );
            })}
          </ul>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            {!hintRevealed ? (
               <button
                 onClick={() => {
                   setIsDecryptingHint(true);
                   setTimeout(() => {
                     setIsDecryptingHint(false);
                     setHintRevealed(true);
                   }, 1500);
                 }}
                 disabled={isDecryptingHint}
                 className="w-full py-4 border-2 border-indigo-100 text-indigo-600 rounded-2xl hover:bg-indigo-50 flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
               >
                 {isDecryptingHint ? (
                   <>
                     <Cpu className="w-4 h-4 animate-spin" />
                     <span className="text-sm">正在計算交涉機率...</span>
                   </>
                 ) : (
                   <>
                     <Lightbulb className="w-4 h-4" />
                     <span className="text-sm">請求戰術支援 (GET HINT)</span>
                   </>
                 )}
               </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <Info className="w-4 h-4" />
                  <h4 className="font-bold text-xs uppercase tracking-widest">系統分析報表</h4>
                </div>
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-full shadow-sm">
                    {currentLevel.support.strategy}
                  </span>
                  <p className="text-slate-600 text-sm leading-relaxed">{currentLevel.support.description}</p>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                  <span className="text-amber-600 text-[10px] font-extrabold uppercase block mb-1">關鍵破防詞:</span>
                  <p className="text-slate-800 text-sm font-bold italic">「{currentLevel.support.trigger}」</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Interaction */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="game-card p-6 bg-white">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm tracking-widest uppercase">說服策略構建 HUD</h3>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            {currentLevel.support.framework.map((step, idx) => {
              const isActive = activeSpeechStep === idx;
              const isPast = activeSpeechStep > idx;
              const cluesInSlot = assignedClues[idx] || [];
              
              return (
                <div
                  key={idx}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-indigo-50')}
                  onDrop={(e) => { e.currentTarget.classList.remove('bg-indigo-50'); handleDropClue(idx, e); }}
                  onClick={() => setActiveSpeechStep(idx)}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 border-indigo-200 border-dashed scale-[1.01] shadow-md' 
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm z-10 transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : isPast ? 'bg-indigo-100 text-indigo-400' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-base font-bold transition-colors ${isActive ? 'text-indigo-900' : isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step.name}
                      </h4>
                      {isActive && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity }} className="text-[10px] font-bold text-indigo-500 uppercase">Focusing...</motion.div>}
                    </div>
                    <p className={`text-sm mt-1 mb-4 ${isActive ? 'text-indigo-700/70' : 'text-slate-400'}`}>
                      {step.cue}
                    </p>
                    
                    <div className={`flex flex-wrap gap-2 min-h-[44px] p-2 rounded-xl border-2 border-dashed transition-colors ${isActive ? 'bg-white border-indigo-100' : 'bg-slate-50 border-transparent'}`}>
                      {cluesInSlot.length === 0 ? (
                        <div className={`flex items-center gap-2 text-xs italic ${isActive ? 'text-indigo-300' : 'text-slate-300'} my-auto ml-2`}>
                          <Info className="w-3 h-3" />
                          <span>拖放線索至此</span>
                        </div>
                      ) : (
                        cluesInSlot.map(clueId => {
                          const clue = currentLevel.clues.find(c => c.id === clueId);
                          if (!clue) return null;
                          return (
                            <motion.div 
                              key={clueId} 
                              layoutId={clueId}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              onClick={(e) => { e.stopPropagation(); removeAssignedClue(idx, clueId); }}
                              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-red-500 transition-colors"
                              title="移除"
                            >
                              <span className="text-sm">{clue.icon}</span>
                              <span className="text-xs font-bold whitespace-nowrap">{clue.text}</span>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="game-card flex flex-col bg-slate-900 relative min-h-[450px] shadow-2xl">
          <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">連線對象: {currentLevel.npcName}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Signal: Stable</span>
          </div>

          <div className="p-6 bg-slate-800/30 border-b border-slate-800 flex gap-4 items-start relative">
            <div className={`p-4 rounded-2xl flex-shrink-0 transition-all ${isNPCSpeaking ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-800 text-slate-500 opacity-50'}`}>
              <Volume2 className="w-6 h-6" />
            </div>
            <div className="bg-white/5 p-5 rounded-2xl rounded-tl-none border border-white/5 flex-1 relative overflow-hidden">
               {isNPCSpeaking && <motion.div className="absolute inset-0 bg-indigo-500/5" animate={{ opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 2 }} />}
               <span className="text-[10px] text-indigo-400 font-black uppercase block mb-2 tracking-widest">Incoming Audio</span>
               <p className={`text-lg leading-relaxed font-medium transition-all ${isNPCSpeaking ? 'text-white' : 'text-slate-400 italic'}`}>
                「{currentLevel.npcGreeting}」
              </p>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
            {!isRecording && !correctedTranscript && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700">
                  <Mic className="w-8 h-8 text-slate-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 font-bold">準備好後，按下面按鈕開始說話</p>
                  <p className="text-xs text-slate-600 uppercase tracking-widest px-4 py-1 bg-slate-800/50 rounded-full inline-block">請對照上方的論點結構來表達</p>
                </div>
              </motion.div>
            )}
            {correctedTranscript && (
              <div className="w-full max-w-xl mx-auto py-8">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <p className="text-indigo-400 text-2xl font-black leading-tight italic">
                    「{ correctedTranscript }」
                    {isRecording && <span className="inline-block w-3 h-8 bg-indigo-500 ml-2 animate-pulse align-middle" />}
                  </p>
                </motion.div>
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-800/40 border-t border-slate-800 flex flex-col items-center gap-6 relative">
            {systemError && (
              <div className="absolute -top-6 bg-red-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                <AlertCircle className="w-3 h-3" /> {systemError}
              </div>
            )}
            
            <div className="flex items-center gap-8">
              {!isRecording ? (
                <button
                   onClick={startRecording}
                   className="w-20 h-20 bg-white hover:bg-slate-100 text-slate-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all group active:scale-90"
                >
                   <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
              ) : (
                <button
                   onClick={onSubmit}
                   className="w-20 h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 animate-pulse"
                >
                   <Square className="w-8 h-8 fill-current" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-[0.3em] ${isRecording ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isRecording ? "正在捕捉發言中..." : "等待指令中"}
              </span>
              {!isRecording && correctedTranscript && (
                <button
                  onClick={onSubmit}
                  className="mt-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-sm shadow-xl transition-all active:scale-95"
                >
                  確認送出論點
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
