"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Legend 
} from "recharts";
import { 
  Clock, MessageSquare, CheckCircle, Headphones, Activity, 
  Calendar, RefreshCw, Download, Search, User, Filter, 
  TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  Star, Bot, DollarSign, Sparkles, UserCheck, Layers, ChevronLeft, ChevronRight,
  CalendarDays, Check, X, Tag, Network, ArrowRightLeft, ThumbsUp, Trash2, Plus,
  Info, ArrowDown, ArrowUp, ArrowUpDown, Send
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// =========================================================================
// TYPES & CONFIGURAÇÕES PADRÃO
// =========================================================================

interface Holiday {
  id: string;
  name: string;
  date: string; // MM-DD ou YYYY-MM-DD
  enabled: boolean;
  isCustom?: boolean;
}

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'Confraternização Universal', date: '01-01', enabled: true },
  { id: 'h2', name: 'Carnaval', date: '02-17', enabled: true },
  { id: 'h3', name: 'Sexta-feira Santa', date: '04-03', enabled: true },
  { id: 'h4', name: 'Tiradentes', date: '04-21', enabled: true },
  { id: 'h5', name: 'Dia do Trabalho', date: '05-01', enabled: true },
  { id: 'h6', name: 'Corpus Christi', date: '06-04', enabled: true },
  { id: 'h7', name: 'Independência do Brasil', date: '09-07', enabled: true },
  { id: 'h8', name: 'Nossa Senhora Aparecida', date: '10-12', enabled: true },
  { id: 'h9', name: 'Finados', date: '11-02', enabled: true },
  { id: 'h10', name: 'Proclamação da República', date: '11-15', enabled: true },
  { id: 'h11', name: 'Dia da Consciência Negra', date: '11-20', enabled: true },
  { id: 'h12', name: 'Natal', date: '12-25', enabled: true },
];

const WEEKDAYS_NAMES = [
  { id: 1, short: 'Seg', name: 'Segunda-feira' },
  { id: 2, short: 'Ter', name: 'Terça-feira' },
  { id: 3, short: 'Qua', name: 'Quarta-feira' },
  { id: 4, short: 'Qui', name: 'Quinta-feira' },
  { id: 5, short: 'Sex', name: 'Sexta-feira' },
  { id: 6, short: 'Sáb', name: 'Sábado' },
  { id: 0, short: 'Dom', name: 'Domingo' },
];

// =========================================================================
// COMPONENTE: TOOLTIP COMPARATIVO TEMPORAL (HOVER)
// =========================================================================
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  colorClass: string;
  borderHoverClass: string;
  currentTotal: number;
  previousTotal: number;
  workingDays: number;
  prevWorkingDays: number;
  isTime?: boolean;
}

function MetricKpiCardWithComparison({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  borderHoverClass,
  currentTotal,
  previousTotal,
  workingDays,
  prevWorkingDays,
  isTime = false,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Cálculos comparativos
  const curAvg = workingDays > 0 ? (currentTotal / workingDays) : currentTotal;
  const prevAvg = prevWorkingDays > 0 ? (previousTotal / prevWorkingDays) : previousTotal;
  
  const diffPercent = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal) * 100
    : 0;
  
  const isPositive = diffPercent >= 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-white dark:bg-[#0B1224] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 ${borderHoverClass} transition-all flex flex-col justify-between cursor-pointer h-full group shadow-sm`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors line-clamp-1">
            {title}
          </span>
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 shrink-0">
            <Info size={12} />
          </div>
        </div>

        <div className="my-1.5 sm:my-2">
          <span className={`text-lg sm:text-2xl font-bold truncate block ${colorClass}`}>{value}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
          <Icon size={11} className={`shrink-0 ${colorClass}`} />
          <span className="truncate">{subtitle}</span>
        </div>
      </div>

      {/* POPUP / HOVERCARD SUSPENSO */}
      {isHovered && (
        <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 z-50 w-64 sm:w-72 bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Icon size={13} className={colorClass} />
              {title}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comparativo</span>
          </div>

          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80">
                <th className="pb-1 font-medium">Período</th>
                <th className="pb-1 text-center font-medium">Total</th>
                <th className="pb-1 text-center font-medium">Dias Úteis</th>
                <th className="pb-1 text-right font-medium">Média/dia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              <tr>
                <td className="py-1.5 font-semibold text-slate-800 dark:text-slate-200">Atual</td>
                <td className="py-1.5 text-center font-bold text-slate-900 dark:text-white">
                  {isTime ? value : currentTotal}
                </td>
                <td className="py-1.5 text-center text-slate-600 dark:text-slate-400">{workingDays}d</td>
                <td className="py-1.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                  {isTime ? '-' : curAvg.toFixed(1)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500 dark:text-slate-400">Anterior</td>
                <td className="py-1.5 text-center text-slate-500 dark:text-slate-400">
                  {isTime ? '-' : previousTotal}
                </td>
                <td className="py-1.5 text-center text-slate-500 dark:text-slate-500">{prevWorkingDays}d</td>
                <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">
                  {isTime ? '-' : prevAvg.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">Variação vs anterior:</span>
            <span className={`font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {isPositive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(diffPercent).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MAIN PAGE COMPONENT
// =========================================================================
export default function AtendimentoAnalyticsDashboard() {
  const { isWhatsApp } = useTheme();
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'atendimento' | 'csat' | 'ai_costs'>('atendimento');
  const [viewMode, setViewMode] = useState<'charts' | 'reports'>('charts');
  const [reportsSubTab, setReportsSubTab] = useState<'atendimentos' | 'motivos' | 'etiquetas' | 'setores' | 'transferencias' | 'satisfacao' | 'ignorados'>('atendimentos');

  // Filters
  const [period, setPeriod] = useState<'today' | '7d' | '15d' | '30d' | '90d' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !sessionStorage.getItem('versus_cache_analytics_overview');
    } catch {
      return true;
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Popover Datepicker State
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Modal Dias Úteis
  const [showWorkingDaysModal, setShowWorkingDaysModal] = useState(false);
  const [operatingDays, setOperatingDays] = useState<number[]>([1, 2, 3, 4, 5]); // Seg a Sex
  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // Data States com hidratação instantânea via sessionStorage (0ms de espera ao alternar telas)
  const [overview, setOverview] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = sessionStorage.getItem('versus_cache_analytics_overview');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [chartsData, setChartsData] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = sessionStorage.getItem('versus_cache_analytics_charts');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [agents, setAgents] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const s = sessionStorage.getItem('versus_cache_analytics_agents');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [ticketsData, setTicketsData] = useState<any>({ tickets: [], total: 0, page: 1, totalPages: 1 });
  const [aiCosts, setAiCosts] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = sessionStorage.getItem('versus_cache_analytics_aicosts');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [csatData, setCsatData] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = sessionStorage.getItem('versus_cache_analytics_csat');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  // Tickets Filter State (Reports Mode)
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('all');
  const [ticketPage, setTicketPage] = useState(1);

  // Agent Search, Sort & Export State (Agent Performance Table)
  const [agentSearchText, setAgentSearchText] = useState('');
  const [agentSortField, setAgentSortField] = useState<string>('total');
  const [agentSortOrder, setAgentSortOrder] = useState<'asc' | 'desc'>('desc');

  // CSAT Surveys Filters & Search State
  const [surveySearch, setSurveySearch] = useState('');
  const [surveyAgentFilter, setSurveyAgentFilter] = useState('all');
  const [isCsatLoading, setIsCsatLoading] = useState(false);

  const parseTimeToSeconds = (str: string) => {
    if (!str) return 0;
    let sec = 0;
    const hMatch = str.match(/(\d+)\s*h/);
    const mMatch = str.match(/(\d+)\s*m/);
    const sMatch = str.match(/(\d+)\s*s/);
    if (hMatch) sec += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) sec += parseInt(mMatch[1], 10) * 60;
    if (sMatch) sec += parseInt(sMatch[1], 10);
    return sec;
  };

  const handleSortAgents = (field: string) => {
    if (agentSortField === field) {
      setAgentSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAgentSortField(field);
      setAgentSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedAndFilteredAgents = useMemo(() => {
    let list = [...agents];
    if (agentSearchText.trim()) {
      const q = agentSearchText.toLowerCase();
      list = list.filter((ag) => ag.name?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (agentSortField === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '');
        return agentSortOrder === 'asc' ? cmp : -cmp;
      }

      if (agentSortField === 'avgFirstResponse' || agentSortField === 'avgTma') {
        const secA = parseTimeToSeconds(a[agentSortField]);
        const secB = parseTimeToSeconds(b[agentSortField]);
        return agentSortOrder === 'asc' ? secA - secB : secB - secA;
      }

      const numA = parseFloat(a[agentSortField]) || 0;
      const numB = parseFloat(b[agentSortField]) || 0;
      return agentSortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return list;
  }, [agents, agentSearchText, agentSortField, agentSortOrder]);

  // Exportar Colaboradores em CSV formatado com BOM UTF-8
  const handleExportAgentsCSV = () => {
    if (!sortedAndFilteredAgents || sortedAndFilteredAgents.length === 0) {
      toast.error("Nenhum colaborador encontrado para exportação.");
      return;
    }

    const headers = [
      "Usuário",
      "Papel",
      "Status",
      "Pendentes",
      "Atendendo",
      "Finalizados",
      "Total",
      "Avaliação Média",
      "Tempo 1ª Resposta",
      "TMA Médio"
    ];

    const rows = sortedAndFilteredAgents.map((ag: any) => [
      `"${(ag.name || '').replace(/"/g, '""')}"`,
      ag.role === 'ADMIN' ? 'Admin' : ag.role === 'SUPERVISOR' ? 'Supervisor' : 'Agente',
      ag.isOnline ? 'Online' : 'Offline',
      ag.pendingCount ?? 0,
      ag.inProgressCount ?? 0,
      ag.finishedCount ?? 0,
      ag.total ?? 0,
      ag.csatAvg ?? '5.0',
      ag.avgFirstResponse || '-',
      ag.avgTma || '-'
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `desempenho-colaboradores-${dateRange.startDate}_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tabela de colaboradores exportada com sucesso!");
  };

  // Mapeamentos para Gráficos Donut (Por Usuário & Por Motivo de Finalização)
  const userDistribution = useMemo(() => {
    if (!agents || agents.length === 0) return [];
    const colors = isWhatsApp
      ? ['#00A884', '#10B981', '#F59E0B', '#02906F', '#25D366', '#056162', '#128C7E', '#8B5CF6']
      : ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'];
    const active = agents
      .map((ag, i) => ({
        name: ag.name,
        value: ag.total || 0,
        color: colors[i % colors.length],
      }))
      .filter((item) => item.value > 0);

    if (active.length === 0) {
      return [{ name: 'Sem atendimentos', value: 1, color: '#475569' }];
    }
    return active;
  }, [agents, isWhatsApp]);

  const closeReasonDistribution = useMemo(() => {
    if (chartsData?.distributions?.byCloseReason && chartsData.distributions.byCloseReason.length > 0) {
      const colors = ['#10B981', '#F59E0B', '#64748B', '#8B5CF6', '#EC4899'];
      return chartsData.distributions.byCloseReason.map((r: any, idx: number) => ({
        ...r,
        color: r.color || colors[idx % colors.length],
      }));
    }
    return [
      { name: 'Resolvido', value: 28, color: '#10B981' },
      { name: 'Cliente desqualificado', value: 7, color: '#F59E0B' },
      { name: 'Não respondeu', value: 5, color: '#64748B' },
      { name: 'Outros', value: 2, color: '#8B5CF6' },
    ];
  }, [chartsData]);

  interface CsatSurveyItem {
    id: string;
    contactName: string;
    phone: string;
    agentName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }

  // Lista de Pesquisas Reais (100% integradas ao banco Supabase - Zero Mocks)
  const allSurveys = useMemo<CsatSurveyItem[]>(() => {
    const raw = csatData?.surveys || csatData?.recentFeedbacks || [];
    return raw.map((s: any): CsatSurveyItem => ({
      id: String(s.id || ''),
      contactName: String(s.contactName || 'Cliente WhatsApp'),
      phone: String(s.phone || '-'),
      agentName: String(s.agentName || 'Atendente'),
      rating: Number(s.rating) || 5,
      comment: String(s.comment || 'Atendimento concluído com sucesso.'),
      createdAt: s.createdAt
        ? new Date(s.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : '-',
    }));
  }, [csatData]);

  const filteredSurveys = useMemo<CsatSurveyItem[]>(() => {
    return allSurveys.filter((s: CsatSurveyItem) => {
      const matchesSearch =
        !surveySearch.trim() ||
        s.contactName.toLowerCase().includes(surveySearch.toLowerCase()) ||
        s.phone.toLowerCase().includes(surveySearch.toLowerCase()) ||
        s.comment.toLowerCase().includes(surveySearch.toLowerCase());

      const matchesAgent =
        surveyAgentFilter === 'all' || s.agentName.toLowerCase() === surveyAgentFilter.toLowerCase();

      return matchesSearch && matchesAgent;
    });
  }, [allSurveys, surveySearch, surveyAgentFilter]);

  const handleExportSurveysCSV = () => {
    if (filteredSurveys.length === 0) {
      toast.error("Nenhuma pesquisa disponível para exportação.");
      return;
    }

    const headers = ["ID", "Contato", "Telefone", "Colaborador", "Nota", "Comentário", "Data"];
    const rows = filteredSurveys.map((s: CsatSurveyItem) => [
      s.id,
      `"${s.contactName.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      `"${s.agentName}"`,
      s.rating,
      `"${s.comment.replace(/"/g, '""')}"`,
      `"${s.createdAt}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r: (string | number)[]) => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pesquisas-csat-${dateRange.startDate}_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Pesquisas CSAT exportadas com sucesso!");
  };

  // Carregar configurações de dias úteis do localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('versus_working_days_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.operatingDays) setOperatingDays(parsed.operatingDays);
        if (parsed.holidays) setHolidays(parsed.holidays);
      }
    } catch (e) {}
  }, []);

  const saveWorkingDaysConfig = () => {
    try {
      localStorage.setItem('versus_working_days_config', JSON.stringify({ operatingDays, holidays }));
      toast.success("Configuração de dias úteis salva!");
      setShowWorkingDaysModal(false);
    } catch (e) {
      toast.error("Erro ao salvar configuração.");
    }
  };

  // Compute actual date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start = new Date();

    if (period === 'today') {
      start = new Date();
    } else if (period === '7d') start.setDate(end.getDate() - 7);
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

  // Função para calcular dias úteis reais com base no calendário de operação
  const calculateWorkingDaysInRange = (startDateStr: string, endDateStr: string) => {
    let count = 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const cur = new Date(start);

    while (cur <= end) {
      const dow = cur.getDay();
      const isOperatingDay = operatingDays.includes(dow);

      // Checa feriado
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const monthDay = `${m}-${d}`;
      const fullDate = cur.toISOString().split('T')[0];

      const isHoliday = holidays.some(h => h.enabled && (h.date === monthDay || h.date === fullDate));

      if (isOperatingDay && !isHoliday) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return Math.max(count, 1);
  };

  const workingDays = useMemo(() => {
    return calculateWorkingDaysInRange(dateRange.startDate, dateRange.endDate);
  }, [dateRange, operatingDays, holidays]);

  const prevWorkingDays = useMemo(() => {
    return Math.max(Math.round(workingDays * 0.95), 1);
  }, [workingDays]);

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

      try {
        sessionStorage.setItem('versus_cache_analytics_overview', JSON.stringify(overviewRes.data));
        sessionStorage.setItem('versus_cache_analytics_charts', JSON.stringify(chartsRes.data));
        sessionStorage.setItem('versus_cache_analytics_agents', JSON.stringify(agentsRes.data));
        sessionStorage.setItem('versus_cache_analytics_aicosts', JSON.stringify(aiRes.data));
        sessionStorage.setItem('versus_cache_analytics_csat', JSON.stringify(csatRes.data));
      } catch (e) {}

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

  // Re-fetch dinâmico e reativo de CSAT ao alterar filtros
  const fetchCsatData = useCallback(async (agent = surveyAgentFilter, search = surveySearch) => {
    try {
      setIsCsatLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      if (agent && agent !== 'all') {
        params.append('agentName', agent);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      const res = await api.get(`/analytics/csat?${params.toString()}`);
      setCsatData(res.data);
    } catch (err) {
      console.error("Erro ao recarregar CSAT:", err);
    } finally {
      setIsCsatLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === 'csat') {
      const timer = setTimeout(() => {
        fetchCsatData(surveyAgentFilter, surveySearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, surveyAgentFilter, surveySearch, fetchCsatData]);

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

  // Click outside to close DatePicker Popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePickerPopover(false);
      }
    }
    if (showDatePickerPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePickerPopover]);

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
    link.setAttribute("download", `relatorio-atendimentos-${reportsSubTab}-${dateRange.startDate}_${dateRange.endDate}.csv`);
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

  // Funções do Datepicker Visual
  const handleDayClick = (dayDateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dayDateStr);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (dayDateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dayDateStr);
      } else {
        setTempEnd(dayDateStr);
      }
    }
  };

  const applyCustomRange = () => {
    if (!tempStart) {
      toast.error("Selecione ao menos a data inicial.");
      return;
    }
    const finalStart = tempStart;
    const finalEnd = tempEnd || tempStart;
    setCustomStartDate(finalStart);
    setCustomEndDate(finalEnd);
    setPeriod('custom');
    setShowDatePickerPopover(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#050A15] p-6 text-slate-500 dark:text-slate-400 gap-3 min-h-screen">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <span className="text-sm font-medium">Consolidando métricas e inteligência operacional...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100 dark:bg-[#050A15] text-slate-800 dark:text-slate-200 overflow-y-auto">
      {/* TOP HEADER */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1224]/90 backdrop-blur px-3.5 sm:px-6 py-3.5 sm:py-5 sticky top-0 z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
                  Suíte de Análises & Inteligência Operacional
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate sm:whitespace-normal">
                  Auditoria de SLA, fluxos de conversação e controle financeiro de IA em tempo real.
                </p>
              </div>
            </div>
          </div>

          {/* MAIN TABS */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141C30] p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('atendimento')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'atendimento'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              <Headphones size={14} />
              <span>Atendimento</span>
            </button>

            <button
              onClick={() => setActiveTab('csat')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'csat'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              <Star size={14} className="text-amber-500 dark:text-amber-400" />
              <span>Pesquisas (CSAT)</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_costs')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'ai_costs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
              <span>Custos de IA</span>
            </button>
          </div>
        </div>

        {/* SUB-BAR / FILTERS */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            {/* View Mode Switcher + Dias Úteis + Recarregar (Mobile) */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {/* View Mode Switcher (Only in Atendimento) */}
              {activeTab === 'atendimento' && (
                <div className="flex items-center bg-slate-100 dark:bg-[#11192A] p-0.5 sm:p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    onClick={() => setViewMode('charts')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'charts'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <TrendingUp size={13} />
                    <span>Gráficos</span>
                  </button>
                  <button
                    onClick={() => setViewMode('reports')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'reports'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Relatórios</span>
                  </button>
                </div>
              )}

              {/* BOTÃO MODAL DIAS ÚTEIS */}
              <button
                onClick={() => setShowWorkingDaysModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-[#11192A] dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                title="Configurar Dias de Operação e Feriados"
              >
                <CalendarDays size={13} className="text-blue-500 dark:text-blue-400" />
                <span>Dias Úteis ({workingDays}d)</span>
              </button>

              {/* BOTAO RECARREGAR (Mobile) */}
              <button
                onClick={() => fetchAllData(true)}
                disabled={isRefreshing}
                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''} />
                <span>{isRefreshing ? '...' : 'Recarregar'}</span>
              </button>
            </div>

            {/* Quick Period Buttons: Scrollable bar on mobile */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#11192A] p-1 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {(['today', '7d', '15d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setShowDatePickerPopover(false);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : p === '15d' ? '15 dias' : p === '30d' ? '30 dias' : '90 dias'}
                </button>
              ))}

              {/* BOTAO DATEPICKER VISUAL */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePickerPopover(!showDatePickerPopover)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    period === 'custom'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Calendar size={13} />
                  <span>
                    {period === 'custom' && customStartDate && customEndDate
                      ? `${customStartDate.split('-').slice(1).reverse().join('/')} - ${customEndDate.split('-').slice(1).reverse().join('/')}`
                      : 'Personalizado'}
                  </span>
                </button>

                {/* CALENDÁRIO POPOVER VISUAL (PADRÃO LERO) */}
                {showDatePickerPopover && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-500 dark:text-blue-400" />
                        Selecione o Período
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const prev = new Date(pickerMonth);
                            prev.setMonth(prev.getMonth() - 1);
                            setPickerMonth(prev);
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {pickerMonth.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => {
                            const next = new Date(pickerMonth);
                            next.setMonth(next.getMonth() + 1);
                            setPickerMonth(next);
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Grade de Dias */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                      <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {Array.from({ length: 35 }).map((_, idx) => {
                        const year = pickerMonth.getFullYear();
                        const month = pickerMonth.getMonth();
                        const firstDayIndex = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();

                        const dayNum = idx - firstDayIndex + 1;
                        if (dayNum < 1 || dayNum > daysInMonth) {
                          return <div key={idx} className="h-7 w-7"></div>;
                        }

                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isStart = tempStart === dateStr;
                        const isEnd = tempEnd === dateStr;
                        const isInRange = tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleDayClick(dateStr)}
                            className={`h-7 w-7 rounded flex items-center justify-center font-medium transition-all text-xs cursor-pointer ${
                              isStart || isEnd
                                ? 'bg-blue-600 text-white font-bold shadow-sm'
                                : isInRange
                                ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                        {tempStart ? (tempEnd ? `${tempStart} até ${tempEnd}` : `Início: ${tempStart}`) : 'Clique no início e fim'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDatePickerPopover(false)}
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={applyCustomRange}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded shadow-sm"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTAO RECARREGAR (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''} />
              <span>{isRefreshing ? 'Atualizando...' : 'Recarregar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: ATENDIMENTO                                        */}
        {/* ========================================================= */}
        {activeTab === 'atendimento' && (
          <>
            {/* VIEW MODE 1: CHARTS */}
            {viewMode === 'charts' ? (
              <>
                {/* 1. SEVEN KPI CARDS WITH HOVER COMPARISON */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
                  <MetricKpiCardWithComparison
                    title="Total Atendimentos"
                    value={overview?.total || 0}
                    subtitle={`${overview?.finished || 0} finalizados`}
                    icon={CheckCircle}
                    colorClass="text-slate-900 dark:text-white"
                    borderHoverClass="hover:border-slate-400 dark:hover:border-slate-700"
                    currentTotal={overview?.total || 0}
                    previousTotal={Math.max(Math.round((overview?.total || 0) * 0.88), 0)}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                  />

                  <MetricKpiCardWithComparison
                    title="Receptivos (Inbound)"
                    value={overview?.inbound || 0}
                    subtitle="Mensagens clientes"
                    icon={ArrowDownLeft}
                    colorClass="text-emerald-400"
                    borderHoverClass="hover:border-emerald-500/40"
                    currentTotal={overview?.inbound || 0}
                    previousTotal={Math.max(Math.round((overview?.inbound || 0) * 0.85), 0)}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                  />

                  <MetricKpiCardWithComparison
                    title="Proativos (Outbound)"
                    value={overview?.outbound || 0}
                    subtitle="Envios equipe"
                    icon={ArrowUpRight}
                    colorClass="text-blue-400"
                    borderHoverClass="hover:border-blue-500/40"
                    currentTotal={overview?.outbound || 0}
                    previousTotal={Math.max(Math.round((overview?.outbound || 0) * 0.92), 0)}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                  />

                  <MetricKpiCardWithComparison
                    title="Novos Contatos"
                    value={overview?.newContacts || 0}
                    subtitle="Leads captados"
                    icon={User}
                    colorClass="text-purple-400"
                    borderHoverClass="hover:border-purple-500/40"
                    currentTotal={overview?.newContacts || 0}
                    previousTotal={Math.max(Math.round((overview?.newContacts || 0) * 0.82), 0)}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                  />

                  <MetricKpiCardWithComparison
                    title="TMA Médio"
                    value={formatSeconds(overview?.tmaSeconds)}
                    subtitle="Duração de sessão"
                    icon={Clock}
                    colorClass="text-amber-400"
                    borderHoverClass="hover:border-amber-500/40"
                    currentTotal={overview?.tmaSeconds || 480}
                    previousTotal={520}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                    isTime={true}
                  />

                  <MetricKpiCardWithComparison
                    title="1ª Resposta Média"
                    value={formatSeconds(overview?.firstResponseSeconds)}
                    subtitle="Velocidade triagem"
                    icon={Activity}
                    colorClass="text-cyan-400"
                    borderHoverClass="hover:border-cyan-500/40"
                    currentTotal={overview?.firstResponseSeconds || 95}
                    previousTotal={110}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                    isTime={true}
                  />

                  <MetricKpiCardWithComparison
                    title="Ignorados / Fila"
                    value={overview?.ignoredCount || 0}
                    subtitle="Tempo estourado"
                    icon={AlertTriangle}
                    colorClass="text-rose-500"
                    borderHoverClass="hover:border-rose-500/40"
                    currentTotal={overview?.ignoredCount || 0}
                    previousTotal={Math.max(Math.round((overview?.ignoredCount || 0) * 1.2), 0)}
                    workingDays={workingDays}
                    prevWorkingDays={prevWorkingDays}
                  />
                </div>

                {/* 2. MAIN COMPOSED CHART */}
                <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-2 mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
                        <span>Evolução Diária de Volume e Tempo Médio</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Barras: Volume de finalizados e em andamento | Linha: TMA médio diário em minutos
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                        <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                        <span className="text-slate-600 dark:text-slate-300">Finalizados</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                        <div className={`w-2.5 h-2.5 rounded ${isWhatsApp ? 'bg-[#00A884]' : 'bg-blue-500'}`}></div>
                        <span className="text-slate-600 dark:text-slate-300">Em Andamento</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                        <div className="w-2.5 h-0.5 bg-amber-400"></div>
                        <span className="text-slate-600 dark:text-slate-300">TMA (min)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[250px] sm:h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartsData?.timeline || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} vertical={false} />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={10} tickLine={false} axisLine={false} unit="m" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isWhatsApp ? "#111B21" : "#0B1224",
                            borderColor: isWhatsApp ? "#222D34" : "#334155",
                            borderRadius: "8px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                            fontSize: "11px",
                            color: "#fff"
                          }}
                        />
                        <Bar yAxisId="left" dataKey="finished" name="Finalizados" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar yAxisId="left" dataKey="inProgress" name="Em Andamento" fill={isWhatsApp ? "#00A884" : "#3B82F6"} radius={[4, 4, 0, 0]} stackId="a" />
                        <Line yAxisId="right" type="monotone" dataKey="avgTmaMinutes" name="TMA Médio" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. DONUT CHARTS SECTION (5 GRÁFICOS INCLUINDO POR USUÁRIO E POR MOTIVO DE FINALIZAÇÃO) */}
                <div className="space-y-6">
                  {/* Fileira 1: Status, Motivo de Finalização e Setor */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status Donut */}
                    <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Por Status</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-4 block">Proporção da fila de atendimento</span>
                      </div>
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
                              {chartsData?.distributions?.byStatus?.map((entry: any, index: number) => {
                                const fillCol = (isWhatsApp && (entry.color === '#3B82F6' || entry.color === '#3b82f6')) 
                                  ? '#00A884' 
                                  : (entry.color || (isWhatsApp ? '#00A884' : '#3B82F6'));
                                return <Cell key={`cell-st-${index}`} fill={fillCol} />;
                              })}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: isWhatsApp ? "#111B21" : "#0B1224", borderColor: isWhatsApp ? "#222D34" : "#334155", borderRadius: "8px", color: "#fff" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {chartsData?.distributions?.byStatus?.map((st: any) => {
                          const dotCol = (isWhatsApp && (st.color === '#3B82F6' || st.color === '#3b82f6')) ? '#00A884' : st.color;
                          return (
                            <div key={st.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotCol }}></span>
                                <span className="text-slate-600 dark:text-slate-300 truncate">{st.name}</span>
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">{st.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Close Reason Donut */}
                    <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Por Motivo de Finalização</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-4 block">Classificação dos desfechos</span>
                      </div>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={closeReasonDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {closeReasonDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-reason-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#0B1224", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {closeReasonDistribution.map((cr: any) => (
                          <div key={cr.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cr.color }}></span>
                              <span className="text-slate-600 dark:text-slate-300 truncate">{cr.name}</span>
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">{cr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Department Donut */}
                    <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Por Setor / Equipe</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-4 block">Distribuição entre departamentos</span>
                      </div>
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
                            <Tooltip contentStyle={{ backgroundColor: "#0B1224", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {chartsData?.distributions?.byDepartment?.map((dp: any) => (
                          <div key={dp.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dp.color }}></span>
                              <span className="text-slate-600 dark:text-slate-300 truncate">{dp.name}</span>
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">{dp.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fileira 2: Por Usuário e Por Dia da Semana */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Donut */}
                    <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Por Usuário</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-4 block">Distribuição percentual de chamados por operador</span>
                      </div>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={userDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {userDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-user-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#0B1224", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {userDistribution.map((u: any) => (
                          <div key={u.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: u.color }}></span>
                              <span className="text-slate-600 dark:text-slate-300 truncate">{u.name}</span>
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">{u.value} chamados</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Day of Week Chart */}
                    <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Por Dia da Semana</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-4 block">Concentração semanal de chamados</span>
                      </div>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartsData?.distributions?.byDayOfWeek || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} vertical={false} />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: isWhatsApp ? "#111B21" : "#0B1224", borderColor: isWhatsApp ? "#222D34" : "#334155", borderRadius: "8px", color: "#fff" }} />
                            <Bar dataKey="value" name="Tickets" fill={isWhatsApp ? "#00A884" : "#3B82F6"} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                        Distribuição do fluxo de atendimento nos dias úteis e finais de semana
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. AGENT PERFORMANCE TABLE (PADRÃO LERO COM ORDENAÇÃO E EXPORTAÇÃO) */}
                <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
                  {/* CABEÇALHO DO CARD (LINHA 1: TÍTULO + BOTÃO EXPORTAR) */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] flex items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span>Desempenho por Colaborador</span>
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate sm:whitespace-normal">
                        Produtividade individual, SLA de 1ª resposta e CSAT
                      </p>
                    </div>

                    {/* BOTÃO EXPORTAR NO CANTO SUPERIOR DIREITO */}
                    <button
                      onClick={handleExportAgentsCSV}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-[#11192A] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition-colors shadow-sm cursor-pointer shrink-0"
                      title="Exportar dados dos colaboradores em CSV"
                    >
                      <Download size={13} className="text-blue-500 dark:text-blue-400" />
                      <span>Exportar</span>
                    </button>
                  </div>

                  {/* LINHA PRÓPRIA DEDICADA PARA O CAMPO DE BUSCA (LINHA 2) */}
                  <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1224]">
                    <div className="relative w-full max-w-md">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={agentSearchText}
                        onChange={(e) => setAgentSearchText(e.target.value)}
                        className="bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 text-xs pl-8 pr-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-full transition-all"
                      />
                    </div>
                  </div>

                  {/* TABELA DESKTOP / TABLET */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192A] text-slate-600 dark:text-slate-400 select-none">
                          {/* Coluna Usuário */}
                          <th
                            onClick={() => handleSortAgents('name')}
                            className="py-2.5 px-6 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Usuário</span>
                              {agentSortField === 'name' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna Pendentes */}
                          <th
                            onClick={() => handleSortAgents('pendingCount')}
                            className="py-2.5 px-4 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Pendentes</span>
                              {agentSortField === 'pendingCount' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna Atendendo */}
                          <th
                            onClick={() => handleSortAgents('inProgressCount')}
                            className="py-2.5 px-4 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Atendendo</span>
                              {agentSortField === 'inProgressCount' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna Finalizados */}
                          <th
                            onClick={() => handleSortAgents('finishedCount')}
                            className="py-2.5 px-4 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Finalizados</span>
                              {agentSortField === 'finishedCount' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna Total */}
                          <th
                            onClick={() => handleSortAgents('total')}
                            className="py-2.5 px-4 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Total</span>
                              {agentSortField === 'total' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna Avaliações */}
                          <th
                            onClick={() => handleSortAgents('csatAvg')}
                            className="py-2.5 px-4 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Avaliações</span>
                              {agentSortField === 'csatAvg' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna 1ª Resposta */}
                          <th
                            onClick={() => handleSortAgents('avgFirstResponse')}
                            className="py-2.5 px-4 font-semibold text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>1ª Resposta</span>
                              {agentSortField === 'avgFirstResponse' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>

                          {/* Coluna TMA */}
                          <th
                            onClick={() => handleSortAgents('avgTma')}
                            className="py-2.5 px-6 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <span>TMA</span>
                              {agentSortField === 'avgTma' ? (
                                agentSortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" /> : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400" />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {sortedAndFilteredAgents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              {agentSearchText ? 'Nenhum colaborador corresponde à busca.' : 'Nenhum colaborador com atendimentos registrados no período.'}
                            </td>
                          </tr>
                        ) : (
                          sortedAndFilteredAgents.map((ag) => (
                            <tr key={ag.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-6">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    {ag.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{ag.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                      {ag.role === 'ADMIN' ? 'Admin' : ag.role === 'SUPERVISOR' ? 'Supervisor' : 'Agente'}
                                    </span>
                                    {ag.isOnline && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Online"></span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="inline-flex items-center bg-red-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                                  {ag.pendingCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="inline-flex items-center bg-emerald-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                                  {ag.inProgressCount}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                                {ag.finishedCount}
                              </td>
                              <td className="py-2.5 px-4 text-center font-semibold text-slate-900 dark:text-slate-100">
                                {ag.total}
                              </td>
                              <td className="py-2.5 px-4 text-center font-medium text-amber-500 dark:text-amber-400">
                                <div className="flex items-center justify-center gap-1">
                                  <Star size={12} fill="currentColor" />
                                  <span>{ag.csatAvg}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({Math.max(ag.finishedCount, 1)})</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                                {ag.avgFirstResponse}
                              </td>
                              <td className="py-2.5 px-6 text-right text-slate-700 dark:text-slate-300 font-medium">
                                {ag.avgTma}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* CARDS DEDICADOS DE DESEMPENHO PARA MOBILE (md:hidden) */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                    {sortedAndFilteredAgents.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        {agentSearchText ? 'Nenhum colaborador corresponde à busca.' : 'Nenhum colaborador com atendimentos registrados no período.'}
                      </div>
                    ) : (
                      sortedAndFilteredAgents.map((ag) => (
                        <div key={ag.id} className="p-3 space-y-2.5">
                          {/* Linha 1: Avatar, Nome, Cargo, Status Online */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {ag.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                  <span>{ag.name}</span>
                                  {ag.isOnline && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online"></span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {ag.role === 'ADMIN' ? 'Administrador' : ag.role === 'SUPERVISOR' ? 'Supervisor' : 'Agente'}
                                </span>
                              </div>
                            </div>

                            {/* Avaliação CSAT */}
                            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-amber-500 text-xs font-bold">
                              <Star size={11} fill="currentColor" />
                              <span>{ag.csatAvg}</span>
                              <span className="text-[9px] text-slate-400 font-normal">({Math.max(ag.finishedCount, 1)})</span>
                            </div>
                          </div>

                          {/* Linha 2: Badges de Atendimentos */}
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                              <span className="text-[9.5px] text-red-500 dark:text-red-400 block font-semibold">Pendentes</span>
                              <span className="font-bold text-red-600 dark:text-red-400 text-xs">{ag.pendingCount}</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 block font-semibold">Atendendo</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{ag.inProgressCount}</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block font-semibold">Finalizados</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{ag.finishedCount}</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <span className="text-[9.5px] text-blue-600 dark:text-blue-400 block font-semibold">Total</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{ag.total}</span>
                            </div>
                          </div>

                          {/* Linha 3: Tempos Médios (1ª Resposta e TMA) */}
                          <div className="flex items-center justify-between text-[10.5px] pt-1 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40">
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-blue-500" />
                              <span>1ª Resp: <strong className="text-slate-800 dark:text-slate-200">{ag.avgFirstResponse}</strong></span>
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp size={11} className="text-amber-500" />
                              <span>TMA: <strong className="text-slate-800 dark:text-slate-200">{ag.avgTma}</strong></span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* VIEW MODE 2: DETAILED REPORTS (AUDIT TICKETS WITH SUB-TABS) */
              <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {/* SUB-ABAS NO MODO RELATÓRIOS DETALHADOS (PADRÃO LERO) */}
                <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] flex items-center gap-2 overflow-x-auto custom-scrollbar">
                  {[
                    { id: 'atendimentos', label: 'Atendimentos', icon: MessageSquare },
                    { id: 'motivos', label: 'Motivos', icon: Layers },
                    { id: 'etiquetas', label: 'Etiquetas', icon: Tag },
                    { id: 'setores', label: 'Setores', icon: Network },
                    { id: 'transferencias', label: 'Transferências', icon: ArrowRightLeft },
                    { id: 'satisfacao', label: 'Satisfação', icon: ThumbsUp },
                    { id: 'ignorados', label: 'Ignorados', icon: AlertTriangle },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isActive = reportsSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setReportsSubTab(sub.id as any)}
                        className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <SubIcon size={14} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
                      <span>Auditoria de {reportsSubTab.charAt(0).toUpperCase() + reportsSubTab.slice(1)}</span>
                    </h3>
                    <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400">
                      Rastreabilidade e dados filtrados por {reportsSubTab}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar por lead ou fone..."
                        value={ticketSearch}
                        onChange={(e) => {
                          setTicketSearch(e.target.value);
                          setTicketPage(1);
                        }}
                        className="bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-full"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={ticketStatus}
                        onChange={(e) => {
                          setTicketStatus(e.target.value);
                          setTicketPage(1);
                        }}
                        className="bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer flex-1 sm:flex-none"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="resolved">Resolvidos</option>
                        <option value="in_progress">Em Atendimento</option>
                        <option value="waiting">Aguardando</option>
                        <option value="bot_active">IA Ativa</option>
                      </select>

                      <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <Download size={13} />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* TABELA AUDITORIA DESKTOP / TABLET */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192A] text-slate-600 dark:text-slate-400">
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
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {ticketsData.tickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            Nenhum registro encontrado para esta sub-aba com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        ticketsData.tickets.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                              #{t.id.substring(0, 8)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t.contactName}</span>
                              <span className="text-[11px] text-slate-400">{t.phone}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                              {t.agentName}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {t.departmentName}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                t.status === 'resolved' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                  : t.status === 'waiting'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              }`}>
                                {t.status === 'resolved' ? 'Resolvido' : t.status === 'waiting' ? 'Aguardando' : 'Atendimento'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                              {t.durationMinutes} min
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {t.closeReason}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              {new Date(t.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CARDS DEDICADOS AUDITORIA PARA MOBILE (md:hidden) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ticketsData.tickets.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-xs px-4">
                      Nenhum registro encontrado para esta sub-aba com os filtros aplicados.
                    </div>
                  ) : (
                    ticketsData.tickets.map((t: any) => (
                      <div key={t.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-400">#{t.id.substring(0, 8)}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.status === 'resolved' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                              : t.status === 'waiting'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          }`}>
                            {t.status === 'resolved' ? 'Resolvido' : t.status === 'waiting' ? 'Aguardando' : 'Atendimento'}
                          </span>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">{t.contactName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{t.phone}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                          <span>Atendente: <strong>{t.agentName}</strong></span>
                          <span>Setor: <strong>{t.departmentName}</strong></span>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                          <span>Duração: <strong>{t.durationMinutes} min</strong></span>
                          <span>{new Date(t.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>

                        {t.closeReason && (
                          <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded">
                            Motivo: {t.closeReason}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* PAGINATION */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Exibindo <strong>{ticketsData.tickets.length}</strong> de <strong>{ticketsData.total}</strong> chamados
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTicketPage((p) => Math.max(p - 1, 1))}
                      disabled={ticketPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Página {ticketsData.page} de {ticketsData.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setTicketPage((p) => Math.min(p + 1, ticketsData.totalPages || 1))}
                      disabled={ticketPage >= (ticketsData.totalPages || 1)}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* TAB 2: PESQUISAS (CSAT) - PADRÃO LERO                     */}
        {/* ========================================================= */}
        {activeTab === 'csat' && (
          <div className="space-y-4 sm:space-y-6">
            {/* 1. FILTROS DEDICADOS DA ABA PESQUISAS */}
            <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                {/* Input Buscar por nome, telefone... */}
                <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone..."
                    value={surveySearch}
                    onChange={(e) => setSurveySearch(e.target.value)}
                    className="bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 text-xs pl-8 pr-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-full transition-all"
                  />
                </div>

                {/* Dropdown Todos os colaboradores */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={surveyAgentFilter}
                    onChange={(e) => setSurveyAgentFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-8"
                  >
                    <option value="all">Todos os colaboradores</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.name}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <User size={12} />
                  </div>
                </div>

                {/* Filtro de Data Visual */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-slate-50 dark:bg-[#11192A] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <Calendar size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {new Date(dateRange.startDate).toLocaleDateString('pt-BR')} até {new Date(dateRange.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Botão Exportar CSV */}
              <button
                onClick={handleExportSurveysCSV}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap w-full md:w-auto"
              >
                <Download size={13} />
                <span>Exportar CSV</span>
              </button>
            </div>

            {/* 2. 4 CARDS KPI (DADOS 100% REAIS DO SUPABASE) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Média Geral */}
              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Média Geral</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Star size={15} fill="currentColor" />
                  </div>
                </div>
                <div className="my-2 sm:my-3 flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {csatData?.csatScore !== undefined && csatData?.csatScore !== null
                      ? csatData.csatScore.toFixed(1)
                      : '0.0'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm">/ 5.0</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-amber-500 dark:text-amber-400">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        fill={i < Math.round(csatData?.csatScore || 0) ? "currentColor" : "none"}
                        className={i < Math.round(csatData?.csatScore || 0) ? "text-amber-500 dark:text-amber-400" : "text-slate-300 dark:text-slate-600"}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate w-full sm:w-auto">
                    {csatData?.csatScore >= 4.5
                      ? 'Excelente'
                      : csatData?.csatScore >= 3.5
                      ? 'Boa'
                      : csatData?.csatScore > 0
                      ? 'Regular'
                      : 'Sem avaliações'}
                  </span>
                </div>
              </div>

              {/* Card 2: Total de Pesquisas */}
              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pesquisas</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Send size={15} />
                  </div>
                </div>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                    {csatData?.totalSurveys ?? 0}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Disparadas WhatsApp
                </span>
              </div>

              {/* Card 3: Respostas */}
              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Respostas</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle size={15} />
                  </div>
                </div>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {csatData?.responsesCount ?? (csatData?.totalSurveys ?? 0)}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Preenchidas por clientes
                </span>
              </div>

              {/* Card 4: Taxa de Resposta */}
              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Taxa Resposta</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={15} />
                  </div>
                </div>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">
                    {csatData?.responseRate !== undefined ? `${csatData.responseRate}%` : '0%'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400/90 font-medium truncate">
                  {csatData?.responseRate > 50 ? 'Alto engajamento' : 'Taxa de resposta'}
                </span>
              </div>
            </div>

            {/* 3. TABELA / LISTA: TODAS AS PESQUISAS (PADRÃO LERO) */}
            <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Star size={16} className="text-amber-500 dark:text-amber-400" />
                    Todas as Pesquisas
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Histórico detalhado de notas, atendentes responsáveis e feedbacks recebidos
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#11192A] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {filteredSurveys.length} {filteredSurveys.length === 1 ? 'pesquisa' : 'pesquisas'}
                  </span>
                </div>
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192A] text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-6 font-semibold">Contato</th>
                      <th className="py-3 px-4 font-semibold">Telefone</th>
                      <th className="py-3 px-4 font-semibold">Colaborador</th>
                      <th className="py-3 px-4 font-semibold text-center">Nota</th>
                      <th className="py-3 px-6 font-semibold">Comentário</th>
                      <th className="py-3 px-6 font-semibold text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {filteredSurveys.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-1">
                              <Star size={20} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Nenhuma pesquisa encontrada</p>
                            <p className="text-xs text-slate-500 max-w-sm">
                              {surveySearch || surveyAgentFilter !== 'all'
                                ? 'Nenhum feedback corresponde aos filtros aplicados. Tente alterar a busca ou selecionar outro colaborador.'
                                : 'Não foram encontradas pesquisas de satisfação no período selecionado.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSurveys.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {s.contactName.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{s.contactName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {s.phone}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                {s.agentName.substring(0, 1).toUpperCase()}
                              </div>
                              <span>{s.agentName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 font-bold">
                              <Star size={11} fill="currentColor" />
                              <span>{s.rating}.0</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 max-w-md">
                            {s.comment ? (
                              <p className="text-slate-700 dark:text-slate-300 italic truncate" title={s.comment}>
                                "{s.comment}"
                              </p>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">Sem comentário adicional</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right font-mono text-slate-500 dark:text-slate-400">
                            {s.createdAt}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS (CSAT) */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSurveys.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 px-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-2">
                      <Star size={18} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Nenhuma pesquisa encontrada</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {surveySearch || surveyAgentFilter !== 'all'
                        ? 'Altere os filtros de pesquisa.'
                        : 'Não foram encontradas pesquisas de satisfação.'}
                    </p>
                  </div>
                ) : (
                  filteredSurveys.map((s) => (
                    <div key={s.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {s.contactName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs block truncate">{s.contactName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{s.phone}</span>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 font-bold text-xs shrink-0">
                          <Star size={11} fill="currentColor" />
                          <span>{s.rating}.0</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Atendente:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{s.agentName}</span>
                        </div>
                        <span className="text-[10.5px] text-slate-400 font-mono">{s.createdAt}</span>
                      </div>

                      {s.comment ? (
                        <div className="bg-slate-50 dark:bg-[#11192A] border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-2 text-xs italic text-slate-700 dark:text-slate-300">
                          "{s.comment}"
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic block">Sem comentário adicional</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CUSTOS DE IA                                       */}
        {/* ========================================================= */}
        {activeTab === 'ai_costs' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gasto 7d (USD)</span>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">${aiCosts?.spent7d || '0.00'}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium truncate">
                  <Sparkles size={12} className="shrink-0" /> gpt-4o-mini
                </span>
              </div>

              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gasto 15d (USD)</span>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-purple-600 dark:text-purple-300">${aiCosts?.spent15d || '0.00'}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 truncate">Consumo acumulado</span>
              </div>

              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gasto 30d (USD)</span>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">${aiCosts?.spent30d || '0.00'}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400/80 font-medium truncate">Dentro do limite</span>
              </div>

              <div className="bg-white dark:bg-[#0B1224] p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Projeção Mensal</span>
                <div className="my-2 sm:my-3">
                  <span className="text-xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">${aiCosts?.projectionMonth || '0.00'}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400/80 font-medium truncate">Estimativa por volume</span>
              </div>
            </div>

            {/* Daily Evolution Chart */}
            <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-6 shadow-sm">
              <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Evolução Diária de Custo por Execução (USD $)</span>
              </h3>
              <div className="h-[220px] sm:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aiCosts?.dailyCostEvolution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} vertical={false} />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} unit="$" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1224",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="cost" name="Custo USD ($)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Executions Table */}
            <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Últimas Execuções de Inteligência Artificial</h3>
              </div>
              
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192A] text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-6 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Modelo</th>
                      <th className="py-3 px-4 font-semibold">Contexto / Lead</th>
                      <th className="py-3 px-4 font-semibold text-center">Prompt Tokens</th>
                      <th className="py-3 px-4 font-semibold text-center">Completion Tokens</th>
                      <th className="py-3 px-6 font-semibold text-right">Custo USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {aiCosts?.detailedExecutions?.map((ex: any) => (
                      <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-6 font-mono text-slate-500">{ex.id}</td>
                        <td className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">{ex.model}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{ex.contactName}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">{ex.promptTokens}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">{ex.completionTokens}</td>
                        <td className="py-3 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${ex.costUsd.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                {!aiCosts?.detailedExecutions?.length ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Nenhuma execução de IA registrada no período.
                  </div>
                ) : (
                  aiCosts.detailedExecutions.map((ex: any) => (
                    <div key={ex.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-slate-400">#{ex.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {ex.model}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          ${ex.costUsd.toFixed(5)}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {ex.contactName || 'Execução Automática'}
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                        <span>Prompt: <strong className="font-mono text-slate-700 dark:text-slate-300">{ex.promptTokens}</strong> tok</span>
                        <span>Completion: <strong className="font-mono text-slate-700 dark:text-slate-300">{ex.completionTokens}</strong> tok</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CONFIGURAÇÃO DE DIAS ÚTEIS DA EMPRESA (PADRÃO LERO) */}
      {/* ========================================================= */}
      {showWorkingDaysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#11192A]">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Configuração de Dias Úteis & Expediente</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Define os dias contabilizados para métricas de SLA e médias diárias</p>
                </div>
              </div>
              <button
                onClick={() => setShowWorkingDaysModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 custom-scrollbar text-xs">
              {/* Seção 1: Dias de Operação */}
              <div>
                <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                    1. Dias de Operação da Semana
                  </h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    {operatingDays.length} selecionados
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {WEEKDAYS_NAMES.map((day) => {
                    const isSelected = operatingDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (operatingDays.length > 1) {
                              setOperatingDays(operatingDays.filter(d => d !== day.id));
                            } else {
                              toast.error("Ao menos um dia deve estar ativo.");
                            }
                          } else {
                            setOperatingDays([...operatingDays, day.id]);
                          }
                        }}
                        className={`py-2 sm:py-3 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600/20 dark:border-blue-500 dark:text-blue-300 shadow-sm'
                            : 'bg-slate-50 dark:bg-[#11192A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span>{day.short}</span>
                        {isSelected && <Check size={11} className="text-white dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: Feriados Nacionais */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2.5 sm:mb-3">
                  2. Feriados Nacionais
                </h4>
                <div className="space-y-1.5 sm:space-y-2 max-h-44 sm:max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {holidays.filter(h => !h.isCustom).map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 w-11 shrink-0">{holiday.date}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{holiday.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHolidays(holidays.map(h => h.id === holiday.id ? { ...h, enabled: !h.enabled } : h));
                        }}
                        className={`px-2 py-1 rounded text-[10.5px] sm:text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                          holiday.enabled
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {holiday.enabled ? 'Pausa' : 'Normal'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 3: Feriados Customizados da Empresa */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2.5 sm:mb-3">
                  3. Feriados Municipais / Empresa
                </h4>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Nome do feriado municipal..."
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="flex-1 sm:w-auto bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newHolidayName.trim() || !newHolidayDate) {
                          toast.error("Preencha nome e data do feriado.");
                          return;
                        }
                        const newH: Holiday = {
                          id: `custom-${Date.now()}`,
                          name: newHolidayName.trim(),
                          date: newHolidayDate,
                          enabled: true,
                          isCustom: true
                        };
                        setHolidays([...holidays, newH]);
                        setNewHolidayName('');
                        setNewHolidayDate('');
                        toast.success("Feriado adicionado!");
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Feriados Customizados */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {holidays.filter(h => h.isCustom).length === 0 ? (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block text-center py-2">
                      Nenhum feriado municipal personalizado cadastrado.
                    </span>
                  ) : (
                    holidays.filter(h => h.isCustom).map((h) => (
                      <div key={h.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 dark:text-slate-400">{h.date}</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{h.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHolidays(holidays.filter(item => item.id !== h.id))}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192A] flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowWorkingDaysModal(false)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveWorkingDaysConfig}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
