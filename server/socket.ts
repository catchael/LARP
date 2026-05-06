// ═══════════════════════════════════════════════════════════
// Socket.IO 事件處理 & 房間邏輯
// ═══════════════════════════════════════════════════════════

import { Server, Socket } from "socket.io";

// ── 型別定義 ──────────────────────────────────────────────

interface MeetingUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  character: string;
  isMicOn: boolean;
  lastSpokeTime: number;
  isAI?: boolean;
}

interface RoomUser {
  id: string;
  email: string;
  name?: string;
  isHost: boolean;
  selectedCharacter?: string;
  assignedCharacter?: string;
  avatar?: string;
  isReady?: boolean;
  connectionStatus?: 'online' | 'offline';
}

interface PlayerState {
  backpack: any[];
  allCollectedEvidence: any[];      // 🌟 跨回合永久收集紀錄
  characterNotes: any[];
  coinCount: number;
  collectedCoins: string[];
  evidenceAssociations: Record<string, number>;
  readInfoIds: string[];
  unlockedAdvancedDetails: string[];
  unlockedCharacterAdvanced: string[];
}

// 🌟 2. 建立獨立的計時器管理器 (以 roomId_email 為 Key)
const disconnectTimers = new Map<string, NodeJS.Timeout>();

type AppPhase =
  | 'login' | 'intro' | 'survey' | 'lobby' | 'teaching'
  | 'script_lobby' | 'script_detail' | 'room_lobby'
  | 'character_preview' | 'game_profile' | 'mission_briefing'
  | 'diary_reveal'
  | 'game_search' | 'search_end' | 'game_meeting' | 'game_voting'
  | 'game_ending' | 'truth_revealed';

interface Room {
  id: string;
  scriptId: number;
  currentRound: number;
  users: RoomUser[];
  status: 'waiting' | 'playing';
  assignmentMethod: 'random' | 'manual';
  characterSelections: Record<string, string[]>; // characterName -> array of userEmails
  isPublic: boolean;
  phase: AppPhase;
  phaseEndTime?: number;
  phaseTimeout?: NodeJS.Timeout | null;
  meetingUsers: MeetingUser[];
  currentSpeakerIndex: number;
  turnStartTime: number;
  turnEndTime: number;
  turnTimeout: NodeJS.Timeout | null;
  timelineNodes: string[];
  timelineEvents: Record<string, Record<number, string>>;
  playerStates: Map<string, PlayerState>;
  silenceCheckInterval: NodeJS.Timeout | null;
  isWarningActive: boolean;
  currentActId: string | null;
  currentActBeatIndex: number;
  actBeatReady: Set<string>;
  votes: Record<string, string>;
  voteRound?: number;
  meetingStage?: 'pre_round_organizing' | 'round_robin' | 'organizing' | 'voting_prompt' | 'free_discussion';
  meetingReadyUsers?: Set<string>;
  moreDiscussionVotes?: Record<string, boolean>;
  turnsPassed?: number;
  readyUsers?: Set<string>;
}

// ── 常數 ──────────────────────────────────────────────────

const TURN_DURATION = 5 * 60 * 1000;
const SILENCE_LIMIT = 10 * 1000;
const WARNING_DURATION = 5 * 1000;

// ── 狀態（模組層級，單例）────────────────────────────────

const rooms = new Map<string, Room>();
const onlinePlayers: Record<number, { email: string; socketId: string }[]> = {};

// ── 工具函式 ──────────────────────────────────────────────

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoomState(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    id: room.id,
    scriptId: room.scriptId,
    currentRound: room.currentRound,
    users: room.users,
    status: room.status,
    assignmentMethod: room.assignmentMethod,
    characterSelections: room.characterSelections,
    isPublic: room.isPublic,
    phase: room.phase,
    timelineNodes: room.timelineNodes, // 🌟 務必回傳給前端
    timelineEvents: room.timelineEvents, // 🌟 務必回傳給前端
    phaseEndTime: room.phaseEndTime,
    meetingUsers: room.meetingUsers,
    currentSpeaker: room.meetingUsers && room.meetingUsers.length > 0
      ? room.meetingUsers[room.currentSpeakerIndex]
      : null,
    turnEndTime: room.turnEndTime,
    currentActId: room.currentActId ?? null,
    currentActBeatIndex: room.currentActBeatIndex ?? 0,
    actBeatReady: Array.from(room.actBeatReady || []),
    meetingStage: room.meetingStage || 'round_robin',
    meetingReadyUsers: Array.from(room.meetingReadyUsers || []),
    moreDiscussionVotes: room.moreDiscussionVotes || {},
  };
}

function getPublicRooms(scriptId: number) {
  return Array.from(rooms.values())
    .filter(r => r.scriptId === scriptId && r.isPublic && r.status === 'waiting')
    .map(r => ({
      id: r.id,
      hostEmail: r.users.find(u => u.isHost)?.email || '未知',
      currentPlayers: r.users.length,
    }));
}

// 🌟 決定「第一次討論結束後」要走哪個 phase（劇本 2 多一個發放日記）
function getNextRoundStartPhase(scriptId: number): { phase: AppPhase; duration: number } {
  return { phase: 'game_search', duration: 300 };
}

// ── Socket.IO 初始化（需傳入 io 實例）────────────────────

export function registerSocketHandlers(io: Server) {

  // 這兩個廣播函式需要 io，放在 registerSocketHandlers 內
  function broadcastPublicRooms(scriptId: number) {
    io.emit('public_rooms_update', { scriptId, rooms: getPublicRooms(scriptId) });
  }

  function broadcastMeetingState(roomId: string) {
    const room = rooms.get(roomId)!;
    if (!room) return;
    io.to(roomId).emit('meeting_state', {
      users: room.meetingUsers,
      currentSpeaker: room.currentSpeakerIndex >= 0 && room.currentSpeakerIndex < room.meetingUsers.length
        ? room.meetingUsers[room.currentSpeakerIndex]
        : null,
      turnEndTime: room.turnStartTime + TURN_DURATION,
      isWarningActive: room.isWarningActive,
    });
  }

  function nextTurn(roomId: string) {
    const room = rooms.get(roomId)!;
    if (!room) return;

    if (room.meetingUsers.length === 0) {
      room.currentSpeakerIndex = -1;
      return;
    }

    // 🌟 修正後的輪次邏輯：
    //   在移動 index 之前，先判斷「剛說完的那個人」是否是真人。
    //   若是，累計已完成真人數；若已完成數 >= 真人總數，整圈結束。
    //   這樣 startRoundRobin 的初始呼叫（index=-1）不會計入，
    //   且 AI 的 5 秒跳過也不會誤觸發結束。
    const justFinishedUser = room.currentSpeakerIndex >= 0
      ? room.meetingUsers[room.currentSpeakerIndex]
      : null;

    if (justFinishedUser && !justFinishedUser.isAI) {
      room.turnsPassed = (room.turnsPassed || 0) + 1;
      const humanCount = room.meetingUsers.filter(u => !u.isAI).length;
      if (room.turnsPassed >= humanCount && room.meetingStage === 'round_robin') {
        startOrganizingStage(roomId);
        return;
      }
    }

    // 移動到下一個人
    room.currentSpeakerIndex = (room.currentSpeakerIndex + 1) % room.meetingUsers.length;

    room.turnStartTime = Date.now();
    room.isWarningActive = false;

    room.meetingUsers.forEach(u => u.isMicOn = false);
    if (room.meetingUsers[room.currentSpeakerIndex]) {
      room.meetingUsers[room.currentSpeakerIndex].lastSpokeTime = Date.now();
    }

    if (room.turnTimeout) clearTimeout(room.turnTimeout);

    const currentSpeaker = room.meetingUsers[room.currentSpeakerIndex];
    if (currentSpeaker && currentSpeaker.isAI) {
      room.turnTimeout = setTimeout(() => { nextTurn(roomId); }, 5000);
      setTimeout(() => {
        if (room.meetingUsers[room.currentSpeakerIndex]?.id === currentSpeaker.id) {
          io.to(roomId).emit('speaking_data', {
            volume: 50,
            cpm: 200,
            subtitle: `${currentSpeaker.character}：(AI 託管發言中...)`,
          });
        }
      }, 1000);
    } else {
      room.turnTimeout = setTimeout(() => { nextTurn(roomId); }, TURN_DURATION);
    }

    broadcastMeetingState(roomId);
  }

  function startPhase(roomId: string, phase: AppPhase, durationSeconds: number) {
    const room = rooms.get(roomId)!;
    if (!room) return;

    // 🌟 新增這行：先記住「切換前」的階段，用來打破死循環
    const previousPhase = room.phase;

    room.phase = phase;
    room.users.forEach(u => u.isReady = false);
    room.readyUsers = new Set();

    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);

    // 🌟 核心修正：判斷地圖階段的啟動邏輯
    if (phase === 'game_search') {
      // 只有在「第一回合」且「不是剛從日記回來」的情況下，才演第二幕
      if (room.currentRound === 1 && previousPhase !== 'diary_reveal') {
        room.phaseEndTime = undefined;
        const act2Id = `script${room.scriptId}_act2`;   // 動態抓取劇本幕
        room.currentActId = act2Id;
        room.currentActBeatIndex = 0;
        room.actBeatReady = new Set<string>();
        io.to(roomId).emit('act_started', { actId: act2Id, beatIndex: 0 });
      } else {
        // 第二輪搜查，或是「剛看完日記回來」：不演戲，直接開始搜查倒數！
        room.phaseEndTime = Date.now() + durationSeconds * 1000;
        room.phaseTimeout = setTimeout(() => { autoNextPhase(roomId); }, durationSeconds * 1000);
      }
    } else {
      // 其他階段正常倒數計時
      room.phaseEndTime = Date.now() + durationSeconds * 1000;
      room.phaseTimeout = setTimeout(() => { autoNextPhase(roomId); }, durationSeconds * 1000);
    }

    if (phase === 'game_meeting') {
      room.meetingStage = 'pre_round_organizing';
      room.meetingReadyUsers = new Set();
      room.meetingUsers.forEach(u => u.isMicOn = false); // 全員先封麥

      if (room.silenceCheckInterval) clearInterval(room.silenceCheckInterval);
      if (room.turnTimeout) clearTimeout(room.turnTimeout);

      // 給予 2 分鐘 (120秒) 整理思緒時間，時間到自動進入輪流發言
      room.phaseEndTime = Date.now() + 120 * 1000;
      room.phaseTimeout = setTimeout(() => {
        startRoundRobin(roomId);
      }, 120 * 1000);
    }

    io.to(roomId).emit('room_state', getRoomState(roomId));
  }

  function startRoundRobin(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.meetingStage = 'round_robin';
    room.turnsPassed = 0;
    room.meetingReadyUsers = new Set();
    room.moreDiscussionVotes = {};

    room.meetingUsers.forEach(u => {
      u.isMicOn = false;
      u.lastSpokeTime = Date.now();
    });
    // 🌟 修正：從 -1 開始，讓 nextTurn 的 +1 自然落在 index 0，確保第一個人不被跳過
    room.currentSpeakerIndex = -1;

    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
    room.phaseEndTime = undefined;

    if (room.silenceCheckInterval) clearInterval(room.silenceCheckInterval);
    room.silenceCheckInterval = setInterval(() => {
      if (room.currentSpeakerIndex >= 0 && room.currentSpeakerIndex < room.meetingUsers.length && !room.isWarningActive) {
        const speaker = room.meetingUsers[room.currentSpeakerIndex];
        if (speaker.isAI || speaker.isMicOn) return;
        if (Date.now() - speaker.lastSpokeTime > SILENCE_LIMIT) {
          room.isWarningActive = true;
          io.to(roomId).emit('silence_warning', { speakerId: speaker.id, countdown: 5 });
          setTimeout(() => { if (room.isWarningActive) nextTurn(roomId); }, WARNING_DURATION);
          broadcastMeetingState(roomId);
        }
      }
    }, 1000);

    nextTurn(roomId);
    io.to(roomId).emit('room_state', getRoomState(roomId));
  }

  function startOrganizingStage(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.meetingStage = 'organizing';
    room.meetingReadyUsers = new Set();
    room.meetingUsers.forEach(u => u.isMicOn = false); // 封麥
    
    if (room.turnTimeout) clearTimeout(room.turnTimeout);
    if (room.silenceCheckInterval) clearInterval(room.silenceCheckInterval);
    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);

    room.phaseEndTime = Date.now() + 120 * 1000;
    room.phaseTimeout = setTimeout(() => { 
      // 🌟 第一輪直接進討論；第二輪則彈出詢問
      if (room.currentRound === 1) {
        startFreeDiscussion(roomId); 
      } else {
        startVotingPromptStage(roomId);
      }
    }, 120 * 1000);
    io.to(roomId).emit('room_state', getRoomState(roomId));
    broadcastMeetingState(roomId);
  }

  function startVotingPromptStage(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.meetingStage = 'voting_prompt';
    room.moreDiscussionVotes = {};
    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
    
    room.phaseEndTime = Date.now() + 30 * 1000;
    room.phaseTimeout = setTimeout(() => {
      // 🌟 時間到沒人按，直接進入最終投票
      startPhase(roomId, 'game_voting', 180);
    }, 30 * 1000);

    io.to(roomId).emit('room_state', getRoomState(roomId));
  }

  function startFreeDiscussion(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.meetingStage = 'free_discussion';
    room.meetingReadyUsers = new Set();
    
    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
    room.phaseEndTime = Date.now() + 300 * 1000;
    room.phaseTimeout = setTimeout(() => { 
      if (room.currentRound === 1) {
        // 🌟 自由討論結束，進入下一回合
        const next = getNextRoundStartPhase(room.scriptId);
        room.currentRound = 2; // 統一將回合 +1
        startPhase(roomId, next.phase, next.duration);
      } else {
        startPhase(roomId, 'game_voting', 180);
      }
    }, 300 * 1000);
    io.to(roomId).emit('room_state', getRoomState(roomId));
  }

  function startTieRevote(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.voteRound = 2;
    room.votes = {};
    room.phase = 'game_meeting';
    room.meetingStage = 'free_discussion';
    room.meetingReadyUsers = new Set();

    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
    // 4 分鐘後自動重開投票
    room.phaseEndTime = Date.now() + 240 * 1000;
    room.phaseTimeout = setTimeout(() => {
      startPhase(roomId, 'game_voting', 180);
    }, 240 * 1000);

    io.to(roomId).emit('tie_revote_started', { duration: 240 });
    io.to(roomId).emit('room_state', getRoomState(roomId));

    console.log(`[系統] 房間 ${roomId} 投票平票，進入 4 分鐘自由討論後重投`);
  }

  function autoNextPhase(roomId: string) {
    const room = rooms.get(roomId)!;
    if (!room) return;

    if (room.phase === 'diary_reveal') {
      // 🌟 時間到了沒按準備，一樣回到搜查
      startPhase(roomId, 'game_search', 300);
      return;
    }

    const phaseOrder: AppPhase[] = [
      'room_lobby', 'character_preview', 'game_profile',
      'mission_briefing',
      'game_search', 'search_end', 'game_meeting',
    ];
    const currentIndex = phaseOrder.indexOf(room.phase);
    if (currentIndex >= 0 && currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1];
      let duration = 60;
      if (nextPhase === 'game_profile') duration = 180;
      if (nextPhase === 'mission_briefing') duration = 240;
      if (nextPhase === 'game_search') duration = 300;
      if (nextPhase === 'game_meeting') duration = 1800;
      startPhase(roomId, nextPhase, duration);
    }
  }

  // ── 連線處理 ────────────────────────────────────────────

  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentScriptId: number | null = null;
    // Buffer ICE candidates that arrive before remote description is set
    const iceCandidateBuffers: Record<string, any[]> = {};

    // ── 大廳 ──────────────────────────────────────────────

    socket.on('enter_script_lobby', (data: { email: string; scriptId: number }) => {
      currentScriptId = data.scriptId;
      if (!onlinePlayers[data.scriptId]) onlinePlayers[data.scriptId] = [];
      if (!onlinePlayers[data.scriptId].find(p => p.email === data.email)) {
        onlinePlayers[data.scriptId].push({ email: data.email, socketId: socket.id });
      }
      io.emit('online_players_update', { scriptId: data.scriptId, players: onlinePlayers[data.scriptId] });
      socket.emit('public_rooms_update', { scriptId: data.scriptId, rooms: getPublicRooms(data.scriptId) });
    });

    socket.on('leave_script_lobby', () => {
      if (currentScriptId !== null) {
        onlinePlayers[currentScriptId] = onlinePlayers[currentScriptId]?.filter(p => p.socketId !== socket.id) || [];
        io.emit('online_players_update', { scriptId: currentScriptId, players: onlinePlayers[currentScriptId] });
        currentScriptId = null;
      }
    });

    // ── 房間管理 ──────────────────────────────────────────

    // 👇 data 裡面補上 avatar?: string
    socket.on('create_room', (data: { email: string; name?: string; avatar?: string; scriptId: number; isPublic?: boolean }) => {
      const roomId = generateRoomId();
      currentRoomId = roomId;
      rooms.set(roomId, {
        id: roomId,
        scriptId: data.scriptId,
        currentRound: 1,
        users: [{
          id: socket.id,
          email: data.email,
          name: data.name,
          isHost: true,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`, // 👈 使用前端傳來的頭貼
          isReady: false,
          connectionStatus: 'online',
        }],
        status: 'waiting',
        assignmentMethod: 'manual',
        characterSelections: {},
        isPublic: data.isPublic ?? true,
        phase: 'room_lobby',
        meetingUsers: [{
          id: socket.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          character: '',
          isMicOn: false,
          lastSpokeTime: Date.now(),
          isAI: false,
        }],
        currentSpeakerIndex: -1,
        turnStartTime: 0,
        turnEndTime: 0,
        turnTimeout: null,
        silenceCheckInterval: null,
        isWarningActive: false,
        timelineNodes: [],
        timelineEvents: {},
        playerStates: new Map(),
        currentActId: null,
        currentActBeatIndex: 0,
        actBeatReady: new Set<string>(),
        votes: {},
        voteRound: 1,
      });
      socket.join(roomId);
      io.to(roomId).emit('room_state', getRoomState(roomId));
      if (rooms.get(roomId)?.isPublic) broadcastPublicRooms(data.scriptId);
    });

    // 增加同步事件
    socket.on('update_timeline', (data: { nodes: string[], events: any }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (data.nodes && Array.isArray(data.nodes)) {
        // 🌟 嚴格聯集：節點只增不減，防止客戶端誤傳空陣列洗掉伺服器資料
        room.timelineNodes = Array.from(new Set([...room.timelineNodes, ...data.nodes])).sort();
        
        if (data.events) {
          for (const time of Object.keys(data.events)) {
            if (!room.timelineEvents[time]) room.timelineEvents[time] = {};
            Object.assign(room.timelineEvents[time], data.events[time]);
          }
        }

        // 轉發給「除我以外」的所有人
        socket.to(currentRoomId).emit('timeline_updated', {
          nodes: room.timelineNodes,
          events: room.timelineEvents
        });
      }
    });

    // 🌟 新增：專屬的刪除節點事件
    socket.on('delete_timeline_node', (data: { time: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.timelineNodes = room.timelineNodes.filter(t => t !== data.time);
      if (room.timelineEvents[data.time]) {
        delete room.timelineEvents[data.time];
      }

      // 刪除操作需強制同步給房間內所有人
      io.to(currentRoomId).emit('timeline_updated', {
        nodes: room.timelineNodes,
        events: room.timelineEvents
      });
    });

    socket.on('save_player_state', (state: PlayerState) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        // 🌟 把 backpack / allCollectedEvidence 裡的 icon 函式欄位剝掉，只留可序列化的資料
        const sanitize = (arr: any[]) => 
          Array.isArray(arr) ? arr.map(({ icon, ...rest }) => rest) : arr;
        
        const cleanState = {
          ...state,
          backpack: sanitize(state.backpack),
          allCollectedEvidence: sanitize(state.allCollectedEvidence),
        };
        room.playerStates.set(user.email, cleanState);
        console.log(`[DEBUG save] 儲存 ${user.email}: backpack=${cleanState.backpack?.length}, ...`);
      }
    });

    // 👇 data 裡面補上 avatar?: string
    socket.on('join_room', (data: { email: string; name?: string; avatar?: string; roomId: string }) => {
      const roomId = data.roomId.toUpperCase().trim();
      const room = rooms.get(roomId)!;
      if (room && room.status === 'waiting') {
        currentRoomId = roomId;
        room.users.push({
          id: socket.id,
          email: data.email,
          name: data.name,
          isHost: false,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`, // 👈 使用前端傳來的頭貼
          isReady: false,
          connectionStatus: 'online',
        });
        // 🌟 新增：提早將玩家加入語音頻道名單
        room.meetingUsers.push({
          id: socket.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          character: '',
          isMicOn: false,
          lastSpokeTime: Date.now(),
          isAI: false,
        });
        socket.join(roomId);
        io.to(roomId).emit('room_state', getRoomState(roomId));
        if (room.isPublic) broadcastPublicRooms(room.scriptId);
      } else {
        socket.emit('room_error', '房間不存在、已滿或已開始遊戲');
      }
    });

    socket.on('toggle_assignment', (method: 'random' | 'manual') => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (user && user.isHost) {
        room.assignmentMethod = method;
        io.to(currentRoomId).emit('room_state', getRoomState(currentRoomId));
      }
    });

    socket.on('select_character', (character: string) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        if (user.selectedCharacter) {
          room.characterSelections[user.selectedCharacter] =
            room.characterSelections[user.selectedCharacter]?.filter(email => email !== user.email) || [];
        }
        user.selectedCharacter = character;
        
        // 🌟 即時選角時，同步更新分配的身分
        user.assignedCharacter = character;

        if (!room.characterSelections[character]) room.characterSelections[character] = [];
        if (!room.characterSelections[character].includes(user.email)) {
          room.characterSelections[character].push(user.email);
        }

        // 🌟 同步更新會議室清單的角色對應 (替換原本的 AI 託管)
        const meetingUser = room.meetingUsers.find(mu => mu.email === user.email);
        if (meetingUser) meetingUser.character = character;

        io.to(currentRoomId).emit('room_state', getRoomState(currentRoomId));
      }
    });

    // ── 遊戲流程 ──────────────────────────────────────────

    socket.on('start_game', (data: { allCharacters: string[] }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (user && user.isHost && room.status === 'waiting') {
        room.status = 'playing';
        if (room.isPublic) broadcastPublicRooms(room.scriptId);

        let availableChars = [...data.allCharacters];
        const assignments: Record<string, string> = {}; // socketId -> characterName

        if (room.assignmentMethod === 'random') {
          availableChars.sort(() => Math.random() - 0.5);
          room.users.forEach(u => { assignments[u.id] = availableChars.pop()!; });
        } else {
          // Manual: first pass — users with a unique selection
          room.users.forEach(u => {
            if (u.selectedCharacter && availableChars.includes(u.selectedCharacter)) {
              assignments[u.id] = u.selectedCharacter;
              availableChars = availableChars.filter(c => c !== u.selectedCharacter);
            }
          });
          // Second pass: unassigned users get remaining chars
          room.users.forEach(u => {
            if (!assignments[u.id]) assignments[u.id] = availableChars.pop()!;
          });
        }

        // 🌟 修正：清空並統一 push 一次（random 和 manual 共用），避免重複 push 造成每人兩筆
        room.meetingUsers = [];
        room.users.forEach(u => {
          u.assignedCharacter = assignments[u.id];
          room.meetingUsers.push({
            id: u.id,
            email: u.email,
            name: u.name,
            avatar: u.avatar,
            character: assignments[u.id],
            isMicOn: false,
            lastSpokeTime: Date.now(),
            isAI: false,
          });
        });

        // 剩餘角色由 AI 託管
        availableChars.forEach(char => {
          room.meetingUsers.push({
            id: `ai_${char}`,
            email: 'AI 託管',
            character: char,
            isMicOn: false,
            lastSpokeTime: Date.now(),
            isAI: true,
          });
        });

        io.to(currentRoomId).emit('game_started', { users: room.users });
        startPhase(currentRoomId, 'character_preview', 60);
      }
    });

    socket.on('player_ready', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const user = room.users.find(u => u.id === socket.id);
      
      if (user) {
        user.isReady = true; 

        if (!room.readyUsers) room.readyUsers = new Set();
        room.readyUsers.add(user.email);
        
        const playingCount = room.users.filter(u => u.connectionStatus !== 'offline' && u.assignedCharacter).length;
        io.to(currentRoomId).emit('room_state', getRoomState(currentRoomId));

        if (room.readyUsers.size >= playingCount) {
          if (room.phase === 'diary_reveal') {
            if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
            // 🌟 劇本 2：看完日記後，回到第一次的搜查階段並開始 300 秒倒數
            // 注意：這裡不改變 currentRound，依然是 1
            startPhase(currentRoomId, 'game_search', 300);
          } else {
            autoNextPhase(currentRoomId);
          }
        }
      }
    });

    // ── 離開 / 斷線（共用邏輯）───────────────────────────

    function handleLeave(roomId: string, targetSocketId: string = socket.id) {
      const room = rooms.get(roomId);
      if (!room) return;
      const scriptId = room.scriptId;

      // 1. 處理大廳玩家列表的移除
      const userIdx = room.users.findIndex(u => u.id === targetSocketId);
      if (userIdx >= 0) {
        const wasHost = room.users[userIdx].isHost;
        room.users.splice(userIdx, 1);
        
        // 🌟 垃圾回收核心邏輯 (Garbage Collection)
        if (room.users.length === 0) {
          // 清除所有綁定在這個房間的定時器，避免 Node.js 背景 Memory Leak
          if (room.turnTimeout) clearTimeout(room.turnTimeout);
          if (room.silenceCheckInterval) clearInterval(room.silenceCheckInterval);
          if (room.phaseTimeout) clearTimeout(room.phaseTimeout); // 新增：清除階段倒數定時器
          
          rooms.delete(roomId); // 從 Map 中徹底刪除房間
          console.log(`[系統] 房間 ${roomId} 所有玩家已離開，房間已銷毀`);
          
          if (room.isPublic) broadcastPublicRooms(scriptId);
          return; // ⚠️ 非常重要：房間都沒了，直接結束函式，不要往下執行 AI 託管邏輯！
        } else {
          // 房間還有人，轉移房主權限
          if (wasHost) room.users[0].isHost = true;
          io.to(roomId).emit('room_state', getRoomState(roomId));
          if (room.isPublic) broadcastPublicRooms(scriptId);
        }
      }

      // 2. 處理遊戲會議室的斷線
      const idx = room.meetingUsers?.findIndex(u => u.id === targetSocketId) ?? -1;
      if (idx >= 0) {
        if (room.status === 'waiting') {
          // 🌟 在大廳期間離開，直接移除即可，不需要變成 AI
          room.meetingUsers.splice(idx, 1);
        } else {
          // 玩家在遊戲中斷線或離開，將其標記為 AI 託管
          room.meetingUsers[idx].isAI = true;
          room.meetingUsers[idx].id = `ai_${room.meetingUsers[idx].character}`;
          room.meetingUsers[idx].email = 'AI 託管';
          room.meetingUsers[idx].isMicOn = false;
          
          if (room.currentSpeakerIndex === idx) {
            nextTurn(roomId);
          } else {
            broadcastMeetingState(roomId);
          }
        }
      }
    }

    socket.on('leave_room', () => {
      if (!currentRoomId) return;

      const roomIdToLeave = currentRoomId;
      currentRoomId = null;
      socket.leave(roomIdToLeave);
      handleLeave(roomIdToLeave);
    });

    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      const roomId = currentRoomId as string;
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (!user) return;

      // 🌟 如果遊戲還沒開始 (waiting)，直接視為離開
      if (room.status === 'waiting') {
        handleLeave(roomId, socket.id); // 注意：稍後我們要把 handleLeave 改為接收 socketId
      } else {
        // 🌟 如果遊戲進行中，觸發「斷線緩衝期」
        user.connectionStatus = 'offline';

        // 🌟 新增：同步處理會議室的座位
        const meetingIdx = room.meetingUsers.findIndex(u => u.id === socket.id);
        if (meetingIdx >= 0) {
          room.meetingUsers[meetingIdx].isMicOn = false;
          // 注意：保留 email、character、isAI=false，方便 rejoin_room 用 email 找回座位
          // 但若該玩家正在發言，要立刻把麥克風讓出去，不然整桌會卡 5 秒等 silence_warning
          if (room.currentSpeakerIndex === meetingIdx) {
            nextTurn(roomId);
          } else {
            broadcastMeetingState(roomId);
          }
        }

        io.to(roomId).emit('player_disconnected', { email: user.email, timeLimit: 180 });
        io.to(roomId).emit('room_state', getRoomState(roomId));

        console.log(`[系統] 玩家 ${user.email} 斷線，進入 3 分鐘緩衝期...`);

        const timerKey = `${roomId}_${user.email}`;
        const timeout = setTimeout(() => {
          // 3分鐘到了還是沒回來 -> 解散房間
          console.log(`[系統] 玩家 ${user.email} 逾時未歸，解散房間 ${roomId}`);
          io.to(roomId).emit('room_disbanded', '有玩家斷線逾時，遊戲強制結束。');
          rooms.delete(roomId);
          disconnectTimers.delete(timerKey);
        }, 180000); // 3分鐘 (180,000 毫秒)

        disconnectTimers.set(timerKey, timeout);
      }
      currentRoomId = null;
    });

    // ── 房主主動解散房間 ───────────────────────────
    socket.on('disband_room', (frontendRoomId?: string) => {
      // 雙重保險：優先使用前端傳來的 ID，沒有才用備用變數
      const roomId = (frontendRoomId || currentRoomId) as string; 
      
      if (!roomId) {
        console.log(`[錯誤] 解散失敗：找不到房間 ID`);
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        console.log(`[錯誤] 解散失敗：房間 ${roomId} 不存在或已被銷毀`);
        return;
      }

      const user = room.users.find(u => u.id === socket.id);
      if (!user) {
        console.log(`[錯誤] 解散失敗：在房間中找不到發送指令的玩家 (Socket: ${socket.id})`);
        return;
      }
      
      if (!user.isHost) {
        console.log(`[錯誤] 解散失敗：玩家 ${user.email} 不是房主，無權解散`);
        socket.emit('room_error', '只有房主可以解散房間');
        return;
      }

      console.log(`[系統] 房主 ${user.email} 正在強制解散房間 ${roomId}...`);

      // 1. 清除該房間的所有伺服器定時器
      if (room.turnTimeout) clearTimeout(room.turnTimeout);
      if (room.silenceCheckInterval) clearInterval(room.silenceCheckInterval);
      if (room.phaseTimeout) clearTimeout(room.phaseTimeout);

      // 2. 清除斷線緩衝期的定時器
      room.users.forEach(u => {
        const timerKey = `${roomId}_${u.email}`;
        if (disconnectTimers.has(timerKey)) {
          clearTimeout(disconnectTimers.get(timerKey)!);
          disconnectTimers.delete(timerKey);
        }
      });

      // 3. 廣播給房間內所有人：房間已被解散
      io.to(roomId).emit('room_disbanded', '房主已強制解散房間。');

      // 4. 徹底銷毀房間資料
      rooms.delete(roomId);
      console.log(`[系統] 房間 ${roomId} 已成功銷毀！`);

      // 5. 更新大廳列表
      if (room.isPublic) broadcastPublicRooms(room.scriptId);
    });

    socket.on('rejoin_room', (data: { email: string; roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) {
        socket.emit('room_error', '該房間已超時解散或不存在。');
        return;
      }

      const user = room.users.find(u => u.email === data.email);
      if (user) {
        user.id = socket.id;
        user.connectionStatus = 'online';
        currentRoomId = data.roomId;
        socket.join(data.roomId);

        const meetingUser = room.meetingUsers?.find(u => u.email === data.email);
        if (meetingUser) meetingUser.id = socket.id;

        const timerKey = `${data.roomId}_${data.email}`;
        if (disconnectTimers.has(timerKey)) {
          clearTimeout(disconnectTimers.get(timerKey)!);
          disconnectTimers.delete(timerKey);
        }

        console.log(`[系統] 玩家 ${user.email} 重連成功`);
        io.to(data.roomId).emit('player_reconnected', { email: user.email });
        
        // 🌟 核心修正 1：主動向「該位重連玩家」派發當前伺服器存儲的時間線
        socket.emit('timeline_updated', {
          nodes: room.timelineNodes,
          events: room.timelineEvents
        });

        const savedState = room.playerStates.get(data.email);
        console.log(`[DEBUG rejoin] ${data.email} 的狀態: found=${!!savedState}, 所有keys=[${Array.from(room.playerStates.keys()).join(', ')}]`);
        if (savedState) {
          socket.emit('your_player_state', savedState);
        }

        // 原有的狀態廣播
        io.to(data.roomId).emit('room_state', getRoomState(data.roomId));
      } else {
        socket.emit('room_error', '你不在該房間內');
      }
    });

    
    // ── 幕（Act）控制 ─────────────────────────────────────

    /**
     * host 發起：開始播放某一幕
     * payload: { actId: string }
     */
    socket.on('start_act', (data: { actId: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (!user?.isHost) {
        socket.emit('room_error', '只有房主可以啟動幕演出');
        return;
      }

      room.currentActId = data.actId;
      room.currentActBeatIndex = 0;
      room.actBeatReady = new Set<string>(); 

      console.log(`[幕] 房間 ${currentRoomId} 開始幕：${data.actId}`);
      io.to(currentRoomId).emit('act_started', {
        actId: data.actId,
        beatIndex: 0,
      });

      io.to(currentRoomId).emit('act_beat_ready_state', {
        beatIndex: 0,
        readyEmails: [],
        allReady: false,
      });
    });

    /**
     * host 或系統自動推進 beat
     * payload: { actId: string; beatIndex: number }
     * 只有 host 可以推進 pause 類型的 beat；
     * narration / player_dialogue 類型由前端自行計時後送此事件
     */
    socket.on('act_beat_advance', (data: { actId: string; beatIndex: number }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      // 防止亂序推進（只接受往前推進）
      if (data.beatIndex <= (room.currentActBeatIndex ?? 0) - 1) return;

      room.currentActBeatIndex = data.beatIndex;
      room.actBeatReady = new Set<string>();

      // 廣播給房間其他人（不含發送者）
      socket.to(currentRoomId).emit('act_beat_advance', {
        actId: data.actId,
        beatIndex: data.beatIndex,
      });

      console.log(`[幕] 房間 ${currentRoomId} 推進至 beat ${data.beatIndex}`);
    });

    socket.on('act_beat_ready', (data: { beatIndex: number }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (data.beatIndex !== room.currentActBeatIndex) return;

      const user = room.users.find(u => u.id === socket.id);
      if (!user) return;

      room.actBeatReady.add(user.email);

      // ✅ 計算在線人數（與前端邏輯一致）
      const onlineUsers = room.users.filter(u => u.connectionStatus !== 'offline');
      const allReady = room.actBeatReady.size >= onlineUsers.length;

      io.to(currentRoomId).emit('act_beat_ready_state', {
        beatIndex: data.beatIndex,
        readyEmails: Array.from(room.actBeatReady),
        allReady, // ✅ 讓前端直接知道是否全員 ready，不用自己算
      });
    });

    socket.on('end_act', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (!user?.isHost) return;

      const endedActId = room.currentActId;
      room.currentActId = null;
      room.currentActBeatIndex = 0;
      room.actBeatReady = new Set<string>();

      io.to(room.id).emit('act_ended', { actId: endedActId });

      // 🌟 判斷是否為第二幕結束
      if (endedActId?.endsWith('_act2') && room.phase === 'game_search') {
        if (room.scriptId === 2) {
          // 劇本 2：第二幕演完，先跳轉到看日記！
          startPhase(room.id, 'diary_reveal', 270); // 給 4.5 分鐘看日記
        } else {
          // 劇本 1 (或其他)：直接啟動地圖的 300 秒搜查倒數
          const searchDuration = 300; 
          room.phaseEndTime = Date.now() + searchDuration * 1000;
          
          if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
          room.phaseTimeout = setTimeout(() => { autoNextPhase(room.id); }, searchDuration * 1000);
          
          io.to(room.id).emit('room_state', getRoomState(room.id)); 
        }
      }
    });

    // ── 投票環節控制 ──────────────────────────────────────────

    socket.on('start_voting', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (user && user.isHost) {
        room.votes = {};
        room.voteRound = 1;   // 🌟 重置輪次
        startPhase(currentRoomId, 'game_voting', 180); 
      }
    });

    socket.on('submit_vote', (data: { targetCharacter: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        room.votes[user.email] = data.targetCharacter;
        console.log(`[系統] 玩家 ${user.email} 投給了 ${data.targetCharacter}`);

        const activeUsersCount = room.users.filter(u => u.connectionStatus !== 'offline' && u.assignedCharacter).length;
        const currentVotesCount = Object.keys(room.votes).length;

        if (currentVotesCount >= activeUsersCount) {
          // 計票
          const voteCount: Record<string, number> = {};
          Object.values(room.votes).forEach(t => { voteCount[t] = (voteCount[t] || 0) + 1; });
          const max = Math.max(...Object.values(voteCount));
          const topChars = Object.keys(voteCount).filter(c => voteCount[c] === max);
          const isTie = topChars.length > 1;

          if (isTie && (room.voteRound ?? 1) === 1) {
            // 🌟 首輪平票 → 4 分鐘自由討論後重投
            console.log(`[系統] 房間 ${currentRoomId} 首輪平票，啟動重議`);
            startTieRevote(currentRoomId);
          } else {
            // 第二輪結果（不論平不平）或非平票 → 直接結算
            console.log(`[系統] 房間 ${currentRoomId} 投票完畢，準備進入結局...`);
            io.to(currentRoomId).emit('voting_finished', room.votes);
          }
        }
      }
    });

    socket.on('start_truth_phase', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      // 🌟 每個玩家各自觸發，只更新自己的 phase，不廣播給其他人
      // 只對發出請求的 socket 回傳狀態（而不是 io.to(room).emit）
      socket.emit('personal_phase_override', { phase: 'truth_revealed' });
      console.log(`[系統] ${socket.id} 個人進入真相大白階段`);
    });

    socket.on('start_ending_phase', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.users.find(u => u.id === socket.id);
      if (!user?.isHost) return;

      if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
      room.phase = 'game_ending';
      room.phaseEndTime = undefined;

      io.to(currentRoomId).emit('room_state', getRoomState(currentRoomId));
      console.log(`[系統] 房間 ${currentRoomId} 進入勝負結算畫面`);
    });

    // ── 會議室自動化流程事件 ────────────────────────────────────
    socket.on('meeting_ready', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const user = room.users.find(u => u.id === socket.id);
      
      if (user) {
        if (!room.meetingReadyUsers) room.meetingReadyUsers = new Set();
        room.meetingReadyUsers.add(user.email);
        
        const playingCount = room.users.filter(u => u.connectionStatus !== 'offline' && u.assignedCharacter).length;
        io.to(currentRoomId).emit('room_state', getRoomState(currentRoomId));

        if (room.meetingReadyUsers.size >= playingCount) {
          if (room.meetingStage === 'pre_round_organizing') {
            startRoundRobin(currentRoomId); // 🌟 全員就緒，提早啟動輪流發言
          } else if (room.meetingStage === 'organizing') {
            if (room.currentRound === 1) {
              startFreeDiscussion(currentRoomId);
            } else {
              startVotingPromptStage(currentRoomId);
            }
          } else if (room.meetingStage === 'free_discussion') {
            if (room.currentRound === 1) {
              const next = getNextRoundStartPhase(room.scriptId);
              room.currentRound = 2; // 統一將回合 +1
              startPhase(currentRoomId, next.phase, next.duration);
            } else {
              startPhase(currentRoomId, 'game_voting', 180);
            }
          }
        }
      }
    });

    socket.on('vote_more_discussion', (needsDiscussion: boolean) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.meetingStage !== 'voting_prompt') return;
      
      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        // 🌟 防呆：確保 moreDiscussionVotes 已經被初始化為物件
        if (!room.moreDiscussionVotes) {
          room.moreDiscussionVotes = {};
        }

        room.moreDiscussionVotes[user.email] = needsDiscussion;
        io.to(currentRoomId).emit('room_state', getRoomState(currentRoomId));

        const playingCount = room.users.filter(u => u.connectionStatus !== 'offline' && u.assignedCharacter).length;
        
        // 🌟 現在 TypeScript 就知道它絕對是個 object，不會報錯了
        if (Object.keys(room.moreDiscussionVotes).length >= playingCount) {
          const wantsMore = Object.values(room.moreDiscussionVotes).some(v => v === true);
          
          if (wantsMore) {
            startFreeDiscussion(currentRoomId);
          } else {
            startPhase(currentRoomId, 'game_voting', 180);
          }
        }
      }
    });

    // ── 發言控制 ──────────────────────────────────────────

    socket.on('skip_turn', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.currentSpeakerIndex >= 0 && room.meetingUsers[room.currentSpeakerIndex]?.id === socket.id) {
        nextTurn(currentRoomId);
      }
    });

    socket.on('toggle_mic', (isOn: boolean) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      // 🌟 非會議階段 (角色預覽、個人檔案、搜證、搜證結束) 開放自由開麥
      const isFreeMicPhase = ['room_lobby', 'character_preview', 'game_profile', 'game_search', 'search_end', 'truth_revealed'].includes(room.phase);

      let user = room.meetingUsers.find(u => u.id === socket.id);

      // 🌟 修正：自由開麥階段找不到 meetingUser 時，從 room.users 補建一筆
      if (!user && isFreeMicPhase) {
        const roomUser = room.users.find(u => u.id === socket.id);
        if (roomUser) {
          const entry = {
            id: roomUser.id,
            email: roomUser.email,
            name: roomUser.name,
            avatar: roomUser.avatar,
            character: roomUser.assignedCharacter ?? '',
            isMicOn: false,
            lastSpokeTime: Date.now(),
            isAI: false,
          };
          room.meetingUsers.push(entry);
          user = entry;
        }
      }

      if (user) {
        // 會議階段才檢查「是否輪到你」；自由開麥階段任何人都能開
        if (!isFreeMicPhase && isOn && room.meetingUsers[room.currentSpeakerIndex]?.id !== socket.id) return;
        user.isMicOn = isOn;
        if (isOn) {
          user.lastSpokeTime = Date.now();
          room.isWarningActive = false;
        }
        broadcastMeetingState(currentRoomId);
      }
    });

    socket.on('user_speaking', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const user = room.meetingUsers.find(u => u.id === socket.id);
      if (user && room.meetingUsers[room.currentSpeakerIndex]?.id === socket.id) {
        user.lastSpokeTime = Date.now();
        if (room.isWarningActive) {
          room.isWarningActive = false;
          io.to(currentRoomId).emit('warning_cancelled');
          broadcastMeetingState(currentRoomId);
        }
      }
    });
    
    let lastSpeakingDataBroadcast = 0;
    let lastSubtitleBroadcast = 0;
    let pendingSubtitleData: { volume?: number; cpm?: number; subtitle?: string } | null = null;
    let pendingSubtitleTimer: NodeJS.Timeout | null = null;

    socket.on('speaking_data', (data: { volume?: number; cpm?: number; subtitle?: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const isFreeMicPhase = ['room_lobby', 'character_preview', 'game_profile', 'game_search', 'search_end', 'truth_revealed'].includes(room.phase);
      if (!isFreeMicPhase && room.meetingUsers[room.currentSpeakerIndex]?.id !== socket.id) return;

      const now = Date.now();

      // 🌟 字幕事件改成 200ms 節流（最後一筆一定 flush，避免漏掉句尾）
      if (data.subtitle) {
        const elapsed = now - lastSubtitleBroadcast;
        if (elapsed >= 200) {
          lastSubtitleBroadcast = now;
          socket.to(currentRoomId).emit('speaking_data', data);
          pendingSubtitleData = null;
          if (pendingSubtitleTimer) { clearTimeout(pendingSubtitleTimer); pendingSubtitleTimer = null; }
        } else {
          // 在節流區間內，先把這筆暫存，並排定 flush
          pendingSubtitleData = data;
          if (!pendingSubtitleTimer) {
            const wait = 200 - elapsed;
            const roomId = currentRoomId;
            pendingSubtitleTimer = setTimeout(() => {
              if (pendingSubtitleData && rooms.has(roomId)) {
                lastSubtitleBroadcast = Date.now();
                socket.to(roomId).emit('speaking_data', pendingSubtitleData);
              }
              pendingSubtitleData = null;
              pendingSubtitleTimer = null;
            }, wait);
          }
        }
        return;
      }

      // volume / cpm 維持原本 150ms 節流
      const hasContent = data.cpm !== undefined;
      if (hasContent || now - lastSpeakingDataBroadcast >= 150) {
        lastSpeakingDataBroadcast = now;
        socket.to(currentRoomId).emit('speaking_data', data);
      }
    });

    // 🌟 接收某人的最終 ASR 結果，廣播給房間裡其他人
    socket.on('final_transcript', (data: { line: string; round: number }) => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit('final_transcript', data);
    });

    // ── WebRTC 信令 ────────────────────────────────────────

    socket.on('webrtc_offer', (data) => {
      io.to(data.target).emit('webrtc_offer', { sender: socket.id, sdp: data.sdp });
      // Flush buffered ICE candidates for this pair
      const key = `${data.target}->${socket.id}`;
      if (iceCandidateBuffers[key]?.length) {
        iceCandidateBuffers[key].forEach(candidate => {
          io.to(data.target).emit('webrtc_ice', { sender: socket.id, candidate });
        });
        iceCandidateBuffers[key] = [];
      }
    });

    socket.on('webrtc_answer', (data) => {
      io.to(data.target).emit('webrtc_answer', { sender: socket.id, sdp: data.sdp });
      // Flush buffered candidates in both directions
      const key = `${socket.id}->${data.target}`;
      if (iceCandidateBuffers[key]?.length) {
        iceCandidateBuffers[key].forEach(candidate => {
          io.to(data.target).emit('webrtc_ice', { sender: socket.id, candidate });
        });
        iceCandidateBuffers[key] = [];
      }
    });

    socket.on('webrtc_ice', (data) => {
      io.to(data.target).emit('webrtc_ice', { sender: socket.id, candidate: data.candidate });
    });
  });
}