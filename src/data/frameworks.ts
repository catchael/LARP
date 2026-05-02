// src/data/frameworks.ts
import { 
  Target, Shield, Handshake, Search, Users, LucideIcon 
} from 'lucide-react';

export interface FrameworkStep {
  name: string;
  cue: string;
}

export interface Framework {
  name: string;
  desc: string;
  steps: FrameworkStep[];
}

export interface FrameworkCategory {
  id: string;
  title: string;
  iconName: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  frameworks: Framework[];
}

export const FRAMEWORK_CATEGORIES: FrameworkCategory[] = [
  {
    id: 'accuse',
    title: '我要指控真兇 / 丟出鐵證',
    iconName: Target,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/30',
    frameworks: [
      {
        name: '致命指控 (C.I.M.A)',
        desc: '適合公審最後階段，用時間線與動機釘死嫌疑人。',
        steps: [
          { name: 'C - 確認說詞', cue: '釘死謊言：請對方再次確認他的不在場證明或藉口。' },
          { name: 'I - 戳破矛盾', cue: '揭露破綻：拖入關鍵物證，證明他的說詞有絕對矛盾。' },
          { name: 'M - 揭露動機', cue: '挖掘底牌：說明他為何需要說謊與作案（利益/仇恨）。' },
          { name: 'A - 總結指控', cue: '完成收網：給出無可辯駁的最終指控。' }
        ]
      },
      {
        name: '多維度收束 (T.R.A.C)',
        desc: '適合將零散的證據分類，拼湊出完整的陰謀。',
        steps: [
          { name: 'T - 破題定調', cue: '一句話講明你要證明的最終結論。' },
          { name: 'R - 建立預期', cue: '預告你會從哪幾個面向（如：動機、足跡、數據）來舉證。' },
          { name: 'A - 分類歸納', cue: '將你手中零散的證據放進剛才的分類中解釋。' },
          { name: 'C - 多線收束', cue: '指出這些證據最終都指向同一個真相。' }
        ]
      }
    ]
  },
  {
    id: 'defend',
    title: '我被懷疑了 / 自我辯護',
    iconName: Shield,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
    frameworks: [
      {
        name: '絕地反擊 (I.D.E.A)',
        desc: '遭到別人潑髒水或查殺時，洗清嫌疑並反咬。',
        steps: [
          { name: 'I - 表明立場', cue: '底氣十足地宣告自己的真實立場與角色。' },
          { name: 'D - 正面否認', cue: '不用廢話，第一時間堅決駁斥莫須有的指控。' },
          { name: 'E - 提出反證', cue: '利用客觀線索證明對方的指控無法成立。' },
          { name: 'A - 反向歸票', cue: '點出誣陷者在動機上的致命傷，反咬對方。' }
        ]
      },
      {
        name: '劣勢逆轉 (B.A.R.N)',
        desc: '黑歷史或丟失道具被發現時，強行解釋的補救話術。',
        steps: [
          { name: 'B - 客觀陳述', cue: '不找藉口，大方承認已被發現的不良狀況。' },
          { name: 'A - 損害說明', cue: '簡要說明原因，展現你的擔當。' },
          { name: 'R - 止血措施', cue: '立刻展示你為此準備的補救手段。' },
          { name: 'N - 逆轉行動', cue: '給出下一步計畫，將危機包裝成新的機會。' }
        ]
      }
    ]
  },
  {
    id: 'trade',
    title: '我想私聊交易 / 拉攏盟友',
    iconName: Handshake,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    frameworks: [
      {
        name: '互惠博弈 (V.E.T.O)',
        desc: '用來跟別人交換情報，或騙取關鍵道具。',
        steps: [
          { name: 'V - 確立價值', cue: '點出你手中的情報對「對方」有何急迫價值。' },
          { name: 'E - 提出交換', cue: '明確提出你需要什麼，展示這是一場雙贏。' },
          { name: 'T - 劃定底線', cue: '給予限制（如：我只跟你談，不答應我就找別人）。' },
          { name: 'O - 促成結果', cue: '引導對方立刻執行交換。' }
        ]
      },
      {
        name: '利益共同體 (C.O.R.E)',
        desc: '拉攏搖擺不定的玩家，組建臨時陣營。',
        steps: [
          { name: 'C - 共同威脅', cue: '指出如果不合作，大家即將面臨的共同敵人。' },
          { name: 'O - 確立目標', cue: '提出一個能讓雙方都獲益的短期目標。' },
          { name: 'R - 角色分配', cue: '界定各自的責任，消除對方「會被當炮灰」的疑慮。' },
          { name: 'E - 執行方針', cue: '給出立刻就能執行的第一步小行動建立信任。' }
        ]
      }
    ]
  },
  {
    id: 'interrogate',
    title: '我要盤問細節 / 抓出謊言',
    iconName: Search,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    frameworks: [
      {
        name: '交叉比對法',
        desc: '試探別人的時間線，一步步施壓逼出實情。',
        steps: [
          { name: '建立基準', cue: '請對方複述核心藉口，劃定陷阱範圍。' },
          { name: '提出質疑', cue: '點出該主張在時間、空間或情理上的不合理。' },
          { name: '拋出鐵證', cue: '拿出確實的情報打臉虛假說詞。' },
          { name: '強勢追擊', cue: '在對方邏輯崩潰時施加壓力，要求交代實情。' }
        ]
      }
    ]
  },
  {
    id: 'persuade',
    title: '我要說服別人 / 安撫情緒',
    iconName: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    frameworks: [
      {
        name: 'PREP 結構',
        desc: '對付固執的玩家或 NPC，標準的說服邏輯。',
        steps: [
          { name: 'P - 核心訴求', cue: '開門見山，表達你的核心訴求。' },
          { name: 'R - 給予原因', cue: '說明為何這項訴求是合理的。' },
          { name: 'E - 具體事證', cue: '提供客觀數據或情報來支撐理由。' },
          { name: 'P - 重申結論', cue: '結合上述理由，要求對方採取行動。' }
        ]
      },
      {
        name: '高張力安撫 (E.A.R.S)',
        desc: '冒犯了別人被抓包時，化解仇恨值的話術。',
        steps: [
          { name: 'E - 同理情緒', cue: '承認對方的不滿，切忌立刻防衛。' },
          { name: 'A - 釐清痛點', cue: '明確重述對方的真實在意點（如隱私、尊嚴）。' },
          { name: 'R - 框架重構', cue: '將冒犯行為轉化為「出於保護大局」的合理舉措。' },
          { name: 'S - 給予方案', cue: '提供保障對方利益的解方，給予台階下。' }
        ]
      }
    ]
  }
];