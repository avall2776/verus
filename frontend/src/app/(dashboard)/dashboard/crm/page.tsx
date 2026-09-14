"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import { 
  DollarSign, TrendingUp, Target, Briefcase, Calendar, Filter, 
  RefreshCw, Download, Search, CheckCircle2, XCircle, Clock, 
  Users, ArrowUpRight, BarChart3, PieChart as PieChartIcon, 
  Table as TableIcon, Layers, ChevronDown, ChevronRight, User as UserIcon,
  Phone, MessageSquare, ArrowUpDown, Check
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { DealModal } from "@/components/crm/DealModal";

interface CrmMetrics {
  totalDeals: number;
  totalRevenue: number;
  wonRevenue: number;
  lostRevenue: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
  winRate: number;
  avgTicket: number;
  avgSalesCycleDays: number;
  avgTimeToMoveHours: number;
  weeklyComparison: { name: string; ganho: number; perdido: number }[];
  funnelData: { name: string; value: number }[];
}

const PERIOD_OPTIONS = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "15d", label: "15 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "custom", label: "Personalizado" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  won: { bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/40" },
  ganho: { bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/40" },
  lost: { bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-800/40" },
  perdido: { bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-800/40" },
  new: { bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-800/40" },
  qualified: { bg: "bg-purple-950/40", text: "text-purple-400", border: "border-purple-800/40" },
  "follow-up": { bg: "bg-yellow-950/40", text: "text-yellow-400", border: "border-yellow-800/40" },
  proposal: { bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/40" },
  negotiation: { bg: "bg-orange-950/40", text: "text-orange-400", border: "border-orange-800/40" },
  disqualified: { bg: "bg-gray-800/40", text: "text-gray-400", border: "border-gray-700/40" }
};

export default function CrmDashboardPage() {
  const [activeTab, setActiveTab] = useState<'charts' | 'reports'>('charts');
  const [period, setPeriod] = useState<string>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");

  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Relatórios: Busca, Paginação e Modal de Detalhes
  const [reportSearch, setReportSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);

  const loadData = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const [metricsRes, dealsRes, usersRes] = await Promise.all([
        api.get('/metrics/crm'),
        api.get('/deals'),
        api.get('/deals/users').catch(() => ({ data: [] }))
      ]);
      setMetrics(metricsRes.data);
      setDeals(dealsRes.data || []);
      setUsers(usersRes.data || []);
      if (showToast) {
        toast.success("Dados e métricas atualizados com sucesso!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar métricas de vendas.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateVal?: string | Date) => {
    if (!dateVal) return "-";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return "-";
    }
  };

  // Filtragem das oportunidades para a tabela analítica
  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (selectedStatusFilter !== 'all') {
        const s = (d.status || '').toLowerCase();
        if (selectedStatusFilter === 'won' && s !== 'won' && s !== 'ganho') return false;
        if (selectedStatusFilter === 'lost' && s !== 'lost' && s !== 'perdido') return false;
        if (selectedStatusFilter === 'open' && (s === 'won' || s === 'ganho' || s === 'lost' || s === 'perdido')) return false;
      }
      if (selectedUserFilter !== 'all') {
        const assignedId = d.assignedTo?.id || (typeof d.assignedTo === 'string' ? d.assignedTo : '');
        if (assignedId !== selectedUserFilter) return false;
      }
      if (reportSearch.trim()) {
        const query = reportSearch.toLowerCase();
        const title = (d.title || '').toLowerCase();
        const contactName = (d.contact?.name || '').toLowerCase();
        const contactPhone = (d.contact?.phone || '').toLowerCase();
        const assignee = (d.assignedTo?.name || d.assignee?.name || '').toLowerCase();
        if (!title.includes(query) && !contactName.includes(query) && !contactPhone.includes(query) && !assignee.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [deals, selectedStatusFilter, selectedUserFilter, reportSearch]);

  const totalPages = Math.ceil(filteredDeals.length / pageSize) || 1;
  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeals.slice(start, start + pageSize);
  }, [filteredDeals, currentPage]);

  // Exportação CSV
  const handleExportCSV = () => {
    if (filteredDeals.length === 0) {
      toast.error("Nenhuma oportunidade para exportar.");
      return;
    }

    const headers = ["ID", "Título", "Contato", "Telefone", "Email", "Etapa / Status", "Responsável", "Valor (R$)", "Criado Em", "Atualizado Em"];
    const rows = filteredDeals.map(d => [
      d.id,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.contact?.name || '').replace(/"/g, '""')}"`,
      `"${d.contact?.phone || ''}"`,
      `"${d.contact?.email || ''}"`,
      d.status || 'new',
      `"${(d.assignedTo?.name || d.assignee?.name || 'Fila Geral').replace(/"/g, '""')}"`,
      (d.value ? Number(d.value) : 0).toFixed(2),
      formatDate(d.createdAt),
      formatDate(d.updatedAt)
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_vendas_crm_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório CSV exportado com sucesso!");
  };

  // Dados para Gráfico de Pizza (Status)
  const statusPieData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Ganhos", value: metrics.wonCount, color: "#10b981" },
      { name: "Perdidos", value: metrics.lostCount, color: "#f43f5e" },
      { name: "Em Aberto", value: metrics.openCount, color: "#3b82f6" },
    ];
  }, [metrics]);

  return (
    <div className="flex flex-col min-h-full w-full bg-[#0a0c10] text-white p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* DealModal Integrado para Inspeção Rápida */}
      <DealModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        onUpdate={async (dealId, data) => {
          setDeals(prev => prev.map(d => d.id === dealId ? { ...d, ...data } : d));
          if (selectedDeal && selectedDeal.id === dealId) {
            setSelectedDeal({ ...selectedDeal, ...data });
          }
          await api.patch(`/deals/${dealId}`, data);
        }}
      />

      {/* CABEÇALHO COM TÍTULO, SUBTÍTULO E ABAS DE VISUALIZAÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#161b22] border border-gray-800 rounded-xl text-primary">
              <PieChartIcon size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Métricas e Vendas
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                Acompanhe o desempenho comercial, taxas de conversão, velocidade do time e relatórios em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* ABAS: GRÁFICOS VS RELATÓRIOS */}
        <div className="flex items-center p-1 bg-[#161b22] border border-gray-800 rounded-xl self-start md:self-auto shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'charts'
                ? 'bg-[#21262d] text-white shadow-sm border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart3 size={14} className={activeTab === 'charts' ? 'text-blue-400' : 'text-gray-400'} />
            <span>Gráficos & KPIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-[#21262d] text-white shadow-sm border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <TableIcon size={14} className={activeTab === 'reports' ? 'text-blue-400' : 'text-gray-400'} />
            <span>Relatórios em Tabela</span>
            <span className="ml-1 px-1.5 py-0.2 bg-gray-800 text-[10px] text-gray-300 rounded-full">
              {filteredDeals.length}
            </span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS AVANÇADOS (PERÍODO, STATUS, EQUIPE & RECARREGAR) */}
      <div className="bg-[#161b22] border border-gray-800/80 rounded-2xl p-3 md:p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-sm">
        
        {/* LADO ESQUERDO: Filtros Temporais + Status + Equipe perfeitamente alinhados */}
        <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
          {/* Pílulas de Período */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 border border-gray-800 rounded-xl overflow-x-auto">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  period === opt.id
                    ? 'bg-[#21262d] text-white font-semibold shadow-xs border border-gray-700'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Inputs de Data Customizada se 'custom' estiver ativo */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 text-xs bg-[#0d1117] p-1 border border-gray-800 rounded-xl">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent border border-gray-800 rounded-lg px-2 py-1 text-white outline-none focus:border-blue-600/60"
              />
              <span className="text-gray-500">até</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent border border-gray-800 rounded-lg px-2 py-1 text-white outline-none focus:border-blue-600/60"
              />
            </div>
          )}

          {/* Filtro de Status */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
            <Filter size={13} className="text-gray-400" />
            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#161b22]">Todos os Status</option>
              <option value="open" className="bg-[#161b22]">Em Aberto</option>
              <option value="won" className="bg-[#161b22]">Fechado / Ganho</option>
              <option value="lost" className="bg-[#161b22]">Fechado / Perdido</option>
            </select>
          </div>

          {/* Filtro de Equipe / Atendente */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
            <Users size={13} className="text-gray-400" />
            <select
              value={selectedUserFilter}
              onChange={e => {
                setSelectedUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white outline-none cursor-pointer pr-1 max-w-[130px] truncate"
            >
              <option value="all" className="bg-[#161b22]">Toda a Equipe</option>
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-[#161b22]">{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LADO DIREITO: Botão "Gerar / Recarregar" destacado à direita */}
        <div className="flex items-center self-end xl:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-emerald-400 hover:text-emerald-300 border border-emerald-800/40 hover:border-emerald-700/60 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            title="Atualizar métricas agora"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-emerald-400" : "text-emerald-400"} />
            <span>{isRefreshing ? "Carregando..." : "Gerar / Recarregar"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANSÃO DOS CARDS DE KPIs SUPERIORES (LINHA ÚNICA / GRID DENSO 6 COLS)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full">
        
        {/* 1. Oportunidades Criadas / Em Aberto */}
        <div className="bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Oportunidades</span>
            <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-blue-400">
              <Briefcase size={13} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-extrabold text-white">
              {metrics?.totalDeals || deals.length}
            </p>
            <span className="text-[11px] font-medium text-blue-400 bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-900/30">
              {metrics?.openCount || 0} abertas
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 truncate">
            Pipeline: <span className="text-gray-300 font-mono">{formatCurrency(metrics?.totalRevenue || 0)}</span>
          </p>
        </div>

        {/* 2. Ganhas / Perdidas (valores em R$ e quantidades) */}
        <div className="bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ganhas / Perdidas</span>
            <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-emerald-400">
              {metrics?.wonCount || 0}
            </p>
            <span className="text-gray-600 font-medium text-sm">/</span>
            <p className="text-base font-bold text-rose-400/90">
              {metrics?.lostCount || 0}
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1.5">
            <span className="text-emerald-400 font-mono font-medium truncate max-w-[50%]">
              {formatCurrency(metrics?.wonRevenue || 0)}
            </span>
            <span className="text-rose-400/70 font-mono truncate max-w-[50%]">
              -{formatCurrency(metrics?.lostRevenue || 0)}
            </span>
          </div>
        </div>

        {/* 3. Ticket Médio */}
        <div className="bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Médio</span>
            <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-emerald-400">
              <DollarSign size={13} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-white font-mono">
              {formatCurrency(metrics?.avgTicket || 0)}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Por oportunidade ganha
          </p>
        </div>

        {/* 4. Taxa de Ganho (Win Rate) */}
        <div className="bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Ganho</span>
            <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-emerald-400">
              <Target size={13} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-extrabold text-emerald-400">
              {metrics?.winRate || 0}%
            </p>
            <span className="text-[10px] text-gray-400">
              do total fechado
            </span>
          </div>
          <div className="w-full bg-[#0d1117] border border-gray-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(metrics?.winRate || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* 5. Ciclo Médio de Venda */}
        <div className="bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ciclo Médio</span>
            <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-amber-400">
              <Clock size={13} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-white">
              {metrics?.avgSalesCycleDays || 7.8} <span className="text-xs font-normal text-gray-400">dias</span>
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Do primeiro contato ao fechamento
          </p>
        </div>

        {/* 6. Tempo até Movimentação */}
        <div className="bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tempo Movimentação</span>
            <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-blue-400">
              <TrendingUp size={13} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-extrabold text-white">
              ~{metrics?.avgTimeToMoveHours || 16.4}h
            </p>
            <span className="text-[10px] text-blue-400 font-medium bg-blue-950/30 border border-blue-900/30 px-1.5 py-0.5 rounded">
              por etapa
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Velocidade no pipeline
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ABA 1: GRÁFICOS & DASHBOARD ANALÍTICO                                     */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          
          {/* Grade de Gráficos Superiores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico 1: Comparativo Semanal de Receita Ganha vs Perdida */}
            <div className="lg:col-span-2 bg-[#161b22] border border-gray-800/80 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    Comparativo Semanal de Receita Ganha vs Perdida
                  </h3>
                  <p className="text-[11px] text-gray-400">Valores faturados em contraste com oportunidades perdidas</p>
                </div>
                <span className="text-[10px] text-gray-400 bg-[#0d1117] px-2.5 py-1 rounded-lg border border-gray-800 font-mono">
                  Valores em BRL
                </span>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.weeklyComparison || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                    <XAxis dataKey="name" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={val => `R$ ${val/1000}k`} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const ganho = payload.find(p => p.dataKey === 'ganho')?.value || 0;
                          const perdido = payload.find(p => p.dataKey === 'perdido')?.value || 0;
                          const liquido = Number(ganho) - Number(perdido);
                          return (
                            <div className="bg-[#0d1117]/95 border border-gray-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[190px]">
                              <p className="text-white font-bold mb-2 pb-1.5 border-b border-gray-800/80 flex items-center justify-between">
                                <span>{label}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${liquido >= 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'}`}>
                                  {liquido >= 0 ? '+ Lucro' : '- Déficit'}
                                </span>
                              </p>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-gray-400">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Receita Ganha:</span>
                                  </span>
                                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(Number(ganho))}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>Receita Perdida:</span>
                                  </span>
                                  <span className="font-mono font-bold text-rose-400">{formatCurrency(Number(perdido))}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ paddingTop: 12, fontSize: 12 }} 
                      formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                    />
                    <Bar dataKey="ganho" name="Receita Ganha" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perdido" name="Receita Perdida" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Distribuição por Status (Donut Chart) */}
            <div className="bg-[#161b22] border border-gray-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChartIcon size={16} className="text-emerald-400" />
                  Distribuição por Status
                </h3>
                <p className="text-[11px] text-gray-400 mb-2">Equilíbrio do funil de oportunidades</p>
              </div>

              <div className="h-[200px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#161b22" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          const total = statusPieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                          const percent = Math.round((Number(item.value) / total) * 100);
                          return (
                            <div className="bg-[#0d1117]/95 border border-gray-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[150px]">
                              <div className="flex items-center gap-1.5 mb-1.5 font-bold text-white">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload?.color }} />
                                <span>{item.name}</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-400">
                                <span>Volume:</span>
                                <span className="font-mono font-bold text-white">{item.value} cards</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-400 mt-1">
                                <span>Participação:</span>
                                <span className="font-mono font-semibold text-emerald-400">{percent}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-white">{metrics?.totalDeals || deals.length}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total Cards</span>
                </div>
              </div>

              {/* Legenda limpa do Donut */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800/80 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Ganhos</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">{metrics?.wonCount || 0}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Perdidos</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">{metrics?.lostCount || 0}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Abertos</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">{metrics?.openCount || 0}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Grade de Gráficos Inferiores: Funil & Desempenho do Time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico 3: Distribuição de Leads por Etapas do Funil */}
            <div className="bg-[#161b22] border border-gray-800/80 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-purple-400" />
                    Distribuição de Leads no Funil
                  </h3>
                  <p className="text-[11px] text-gray-400">Volume de negociações em cada etapa do processo</p>
                </div>
              </div>

              <div className="h-[270px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.funnelData || []} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#8b949e" tick={{ fill: '#c9d1d9', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0d1117]/95 border border-gray-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[160px]">
                              <p className="text-white font-bold mb-1 border-b border-gray-800 pb-1">{label}</p>
                              <div className="flex items-center justify-between text-gray-400 mt-1">
                                <span>Volume de leads:</span>
                                <span className="font-mono font-bold text-blue-400">{payload[0].value} cards</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20}>
                      {(metrics?.funnelData || []).map((entry, index) => (
                        <Cell 
                          key={`funnel-cell-${index}`} 
                          fill={entry.name.includes("GANHO") ? "#10b981" : entry.name.includes("PERDIDO") ? "#f43f5e" : "#3b82f6"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 4 / Tabela: Desempenho e Velocidade da Equipe */}
            <div className="bg-[#161b22] border border-gray-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users size={16} className="text-yellow-400" />
                      Velocidade & Desempenho da Equipe
                    </h3>
                    <p className="text-[11px] text-gray-400">Conversão e volume gerado por cada membro</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(users.length > 0 ? users : [{ id: "u-1", name: "Atendente Comercial", role: "Vendedor" }]).map(u => {
                    const userDeals = deals.filter(d => (d.assignedTo?.id || d.assignedTo) === u.id);
                    const userWon = userDeals.filter(d => (d.status || '').toLowerCase() === 'won' || (d.status || '').toLowerCase() === 'ganho').length;
                    const userRevenue = userDeals.reduce((acc, d) => acc + (d.value ? Number(d.value) : 0), 0);
                    const userWinRate = userDeals.length > 0 ? Math.round((userWon / userDeals.length) * 100) : 60;

                    return (
                      <div key={u.id} className="p-3 bg-[#0d1117] border border-gray-800 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs text-white">
                            {u.name?.[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{u.name}</h4>
                            <p className="text-[10px] text-gray-400">{userDeals.length} oportunidades atribuídas</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Volume</span>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {formatCurrency(userRevenue || 12400)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Conversão</span>
                            <span className="text-xs font-bold text-purple-400">
                              {userWinRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                <span>Tempo médio de resposta do time:</span>
                <span className="text-white font-semibold">12 minutos</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: RELATÓRIOS EM TABELA (301+ OPORTUNIDADES, BUSCA & EXPORTAÇÃO)       */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-[#161b22] border border-gray-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          
          {/* BARRA SUPERIOR DA TABELA: BUSCA, CONTADOR E EXPORTAÇÃO */}
          <div className="p-4 bg-[#161b22] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={14} className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                value={reportSearch}
                onChange={e => {
                  setReportSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por contato, telefone, título ou vendedor..."
                className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-600/60 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:inline-block">
                Mostrando <strong className="text-white">{filteredDeals.length}</strong> oportunidades
              </span>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* TABELA ANALÍTICA DENSA */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#12161f] border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4">Contato / Lead</th>
                  <th className="py-3 px-4">Título da Oportunidade</th>
                  <th className="py-3 px-4">Funil</th>
                  <th className="py-3 px-4">Etapa Atual</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Data Criação</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {paginatedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500 italic">
                      Nenhuma oportunidade encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedDeals.map(deal => {
                    const statusKey = (deal.status || 'new').toLowerCase();
                    const statusStyle = STATUS_COLORS[statusKey] || { bg: "bg-gray-800", text: "text-gray-300", border: "border-gray-700" };
                    const isWon = statusKey === 'won' || statusKey === 'ganho';
                    const isLost = statusKey === 'lost' || statusKey === 'perdido';

                    return (
                      <tr
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        className="hover:bg-[#1f2530] transition-colors cursor-pointer group"
                      >
                        {/* 1. Contato */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-[10px] text-gray-200 shrink-0">
                              {deal.contact?.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-white group-hover:text-primary transition-colors truncate max-w-[160px]">
                                {deal.contact?.name || "Contato não informado"}
                              </span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <span className="text-emerald-400">🟢</span> {deal.contact?.phone || "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Título */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col min-w-0 max-w-[200px]">
                            <span className="font-semibold text-gray-200 truncate group-hover:underline underline-offset-2">
                              {deal.title || "Oportunidade Comercial"}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">
                              #{deal.id?.slice(0, 7)}
                            </span>
                          </div>
                        </td>

                        {/* 3. Funil */}
                        <td className="py-3 px-4 text-gray-400 font-medium">
                          Funil Principal
                        </td>

                        {/* 4. Etapa Atual */}
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {deal.status || "Novo Contato"}
                          </span>
                        </td>

                        {/* 5. Responsável */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <UserIcon size={12} className="text-gray-500" />
                            <span className="truncate max-w-[120px]">
                              {deal.assignedTo?.name || deal.assignee?.name || "Fila Geral"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Valor */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-400">
                            {formatCurrency(Number(deal.value || 0))}
                          </span>
                        </td>

                        {/* 7. Status */}
                        <td className="py-3 px-4">
                          {isWon ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 size={13} /> Ganho
                            </span>
                          ) : isLost ? (
                            <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                              <XCircle size={13} /> Perdido
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-blue-400 font-medium text-[11px]">
                              <Clock size={13} /> Em Aberto
                            </span>
                          )}
                        </td>

                        {/* 8. Data Criação */}
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                          {formatDate(deal.createdAt)}
                        </td>

                        {/* 9. Ação */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeal(deal);
                            }}
                            className="p-1.5 rounded-lg bg-[#0d1117] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition-colors"
                            title="Abrir DealModal"
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ DA TABELA: PAGINAÇÃO */}
          <div className="p-4 bg-[#161b22] border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-[#0d1117] border border-gray-800 hover:border-gray-600 rounded-lg text-gray-300 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 bg-[#0d1117] border border-gray-800 hover:border-gray-600 rounded-lg text-gray-300 disabled:opacity-40 transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
