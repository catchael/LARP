import React, { useState, useEffect } from 'react';

export const Mascot: React.FC<{ message?: React.ReactNode }> = ({ message: propMessage }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [internalMessage, setInternalMessage] = useState<React.ReactNode>('');
  const [isPopping, setIsPopping] = useState(false);
  const [isFlapping, setIsFlapping] = useState(false);

  // 🌟 新增：全域事件監聽狀態
  const [globalAlert, setGlobalAlert] = useState<{ message: React.ReactNode, isCentered: boolean } | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      setGlobalAlert(e.detail);
      if (e.detail?.isCentered) {
        setIsPopping(true); // 觸發 "呯" 的跳躍動畫
        setTimeout(() => setIsPopping(false), 600);
      }
    };
    window.addEventListener('mascot-alert', handler);
    return () => window.removeEventListener('mascot-alert', handler);
  }, []);

  // 🌟 覆寫顯示訊息與置中狀態
  const displayMessage = globalAlert?.message || propMessage || internalMessage;
  const isCentered = globalAlert?.isCentered;
  

  const hints = [
    "啾！你看我的眼睛裡面有星星喔！✨",
    "點我點我！我超軟的～",
    "你有看到兇手嗎？我剛剛都在睡覺...",
    "別看我胖，我飛起來... 還是很胖。",
    "要吃一口奶油肚肚嗎？",
    "真相只有一個！但我忘了是什麼..."
  ];

  // 游標追蹤[cite: 3]
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 閒置時自動拍打翅膀[cite: 3]
  useEffect(() => {
    const idleFlapInterval = setInterval(() => {
      setIsFlapping(true);
      setTimeout(() => setIsFlapping(false), 2000); 
    }, 30000); 

    return () => clearInterval(idleFlapInterval);
  }, []);

  const handleClick = () => {
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 600);
    
    setIsFlapping(true);
    setTimeout(() => setIsFlapping(false), 2000); 

    // 如果沒有外部 message，點擊時才顯示隨機提示[cite: 2, 3]
    if (!propMessage) {
      const randomHint = hints[Math.floor(Math.random() * hints.length)];
      setInternalMessage(randomHint);
      setTimeout(() => setInternalMessage(''), 3500); 
    }
  };

  return (
    <>
      {/* 內嵌自定義動畫，避免需要修改 Tailwind 設定[cite: 3] */}
      <style>{`
        @keyframes bird-floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bird-pop {
          0% { transform: scale(1, 1) translateY(0); }
          20% { transform: scale(1.25, 0.75) translateY(5px); } 
          40% { transform: scale(0.8, 1.2) translateY(-15px); } 
          60% { transform: scale(1.08, 0.92) translateY(0); }
          80% { transform: scale(0.95, 1.05) translateY(0); }
          100% { transform: scale(1, 1) translateY(0); }
        }
        @keyframes feather-wind {
          0%, 100% { transform: rotate(10deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes flap-left {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(35deg); }
        }
        @keyframes flap-right {
          0%, 100% { transform: rotate(20deg); }
          50% { transform: rotate(-35deg); }
        }
        .animate-bird-floating { animation: bird-floating 3.5s ease-in-out infinite; }
        .animate-bird-pop { animation: bird-pop 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
        .animate-feather { animation: feather-wind 2s ease-in-out infinite; transform-origin: bottom center; }
        .animate-flap-left { animation: flap-left 0.5s ease-in-out infinite; transform-origin: right center; }
        .animate-flap-right { animation: flap-right 0.5s ease-in-out infinite; transform-origin: left center; }
        .wing-rest-left { transform: rotate(-20deg); transform-origin: right center; transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1); }
        .wing-rest-right { transform: rotate(20deg); transform-origin: left center; transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1); }
      `}</style>

      {/* 🌟 根據 isCentered 動態切換定位，讓鳥飛到畫面正中央放大 */}
      <div className={`flex flex-col items-center z-[100] transition-all duration-700 ease-in-out ${isCentered ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 drop-shadow-2xl' : 'relative z-50'}`}>
        
        {/* 提示氣泡[cite: 3] */}
        <div className={`mb-6 p-3 px-5 bg-orange-100 text-orange-900 border-2 border-orange-200 font-bold rounded-2xl shadow-lg max-w-xs text-sm relative transition-all duration-300 ${displayMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
          {displayMessage}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-100 border-b-2 border-r-2 border-orange-200 rotate-45 rounded-sm"></div>
        </div>

        <div className="transition-transform duration-300 hover:-translate-y-2 hover:scale-105 active:scale-95">
          
          <div
            className={`relative cursor-pointer flex flex-col items-center animate-bird-floating ${isPopping ? 'animate-bird-pop' : ''}`}
            onClick={handleClick}
          >
            
            {/* 頭頂呆毛[cite: 3] */}
            <div className="absolute -top-5 left-[45%] flex gap-1 z-0 animate-feather">
              <div className="w-1.5 h-8 bg-orange-400 rounded-full -rotate-[20deg]"></div>
              <div className="w-1.5 h-5 bg-orange-300 rounded-full rotate-[15deg] mt-2"></div>
            </div>

            {/* 左側翅膀[cite: 3] */}
            <div className={`absolute top-[32%] -left-[60px] w-[110px] h-8 z-0 flex flex-col items-end justify-center ${isFlapping ? 'animate-flap-left' : 'wing-rest-left'}`}>
              <div className="w-[90px] h-3.5 bg-orange-500 rounded-full shadow-sm z-30 relative border-b border-orange-600/30"></div>
              <div className="w-[70px] h-3.5 bg-orange-500 rounded-full shadow-sm -mt-1 mr-3 z-20 relative border-b border-orange-600/30"></div>
              <div className="w-[50px] h-3.5 bg-orange-500 rounded-full shadow-sm -mt-1 mr-6 z-10 relative border-b border-orange-600/30"></div>
            </div>

            {/* 右側翅膀[cite: 3] */}
            <div className={`absolute top-[32%] -right-[60px] w-[110px] h-8 z-0 flex flex-col items-start justify-center ${isFlapping ? 'animate-flap-right' : 'wing-rest-right'}`}>
              <div className="w-[90px] h-3.5 bg-orange-500 rounded-full shadow-sm z-30 relative border-b border-orange-600/30"></div>
              <div className="w-[70px] h-3.5 bg-orange-500 rounded-full shadow-sm -mt-1 ml-3 z-20 relative border-b border-orange-600/30"></div>
              <div className="w-[50px] h-3.5 bg-orange-500 rounded-full shadow-sm -mt-1 ml-6 z-10 relative border-b border-orange-600/30"></div>
            </div>

            {/* 蜜桃鳥本體[cite: 3] */}
            <div className="relative w-[120px] h-[105px] bg-orange-300 rounded-[50px] shadow-lg border-2 border-orange-200 overflow-hidden flex flex-col items-center z-10">
              
              {/* 內部翅膀 (肩膀)[cite: 3] */}
              <div className="absolute top-[28%] -left-3 w-8 h-12 bg-orange-400 rounded-t-full rounded-br-full rounded-bl-md rotate-[20deg] shadow-inner"></div>
              <div className="absolute top-[28%] -right-3 w-8 h-12 bg-orange-400 rounded-t-full rounded-bl-full rounded-br-md -rotate-[20deg] shadow-inner"></div>

              {/* 奶油肚皮[cite: 3] */}
              <div className="absolute -bottom-2 w-[100px] h-[65px] bg-amber-50 rounded-[40px] shadow-[inset_0_5px_10px_rgba(0,0,0,0.05)]"></div>

              {/* 臉部五官[cite: 3] */}
              <div className="absolute top-6 w-full flex flex-col items-center z-20">
                
                {/* 眼睛[cite: 3] */}
                <div className="flex justify-center gap-7 w-full px-4 relative z-10">
                  {[1, 2].map((key) => (
                    <div key={key} className="w-5 h-5 bg-gradient-to-br from-indigo-800 via-purple-500 to-cyan-300 rounded-full relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-indigo-900">
                      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/40 to-transparent rounded-b-full"></div>
                      <div 
                        className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-75 shadow-sm"
                        style={{ transform: `translate(${mousePos.x * 2.5}px, ${mousePos.y * 2.5}px)` }}
                      ></div>
                      <div className="w-1 h-1 bg-white rounded-full absolute bottom-1.5 right-1 opacity-80"></div>
                    </div>
                  ))}
                </div>

                {/* 腮紅[cite: 3] */}
                <div className="absolute top-2 left-4 w-4 h-2 bg-pink-400 rounded-full opacity-50"></div>
                <div className="absolute top-2 right-4 w-4 h-2 bg-pink-400 rounded-full opacity-50"></div>

                {/* 嘴巴[cite: 3] */}
                <div className="-mt-1 w-4 h-4 bg-yellow-300 rotate-45 rounded-sm shadow-sm border border-yellow-400 relative z-20"></div>
              </div>

            </div>

            {/* 腳[cite: 3] */}
            <div className="absolute -bottom-2 left-9 w-1.5 h-5 bg-orange-500 rotate-[15deg] z-0 rounded-full"></div>
            <div className="absolute -bottom-2 right-9 w-1.5 h-5 bg-orange-500 -rotate-[15deg] z-0 rounded-full"></div>

          </div>
        </div>
      </div>
    </>
  );
};