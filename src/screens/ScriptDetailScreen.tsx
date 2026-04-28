import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ChevronRight, Clock, Plus, Users, Zap } from 'lucide-react';
import { AppPhase, User, cn } from '../types';
import { SCRIPTS } from '../data/scripts';

interface ScriptDetailScreenProps {
  previewScript: typeof SCRIPTS[0] | null;
  setPhase: (p: AppPhase) => void;
  setShowScriptIntro: (v: boolean) => void;
  onlinePlayers: Record<number, { email: string, socketId: string }[]>;
  isPublicRoom: boolean;
  setIsPublicRoom: (v: boolean) => void;
  socket: any;
  user: User | null;
  setShowJoinModal: (v: boolean) => void;
  setCurrentCharacterIndex: (n: number) => void;
}

export const ScriptDetailScreen: React.FC<ScriptDetailScreenProps> = ({
  previewScript,
  setPhase,
  setShowScriptIntro,
  onlinePlayers,
  isPublicRoom,
  setIsPublicRoom,
  socket,
  user,
  setShowJoinModal,
  setCurrentCharacterIndex,
}) => {
  // 🌟 控制「創建房間」彈窗
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const handleCreateRoom = (isPublic: boolean) => {
    if (!previewScript) return;
    setIsPublicRoom(isPublic);
    socket?.emit('create_room', { email: user?.email, scriptId: previewScript.id, isPublic });
    setShowCreateModal(false);
  };

  if (!previewScript) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl w-full">
      <div className="glass overflow-hidden rounded-[3rem] shadow-2xl flex flex-col md:flex-row">
        <div className="md:w-1/2 relative h-80 md:h-auto">
          <img
            src={previewScript.image}
            alt={previewScript.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => setPhase('script_lobby')}
            className="absolute top-8 left-8 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-colors border border-white/30"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="md:w-1/2 p-12 space-y-8 flex flex-col">
          <div className="space-y-4">
            <div className="flex gap-2">
              {previewScript.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{previewScript.title}</h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold">
              <span>難度</span>
              <span className="text-amber-500">{previewScript.difficulty}</span>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-lg leading-relaxed">
              「{previewScript.brief}」
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                <Users size={20} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">玩家人數</span>
                <span className="text-sm font-bold text-slate-700">{(previewScript as any).players}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                <Clock size={20} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">遊戲時長</span>
                <span className="text-sm font-bold text-slate-700">{(previewScript as any).duration}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                <Zap size={20} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">核心機制</span>
                <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">{(previewScript as any).mechanics}</span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowScriptIntro(true)}
                className="w-full p-6 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-between group hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={24} />
                  <span className="text-lg">劇本簡介</span>
                </div>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-slate-400">在線玩家</span>
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>{onlinePlayers[previewScript.id]?.length || 0} 人在線</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center justify-center gap-2"
              >
                <Plus size={20} /> 創建房間
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                <Users size={20} /> 加入房間
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              onClick={() => setPhase('script_lobby')}
              className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              返回列表
            </button>
            <button
              onClick={() => { setCurrentCharacterIndex(0); setPhase('character_preview'); }}
              className="flex-[2] btn-primary py-4 text-lg shadow-xl shadow-indigo-100"
            >
              查看角色名片
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 創建房間彈窗 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">建立房間</h3>
              <p className="text-sm text-slate-500 font-medium">請選擇房間類型</p>
            </div>

            <button
              onClick={() => handleCreateRoom(true)}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
            >
              <Users size={20} />
              公開房間
            </button>

            <button
              onClick={() => handleCreateRoom(false)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <Plus size={20} />
              非公開房間
            </button>

            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              取消
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};