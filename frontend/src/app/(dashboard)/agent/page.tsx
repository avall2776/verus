"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Bot, ArrowRight, LayoutDashboard, Lock } from "lucide-react";
import Link from "next/link";

export default function LegacyAgentRedirectPage() {
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.isSuperAdmin || user.role === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
          router.replace("/super-admin/ai-agents");
          return;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-lg mx-auto space-y-6 font-sans">
      <div className="w-16 h-16 rounded-2xl bg-[#0B1224] border border-slate-800 flex items-center justify-center text-slate-300 shadow-xl">
        <Lock size={28} />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-semibold">
          Governança Centralizada
        </span>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Gestão Restrita de Agentes de IA
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed pt-1">
          Para garantir a máxima estabilidade operacional e evitar interrupções nos atendimentos automáticos do WhatsApp, as configurações cognitivas, prompts e bases de conhecimento (RAG) foram migradas exclusivamente para o painel do <strong>VERSUS Master Super Admin</strong>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <LayoutDashboard size={15} />
          <span>Voltar ao Dashboard</span>
        </Link>

        {isSuperAdmin && (
          <Link
            href="/super-admin/ai-agents"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-md"
          >
            <span>Acessar Console Super Admin</span>
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <div className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800/80 text-[11px] text-slate-400 w-full text-left">
        <div className="flex items-center gap-2 font-semibold text-slate-300 mb-1">
          <ShieldCheck size={14} className="text-slate-400" />
          <span>Precisa de ajustes no seu bot?</span>
        </div>
        <p>
          Entre em contato com o administrador da sua conta ou solicite suporte técnico especializado para calibrar o roteiro da inteligência artificial.
        </p>
      </div>
    </div>
  );
}