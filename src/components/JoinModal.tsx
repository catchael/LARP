import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Users, X } from 'lucide-react';
import { User } from '../types';
import { SCRIPTS } from '../data/scripts';

interface JoinModalProps {
  showJoinModal: boolean;
  previewScript: typeof SCRIPTS[0] | null;
  setShowJoinModal: (v: boolean) => void;
  socket: any;
  user: User | null;
  publicRooms: Record<number, { id: string, hostEmail: string, currentPlayers: number }[]>;
}

export const JoinModal: React.FC<JoinModalProps> = ({
  showJoinModal,
  previewScript,
  setShowJoinModal,
  socket,
  user,
  publicRooms,
}) => {
  if (!showJoinModal || !previewScript) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">加入房間</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">JOIN GAME SESSION</p>
            </div>
          </div>
          <button
            onClick={() => setShowJoinModal(false)}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Manual Join */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">手動輸入 ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="請輸入 6 位房間 ID"
                className="flex-1 px-6 py-4 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400"
                id="manual-room-id"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      socket.emit('join_room', { 
                        email: user?.email, 
                        name: user?.name,
                        avatar: user?.avatar, 
                        roomId: val,
                      }); // 👈 修改這裡
                      setShowJoinModal(false);
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('manual-room-id') as HTMLInputElement;
                  if (input.value) {
                    socket.emit('join_room', { 
                      email: user?.email, 
                      name: user?.name,
                      avatar: user?.avatar, 
                      roomId: input.value 
                    }); // 👈 修改這裡
                    setShowJoinModal(false);
                  }
                }}
                className="px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                加入
              </button>
            </div>
          </div>

          {/* Public Rooms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">公開房間列表</label>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">
                {publicRooms[previewScript.id]?.length || 0} 個在線
              </span>
            </div>

            <div className="space-y-2">
              {publicRooms[previewScript.id]?.length > 0 ? (
                publicRooms[previewScript.id].map(room => (
                  <button
                    key={room.id}
                    onClick={() => {
                      socket.emit('join_room', { 
                        email: user?.email, 
                        name: user?.name, 
                        avatar: user?.avatar,
                        roomId: room.id 
                      }); // 👈 修改這裡
                      setShowJoinModal(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">
                        {room.id.substring(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {room.hostEmail.split('@')[0]} 的房間
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          ID: {room.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                        <Users size={12} />
                        {room.currentPlayers} / {previewScript.characters.length}
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center space-y-3 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Users size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">目前沒有公開房間</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};