import React from 'react';
import { motion } from 'motion/react';
import { LogIn, BookOpen } from 'lucide-react';

interface LoginScreenProps {
  email: string;
  setEmail: (email: string) => void;
  handleLogin: (e: React.FormEvent) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ email, setEmail, handleLogin }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass p-10 rounded-3xl">
    <div className="flex justify-center mb-8">
      <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
        <BookOpen className="text-white" size={40} />
      </div>
    </div>
    <h1 className="text-3xl font-bold text-center mb-2">劇本殺表達學院</h1>
    <p className="text-slate-500 text-center mb-8">請輸入您的 Email 以開始學習之旅</p>
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">電子郵件</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          placeholder="your@email.com"
        />
      </div>
      <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
        登入系統 <LogIn size={20} />
      </button>
    </form>
  </motion.div>
);