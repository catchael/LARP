import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Clock, LogOut, Play, UserCircle, Users, Zap } from 'lucide-react';
import { AppPhase, RoomState, User, cn } from '../types';
import { SCRIPTS } from '../data/scripts';

interface RoomLobbyScreenProps {
  roomState: RoomState | null;
  previewScript: typeof SCRIPTS[0] | null;
  user: User | null;
  socket: any;
  resetRoomState: () => void;
  setPhase: (p: AppPhase) => void;
  setCurrentCharacterIndex: (n: number) => void;
}

export const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = ({
  roomState,
  previewScript,
  user,
  socket,
  resetRoomState,
  setPhase,
  setCurrentCharacterIndex,
}) => {
  if (!roomState || !previewScript) return null;

  const isHost = roomState.users.find(u => u.email === user?.email)?.isHost;
  const currentPlayers = roomState.users.length;
  const maxPlayers = previewScript.characters.length;
  const isFull = currentPlayers === maxPlayers;
  const canStart = isFull;  // 🌟 人數湊齊就能開始

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl w-full space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">遊戲準備大廳</h2>
          <p className="text-slate-400 font-bold">房間 ID: <span className="text-indigo-600">{roomState.id}</span></p>
        </div>
        {/* 🌟 替換成這段：現在有解散與離開兩個按鈕了 */}
        <div className="flex gap-4">
          {isHost && (
            <button
              onClick={() => {
                if (window.confirm('確定要解散房間嗎？所有玩家將被踢出。')) {
                  socket?.emit('disband_room');
                }
              }}
              className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <AlertTriangle size={20} /> 解散房間
            </button>
          )}

          <button
            onClick={() => {
              socket?.emit('leave_room');
              resetRoomState();
              setPhase('script_detail');
            }}
            className="px-6 py-3 bg-white text-slate-500 rounded-2xl font-bold border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <LogOut size={20} /> 離開房間
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Room Info & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] space-y-6">
            <div className="aspect-video rounded-3xl overflow-hidden relative group">
              <img
                src={previewScript.image}
                alt={previewScript.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-2xl font-bold text-white tracking-tight">{previewScript.title}</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Users className="text-indigo-500" size={20} />
                  <span className="font-bold text-slate-600">目前人數</span>
                </div>
                <span className="text-lg font-black text-indigo-600">{currentPlayers} / {maxPlayers}</span>
              </div>

              {isHost && (
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">角色分配方式</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      onClick={() => socket?.emit('toggle_assignment', 'manual')}
                      className={cn(
                        "py-3 rounded-xl font-bold transition-all",
                        roomState.assignmentMethod === 'manual'
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      自行挑選
                    </button>
                    <button
                      onClick={() => socket?.emit('toggle_assignment', 'random')}
                      className={cn(
                        "py-3 rounded-xl font-bold transition-all",
                        roomState.assignmentMethod === 'random'
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      隨機分配
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isHost ? (
              <div className="space-y-3">
                <button
                  onClick={() => socket?.emit('start_game', { allCharacters: previewScript.characters.map(c => c.name) })}
                  disabled={!canStart}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                >
                  <Play size={24} fill="currentColor" /> 開始遊戲
                </button>
                {currentPlayers < maxPlayers && (
                  <button
                    onClick={() => {
                      if (confirm('確定要強制開始嗎？未加入的玩家將由 AI 託管。')) {
                        socket?.emit('start_game', { allCharacters: previewScript.characters.map(c => c.name) });
                      }
                    }}
                    className="w-full py-3 bg-amber-50 text-amber-600 rounded-2xl font-bold hover:bg-amber-100 transition-all border border-amber-100 flex items-center justify-center gap-2"
                  >
                    <Zap size={18} /> 強制開始 (AI 託管)
                  </button>
                )}
                {!canStart && (
                  <p className="text-center text-xs font-bold text-amber-500 animate-pulse">
                    等待玩家加入 ({currentPlayers}/{maxPlayers})
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold">
                  <Clock size={20} className="animate-spin-slow" />
                  <span>等待房主開始遊戲</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {!isFull ? `目前人數: ${currentPlayers}/${maxPlayers}` : '準備就緒，即將開始'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Players & Characters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {roomState.assignmentMethod === 'manual' ? '請選擇您的角色' : '等待房主開始遊戲'}
              </h3>
              <div className="flex -space-x-3">
                {roomState.users.map((u, i) => (
                  <div
                    key={u.id}
                    className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm"
                    title={u.email}
                  >
                    <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {previewScript.characters.map((char, idx) => {
                // 大廳現在不顯示「誰選了誰」，因為還沒到選角階段
                return (
                  <div
                    key={char.name}
                    /* 徹底移除點擊選角 onClick */
                    className={cn(
                      "relative p-6 rounded-3xl border-2 transition-all group overflow-hidden",
                      "border-slate-100 bg-white" 
                    )}
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div className="space-y-1">
                        <h4 className="text-xl font-bold text-slate-900">{char.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{char.role}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentCharacterIndex(idx);
                          setPhase('character_preview');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline px-4 py-2 bg-indigo-50 rounded-lg"
                      >
                        查看詳情
                      </button>
                      {/* 這裡不再顯示「已選擇」標籤 */}
                    </div>
                    
                    {/* 裝飾性圖示 */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                      <UserCircle size={120} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};