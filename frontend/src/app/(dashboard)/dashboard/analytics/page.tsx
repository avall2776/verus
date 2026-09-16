"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  TrendingUp, Clock, Users, ArrowUpRight, BarChart3, PieChart as PieChartIcon, 
  Calendar, Download, RefreshCw, AlertTriangle, CheckCircle2, Zap, 
  Filter, MessageSquare, DollarSign, Layers, ChevronRight, Activity, Flame,
  ShieldCheck, ArrowRight, Share2, Sparkles, AlertCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { 
  FunnelData, 
  ChannelsResponse, 
  ChannelStat, 
  BottlenecksResponse, 
  DepartmentBottleneck,
  HourlyBottleneck 
} from "@/types/analytics";
import ChannelDetailModal from "@/components/analytics/ChannelDetailModal";
import BottleneckAuditModal from "@/components/analytics/BottleneckAuditModal";

// Custom Tooltip para o Dark Glassmorphism do VERSUS
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[#0B1224] border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50">
        <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.fill || "#06B6D4" }} />
              {item.name}:
            </span>
            <span className="font-bold font-mono text-white">
              {typeof item.value === "number" && item.name?.toLowerCase().includes("receita")
                ? `R$ ${item.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dados da API
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [channelsData, setChannelsData] = useState<ChannelsResponse | null>(null);
  const [bottlenecksData, setBottlenecksData] = useState<BottlenecksResponse | null>(null);

  // Estados dos Modais
  const [selectedChannel, setSelectedChannel] = useState<ChannelStat | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Calcular datas de início e término baseadas no período selecionado
  const dateParams = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (selectedPeriod === "7d") {
      start.setDate(end.getDate() - 7);
    } else if (selectedPeriod === "30d") {
      start.setDate(end.getDate() - 30);
    } else {
      start.setDate(end.getDate() - 90);
    }
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [selectedPeriod]);

  // Carregar dados de todos os endpoints analíticos
  const loadAnalyticsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [funnelRes, channelsRes, bottlenecksRes] = await Promise.all([
        api.get("/analytics/funnel", { params: dateParams }),
        api.get("/analytics/channels", { params: dateParams }),
        api.get("/analytics/bottlenecks", { params: dateParams }),
      ]);

      setFunnelData(funnelRes.data);
      setChannelsData(channelsRes.data);
      setBottlenecksData(bottlenecksRes.data);

      if (isSilent) {
        toast.success("Métricas analíticas atualizadas com sucesso!");
      }
    } catch (error) {
      console.error("[ANALYTICS_FETCH_ERROR]", error);
      toast.error("Erro ao carregar indicadores de performance.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateParams]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Exportar relatório analítico consolidado em CSV UTF-8 compatível com Excel
  const handleExportConsolidatedCSV = () => {
    if (!funnelData || !channelsData || !bottlenecksData) {
      toast.error("Aguarde o carregamento das métricas para exportar.");
      return;
    }

    const lines = [
      "\uFEFF=== VERSUS OMNICHANNEL AI PLATFORM - RELATORIO ANALITICO CONSOLIDADO ===",
      `Data de Emissao: ${new Date().toLocaleString("pt-BR")}`,
      `Periodo Analisado: ${selectedPeriod === "7d" ? "Ultimos 7 Dias" : selectedPeriod === "30d" ? "Ultimos 30 Dias" : "Ultimo Trimestre (90d)"}`,
      "",
      "--- RESUMO EXECUTIVO ---",
      `Taxa de Conversao Geral,${funnelData.overallConversion}%`,
      `Total de Leads Captados,${funnelData.totalLeads}`,
      `Contratos Fechados,${funnelData.contractsSigned}`,
      `Faturamento Total Originado,R$ ${funnelData.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `Ticket Medio Geral,R$ ${funnelData.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `Tempo Medio de Atendimento (TMA),${bottlenecksData.tmaMinutes} min`,
      `Tempo de Primeira Resposta (FRT),${bottlenecksData.frtMinutes} min`,
      `Conformidade Geral de SLA,${bottlenecksData.slaCompliancePercent}%`,
      "",
      "--- FUNIL DE CONVERSAO COMERCIAL ---",
      "Estagio,Volume,Taxa Conversao,Drop-off (Abandono),Tempo Medio na Etapa",
      ...funnelData.stages.map(
        s => `"${s.stage}",${s.count},${s.conversion},${s.dropoff},"${s.duration}"`
      ),
      "",
      "--- CANAIS DE AQUISICAO & FATURAMENTO ---",
      "Canal,Tipo,Leads,Deals CRM,Propostas,Contratos,Faturamento Total (R$),Ticket Medio (R$),Conversao (%),Participacao na Receita (%)",
      ...channelsData.channels.map(
        c => `"${c.name}","${c.type}",${c.leadsCount},${c.dealsCount},${c.proposalsCount},${c.contractsSignedCount},${c.totalRevenue},${c.avgTicket},${c.conversionRate}%,${c.percentOfTotalRevenue}%`
      ),
      "",
      "--- GARGALOS & SLAS POR DEPARTAMENTO ---",
      "Departamento,FRT (Minutos),TMA (Minutos),Conformidade SLA (%),Fila Ativa,Saude",
      ...bottlenecksData.departmentBottlenecks.map(
        d => `"${d.name}",${d.frtMin},${d.tmaMin},${d.sla}%,${d.queue},"${d.health}"`
      ),
      "",
      "--- DISTRIBUICAO DE FLUXO HORARIO (PICOS) ---",
      "Horario,FRT (Minutos),TMA (Minutos),Volume de Chamados,Nivel de Saturacao",
      ...bottlenecksData.hourlyBottlenecks.map(
        h => `"${h.hour}",${h.frtMin},${h.tmaMin},${h.volume},"${h.bottleneckLevel}"`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `versus-analytics-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório consolidado exportado com sucesso!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Analytics Avançado
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                PRO • BI & SLAs
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Inteligência de aquisição, taxa de drop-off por etapa do funil e auditoria de SLAs por setor
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => setSelectedPeriod("7d")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedPeriod === "7d"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setSelectedPeriod("30d")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedPeriod === "30d"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setSelectedPeriod("90d")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedPeriod === "90d"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Trimestre
            </button>
          </div>

          {/* Botão de Atualizar */}
          <button
            onClick={() => loadAnalyticsData(true)}
            disabled={isRefreshing || isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all disabled:opacity-50"
            title="Atualizar métricas agora"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Botão de Auditoria de Gargalos */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Auditoria de Gargalos
          </button>

          {/* Botão de Exportar */}
          <button
            onClick={handleExportConsolidatedCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Cards de KPIs Principais do Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Conversão Geral do Funil */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Conversão Geral do Funil
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-white">
              {isLoading ? "--" : `${funnelData?.overallConversion || 0}%`}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{funnelData?.benchmarkComparison?.delta || 0}% vs. média de mercado (8.5%)</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 pointer-events-none" />
        </div>

        {/* Card 2: Faturamento Total Originado */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Receita Total Originada
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {isLoading ? "--" : `R$ ${(funnelData?.totalRevenue || channelsData?.totalRevenue || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Canal Campeão: <strong className="text-white">{channelsData?.topChannel || "WhatsApp"}</strong></span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 pointer-events-none" />
        </div>

        {/* Card 3: Conformidade de SLA Geral */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Conformidade Geral de SLA
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-white">
              {isLoading ? "--" : `${bottlenecksData?.slaCompliancePercent || 95.8}%`}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-cyan-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>FRT Médio: <strong className="text-white">{bottlenecksData?.frtMinutes || 2.4} min</strong></span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 pointer-events-none" />
        </div>

        {/* Card 4: TMA Consolidado */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              TMA Médio de Resolução
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-white">
              {isLoading ? "--" : `${bottlenecksData?.tmaMinutes || 14.5} min`}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ciclo comercial: ~{funnelData?.avgSalesCycleHours || 82}h</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 pointer-events-none" />
        </div>
      </div>

      {/* SEÇÃO 1: Funil de Conversão Comercial com Recharts */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Funil de Conversão Comercial (End-to-End)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                Drop-off por Estágio
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Rastreamento de progressão dos leads: desde o primeiro contato até o fechamento contratual
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              Volume no Período
            </span>
          </div>
        </div>

        {/* Gráfico de Barras do Funil */}
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
              Carregando dados do funil...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData?.stages || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" name="Volume de Leads/Contratos" radius={[8, 8, 0, 0]}>
                  {funnelData?.stages?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || "#06B6D4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela de Detalhamento com Taxas de Drop-off */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Estágio do Funil</th>
                <th className="p-3.5 text-center">Volume Total</th>
                <th className="p-3.5 text-center">Taxa de Conversão</th>
                <th className="p-3.5 text-center">Drop-off (Perda)</th>
                <th className="p-3.5 text-right">Tempo Médio na Etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {funnelData?.stages?.map((item, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-semibold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.stage}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                    {item.count.toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      {item.conversion}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
                      item.dropoff === "0%"
                        ? "bg-slate-800 text-slate-400"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}>
                      {item.dropoff}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-300">
                    {item.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 2: Canais de Aquisição & Faturamento */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Mapeamento de Canais de Aquisição & Faturamento
            </h3>
            <p className="text-xs text-slate-400">
              Origem do tráfego, volume de conversão para propostas/contratos e faturamento bruto faturado
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {channelsData?.channels?.length || 0} canais monitorados
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart de Distribuição de Receita por Canal */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Participação no Faturamento (R$)
            </h4>
            <div className="h-56 w-full flex items-center justify-center">
              {isLoading ? (
                <div className="text-xs text-slate-500 animate-pulse">Carregando canais...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelsData?.channels || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="totalRevenue"
                      nameKey="name"
                    >
                      {channelsData?.channels?.map((entry, index) => (
                        <Cell key={`channel-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-center mt-1">
              <span className="text-xs text-slate-400">Total Faturado no Período:</span>
              <p className="text-lg font-black font-mono text-emerald-400">
                R$ {(channelsData?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Tabela de Canais com Ações de Drilldown */}
          <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Canal</th>
                  <th className="p-3 text-center">Leads</th>
                  <th className="p-3 text-center">Oportunidades</th>
                  <th className="p-3 text-center">Contratos</th>
                  <th className="p-3 text-right">Faturamento</th>
                  <th className="p-3 text-center">Conversão</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {channelsData?.channels?.map((channel) => (
                  <tr key={channel.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                        <span>{channel.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-200">
                      {channel.leadsCount}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-300">
                      {channel.dealsCount}
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-400 font-bold">
                      {channel.contractsSignedCount}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      R$ {channel.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                        {channel.conversionRate}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedChannel(channel)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 font-semibold text-[11px] transition-all"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Diagnóstico de Gargalos Operacionais & Eficiência de SLAs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: FRT vs TMA por Departamento */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Gargalos de Atendimento por Setor
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo de Tempo de 1ª Resposta (FRT) e Tempo de Resolução (TMA)
              </p>
            </div>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Auditoria Completa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
                Carregando dados departamentais...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={bottlenecksData?.departmentBottlenecks || []} 
                  margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "10px" }} />
                  <Bar dataKey="frtMin" name="FRT (1ª Resposta Min)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tmaMin" name="TMA (Resolução Min)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Indicadores de Saúde dos Setores */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {bottlenecksData?.departmentBottlenecks?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    item.sla >= 95 ? "bg-emerald-400" : item.sla >= 90 ? "bg-cyan-400" : "bg-amber-400"
                  }`} />
                  <span className="font-semibold text-white">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">
                    Fila: <strong className="text-white">{item.queue}</strong>
                  </span>
                  <span className={`font-mono font-bold ${
                    item.sla >= 95 ? "text-emerald-400" : item.sla >= 90 ? "text-cyan-400" : "text-amber-400"
                  }`}>
                    {item.sla}% SLA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Horários de Pico e Recomendações da IA */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Saturação de Fila por Faixa de Horário
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                Pico: 14h - 16h
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Volume de mensagens e chamados simultâneos ao longo do expediente
            </p>

            <div className="h-48 w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs animate-pulse">
                  Carregando mapa horário...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={bottlenecksData?.hourlyBottlenecks || []}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      name="Volume de Chamados" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVolume)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Banner de Ação Inteligente */}
          <div className="p-4 rounded-xl bg-gradient-to-tr from-amber-500/10 via-slate-900/90 to-blue-900/20 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sugestão de Otimização Operacional</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">VERSUS AI Insights</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bottlenecksData?.criticalBottleneck}. Recomendamos alocar 1 operador temporário de contingência no Comercial durante a tarde para manter o FRT abaixo de 2.5 minutos.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400">
                Impacto projetado: -38% no tempo de espera do cliente
              </span>
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
              >
                Ver Todas as Ações <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais Funcionais */}
      <ChannelDetailModal
        channel={selectedChannel}
        isOpen={!!selectedChannel}
        onClose={() => setSelectedChannel(null)}
      />

      <BottleneckAuditModal
        data={bottlenecksData}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
