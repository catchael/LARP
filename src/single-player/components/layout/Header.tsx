import { Mic2, Zap } from 'lucide-react';

export const Header = () => {
  return (
    <header className="mb-10 flex items-center justify-between border-b border-slate-200/60 pb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <Mic2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Remix <span className="text-indigo-600">口語冒險</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Oral Expression Adventure</p>
        </div>
      </div>
      <div className="text-right hidden sm:flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
          <Zap className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">系統已連線</span>
        </div>
      </div>
    </header>
  );
};
