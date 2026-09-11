"use client";

import { BarChart, Construction } from "lucide-react";

export default function Page() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#1c1d22] border border-gray-800 rounded-2xl p-8 flex flex-col items-center max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-primary mb-6 shadow-lg relative z-10">
          <BarChart size={32} />
        </div>
        
        <h1 className="text-xl font-bold text-white mb-2 text-center relative z-10">{title}</h1>
        
        <p className="text-sm text-gray-400 text-center mb-8 relative z-10">
          Este módulo está atualmente em construção. Estamos preparando novas funcionalidades incríveis para você.
        </p>

        <div className="w-full bg-gray-900/50 rounded-xl p-4 border border-gray-800/50 flex flex-col items-center relative z-10">
          <Construction size={24} className="text-amber-500 mb-2 animate-bounce" />
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Em Breve</span>
        </div>
      </div>
    </div>
  );
}
