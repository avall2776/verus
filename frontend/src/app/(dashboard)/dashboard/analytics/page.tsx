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

// Custom Tooltip adaptativo para Clean e Dark
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 shadow-xl backdrop-blur-md text-xs space-y-1 z-50">
        <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.fill || "#06B6D4" }} />
              {item.name}:
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
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
      "\uFEFF=== VALLOR OMNICHANNEL AI PLATFORM - RELATORIO ANALITICO CONSOLIDADO ===",
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
    link.setAttribute("download", `vallor-analytics-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`);
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
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Analytics Avançado
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inteligência de aquisição, taxa de drop-off por etapa do funil e auditoria de SLAs por setor
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Seletor de Período e Botão Atualizar */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs shadow-inner flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setSelectedPeriod("7d")}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedPeriod === "7d"
                    ? "bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-slate-200 dark:border-cyan-500/40 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("30d")}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedPeriod === "30d"
                    ? "bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-slate-200 dark:border-cyan-500/40 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("90d")}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedPeriod === "90d"
                    ? "bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-slate-200 dark:border-cyan-500/40 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Trimestre
              </button>
            </div>

            {/* Botão de Atualizar */}
            <button
              type="button"
              onClick={() => loadAnalyticsData(true)}
              disabled={isRefreshing || isLoading}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all disabled:opacity-50 shrink-0"
              title="Atualizar métricas agora"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
            </button>
          </div>

          {/* Botões de Ação: Lado a lado no mobile (grid-cols-2) */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-semibold transition-all shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Auditoria</span>
            </button>

            <button
              type="button"
              onClick={handleExportConsolidatedCSV}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Exportar Relatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de KPIs Principais: 2 colunas no celular e 4 no desktop, sem balões */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Conversão Geral do Funil */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Conversão do Funil
              </span>
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {isLoading ? "--" : `${funnelData?.overallConversion || 0}%`}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="truncate">+{funnelData?.benchmarkComparison?.delta || 0}% vs. mercado</span>
          </div>
        </div>

        {/* Card 2: Faturamento Total Originado */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Receita Originada
              </span>
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
              {isLoading ? "--" : `R$ ${(funnelData?.totalRevenue || channelsData?.totalRevenue || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">Top: <strong className="text-slate-900 dark:text-white">{channelsData?.topChannel || "WhatsApp"}</strong></span>
          </div>
        </div>

        {/* Card 3: Conformidade de SLA Geral */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Conformidade SLA
              </span>
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {isLoading ? "--" : `${bottlenecksData?.slaCompliancePercent || 95.8}%`}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 font-semibold truncate">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">FRT: <strong className="text-slate-900 dark:text-white">{bottlenecksData?.frtMinutes || 2.4} min</strong></span>
          </div>
        </div>

        {/* Card 4: TMA Consolidado */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                TMA de Resolução
              </span>
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {isLoading ? "--" : `${bottlenecksData?.tmaMinutes || 14.5} min`}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span className="truncate">Ciclo: ~{funnelData?.avgSalesCycleHours || 82}h</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: Funil de Conversão Comercial com Recharts */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              Funil de Conversão Comercial (End-to-End)
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                Drop-off por Estágio
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rastreamento de progressão dos leads: desde o primeiro contato até o fechamento contratual
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              Volume no Período
            </span>
          </div>
        </div>

        {/* Gráfico de Barras do Funil */}
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs animate-pulse">
              Carregando dados do funil...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData?.stages || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip cursor={false} content={<CustomChartTooltip />} />
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
        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Estágio do Funil</th>
                <th className="p-3.5 text-center">Volume Total</th>
                <th className="p-3.5 text-center">Taxa de Conversão</th>
                <th className="p-3.5 text-center">Drop-off (Perda)</th>
                <th className="p-3.5 text-right">Tempo Médio na Etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {funnelData?.stages?.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.stage}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {item.count.toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                      {item.conversion}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold font-mono ${
                      item.dropoff === "0%"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                    }`}>
                      {item.dropoff}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {item.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stage Cards (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          {funnelData?.stages?.map((item, i) => (
            <div key={`mobile-stage-${i}`} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.stage}</span>
                </div>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white shrink-0">
                  {item.count.toLocaleString("pt-BR")} leads
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Conversão:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{item.conversion}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Perda:</span>
                  <span className={`font-mono font-semibold ${item.dropoff === "0%" ? "text-slate-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {item.dropoff}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  <Clock size={10} />
                  <span>{item.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: Canais de Aquisição & Faturamento */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Mapeamento de Canais de Aquisição & Faturamento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Origem do tráfego, volume de conversão para propostas/contratos e faturamento bruto faturado
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {channelsData?.channels?.length || 0} canais monitorados
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart de Distribuição de Receita por Canal */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Participação no Faturamento (R$)
            </h4>
            <div className="h-56 w-full flex items-center justify-center">
              {isLoading ? (
                <div className="text-xs text-slate-400 animate-pulse">Carregando canais...</div>
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
                    <Tooltip cursor={false} content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-center mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Faturado no Período:</span>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                R$ {(channelsData?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Tabela de Canais com Ações de Drilldown */}
          <div className="lg:col-span-2">
            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {channelsData?.channels?.map((channel) => (
                    <tr key={channel.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                          <span>{channel.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {channel.leadsCount}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-300">
                        {channel.dealsCount}
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {channel.contractsSignedCount}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {channel.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-mono">
                          {channel.conversionRate}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedChannel(channel)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] transition-all"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
              {channelsData?.channels?.map((channel) => (
                <div key={`mobile-channel-${channel.id}`} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: channel.color }} />
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{channel.name}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      R$ {channel.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <span>Leads: <strong className="text-slate-900 dark:text-white">{channel.leadsCount}</strong></span>
                      <span>Contratos: <strong className="text-emerald-600 dark:text-emerald-400">{channel.contractsSignedCount}</strong></span>
                      <span>Conv: <strong className="text-blue-600 dark:text-blue-400">{channel.conversionRate}%</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedChannel(channel)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 font-semibold text-[10px]"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Diagnóstico de Gargalos Operacionais & Eficiência de SLAs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: FRT vs TMA por Departamento */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Gargalos de Atendimento por Setor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativo de Tempo de 1ª Resposta (FRT) e Tempo de Resolução (TMA)
              </p>
            </div>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Auditoria Completa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs animate-pulse">
                Carregando dados departamentais...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={bottlenecksData?.departmentBottlenecks || []} 
                  margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} className="dark:stroke-slate-800" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip cursor={false} content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "10px" }} />
                  <Bar dataKey="frtMin" name="FRT (1ª Resposta Min)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tmaMin" name="TMA (Resolução Min)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Indicadores de Saúde dos Setores */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {bottlenecksData?.departmentBottlenecks?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    item.sla >= 95 ? "bg-emerald-500" : item.sla >= 90 ? "bg-cyan-500" : "bg-amber-500"
                  }`} />
                  <span className="font-semibold text-slate-800 dark:text-white">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 dark:text-slate-400">
                    Fila: <strong className="text-slate-900 dark:text-white">{item.queue}</strong>
                  </span>
                  <span className={`font-mono font-bold ${
                    item.sla >= 95 ? "text-emerald-600 dark:text-emerald-400" : item.sla >= 90 ? "text-cyan-600 dark:text-cyan-400" : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {item.sla}% SLA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Horários de Pico e Recomendações da IA */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Saturação de Fila por Faixa de Horário
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400">
                Pico: 14h - 16h
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Volume de mensagens e chamados simultâneos ao longo do expediente
            </p>

            <div className="h-48 w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs animate-pulse">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} className="dark:stroke-slate-800" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip cursor={false} content={<CustomChartTooltip />} />
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
          <div className="p-4 rounded-xl bg-gradient-to-tr from-amber-50/80 via-slate-50 to-blue-50/80 dark:from-amber-500/10 dark:via-slate-900/90 dark:to-blue-900/20 border border-amber-200 dark:border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sugestão de Otimização Operacional</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Vallor AI Insights</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {bottlenecksData?.criticalBottleneck}. Recomendamos alocar 1 operador temporário de contingência no Comercial durante a tarde para manter o FRT abaixo de 2.5 minutos.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                Impacto projetado: -38% no tempo de espera do cliente
              </span>
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
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
