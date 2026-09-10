"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Bot, MessageSquareWarning, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const res = await api.get('/metrics/dashboard');
      return res.data;
    },
    retry: false
  });

  if (isError) {
    if ((error as any).response?.status === 401) {
      router.push('/login');
      return null;
    }
    return (
      <div className="p-8 text-red-400 flex flex-col gap-4">
        <h2>Sua sessão expirou ou ocorreu um erro.</h2>
        <button onClick={() => router.push('/login')} className="px-4 py-2 bg-primary text-white w-fit rounded">
          Fazer Login Novamente
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
        <div>
          <div className="h-8 w-48 bg-gray-800/80 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-800/50 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0B1224] border border-[#162038] rounded-2xl p-5 flex flex-col gap-4 h-[120px] animate-pulse">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-gray-800/80"></div>
                <div className="w-16 h-6 rounded-md bg-gray-800/50"></div>
              </div>
              <div>
                <div className="w-32 h-3 bg-gray-800/80 mb-2 rounded"></div>
                <div className="w-24 h-6 bg-gray-800/80 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0B1224] border border-[#162038] rounded-2xl p-6 h-[350px] animate-pulse"></div>
          <div className="bg-[#0B1224] border border-[#162038] rounded-2xl p-6 h-[350px] animate-pulse"></div>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "Total de Leads (Hoje)", value: data.kpis.totalLeadsToday.toString(), change: "+100%", trend: "up", icon: Users, color: "text-blue-400" },
    { title: "Taxa de Qualificação (IA)", value: `${data.kpis.qualRate}%`, change: "Real", trend: "up", icon: Bot, color: "text-accent" },
    { title: "Aguardando Humano", value: data.kpis.waitingHuman.toString(), change: "Ação", trend: "down", icon: MessageSquareWarning, color: "text-red-400", alert: data.kpis.waitingHuman > 0 },
    { title: "Receita em Pipeline", value: `R$ ${data.kpis.pipelineRevenue}`, change: "+100%", trend: "up", icon: DollarSign, color: "text-green-400" },
  ];

  const recentLeads = data.recentLeads;


  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">Visão Geral</h1>
        <p className="text-sm text-text-secondary mt-1">Acompanhe as métricas e o desempenho da Inteligência Artificial hoje.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className={`bg-panel/40 border ${kpi.alert ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-gray-800/60'} rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4 relative overflow-hidden group hover:border-gray-700 transition-colors`}>
            {/* Glow de Fundo Card */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
            
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl bg-gray-900/80 border border-gray-700 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${kpi.trend === 'up' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </div>
            </div>
            
            <div>
              <h3 className="text-[0.75rem] font-bold text-gray-500 uppercase tracking-widest">{kpi.title}</h3>
              <p className="text-3xl font-black text-white mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Principal: Gráfico + Leads Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Mockado */}
        <div className="lg:col-span-2 bg-panel/40 border border-gray-800/60 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-accent" /> Fluxo de Mensagens (Últimos 7 dias)
            </h2>
            <select className="bg-background border border-gray-800 text-xs text-gray-400 rounded-lg px-3 py-1 outline-none">
              <option>Esta semana</option>
              <option>Este mês</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[250px] relative border-b border-l border-gray-800/80 flex items-end pt-4 pl-4 gap-2 lg:gap-8 justify-between px-4 pb-0">
            {/* Linhas de Grade */}
            <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-0 border-transparent">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-b border-gray-800/30 border-dashed h-0" />
              ))}
            </div>

            {/* Barras do Gráfico */}
            {data.chartData.map((height: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 relative z-10 group cursor-pointer h-full">
                <div 
                  className="w-full max-w-[40px] bg-gradient-to-t from-primary/20 to-accent/80 rounded-t-md relative transition-all group-hover:brightness-125"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-xs font-bold text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height * 12}
                  </div>
                </div>
                <span className="text-[0.65rem] text-gray-500 font-bold">DIA {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela Rápida */}
        <div className="bg-panel/40 border border-gray-800/60 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-white">Últimos Qualificados</h2>
            <button className="text-xs text-accent hover:underline">Ver todos</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {recentLeads.length === 0 ? (
               <div className="text-gray-500 text-xs text-center p-4">Nenhum lead qualificado ainda.</div>
            ) : recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-background/50 border border-gray-800/80 rounded-xl hover:border-gray-700 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-xs">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors">{lead.name}</h4>
                    <p className="text-[0.65rem] text-gray-500">{lead.source}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                     ${lead.temp === 'Quente' ? 'bg-red-500/10 text-red-400' : 
                       lead.temp === 'Morno' ? 'bg-yellow-500/10 text-yellow-400' : 
                       'bg-blue-500/10 text-blue-400'}
                  `}>
                    {lead.temp}
                  </span>
                  <p className="text-[0.65rem] text-accent mt-1">{lead.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}