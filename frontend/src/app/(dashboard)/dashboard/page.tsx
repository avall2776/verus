"use client";

import { Users, Bot, MessageSquareWarning, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default function DashboardPage() {
  const kpis = [
    { title: "Total de Leads (Hoje)", value: "148", change: "+12%", trend: "up", icon: Users, color: "text-blue-400" },
    { title: "Taxa de Qualificação (IA)", value: "68%", change: "+5%", trend: "up", icon: Bot, color: "text-accent" },
    { title: "Aguardando Humano", value: "12", change: "-2", trend: "down", icon: MessageSquareWarning, color: "text-red-400", alert: true },
    { title: "Receita em Pipeline", value: "R$ 42.500", change: "+24%", trend: "up", icon: DollarSign, color: "text-green-400" },
  ];

  const recentLeads = [
    { id: 1, name: "Mariana Souza", source: "WhatsApp", temp: "Quente", time: "Há 10 min", value: "R$ 2.500" },
    { id: 2, name: "Empresa XPTO", source: "Instagram", temp: "Morno", time: "Há 45 min", value: "R$ 8.000" },
    { id: 3, name: "Carlos Eduardo", source: "Site", temp: "Quente", time: "Há 2 horas", value: "R$ 3.200" },
    { id: 4, name: "Juliana Santos", source: "WhatsApp", temp: "Frio", time: "Há 3 horas", value: "R$ 800" },
  ];

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

            {/* Barras do Gráfico (Mock) */}
            {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
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
            {recentLeads.map((lead) => (
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
                  <p className="text-xs text-gray-400 mt-1">{lead.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}