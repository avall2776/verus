"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Sparkles, ArrowLeft, LifeBuoy } from "lucide-react";
import api from "@/lib/api";

interface PlanGuardWrapperProps {
  children: React.ReactNode;
}

export default function PlanGuardWrapper({ children }: PlanGuardWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // Sincronização e verificação de governança em tempo real
  useEffect(() => {
    let isMounted = true;

    const verifyTenantAndPlan = async () => {
      try {
        // Recupera dados locais primeiro para render inicial veloz
        const stored = localStorage.getItem("versus_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isMounted) setCurrentUser(parsed);

            // Se já constar como inativo localmente
            if (parsed.tenant && parsed.tenant.isActive === false && !parsed.isSuperAdmin) {
              handleTenantBlocked("Acesso suspenso: sua empresa está bloqueada.");
              return;
            }
          } catch (e) {}
        }

        // Validação viva contra o backend Supabase/NestJS
        const res = await api.get("/users/me");
        if (res.data && isMounted) {
          const freshUser = res.data;
          setCurrentUser(freshUser);
          localStorage.setItem("versus_user", JSON.stringify(freshUser));

          // Verificação de bloqueio da empresa
          if (freshUser.tenant && freshUser.tenant.isActive === false && !freshUser.isSuperAdmin) {
            handleTenantBlocked(
              `O acesso da empresa '${freshUser.tenant.name}' foi suspenso pela administração.`
            );
            return;
          }
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          const code = err.response?.data?.code;
          if (code === "TENANT_BLOCKED" || code === "USER_INACTIVE") {
            handleTenantBlocked(err.response?.data?.message);
          }
        }
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    verifyTenantAndPlan();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleTenantBlocked = (message?: string) => {
    localStorage.removeItem("versus_auth_token");
    localStorage.removeItem("versus_token");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("versus_user");
    sessionStorage.setItem(
      "versus_blocked_reason",
      message || "Acesso suspenso: sua empresa foi bloqueada pela administração do VERSUS."
    );
    window.location.href = "/blocked";
  };

  // Mapeamento de rotas para módulos exigidos pelo plano
  const routeRestriction = useMemo(() => {
    if (!currentUser) return null;

    const isSuperAdmin = Boolean(
      currentUser.isSuperAdmin ||
      currentUser.role === "SUPER_ADMIN" ||
      currentUser.role === "SUPERADMIN"
    );
    if (isSuperAdmin) return null;

    const plan = currentUser.tenant?.plan;
    if (!plan) return null;

    const modules = (plan.modules as Record<string, boolean>) || {};

    const routeChecks: { pathPrefix: string; moduleKey: string; name: string; requiredPlan: string }[] = [
      { pathPrefix: "/crm", moduleKey: "crm", name: "Funil Comercial & CRM", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/dashboard/crm", moduleKey: "crm", name: "Métricas de Vendas", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/contacts", moduleKey: "crm", name: "Base de Contatos CRM", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/proposals", moduleKey: "proposalsContracts", name: "Propostas Comerciais", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/contracts", moduleKey: "proposalsContracts", name: "Gestão de Contratos", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/email-inbox", moduleKey: "emailInbox", name: "Inbox de E-mail Unificado", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/dashboard/goals", moduleKey: "goals", name: "Metas & Ranking Comercial", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/dashboard/analytics", moduleKey: "analytics", name: "Analytics & Relatórios Avançados", requiredPlan: "Enterprise" },
      { pathPrefix: "/agent", moduleKey: "aiAgent", name: "Agente de IA Autônomo", requiredPlan: "Pro ou Enterprise" },
      { pathPrefix: "/chat-interno", moduleKey: "teamChat", name: "Chat Interno da Equipe", requiredPlan: "Básico, Pro ou Enterprise" },
    ];

    for (const check of routeChecks) {
      if (pathname.startsWith(check.pathPrefix)) {
        let isAllowed = false;
        if (check.moduleKey === "crm") isAllowed = Boolean(modules.crm ?? plan.hasCRM ?? false);
        else if (check.moduleKey === "aiAgent") isAllowed = Boolean(modules.aiAgent ?? plan.hasAIAgent ?? false);
        else if (check.moduleKey === "whatsapp") isAllowed = Boolean(modules.whatsapp ?? plan.hasWhatsApp ?? true);
        else isAllowed = Boolean(modules[check.moduleKey] ?? false);

        if (!isAllowed) {
          return {
            name: check.name,
            currentPlan: plan.name || "Básico",
            requiredPlan: check.requiredPlan,
          };
        }
      }
    }

    return null;
  }, [pathname, currentUser]);

  // Se a rota for de um recurso bloqueado pelo plano do tenant
  if (routeRestriction) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="max-w-md w-full bg-[#070D1B] border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Lock size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-3">
            <Sparkles size={12} className="text-amber-400" />
            <span>Recurso Não Incluso</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {routeRestriction.name}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            O plano atual da sua empresa é <strong className="text-white font-semibold">({routeRestriction.currentPlan})</strong>, 
            que não inclui este módulo. Este recurso está disponível no plano <strong className="text-blue-400 font-semibold">{routeRestriction.requiredPlan}</strong>.
          </p>

          <div className="w-full flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors border border-slate-700"
            >
              <ArrowLeft size={14} />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => router.push("/support")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-sm"
            >
              <LifeBuoy size={14} />
              <span>Solicitar Upgrade</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
