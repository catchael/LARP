import {
  Mic,
  Newspaper,
  Lock,
  Footprints,
  Skull,
  Cigarette,
  Droplets,
  Laptop,
  Cable,
  Package,
  FileText,
  Wrench,
  GlassWater,
  // 🌟 劇本 2 新增 iconNames
  Umbrella,
  Smartphone,
  Crosshair,
  BookOpen,
  Shirt,
  Bandage,
  Camera,
  Waves,
  Mountain,
} from 'lucide-react';
import React from 'react';

export interface CoinData {
  id: string;
  x: number;
  y: number;
}

export interface Evidence {
  id: string;
  name: string;
  brief: string;
  details: string;
  advancedDetails?: string;
  iconName: React.ElementType;   // 保留，RoomView 直接用
  iconStringId: string;          // ← 新增，給序列化後兜底用
  x: number;
  y: number;
  locationId?: string;
  locationName?: string;
}

export interface RoomData {
  id: string;
  name: string;
  floor: string;
  evidences: Evidence[];
  coins?: CoinData[];
}

// 🌟 改成多劇本結構：外層 key 是 scriptId
export const ROOMS: Record<number, Record<string, RoomData>> = {
  // ═══════════════════════════════════════════════════════════
  // 劇本 1 — 廢棄商業大樓地下室
  // ═══════════════════════════════════════════════════════════
  1: {
    // ─── 1. 地下室正中央（案發現場） ─────────────────────
    crime_scene: {
      id: 'crime_scene',
      name: '地下室正中央',
      floor: 'B1',
      coins: [
        { id: 'coin_cs1', x: 15, y: 80 },
        { id: 'coin_cs2', x: 85, y: 18 },
      ],
      evidences: [
        {
          id: 'cs_autopsy',
          name: '屍檢',
          brief: '崔製作人的死狀慘烈',
          details: '死者頸部有極深的紫紅色勒痕，頭部被黑色塑膠袋緊緊套住並打死結。屍體還有餘溫，死亡時間在 30 分鐘內。',
          advancedDetails: '從勒痕的角度與深淺判斷，兇手是從正面、約莫 175cm 左右的成年男性。屍體餘溫顯示死者在你們進入大樓前不久才剛被殺害。',
          iconName: Skull,
          iconStringId: 'cs_autopsy',
          x: 50, y: 52,
        },
        {
          id: 'cs_drag_marks',
          name: '地上的痕跡',
          brief: '屍體周圍的砂土痕跡',
          details: '屍體周圍的砂土有掙扎摩擦的痕跡，但沒有拖拽的痕跡。',
          advancedDetails: '這代表死者就是在原地被殺，並非從別處被搬運來。是在崔製作人毫無防備時近距離下手的。',
          iconName: Footprints,
          iconStringId: 'cs_drag_marks',
          x: 32, y: 60,
        },
        {
          id: 'cs_mic',
          name: '未開啟的麥克風',
          brief: '公事包裡的偷拍麥克風',
          details: '公事包裡藏著一支未開啟的微型麥克風，似乎是準備記錄什麼。',
          advancedDetails: '此款麥克風是《想知道真相》節目組偷拍專用，與節目助理身上的隱藏攝影機是同一批配發的器材。',
          iconName: Mic,
          iconStringId: 'cs_mic',
          x: 60, y: 46,
        },
        {
          id: 'cs_old_news',
          name: '舊報紙',
          brief: '公事包裡的一份舊報紙',
          details: '報紙日期是十年前，頭版是新亭洞連環殺人案的舊聞。',
          advancedDetails: '報紙背面用紅筆圈起的段落，正是十年前案發當晚的時間表，而其中一個時段旁邊崔製作人潦草寫著：「同一個人」。',
          iconName: Newspaper,
          iconStringId: 'cs_old_news',
          x: 66, y: 52,
        },
        {
          id: 'cs_secret_compartment',
          name: '公事包暗格',
          brief: '夾層裡的暗格',
          details: '拆開內襯後發現一個暗格，放著一份邊緣被撕毀的「DNA 檢驗報告」',
          advancedDetails: '暗格裡還藏著一份邊緣被撕毀的「DNA 檢驗報告」，上面隱約可見「吻合」二字，但受檢者姓名處已被撕掉',
          iconName: Lock,
          iconStringId: 'cs_secret_compartment',
          x: 70, y: 58,
        },
        {
          id: 'cs_shoeprint',
          name: '地上的鞋印',
          brief: '被刻意抹除的鞋印',
          details: '地上有個模糊的鞋印，似乎兇手有試圖抹除。',
          advancedDetails: '地上有個模糊的鞋印，似乎是兇手在離開前有試圖抹掉鞋印過，鞋印不深，似乎是平底',
          iconName: Footprints,
          iconStringId: 'cs_shoeprint',
          x: 36, y: 36,
        },
      ],
    },

    // ─── 2. 入口樓梯與鐵門（密室證明） ──────────────────
    entrance_stairs: {
      id: 'entrance_stairs',
      name: '入口樓梯與鐵門',
      floor: 'B1',
      coins: [
        { id: 'coin_es1', x: 15, y: 50 },
        { id: 'coin_es2', x: 85, y: 50 },
      ],
      evidences: [
        {
          id: 'es_locked_door',
          name: '卡死的門鎖',
          brief: '鐵門內部佈滿鐵鏽',
          details: '門鎖的內部機械結構覆蓋著厚厚的鐵鏽，徒手根本無法從內部打開。',
          advancedDetails: '門鎖的內部機械結構覆蓋著厚厚的鐵鏽，沒有任何人為破壞或上鎖的痕跡。它單純是因為太過老舊，在剛才那陣強風的重擊之下，生鏽的卡榫徹底錯位卡死。從內部絕對無法徒手打開。',
          iconName: Lock,
          iconStringId: 'es_locked_door',
          x: 50, y: 28,
        },
        {
          id: 'es_muddy_steps',
          name: '階梯底部的泥濘',
          brief: '匆忙的多人鞋印',
          details: '樓梯最下方的踏板上，有幾枚混雜著外面雨水與泥濘的凌亂鞋印，顯示剛才有多人匆忙走下來。',
          advancedDetails: '仔細比對泥印，可以分辨出至少有四套不同的鞋紋——你們三人加上拾荒者，全員的腳印都在這裡。',
          iconName: Footprints,
          iconStringId: 'es_muddy_steps',
          x: 50, y: 72,
        },
        {
          id: 'es_plastic_part',
          name: '掉落的塑膠零件',
          brief: '被踩碎的小零件',
          details: '在階梯角落，發現了一個被踩碎的塑膠零件。',
          advancedDetails: '發現了一個被踩碎的廉價塑膠打火機外殼零件',
          iconName: Package,
          iconStringId: 'es_plastic_part',
          x: 25, y: 60,
        },
      ],
    },

    // ─── 3. 陰暗的廢棄物堆（完美栽贓點） ────────────────
    debris_pile: {
      id: 'debris_pile',
      name: '陰暗的廢棄物堆',
      floor: 'B1',
      coins: [
        { id: 'coin_dp1', x: 50, y: 18 },
      ],
      evidences: [
        {
          id: 'dp_cigarette_butt',
          name: '角落的菸蒂',
          brief: '蹲守痕跡 + 平價菸蒂',
          details: '角落的砂土有被人長時間踩踏、蹲守的痕跡。在凌亂的鞋印旁邊，有一截被踩熄的菸蒂。',
          advancedDetails: '角落的砂土有被人長時間踩踏、蹲守的痕跡。在凌亂的鞋印旁邊，有一截被刻意踩熄的平價品牌紙菸。菸頭邊緣微濕，證明是不久前才抽剩下的。',
          iconName: Cigarette,
          iconStringId: 'dp_cigarette_butt',
          x: 30, y: 70,
        },
        {
          id: 'dp_water_bottle',
          name: '一個礦泉水瓶',
          brief: '壓在破帆布下',
          details: '一個沒喝完的礦泉水瓶被壓在破帆布下。',
          advancedDetails: '壓在破帆布下，裡面一滴水都不剩，只有瓶身外有些淡紅色的痕跡(不知道是不是光線的關係)及大量小水滴。',
          iconName: GlassWater,
          iconStringId: 'dp_water_bottle',
          x: 65, y: 50,
        },
      ],
    },

    // ─── 4. 廢棄的清潔水槽 ──────────────────────────────
    cleaning_sink: {
      id: 'cleaning_sink',
      name: '廢棄的清潔水槽',
      floor: 'B1',
      coins: [
        { id: 'coin_sk1', x: 20, y: 80 },
      ],
      evidences: [
        {
          id: 'sk_wet_sink',
          name: '水槽裡的異樣',
          brief: '斷水的水槽卻是濕的',
          details: '大樓早就斷水了，水龍頭根本轉不出水。但此時水槽底卻濕濕的。',
          advancedDetails: '水槽底部殘留非常少量的紅褐色血跡、細微砂土，以及一小撮深藍色制服纖維。',
          iconName: Droplets,
          iconStringId: 'sk_wet_sink',
          x: 50, y: 50,
        },
      ],
    },

    // ─── 5. 破舊的員工置物櫃（真兇臨時基地） ─────────────
    lockers: {
      id: 'lockers',
      name: '破舊的員工置物櫃',
      floor: 'B1',
      coins: [
        { id: 'coin_lk1', x: 50, y: 82 },
      ],
      evidences: [
        {
          id: 'lk_laptop',
          name: '筆記型電腦',
          brief: '處於休眠狀態的筆電',
          details: '櫃子內部異常乾淨，藏著一台處於休眠狀態的筆記型電腦。',
          advancedDetails: '按下開啟後可以看到一份偽造的圖片，但因為快沒電了，所以來不及看是甚麼圖片，隱約顯示出對話框(?)。',
          iconName: Laptop,
          iconStringId: 'lk_laptop',
          x: 30, y: 50,
        },
        {
          id: 'lk_rope',
          name: '一綑繩子',
          brief: '櫃中刻意藏起的繩索',
          details: '一綑普通的尼龍繩，看起來不像隨意丟棄而是被刻意藏起。',
          advancedDetails: '繩索某段沾染了死者頸部的皮膚組織與微量血跡——這就是勒死崔製作人的真正兇器。',
          iconName: Cable,
          iconStringId: 'lk_rope',
          x: 50, y: 60,
        },
        {
          id: 'lk_plastic_bags',
          name: '一疊黑色塑膠袋',
          brief: '全新未使用的塑膠袋',
          details: '一整疊厚實的黑色塑膠袋，看起來幾乎全新。',
          advancedDetails: '與套在死者頭上那只塑膠袋為同批次、同品牌、同尺寸——而這一疊比原本應有的數量。',
          iconName: Package,
          iconStringId: 'lk_plastic_bags',
          x: 70, y: 50,
        },
      ],
    },

    // ─── 6. 散落的紙箱與舊報紙（隱藏文件） ──────────────
    newspapers: {
      id: 'newspapers',
      name: '散落的紙箱與舊報紙',
      floor: 'B1',
      coins: [
        { id: 'coin_np1', x: 50, y: 30 },
      ],
      evidences: [
        {
          id: 'np_disposal_list',
          name: '醫療廢棄物銷毀清單',
          brief: '揉爛的清單',
          details: '在紙箱堆的縫隙中，發現崔製作人掉落的一份揉爛文件——某醫院的醫療廢棄物銷毀清單。',
          advancedDetails: '清單上某一筆「廢棄檢體」的紀錄被人用立可白塗改，原本對應的編號正好是李隊長公事包裡那份「過期檢體」——崔製作人手裡。',
          iconName: FileText,
          iconStringId: 'np_disposal_list',
          x: 35, y: 60,
        },
        {
          id: 'np_old_proposal',
          name: '2006 年節目企劃書草稿',
          brief: '十年前的舊企劃書',
          details: '另一份揉爛的文件，是十年前那場新亭洞連環殺人案的節目企劃書草稿。',
          advancedDetails: '一份是 2006 年節目企劃書草稿，寫著：「為了收視率，就算『獵奇兔子』的線索有瑕疵，也要把那個嫌疑人推上風口浪尖。」',
          iconName: FileText,
          iconStringId: 'np_old_proposal',
          x: 65, y: 50,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 劇本 2 — 生態郊野公園及周圍社區
  // ═══════════════════════════════════════════════════════════
  2: {
    // ─── 1. 廢棄涼亭（案發現場） ─────────────────────────
    pavilion: {
      id: 'pavilion',
      name: '廢棄涼亭',
      floor: 'PARK',
      coins: [
        { id: 'coin_pv1', x: 18, y: 78 },
        { id: 'coin_pv2', x: 82, y: 22 },
      ],
      evidences: [
        {
          id: 'pv_autopsy',
          name: '屍檢狀態',
          brief: '面部遭近距離槍擊',
          details: '死者倒在血泊中，臉部遭受近距離連續槍擊，面目全非。',
          advancedDetails: '兇手似乎是抱著極大的仇恨將死者推倒綑綁後再開槍擊殺，並且在擊殺後還不滿足的多射了幾槍',
          iconName: Skull,
          iconStringId: 'pv_autopsy',
          x: 50, y: 52,
        },
        {
          id: 'pv_rope',
          name: '綑綁的繩索',
          brief: '雙臂反綁、雙腿捆紮',
          details: '死者雙臂被反綁在背後，雙腿被一條粗糙的繩索緊緊捆紮。',
          advancedDetails: '一條能承受極高拉力的專業露營用尼龍繩。打結的手法並不專業，甚至有些凌亂，純粹是靠著一股蠻力將死者的手腳死死纏繞、勒緊，顯示兇手當時的情緒處於極度亢奮或慌亂中。',
          iconName: Cable,
          iconStringId: 'pv_rope',
          x: 38, y: 58,
        },
        {
          id: 'pv_black_umbrella',
          name: '遺落的黑傘',
          brief: '掉落水窪的黑色雨傘',
          details: '一把沾滿泥水的黑色雨傘，掉落在距離屍體約兩公尺的水窪中。',
          advancedDetails: '由於雨水沖刷，指紋變得很淡，但從傘柄的角度可以看出是從死者手中飛出的',
          iconName: Umbrella,
          iconStringId: 'pv_black_umbrella',
          x: 64, y: 46,
        },
        {
          id: 'pv_footprints',
          name: '泥地上的腳印',
          brief: '皮靴印 + 模糊鞋印',
          details: '屍體周圍的黑色泥地上，除了死者本人的鞋印，還留下了一組皮靴印，以及幾處被大雨沖刷得很模糊的鞋印。',
          advancedDetails: '屬於高筒皮靴的腳印踩踏得很深，且邊緣有打滑的痕跡，似乎是某人奔跑過來時急停留下的。旁邊那些模糊的鞋印則被大雨沖刷得幾乎看不出紋路，且鞋印的方向正對著死者。',
          iconName: Footprints,
          iconStringId: 'pv_footprints',
          x: 30, y: 38,
        },
      ],
    },

    // ─── 2. 涼亭周遭草叢與深坑 ──────────────────────────
    bushes_pit: {
      id: 'bushes_pit',
      name: '涼亭周遭草叢與深坑',
      floor: 'PARK',
      coins: [
        { id: 'coin_bp1', x: 22, y: 28 },
        { id: 'coin_bp2', x: 78, y: 80 },
      ],
      evidences: [
        {
          id: 'bp_gun',
          name: '深泥坑裡的重物',
          brief: '泥坑底部的金屬槍枝',
          details: '在極深的積水泥坑底部，隱約能看見一把黑色的金屬槍枝。',
          advancedDetails: '這是一把黑色的黑市改造手槍。雖然因為泡在泥水中無法提取指紋，但槍管內還散發著極其微弱的硝煙味。槍身側邊的序號有被粗糙銼刀嚴重磨損的痕跡，顯然是有備而來。',
          iconName: Crosshair,
          iconStringId: 'bp_gun',
          x: 50, y: 70,
        },
        {
          id: 'bp_phone',
          name: '草叢裡的手機',
          brief: '螢幕碎裂的老舊手機',
          details: '泥濘的草叢中，掉落著一支螢幕碎裂的老舊手機。',
          advancedDetails: '這是一支無法追蹤來源的拋棄式老舊手機。除了那封「清空警力」的簡訊外，通話紀錄與聯絡人已被完全清空。手機外殼邊緣有輕微的摩擦痕跡，似乎是從某個稍微有高度的地方在狂奔中不慎掉落的。',
          iconName: Smartphone,
          iconStringId: 'bp_phone',
          x: 28, y: 52,
        },
        {
          id: 'bp_business_card',
          name: '泥地裡的名片',
          brief: '泛黃皺巴的名片',
          details: '掉落在泥地裡的一張紙片，是一張泛黃且被揉得皺巴巴的名片。',
          advancedDetails: '名片因為泡水變得軟爛，但仍能看清上面印著「高利貸／快速借款」。',
          iconName: FileText,
          iconStringId: 'bp_business_card',
          x: 70, y: 32,
        },
        {
          id: 'bp_backpack',
          name: '被丟棄的防水背包',
          brief: '肩帶斷裂的雙肩背包',
          details: '在灌木叢深處，發現一個深色雙肩背包，表面沾滿了泥水，肩帶有斷裂痕跡。',
          advancedDetails: '死者似乎是被狠狠的推倒在地並被兇手壓住身體接著把背包狠狠扯下',
          iconName: Package,
          iconStringId: 'bp_backpack',
          x: 42, y: 18,
        },
        {
          id: 'bp_swimwear',
          name: '背包內的泳具',
          brief: '乾燥泳衣與毛巾',
          details: '拉開背包，裡面裝著一套乾燥的泳衣與一條乾淨的毛巾。',
          advancedDetails: '一套完全乾燥的連身泳衣和一條折疊整齊的毛巾。上面還帶著淡淡的洗衣精香味，證明死者今早出門的目的確實是為了去游泳，沒有任何赴約或逃亡的跡象。',
          iconName: Waves,
          iconStringId: 'bp_swimwear',
          x: 56, y: 44,
        },
        {
          id: 'bp_lawbooks',
          name: '背包內的書本',
          brief: '兩本厚重的法學參考書',
          details: '背包的底層，裝著兩本厚重且被翻得破舊的法學參考書。',
          advancedDetails: '兩本厚重的法學參考書。其中一本書頁裡夾著一張筆記，上面端正地寫著：「關於前輩前天詢問的商業合約糾紛案例，已查閱最高法院判例……距離司法考試倒數 120 天，絕對不能分心，加油！」字裡行間充滿了對未來的期盼與純粹的學術探討。',
          iconName: BookOpen,
          iconStringId: 'bp_lawbooks',
          x: 38, y: 86,
        },
      ],
    },

    // ─── 3. 公園步道與公共洗手台 ────────────────────────
    walkway_sink: {
      id: 'walkway_sink',
      name: '公園步道與公共洗手台',
      floor: 'PARK',
      coins: [
        { id: 'coin_ws1', x: 16, y: 50 },
        { id: 'coin_ws2', x: 84, y: 50 },
      ],
      evidences: [
        {
          id: 'ws_sink_clean',
          name: '洗手台的水槽',
          brief: '被沖洗得異常乾淨',
          details: '洗手台的表面看起來被大量的水沖洗得非常乾淨。',
          advancedDetails: '雖然大雨不斷沖刷，但在洗手台下方的 U 型存水彎深處，仍殘留著極微量的淡紅色血水，以及些許黑色的火藥殘渣。這證明開槍的人在這裡進行過極度仔細、甚至近乎病態的沖洗。',
          iconName: Droplets,
          iconStringId: 'ws_sink_clean',
          x: 30, y: 30,
        },
        {
          id: 'ws_fabric',
          name: '樹枝上的布料',
          brief: '勾在帶刺樹枝上的布料纖維',
          details: '洗手台通往步道旁的一根帶刺樹枝上，勾著一小塊深色的布料纖維。',
          advancedDetails: '一小撮深色的防水布料纖維。從纖維斷裂的痕跡來看，是某人在此處慌亂轉身或奔跑時，不小心被帶刺的樹枝勾破衣物留下的。',
          iconName: Shirt,
          iconStringId: 'ws_fabric',
          x: 70, y: 24,
        },
        {
          id: 'ws_pi_card',
          name: '水窪裡的徵信社名片',
          brief: '被雨水暈染的徵信社名片',
          details: '掉落在洗手台附近水窪裡的一張名片，正面印有模糊字樣，已被雨水暈染。',
          advancedDetails: '名片背面的紫色特殊墨水防水性極佳，上面密密麻麻地記錄了死者近半個月來的精準作息：「清晨 5:00 出門、5:15 抵達公園……」。這是一種極其縝密且充滿惡意的長期監視。',
          iconName: FileText,
          iconStringId: 'ws_pi_card',
          x: 50, y: 50,
        },
        {
          id: 'ws_big_umbrella',
          name: '半路的泥水窪',
          brief: '傘骨變形的大雨傘',
          details: '步道中段的一個泥水窪裡，掉落著一把大雨傘，傘骨因為摔落有些變形，似乎是被人慌亂中遺棄的。',
          advancedDetails: '這把大傘的傘柄上沾滿了泥沙，傘骨有一根因為重摔而變形斷裂。掉落的位置剛好在可以聽見涼亭方向聲音的步道中段。',
          iconName: Umbrella,
          iconStringId: 'ws_big_umbrella',
          x: 26, y: 76,
        },
        {
          id: 'ws_metal_umbrella',
          name: '洗手台旁的草叢',
          brief: '傘柄鑲金屬花紋的雨傘',
          details: '在洗手台後方的隱蔽草叢裡，丟著一把傘柄鑲著金屬花紋的雨傘。',
          advancedDetails: '這是一把造價不斐的雨傘，傘柄上鑲著低調奢華的金屬花紋。它被隨意地扔在洗手台後方的草叢裡，傘面是半開的狀態，顯然主人因為極度慌張而忘了帶走。',
          iconName: Umbrella,
          iconStringId: 'ws_metal_umbrella',
          x: 74, y: 76,
        },
      ],
    },

    // ─── 4. 景觀工程泥沙區 ──────────────────────────────
    landscape_sand: {
      id: 'landscape_sand',
      name: '景觀工程泥沙區',
      floor: 'PARK',
      coins: [
        { id: 'coin_ls1', x: 50, y: 18 },
      ],
      evidences: [
        {
          id: 'ls_slip_marks',
          name: '沙坑裡的滑倒痕跡',
          brief: '滑倒跌坐 + 雜亂靴印',
          details: '泥濘的沙坑中有一道明顯的人體滑倒、跌坐的痕跡，旁邊留下了深深的雜亂靴子腳印。',
          advancedDetails: '跌坐的痕跡非常深，顯示該人摔得很重。旁邊凌亂的靴子腳印在起身後，並沒有走向案發的涼亭，反而是在原地徘徊了一陣子，似乎是因為某些原因而顯得無所適從。',
          iconName: Footprints,
          iconStringId: 'ls_slip_marks',
          x: 35, y: 55,
        },
        {
          id: 'ls_sand_compare',
          name: '現場泥沙比對',
          brief: '黃色粗沙 vs 黑色腐土',
          details: '這裡堆放的是黃色粗沙，與案發現場涼亭地上的黑色腐土顏色和質地完全不同。',
          advancedDetails: '檢驗報告顯示，景觀工程區的「黃色粗沙」顆粒較大，乾燥時呈粉末狀且容易拍落；而案發現場的「黑色腐土」則富含水分與植物殘渣，極其黏稠。兩者的附著性與顏色完全不同，絕不可能混淆。',
          iconName: Mountain,
          iconStringId: 'ls_sand_compare',
          x: 65, y: 60,
        },
      ],
    },

    // ─── 5. 社區大門與警衛室 ────────────────────────────
    community_guard: {
      id: 'community_guard',
      name: '社區大門與警衛室',
      floor: 'COMMUNITY',
      coins: [
        { id: 'coin_cg1', x: 24, y: 80 },
        { id: 'coin_cg2', x: 76, y: 22 },
      ],
      evidences: [
        {
          id: 'cg_sink',
          name: '警衛室的清潔水槽',
          brief: '濕水槽 + 急救箱',
          details: '警衛室內部水槽的邊緣是濕的，旁邊放著一個打開的急救箱。',
          advancedDetails: '水槽邊緣有剛被擦拭過的水痕，排水孔處卡著一絲極細小的深色棉絮（疑似制服布料）。這說明不久前有人在這裡清洗過衣物或傷口。',
          iconName: Droplets,
          iconStringId: 'cg_sink',
          x: 30, y: 30,
        },
        {
          id: 'cg_medical',
          name: '垃圾桶裡的醫療敷料',
          brief: '帶血的棉花棒與膠帶',
          details: '警衛室的垃圾桶裡，丟棄著沾有少許血跡的棉花棒和透氣膠帶。',
          advancedDetails: '沾有少許新鮮血液的透氣膠帶與棉花棒。血液的顏色很深，旁邊還有一小團沾著微量黑色機械油污的衛生紙。',
          iconName: Bandage,
          iconStringId: 'cg_medical',
          x: 70, y: 38,
        },
        {
          id: 'cg_metal_debris',
          name: '地上的金屬碎屑',
          brief: '斷裂的腳踏車鎖碎片',
          details: '警衛室外面的柏油路上，散落著幾塊斷裂的腳踏車鎖金屬碎屑。',
          advancedDetails: '幾塊邊緣銳利、明顯被大型液壓破壞剪夾斷的腳踏車鎖碎屑。碎屑旁邊的柏油路上，有著兩人互相推擠、甚至在地上翻滾的劇烈摩擦鞋印。',
          iconName: Wrench,
          iconStringId: 'cg_metal_debris',
          x: 40, y: 70,
        },
      ],
    },

    // ─── 6. 便利商店與外圍街道 ──────────────────────────
    convenience: {
      id: 'convenience',
      name: '便利商店與外圍街道',
      floor: 'COMMUNITY',
      coins: [
        { id: 'coin_cv1', x: 50, y: 30 },
      ],
      evidences: [
        {
          id: 'cv_cigarettes',
          name: '屋簷下的菸蒂',
          brief: '剛抽完不久的 4 根菸蒂',
          details: '便利商店側邊避雨的屋簷下，散落著 4 根剛抽完不久的菸蒂。',
          advancedDetails: '4 根平價香菸的菸蒂。其中有兩根的濾嘴被咬得非常扁，且菸灰掉落的範圍很集中，顯示抽菸的人在一個極小的範圍內長時間站立，且內心充滿了焦慮與猶豫。',
          iconName: Cigarette,
          iconStringId: 'cv_cigarettes',
          x: 50, y: 50,
        },
      ],
    },
  },
};