"use client";

import { Activity, Building2, CreditCard, Cpu, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function SuperAdminDashboard() {
  const kpis = [
    { title: "MRR (Receita Recorrente)", value: "R$ 145.200", change: "+12.5%", trend: "up", icon: CreditCard, color: "text-emerald-400" },
    { title: "Assinantes Ativos", value: "342", change: "+8", trend: "up", icon: Building2, color: "text-indigo-400" },
    { title: "Consumo OpenAI (Mês)", value: "R$ 4.250", change: "+15%", trend: "up", icon: Cpu, color: "text-red-400", alert: true },
    { title: "Sessões Totais (Hoje)", value: "12.450", change: "-2.1%", trend: "down", icon: Activity, color: "text-gray-400" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide">Dashboard Master</h1>
        <p className="text-sm text-gray-400 mt-1">Acompanhe a saúde financeira e operacional de todo o ecossistema SaaS.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className={`bg-[#0a0f1c] border ${kpi.alert ? 'border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-indigo-900/40'} rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-700/50 transition-colors`}>
            
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl bg-[#060913] border border-indigo-900/30 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${kpi.trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </div>
            </div>
            
            <div>
              <h3 className="text-[0.75rem] font-bold text-indigo-400/70 uppercase tracking-widest">{kpi.title}</h3>
              <p className="text-3xl font-black text-white mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de Crescimento */}
      <div className="bg-[#0a0f1c] border border-indigo-900/40 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" /> Crescimento de MRR vs Custo de API (6 Meses)
          </h2>
        </div>
        
        <div className="w-full h-64 border border-indigo-900/20 rounded-xl bg-[#060913] flex items-center justify-center text-indigo-500/40 font-bold text-sm">
          [Gráfico Area Chart: MRR subindo em verde, Custo de API acompanhando em vermelho]
        </div>
      </div>

    </div>
  );
}
