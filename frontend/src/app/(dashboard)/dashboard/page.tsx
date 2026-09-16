"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Bot,
  MessageSquareWarning,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import WelcomeDashboard from "@/components/dashboard/WelcomeDashboard";

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "metrics" ? "metrics" : "welcome";
  const [viewMode, setViewMode] = useState<"welcome" | "metrics">(initialView);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: async () => {
      const res = await api.get("/metrics/dashboard");
      return res.data;
    },
    enabled: viewMode === "metrics",
    retry: false,
  });

  if (viewMode === "welcome") {
    return (
      <WelcomeDashboard
        onViewMetrics={() => setViewMode("metrics")}
        hasMetrics={true}
      />
    );
  }

  // ================= MODO DE MÉTRICAS ANALÍTICAS =================
  if (isError) {
    if ((error as any)?.response?.status === 401) {
      router.push("/login");
      return null;
    }
    return (
      <div className="p-8 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-4 max-w-xl mx-auto mt-10">
        <h2 className="text-sm font-bold text-white">Sua sessão expirou ou ocorreu um erro ao carregar métricas.</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("welcome")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Voltar para Boas-Vindas
          </button>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Fazer Login Novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-800/80 rounded animate-pulse" />
          <div className="h-8 w-32 bg-slate-800/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 h-[120px] animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="w-16 h-6 rounded-md bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="w-32 h-3 bg-slate-800 rounded" />
                <div className="w-24 h-6 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0B1224] border border-slate-800 rounded-2xl p-6 h-[350px] animate-pulse" />
          <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-6 h-[350px] animate-pulse" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total de Leads (Hoje)",
      value: data.kpis.totalLeadsToday.toString(),
      change: "+100%",
      trend: "up",
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Taxa de Qualificação (IA)",
      value: `${data.kpis.qualRate}%`,
      change: "Real",
      trend: "up",
      icon: Bot,
      color: "text-cyan-400",
    },
    {
      title: "Aguardando Humano",
      value: data.kpis.waitingHuman.toString(),
      change: "Ação",
      trend: "down",
      icon: MessageSquareWarning,
      color: "text-rose-400",
      alert: data.kpis.waitingHuman > 0,
    },
    {
      title: "Receita em Pipeline",
      value: `R$ ${data.kpis.pipelineRevenue}`,
      change: "+100%",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-400",
    },
  ];

  const recentLeads = data.recentLeads || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8 animate-in fade-in duration-200">
      {/* Header com Botão de Voltar para Boas-Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Métricas Operacionais do Dia</h1>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe em tempo real o volume de atendimentos e a performance da IA no CRM.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            title="Atualizar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-400" : ""}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setViewMode("welcome")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`bg-[#0B1224] border ${
              kpi.alert ? "border-rose-500/40 shadow-lg shadow-rose-500/5" : "border-slate-800/80"
            } rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-xl bg-[#070D1B] border border-slate-800 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                  kpi.trend === "up" ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                }`}
              >
                {kpi.trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.title}</h3>
              <p className="text-2xl font-black text-white mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Principal: Gráfico + Leads Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Fluxo */}
        <div className="lg:col-span-2 bg-[#0B1224] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-blue-400" /> Fluxo de Mensagens (Últimos 7 dias)
            </h2>
            <select className="bg-[#070D1B] border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 outline-none">
              <option>Esta semana</option>
              <option>Este mês</option>
            </select>
          </div>

          <div className="flex-1 min-h-[250px] relative border-b border-l border-slate-800 flex items-end pt-4 pl-4 gap-2 lg:gap-8 justify-between px-4 pb-0">
            <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-0 border-transparent pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-b border-slate-800/40 border-dashed h-0" />
              ))}
            </div>

            {data.chartData?.map((height: number, i: number) => (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end items-center gap-2 relative z-10 group cursor-pointer h-full"
              >
                <div
                  className="w-full max-w-[40px] bg-blue-600/80 rounded-t-md relative transition-all group-hover:bg-blue-500"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-xs font-bold text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height * 12}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-bold font-mono">D{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leads Recentes */}
        <div className="bg-[#0B1224] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-white">Últimos Qualificados</h2>
            <span className="text-xs text-blue-400 font-semibold">CRM Ativo</span>
          </div>

          <div className="flex flex-col gap-3">
            {recentLeads.length === 0 ? (
              <div className="text-slate-500 text-xs text-center p-8 border border-dashed border-slate-800 rounded-xl">
                Nenhum lead qualificado hoje.
              </div>
            ) : (
              recentLeads.map((lead: any) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 bg-[#070D1B] border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                      {lead.name?.charAt(0) || "L"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{lead.name}</h4>
                      <p className="text-[10px] text-slate-400">{lead.source || "WhatsApp"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        lead.temp === "Quente"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : lead.temp === "Morno"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {lead.temp}
                    </span>
                    <p className="text-[11px] text-slate-300 font-mono font-semibold mt-0.5">{lead.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">Carregando workspace...</p>
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}