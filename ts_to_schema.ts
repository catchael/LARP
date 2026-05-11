/**
 * ts_to_schema.ts
 *
 * 將你的 .ts 劇本資料轉成 scriptkill_scorer 用的 JSON schema。
 *
 * 使用方式：
 *   1. 把此檔放到你 Render 專案中包含 gameData.ts / scripts.ts /
 *      characterTraits.ts / personalMissions.ts 的目錄附近。
 *   2. 調整下方 import 路徑（如必要）。
 *   3. 確認 dev deps：npm i -D tsx (或 ts-node)
 *   4. 執行：npx tsx scripts/ts_to_schema.ts 1
 *      （參數 1 = 劇本 ID。預設 1；想轉劇本 2 就傳 2）
 *   5. 把輸出的 script_01.json 複製到：
 *      scriptkill_scorer/config/script_schemas/
 *
 * 註：iconName 是 React 元件，這裡會自動丟棄，只保留文字資料。
 */

import { writeFileSync } from 'fs';
// ─── 依你的目錄結構調整 import 路徑 ─────────────────────────────
import { ROOMS } from './src/gameData';
import { SCRIPTS } from './src/data/scripts';
import { CHARACTER_TRAITS } from './src/data/characterTraits';
import { PERSONAL_MISSIONS } from './src/data/personalMissions';

interface CharacterSchema {
  name: string;
  role: string;
  identity: string;
  personality: string;
  intro: string;
  story: string;
  timeline: { time: string; event: string }[];
  basic_traits: string;
  advanced_traits: string;
  main_tasks: string[];
  hidden_tasks: string[];
  initial_clues: {
    id: string;
    name: string;
    brief: string;
    details: string;
  }[];
  round_visible_facts: Record<string, string[]>;
  hidden_facts: string[];
}

interface EvidenceSchema {
  id: string;
  name: string;
  brief: string;
  details: string;
  advanced_details: string;
  location_id: string;
  location_name: string;
}

interface ScriptSchema {
  script_id: number;
  title: string;
  player_count: number;
  proper_nouns: string[];
  characters: Record<string, CharacterSchema>;
  evidences: Record<string, EvidenceSchema>;
}

function convertScript(scriptId: number): ScriptSchema {
  const script = SCRIPTS.find((s) => s.id === scriptId);
  if (!script) throw new Error(`Script ${scriptId} not found`);

  const rooms = ROOMS[scriptId] || {};
  const traits = CHARACTER_TRAITS[scriptId] || {};
  const missions = PERSONAL_MISSIONS[scriptId] || {};

  // ─── Evidences ─────────────────────────────────────────
  const evidences: Record<string, EvidenceSchema> = {};
  for (const roomId in rooms) {
    const room = rooms[roomId];
    for (const ev of room.evidences) {
      evidences[ev.id] = {
        id: ev.id,
        name: ev.name,
        brief: ev.brief,
        details: ev.details,
        advanced_details: ev.advancedDetails || '',
        location_id: room.id,
        location_name: room.name,
      };
    }
  }

  // ─── Characters ────────────────────────────────────────
  const characters: Record<string, CharacterSchema> = {};
  for (const c of script.characters) {
    const charTraits = traits[c.name] || { basic: '', advanced: '' };
    const charMission = missions[c.name] || {
      mainTasks: [],
      hiddenTasks: [],
      initialClues: [],
    };

    // 第一輪應披露的事實 = timeline 全部事件
    // (進階：之後可細分「角色抵達現場前」vs「之後」)
    const roundVisibleFacts: Record<string, string[]> = {
      '1': c.timeline.map((t) => `${t.time} ${t.event}`),
    };

    characters[c.name] = {
      name: c.name,
      role: c.role,
      identity: c.identity,
      personality: c.personality,
      intro: c.intro,
      story: c.story,
      timeline: c.timeline,
      basic_traits: charTraits.basic,
      advanced_traits: charTraits.advanced,
      main_tasks: charMission.mainTasks,
      hidden_tasks: charMission.hiddenTasks,
      initial_clues: (charMission.initialClues || []).map((ic: any) => ({
        id: ic.id,
        name: ic.name,
        brief: ic.brief,
        details: ic.details,
      })),
      round_visible_facts: roundVisibleFacts,
      hidden_facts: charMission.hiddenTasks || [],
    };
  }

  // ─── Proper-noun dictionary ────────────────────────────
  const properNouns = new Set<string>();
  properNouns.add(script.title);
  for (const c of script.characters) {
    properNouns.add(c.name);
    properNouns.add(c.role);
  }
  for (const evId in evidences) {
    properNouns.add(evidences[evId].name);
    properNouns.add(evidences[evId].location_name);
  }
  // 補手工常見專有名詞（你可以擴充）
  const scriptSpecificNouns: Record<number, string[]> = {
    1: ['崔製作人', '新亭洞', '獵奇兔子', '想知道真相'],
    2: ['河女', '生態公園', '尹夫人', '河總'],
  };
  (scriptSpecificNouns[scriptId] || []).forEach((n) => properNouns.add(n));

  return {
    script_id: scriptId,
    title: script.title,
    player_count: parseInt(script.players?.replace(/\D/g, '') || '4', 10),
    proper_nouns: Array.from(properNouns).filter(Boolean),
    characters,
    evidences,
  };
}

// ─── Main ─────────────────────────────────────────────────
const scriptId = parseInt(process.argv[2] || '1', 10);
const schema = convertScript(scriptId);
const outputPath = `script_${String(scriptId).padStart(2, '0')}.json`;
writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf-8');
console.log(
  `✓ Wrote ${outputPath}: ${
    Object.keys(schema.characters).length
  } characters, ${Object.keys(schema.evidences).length} evidences, ${
    schema.proper_nouns.length
  } proper nouns`,
);