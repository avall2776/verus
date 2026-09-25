"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  CreditCard, 
  Users, 
  Headphones, 
  ArrowUpRight, 
  FileText, 
  RefreshCw,
  Loader2,
  ShieldCheck,
  Activity
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("versus_superadmin_stats");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("versus_superadmin_stats");
    }
    return true;
  });

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get("/tenants/stats/overview");
      setStats(res.data);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("versus_superadmin_stats", JSON.stringify(res.data));
      }
    } catch (err: any) {
      console.error(err);
      if (!stats) toast.error("Erro ao carregar métricas globais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCache = !!stats;
    fetchStats(hasCache);
  }, []);

  const kpis = [
    {
      title: "MRR Estimado",
      value: loading ? "..." : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.estimatedMRR || 0),
      subtitle: `${stats?.activeTenants || 0} empresas assinantes ativas`,
      icon: CreditCard,
      color: "text-emerald-400",
      href: "/super-admin/companies",
    },
    {
      title: "Empresas no Ecossistema",
      value: loading ? "..." : String(stats?.totalTenants || 0),
      subtitle: `${stats?.blockedTenants || 0} suspensas/bloqueadas`,
      icon: Building2,
      color: "text-blue-400",
      href: "/super-admin/companies",
    },
    {
      title: "Operadores Cadastrados",
      value: loading ? "..." : String(stats?.totalUsers || 0),
      subtitle: "Usuários ativos em todas as instâncias",
      icon: Users,
      color: "text-slate-300",
      href: "/super-admin/companies",
    },
    {
      title: "Chamados em Fila de Espera",
      value: loading ? "..." : String(stats?.openTickets || 0),
      subtitle: "Aguardando resposta ou triagem",
      icon: Headphones,
      color: stats?.openTickets > 0 ? "text-amber-400" : "text-slate-400",
      href: "/super-admin/support",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Métricas Globais do SaaS</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visão executiva em tempo real de faturamento, crescimento de tenants e demanda de suporte.
          </p>
        </div>

        <button
          onClick={() => fetchStats(false)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-blue-400" : ""} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Link
            key={index}
            href={kpi.href}
            className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`p-2 rounded-lg bg-[#070D1B] border border-slate-800 ${kpi.color}`}>
                <kpi.icon size={16} />
              </div>
            </div>

            <div>
              <p className="text-2xl font-black text-white font-mono tracking-tight group-hover:text-blue-400 transition-colors">
                {kpi.value}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {kpi.subtitle}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Ações Rápidas do Master */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Building2 size={16} className="text-blue-400" />
            <span>Gestão de Empresas (Tenants)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Consulte a lista de empresas, analise métricas individuais no Raio-X, ative/bloqueie acessos e redefina senhas com um clique.
          </p>
          <Link
            href="/super-admin/companies"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            <span>Gerenciar Empresas</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Headphones size={16} className="text-blue-400" />
            <span>Central de Atendimento ao Vivo</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Atenda clientes de qualquer empresa em tempo real, registre notas internas para a equipe e confira diagnósticos no card lateral.
          </p>
          <Link
            href="/super-admin/support"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-slate-700"
          >
            <span>Abrir Fila de Atendimento</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
