import { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTTS } from './hooks/useTTS';
import { LEVELS, Level } from './lib/levels';
import { evaluatePuzzleSpeech, PuzzleEvaluation, generateCustomFramework } from './services/ai';
import { GameState } from './types';

// Components
import { Header } from './components/layout/Header';
import { IntroScreen } from './components/screens/IntroScreen';
import { CustomSetupScreen } from './components/screens/CustomSetupScreen';
import { GeneratingScreen } from './components/screens/GeneratingScreen';
import { NarrativeScreen } from './components/screens/NarrativeScreen';
import { PlayingScreen } from './components/screens/PlayingScreen';
import { EvaluatingScreen } from './components/screens/EvaluatingScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { VictoryScreen } from './components/screens/VictoryScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [customLevel, setCustomLevel] = useState<Level | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [result, setResult] = useState<PuzzleEvaluation | null>(null);
  const [isDecryptingHint, setIsDecryptingHint] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [activeSpeechStep, setActiveSpeechStep] = useState(0);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [assignedClues, setAssignedClues] = useState<Record<number, string[]>>({});
  
  const currentLevel: Level = (customLevel && gameState !== 'intro' && gameState !== 'custom_setup' && gameState !== 'generating_custom') ? customLevel : LEVELS[currentLevelIndex];

  const { isRecording, transcript, startRecording, stopRecording, error, isSupported } = useSpeechRecognition(currentLevel.keywords);
  const { speak, stop: stopTTS, isSpeaking: isNPCSpeaking } = useTTS();

  const correctedTranscript = useMemo(() => {
    let t = transcript;
    if (currentLevel.corrections && t) {
      Object.entries(currentLevel.corrections).forEach(([wrongWord, correctWord]) => {
        t = t.replace(new RegExp(wrongWord, 'g'), correctWord);
      });
    }
    return t;
  }, [transcript, currentLevel.corrections]);

  const handleStartStory = () => {
    setGameState('narrative');
  };

  const handleStartPlaying = () => {
    setResult(null);
    setHintRevealed(false);
    setIsDecryptingHint(false);
    setActiveSpeechStep(0);
    setSystemError(null);
    setAssignedClues({});
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      speak(currentLevel.npcGreeting);
    }
  }, [gameState, currentLevel.npcGreeting, speak]);

  useEffect(() => {
    if (gameState === 'result' && result) {
      speak(result.npcResponse);
    }
  }, [gameState, result, speak]);

  useEffect(() => {
    return () => stopTTS();
  }, [stopTTS]);

  const handleFinishRecording = async () => {
    stopRecording();
    stopTTS(); 
    
    if (correctedTranscript.trim().length <= 3) {
      alert('【系統提示】收到雜訊。發言內容過短，請完整陳述您的論點。');
      return;
    }

    setGameState('evaluating');
    setSystemError(null);
    
    try {
      const evaluation = await evaluatePuzzleSpeech(currentLevel, correctedTranscript);
      setResult(evaluation);
      setGameState('result');
      
      if (evaluation.passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00FF00', '#00FFFF', '#FFFFFF']
        });
      }
    } catch (err: any) {
      console.error(err);
      setSystemError(`AI 通訊失敗: ${err?.message || '未知錯誤'}`);
      setGameState('playing');
    }
  };

  const nextLevelOrVictory = () => {
    if (currentLevelIndex + 1 < LEVELS.length) {
      setCurrentLevelIndex(prev => prev + 1);
      setGameState('narrative');
    } else {
      setGameState('victory');
    }
  };

  const restartGame = () => {
    setCurrentLevelIndex(0);
    setCustomLevel(null);
    setGameState('intro');
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-cyan-500 font-mono">
        <div className="bg-slate-900 border border-red-500/50 p-8 rounded-lg text-center max-w-md shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-400">[系統連線失敗]</h2>
          <p className="text-sm">
            本終端機不支援音訊輸入協定 (Web Speech API)。請使用最新版 Google Chrome 重試連線。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-slate-200">
        <motion.div 
          className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${(currentLevelIndex / LEVELS.length) * 100}%` }}
        />
      </div>

      <div className="progress-blob top-[-10%] left-[-5%]" />
      <div className="progress-blob bottom-[-10%] right-[-5%] bg-emerald-50" />
           
      <div className="max-w-4xl mx-auto p-4 sm:p-8 relative z-10 min-h-screen flex flex-col pt-16">
        <Header />

        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <IntroScreen 
              onStartStory={handleStartStory} 
              onCustomSetup={() => setGameState('custom_setup')} 
            />
          )}

          {gameState === 'custom_setup' && (
            <CustomSetupScreen 
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              systemError={systemError}
              onBack={restartGame}
              onGenerate={async () => {
                if (!customPrompt.trim()) return;
                setSystemError(null);
                setGameState('generating_custom');
                try {
                  const level = await generateCustomFramework(customPrompt);
                  setCustomLevel(level);
                  setGameState('narrative');
                } catch (err: any) {
                  setSystemError(`生成失敗: ${err?.message || '未知錯誤'}`);
                  setGameState('custom_setup');
                }
              }}
            />
          )}

          {gameState === 'generating_custom' && <GeneratingScreen />}

          {gameState === 'narrative' && (
            <NarrativeScreen 
              levelTitle={currentLevel.title}
              levelScenario={currentLevel.scenario}
              currentLevelIndex={currentLevelIndex}
              totalLevels={LEVELS.length}
              onStartPlaying={handleStartPlaying}
            />
          )}

          {gameState === 'playing' && (
            <PlayingScreen 
              currentLevel={currentLevel}
              assignedClues={assignedClues}
              setAssignedClues={setAssignedClues}
              activeSpeechStep={activeSpeechStep}
              setActiveSpeechStep={setActiveSpeechStep}
              hintRevealed={hintRevealed}
              setHintRevealed={setHintRevealed}
              isDecryptingHint={isDecryptingHint}
              setIsDecryptingHint={setIsDecryptingHint}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              transcript={transcript}
              correctedTranscript={correctedTranscript}
              isNPCSpeaking={isNPCSpeaking}
              systemError={error || systemError}
              onSubmit={handleFinishRecording}
            />
          )}

          {gameState === 'evaluating' && <EvaluatingScreen />}

          {gameState === 'result' && result && (
            <ResultScreen 
              result={result}
              currentLevel={currentLevel}
              onNext={nextLevelOrVictory}
              onRetry={handleStartPlaying}
            />
          )}

          {gameState === 'victory' && (
            <VictoryScreen onRestart={restartGame} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
