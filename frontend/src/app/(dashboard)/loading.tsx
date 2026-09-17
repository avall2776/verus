import React from "react";
import { Cpu, Sparkles } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full relative overflow-hidden select-none">
      {/* Glow de Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4 bg-[#0B1224]/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl max-w-sm w-full mx-4 text-center">
        {/* Ícone com Pulso e Anel Cibernético */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-600/20 to-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_25px_rgba(0,210,255,0.2)]">
          <Cpu className="w-8 h-8 animate-pulse text-cyan-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Título e Subtítulo */}
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white tracking-widest uppercase">
            VERSUS ENTERPRISE
          </h3>
          <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>Sincronizando workspace...</span>
          </p>
        </div>

        {/* Barra de Progresso Indeterminada de Alta Precisão */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
          <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}} />
    </div>
  );
}
