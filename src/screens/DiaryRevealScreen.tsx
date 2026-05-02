import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, BookOpen } from 'lucide-react';
import { cn } from '../types';

interface DiaryRevealScreenProps {
  diaryTitle?: string;
  pages: { title: string; content: string; highlight?: boolean }[];
  isMeReady?: boolean;
  onComplete: () => void;
}

type Step = 'reading' | 'modal' | 'peek';

export const DiaryRevealScreen: React.FC<DiaryRevealScreenProps> = ({
  diaryTitle = "河女的生前日記",
  pages,
  isMeReady,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>('reading');
  const [currentSheet, setCurrentSheet] = useState(0);
  const totalSheets = 4; // 100% 還原 HTML 版本，固定 4 張紙

  const turnNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSheet < totalSheets) {
      const next = currentSheet + 1;
      setCurrentSheet(next);
      // 翻閱完畢，觸發彈窗
      if (next === totalSheets) {
        setTimeout(() => setStep('modal'), 800);
      }
    }
  };

  const turnPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSheet > 0) setCurrentSheet(currentSheet - 1);
  };

  const handleModalConfirm = () => {
    setStep('peek');
    if (!isMeReady) onComplete();
  };

  const handleReopen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStep('reading');
    setCurrentSheet(totalSheets - 1); // 重新打開時，設定為最後一頁
  };

  // 100% 還原原本 HTML 版本的位移與圖層邏輯[cite: 4]
  let bookTranslateClass = '';
  if (currentSheet === 0) {
    bookTranslateClass = '-translate-x-1/4'; 
  } else if (currentSheet === totalSheets) {
    bookTranslateClass = 'translate-x-1/4';  
  } else {
    bookTranslateClass = 'translate-x-0';    
  }

  const getZIndex = (sheetIndex: number) => {
    return currentSheet > sheetIndex ? 10 + sheetIndex : 40 - sheetIndex;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-stone-900 flex flex-col items-center justify-center font-serif text-stone-800 select-none overflow-hidden">
      
      {/* 100% 還原 HTML 版本的 CSS[cite: 4] */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Long+Cang&display=swap');
        
        .handwriting {
          font-family: 'Long Cang', cursive;
          color: #233142; 
          font-size: 22px;
          line-height: 36px;
          opacity: 0.95;
          letter-spacing: 0.02em;
          text-shadow: 0.2px 0.2px 0.5px rgba(35, 49, 66, 0.1);
        }
        .writing-container {
          transform: rotate(-0.5deg);
          padding-top: 2px;
        }
        .scale-wrapper {
          width: 1000px;
          height: 700px;
          transform: scale(min(calc(95vw / 1000), calc(85vh / 700), 1));
          transform-origin: center center;
        }
        .book-perspective {
          perspective: 1800px;
        }
        .book-container {
          transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
        }
        .sheet {
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1), z-index 0s 0.4s;
          transform-origin: left center;
        }
        .flipped {
          transform: rotateY(-180deg);
        }
        .face {
          backface-visibility: hidden;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .page-front {
          transform: rotateY(0deg) translateZ(1px);
        }
        .page-back {
          transform: rotateY(180deg) translateZ(1px);
        }
        .diary-paper {
          background-color: #f9f6ef;
          background-image: repeating-linear-gradient(
            transparent,
            transparent 35px,
            #d1caba 35px,
            #d1caba 36px
          );
          line-height: 36px; 
        }
        .diary-cover {
          background-color: #4a2511; 
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.4) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }
        .stitching {
          border: 2px dashed rgba(255, 255, 255, 0.15);
        }
      `}</style>

      {/* ── 背景：已收錄等待中 (Peek 模式顯示) ── */}
      <AnimatePresence>
        {step === 'peek' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-[35vh] text-center pointer-events-none z-10"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Check size={32} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2 tracking-widest">已收錄，等待其他玩家...</h3>
            <p className="text-stone-400">當所有人準備就緒，將自動推進劇情</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 頂部文字提示 (Reading 模式顯示) ── */}
      <div className={cn("absolute top-8 z-50 text-center w-full transition-opacity duration-500", step === 'peek' ? "opacity-0 pointer-events-none" : "opacity-100")}>
        <h2 className="text-stone-400 tracking-widest text-lg drop-shadow-md">
          {currentSheet === 0 ? '點擊封面翻閱線索' : currentSheet === totalSheets ? '日記已翻閱完畢，點擊左頁返回' : '點擊左右頁面進行翻閱'}
        </h2>
      </div>

      {/* ── 3D 日記本外層容器 (控制 Peek 的往下收合) ── */}
      <motion.div
        animate={step === 'peek' ? { y: '80vh', scale: 0.85 } : { y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 w-full flex justify-center"
      >
        {/* 重新查看提示 */}
        <AnimatePresence>
          {step === 'peek' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 text-white bg-indigo-600/90 backdrop-blur px-6 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center gap-2 whitespace-nowrap z-[150] cursor-pointer"
              onClick={handleReopen}
            >
              <BookOpen size={16} className="text-indigo-200" /> 點擊日記重新查看
            </motion.div>
          )}
        </AnimatePresence>

        {/* 100% 照搬 HTML 的書本結構[cite: 4] */}
        <div className="scale-wrapper flex items-center justify-center">
          <div className={`relative w-full h-full book-perspective book-container ${bookTranslateClass}`}>
            
            {/* 中間的陰影 */}
            <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-16 h-full bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none z-[100] transition-opacity duration-500", (currentSheet === 0 || currentSheet === totalSheets) ? "opacity-0" : "opacity-100")}></div>

            {/* Sheet 0：封面 & 內頁1 */}
            <div className={cn("absolute top-0 left-1/2 w-1/2 h-full sheet", currentSheet > 0 && "flipped")} style={{ zIndex: getZIndex(0) }}>
              <div className="face page-front diary-cover rounded-r-xl shadow-2xl flex flex-col items-center justify-center p-6 cursor-pointer" onClick={turnNext}>
                <div className="w-full h-full stitching rounded-lg relative flex flex-col items-center justify-center p-8">
                  <div className="absolute top-0 right-10 w-8 h-full bg-stone-900/40 shadow-xl"></div>
                  <div className="bg-yellow-50 w-72 p-8 rounded-sm shadow-[2px_2px_15px_rgba(0,0,0,0.5)] relative z-10 border border-stone-300 transform -rotate-2 hover:rotate-0 transition-transform">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-8 bg-white/40 backdrop-blur-sm rotate-2 shadow-sm"></div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-3 tracking-widest text-center border-b-2 border-stone-400 pb-3">{diaryTitle}</h1>
                    <p className="text-center text-stone-600 tracking-widest mt-3">【 警方證物 · 公開線索 】</p>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/50 to-transparent pointer-events-none rounded-l-sm"></div>
              </div>
              <DiaryPage entry={pages[0]} pageNum={1} onClick={turnPrev} isLeft={true} />
            </div>

            {/* Sheet 1：內頁2 & 內頁3 */}
            <div className={cn("absolute top-0 left-1/2 w-1/2 h-full sheet", currentSheet > 1 && "flipped")} style={{ zIndex: getZIndex(1) }}>
              <DiaryPage entry={pages[1]} pageNum={2} onClick={turnNext} isLeft={false} />
              <DiaryPage entry={pages[2]} pageNum={3} onClick={turnPrev} isLeft={true} />
            </div>

            {/* Sheet 2：內頁4 & 內頁5 */}
            <div className={cn("absolute top-0 left-1/2 w-1/2 h-full sheet", currentSheet > 2 && "flipped")} style={{ zIndex: getZIndex(2) }}>
              <DiaryPage entry={pages[3]} pageNum={4} onClick={turnNext} isLeft={false} />
              <DiaryPage entry={pages[4]} pageNum={5} onClick={turnPrev} isLeft={true} />
            </div>

            {/* Sheet 3：內頁6 & 封底 */}
            <div className={cn("absolute top-0 left-1/2 w-1/2 h-full sheet", currentSheet > 3 && "flipped")} style={{ zIndex: getZIndex(3) }}>
              <DiaryPage entry={pages[5]} pageNum={6} onClick={turnNext} isLeft={false} />
              <div className="face page-back diary-cover rounded-l-xl shadow-2xl flex flex-col items-center justify-center p-6 cursor-pointer" onClick={turnPrev}>
                <div className="w-full h-full stitching rounded-lg relative">
                  <div className="absolute top-0 left-10 w-8 h-full bg-stone-900/40 shadow-xl"></div>
                </div>
                <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none rounded-r-sm"></div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* ── 確認收錄彈窗 (Step C) ── */}
      <AnimatePresence>
        {step === 'modal' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl max-w-xs w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">已收入筆記本-資訊</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">這份重要的資訊已保存，<br/>你隨時可以前往筆記本重新查看。</p>
              <button
                onClick={handleModalConfirm}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
              >
                確認
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// 100% 照搬 HTML 版本的文字渲染元件[cite: 4]
const DiaryPage = ({ entry, pageNum, onClick, isLeft }: { entry: any, pageNum: number, onClick: any, isLeft: boolean }) => {
  // 防呆：如果沒有內容，就顯示空白筆記本頁面
  if (!entry) {
    return (
      <div 
        className={cn(
          "face diary-paper cursor-pointer",
          isLeft ? "page-back rounded-l-xl border-r border-stone-300" : "page-front rounded-r-xl border-l border-stone-300"
        )}
        onClick={onClick}
      />
    );
  }

  return (
    <div 
      className={cn(
        "face diary-paper shadow-inner px-12 pt-14 pb-10 cursor-pointer",
        isLeft ? "page-back rounded-l-xl border-r border-stone-300" : "page-front rounded-r-xl border-l border-stone-300"
      )}
      onClick={onClick}
    >
      <div className="writing-container">
        <div className="mb-4 inline-block handwriting">
          <span className={cn("border-b border-stone-400/40 font-bold", entry.highlight ? "text-red-900" : "")}>
            {entry.title}
          </span>
        </div>
        <p 
          className="handwriting text-left"
          dangerouslySetInnerHTML={{ __html: entry.content }} 
        />
      </div>
      
      <div className={cn("absolute bottom-6 text-stone-400 font-sans text-[10px] tracking-tighter opacity-60", isLeft ? "left-10" : "right-10")}>
        - {pageNum} -
      </div>
    </div>
  );
};