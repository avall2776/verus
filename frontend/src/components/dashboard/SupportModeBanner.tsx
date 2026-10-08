"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ArrowLeft, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { clearUserCache } from "@/lib/userCache";

export default function SupportModeBanner() {
  const [targetTenantId, setTargetTenantId] = useState<string | null>(null);
  const [targetTenantName, setTargetTenantName] = useState<string | null>(null);

  useEffect(() => {
    const checkTarget = () => {
      if (typeof window !== "undefined") {
        const tId = localStorage.getItem("versus_target_tenant_id");
        const tName = localStorage.getItem("versus_target_tenant_name");
        setTargetTenantId(tId);
        setTargetTenantName(tName);
      }
    };

    checkTarget();
    window.addEventListener("tenant_switched", checkTarget);
    return () => window.removeEventListener("tenant_switched", checkTarget);
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

  if (!targetTenantId) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600/25 via-amber-500/20 to-amber-600/25 border-b border-amber-500/40 px-3 py-2 md:px-6 md:py-2.5 flex items-center justify-between z-30 shrink-0 backdrop-blur-md shadow-lg shadow-amber-950/20 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          <ShieldAlert size={16} className="animate-pulse" />
        </span>
        <div className="flex items-center gap-1.5 md:gap-2 truncate text-xs md:text-sm">
          <span className="font-bold text-amber-300 shrink-0">Modo Suporte:</span>
          <span className="text-white font-semibold truncate flex items-center gap-1">
            <Building2 size={13} className="text-amber-400 shrink-0 inline" />
            <span className="truncate">{targetTenantName || "Empresa Cliente"}</span>
          </span>
          <span className="hidden md:inline text-[11px] text-amber-400/80 font-mono">
            (Auditoria Super Admin)
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleExitSupportMode}
        className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0 ml-2"
        title="Encerrar visualização desta empresa e voltar para lista de empresas"
      >
        <ArrowLeft size={14} />
        <span>Voltar ao Super Admin</span>
      </button>
    </div>
  );
}
