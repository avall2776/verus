"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, ShieldAlert, ShieldCheck, ArrowLeft, MonitorSmartphone } from "lucide-react";
import NotificationsPopover from "@/components/notifications/NotificationsPopover";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import DeviceSandboxModal from "@/components/super-admin/DeviceSandboxModal";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { getStoredUserSync, clearUserCache } from "@/lib/userCache";
import toast from "react-hot-toast";

export default function Topbar() {
  const { toggleMenu } = useMobileMenu();
  const [targetTenantId, setTargetTenantId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  useEffect(() => {
    const syncState = () => {
      if (typeof window !== "undefined") {
        setTargetTenantId(localStorage.getItem("versus_target_tenant_id"));
        setCurrentUser(getStoredUserSync());
      }
    };

    const handleOpenSandbox = () => {
      setIsSandboxOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalho rápido: Alt + S para abrir o simulador
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        const user = getStoredUserSync();
        if (user?.isSuperAdmin === true || user?.role === "SUPER_ADMIN") {
          e.preventDefault();
          setIsSandboxOpen((prev) => !prev);
        }
      }
    };

    syncState();
    window.addEventListener("tenant_switched", syncState);
    window.addEventListener("user_updated", syncState);
    window.addEventListener("open_device_sandbox", handleOpenSandbox);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("tenant_switched", syncState);
      window.removeEventListener("user_updated", syncState);
      window.removeEventListener("open_device_sandbox", handleOpenSandbox);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    <header className="h-16 border-b border-slate-800 bg-[#0B1224]/80 backdrop-blur-md flex items-center justify-between px-3 md:px-8 sticky top-0 z-20 w-full shrink-0 print:hidden">
      {/* Mobile Menu Button & Busca Global Reativa */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl min-w-0">
        <button 
          type="button"
          onClick={toggleMenu}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
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
        {/* Simulador Multi-Dispositivo (Exclusivo Super Admin Master) */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsSandboxOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Simulador de Viewports (Celular, Tablet e Desktop) - Alt + S"
          >
            <MonitorSmartphone size={14} className="text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Simulador</span>
          </button>
        )}

        {/* Atalho Super Admin / Sair do Modo Suporte */}
        {targetTenantId ? (
          <button
            type="button"
            onClick={handleExitSupportMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Sair do Modo Suporte e retornar ao Console Super Admin"
          >
            <ArrowLeft size={13} className="shrink-0 text-amber-400" />
            <span className="hidden sm:inline">Voltar ao Super Admin</span>
            <span className="sm:hidden text-[11px]">Super Admin</span>
          </button>
        ) : isSuperAdmin ? (
          <Link
            href="/super-admin/companies"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Acessar o Console Super Admin"
          >
            <ShieldCheck size={14} className="text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Super Admin</span>
            <span className="sm:hidden text-[11px]">Admin</span>
          </Link>
        ) : null}

        {/* Central de Notificações Global (Popover Interativo em Tempo Real) */}
        <NotificationsPopover />
      </div>

      {/* Modal Executiva do Simulador de Viewport (Montada apenas quando ativada pelo Master) */}
      {isSuperAdmin && (
        <DeviceSandboxModal
          isOpen={isSandboxOpen}
          onClose={() => setIsSandboxOpen(false)}
          initialPath={typeof window !== "undefined" ? window.location.pathname : "/vallor/inbox"}
        />
      )}
    </header>
  );
}
