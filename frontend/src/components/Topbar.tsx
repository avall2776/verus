"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, ShieldAlert, ShieldCheck, ArrowLeft, Building2, ChevronDown, Check } from "lucide-react";
import NotificationsPopover from "@/components/notifications/NotificationsPopover";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { getStoredUserSync, clearUserCache } from "@/lib/userCache";
import toast from "react-hot-toast";

export default function Topbar() {
  const { toggleMenu } = useMobileMenu();
  const [targetTenantId, setTargetTenantId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false);
  const tenantDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncState = () => {
      if (typeof window !== "undefined") {
        setTargetTenantId(localStorage.getItem("versus_target_tenant_id"));
        setCurrentUser(getStoredUserSync());
      }
    };

    syncState();
    window.addEventListener("tenant_switched", syncState);
    window.addEventListener("user_updated", syncState);
    return () => {
      window.removeEventListener("tenant_switched", syncState);
      window.removeEventListener("user_updated", syncState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(e.target as Node)) {
        setIsTenantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      setIsSwitchingTenant(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/auth/switch-tenant", { tenantId });

      localStorage.setItem("versus_auth_token", res.data.access_token);
      localStorage.setItem("versus_user", JSON.stringify(res.data.user));
      if (res.data.user?.tenantId) {
        localStorage.setItem("tenantId", res.data.user.tenantId);
      }
      clearUserCache();

      window.dispatchEvent(new Event("tenant_switched"));
      toast.success(`Acessando ${res.data.user.tenantName}...`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alternar de empresa.");
      setIsSwitchingTenant(false);
    }
  };

  const handleExitSupportMode = () => {
    clearUserCache();
    localStorage.removeItem("versus_target_tenant_id");
    localStorage.removeItem("versus_target_tenant_name");
    localStorage.removeItem("versus_target_tenant_logo");
    localStorage.removeItem("versus_active_workspace");
    window.dispatchEvent(new Event("tenant_switched"));
    toast.success("Retornando ao console Super Admin...");
    window.location.href = "/vallor/super-admin/companies";
  };

  const isSuperAdmin = currentUser?.isSuperAdmin === true || currentUser?.role === "SUPER_ADMIN";

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#0B1224]/80 backdrop-blur-md flex items-center justify-between px-3 md:px-8 sticky top-0 z-20 w-full shrink-0 print:hidden transition-colors duration-200">
      {/* Mobile Menu Button & Busca Global Reativa */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl min-w-0">
        <button 
          type="button"
          onClick={toggleMenu}
          className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
          title="Menu de navegação"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        
        {/* Barra de Busca Global Interativa (Leads, Conversas, Equipe e Módulos) */}
        <div className="w-full min-w-0">
          <GlobalSearchBar />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-4">
        {/* Seletor Multi-Empresa para Operadores que atendem múltiplos tenants */}
        {currentUser?.availableTenants && currentUser.availableTenants.length > 1 && (
          <div className="relative" ref={tenantDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTenantDropdownOpen((prev) => !prev)}
              disabled={isSwitchingTenant}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/50 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer max-w-[200px]"
              title="Alternar entre empresas associadas ao seu usuário"
            >
              <Building2 size={13} className="text-blue-500 shrink-0" />
              <span className="truncate">{currentUser.tenantName || "Minha Empresa"}</span>
              <ChevronDown size={12} className="text-slate-400 shrink-0 ml-0.5" />
            </button>

            {isTenantDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Suas Empresas
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {currentUser.email}
                  </p>
                </div>

                {currentUser.availableTenants.map((t: any) => {
                  const isCurrent = t.tenantId === currentUser.tenantId;
                  return (
                    <button
                      key={t.tenantId}
                      type="button"
                      onClick={() => !isCurrent && handleSwitchTenant(t.tenantId)}
                      disabled={isCurrent || isSwitchingTenant}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                        isCurrent
                          ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold cursor-default"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-500 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {t.tenantName ? t.tenantName.charAt(0).toUpperCase() : "E"}
                        </div>
                        <span className="truncate">{t.tenantName}</span>
                      </div>
                      {isCurrent && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Atalho Super Admin / Sair do Modo Suporte */}
        {targetTenantId ? (
          <button
            type="button"
            onClick={handleExitSupportMode}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 cursor-pointer active:scale-95"
            title="Sair do Modo Suporte e retornar ao Console Super Admin"
          >
            <ArrowLeft size={13} className="shrink-0 text-white" />
            <span>Voltar ao Super Admin</span>
          </button>
        ) : isSuperAdmin ? (
          <Link
            href="/super-admin/companies"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Acessar o Console Super Admin"
          >
            <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Super Admin</span>
            <span className="sm:hidden text-[11px]">Admin</span>
          </Link>
        ) : null}

        {/* Alternador de Tema Triplo (Clean, Dark, WhatsApp) */}
        <ThemeToggle variant="pill" className="hidden sm:inline-flex" />
        <ThemeToggle variant="icon" className="sm:hidden" />

        {/* Central de Notificações Global (Popover Interativo em Tempo Real) */}
        <NotificationsPopover />
      </div>

    </header>
  );
}
