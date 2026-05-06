import React from 'react';
import { TeachingModule } from '../types';
import { LivePauseDemo, SpeedChart, VolumeMeter } from '../components/Visualizations';
import { PyramidPrinciple } from '../components/PyramidPrinciple';

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
    id: 'structure',
    title: '結構思考力 (Structure)',
    pages: [
      {
        title: '金字塔原理',
        content: '結構化溝通的核心法則：結論先行、以上統下、歸類分組、邏輯遞進。點選金字塔的每一層，深入了解各個原則。',
        visualization: <PyramidPrinciple />
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