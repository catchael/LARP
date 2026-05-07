import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mic, PauseCircle, Activity } from 'lucide-react';
import { cn } from '../types';
import * as ort from 'onnxruntime-web';
import { PyramidPrinciple } from './PyramidPrinciple';

// We'll use the CDN version of VAD to avoid module resolution issues
declare global {
  interface Window {
    vad: any;
    __vadScriptLoaded: boolean;
    __vadModelBuffer: ArrayBuffer | null;
    __vadPreloadPromise: Promise<void> | null;
  }
}

// Configure ONNX Runtime to use CDN for WASM files
if (typeof window !== 'undefined') {
  (window as any).ort = ort;
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";
  ort.env.wasm.numThreads = 1;
}

// ─── VAD 預載 ────────────────────────────────────────────────────────────────
// 在 module 載入時立即於背景靜默預取 VAD 腳本（~50KB）和模型（~4MB）
// 使用者點麥克風時就能直接使用，不用等待網路請求
const VAD_SCRIPT_URL  = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/bundle.min.js";
const VAD_MODEL_URL   = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/silero_vad.onnx";

function preloadVAD(): Promise<void> {
  if (window.__vadPreloadPromise) return window.__vadPreloadPromise;

  window.__vadPreloadPromise = (async () => {
    try {
      // 1. 預載腳本（如果尚未載入）
      if (!window.__vadScriptLoaded && !window.vad) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = VAD_SCRIPT_URL;
          script.onload = () => { window.__vadScriptLoaded = true; resolve(); };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // 2. 預載模型 ArrayBuffer（如果尚未快取）
      if (!window.__vadModelBuffer) {
        const res = await fetch(VAD_MODEL_URL);
        if (!res.ok) throw new Error(`VAD model fetch failed: ${res.status}`);
        window.__vadModelBuffer = await res.arrayBuffer();
      }
    } catch (e) {
      // 預載失敗不影響 app，只是使用時需要重試
      console.warn('[VAD preload] failed silently:', e);
      window.__vadPreloadPromise = null; // 允許稍後重試
    }
  })();

  return window.__vadPreloadPromise;
}

// App 啟動後立即觸發預載（不阻塞任何 UI）
if (typeof window !== 'undefined') {
  window.__vadScriptLoaded  = window.__vadScriptLoaded  ?? false;
  window.__vadModelBuffer   = window.__vadModelBuffer   ?? null;
  window.__vadPreloadPromise = window.__vadPreloadPromise ?? null;
  // 延遲 1 秒讓主要 UI 先渲染，再開始背景下載
  setTimeout(preloadVAD, 1000);
}
// ─────────────────────────────────────────────────────────────────────────────

export const PauseDemo = () => (
  <div className="bg-slate-900 p-6 rounded-xl text-white font-mono text-lg leading-relaxed">
    <p>
      我認為... <PauseCircle className="inline text-indigo-400 mx-1" size={20} /> 
      這次的兇手... <PauseCircle className="inline text-indigo-400 mx-1" size={20} /> 
      應該就是管家。
    </p>
    <div className="mt-4 text-xs text-slate-400 italic">
      * 圖標標示出您在發言中的停頓點
    </div>
  </div>
);

interface LivePauseDemoProps {
  onHistoryChange?: (history: { time: string; rate: number }[]) => void;
}

export interface LivePauseDemoHandle {
  releaseStream: () => void;
}

export const LivePauseDemo = React.forwardRef<LivePauseDemoHandle, LivePauseDemoProps>(
  ({ onHistoryChange }, ref) => {
  const [isListening, setIsListening] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [transcript, setTranscript] = React.useState<{ text: string; isPause: boolean }[]>([]);
  const [interimText, setInterimText] = React.useState('');
  const interimTextRef = React.useRef('');
  const [volume, setVolume] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<string>('');
  const [recognitionStatus, setRecognitionStatus] = React.useState<'idle' | 'starting' | 'listening' | 'error'>('idle');
  const [heartbeat, setHeartbeat] = React.useState(0);
  const [speechRateHistory, setSpeechRateHistory] = React.useState<{ time: string; rate: number }[]>([]);
  const [currentRate, setCurrentRate] = React.useState(0);

  // Sync history to parent
  React.useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange(speechRateHistory);
    }
  }, [speechRateHistory, onHistoryChange]);
  const transcriptWithTimeRef = React.useRef<{ length: number; time: number }[]>([]);
  const lastRateCalcTimeRef = React.useRef<number>(Date.now());
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>('');
  const [language, setLanguage] = React.useState<string>('zh-TW');
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  
  const recognitionRef = React.useRef<any>(null);
  const vadRef = React.useRef<any>(null);
  const shouldBeListeningRef = React.useRef(false);
  const lastWordTimeRef = React.useRef<number>(Date.now());
  const lastRecognitionResultTimeRef = React.useRef<number>(Date.now());
  const transcriptRef = React.useRef(transcript);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // 對外暴露強制釋放麥克風的方法，供父元件在切換頁面時呼叫
  React.useImperativeHandle(ref, () => ({
    releaseStream: () => {
      shouldBeListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch (_) {}
      stopVolumeMonitoring();
    }
  }));

  const setInterimTextWithRef = (text: string) => {
    setInterimText(text);
    interimTextRef.current = text;
  };

  // Keep ref in sync with state for use in callbacks
  React.useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load available devices
  React.useEffect(() => {
    const loadDevices = async () => {
      try {
        // Just enumerate first. Labels might be empty if permission isn't granted yet.
        // We avoid calling getUserMedia here to prevent intrusive permission prompts on page load.
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
        
        if (audioInputs.length > 0) {
          setDevices(audioInputs);
          if (!selectedDeviceId) {
            setSelectedDeviceId(audioInputs[0].deviceId);
          }
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    };
    loadDevices();

    // Also listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, []);

  const [pauseDuration, setPauseDuration] = React.useState(0);
  const pauseTimerRef = React.useRef<any>(null);

  // Real-time silence detection and engine watchdog
  React.useEffect(() => {
    if (isListening) {
      pauseTimerRef.current = setInterval(() => {
        const now = Date.now();
        const duration = (now - lastWordTimeRef.current) / 1000;
        setHeartbeat(h => (h + 1) % 100);

        // Speech Rate Calculation (Sliding window of 10s)
        const tenSecondsAgo = now - 10000;
        transcriptWithTimeRef.current = transcriptWithTimeRef.current.filter(item => item.time > tenSecondsAgo);
        const totalChars = transcriptWithTimeRef.current.reduce((sum, item) => sum + item.length, 0);
        const rate = Math.round((totalChars / 10) * 60);
        setCurrentRate(rate);

        // Update history every 2 seconds
        if (Math.floor(now / 2000) !== Math.floor(lastRateCalcTimeRef.current / 2000)) {
          const newPoint = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rate };
          setSpeechRateHistory(prev => {
            const newHistory = [...prev, newPoint].slice(-20);
            return newHistory;
          });
          lastRateCalcTimeRef.current = now;
        }
        
        // Watchdog 1: If we are speaking (VAD) but no recognition results (even interim) for 3s
        const timeSinceLastResult = (now - lastRecognitionResultTimeRef.current) / 1000;
        if (isSpeaking && timeSinceLastResult > 3 && shouldBeListeningRef.current) {
          console.log("Watchdog: No results while speaking. Restarting...");
          setDebugInfo(prev => "偵測到說話但無回應，重啟中...");
          lastRecognitionResultTimeRef.current = now;
          recognitionRef.current?.stop();
          return;
        }

        // Watchdog 2: If interim text is too long or has persisted for too long (> 6s)
        // This forces a "flush" of long sentences
        const isTooLong = interimTextRef.current.length > 60;
        if (interimTextRef.current.length > 0 && (timeSinceLastResult > 6 || isTooLong) && shouldBeListeningRef.current) {
          console.log(`Watchdog: Interim text ${isTooLong ? 'too long' : 'persisted too long'}. Flushing...`);
          setDebugInfo(prev => isTooLong ? "句子過長，自動斷句中..." : "句子停滯，正在強制刷新...");
          lastRecognitionResultTimeRef.current = now;
          recognitionRef.current?.stop();
          return;
        }

        if (duration > 0.3) {
          setPauseDuration(duration);
        } else {
          setPauseDuration(0);
        }

        // Auto-insert pause icon if silence > 0.3s and last item isn't a pause
        if (duration > 0.3 && transcriptRef.current.length > 0) {
          const lastItem = transcriptRef.current[transcriptRef.current.length - 1];
          if (!lastItem.isPause) {
            setTranscript(prev => [...prev, { text: '', isPause: true }]);
          }
        }
      }, 100);
    } else {
      setPauseDuration(0);
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    }
    return () => {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };
  }, [isListening]);

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      ctx.fillStyle = 'rgb(15, 23, 42)'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#6366f1'; // indigo-500
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      let hasSignal = false;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (dataArray[i] !== 128) hasSignal = true;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Calculate volume
      let sumSq = 0;
      for (let i = 0; i < bufferLength; i++) {
        const amplitude = (dataArray[i] - 128) / 128;
        sumSq += amplitude * amplitude;
      }
      const rms = Math.sqrt(sumSq / bufferLength);
      // If we have a signal but it's very low, ensure it's at least visible
      const vol = hasSignal ? Math.max(2, rms * 500) : 0;
      setVolume(vol);
    };
    
    draw();
  };

  const startVolumeMonitoring = async (stream: MediaStream) => {
    try {
      const tracks = stream.getAudioTracks();
      if (tracks.length === 0) {
        setDebugInfo(prev => prev + ' | 錯誤: 找不到音軌');
        return;
      }
      
      const track = tracks[0];
      setDebugInfo(`裝置: ${track.label.slice(0, 15)}... | 狀態: ${track.readyState}`);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      
      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      drawWaveform();
      
      // Monitor context state
      const checkState = setInterval(() => {
        if (audioContextRef.current) {
          setDebugInfo(prev => {
            const base = prev.split(' | ')[0];
            return `${base} | 引擎: ${audioContextRef.current?.state} | Time: ${Math.round(audioContextRef.current?.currentTime || 0)}`;
          });
        } else {
          clearInterval(checkState);
        }
      }, 1000);

    } catch (err) {
      console.error('Volume monitoring error:', err);
      setDebugInfo(prev => prev + ' | 監測失敗: ' + (err instanceof Error ? err.message : '未知'));
    }
  };

  const stopVolumeMonitoring = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (vadRef.current) {
      vadRef.current.pause();
      vadRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setVolume(0);
  };

  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let interim = '';
        const now = Date.now();
        lastRecognitionResultTimeRef.current = now;
        console.log("SpeechRecognition result event:", event);
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            console.log("Final transcript:", transcriptText);
            setDebugInfo(prev => `最後辨識: "${transcriptText.slice(0, 15)}..."`);
            const timeDiff = now - lastWordTimeRef.current;
            
            // Track for speech rate
            transcriptWithTimeRef.current.push({ length: transcriptText.length, time: now });
            
            // If we already auto-inserted a pause, don't add another one
            const lastItem = transcriptRef.current[transcriptRef.current.length - 1];
            const alreadyPaused = lastItem?.isPause;
            const needsPause = transcriptRef.current.length > 0 && timeDiff > 300 && !alreadyPaused;
            
            setTranscript(prev => [
              ...prev,
              ...(needsPause ? [{ text: '', isPause: true }] : []),
              { text: transcriptText, isPause: false }
            ]);
            lastWordTimeRef.current = now;
            setInterimTextWithRef('');
            setPauseDuration(0);
          } else {
            interim += event.results[i][0].transcript;
            // Reset pause timer when interim results arrive
            lastWordTimeRef.current = Date.now();
          }
        }
        setInterimTextWithRef(interim);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setIsInitializing(false);
        setRecognitionStatus('listening');
        setError(null);
        setDebugInfo(prev => prev + " | 辨識引擎已啟動");
      };

      recognition.onaudiostart = () => {
        setDebugInfo(prev => prev + " | 正在接收音訊");
      };

      recognition.onsoundstart = () => {
        setDebugInfo(prev => prev + " | 偵測到聲音");
      };

      recognition.onspeechstart = () => {
        setDebugInfo(prev => prev + " | 偵測到說話");
      };

      recognition.onerror = (event: any) => {
        const errorType = String(event.error || '').toLowerCase();
        console.error("SpeechRecognition error:", event.error, event);
        setDebugInfo(prev => prev + ` | 辨識錯誤: ${event.error}`);
        setRecognitionStatus('error');
        
        const isFatal = errorType.includes('not-allowed') || errorType.includes('service-not-allowed') || errorType.includes('blocked');
        
        if (isFatal) {
          setError(errorType.includes('not-allowed') ? '請允許瀏覽器存取麥克風。' : `辨識錯誤: ${event.error}`);
          shouldBeListeningRef.current = false;
          setIsListening(false);
          setIsInitializing(false);
          stopVolumeMonitoring();
        }
      };

      recognition.onend = () => {
        if (shouldBeListeningRef.current) {
          setTimeout(() => {
            if (shouldBeListeningRef.current) {
              try {
                recognition.start();
              } catch (e) {
                if (!(e instanceof Error && e.message.includes('already started'))) {
                  console.error('Failed to restart recognition:', e);
                }
              }
            }
          }, 100);
        } else {
          setIsListening(false);
          setIsInitializing(false);
          setRecognitionStatus('idle');
          stopVolumeMonitoring();
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError('您的瀏覽器不支援語音辨識功能，請使用 Chrome 瀏覽器。');
    }

    return () => {
      shouldBeListeningRef.current = false;
      recognitionRef.current?.stop();
      stopVolumeMonitoring();
    };
  }, [language]);

  const toggleListening = async () => {
    if (isListening || isInitializing) {
      shouldBeListeningRef.current = false;
      recognitionRef.current?.stop();
      stopVolumeMonitoring();
    } else {
      try {
        setIsInitializing(true);
        setRecognitionStatus('starting');
        setError(null);
        
        const constraints = selectedDeviceId 
          ? { audio: { deviceId: { exact: selectedDeviceId } } }
          : { audio: true };
          
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        // 使用預載的 VAD 資源（preloadVAD 可能已在背景完成）
        try {
          setDebugInfo(prev => prev + "\n正在初始化語音偵測...");

          // 等待預載完成（通常已經完成，幾乎不需要等待）
          await preloadVAD();

          const MicVAD = window.vad?.MicVAD;
          if (!MicVAD) throw new Error("MicVAD not found");

          const modelBuffer = window.__vadModelBuffer;
          if (!modelBuffer) throw new Error("VAD model not cached");

          const vadInstance = await MicVAD.new({
            model: modelBuffer,
            workletURL: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.24/dist/vad.worklet.bundle.min.js",
            onSpeechStart: () => {
              setIsSpeaking(true);
              const now = Date.now();
              lastWordTimeRef.current = now;
              
              // VAD Recovery: If speech starts but recognition isn't listening, try to kick it
              if (shouldBeListeningRef.current && recognitionStatus !== 'listening') {
                console.log("VAD Recovery: Speech detected but recognition idle. Starting...");
                try { recognitionRef.current?.start(); } catch(e) {}
              }
            },
            onSpeechEnd: () => {
              setIsSpeaking(false);
              // Flush lingering interim results if speech has ended
              setTimeout(() => {
                if (shouldBeListeningRef.current && interimTextRef.current) {
                  console.log("Flushing interim results via restart...");
                  recognitionRef.current?.stop();
                }
              }, 800);
            },
          });
          vadRef.current = vadInstance;
          vadInstance.start();
          setDebugInfo(prev => prev + "\nSilero VAD initialized successfully.");
        } catch (vadError: any) {
          console.warn("Silero VAD failed to load:", vadError);
          setDebugInfo(prev => prev + `\nVAD Error: ${vadError.message || 'Unknown error'}. Falling back to volume detection.`);
          // We don't throw here, so the app continues with volume-based detection
        }

        await startVolumeMonitoring(stream);

        setTranscript([]);
        setInterimTextWithRef('');
        lastWordTimeRef.current = Date.now();
        shouldBeListeningRef.current = true;
        recognitionRef.current?.start();

        // 🌟 新增：看門狗機制 (Watchdog)
        // 如果 5 秒後 isInitializing 還是 true（代表 onstart 沒被觸發），就強制報錯
        setTimeout(() => {
          setIsInitializing(prev => {
            if (prev) {
              console.warn("語音辨識 API 連線逾時");
              try { recognitionRef.current?.abort(); } catch(e) {}
              setError('無法連接語音伺服器。請檢查防毒軟體、公司防火牆是否阻擋，或關閉佔用麥克風的其他程式 (如 Discord)。');
              shouldBeListeningRef.current = false;
              stopVolumeMonitoring();
              return false; // 強制關閉初始化狀態
            }
            return prev;
          });
        }, 5000);

      } catch (e: any) {
        // ... 原本的 catch 邏輯
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="bg-slate-900 p-8 rounded-2xl min-h-[260px] flex flex-col gap-4 shadow-inner border-4 border-slate-800 relative overflow-hidden">
          {error && (
            <div className="absolute inset-0 bg-red-900/90 z-20 flex flex-col items-center justify-center p-4 text-center">
              <p className="text-white font-bold mb-2">{error}</p>
              <button onClick={() => setError(null)} className="px-4 py-1 bg-white text-red-900 rounded-full text-xs font-bold shadow-lg">重試</button>
            </div>
          )}
          
          <div className="flex-1 flex flex-col justify-end gap-3 relative z-10 overflow-hidden min-h-[160px]">
            {transcript.length === 0 && !interimText && !isListening && !isInitializing && !error && (
              <div className="w-full text-center space-y-4 py-4">
                <span className="text-slate-500 italic block">點擊下方麥克風開始測試您的停頓...</span>
                <div className="flex flex-col items-center gap-4">
                  {devices.length > 0 && (
                    <div className="inline-block text-left bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">選擇輸入裝置</label>
                      <select 
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="bg-slate-900 text-slate-300 text-xs rounded border border-slate-600 px-2 py-1 outline-none focus:border-indigo-500 w-48"
                      >
                        {devices.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>{d.label || `麥克風 ${d.deviceId.slice(0, 5)}...`}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="inline-block text-left bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">辨識語言</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-slate-900 text-slate-300 text-xs rounded border border-slate-600 px-2 py-1 outline-none focus:border-indigo-500 w-48"
                    >
                      <option value="zh-TW">繁體中文 (台灣)</option>
                      <option value="zh-CN">简体中文 (中国)</option>
                      <option value="en-US">English (US)</option>
                      <option value="ja-JP">日本語</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {isInitializing && transcript.length === 0 && (
              <div className="w-full text-center py-4">
                <span className="text-indigo-400 animate-pulse font-bold">正在建立連線...</span>
              </div>
            )}
            {(() => {
              const extraLines = (interimText ? 1 : 0) + (pauseDuration > 0.3 ? 1 : 0);
              const transcriptLimit = Math.max(0, 4 - extraLines);
              return transcript.slice(-transcriptLimit).map((item, i) => (
                <React.Fragment key={i}>
                  {item.isPause ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center">
                      <PauseCircle className="text-indigo-400" size={24} />
                      <span className="text-[10px] text-indigo-500/50 ml-2 font-mono uppercase">Pause detected</span>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-white text-xl font-medium leading-tight">
                      {item.text}
                    </motion.div>
                  )}
                </React.Fragment>
              ));
            })()}
            {interimText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-indigo-300 text-xl font-medium opacity-70">
                {interimText}
              </motion.div>
            )}
            {pauseDuration > 0.3 && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 w-fit"
              >
                <PauseCircle className="text-indigo-400 animate-pulse" size={20} />
                <span className="text-indigo-300 text-xs font-mono font-bold">
                  停頓中 {pauseDuration.toFixed(1)}s
                </span>
              </motion.div>
            )}

            {/* Real-time CPM display below transcript */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="text-emerald-400" size={16} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">實時語速</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">{currentRate}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">CPM</span>
              </div>
            </div>
          </div>

          {(isListening || isInitializing) && (
            <div className="mt-auto relative z-10">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={60} 
                className="w-full h-12 rounded-lg bg-slate-950/50 mb-2 border border-slate-800"
              />
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500"
                      animate={{ width: `${Math.min(100, volume)}%` }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-200",
                      isSpeaking ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" : 
                      volume > 5 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-700"
                    )} />
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter flex items-center gap-1">
                      {isSpeaking && <Activity size={10} className="animate-pulse" />}
                      {recognitionStatus === 'listening' ? (isSpeaking ? "偵測到人聲" : "辨識中") : "準備中"}
                      <span className="opacity-30 ml-1">[{heartbeat}]</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={toggleListening}
            disabled={isInitializing}
            className={cn(
              "group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 shadow-2xl",
              isListening 
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/40 scale-110" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40 hover:scale-105",
              isInitializing && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-20",
              isListening ? "bg-red-400" : "bg-indigo-400",
              !isListening && "hidden"
            )} />
            {isListening ? (
              <div className="w-5 h-5 bg-white rounded-sm group-hover:scale-90 transition-transform" />
            ) : (
              <Mic className="text-white group-hover:scale-110 transition-transform" size={28} />
            )}
          </button>
          <span className={cn(
            "text-[10px] font-bold tracking-widest uppercase transition-colors duration-300",
            isListening ? "text-red-400" : "text-indigo-400"
          )}>
            {isInitializing ? "初始化中..." : isListening ? "正在監控" : "點擊開啟麥克風"}
          </span>
        </div>
      </div>
    </div>
  );
});

LivePauseDemo.displayName = 'LivePauseDemo';

const speedData = [
  { time: 0, speed: 180 },
  { time: 1, speed: 175 },
  { time: 2, speed: 190 },
  { time: 3, speed: 120 }, // Slow down for emphasis
  { time: 4, speed: 110 },
  { time: 5, speed: 170 },
  { time: 6, speed: 185 },
];

export const SpeedChart = ({ data = [] }: { data?: { time: string; rate: number }[] }) => (
  <div className="h-64 w-full bg-white p-4 rounded-xl border border-slate-200">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.length > 0 ? data : speedData.map(d => ({ time: d.time.toString(), rate: d.speed }))}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" label={{ value: '時間', position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: '語速 (CPM)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
    <p className="text-center text-xs text-slate-500 mt-2">
      {data.length > 0 ? "這是您在上一頁測試時的語速變化" : "語速下降處通常是您強調重點的時刻"}
    </p>
  </div>
);

export const VolumeMeter = () => {
  const [isListening, setIsListening] = React.useState(false);
  const [volume, setVolume] = React.useState(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyzerRef = React.useRef<AnalyserNode | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationRef = React.useRef<number | null>(null);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize to 0-100, with some sensitivity adjustment
        const normalizedVolume = Math.min(100, (average / 128) * 100 * 1.5);
        setVolume(normalizedVolume);
        animationRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("無法存取麥克風，請檢查權限設定。");
    }
  };

  const stopMonitoring = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setVolume(0);
  };

  React.useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-10 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl">
      <div className="w-full space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h4 className="text-white font-bold flex items-center gap-2">
              <Activity className="text-indigo-400" size={18} />
              實時音量分析
            </h4>
            <p className="text-slate-400 text-xs">嘗試將音量保持在綠色「自信區間」</p>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-3xl font-black font-mono transition-colors duration-300",
              volume > 80 ? "text-red-500" : volume > 50 ? "text-emerald-400" : "text-slate-500"
            )}>
              {Math.round(volume)}
            </span>
            <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-tighter">dB Level</span>
          </div>
        </div>

        <div className="relative w-full h-12 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-1">
          {/* Background Zones */}
          <div className="absolute inset-0 flex px-1 py-1 gap-1 opacity-10">
            <div className="flex-[6] bg-slate-400 rounded-l-xl" />
            <div className="flex-[2] bg-emerald-400" />
            <div className="flex-[2] bg-red-400 rounded-r-xl" />
          </div>

          {/* Active Meter */}
          <motion.div 
            className={cn(
              "h-full rounded-xl transition-colors duration-200",
              volume > 80 ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" : 
              volume > 50 ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-indigo-500"
            )}
            animate={{ width: `${Math.max(2, volume)}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
          />
          
          {/* Markers */}
          <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-white/20 z-10" />
          <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-white/20 z-10" />
        </div>

        <div className="flex justify-between w-full text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">
          <span>低沉</span>
          <span className="text-emerald-500/80">自信區間</span>
          <span>過大</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={isListening ? stopMonitoring : startMonitoring}
          className={cn(
            "group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-500 shadow-2xl",
            isListening 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/40 scale-110" 
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40 hover:scale-105"
          )}
        >
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-20",
            isListening ? "bg-red-400" : "bg-indigo-400",
            !isListening && "hidden"
          )} />
          {isListening ? (
            <div className="w-6 h-6 bg-white rounded-sm group-hover:scale-90 transition-transform" />
          ) : (
            <Mic className="text-white group-hover:scale-110 transition-transform" size={32} />
          )}
        </button>
        <span className={cn(
          "text-xs font-bold tracking-widest uppercase transition-colors duration-300",
          isListening ? "text-red-400" : "text-indigo-400"
        )}>
          {isListening ? "正在監測音量" : "點擊開啟麥克風"}
        </span>
      </div>
    </div>
  );
};
