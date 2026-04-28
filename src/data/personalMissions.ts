// ═══════════════════════════════════════════════════════════
// 個人任務與起始線索（按角色名稱對應）
// ═══════════════════════════════════════════════════════════

import {
  Smartphone,
  Cigarette,
  Flame,
  Key,
  Camera,
  Video,
  Hammer,
  Cable,
  Newspaper,
  FlaskConical,
  FileText,
  Crosshair,
  Sword,
  Notebook,
} from 'lucide-react';
import { Evidence } from '../gameData';

export interface PersonalMission {
  mainTasks: string[];
  hiddenTasks: string[];
  hiddenTaskNote?: string;
  initialClues: Evidence[];
}

// 起始線索是隨身攜帶的物品，沒有地圖座標，所以 x/y 統一給 0
const OFFMAP = { x: 0, y: 0 };

export const PERSONAL_MISSIONS: Record<string, PersonalMission> = {
  // ─── 張警衛 ────────────────────────────────────────────
  '張警衛': {
    mainTasks: [
      '隱藏殺手身分：絕不能讓任何人發現是你殺了崔製作人，更不能暴露你就是十年前的連環殺人魔。',
      '嫁禍給其他人。',
    ],
    hiddenTasks: [
      '死守「搬器材」的謊言：如果你被逼問「為什麼要在深夜來這裡」，你必須咬死「崔製作人是口頭/傳訊息叫我來搬東西的」這個藉口。如果有人發現了你在 1 樓藏的筆電，你也要堅稱那不是你的私人物品！',
      '合理解釋「地下室的菸蒂」與「洗手台的砂土」：這是你今晚最大的兩個破綻！如果有人搜出地下室角落那根屬於你的菸蒂，你必須臨場編造一個完美的謊言！總之，把水攪渾，把髒水全潑到別人身上，是你唯一的生路！',
    ],
    initialClues: [
      {
        id: 'guard_initial_text_screenshot',
        name: '簡訊截圖（假的）',
        brief: '偽造的對話訊息',
        details: '只是一張你用電腦合成的對話，有著崔製作人請你搬器材的訊息。',
        icon: Smartphone,
        ...OFFMAP,
      },
      {
        id: 'guard_initial_cigarettes',
        name: '一包某牌的廉價紙菸',
        brief: '你最習慣抽的菸',
        details: '某牌的廉價紙菸，是你最習慣抽的牌子。',
        icon: Cigarette,
        ...OFFMAP,
      },
      {
        id: 'guard_initial_lighter',
        name: '打火機',
        brief: '已經有些破碎的塑膠打火機',
        details: '塑膠打火機，已經有些破碎。',
        icon: Flame,
        ...OFFMAP,
      },
      {
        id: 'guard_initial_keys',
        name: '警衛室鑰匙',
        brief: '電視台警衛室的鑰匙',
        details: '電視台警衛室的鑰匙。',
        icon: Key,
        ...OFFMAP,
      },
      {
        id: 'guard_initial_props',
        name: '拍攝道具',
        brief: '偽裝成攝製組的道具',
        details: '為了偽裝你是來拍攝的，所以你帶了一些拍攝道具。',
        icon: Camera,
        ...OFFMAP,
      },
    ],
  },

  // ─── 拾荒者 ────────────────────────────────────────────
  '拾荒者': {
    mainTasks: [
      '洗清自己的嫌疑：現場的所有證據都對你極度不利！你必須拼命證明自己「真的只是來撿破爛的」，並幫忙找出真正的兇手！',
    ],
    hiddenTaskNote: '極度危險！你的生存關鍵！',
    hiddenTasks: [
      '被懷疑：大家在地下室搜到了一個「平價香菸的菸蒂」，並懷疑那是你抽的，你必須想辦法證明那不是你抽的。',
    ],
    initialClues: [
      {
        id: 'scavenger_initial_crowbar',
        name: '一把沉重的鐵撬',
        brief: '生鏽到快要斷掉的鐵撬',
        details: '已經生鏽到快要斷掉。',
        icon: Hammer,
        ...OFFMAP,
      },
      {
        id: 'scavenger_initial_rope',
        name: '一綑粗糙的尼龍繩',
        brief: '綁廢棄物用的尼龍繩',
        details: '綁廢棄物用。',
        icon: Cable,
        ...OFFMAP,
      },
      {
        id: 'scavenger_initial_pipe',
        name: '木製菸斗與菸草',
        brief: '破舊的木製菸斗',
        details: '破舊的木製菸斗與半袋劣質菸草。',
        icon: Cigarette,
        ...OFFMAP,
      },
      {
        id: 'scavenger_initial_newspaper',
        name: '一張報紙',
        brief: '被飛鏢射得千瘡百孔的舊報紙',
        details: '被飛鏢射得千瘡百孔的報紙，上面是崔製作人的照片。',
        icon: Newspaper,
        ...OFFMAP,
      },
    ],
  },

  // ─── 李隊長 ────────────────────────────────────────────
  '李隊長': {
    mainTasks: [
      '查出殺死崔製作人的真兇：身為警察，你擁有主導審問的權威。你必須找出今晚殺害崔製作人的兇手！',
    ],
    hiddenTasks: [
      '保護非法物證：你的公事包裡藏著你偷來的「過期檢體」。如果被人搜查出來，你不但會立刻被拔除警察身分，更會被眾人懷疑你今晚是帶著物證來找崔製作人「殺人滅口」的。',
    ],
    initialClues: [
      {
        id: 'captain_initial_text_screenshot',
        name: '簡訊截圖',
        brief: '崔製作人傳來的訊息',
        details: '崔製作人要你今晚帶著那份「實體檢體」來新亭洞的地下室，並且要你提前將 DNA 檢測報告的副本轉交給他。',
        icon: Smartphone,
        ...OFFMAP,
      },
      {
        id: 'captain_initial_specimen',
        name: '實驗檢體',
        brief: '嫌犯的過期檢體',
        details: '嫌犯的過期檢體，是你私下從證物庫裡偷出來的。',
        icon: FlaskConical,
        ...OFFMAP,
      },
      {
        id: 'captain_initial_report',
        name: '檢體報告',
        brief: '醫院出具的 DNA 檢體報告',
        details: '醫院那邊拿到的檢體報告。',
        icon: FileText,
        ...OFFMAP,
      },
      {
        id: 'captain_initial_gun',
        name: '一把槍跟手銬',
        brief: '警察必需品',
        details: '一把槍跟手銬，警察必需品。',
        icon: Crosshair,
        ...OFFMAP,
      },
    ],
  },

  // ─── 節目助理 ──────────────────────────────────────────
  '節目助理': {
    mainTasks: [
      '找出殺害姊姊的真兇：那個十年前的連環殺人魔就在現場！仔細搜查現場的每一個角落，任何蛛絲馬跡都不能放過。',
    ],
    hiddenTaskNote: '絕對不能被發現',
    hiddenTasks: [
      '隱藏你的殺意與凶器：絕對不能讓別人發現你背包裡的「折疊獵刀」和筆記本裡的「殺人預告」！現場已經死人了，如果你帶著凶器和殺機的事被曝光，其他人絕對會聯手把你當成頭號嫌疑犯！',
    ],
    initialClues: [
      {
        id: 'assistant_initial_text_screenshot',
        name: '簡訊截圖',
        brief: '崔製作人傳給你的關鍵訊息',
        details:
          '崔製作人傳給你的訊息：「我找到十年前那個連環殺手了，也拿到了致命證據。今晚 11 點，你帶著隱藏式攝影機過來，守在暗處錄下的驗證證據的畫面。」',
        icon: Smartphone,
        ...OFFMAP,
      },
      {
        id: 'assistant_initial_knife',
        name: '折疊獵刀',
        brief: '擦得雪亮的折疊獵刀',
        details: '鋒利的折疊獵刀，被你擦得雪亮。',
        icon: Sword,
        ...OFFMAP,
      },
      {
        id: 'assistant_initial_camera',
        name: '攝影機',
        brief: '微型隱藏式攝影機',
        details: '微型隱藏式攝影機，崔製作人交待要你錄下今晚的對話。',
        icon: Video,
        ...OFFMAP,
      },
      {
        id: 'assistant_initial_notebook',
        name: '筆記本',
        brief: '寫滿十年調查心血',
        details: '寫滿你十年來追查連環殺人魔的調查心血。',
        icon: Notebook,
        ...OFFMAP,
      },
    ],
  },
};