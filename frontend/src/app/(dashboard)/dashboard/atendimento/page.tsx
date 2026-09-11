"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Legend 
} from "recharts";
import { 
  Clock, MessageSquare, CheckCircle, Headphones, Activity, 
  Calendar, RefreshCw, Download, Search, User, Filter, 
  TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  Star, Bot, DollarSign, Sparkles, UserCheck, Layers, ChevronLeft, ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AtendimentoAnalyticsDashboard() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'atendimento' | 'csat' | 'ai_costs'>('atendimento');
  const [viewMode, setViewMode] = useState<'charts' | 'reports'>('charts');

  // Filters
  const [period, setPeriod] = useState<'7d' | '15d' | '30d' | '90d' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [overview, setOverview] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [ticketsData, setTicketsData] = useState<any>({ tickets: [], total: 0, page: 1, totalPages: 1 });
  const [aiCosts, setAiCosts] = useState<any>(null);
  const [csatData, setCsatData] = useState<any>(null);

  // Tickets Filter State (Reports Mode)
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('all');
  const [ticketPage, setTicketPage] = useState(1);

  // Compute actual date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start = new Date();

    if (period === '7d') start.setDate(end.getDate() - 7);
    else if (period === '15d') start.setDate(end.getDate() - 15);
    else if (period === '30d') start.setDate(end.getDate() - 30);
    else if (period === '90d') start.setDate(end.getDate() - 90);
    else if (period === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [period, customStartDate, customEndDate]);

  const fetchAllData = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const params = `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      const [overviewRes, chartsRes, agentsRes, aiRes, csatRes] = await Promise.all([
        api.get(`/analytics/overview?${params}`),
        api.get(`/analytics/charts?${params}`),
        api.get(`/analytics/agent-performance?${params}`),
        api.get(`/analytics/ai-costs?${params}`),
        api.get(`/analytics/csat?${params}`),
      ]);

      setOverview(overviewRes.data);
      setChartsData(chartsRes.data);
      setAgents(agentsRes.data);
      setAiCosts(aiRes.data);
      setCsatData(csatRes.data);

      if (showToast) {
        toast.success("Métricas atualizadas com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao carregar dados de analytics:", error);
      toast.error("Erro ao sincronizar métricas de atendimento.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchDetailedTickets = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        status: ticketStatus,
        search: ticketSearch,
        page: ticketPage.toString(),
        limit: '15',
      });

      const res = await api.get(`/analytics/detailed-tickets?${params.toString()}`);
      setTicketsData(res.data);
    } catch (error) {
      console.error("Erro ao carregar tickets detalhados:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  useEffect(() => {
    if (viewMode === 'reports') {
      fetchDetailedTickets();
    }
  }, [viewMode, dateRange, ticketStatus, ticketSearch, ticketPage]);

  // Export CSV Function (UTF-8 with BOM for Excel)
  const handleExportCSV = () => {
    if (!ticketsData.tickets || ticketsData.tickets.length === 0) {
      toast.error("Nenhum ticket disponível para exportação.");
      return;
    }

    const headers = [
      "ID Chamado",
      "Contato",
      "Telefone",
      "Atendente",
      "Departamento",
      "Status",
      "Duração (min)",
      "Mensagens",
      "Motivo Encerramento",
      "Data Criação",
      "Data Encerramento"
    ];

    const rows = ticketsData.tickets.map((t: any) => [
      `#${t.id.substring(0, 8)}`,
      `"${t.contactName.replace(/"/g, '""')}"`,
      `"${t.phone}"`,
      `"${t.agentName}"`,
      `"${t.departmentName}"`,
      t.status,
      t.durationMinutes,
      t.messagesCount,
      `"${t.closeReason}"`,
      new Date(t.createdAt).toLocaleString('pt-BR'),
      t.closedAt ? new Date(t.closedAt).toLocaleString('pt-BR') : '-'
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r: any[]) => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-atendimentos-${dateRange.startDate}_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório CSV exportado com sucesso!");
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return "0m 00s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050A15] p-6 text-slate-400 gap-3 min-h-screen">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <span className="text-sm font-medium">Consolidando métricas e inteligência operacional...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#050A15] text-slate-200 overflow-y-auto">
      {/* TOP HEADER */}
      <div className="border-b border-slate-800/80 bg-[#0B1224]/70 backdrop-blur px-6 py-5 sticky top-0 z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Headphones size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Suíte de Análises & Inteligência Operacional
                </h1>
                <p className="text-xs text-slate-400">
                  Auditoria de SLA, fluxos de conversação e controle financeiro de IA em tempo real.
                </p>
              </div>
            </div>
          </div>

          {/* MAIN TABS */}
          <div className="flex items-center gap-1 bg-[#141C30] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('atendimento')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'atendimento'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Headphones size={15} />
              <span>Atendimento</span>
            </button>

            <button
              onClick={() => setActiveTab('csat')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'csat'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Star size={15} className="text-amber-400" />
              <span>Pesquisas (CSAT)</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_costs')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'ai_costs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles size={15} className="text-purple-400" />
              <span>Custos de IA</span>
            </button>
          </div>
        </div>

        {/* SUB-BAR / FILTERS */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher (Only in Atendimento) */}
            {activeTab === 'atendimento' && (
              <div className="flex items-center bg-[#11192A] p-1 rounded-lg border border-slate-800 mr-2">
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'charts'
                      ? 'bg-blue-600/30 border border-blue-500/50 text-blue-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Gráficos</span>
                </button>
                <button
                  onClick={() => setViewMode('reports')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'reports'
                      ? 'bg-blue-600/30 border border-blue-500/50 text-blue-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={14} />
                  <span>Relatórios Detalhados</span>
                </button>
              </div>
            )}

            {/* Quick Period Buttons */}
            <div className="flex items-center gap-1 bg-[#11192A] p-1 rounded-lg border border-slate-800">
              {(['7d', '15d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    period === p ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === '7d' ? '7 dias' : p === '15d' ? '15 dias' : p === '30d' ? '30 dias' : '90 dias'}
                </button>
              ))}
              <button
                onClick={() => setPeriod('custom')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  period === 'custom' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Custom Date Pickers */}
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[#11192A] border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-500 text-xs">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[#11192A] border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
              <span>{isRefreshing ? 'Atualizando...' : 'Recarregar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: ATENDIMENTO                                        */}
        {/* ========================================================= */}
        {activeTab === 'atendimento' && (
          <>
            {/* VIEW MODE 1: CHARTS */}
            {viewMode === 'charts' ? (
              <>
                {/* 1. SEVEN KPI CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Atendimentos</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-white">{overview?.total || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle size={12} />
                      <span>{overview?.finished || 0} finalizados</span>
                    </div>
                  </div>

                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Receptivos (Inbound)</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-emerald-400">{overview?.inbound || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <ArrowDownLeft size={12} className="text-emerald-500" />
                      <span>Mensagens clientes</span>
                    </div>
                  </div>

                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Proativos (Outbound)</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-blue-400">{overview?.outbound || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <ArrowUpRight size={12} className="text-blue-500" />
                      <span>Envios equipe</span>
                    </div>
                  </div>

                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Novos Contatos</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-purple-400">{overview?.newContacts || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-purple-400/80">
                      <User size={12} />
                      <span>Leads captados</span>
                    </div>
                  </div>

                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">TMA Médio</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-amber-400">
                        {formatSeconds(overview?.tmaSeconds)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500/80">
                      <Clock size={12} />
                      <span>Duração de sessão</span>
                    </div>
                  </div>

                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">1ª Resposta Média</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-cyan-400">
                        {formatSeconds(overview?.firstResponseSeconds)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-cyan-400/80">
                      <Activity size={12} />
                      <span>Velocidade triagem</span>
                    </div>
                  </div>

                  <div className="bg-[#0B1224] p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Ignorados / Fila</span>
                    <div className="my-2">
                      <span className="text-2xl font-bold text-rose-500">{overview?.ignoredCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-rose-400/80">
                      <AlertTriangle size={12} />
                      <span>Tempo estourado</span>
                    </div>
                  </div>
                </div>

                {/* 2. MAIN COMPOSED CHART */}
                <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-400" />
                        Evolução Diária de Volume e Tempo Médio de Atendimento
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Barras: Volume de finalizados e em andamento | Linha: TMA médio diário em minutos
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-emerald-500"></div>
                        <span className="text-slate-300">Finalizados</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span className="text-slate-300">Em Andamento</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-amber-400"></div>
                        <span className="text-slate-300">TMA (min)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartsData?.timeline || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={12} tickLine={false} axisLine={false} unit="m" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0B1224",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar yAxisId="left" dataKey="finished" name="Finalizados" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar yAxisId="left" dataKey="inProgress" name="Em Andamento" fill="#3B82F6" radius={[4, 4, 0, 0]} stackId="a" />
                        <Line yAxisId="right" type="monotone" dataKey="avgTmaMinutes" name="TMA Médio" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. THREE DONUT CHARTS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Status Donut */}
                  <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-5 flex flex-col">
                    <h4 className="text-sm font-bold text-white mb-1">Por Status</h4>
                    <span className="text-xs text-slate-400 mb-4">Proporção da fila de atendimento</span>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartsData?.distributions?.byStatus || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartsData?.distributions?.byStatus?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#0B1224", borderColor: "#334155", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs">
                      {chartsData?.distributions?.byStatus?.map((st: any) => (
                        <div key={st.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                            <span className="text-slate-300">{st.name}</span>
                          </div>
                          <span className="font-semibold text-white">{st.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department Donut */}
                  <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-5 flex flex-col">
                    <h4 className="text-sm font-bold text-white mb-1">Por Setor / Equipe</h4>
                    <span className="text-xs text-slate-400 mb-4">Distribuição entre departamentos</span>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartsData?.distributions?.byDepartment || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartsData?.distributions?.byDepartment?.map((entry: any, index: number) => (
                              <Cell key={`cell-dept-${index}`} fill={entry.color || '#8B5CF6'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#0B1224", borderColor: "#334155", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs">
                      {chartsData?.distributions?.byDepartment?.map((dp: any) => (
                        <div key={dp.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dp.color }}></span>
                            <span className="text-slate-300">{dp.name}</span>
                          </div>
                          <span className="font-semibold text-white">{dp.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day of Week Donut */}
                  <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-5 flex flex-col">
                    <h4 className="text-sm font-bold text-white mb-1">Por Dia da Semana</h4>
                    <span className="text-xs text-slate-400 mb-4">Concentração semanal de chamados</span>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartsData?.distributions?.byDayOfWeek || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#0B1224", borderColor: "#334155", borderRadius: "8px" }} />
                          <Bar dataKey="value" name="Tickets" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center text-xs text-slate-500">
                      Segunda a Sexta concentram o maior tráfego
                    </div>
                  </div>
                </div>

                {/* 4. AGENT PERFORMANCE TABLE */}
                <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <UserCheck size={16} className="text-emerald-400" />
                        Desempenho por Colaborador
                      </h3>
                      <p className="text-xs text-slate-400">
                        Indicadores individuais de produtividade, SLA de primeira resposta e satisfação
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-[#11192A] text-slate-400">
                          <th className="py-3 px-6 font-semibold">Colaborador</th>
                          <th className="py-3 px-4 font-semibold text-center">Em Atendimento</th>
                          <th className="py-3 px-4 font-semibold text-center">Fila Pendente</th>
                          <th className="py-3 px-4 font-semibold text-center">Finalizados</th>
                          <th className="py-3 px-4 font-semibold text-center">Total</th>
                          <th className="py-3 px-4 font-semibold text-center">1ª Resposta Média</th>
                          <th className="py-3 px-4 font-semibold text-center">TMA Médio</th>
                          <th className="py-3 px-6 font-semibold text-right">CSAT Médio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {agents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              Nenhum colaborador com atendimentos registrados no período.
                            </td>
                          </tr>
                        ) : (
                          agents.map((ag) => (
                            <tr key={ag.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                                    {ag.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-200 block">{ag.name}</span>
                                    <span className="text-[11px] text-slate-500">{ag.role}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  {ag.inProgressCount}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  {ag.pendingCount}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                  {ag.finishedCount}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-white">
                                {ag.total}
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-300">
                                {ag.avgFirstResponse}
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                                {ag.avgTma}
                              </td>
                              <td className="py-3.5 px-6 text-right font-bold text-amber-400 flex items-center justify-end gap-1">
                                <Star size={13} fill="currentColor" />
                                <span>{ag.csatAvg}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              /* VIEW MODE 2: DETAILED REPORTS (AUDIT TICKETS) */
              <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers size={16} className="text-blue-400" />
                      Auditoria de Chamados Detalhada
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rastreabilidade completa de todas as conversas finalizadas e em aberto
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar por lead ou fone..."
                        value={ticketSearch}
                        onChange={(e) => {
                          setTicketSearch(e.target.value);
                          setTicketPage(1);
                        }}
                        className="bg-[#11192A] border border-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-48"
                      />
                    </div>

                    <select
                      value={ticketStatus}
                      onChange={(e) => {
                        setTicketStatus(e.target.value);
                        setTicketPage(1);
                      }}
                      className="bg-[#11192A] border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="resolved">Resolvidos</option>
                      <option value="in_progress">Em Atendimento</option>
                      <option value="waiting">Aguardando</option>
                      <option value="bot_active">IA Ativa</option>
                    </select>

                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#11192A] text-slate-400">
                        <th className="py-3 px-4 font-semibold">Protocolo</th>
                        <th className="py-3 px-4 font-semibold">Lead / Contato</th>
                        <th className="py-3 px-4 font-semibold">Atendente</th>
                        <th className="py-3 px-4 font-semibold">Setor</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-center">Duração</th>
                        <th className="py-3 px-4 font-semibold">Motivo Encerramento</th>
                        <th className="py-3 px-4 font-semibold text-right">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ticketsData.tickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            Nenhum ticket encontrado com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        ticketsData.tickets.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400">
                              #{t.id.substring(0, 8)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-200 block">{t.contactName}</span>
                              <span className="text-[11px] text-slate-500">{t.phone}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-medium">
                              {t.agentName}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {t.departmentName}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                t.status === 'resolved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                  : t.status === 'waiting'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              }`}>
                                {t.status === 'resolved' ? 'Resolvido' : t.status === 'waiting' ? 'Aguardando' : 'Atendimento'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-slate-300">
                              {t.durationMinutes} min
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {t.closeReason}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                              {new Date(t.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Exibindo <strong>{ticketsData.tickets.length}</strong> de <strong>{ticketsData.total}</strong> chamados
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTicketPage((p) => Math.max(p - 1, 1))}
                      disabled={ticketPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-medium text-slate-200">
                      Página {ticketsData.page} de {ticketsData.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setTicketPage((p) => Math.min(p + 1, ticketsData.totalPages || 1))}
                      disabled={ticketPage >= (ticketsData.totalPages || 1)}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PESQUISAS (CSAT)                                   */}
        {/* ========================================================= */}
        {activeTab === 'csat' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0B1224] p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Índice Geral CSAT</span>
                <div className="flex items-baseline gap-3 my-4">
                  <span className="text-5xl font-black text-white">{csatData?.csatScore || 4.8}</span>
                  <span className="text-slate-500 font-semibold text-lg">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                  <span className="text-xs font-semibold text-slate-400 ml-2">Excelente aprovação</span>
                </div>
              </div>

              <div className="bg-[#0B1224] p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Satisfação Positiva</span>
                <div className="my-4">
                  <span className="text-5xl font-black text-emerald-400">{csatData?.positivePercent || 96}%</span>
                </div>
                <p className="text-xs text-slate-400">
                  Clientes que avaliaram o atendimento com 4 ou 5 estrelas
                </p>
              </div>

              <div className="bg-[#0B1224] p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Avaliações</span>
                <div className="my-4">
                  <span className="text-5xl font-black text-blue-400">{csatData?.totalSurveys || 0}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Pesquisas de satisfação respondidas via WhatsApp
                </p>
              </div>
            </div>

            {/* Distribution Bar Chart & Feedback List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-bold text-white mb-6">Distribuição das Notas (Estrelas)</h3>
                <div className="space-y-4">
                  {csatData?.distribution?.map((dist: any) => (
                    <div key={dist.stars} className="flex items-center gap-4 text-xs">
                      <div className="w-16 flex items-center gap-1 font-semibold text-amber-400">
                        <span>{dist.stars}</span>
                        <Star size={13} fill="currentColor" />
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${dist.percent}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-right font-mono font-bold text-white">{dist.count}</span>
                      <span className="w-12 text-right text-slate-400">{dist.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-6 flex flex-col">
                <h3 className="text-base font-bold text-white mb-4">Feedbacks Recentes dos Clientes</h3>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-80 custom-scrollbar pr-2">
                  {csatData?.recentFeedbacks?.map((fb: any) => (
                    <div key={fb.id} className="p-3.5 rounded-lg bg-[#11192A] border border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-xs">{fb.contactName}</span>
                          <span className="text-[11px] text-slate-500">atendido por {fb.agentName}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(fb.rating)].map((_, i) => (
                            <Star key={i} size={11} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{fb.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CUSTOS DE IA                                       */}
        {/* ========================================================= */}
        {activeTab === 'ai_costs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0B1224] p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gasto 7 dias (USD)</span>
                <div className="my-3">
                  <span className="text-3xl font-black text-white">${aiCosts?.spent7d || '0.00'}</span>
                </div>
                <span className="text-[11px] text-purple-400 flex items-center gap-1 font-medium">
                  <Sparkles size={12} /> OpenAI API gpt-4o-mini
                </span>
              </div>

              <div className="bg-[#0B1224] p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gasto 15 dias (USD)</span>
                <div className="my-3">
                  <span className="text-3xl font-black text-purple-300">${aiCosts?.spent15d || '0.00'}</span>
                </div>
                <span className="text-[11px] text-slate-500">Consumo acumulado</span>
              </div>

              <div className="bg-[#0B1224] p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gasto 30 dias (USD)</span>
                <div className="my-3">
                  <span className="text-3xl font-black text-emerald-400">${aiCosts?.spent30d || '0.00'}</span>
                </div>
                <span className="text-[11px] text-emerald-400/80 font-medium">Dentro do limite do plano</span>
              </div>

              <div className="bg-[#0B1224] p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projeção Mensal</span>
                <div className="my-3">
                  <span className="text-3xl font-black text-amber-400">${aiCosts?.projectionMonth || '0.00'}</span>
                </div>
                <span className="text-[11px] text-amber-400/80 font-medium">Estimativa com base no volume</span>
              </div>
            </div>

            {/* Daily Evolution Chart */}
            <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-400" />
                Evolução Diária de Custo por Execução (USD $)
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aiCosts?.dailyCostEvolution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} unit="$" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1224",
                        borderColor: "#334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="cost" name="Custo USD ($)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Executions Table */}
            <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Últimas Execuções de Inteligência Artificial</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#11192A] text-slate-400">
                      <th className="py-3 px-6 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Modelo</th>
                      <th className="py-3 px-4 font-semibold">Contexto / Lead</th>
                      <th className="py-3 px-4 font-semibold text-center">Prompt Tokens</th>
                      <th className="py-3 px-4 font-semibold text-center">Completion Tokens</th>
                      <th className="py-3 px-6 font-semibold text-right">Custo USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {aiCosts?.detailedExecutions?.map((ex: any) => (
                      <tr key={ex.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-6 font-mono text-slate-500">{ex.id}</td>
                        <td className="py-3 px-4 font-semibold text-purple-400">{ex.model}</td>
                        <td className="py-3 px-4 text-slate-300">{ex.contactName}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{ex.promptTokens}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{ex.completionTokens}</td>
                        <td className="py-3 px-6 text-right font-mono font-bold text-emerald-400">
                          ${ex.costUsd.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
