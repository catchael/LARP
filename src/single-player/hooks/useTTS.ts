import { useState, useCallback, useEffect } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }
    
    // Stop any currently playing audio
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Define the language
    utterance.lang = 'zh-TW';
    
    // Attempt to get a Chinese voice, prefer TW/HK over CN
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = 
      voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-HK')) || 
      voices.find(v => v.lang.includes('zh-CN')) || 
      voices.find(v => v.lang.includes('zh'));
      
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    // Slightly adjust pitch to simulate NPC voice, but keep it clear
    utterance.pitch = 0.95; 
    utterance.rate = 1.05;

    // Set state correctly on start and end
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Make sure to stop when unmounting
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Handle voice initialization (fixes issue where voices are empty on load in Chrome)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return { speak, stop, isSpeaking };
}
