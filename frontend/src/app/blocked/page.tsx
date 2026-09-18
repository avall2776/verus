"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertTriangle, ArrowLeft, Mail, PhoneCall, RefreshCw } from "lucide-react";

export default function BlockedPage() {
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Invalida quaisquer credenciais residuais
      localStorage.removeItem("versus_auth_token");
      localStorage.removeItem("versus_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("versus_user");

      const storedReason = sessionStorage.getItem("versus_blocked_reason");
      if (storedReason) {
        setReason(storedReason);
      }
    }
  }, []);

  const handleReturnToLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("versus_blocked_reason");
    }
    router.push("/login");
  };

  const handleRetry = async () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      handleReturnToLogin();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B1224] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Luzes volumétricas decorativas em tons de alerta escuro */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-950/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-950/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid sutil de fundo */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#070D1B]/90 border border-red-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Faixa superior de status */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

          {/* Ícone de Escudo de Segurança com Pulso */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
              <ShieldAlert size={40} className="text-red-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center animate-ping opacity-75">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          {/* Badge de Governança */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <AlertTriangle size={12} />
            <span>Governança & Segurança VERSUS</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white mb-2">
            Acesso Corporativo Bloqueado
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mb-6">
            O acesso desta organização à plataforma VERSUS foi temporariamente suspenso pela administração central.
          </p>

          {/* Box de Motivo / Detalhes */}
          <div className="w-full bg-[#0B1224] border border-slate-800/80 rounded-2xl p-4 text-left mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Notificação do Sistema:
            </span>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {reason || "Sua empresa foi marcada com status 'Bloqueado' no painel de administração. Todos os acessos e sessões ativas foram revogados por motivos de segurança e governança de planos."}
            </p>
          </div>

          {/* Instruções de Desbloqueio */}
          <div className="w-full space-y-2.5 mb-8 text-left text-xs text-slate-400 border-t border-slate-800/80 pt-5">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <span>Se você é colaborador desta empresa, contate o administrador da sua conta.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <span>Para regularização de mensalidade ou reativação do serviço, acione o canal oficial do VERSUS.</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleReturnToLogin}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors border border-slate-700 shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Login</span>
            </button>

            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-300 border border-red-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isChecking ? "animate-spin text-red-400" : ""} />
              <span>{isChecking ? "Verificando..." : "Testar Reativação"}</span>
            </button>
          </div>

          {/* Contato de Suporte */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 w-full flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-slate-400" />
              <span>suporte@versus.com.br</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <PhoneCall size={12} className="text-slate-400" />
              <span>Canal Corporativo</span>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
