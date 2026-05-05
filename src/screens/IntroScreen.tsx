import React from 'react';
import { motion } from 'motion/react';
import { Mascot } from '../components/Mascot';
import { ClipboardList, BookOpen, ArrowDown, Play, Star } from 'lucide-react';
import { AppPhase } from '../types';

interface IntroScreenProps {
  setPhase: (phase: AppPhase) => void;
  isNewUser?: boolean; // 👈 新增這個屬性來接收判斷
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ setPhase, isNewUser }) => {
  
  // ─────────────────────────────────────────────────────────
  // 🌟 情況 A：如果是【新用戶】，顯示 5 步驟與吉祥物的詳細流程
  // ─────────────────────────────────────────────────────────
  if (isNewUser) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center bg-slate-100/90 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-2xl w-full flex flex-col items-center py-10 my-auto"
        >
          <div className="mb-6 relative z-[60] pointer-events-auto">
            <Mascot message="啾！歡迎來到劇本殺學院！接下來的流程是：問卷 ➔ 劇本一 ➔ 問卷 ➔ 劇本二 ➔ 最終問卷。準備好了就出發吧！" />
          </div>

          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full relative z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-100/50 blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-black text-slate-800 text-center mb-8 tracking-wider">您的專屬培訓流程</h2>

            <div className="flex flex-col gap-2 mb-10 relative z-10">
              {/* Step 1 */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow hover:border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-xl font-black text-lg">1</div>
                <ClipboardList className="text-emerald-500 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="text-slate-800 font-bold text-base">初始能力評估</div>
                  <div className="text-slate-500 text-sm">填寫表達焦慮量表 (PRCA-24)</div>
                </div>
              </div>
              <ArrowDown className="text-slate-300 mx-auto" size={18} />

              {/* Step 2 */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow hover:border-indigo-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl font-black text-lg">2</div>
                <BookOpen className="text-indigo-500 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="text-slate-800 font-bold text-base">第一個劇本體驗</div>
                  <div className="text-slate-500 text-sm">遊玩《窒息地下室》並獲得 AI 報告</div>
                </div>
              </div>
              <ArrowDown className="text-slate-300 mx-auto" size={18} />

              {/* Step 3 */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow hover:border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-xl font-black text-lg">3</div>
                <ClipboardList className="text-emerald-500 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="text-slate-800 font-bold text-base">階段能力檢測</div>
                  <div className="text-slate-500 text-sm">填寫中期量表，追蹤你的進步幅度</div>
                </div>
              </div>
              <ArrowDown className="text-slate-300 mx-auto" size={18} />

              {/* Step 4 */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow hover:border-purple-100">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-xl font-black text-lg">4</div>
                <BookOpen className="text-purple-500 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="text-slate-800 font-bold text-base">第二個劇本體驗</div>
                  <div className="text-slate-500 text-sm">挑戰進階劇本《黑傘下妄想殺機》</div>
                </div>
              </div>
              <ArrowDown className="text-slate-300 mx-auto" size={18} />

              {/* Step 5 */}
              <div className="flex items-center gap-4 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow hover:border-amber-200">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 flex items-center justify-center rounded-xl font-black text-lg">
                  <Star size={20} fill="currentColor" />
                </div>
                <ClipboardList className="text-amber-500 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="text-slate-800 font-bold text-base">最終成長結算</div>
                  <div className="text-slate-500 text-sm">完成最後問卷，檢視完整的表達能力變化</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPhase('survey')} 
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Play fill="currentColor" size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <span className="relative z-10">準備好了，開始填寫初始問卷！</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 🌟 情況 B：如果是【老玩家】，顯示帶有吉祥物的淺色系歡迎畫面
  // ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full flex flex-col items-center"
      >
        {/* 🌟 召喚吉祥物並傳入專屬老玩家的歡迎詞 */}
        <div className="mb-6 relative z-[60] pointer-events-auto">
          <Mascot message="啾！歡迎回來，大偵探！準備好繼續你的推理之旅了嗎？" />
        </div>

        {/* 🌟 淺色系歡迎卡片 */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full relative z-10 overflow-hidden text-center">
          {/* 背景光暈裝飾 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-100/50 blur-3xl pointer-events-none" />

          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight relative z-10">
            歡迎回來，偵探！
          </h2>
          <p className="text-slate-500 mb-8 relative z-10 font-medium text-sm">
            劇本大廳已經為你準備好了，今天想挑戰什麼劇本呢？
          </p>

          <button
            onClick={() => setPhase('lobby')} // 🌟 點擊後直接進入大廳
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10">進入劇本大廳</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};