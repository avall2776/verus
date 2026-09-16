"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Bot, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  HelpCircle, 
  Loader2, 
  Zap,
  PhoneCall
} from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function PlanSettingsTab() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenants/me");
      setTenant(res.data);
    } catch (err: any) {
      console.error("[PLAN_SETTINGS_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-semibold">Carregando dados da assinatura e plano...</p>
      </div>
    );
  }

  const plan = tenant?.plan || {
    name: "Standard",
    price: 199.90,
    hasCRM: true,
    hasWhatsApp: true,
    hasInstagram: false,
    hasAIAgent: true,
    maxUsers: 3,
    maxAIMsgs: 2000,
  };

  const usersCount = tenant?._count?.users || 1;
  const userUsagePercent = Math.min(100, Math.round((usersCount / (plan.maxUsers || 1)) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span>Meu Plano & Assinatura</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize o plano contratado, recursos habilitados e cotas operacionais da sua empresa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Assinatura Ativa</span>
          </span>
        </div>
      </div>

      {/* Card de Destaque do Plano Contratado */}
      <div className="p-6 rounded-2xl bg-[#0B1224] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-400 bg-blue-600/10 px-2.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider">
              Plano Vigente
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Renovação Mensal
            </span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-wide">
            Plano {plan.name}
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Ambiente corporativo provisionado com acesso prioritário aos canais de comunicação e ferramentas de vendas.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white font-mono">
              R$ {Number(plan.price).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-medium">/mês</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Cobrança recorrente mensal</p>
        </div>
      </div>

      {/* Grade de Recursos e Módulos Inclusos */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Módulos e Recursos Habilitados na Assinatura
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* CRM */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Funil de Vendas CRM</span>
              {plan.hasCRM ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <XCircle size={16} className="text-slate-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {plan.hasCRM ? "Pipeline comercial completo e gestão de oportunidades ativo." : "Módulo indisponível no plano atual."}
            </p>
          </div>

          {/* WhatsApp */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">WhatsApp Oficial</span>
              {plan.hasWhatsApp ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <XCircle size={16} className="text-slate-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {plan.hasWhatsApp ? "Instância de atendimento conectada e sincronizada." : "Módulo indisponível no plano atual."}
            </p>
          </div>

          {/* Agente IA */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Agente IA (Vitor)</span>
              {plan.hasAIAgent ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <XCircle size={16} className="text-slate-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {plan.hasAIAgent ? `Atendimento autônomo com cota de até ${plan.maxAIMsgs} msgs/mês.` : "Módulo de IA não contratado."}
            </p>
          </div>

          {/* Instagram */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Instagram Direct</span>
              {plan.hasInstagram ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <XCircle size={16} className="text-slate-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {plan.hasInstagram ? "Recepção e envio de directs centralizado." : "Disponível a partir do plano Enterprise."}
            </p>
          </div>
        </div>
      </div>

      {/* Limites Operacionais e Consumo da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Usuários */}
        <div className="p-5 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-white">Operadores Cadastrados</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-200">
              {usersCount} de {plan.maxUsers} vagas
            </span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${userUsagePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            {usersCount >= plan.maxUsers 
              ? "Você atingiu a capacidade máxima de operadores deste plano. Para adicionar mais colaboradores, solicite um upgrade." 
              : `Você ainda pode adicionar mais ${plan.maxUsers - usersCount} colaborador(es) nesta assinatura.`}
          </p>
        </div>

        {/* Card IA e Atendimento */}
        <div className="p-5 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-indigo-400" />
              <span className="text-xs font-bold text-white">Cota Mensal do Agente IA</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-200">
              {plan.maxAIMsgs} mensagens
            </span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full w-1/4" />
          </div>

          <p className="text-[11px] text-slate-400">
            Respostas automáticas disparadas pelo modelo LLM com conhecimento especializado da sua empresa.
          </p>
        </div>
      </div>

      {/* Banner de Upgrade / Suporte */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-[#0B1224] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Precisa de mais vagas ou um plano personalizado?
            </h4>
          </div>
          <p className="text-xs text-slate-300">
            Nossa equipe técnica pode ajustar cotas de IA, conexões adicionais e limites exclusivos para sua operação.
          </p>
        </div>

        <button
          onClick={() => router.push("/support")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm shrink-0"
        >
          <span>Falar com o Suporte / Upgrade</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}
