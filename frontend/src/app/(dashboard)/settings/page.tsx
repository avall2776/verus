"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUserSync, getCachedUser } from "@/lib/userCache";
import {
  Building,
  Users,
  Network,
  MessageSquare,
  Zap,
  Loader2,
  Sliders,
  ShieldCheck,
  CreditCard,
  Sparkles,
  KeyRound,
  PackageCheck,
  User,
} from "lucide-react";

import CompanySettingsTab from "@/components/settings/CompanySettingsTab";
import PlanSettingsTab from "@/components/settings/PlanSettingsTab";
import AiSettingsTab from "@/components/settings/AiSettingsTab";
import UsersSettingsTab from "@/components/settings/UsersSettingsTab";
import DepartmentsSettingsTab from "@/components/settings/DepartmentsSettingsTab";
import QuickRepliesSettingsTab from "@/components/settings/QuickRepliesSettingsTab";
import AutomationsSettingsTab from "@/components/settings/AutomationsSettingsTab";
import ApiSettingsTab from "@/components/settings/ApiSettingsTab";
import ProposalProductsSettingsTab from "@/components/settings/ProposalProductsSettingsTab";
import AccountSettingsTab from "@/components/settings/AccountSettingsTab";

import { useTheme } from "@/contexts/ThemeContext";

type TabId =
  | "company"
  | "plan"
  | "ai"
  | "users"
  | "departments"
  | "products"
  | "quick-replies"
  | "automations"
  | "api"
  | "account";

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
    id: "plan",
    label: "Plano & Assinatura",
    description: "Plano contratado, limites operacionais e recursos liberados",
    icon: CreditCard,
  },
  {
    id: "ai",
    label: "Inteligência Artificial",
    description: "Degustação oficial de 7 dias, conexão da sua chave própria da OpenAI e créditos",
    icon: Sparkles,
  },
  {
    id: "users",
    label: "Equipe & Usuários",
    description: "Gestão de acessos, convite de colaboradores e níveis de permissão",
    icon: Users,
  },
  {
    id: "departments",
    label: "Departamentos & Filas",
    description: "Segmentação de atendimento, roteamento de filas e filiais",
    icon: Network,
  },
  {
    id: "products",
    label: "Catálogo & Drive (Propostas)",
    description: "Pasta do Drive e catálogo de produtos com fotos integradas para orçamentos e propostas",
    icon: PackageCheck,
  },
  {
    id: "quick-replies",
    label: "Respostas Rápidas",
    description: "Atalhos de teclado (macros) para envio ágil de mensagens no Inbox",
    icon: MessageSquare,
  },
  {
    id: "automations",
    label: "Automações & Gatilhos",
    description: "Gatilhos de fluxo, regras automáticas do CRM e webhooks",
    icon: Zap,
  },
  {
    id: "api",
    label: "APIs & Webhooks",
    description: "Tokens de acesso, documentação da API e webhook de tráfego pago (Meta Ads)",
    icon: KeyRound,
  },
  {
    id: "account",
    label: "Minha Conta",
    description: "Informações pessoais, foto de perfil, credenciais de acesso e preferências",
    icon: User,
  },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isWhatsApp, isClean } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(() => getStoredUserSync());

  useEffect(() => {
    getCachedUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  const visibleTabs = useMemo(() => {
    if (!currentUser || currentUser.role === "ADMIN" || currentUser.isSuperAdmin) {
      return SETTINGS_TABS;
    }

    const perms = currentUser.permissions || {};
    const menus = perms.menus;

    return SETTINGS_TABS.filter((tab) => {
      if (tab.id === "company") {
        if (menus?.settings !== undefined) return menus.settings;
        return perms.settings === true;
      }
      if (tab.id === "plan") {
        if (menus?.billing !== undefined) return menus.billing;
        return perms.settings === true;
      }
      if (tab.id === "ai") {
        if (menus?.ai_agents !== undefined) return menus.ai_agents;
        return perms.automations === true;
      }
      if (tab.id === "users") {
        if (menus?.users !== undefined) return menus.users;
        return perms.settings === true;
      }
      if (tab.id === "departments") {
        if (menus?.departments !== undefined) return menus.departments;
        return perms.settings === true;
      }
      if (tab.id === "products") {
        if (menus?.products !== undefined) return menus.products;
        return perms.settings === true;
      }
      if (tab.id === "quick-replies") {
        if (menus?.quick_replies !== undefined) return menus.quick_replies;
        return perms.settings === true;
      }
      if (tab.id === "automations") {
        if (menus?.automations !== undefined) return menus.automations;
        return perms.automations === true;
      }
      if (tab.id === "api") {
        if (menus?.webhooks !== undefined) return menus.webhooks;
        return perms.settings === true;
      }
      if (tab.id === "account") {
        if (menus?.my_account !== undefined) return menus.my_account;
        return true;
      }
      return true;
    });
  }, [currentUser]);

  const rawTab = searchParams.get("tab") as TabId | null;

  const activeTab: TabId =
    rawTab && visibleTabs.some((t) => t.id === rawTab)
      ? rawTab
      : visibleTabs[0]?.id || "company";

  const handleSelectTab = (tabId: TabId) => {
    router.push(`/settings?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1700px] px-2 sm:px-4 md:px-6 mx-auto gap-5 pb-8 animate-in fade-in duration-150">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-2.5">
            <Sliders className={`w-5 h-5 sm:w-6 sm:h-6 ${isWhatsApp ? "text-emerald-500" : "text-blue-600 dark:text-blue-500"}`} />
            Configurações do Sistema
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Central de administração corporativa, controle de acessos da equipe e parametrizações operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shadow-sm shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Ambiente Seguro Multi-Tenant</span>
        </div>
      </div>

      {/* Barra de Abas Superior Horizontal Unificada para Todas as Abas */}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-200 dark:border-slate-800/80">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            let tabClasses = "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60";
            let iconClasses = "text-slate-400 dark:text-slate-500";

            if (isActive) {
              if (isWhatsApp) {
                tabClasses = "bg-emerald-600 text-white border border-emerald-500 shadow-sm shadow-emerald-500/20 font-bold";
                iconClasses = "text-white";
              } else if (isClean) {
                tabClasses = "bg-white text-blue-700 border border-slate-200 shadow-sm font-bold ring-1 ring-blue-500/20";
                iconClasses = "text-blue-600";
              } else {
                tabClasses = "bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-sm font-bold";
                iconClasses = "text-blue-400";
              }
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${tabClasses}`}
              >
                <Icon className={`w-3.5 h-3.5 ${iconClasses}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Renderização em Largura Total (Full-Width) sem caixas comprimidas dentro de caixas */}
        <div className="w-full min-w-0">
          {activeTab === "company" && <CompanySettingsTab />}
          {activeTab === "plan" && <PlanSettingsTab />}
          {activeTab === "ai" && <AiSettingsTab />}
          {activeTab === "users" && <UsersSettingsTab />}
          {activeTab === "departments" && <DepartmentsSettingsTab />}
          {activeTab === "products" && <ProposalProductsSettingsTab />}
          {activeTab === "quick-replies" && <QuickRepliesSettingsTab />}
          {activeTab === "automations" && <AutomationsSettingsTab />}
          {activeTab === "api" && <ApiSettingsTab />}
          {activeTab === "account" && <AccountSettingsTab />}
        </div>
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