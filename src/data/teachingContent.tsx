import React from 'react';
import { TeachingModule } from '../types';
import { LivePauseDemo, SpeedChart, CCCFlow, VolumeMeter } from '../components/Visualizations';

export const TEACHING_CONTENT: TeachingModule[] = [
  {
    id: 'delivery',
    title: '表達風格 (Delivery)',
    pages: [
      {
        title: '停頓的力量',
        content: '適當的停頓可以讓聽眾更好的消化資訊。在關鍵詞前後停頓，能增加話語的重量感。',
        visualization: <LivePauseDemo />
      },
      {
        title: '語速掌控',
        content: '語速放慢的地方就是重點所在。實時語速監測能幫助您察覺自己是否因為緊張而過快。',
        visualization: <SpeedChart />
      }
    ]
  },
  {
    id: 'cognitive',
    title: '認知習慣 (Cognitive)',
    pages: [
      {
        title: '一次完成一個想法',
        content: '如果一次性傳達太多不同的資訊，聽眾會分心。確保每個觀點都有明確的起頭與結束。',
        visualization: (
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
            <p className="text-emerald-800 font-medium mb-2">範例：</p>
            <p className="text-slate-700 italic">「首先，關於不在場證明... (結束)。接著，我們來看動機...」</p>
          </div>
        )
      },
      {
        title: 'CCC 溝通框架',
        content: 'Context (背景) - Core (核心) - Connect (連結)。這是一個強大的邏輯架構。',
        visualization: <CCCFlow />
      }
    ]
  },
  {
    id: 'vocal',
    title: '聲音訓練 (Vocal)',
    pages: [
      {
        title: '音量提升',
        content: '適度提升音量能確保您的存在感。在劇本殺中，自信的聲音往往能引導討論的方向。',
        visualization: <VolumeMeter />
      }
    ]
  }
];