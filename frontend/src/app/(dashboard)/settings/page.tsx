"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building,
  Users,
  Network,
  MessageSquare,
  Zap,
  Loader2,
  Sliders,
  ShieldCheck,
} from "lucide-react";

import CompanySettingsTab from "@/components/settings/CompanySettingsTab";
import UsersSettingsTab from "@/components/settings/UsersSettingsTab";
import DepartmentsSettingsTab from "@/components/settings/DepartmentsSettingsTab";
import QuickRepliesSettingsTab from "@/components/settings/QuickRepliesSettingsTab";
import AutomationsSettingsTab from "@/components/settings/AutomationsSettingsTab";

type TabId = "company" | "users" | "departments" | "quick-replies" | "automations";

interface TabConfig {
  id: TabId;
  label: string;
  description: string;
  icon: React.ElementType;
}

const SETTINGS_TABS: TabConfig[] = [
  {
    id: "company",
    label: "Dados da Empresa",
    description: "Razão social, CNPJ, contato e configurações cadastrais do tenant",
    icon: Building,
  },
  {
    id: "users",
    label: "Equipe e Usuários",
    description: "Gestão de acessos, convite de colaboradores e níveis de permissão",
    icon: Users,
  },
  {
    id: "departments",
    label: "Departamentos e Filas",
    description: "Segmentação de atendimento, roteamento de filas e filiais",
    icon: Network,
  },
  {
    id: "quick-replies",
    label: "Respostas Rápidas",
    description: "Atalhos de teclado (macros) para envio ágil de mensagens no Inbox",
    icon: MessageSquare,
  },
  {
    id: "automations",
    label: "Automações e Gatilhos",
    description: "Gatilhos de fluxo, regras automáticas do CRM e webhooks",
    icon: Zap,
  },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") as TabId | null;

  const activeTab: TabId =
    rawTab && SETTINGS_TABS.some((t) => t.id === rawTab) ? rawTab : "company";

  const handleSelectTab = (tabId: TabId) => {
    router.push(`/settings?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto gap-6 pb-8 animate-in fade-in duration-150">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-blue-500" />
            Configurações do Sistema
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Central de administração corporativa, controle de acessos da equipe e parametrizações operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070D1B] border border-slate-800 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ambiente Seguro Multi-Tenant</span>
        </div>
      </div>

      {/* Layout de Abas: Navegação Lateral + Painel de Conteúdo */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start">
        {/* Menu Lateral de Abas */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-1.5 bg-[#0B1224]/80 border border-slate-800/80 rounded-2xl p-3 shadow-xl backdrop-blur-sm">
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Módulos de Configuração
          </div>

          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-start gap-3 w-full p-3 rounded-xl transition-all text-left group ${
                  isActive
                    ? "bg-blue-600/15 border border-blue-500/30 text-white shadow-lg shadow-blue-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/60 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs font-bold block ${
                      isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </span>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Painel Central de Conteúdo */}
        <main className="flex-1 w-full min-w-0 bg-[#0B1224]/80 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
          {activeTab === "company" && <CompanySettingsTab />}
          {activeTab === "users" && <UsersSettingsTab />}
          {activeTab === "departments" && <DepartmentsSettingsTab />}
          {activeTab === "quick-replies" && <QuickRepliesSettingsTab />}
          {activeTab === "automations" && <AutomationsSettingsTab />}
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">Carregando configurações...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}