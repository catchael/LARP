import React from 'react';
import { motion } from 'motion/react';

export const Mascot: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
      >
        <div className="flex gap-4">
          <div className="w-3 h-3 bg-white rounded-full" />
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
        <div className="absolute bottom-6 w-8 h-4 border-b-4 border-white rounded-full" />
        <div className="absolute -top-2 -right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
          Hi!
        </div>
      </motion.div>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 max-w-xs text-center relative"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-100" />
          <p className="text-slate-700 font-medium">{message}</p>
        </motion.div>
      )}
    </div>
  );
};
