"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, Clock, Users, ArrowUpRight, BarChart3, PieChart as PieChartIcon, 
  Calendar, Download, RefreshCw, AlertTriangle, CheckCircle2, Zap, 
  Filter, MessageSquare, DollarSign, Layers, ChevronRight, Activity, Flame
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import toast from "react-hot-toast";

// Dados do Funil de Conversão Comercial
const FUNNEL_DATA = [
  { stage: "1. Leads Capturados", count: 1450, dropoff: "0%", conversion: "100%", duration: "0h", fill: "#06B6D4" },
  { stage: "2. Contato / Triagem", count: 1120, dropoff: "22.8%", conversion: "77.2%", duration: "1.5h", fill: "#0284C7" },
  { stage: "3. Oportunidades / MQL", count: 680, dropoff: "39.3%", conversion: "60.7%", duration: "8.2h", fill: "#3B82F6" },
  { stage: "4. Propostas Enviadas", count: 340, dropoff: "50.0%", conversion: "50.0%", duration: "24.0h", fill: "#6366F1" },
  { stage: "5. Vendas Fechadas", count: 142, dropoff: "58.2%", conversion: "41.8%", duration: "48.5h", fill: "#10B981" },
];

// Dados dos Gargalos de Atendimento (FRT vs TMA por Departamento)
const BOTTLENECK_DATA = [
  { department: "Vendas / Comercial", frtMin: 2.1, tmaMin: 14.5, sla: 98.4, queue: 4, fillFrt: "#06B6D4", fillTma: "#3B82F6" },
  { department: "Suporte N1", frtMin: 3.8, tmaMin: 22.0, sla: 94.2, queue: 11, fillFrt: "#06B6D4", fillTma: "#3B82F6" },
  { department: "Financeiro & Faturamento", frtMin: 6.5, tmaMin: 34.2, sla: 87.5, queue: 19, fillFrt: "#F59E0B", fillTma: "#EF4444" },
  { department: "Onboarding & CS", frtMin: 4.2, tmaMin: 28.6, sla: 92.0, queue: 6, fillFrt: "#06B6D4", fillTma: "#3B82F6" },
];

// Distribuição de Canais de Aquisição & Faturamento
const CHANNEL_DATA = [
  { name: "WhatsApp Direto", value: 42, revenue: 112000, color: "#10B981" },
  { name: "Meta Ads (Instagram)", value: 28, revenue: 68000, color: "#06B6D4" },
  { name: "Google Ads (Search)", value: 18, revenue: 45000, color: "#3B82F6" },
  { name: "Indicação / Parcerias", value: 12, revenue: 38000, color: "#8B5CF6" },
];

// Custom Tooltip para o Dark Glassmorphism do VERSUS
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[#0B1224] border border-slate-700/80 shadow-xl backdrop-blur-md text-xs space-y-1">
        <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload.fill }} />
              {item.name}:
            </span>
            <span className="font-bold font-mono text-white">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Indicadores e métricas de conversão atualizados!");
    }, 600);
  };

  const handleExport = () => {
    toast.success("Relatório consolidado exportado em formato CSV/PDF.");
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Analytics Avançado
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                Funil & SLAs
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Análise profunda de gargalos operacionais, taxas de conversão de funil e eficiência de canais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedPeriod("7d")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPeriod === "7d"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setSelectedPeriod("30d")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPeriod === "30d"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setSelectedPeriod("90d")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPeriod === "90d"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Trimestre
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Taxa Global de Conversão */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Conversão Geral do Funil
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">9.8%</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2.4% vs. período anterior</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 pointer-events-none" />
        </div>

        {/* Card 2: Tempo de 1ª Resposta (FRT) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              FRT Médio (1ª Resposta)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">2.4 min</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>98.4% de conformidade de SLA</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 pointer-events-none" />
        </div>

        {/* Card 3: TMA Médio de Atendimento */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              TMA (Tempo de Resolução)
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">18.6 min</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-cyan-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>-14% mais rápido com IA ativa</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 pointer-events-none" />
        </div>

        {/* Card 4: Canal Campeão de Receita */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Canal de Maior ROI
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-400">WhatsApp</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-300">
              <span>R$ 112.000 faturados (42.6%)</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 pointer-events-none" />
        </div>
      </div>

      {/* Gráfico 1: Funil de Conversão Comercial com Recharts */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Funil de Conversão Comercial (End-to-End)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                Drop-off por Estágio
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Volume de leads que avançam em cada estágio da esteira e taxa de retenção operacional
            </p>
          </div>
        </div>

        {/* Gráfico de Barras do Funil */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={FUNNEL_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="count" name="Leads / Negócios" radius={[8, 8, 0, 0]}>
                {FUNNEL_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Detalhamento com Taxas de Drop-off */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Estágio do Funil</th>
                <th className="p-3.5 text-center">Volume</th>
                <th className="p-3.5 text-center">Taxa de Conversão</th>
                <th className="p-3.5 text-center">Drop-off (Perda)</th>
                <th className="p-3.5 text-right">Tempo Médio na Etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {FUNNEL_DATA.map((item, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-semibold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.stage}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                    {item.count}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      {item.conversion}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
                      {item.dropoff}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    {item.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid de 2 Colunas: Gargalos de Atendimento (Esquerda) e Distribuição de Canais (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Gargalos de Atendimento & SLAs por Departamento */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Gargalos de Atendimento por Setor
            </h3>
            <p className="text-xs text-slate-400">
              Tempo de Primeira Resposta (FRT) vs Tempo de Resolução (TMA) em minutos
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BOTTLENECK_DATA} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "10px" }} />
                <Bar dataKey="frtMin" name="FRT (1ª Resposta Min)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tmaMin" name="TMA (Resolução Min)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Indicadores de Saúde dos Setores */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {BOTTLENECK_DATA.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.sla >= 95 ? "bg-emerald-400" : item.sla >= 90 ? "bg-cyan-400" : "bg-amber-400"}`} />
                  <span className="font-semibold text-white">{item.department}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">
                    Fila: <strong className="text-white">{item.queue}</strong>
                  </span>
                  <span className={`font-mono font-bold ${item.sla >= 95 ? "text-emerald-400" : item.sla >= 90 ? "text-cyan-400" : "text-amber-400"}`}>
                    {item.sla}% SLA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Distribuição de Canais & Receita */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Origem dos Leads & Faturamento
            </h3>
            <p className="text-xs text-slate-400">
              Proporção de captação e volume financeiro gerado por canal
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CHANNEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CHANNEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda Dinâmica e Faturamento dos Canais */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {CHANNEL_DATA.map((channel, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md" style={{ backgroundColor: channel.color }} />
                  <span className="font-semibold text-white">{channel.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-mono">
                    {channel.value}% dos leads
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    R$ {channel.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
