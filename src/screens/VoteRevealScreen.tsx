import React from 'react';
import { motion } from 'motion/react';
import { SCRIPTS } from '../data/scripts';

interface VoteRevealScreenProps {
  winner: string;          // 被投出的角色名
  voteCount: Record<string, number>;
  previewScript: typeof SCRIPTS[0] | null;
}

export const VoteRevealScreen: React.FC<VoteRevealScreenProps> = ({
  winner,
  voteCount,
  previewScript,
}) => {
  const character = previewScript?.characters.find(c => c.name === winner);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-slate-950"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-slate-400 text-sm tracking-[0.4em] uppercase mb-12 font-serif"
      >
        Voting Result
      </motion.div>

      {character?.image && (
        <motion.img
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
          src={character.image}
          alt={winner}
          referrerPolicy="no-referrer"
          className="w-44 h-44 rounded-full object-cover border-4 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] mb-8 grayscale"
        />
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-6xl font-black text-white tracking-tight mb-3"
      >
        {winner}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-2xl text-red-400 font-bold tracking-widest mb-12"
      >
        被認定為兇手
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="flex gap-4 flex-wrap justify-center max-w-xl"
      >
        {Object.entries(voteCount)
          .sort((a, b) => b[1] - a[1])
          .map(([char, n]) => (
            <div
              key={char}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm"
            >
              <span className="font-bold">{char}</span>
              <span className="text-white/40 ml-2">{n} 票</span>
            </div>
          ))}
      </motion.div>
    </motion.div>
  );
};