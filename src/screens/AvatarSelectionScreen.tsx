import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dice5, UserCircle } from 'lucide-react'; // 👈 新增引入 UserCircle

interface AvatarSelectionScreenProps {
  onConfirm: (url: string, name: string) => void; // 👈 參數增加 name
  initialName?: string;
}

export const AvatarSelectionScreen: React.FC<AvatarSelectionScreenProps> = ({ 
  onConfirm,
  initialName = ''
}) => {
  const [seed, setSeed] = useState(Math.random().toString(36).substring(7));
  const [avatarUrl, setAvatarUrl] = useState('');
  const [playerName, setPlayerName] = useState(initialName); // 👈 新增暱稱狀態

  const roll = () => {
    const newSeed = Math.random().toString(36).substring(2, 15);
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,f8d3d0,fcdcc1,d7e9b9,b3ffb3,b3ffff&mouth=concerned,default,disbelief,eating,grimace,sad,serious,smile,tongue,twinkle&eyes=default,happy,surprised,wink,side,hearts`;
    setSeed(newSeed);
    setAvatarUrl(url);
  };

  useEffect(() => { roll(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 border border-slate-700 p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full"
      >
        <h2 className="text-3xl font-black text-white mb-2">創造你的專屬角色</h2>
        <p className="text-slate-400 mb-8">設定你的暱稱與大頭貼</p>
        
        <div className="flex justify-center mb-6">
          <div className="relative group p-4 bg-white/5 rounded-full border-2 border-indigo-500/30">
            <img src={avatarUrl} alt="Avatar" className="w-40 h-40 rounded-full" />
            <button 
              onClick={roll}
              className="absolute bottom-0 right-0 p-3 bg-indigo-600 rounded-full text-white shadow-lg hover:scale-110 transition-transform active:scale-95"
            >
              <Dice5 size={20} />
            </button>
          </div>
        </div>

        {/* 🌟 新增的暱稱輸入框 */}
        <div className="mb-8 text-left">
          <label className="block text-slate-400 text-sm font-bold mb-2 flex items-center gap-2">
            <UserCircle size={16}/> 你的暱稱
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="請輸入暱稱 (若空白則顯示信箱)"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
            maxLength={12}
          />
        </div>

        <button
          onClick={() => onConfirm(avatarUrl, playerName)}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          以此身分開始遊戲！
        </button>
      </motion.div>
    </div>
  );
};