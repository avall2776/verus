"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Kanban,
  Activity,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  ShieldCheck,
  Clock,
  ChevronRight,
  Layers,
  Lightbulb,
  Command
} from "lucide-react";

interface WelcomeDashboardProps {
  onViewMetrics?: () => void;
  hasMetrics?: boolean;
}

export default function WelcomeDashboard({ onViewMetrics, hasMetrics = true }: WelcomeDashboardProps) {
  const [userName, setUserName] = useState<string>("Operador");
  const [userRole, setUserRole] = useState<string>("Atendente");
  const [companyName, setCompanyName] = useState<string>("VERSUS");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.role) {
          setUserRole(parsed.role === "ADMIN" || parsed.role === "SUPER_ADMIN" ? "Administrador" : "Atendente");
        }
        if (parsed.tenant?.name) setCompanyName(parsed.tenant.name);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const quickModules = [
    {
      title: "WhatsApp & Inbox",
      description: "Atendimento em tempo real, gestão de conversas ativas e transbordo de IA.",
      href: "/inbox",
      icon: MessageSquare,
      badge: "Ao Vivo",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Funil de Vendas (CRM)",
      description: "Quadro Kanban de negociações, qualificação de leads e gestão de propostas.",
      href: "/crm",
      icon: Kanban,
      badge: "Comercial",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "Monitor Operacional",
      description: "Visão em tempo real das filas de espera, status dos atendentes e tráfego.",
      href: "/monitor",
      icon: Activity,
      badge: "Tempo Real",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      title: "Central de Suporte",
      description: "Autoatendimento inteligente, chamados com a equipe e histórico técnico.",
      href: "/support",
      icon: LifeBuoy,
      badge: "LERO",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-6 px-4 animate-[hologramBoot_1.4s_ease-out_forwards] opacity-0 relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hologramBoot {
          0% {
            opacity: 0;
            filter: blur(14px) brightness(160%);
            transform: scale(0.96) translateY(20px);
          }
          100% {
            opacity: 1;
            filter: blur(0px) brightness(100%);
            transform: scale(1) translateY(0);
          }
        }
        @keyframes floatSubtle {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-4px); }
        }
      `}} />

      {/* Grid de Fundo Sutil Corporativo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1620380a_1px,transparent_1px),linear-gradient(to_bottom,#1620380a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Container Central de Boas-Vindas */}
      <div className="w-full max-w-4xl flex flex-col gap-6 relative z-10">
        {/* Header Hero */}
        <div className="bg-[#0B1224] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Luz de destaque corporativa azul escura */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              {/* Badge de Status e Perfil */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>VERSUS WORKSPACE OPERACIONAL</span>
                </span>
                
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{userRole}</span>
                </span>
              </div>

              {/* Saudação Personalizada */}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Bem-vindo de volta, <span className="text-blue-400">{userName}</span>!
              </h1>

              {/* Frase de Impacto Institucional */}
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                A mais avançada plataforma corporativa de inteligência em vendas, atendimento omnichannel e automações empresariais para <strong className="text-white">{companyName}</strong>.
              </p>
            </div>

            {/* Ação Alternativa: Ver Métricas Analíticas */}
            {hasMetrics && onViewMetrics && (
              <div className="shrink-0">
                <button
                  onClick={onViewMetrics}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#070D1B] hover:bg-slate-800/80 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all hover:border-blue-500/40 shadow-sm group"
                >
                  <BarChart3 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Ver Métricas do Dia</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Dica de Produtividade */}
        <div className="bg-[#070D1B] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Dica de Produtividade
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pressione <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-blue-300 font-semibold shadow-inner">Ctrl + K</kbd> para buscar contatos ou navegue pelas abas no menu lateral.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Sistema pronto para operações</span>
          </div>
        </div>

        {/* Cards de Acesso Rápido aos Módulos */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Módulos em Destaque
            </span>
            <span className="text-[11px] text-slate-500">
              Ou selecione qualquer opção no menu à esquerda
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {quickModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0B1224] border border-slate-800/80 hover:border-blue-500/40 transition-all flex flex-col justify-between group hover:bg-[#0B1224]/90 shadow-lg hover:shadow-blue-600/5 relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#070D1B] border border-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:border-blue-500/30 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      {item.title}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                    <span>Acessar Módulo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
