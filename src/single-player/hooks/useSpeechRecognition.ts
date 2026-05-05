import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechGrammarList: any;
    webkitSpeechGrammarList: any;
  }
}

export function useSpeechRecognition(keywords: string[] = []) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-TW';

    // Boost probabilities for specific contextual keywords if GrammarList is supported
    if (SpeechGrammarList && keywords.length > 0) {
      try {
        const grammar = '#JSGF V1.0; grammar contextWords; public <contextWord> = ' + keywords.join(' | ') + ' ;';
        const speechRecognitionList = new SpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
      } catch(e) {
        console.warn("SpeechGrammarList error:", e);
      }
    }

    recognition.onresult = (event: any) => {
      let currentFull = '';
      for (let i = 0; i < event.results.length; ++i) {
        currentFull += event.results[i][0].transcript;
      }
      setTranscript(currentFull);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        if (event.error === 'not-allowed') {
          setError('麥克風權限被阻擋。請嘗試「在新分頁中開啟」，並確認網址列旁的麥克風圖示為允許。');
        } else {
          setError(`語音辨識錯誤: ${event.error}`);
        }
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startRecording = useCallback(async () => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      // 主動獲取麥克風權限以確保能觸發瀏覽器的授權彈出視窗
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("啟動收音失敗或拒絕授權", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('麥克風權限被阻擋。請嘗試點擊預覽區上方的「在新分頁中開啟」，並確認網址列旁的麥克風圖示為「允許」。');
      } else {
        setError(`麥克風錯誤: ${err.message || '無法啟動收音'}`);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error(err);
    }
  }, []);

  return { isRecording, transcript, startRecording, stopRecording, error, isSupported };
}
