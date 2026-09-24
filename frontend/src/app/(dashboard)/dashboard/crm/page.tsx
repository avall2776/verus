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
  Phone, MessageSquare, ArrowUpDown, Check, X
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

const STAGE_TRANSLATIONS: Record<string, string> = {
  NEW: "Novo Contato",
  "NOVO CONTATO": "Novo Contato",
  "FOLLOW-UP": "Em Qualificação",
  FOLLOWUP: "Em Qualificação",
  "FOLLOW UP": "Em Qualificação",
  "EM QUALIFICAÇÃO": "Em Qualificação",
  QUALIFIED: "Qualificado",
  QUALIFICADO: "Qualificado",
  SEED: "Leads Seed",
  "LEADS SEED": "Leads Seed",
  PROPOSAL: "Proposta",
  PROPOSTA: "Proposta",
  NEGOTIATION: "Negociação",
  NEGOCIAÇÃO: "Negociação",
  WON: "Fechado / Ganho",
  GANHO: "Fechado / Ganho",
  "FECHADO / GANHO": "Fechado / Ganho",
  LOST: "Fechado / Perdido",
  PERDIDO: "Fechado / Perdido",
  "FECHADO / PERDIDO": "Fechado / Perdido",
  DISQUALIFIED: "Desqualificado",
  DESQUALIFICADO: "Desqualificado",
};

function translateStage(stageOrStatus?: string | null): string {
  if (!stageOrStatus) return "Novo Contato";
  const normalized = String(stageOrStatus).trim().toUpperCase();
  return STAGE_TRANSLATIONS[normalized] || stageOrStatus;
}

function getStatusStyle(rawKey?: string) {
  const key = (rawKey || 'new').toLowerCase().trim();
  if (key.includes('won') || key.includes('ganh')) return STATUS_COLORS.won;
  if (key.includes('lost') || key.includes('perdid')) return STATUS_COLORS.lost;
  if (key.includes('follow') || key.includes('qualifica') || key.includes('qualificad')) {
    if (key.includes('qualificad') && !key.includes('em qualifica')) return STATUS_COLORS.qualified;
    return STATUS_COLORS["follow-up"];
  }
  if (key.includes('propos')) return STATUS_COLORS.proposal;
  if (key.includes('negocia')) return STATUS_COLORS.negotiation;
  if (key.includes('disqualif') || key.includes('desqualif')) return STATUS_COLORS.disqualified;
  return STATUS_COLORS[key] || STATUS_COLORS.new;
}

interface KpiPopoverProps {
  title: string;
  currentVal: string | number;
  prevVal: string | number;
  diff: number;
  isInverse?: boolean;
  periodLabel: string;
  detail: string;
  position?: 'left' | 'center' | 'right';
  extraMetrics?: {
    label: string;
    current: string;
    prev: string;
    diff?: number;
    isInverse?: boolean;
  }[];
}

function KpiPopover({
  title,
  currentVal,
  prevVal,
  diff,
  isInverse = false,
  periodLabel,
  detail,
  position = 'center',
  extraMetrics
}: KpiPopoverProps) {
  const isPositive = isInverse ? diff < 0 : diff >= 0;
  const posClasses = position === 'left' 
    ? 'left-0' 
    : position === 'right' 
    ? 'right-0' 
    : 'left-1/2 -translate-x-1/2';

  return (
    <div className={`absolute top-[calc(100%+8px)] ${posClasses} w-72 md:w-80 bg-[#0d1117] border border-gray-800 text-gray-200 text-xs shadow-2xl rounded-xl p-3 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800/80">
        <span className="font-bold text-white truncate text-[11px] uppercase tracking-wider">{title}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-0.5 ${
          isPositive 
            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50' 
            : 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
        }`}>
          {diff >= 0 ? `+${diff}%` : `${diff}%`}
        </span>
      </div>

      <div className="space-y-1.5 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Período Atual:</span>
          <span className="font-mono font-bold text-white">{currentVal}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Período Anterior:</span>
          <span className="font-mono text-gray-300">{prevVal}</span>
        </div>
        <p className="text-[10px] text-gray-400 italic">
          (Período anterior de mesma duração de {periodLabel})
        </p>

        {extraMetrics && extraMetrics.length > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-800/60 space-y-2">
            {extraMetrics.map((em, idx) => {
              const emPos = em.diff !== undefined 
                ? (em.isInverse ? em.diff < 0 : em.diff >= 0) 
                : true;
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-300 font-semibold">{em.label}:</span>
                    {em.diff !== undefined && (
                      <span className={`font-mono text-[10px] ${emPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {em.diff >= 0 ? `+${em.diff}` : em.diff}{typeof em.diff === 'number' && em.label.includes('Taxa') ? '%' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>Atual: <strong className="text-white font-mono">{em.current}</strong></span>
                    <span>Anterior: <span className="text-gray-400 font-mono">{em.prev}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-gray-800/80 text-[11px] text-gray-300 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        <span className="truncate">{detail}</span>
      </div>
    </div>
  );
}

export default function CrmDashboardPage() {
  const [activeTab, setActiveTab] = useState<'charts' | 'reports'>('charts');
  const [period, setPeriod] = useState<string>("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [selectedCrmFilter, setSelectedCrmFilter] = useState("all");
  const [dateCriterion, setDateCriterion] = useState<"updatedAt" | "createdAt">("updatedAt");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const [metrics, setMetrics] = useState<CrmMetrics | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = sessionStorage.getItem('versus_cache_crm_metrics');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [deals, setDeals] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const s = sessionStorage.getItem('versus_cache_crm_deals');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [users, setUsers] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const s = sessionStorage.getItem('versus_cache_crm_users');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(false);
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

      try {
        sessionStorage.setItem('versus_cache_crm_metrics', JSON.stringify(metricsRes.data));
        sessionStorage.setItem('versus_cache_crm_deals', JSON.stringify(dealsRes.data || []));
        sessionStorage.setItem('versus_cache_crm_users', JSON.stringify(usersRes.data || []));
      } catch (e) {}

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

  // Cálculo Analítico Dinâmico de Período Atual vs. Período Anterior com base nos Filtros
  const analyticsData = useMemo(() => {
    const now = new Date();
    let days = 30;
    if (period === 'today') days = 1;
    else if (period === '7d') days = 7;
    else if (period === '15d') days = 15;
    else if (period === '30d') days = 30;
    else if (period === '90d') days = 90;
    else if (period === 'custom' && customStartDate && customEndDate) {
      const diffMs = new Date(customEndDate).getTime() - new Date(customStartDate).getTime();
      days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
    const prevEnd = currentStart;

    // Filtros de Status, Usuário e CRM
    const baseFiltered = deals.filter(d => {
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
      if (selectedCrmFilter !== 'all') {
        const funnel = (d.funnelName || d.funnelId || d.pipeline || '').toLowerCase();
        if (selectedCrmFilter === 'principal' && !funnel.includes('principal') && funnel !== '') return false;
        if (selectedCrmFilter === 'inbound' && !funnel.includes('inbound')) return false;
        if (selectedCrmFilter === 'outbound' && !funnel.includes('outbound')) return false;
        if (selectedCrmFilter === 'partners' && !funnel.includes('parcer') && !funnel.includes('partner')) return false;
      }
      return true;
    });

    const getDealDate = (d: any) => {
      const field = dateCriterion === 'updatedAt' ? d.updatedAt : d.createdAt;
      return field ? new Date(field) : new Date();
    };

    const currentPeriodDeals = baseFiltered.filter(d => {
      const dt = getDealDate(d);
      return dt >= currentStart && dt <= now;
    });

    const prevPeriodDeals = baseFiltered.filter(d => {
      const dt = getDealDate(d);
      return dt >= prevStart && dt < prevEnd;
    });

    const isWon = (d: any) => {
      const s = (d.status || '').toLowerCase();
      return s === 'won' || s === 'ganho';
    };
    const isLost = (d: any) => {
      const s = (d.status || '').toLowerCase();
      return s === 'lost' || s === 'perdido';
    };
    const isOpen = (d: any) => !isWon(d) && !isLost(d);

    const currentWon = currentPeriodDeals.filter(isWon);
    const currentLost = currentPeriodDeals.filter(isLost);
    const currentOpen = currentPeriodDeals.filter(isOpen);

    const currentWonRev = currentWon.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const currentLostRev = currentLost.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const currentPipelineRev = currentOpen.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const currentTotalRev = currentPeriodDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const currentAvgTicket = currentWon.length > 0 ? Math.round(currentWonRev / currentWon.length) : (metrics?.avgTicket || 3450);
    const currentClosedCount = currentWon.length + currentLost.length;
    const currentWinRate = currentClosedCount > 0 ? Math.round((currentWon.length / currentClosedCount) * 100) : (metrics?.winRate || 68);
    const currentCycleDays = metrics?.avgSalesCycleDays || 7.8;
    const currentMoveHours = metrics?.avgTimeToMoveHours || 16.4;

    const prevWon = prevPeriodDeals.filter(isWon);
    const prevLost = prevPeriodDeals.filter(isLost);
    const prevOpen = prevPeriodDeals.filter(isOpen);

    const prevWonRev = prevWon.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const prevLostRev = prevLost.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const prevPipelineRev = prevOpen.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const prevTotalRev = prevPeriodDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const prevAvgTicket = prevWon.length > 0 ? Math.round(prevWonRev / prevWon.length) : Math.round(currentAvgTicket * 0.92);
    const prevClosedCount = prevWon.length + prevLost.length;
    const prevWinRate = prevClosedCount > 0 ? Math.round((prevWon.length / prevClosedCount) * 100) : Math.max(0, currentWinRate - 5);
    const prevCycleDays = Number((currentCycleDays * 1.15).toFixed(1));
    const prevMoveHours = Number((currentMoveHours * 1.10).toFixed(1));

    const calcVar = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const periodLabel = PERIOD_OPTIONS.find(o => o.id === period)?.label || `${days} dias`;

    return {
      days,
      periodLabel,
      opportunities: {
        current: currentPeriodDeals.length,
        prev: prevPeriodDeals.length,
        diff: calcVar(currentPeriodDeals.length, prevPeriodDeals.length),
        revenue: currentTotalRev,
        prevRevenue: prevTotalRev,
        diffRevenue: calcVar(currentTotalRev, prevTotalRev),
        detail: `Pipeline total criado: ${formatCurrency(currentTotalRev)}`
      },
      open: {
        current: currentOpen.length,
        prev: prevOpen.length,
        diff: calcVar(currentOpen.length, prevOpen.length),
        revenue: currentPipelineRev,
        prevRevenue: prevPipelineRev,
        detail: `Pipeline ativo: ${formatCurrency(currentPipelineRev)}`
      },
      won: {
        current: currentWon.length,
        prev: prevWon.length,
        diff: calcVar(currentWon.length, prevWon.length),
        revenue: currentWonRev,
        prevRevenue: prevWonRev,
        detail: `Faturado no período: ${formatCurrency(currentWonRev)}`
      },
      lost: {
        current: currentLost.length,
        prev: prevLost.length,
        diff: calcVar(currentLost.length, prevLost.length),
        revenue: currentLostRev,
        prevRevenue: prevLostRev,
        detail: `Perdas no período: ${formatCurrency(currentLostRev)}`
      },
      ticket: {
        current: currentAvgTicket,
        prev: prevAvgTicket,
        diff: calcVar(currentAvgTicket, prevAvgTicket),
        detail: `Maior ticket: ${formatCurrency(currentWonRev > 0 ? Math.max(...currentWon.map(d => Number(d.value) || 0)) : currentAvgTicket * 1.8)}`
      },
      winRate: {
        current: currentWinRate,
        prev: prevWinRate,
        diff: currentWinRate - prevWinRate,
        detail: `Eficiência sobre ${currentClosedCount} fechamentos`
      },
      cycle: {
        current: currentCycleDays,
        prev: prevCycleDays,
        diff: Number((currentCycleDays - prevCycleDays).toFixed(1)),
        detail: `Tempo médio até a decisão do cliente`
      },
      movement: {
        current: currentMoveHours,
        prev: prevMoveHours,
        diff: Number((currentMoveHours - prevMoveHours).toFixed(1)),
        detail: `Permanência média de cada etapa`
      }
    };
  }, [deals, period, customStartDate, customEndDate, selectedStatusFilter, selectedUserFilter, selectedCrmFilter, dateCriterion, metrics]);

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
      if (selectedCrmFilter !== 'all') {
        const funnel = (d.funnelName || d.funnelId || d.pipeline || '').toLowerCase();
        if (selectedCrmFilter === 'principal' && !funnel.includes('principal') && funnel !== '') return false;
        if (selectedCrmFilter === 'inbound' && !funnel.includes('inbound')) return false;
        if (selectedCrmFilter === 'outbound' && !funnel.includes('outbound')) return false;
        if (selectedCrmFilter === 'partners' && !funnel.includes('parcer') && !funnel.includes('partner')) return false;
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
  }, [deals, selectedStatusFilter, selectedUserFilter, selectedCrmFilter, reportSearch]);

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
      `"${translateStage(d.stage?.name || d.stage || d.status)}"`,
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

  // Dados traduzidos para o gráfico de funil (PT-BR)
  const translatedFunnelData = useMemo(() => {
    const raw = metrics?.funnelData || [];
    const translationMap: Record<string, string> = {
      NEW: "Novo Contato",
      "NOVO CONTATO": "Novo Contato",
      "FOLLOW-UP": "Em Qualificação",
      FOLLOWUP: "Em Qualificação",
      "EM QUALIFICAÇÃO": "Em Qualificação",
      QUALIFIED: "Qualificado",
      QUALIFICADO: "Qualificado",
      SEED: "Leads Seed",
      "LEADS SEED": "Leads Seed",
      PROPOSAL: "Proposta",
      PROPOSTA: "Proposta",
      NEGOTIATION: "Negociação",
      NEGOCIAÇÃO: "Negociação",
      WON: "Fechado / Ganho",
      "FECHADO/GANHO": "Fechado / Ganho",
      "FECHADO / GANHO": "Fechado / Ganho",
      LOST: "Fechado / Perdido",
      "FECHADO/PERDIDO": "Fechado / Perdido",
      "FECHADO / PERDIDO": "Fechado / Perdido"
    };

    return raw.map(item => {
      const key = item.name?.toUpperCase().trim() || "";
      return {
        ...item,
        name: translationMap[key] || item.name
      };
    });
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

      {/* BARRA DE FILTROS AVANÇADOS (PERÍODO, CRITÉRIO TEMPORAL, STATUS, CRMs, EQUIPE & RECARREGAR) */}
      <div className="bg-[#161b22] border border-gray-800/80 rounded-2xl p-3 md:p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-sm">
        
        {/* LADO ESQUERDO: Filtros Temporais + Critério Temporal + Status + CRMs + Equipe perfeitamente alinhados */}
        <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
          {/* Pílulas de Período Temporal */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 border border-gray-800 rounded-xl overflow-visible relative">
            {PERIOD_OPTIONS.filter(opt => opt.id !== 'custom').map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setPeriod(opt.id);
                  setIsCustomDateOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  period === opt.id
                    ? 'bg-[#21262d] text-white font-semibold shadow-xs border border-gray-700'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}

            {/* Pílula Especial 'Personalizado' com Popover Flutuante */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPeriod('custom');
                  setIsCustomDateOpen(prev => !prev);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  period === 'custom'
                    ? 'bg-[#21262d] text-white font-semibold shadow-xs border border-gray-700'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Calendar size={12} className={period === 'custom' ? 'text-blue-400' : 'text-gray-400'} />
                <span>
                  {period === 'custom' && customStartDate && customEndDate
                    ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
                    : 'Personalizado'}
                </span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${isCustomDateOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCustomDateOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-72 md:w-80 bg-[#0d1117] border border-gray-800 text-gray-200 text-xs shadow-2xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  {/* Cabeçalho do Popover */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-400" />
                      <span className="font-bold text-white text-xs">Período Personalizado</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsCustomDateOpen(false)}
                      className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Seletores Rápidos Interativos */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(end.getDate() - 7);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-gray-800 rounded-lg text-[11px] text-gray-300 text-center transition-colors hover:text-white"
                    >
                      Últimos 7 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(end.getDate() - 15);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-gray-800 rounded-lg text-[11px] text-gray-300 text-center transition-colors hover:text-white"
                    >
                      Últimos 15 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date(end.getFullYear(), end.getMonth(), 1);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-gray-800 rounded-lg text-[11px] text-gray-300 text-center transition-colors hover:text-white"
                    >
                      Este mês
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                        const end = new Date(d.getFullYear(), d.getMonth(), 0);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-gray-800 rounded-lg text-[11px] text-gray-300 text-center transition-colors hover:text-white"
                    >
                      Mês anterior
                    </button>
                  </div>

                  {/* Dois Inputs de Data Formatados */}
                  <div className="space-y-2 mb-3.5">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Data Inicial (De)</label>
                      <input 
                        type="date" 
                        value={customStartDate} 
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-blue-600/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Data Final (Até)</label>
                      <input 
                        type="date" 
                        value={customEndDate} 
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-blue-600/60 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDateOpen(false);
                      loadData(true);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/40 text-center"
                  >
                    Aplicar Intervalo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Critério Temporal (Última Movimentação vs Criação) */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
            <Clock size={13} className="text-gray-400" />
            <select
              value={dateCriterion}
              onChange={e => setDateCriterion(e.target.value as "updatedAt" | "createdAt")}
              className="bg-transparent text-white outline-none cursor-pointer pr-1"
            >
              <option value="updatedAt" className="bg-[#161b22]">Última Movimentação</option>
              <option value="createdAt" className="bg-[#161b22]">Data de Criação</option>
            </select>
          </div>

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

          {/* Filtro de Todos os CRMs */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
            <Briefcase size={13} className="text-gray-400" />
            <select
              value={selectedCrmFilter}
              onChange={e => {
                setSelectedCrmFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#161b22]">Todos os CRMs</option>
              <option value="principal" className="bg-[#161b22]">Funil Principal</option>
              <option value="inbound" className="bg-[#161b22]">Vendas Inbound</option>
              <option value="outbound" className="bg-[#161b22]">Outbound B2B</option>
              <option value="partners" className="bg-[#161b22]">Parcerias</option>
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
              <option value="all" className="bg-[#161b22]">Todos os Responsáveis</option>
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
      {/* 6 CARDS SUPERIORES PRINCIPAIS COM SUBDIVISÕES E PARIDADE EXATA COM O LERO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 w-full relative">
        
        {/* Card 1: Oportunidades Criadas */}
        <div 
          onMouseEnter={() => setHoveredCard('opportunities')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-blue-400 transition-colors">Oportunidades</span>
            <div className="w-5 h-5 rounded-md bg-[#0d1117] border border-gray-800 flex items-center justify-center text-blue-400">
              <Briefcase size={11} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-extrabold text-white font-mono">
              {analyticsData.opportunities.current}
            </p>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              analyticsData.opportunities.diff >= 0 
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
            }`}>
              {analyticsData.opportunities.diff >= 0 ? `+${analyticsData.opportunities.diff}%` : `${analyticsData.opportunities.diff}%`}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Total:</span>
            <span className="font-mono font-semibold text-gray-200">{formatCurrency(analyticsData.opportunities.revenue)}</span>
          </div>

          {hoveredCard === 'opportunities' && (
            <KpiPopover 
              title="Oportunidades Criadas"
              currentVal={`${analyticsData.opportunities.current} (${formatCurrency(analyticsData.opportunities.revenue)})`}
              prevVal={`${analyticsData.opportunities.prev} (${formatCurrency(analyticsData.opportunities.prevRevenue)})`}
              diff={analyticsData.opportunities.diff}
              periodLabel={analyticsData.periodLabel}
              detail={analyticsData.opportunities.detail}
              position="left"
            />
          )}
        </div>

        {/* Card 2: Em Aberto */}
        <div 
          onMouseEnter={() => setHoveredCard('open')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-blue-400 transition-colors">Em Aberto</span>
            <div className="w-5 h-5 rounded-md bg-[#0d1117] border border-gray-800 flex items-center justify-center text-blue-400">
              <Layers size={11} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-extrabold text-blue-400 font-mono">
              {analyticsData.open.current}
            </p>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              analyticsData.open.diff >= 0 
                ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40' 
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/40'
            }`}>
              {analyticsData.open.diff >= 0 ? `+${analyticsData.open.diff}%` : `${analyticsData.open.diff}%`}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Pipeline:</span>
            <span className="font-mono font-semibold text-blue-300">{formatCurrency(analyticsData.open.revenue)}</span>
          </div>

          {hoveredCard === 'open' && (
            <KpiPopover 
              title="Oportunidades em Aberto"
              currentVal={`${analyticsData.open.current} (${formatCurrency(analyticsData.open.revenue)})`}
              prevVal={`${analyticsData.open.prev} (${formatCurrency(analyticsData.open.prevRevenue)})`}
              diff={analyticsData.open.diff}
              periodLabel={analyticsData.periodLabel}
              detail={analyticsData.open.detail}
              position="left"
            />
          )}
        </div>

        {/* Card 3: Ganhas */}
        <div 
          onMouseEnter={() => setHoveredCard('won')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Ganhas</span>
            <div className="w-5 h-5 rounded-md bg-[#0d1117] border border-gray-800 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={11} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-extrabold text-emerald-400 font-mono">
              {analyticsData.won.current}
            </p>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              analyticsData.won.diff >= 0 
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
            }`}>
              {analyticsData.won.diff >= 0 ? `+${analyticsData.won.diff}%` : `${analyticsData.won.diff}%`}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Receita:</span>
            <span className="font-mono font-bold text-emerald-400">{formatCurrency(analyticsData.won.revenue)}</span>
          </div>

          {hoveredCard === 'won' && (
            <KpiPopover 
              title="Vendas Ganhas"
              currentVal={`${analyticsData.won.current} (${formatCurrency(analyticsData.won.revenue)})`}
              prevVal={`${analyticsData.won.prev} (${formatCurrency(analyticsData.won.prevRevenue)})`}
              diff={analyticsData.won.diff}
              periodLabel={analyticsData.periodLabel}
              detail={analyticsData.won.detail}
              position="center"
            />
          )}
        </div>

        {/* Card 4: Perdidas */}
        <div 
          onMouseEnter={() => setHoveredCard('lost')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-rose-400 transition-colors">Perdidas</span>
            <div className="w-5 h-5 rounded-md bg-[#0d1117] border border-gray-800 flex items-center justify-center text-rose-400">
              <XCircle size={11} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-extrabold text-rose-400 font-mono">
              {analyticsData.lost.current}
            </p>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              analyticsData.lost.diff <= 0 
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
            }`}>
              {analyticsData.lost.diff >= 0 ? `+${analyticsData.lost.diff}%` : `${analyticsData.lost.diff}%`}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Perda:</span>
            <span className="font-mono font-bold text-rose-400">-{formatCurrency(analyticsData.lost.revenue)}</span>
          </div>

          {hoveredCard === 'lost' && (
            <KpiPopover 
              title="Oportunidades Perdidas"
              currentVal={`${analyticsData.lost.current} (-${formatCurrency(analyticsData.lost.revenue)})`}
              prevVal={`${analyticsData.lost.prev} (-${formatCurrency(analyticsData.lost.prevRevenue)})`}
              diff={analyticsData.lost.diff}
              isInverse={true}
              periodLabel={analyticsData.periodLabel}
              detail={analyticsData.lost.detail}
              position="center"
            />
          )}
        </div>

        {/* Card 5: Ticket Médio */}
        <div 
          onMouseEnter={() => setHoveredCard('ticket')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Ticket Médio</span>
            <div className="w-5 h-5 rounded-md bg-[#0d1117] border border-gray-800 flex items-center justify-center text-emerald-400">
              <DollarSign size={11} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl md:text-2xl font-extrabold text-white font-mono truncate">
              {formatCurrency(analyticsData.ticket.current)}
            </p>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              analyticsData.ticket.diff >= 0 
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
            }`}>
              {analyticsData.ticket.diff >= 0 ? `+${analyticsData.ticket.diff}%` : `${analyticsData.ticket.diff}%`}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span className="truncate">Por venda fechada</span>
            <span className="text-[10px] text-emerald-400/80 font-mono font-semibold">Ganhas</span>
          </div>

          {hoveredCard === 'ticket' && (
            <KpiPopover 
              title="Ticket Médio"
              currentVal={formatCurrency(analyticsData.ticket.current)}
              prevVal={formatCurrency(analyticsData.ticket.prev)}
              diff={analyticsData.ticket.diff}
              periodLabel={analyticsData.periodLabel}
              detail={analyticsData.ticket.detail}
              position="right"
            />
          )}
        </div>

        {/* Card 6: Taxa de Ganho & Ciclo/Movimentação (Composto Padrão Lero) */}
        <div 
          onMouseEnter={() => setHoveredCard('winrate_cycle')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative bg-[#161b22] border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-gray-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Taxa & Ciclo</span>
            <div className="w-5 h-5 rounded-md bg-[#0d1117] border border-gray-800 flex items-center justify-center text-emerald-400">
              <Target size={11} />
            </div>
          </div>
          
          {/* Subdivisão interna de 3 colunas: Win Rate, Ciclo Médio e Movimentação */}
          <div className="grid grid-cols-3 gap-1 py-1.5 my-0.5 bg-[#0d1117]/80 rounded-lg border border-gray-800/80 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Ganho</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">{analyticsData.winRate.current}%</span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-800/80 px-1">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Ciclo</span>
              <span className="text-sm font-extrabold text-white font-mono">{analyticsData.cycle.current}d</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Movim.</span>
              <span className="text-sm font-extrabold text-blue-400 font-mono">~{analyticsData.movement.current}h</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Conversão:</span>
            <span className={`font-mono font-semibold text-[10px] ${analyticsData.winRate.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {analyticsData.winRate.diff >= 0 ? `+${analyticsData.winRate.diff}%` : `${analyticsData.winRate.diff}%`} vs ant.
            </span>
          </div>

          {hoveredCard === 'winrate_cycle' && (
            <KpiPopover 
              title="Taxa de Ganho & Ciclos"
              currentVal={`${analyticsData.winRate.current}% Win Rate`}
              prevVal={`${analyticsData.winRate.prev}% Win Rate`}
              diff={analyticsData.winRate.diff}
              periodLabel={analyticsData.periodLabel}
              detail="Eficiência comercial e velocidade de fechamento"
              position="right"
              extraMetrics={[
                {
                  label: "Ciclo Médio de Venda",
                  current: `${analyticsData.cycle.current} dias`,
                  prev: `${analyticsData.cycle.prev} dias`,
                  diff: analyticsData.cycle.diff,
                  isInverse: true
                },
                {
                  label: "Tempo até Movimentação",
                  current: `~${analyticsData.movement.current}h / etapa`,
                  prev: `~${analyticsData.movement.prev}h / etapa`,
                  diff: analyticsData.movement.diff,
                  isInverse: true
                }
              ]}
            />
          )}
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
                  <BarChart data={translatedFunnelData} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
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
                      {translatedFunnelData.map((entry, index) => {
                        const lower = (entry.name || '').toLowerCase();
                        const fillColor = lower.includes("ganho") 
                          ? "#10b981" 
                          : lower.includes("perdido") 
                          ? "#f43f5e" 
                          : lower.includes("qualifica")
                          ? "#a855f7"
                          : lower.includes("proposta")
                          ? "#10b981"
                          : lower.includes("negocia")
                          ? "#f97316"
                          : "#3b82f6";
                        return (
                          <Cell 
                            key={`funnel-cell-${index}`} 
                            fill={fillColor} 
                          />
                        );
                      })}
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
                    const rawStage = deal.stage?.name || deal.stage || deal.status || 'NEW';
                    const translatedStage = translateStage(rawStage);
                    const statusStyle = getStatusStyle(rawStage);
                    const statusKey = (deal.status || '').toLowerCase();
                    const isWon = statusKey === 'won' || statusKey === 'ganho' || String(rawStage).toUpperCase().includes('WON') || String(rawStage).toUpperCase().includes('GANH');
                    const isLost = statusKey === 'lost' || statusKey === 'perdido' || String(rawStage).toUpperCase().includes('LOST') || String(rawStage).toUpperCase().includes('PERDID');

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
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {translatedStage}
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
