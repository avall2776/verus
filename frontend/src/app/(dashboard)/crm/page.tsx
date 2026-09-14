"use client";

import React, { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { 
  Search, Filter, MoreHorizontal, MessageCircle, Copy, FileText, 
  Maximize2, Minimize2, Activity, Users, Building, LayoutDashboard, 
  Plus, Settings, DollarSign, Target, ChevronDown, ChevronUp, Calendar, 
  CheckSquare, ArrowRight, Clock, MessageSquare, ArrowUpRight, 
  Kanban as KanbanIcon, Table as TableIcon, CalendarDays, ChevronLeft, 
  ChevronRight, X, User as UserIcon, Phone, Mail, Check,
  ArrowUpDown, ArrowUp, ArrowDown, Columns, SlidersHorizontal, Edit2
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { DealModal } from "@/components/crm/DealModal";

const DEFAULT_COLUMNS = [
  { id: "seed", title: "LEADS SEED", color: "text-gray-400", bgLight: "bg-gray-500/10", borderLight: "border-gray-500/30", borderColor: "border-t-gray-500" },
  { id: "new", title: "Novo Contato", color: "text-blue-500", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/30", borderColor: "border-t-blue-500" },
  { id: "qualified", title: "Em Qualificação", color: "text-purple-500", bgLight: "bg-purple-500/10", borderLight: "border-purple-500/30", borderColor: "border-t-purple-500" },
  { id: "follow-up", title: "Follow-up", color: "text-yellow-500", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/30", borderColor: "border-t-yellow-500" },
  { id: "proposal", title: "Proposta", color: "text-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/30", borderColor: "border-t-emerald-500" },
  { id: "negotiation", title: "Negociação", color: "text-orange-500", bgLight: "bg-orange-500/10", borderLight: "border-orange-500/30", borderColor: "border-t-orange-500" },
  { id: "won", title: "Fechado/Ganho", color: "text-green-500", bgLight: "bg-green-500/10", borderLight: "border-green-500/30", borderColor: "border-t-green-500" },
  { id: "lost", title: "Fechado/Perdido", color: "text-rose-600", bgLight: "bg-rose-600/10", borderLight: "border-rose-600/30", borderColor: "border-t-rose-600" },
  { id: "disqualified", title: "Duplicados/Desqualificados", color: "text-gray-600", bgLight: "bg-gray-600/10", borderLight: "border-gray-600/30", borderColor: "border-t-gray-600" }
];

type ViewMode = 'kanban' | 'table' | 'timeline';

// Função utilitária para pegar o domingo da semana correspondente
function getSundayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domingo
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

function CrmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<string[]>([]);
  const [neutralMode, setNeutralMode] = useState(false);
  
  // Modos de visualização e filtros
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edição e persistência do Nome do Funil
  const [funnelName, setFunnelName] = useState<string>("Funil Principal (Padrão)");
  const [isEditingFunnel, setIsEditingFunnel] = useState<boolean>(false);
  const [tempFunnelName, setTempFunnelName] = useState<string>("Funil Principal (Padrão)");

  const handleSaveFunnelName = () => {
    if (!tempFunnelName.trim()) {
      toast.error("O nome do funil não pode ser vazio.");
      return;
    }
    const newName = tempFunnelName.trim();
    setFunnelName(newName);
    localStorage.setItem('crm_funnel_name', newName);
    setIsEditingFunnel(false);
    toast.success("Nome do funil atualizado com sucesso!");
  };
  
  // Tabela: estágios colapsados e descrições expandidas
  const [collapsedTableStages, setCollapsedTableStages] = useState<string[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  // Linha do tempo: estágios colapsados
  const [collapsedTimelineStages, setCollapsedTimelineStages] = useState<string[]>([]);

  const toggleTimelineStage = (stageId: string) => {
    setCollapsedTimelineStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    );
  };

  // Tabela: Ordenação interativa (Sorting)
  type TableSortField = 'title' | 'contact' | 'description' | 'assignee' | 'value' | 'updatedAt' | 'createdAt';
  const [sortField, setSortField] = useState<TableSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Tabela: Filtros avançados e visibilidade de colunas
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [selectedStageFilter, setSelectedStageFilter] = useState("all");

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    title: true,
    contact: true,
    description: true,
    assignee: true,
    value: true,
    updatedAt: true,
    createdAt: true
  });

  const toggleColumnVisibility = (colKey: string) => {
    setVisibleColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  const handleSort = (field: TableSortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // Linha do tempo: data de início da semana (Domingo)
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => getSundayOfWeek(new Date()));

  const [showStageModal, setShowStageModal] = useState(false);
  const [showManageStagesModal, setShowManageStagesModal] = useState(false);
  const [lossModalState, setLossModalState] = useState<{isOpen: boolean, dealId: string | null, destColId: string | null}>({isOpen: false, dealId: null, destColId: null});
  const [lossReason, setLossReason] = useState("");
  const [lossComment, setLossComment] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedCols = localStorage.getItem('crm_columns');
    if (savedCols) {
      setColumns(JSON.parse(savedCols));
    } else {
      setColumns(DEFAULT_COLUMNS);
      localStorage.setItem('crm_columns', JSON.stringify(DEFAULT_COLUMNS));
    }
    const savedWidths = localStorage.getItem('crm_columns_widths');
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
    const savedFunnelName = localStorage.getItem('crm_funnel_name');
    if (savedFunnelName) {
      setFunnelName(savedFunnelName);
      setTempFunnelName(savedFunnelName);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_columns_widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const crmContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const fetchDeals = async () => {
    try {
      const { data } = await api.get('/deals');
      setDeals(data);
    } catch (error) {
      toast.error("Erro ao carregar Pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const [dealAction, setDealAction] = useState<'task' | 'event' | 'chat' | null>(null);

  const handleOpenDeal = async (dealOrId: string | any, action: 'task' | 'event' | 'chat' | null = null) => {
    setDealAction(action);
    let target = typeof dealOrId === 'object' && dealOrId !== null ? dealOrId : null;
    const dealId = target ? target.id : dealOrId;

    if (!target && dealId) {
      target = deals.find(d => d.id === dealId) || filteredDeals.find(d => d.id === dealId);
      if (!target && typeof dealId === 'string' && !dealId.startsWith('new-')) {
        try {
          const { data } = await api.get(`/deals/${dealId}`);
          target = data;
        } catch {
          // fallback
        }
      }
    }

    if (target) {
      setSelectedDeal(target);
      if (typeof window !== 'undefined' && target.id && !target.id.startsWith('new-')) {
        const url = new URL(window.location.href);
        url.searchParams.set('dealId', target.id);
        window.history.replaceState(null, '', url.toString());
      }
    }
  };

  const handleCloseDealModal = () => {
    setSelectedDeal(null);
    setDealAction(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('dealId');
      url.searchParams.delete('id');
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Sincronização automática com dealId vindo da URL (deep-link / notificações)
  const dealIdFromUrl = searchParams.get('dealId') || searchParams.get('id');
  useEffect(() => {
    if (dealIdFromUrl && (!selectedDeal || selectedDeal.id !== dealIdFromUrl)) {
      handleOpenDeal(dealIdFromUrl);
    }
  }, [dealIdFromUrl, deals]);

  const handleUpdateDeal = async (dealId: string, data: any) => {
    try {
      if (dealId.startsWith('new-')) {
        const payload = {
          title: data.title || selectedDeal?.title || "Nova Oportunidade",
          value: data.value !== undefined ? Number(data.value) : (selectedDeal?.value ? Number(selectedDeal.value) : 0),
          status: data.status || selectedDeal?.status || "new",
          notes: data.notes || selectedDeal?.notes || "",
          metadata: data.metadata || selectedDeal?.metadata || {},
          assignedTo: data.assignedTo || selectedDeal?.assignedTo || null,
        };
        await api.post('/deals', payload);
        toast.success("Oportunidade criada com sucesso!");
        handleCloseDealModal();
        fetchDeals();
        return;
      }

      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, ...data } : d));
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal({ ...selectedDeal, ...data });
      }
      await api.patch(`/deals/${dealId}`, data);
      toast.success("Atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar");
      fetchDeals();
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    if (newStatus === 'lost' || newStatus === 'disqualified') {
      setLossModalState({ isOpen: true, dealId: draggableId, destColId: newStatus });
      return;
    }

    handleUpdateDeal(draggableId, { status: newStatus });
  };

  const toggleColumn = (colId: string) => {
    setCollapsedCols(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const toggleTableStage = (stageId: string) => {
    setCollapsedTableStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatRelativeTime = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins <= 1) return "há poucos instantes";
    if (diffMins < 60) return `há ${diffMins} minutos`;
    if (diffHours === 1) return `há cerca de 1 hora`;
    if (diffHours < 24) return `há cerca de ${diffHours} horas`;
    if (diffDays === 1) return `há cerca de 1 dia`;
    if (diffDays < 30) return `há cerca de ${diffDays} dias`;
    return d.toLocaleDateString('pt-BR');
  };

  // Usuário atual para filtro "Minhas"
  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('versus_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Filtragem reativa dos negócios
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // 1. Filtro por Busca de Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = deal.title?.toLowerCase().includes(q);
        const contactMatch = deal.contact?.name?.toLowerCase().includes(q) || deal.contact?.phone?.includes(q) || deal.contact?.email?.toLowerCase().includes(q);
        const notesMatch = deal.notes?.toLowerCase().includes(q);
        const assigneeMatch = deal.assignedTo?.name?.toLowerCase().includes(q) || deal.assignee?.name?.toLowerCase().includes(q);
        if (!titleMatch && !contactMatch && !notesMatch && !assigneeMatch) {
          return false;
        }
      }

      // 2. Filtro por Aba Superior
      if (activeTab === 'mine') {
        if (!currentUser) return true;
        const isAssigned = (
          deal.assignedTo === currentUser.id ||
          deal.assignedToId === currentUser.id ||
          deal.assignee?.id === currentUser.id ||
          deal.assignedTo?.name?.toLowerCase() === currentUser.name?.toLowerCase() ||
          deal.assignee?.name?.toLowerCase() === currentUser.name?.toLowerCase()
        );
        return isAssigned;
      }

      if (activeTab === 'contact') {
        return !!(deal.contact?.name || deal.contactId);
      }

      if (activeTab === 'company') {
        const hasCompany = !!(
          deal.metadata?.company ||
          deal.contact?.company ||
          deal.notes?.toLowerCase().includes("empresa") ||
          deal.contact?.tags?.some((t: string) => t.toLowerCase().includes("b2b") || t.toLowerCase().includes("empresa"))
        );
        return hasCompany;
      }

      // 3. Filtro Avançado por Estágio (se selecionado na tabela)
      if (selectedStageFilter !== 'all') {
        if (deal.status !== selectedStageFilter) return false;
      }

      return true;
    });
  }, [deals, searchQuery, activeTab, currentUser, selectedStageFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (activeTab !== 'all') count++;
    if (selectedStageFilter !== 'all') count++;
    return count;
  }, [searchQuery, activeTab, selectedStageFilter]);

  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[colId] || 300;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      let newWidth = startWidth + deltaX;
      if (newWidth < 260) newWidth = 260;
      if (newWidth > 550) newWidth = 550;
      setColumnWidths(prev => ({ ...prev, [colId]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleFullscreen = () => {
    const container = document.getElementById("crm-container") || crmContainerRef.current;
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      if (container) {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch((err) => console.error("Fullscreen error:", err));
        } else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        }
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => console.error(err));
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.error(err));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Navegação da Linha do Tempo
  const handlePrevWeek = () => {
    setTimelineStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setTimelineStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleTodayWeek = () => {
    setTimelineStartDate(getSundayOfWeek(new Date()));
  };

  // Formatação do label da semana (ex: 13 a 19 de setembro de 2026)
  const timelineWeekLabel = useMemo(() => {
    const start = new Date(timelineStartDate);
    const end = new Date(timelineStartDate);
    end.setDate(start.getDate() + 6);

    const monthNames = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho", 
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} a ${endDay} de ${startMonth} de ${year}`;
    }
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${year}`;
  }, [timelineStartDate]);

  // Lista dos 7 dias da semana para a Timeline
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const fullDayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(timelineStartDate);
      d.setDate(d.getDate() + i);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push({
        date: d,
        dayName: dayNames[i],
        fullDayName: fullDayNames[i],
        dayNumber: d.getDate(),
        formattedDate: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
        isToday
      });
    }
    return days;
  }, [timelineStartDate]);

  // Helper para obter estilização da tag/borda lateral e badge de acordo com o estágio
  const getTimelineStageAccent = (colId: string) => {
    switch (colId) {
      case 'seed':
        return { barBg: 'bg-gray-400', badgeBg: 'bg-gray-500/10', badgeText: 'text-gray-400', borderLight: 'border-gray-500/30' };
      case 'new':
        return { barBg: 'bg-blue-500', badgeBg: 'bg-blue-500/10', badgeText: 'text-blue-400', borderLight: 'border-blue-500/30' };
      case 'qualified':
        return { barBg: 'bg-purple-500', badgeBg: 'bg-purple-500/10', badgeText: 'text-purple-400', borderLight: 'border-purple-500/30' };
      case 'follow-up':
        return { barBg: 'bg-yellow-500', badgeBg: 'bg-yellow-500/10', badgeText: 'text-yellow-400', borderLight: 'border-yellow-500/30' };
      case 'proposal':
        return { barBg: 'bg-emerald-500', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-400', borderLight: 'border-emerald-500/30' };
      case 'negotiation':
        return { barBg: 'bg-orange-500', badgeBg: 'bg-orange-500/10', badgeText: 'text-orange-400', borderLight: 'border-orange-500/30' };
      case 'won':
        return { barBg: 'bg-green-500', badgeBg: 'bg-green-500/10', badgeText: 'text-green-400', borderLight: 'border-green-500/30' };
      case 'lost':
        return { barBg: 'bg-rose-600', badgeBg: 'bg-rose-600/10', badgeText: 'text-rose-400', borderLight: 'border-rose-600/30' };
      case 'disqualified':
        return { barBg: 'bg-gray-600', badgeBg: 'bg-gray-600/10', badgeText: 'text-gray-400', borderLight: 'border-gray-600/30' };
      default:
        return { barBg: 'bg-primary', badgeBg: 'bg-primary/10', badgeText: 'text-primary', borderLight: 'border-primary/30' };
    }
  };

  // Totais consolidados da semana selecionada na Timeline
  const { weekTotalCards, weekTotalAmount } = useMemo(() => {
    let cards = 0;
    let amount = 0;

    for (const day of weekDays) {
      const dealsForDay = filteredDeals.filter(deal => {
        const rawDate = deal.expectedCloseDate || deal.updatedAt || deal.createdAt;
        if (!rawDate) return false;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return false;
        return d.toDateString() === day.date.toDateString();
      });

      cards += dealsForDay.length;
      amount += dealsForDay.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);
    }

    return { weekTotalCards: cards, weekTotalAmount: amount };
  }, [weekDays, filteredDeals]);

  if (loading) return <div className="p-8 text-gray-500 font-semibold">Carregando CRM...</div>;

  return (
    <div 
      id="crm-container"
      ref={crmContainerRef}
      className={`flex flex-col gap-3.5 relative transition-all duration-200 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-[#0a0c10] p-4 h-screen w-screen overflow-y-auto text-white' 
          : 'h-full w-full'
      }`}
    >
      <DealModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={handleCloseDealModal} 
        onUpdate={handleUpdateDeal}
        initialAction={dealAction}
      />

      {/* Modal de Perda */}
      {lossModalState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-gray-800 w-full max-w-sm rounded-xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95">
            <h2 className="text-lg font-bold text-white mb-4">Marcar como Perdido</h2>
            <div className="space-y-3 mb-4">
              {["Cliente achou caro", "Cliente enrolou", "Comprou do concorrente", "Contato inválido / sem interesse"].map(reason => (
                <label key={reason} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="radio" name="lossReason" value={reason} checked={lossReason === reason} onChange={(e) => setLossReason(e.target.value)} className="accent-rose-500" />
                  {reason}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="radio" name="lossReason" value="outro" checked={lossReason === 'outro'} onChange={(e) => setLossReason(e.target.value)} className="accent-rose-500" />
                Outro...
              </label>
            </div>
            <textarea 
              placeholder="Comentário (opcional)..."
              value={lossComment}
              onChange={(e) => setLossComment(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-rose-500 mb-6 min-h-[80px]"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setLossModalState({ isOpen: false, dealId: null, destColId: null }); setLossReason(""); setLossComment(""); }} 
                className="text-slate-400 text-sm font-bold hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (lossModalState.dealId && lossModalState.destColId) {
                    handleUpdateDeal(lossModalState.dealId, { 
                      status: lossModalState.destColId, 
                      lossReason: lossReason === 'outro' ? lossComment : lossReason, 
                      lossComment 
                    });
                  }
                  setLossModalState({ isOpen: false, dealId: null, destColId: null });
                  setLossReason("");
                  setLossComment("");
                }} 
                className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Superior em Linha Única (Single-Row Flexbox - Padrão Executivo Lero) */}
      <div className="flex items-center justify-between gap-3 w-full bg-[#161b22] p-2.5 sm:p-3 rounded-xl border border-gray-800/60 overflow-x-auto custom-scrollbar shadow-sm shrink-0">
        
        {/* LADO ESQUERDO: FUNIL PRINCIPAL COM EDIÇÃO (Edit2) + ABAS DE VISUALIZAÇÃO */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Funil Principal Interativo com Edição */}
          <div className="flex items-center pr-2.5 border-r border-gray-800 shrink-0">
            {isEditingFunnel ? (
              <div className="flex items-center gap-1 bg-[#0d1117] border border-primary/60 rounded-lg px-2 py-0.5 shadow-inner">
                <input
                  type="text"
                  value={tempFunnelName}
                  onChange={(e) => setTempFunnelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveFunnelName();
                    if (e.key === 'Escape') {
                      setTempFunnelName(funnelName);
                      setIsEditingFunnel(false);
                    }
                  }}
                  autoFocus
                  className="bg-transparent text-white font-bold text-xs sm:text-sm outline-none w-40"
                  placeholder="Nome do Funil"
                />
                <button
                  type="button"
                  onClick={handleSaveFunnelName}
                  className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded transition-colors"
                  title="Salvar nome"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempFunnelName(funnelName);
                    setIsEditingFunnel(false);
                  }}
                  className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
                  title="Cancelar"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <span 
                  onClick={() => {
                    setTempFunnelName(funnelName);
                    setIsEditingFunnel(true);
                  }}
                  className="text-white font-extrabold text-xs sm:text-sm tracking-tight select-none cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                  title="Clique para editar o nome do funil"
                >
                  {funnelName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempFunnelName(funnelName);
                    setIsEditingFunnel(true);
                  }}
                  className="text-gray-400 hover:text-primary transition-colors p-1 rounded hover:bg-gray-800/80"
                  title="Editar nome do funil"
                >
                  <Edit2 size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            )}
          </div>
          
          {/* ABAS DE VISUALIZAÇÃO: QUADRO | TABELA | LINHA DO TEMPO */}
          <div className="flex bg-[#0d1117] rounded-lg p-0.5 border border-gray-800 shadow-inner shrink-0">
            <button
              id="view-mode-kanban-btn"
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                viewMode === 'kanban' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <KanbanIcon size={13} />
              <span>Quadro</span>
            </button>

            <button
              id="view-mode-table-btn"
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                viewMode === 'table' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
              title="Visualização em Tabela Densa"
            >
              <TableIcon size={13} />
              <span>Tabela</span>
            </button>

            <button
              id="view-mode-timeline-btn"
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                viewMode === 'timeline' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
              title="Visualização em Linha do Tempo Semanal"
            >
              <CalendarDays size={13} />
              <span>Linha do Tempo</span>
            </button>
          </div>
        </div>

        {/* LADO CENTRO/DIREITA: BUSCA + FILTROS RÁPIDOS + BOTÕES DE AÇÃO */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Input de Busca Compactado */}
          <div className="relative w-36 sm:w-44 lg:w-52 shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              id="crm-search-input"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar oportunidade..." 
              className="bg-[#0d1117] border border-gray-800 rounded-lg pl-7 pr-6 py-1 text-xs text-white outline-none focus:border-primary w-full transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Filtros Rápidos (Tudo, Minhas, Contatos, Empresas) */}
          <div className="flex bg-[#0d1117] rounded-lg p-0.5 border border-gray-800 shrink-0">
            {[
              { id: 'all', label: 'Tudo', icon: Activity },
              { id: 'mine', label: 'Minhas', icon: FileText },
              { id: 'contact', label: 'Contatos', icon: Users },
              { id: 'company', label: 'Empresas', icon: Building }
            ].map(tab => (
              <button 
                key={tab.id}
                id={`crm-tab-${tab.id}-btn`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-gray-800 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={12} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-800 shrink-0 hidden sm:block"></div>

          {/* Botões de Ação */}
          <button 
            type="button"
            onClick={() => setNeutralMode(!neutralMode)}
            className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all whitespace-nowrap ${
              neutralMode ? 'bg-gray-100 text-black border-gray-100' : 'bg-[#0d1117] text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Neutro
          </button>

          <button 
            type="button"
            onClick={() => setShowStageModal(true)} 
            className="bg-primary hover:bg-primary/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <Plus size={13}/>
            <span>Nova Etapa</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setShowManageStagesModal(true)} 
            className="bg-[#0d1117] hover:bg-gray-800 text-gray-300 border border-gray-800 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap hover:text-white"
          >
            <Settings size={13}/>
            <span className="hidden sm:inline">Gerenciar Etapas</span>
          </button>

          <button 
            type="button"
            id="crm-fullscreen-btn"
            title={isFullscreen ? "Sair da tela cheia (Esc)" : "Expandir CRM em tela cheia"}
            onClick={toggleFullscreen} 
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
              isFullscreen 
                ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30' 
                : 'bg-[#0d1117] hover:bg-gray-800 text-gray-300 border-gray-800 hover:text-white'
            }`}
          >
            {isFullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VISÃO EM QUADRO (KANBAN)                                               */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 flex gap-2 overflow-x-auto pb-4 custom-scrollbar items-start min-h-[500px]">
            {columns.map((col, idx) => {
              const isCollapsed = collapsedCols.includes(col.id);
              const columnDeals = filteredDeals.filter(d => d.status === col.id);
              const totalValue = columnDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);
              
              const colColorClass = neutralMode ? 'text-gray-300' : col.color;
              const borderTopClass = neutralMode ? 'border-t-gray-600' : col.borderColor;

              return (
                <React.Fragment key={col.id}>
                  <div 
                    className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-out`}
                    style={{ width: isCollapsed ? '60px' : `${columnWidths[col.id] || 300}px` }}
                  >
                    {isCollapsed ? (
                      <div className={`w-full h-full flex-shrink-0 flex flex-col bg-[#1c1d22] border border-gray-800 border-t-2 ${borderTopClass} rounded-xl items-center py-4 cursor-pointer hover:bg-gray-800/50 transition-colors group`} onClick={() => toggleColumn(col.id)}>
                         <button className="text-gray-500 group-hover:text-white mb-6">
                           <Maximize2 size={16} />
                         </button>
                         <div className="flex-1 relative w-full">
                           <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top-left -rotate-90 whitespace-nowrap font-bold text-sm text-gray-500 tracking-widest uppercase">
                             {col.title} ({columnDeals.length})
                           </div>
                         </div>
                      </div>
                    ) : (
                      <div className="w-full shrink-0 flex flex-col h-full gap-3">
                        {/* Column Header */}
                        <div className={`p-4 rounded-xl border border-gray-800 bg-[#1c1d22] border-t-2 ${borderTopClass} flex flex-col shadow-sm shrink-0`}>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className={`text-sm font-black uppercase tracking-wider ${colColorClass}`}>
                              {col.title}
                            </h3>
                            <div className="flex gap-1">
                              <button onClick={() => toggleColumn(col.id)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                                <Minimize2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold bg-[#0B1224] px-3 py-1.5 rounded-lg border border-gray-800/50">
                            <span className="bg-gray-800 px-2 py-0.5 rounded-full text-white">{columnDeals.length} cards</span>
                            <span className="text-gray-300 font-mono font-bold">{formatCurrency(totalValue)}</span>
                          </div>
                        </div>

                        {/* Droppable Area */}
                        <Droppable droppableId={col.id}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 flex flex-col gap-3 overflow-y-auto rounded-xl p-1 transition-all duration-200 ease-out custom-scrollbar min-h-[150px] ${snapshot.isDraggingOver ? `border-2 border-dashed ${col.borderColor.replace('border-t-', 'border-')}/40 bg-${col.color.replace('text-', '').split('-')[0]}-500/5` : 'border-2 border-transparent'}`}
                            >
                              {columnDeals.map((deal, index) => (
                                <DealCard 
                                  key={deal.id} 
                                  deal={deal} 
                                  index={index} 
                                  col={col} 
                                  onOpenDeal={handleOpenDeal}
                                  setSelectedDeal={setSelectedDeal} 
                                  router={router}
                                />
                              ))}
                              {provided.placeholder}
                              
                              {/* Add Card Button (Footer da coluna) */}
                              <button 
                                onClick={() => {
                                  setSelectedDeal({
                                    id: `new-${Date.now()}`,
                                    title: "Nova Oportunidade",
                                    status: col.id,
                                    value: 0,
                                    contact: { name: "", phone: "", email: "" },
                                    isNew: true
                                  });
                                }}
                                className="mt-auto shrink-0 w-full bg-[#161b22] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Plus size={16} /> Adicionar novo cartão
                              </button>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </div>
                  
                  {/* Resizer Handle */}
                  {idx < columns.length - 1 && (
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, col.id)}
                      className="w-1.5 hover:w-2 shrink-0 h-full rounded-full hover:bg-slate-700/50 cursor-col-resize transition-all self-stretch"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* ========================================================================= */}
      {/* 2. VISÃO EM TABELA DO CRM (Densa e alinhada ao Padrão Lero)              */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (() => {
        const visibleColCount = Object.values(visibleColumns).filter(Boolean).length || 1;

        return (
          <div className="flex-1 flex flex-col bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in-50 duration-200">
            {/* Barra de Ferramentas da Tabela: Filtros, Visibilidade de Colunas e Adição Rápida */}
            <div className="bg-[#1c2128] border-b border-gray-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {/* Botão [Filtros] com badge numérico */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      activeFilterCount > 0 
                        ? 'bg-primary/20 border-primary text-white shadow-sm' 
                        : 'bg-[#0B1224] border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Filter size={13} className={activeFilterCount > 0 ? "text-primary" : "text-gray-400"} />
                    <span>Filtros</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Popover de Filtros */}
                  {showFilterDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                        <span className="text-xs font-bold text-white">Filtros Avançados</span>
                        {activeFilterCount > 0 && (
                          <button 
                            type="button" 
                            onClick={() => { setSearchQuery(""); setActiveTab("all"); setSelectedStageFilter("all"); }}
                            className="text-[10px] text-primary hover:underline font-bold"
                          >
                            Limpar todos
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Filtrar por Estágio</label>
                        <select
                          value={selectedStageFilter}
                          onChange={(e) => setSelectedStageFilter(e.target.value)}
                          className="w-full bg-[#0B1224] border border-gray-700 text-white rounded-lg p-1.5 text-xs outline-none focus:border-primary"
                        >
                          <option value="all">Todos os Estágios</option>
                          {columns.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seletor / Engrenagem de Visibilidade de Colunas */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColumnVisibility(!showColumnVisibility)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B1224] border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    title="Configurar colunas visíveis"
                  >
                    <Columns size={13} className="text-gray-400" />
                    <span>Colunas</span>
                  </button>

                  {/* Popover de Visibilidade de Colunas */}
                  {showColumnVisibility && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                      <span className="text-xs font-bold text-white border-b border-gray-800 pb-2">Exibir Colunas</span>
                      {[
                        { id: 'title', label: 'Título' },
                        { id: 'contact', label: 'Contato' },
                        { id: 'description', label: 'Descrição' },
                        { id: 'assignee', label: 'Responsável' },
                        { id: 'value', label: 'Valor (R$)' },
                        { id: 'updatedAt', label: 'Última Interação' },
                        { id: 'createdAt', label: 'Criado Em' }
                      ].map(colItem => (
                        <label key={colItem.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={visibleColumns[colItem.id]}
                            onChange={() => toggleColumnVisibility(colItem.id)}
                            className="accent-primary rounded"
                          />
                          <span>{colItem.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Adição Rápida (+) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeal({
                      id: `new-${Date.now()}`,
                      title: "Nova Oportunidade",
                      status: "new",
                      value: 0,
                      contact: { name: "", phone: "", email: "" },
                      isNew: true
                    });
                  }}
                  className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors flex items-center justify-center"
                  title="Nova oportunidade rápida"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>
                  <strong className="text-white">{filteredDeals.length}</strong> {filteredDeals.length === 1 ? 'oportunidade' : 'oportunidades'} no total
                </span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f141c] border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {/* 1. Título */}
                    {visibleColumns.title && (
                      <th 
                        onClick={() => handleSort('title')}
                        className="py-2.5 px-3.5 w-[240px] cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Título"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={sortField === 'title' ? 'text-white' : ''}>Título</span>
                          {sortField === 'title' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}

                    {/* 2. Contato */}
                    {visibleColumns.contact && (
                      <th 
                        onClick={() => handleSort('contact')}
                        className="py-2.5 px-3.5 w-[200px] cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Contato"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={sortField === 'contact' ? 'text-white' : ''}>Contato</span>
                          {sortField === 'contact' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}

                    {/* 3. Descrição */}
                    {visibleColumns.description && (
                      <th 
                        onClick={() => handleSort('description')}
                        className="py-2.5 px-3.5 cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Descrição"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={sortField === 'description' ? 'text-white' : ''}>Descrição</span>
                          {sortField === 'description' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}

                    {/* 4. Responsável */}
                    {visibleColumns.assignee && (
                      <th 
                        onClick={() => handleSort('assignee')}
                        className="py-2.5 px-3.5 w-[150px] cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Responsável"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={sortField === 'assignee' ? 'text-white' : ''}>Responsável</span>
                          {sortField === 'assignee' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}

                    {/* 5. Valor (R$) */}
                    {visibleColumns.value && (
                      <th 
                        onClick={() => handleSort('value')}
                        className="py-2.5 px-3.5 w-[130px] text-right cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Valor"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={sortField === 'value' ? 'text-white' : ''}>Valor (R$)</span>
                          {sortField === 'value' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}

                    {/* 6. Última Interação */}
                    {visibleColumns.updatedAt && (
                      <th 
                        onClick={() => handleSort('updatedAt')}
                        className="py-2.5 px-3.5 w-[160px] cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Última Interação"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={sortField === 'updatedAt' ? 'text-white' : ''}>Última Interação</span>
                          {sortField === 'updatedAt' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}

                    {/* 7. Criado Em */}
                    {visibleColumns.createdAt && (
                      <th 
                        onClick={() => handleSort('createdAt')}
                        className="py-2.5 px-3.5 w-[120px] cursor-pointer select-none hover:bg-[#1a202c] transition-colors group"
                        title="Clique para ordenar por Data de Cadastro"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={sortField === 'createdAt' ? 'text-white' : ''}>Criado Em</span>
                          {sortField === 'createdAt' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary shrink-0" /> : <ArrowDown size={12} className="text-primary shrink-0" />
                          ) : (
                            <ArrowUpDown size={12} className="text-gray-600 group-hover:text-gray-400 opacity-60 shrink-0" />
                          )}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs">
                  {columns.map(col => {
                    const stageDeals = filteredDeals.filter(d => d.status === col.id);
                    const isCollapsed = collapsedTableStages.includes(col.id);
                    const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

                    // Ordenação ativa dos deals do estágio
                    const sortedStageDeals = [...stageDeals].sort((a, b) => {
                      let aVal: any = '';
                      let bVal: any = '';

                      switch (sortField) {
                        case 'title':
                          aVal = (a.title || '').toLowerCase();
                          bVal = (b.title || '').toLowerCase();
                          break;
                        case 'contact':
                          aVal = (a.contact?.name || '').toLowerCase();
                          bVal = (b.contact?.name || '').toLowerCase();
                          break;
                        case 'description':
                          aVal = (a.notes || a.description || '').toLowerCase();
                          bVal = (b.notes || b.description || '').toLowerCase();
                          break;
                        case 'assignee':
                          aVal = (a.assignedTo?.name || a.assignee?.name || '').toLowerCase();
                          bVal = (b.assignedTo?.name || b.assignee?.name || '').toLowerCase();
                          break;
                        case 'value':
                          aVal = Number(a.value || 0);
                          bVal = Number(b.value || 0);
                          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                        case 'updatedAt':
                          aVal = new Date(a.updatedAt || a.createdAt || 0).getTime();
                          bVal = new Date(b.updatedAt || b.createdAt || 0).getTime();
                          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                        case 'createdAt':
                          aVal = new Date(a.createdAt || 0).getTime();
                          bVal = new Date(b.createdAt || 0).getTime();
                          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                      }

                      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                      return 0;
                    });

                    return (
                      <React.Fragment key={`table-stage-${col.id}`}>
                        {/* Linha Cabeçalho do Estágio com Montante Total Acumulado */}
                        <tr 
                          onClick={() => toggleTableStage(col.id)}
                          className="bg-[#1c2128] hover:bg-[#222832] cursor-pointer transition-colors border-t border-b border-gray-800"
                        >
                          <td colSpan={visibleColCount} className="py-2.5 px-3.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-gray-400">
                                  {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                </span>
                                <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`}></div>
                                <span className="font-extrabold text-white uppercase tracking-wider text-xs">
                                  {col.title}
                                </span>
                                <span className="bg-gray-800/80 border border-gray-700 text-gray-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                  {stageDeals.length} {stageDeals.length === 1 ? 'card' : 'cards'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-xs font-mono font-bold text-emerald-400">
                                  Total: {formatCurrency(stageTotal)}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeal({
                                      id: `new-${Date.now()}`,
                                      title: "Nova Oportunidade",
                                      status: col.id,
                                      value: 0,
                                      contact: { name: "", phone: "", email: "" },
                                      isNew: true
                                    });
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors"
                                >
                                  <Plus size={12} /> Nova Oportunidade
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Linhas das Oportunidades do Estágio */}
                        {!isCollapsed && sortedStageDeals.length === 0 && (
                          <tr className="bg-[#12161f]/30">
                            <td colSpan={visibleColCount} className="py-3 px-6 text-gray-500 italic text-center text-xs">
                              Nenhuma oportunidade nesta etapa.
                            </td>
                          </tr>
                        )}

                        {!isCollapsed && sortedStageDeals.map(deal => {
                          const assigneeName = deal.assignedTo?.name || deal.assignee?.name;
                          const isDescExpanded = !!expandedDescriptions[deal.id];
                          const originSource = deal.contact?.source || deal.metadata?.source || "Meta Ads";

                          return (
                            <tr 
                              key={deal.id}
                              onClick={() => handleOpenDeal(deal)}
                              className="hover:bg-[#1f2530] transition-colors cursor-pointer group"
                            >
                              {/* 1. Título (com link interativo para abrir o DealModal) */}
                              {visibleColumns.title && (
                                <td className="py-2.5 px-3.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDeal(deal);
                                    }}
                                    className="flex flex-col text-left group/title focus:outline-none w-full"
                                    title="Clique para abrir detalhes da oportunidade"
                                  >
                                    <span className="font-bold text-slate-100 group-hover/title:text-primary transition-colors text-xs hover:underline underline-offset-2 flex items-center gap-1">
                                      {deal.title || "Sem título"}
                                      <ArrowUpRight size={12} className="text-gray-500 group-hover/title:text-primary transition-colors opacity-0 group-hover/title:opacity-100 shrink-0" />
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500 group-hover/title:text-primary/70 transition-colors">
                                      #{deal?.id?.includes('-') ? deal.id.split('-')[0].toUpperCase() : (deal.id || 'DEAL')}
                                    </span>
                                  </button>
                                </td>
                              )}

                              {/* 2. Contato (Nome do lead + telefone com ícone do WhatsApp) */}
                              {visibleColumns.contact && (
                                <td className="py-2.5 px-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-[10px] text-gray-200 shrink-0">
                                      {deal.contact?.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-slate-200 text-xs truncate max-w-[150px]">
                                        {deal.contact?.name || "Contato não informado"}
                                      </span>
                                      {deal.contact?.phone ? (
                                        <a 
                                          href={`https://wa.me/${deal.contact.phone.replace(/\D/g, '')}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                                        >
                                          <Phone size={9} className="text-[#25D366]" />
                                          <span>{deal.contact.phone}</span>
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-gray-500 italic">Sem telefone</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              )}

                              {/* 3. Descrição (Origem do Lead / Meta Ads com botão "Ver mais" elegante) */}
                              {visibleColumns.description && (
                                <td className="py-2.5 px-3.5 max-w-[320px]">
                                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] font-bold text-gray-400 bg-[#0B1224] border border-gray-800 px-1.5 py-0.2 rounded uppercase">
                                        {originSource}
                                      </span>
                                    </div>
                                    <p className={`text-xs text-gray-300 leading-relaxed ${isDescExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1'}`}>
                                      {deal.notes || deal.description || "Lead recebido pelo formulário nativo Meta Ads solicitando contato urgente."}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => toggleDescription(deal.id)}
                                      className="text-[10px] text-primary hover:text-primary/80 font-bold self-start mt-0.5 transition-colors"
                                    >
                                      {isDescExpanded ? "Ver menos ⌃" : "Ver mais ⌵"}
                                    </button>
                                  </div>
                                </td>
                              )}

                              {/* 4. Responsável (Avatar circular + nome do operador ou "Fila Geral") */}
                              {visibleColumns.assignee && (
                                <td className="py-2.5 px-3.5">
                                  {assigneeName ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {assigneeName[0].toUpperCase()}
                                      </div>
                                      <span className="text-slate-300 font-medium text-xs truncate max-w-[120px]">
                                        {assigneeName}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0">
                                        F
                                      </div>
                                      <span className="text-gray-500 italic text-xs">Fila Geral</span>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* 5. Valor (R$) (Valor formatado em BRL com destaque verde) */}
                              {visibleColumns.value && (
                                <td className="py-2.5 px-3.5 text-right">
                                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-xs inline-block">
                                    {formatCurrency(Number(deal.value || 0))}
                                  </span>
                                </td>
                              )}

                              {/* 6. Última Interação (Tempo relativo formatado, ex: "há cerca de 9 horas") */}
                              {visibleColumns.updatedAt && (
                                <td className="py-2.5 px-3.5 text-gray-400">
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Clock size={12} className="text-gray-500 shrink-0" />
                                    <span>{formatRelativeTime(deal.updatedAt || deal.createdAt)}</span>
                                  </span>
                                </td>
                              )}

                              {/* 7. Criado Em (Data de cadastro) */}
                              {visibleColumns.createdAt && (
                                <td className="py-2.5 px-3.5 text-gray-400 text-[11px]">
                                  {formatDate(deal.createdAt)}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 3. VISÃO EM LINHA DO TEMPO (TIMELINE SEMANAL)                             */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div className="flex-1 flex flex-col gap-4 animate-in fade-in-50 duration-200 overflow-hidden">
          {/* Barra de Navegação do Período Semanal Sincronizada */}
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 px-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700 flex items-center gap-1 text-xs font-semibold"
                title="Semana Anterior"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                type="button"
                onClick={handleTodayWeek}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-colors border border-gray-700 flex items-center gap-1.5 shadow-sm"
              >
                <Calendar size={13} className="text-primary" />
                <span>Semana Atual</span>
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 px-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700 flex items-center gap-1 text-xs font-semibold"
                title="Próxima Semana"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight size={15} />
              </button>

              <div className="h-5 w-px bg-gray-800 mx-1"></div>

              <div className="flex items-center gap-2 text-white font-bold text-sm bg-[#0d1117] px-3 py-1.5 rounded-lg border border-gray-800/80 shadow-inner">
                <CalendarDays size={15} className="text-primary shrink-0" />
                <span className="capitalize">{timelineWeekLabel}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Badge Contador Semanal */}
              <span className="bg-[#0B1224] border border-gray-800 px-3 py-1.5 rounded-lg font-semibold text-gray-300 flex items-center gap-1.5 shadow-sm">
                <span className="text-white font-bold">{weekTotalCards}</span> {weekTotalCards === 1 ? 'card nesta semana' : 'cards nesta semana'}
              </span>

              {/* Montante Financeiro Semanal */}
              {weekTotalAmount > 0 && (
                <span className="bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded-lg font-mono font-bold text-emerald-400 shadow-sm">
                  Total: {formatCurrency(weekTotalAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Grade da Timeline: Estágios na Lateral Esquerda + 7 Colunas dos Dias da Semana */}
          <div className="flex-1 bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                {/* Cabeçalho da Grade */}
                <thead className="sticky top-0 z-30 bg-[#1c2128] border-b border-gray-800 text-xs font-bold text-gray-300 shadow-sm">
                  <tr>
                    {/* Coluna Fixa à Esquerda: Estágios do Funil */}
                    <th className="p-3 w-64 min-w-[240px] max-w-[260px] sticky left-0 z-40 bg-[#1c2128] border-r border-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-gray-300">
                        <div className="flex items-center gap-2">
                          <LayoutDashboard size={14} className="text-primary" />
                          <span>Estágios do Funil</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsedTimelineStages.length === columns.length) {
                              setCollapsedTimelineStages([]);
                            } else {
                              setCollapsedTimelineStages(columns.map(c => c.id));
                            }
                          }}
                          className="text-[10px] text-gray-400 hover:text-white transition-colors uppercase font-bold tracking-wider"
                          title="Alternar expansão de todos os estágios"
                        >
                          {collapsedTimelineStages.length === columns.length ? 'Expandir' : 'Colapsar'}
                        </button>
                      </div>
                    </th>

                    {/* 7 Colunas dos Dias da Semana (Domingo a Sábado) */}
                    {weekDays.map((day, dayIndex) => {
                      const dayDeals = filteredDeals.filter(deal => {
                        const rawDate = deal.expectedCloseDate || deal.updatedAt || deal.createdAt;
                        if (!rawDate) return false;
                        const d = new Date(rawDate);
                        return !isNaN(d.getTime()) && d.toDateString() === day.date.toDateString();
                      });
                      const dayAmount = dayDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

                      return (
                        <th 
                          key={`timeline-th-${dayIndex}`}
                          className={`p-3 min-w-[145px] border-r border-gray-800/80 last:border-r-0 ${
                            day.isToday ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-extrabold uppercase tracking-wider ${
                                day.isToday ? 'text-primary' : 'text-gray-400'
                              }`}>
                                {day.dayName}
                              </span>
                              <div className="flex items-center gap-1">
                                {day.isToday && (
                                  <span className="bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                    Hoje
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${
                                  dayDeals.length > 0 
                                    ? 'bg-primary/20 text-primary border-primary/40 font-extrabold'
                                    : 'bg-gray-800 text-gray-400 border-gray-700/60'
                                }`}>
                                  {dayDeals.length}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-baseline justify-between text-[11px]">
                              <span className={`font-black ${day.isToday ? 'text-white' : 'text-slate-200'}`}>
                                {day.formattedDate}
                              </span>
                              {dayAmount > 0 ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-400">
                                  {formatCurrency(dayAmount)}
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-gray-600">R$ 0</span>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Corpo da Grade: Agrupado por Estágios do Funil */}
                <tbody className="divide-y divide-gray-800/80 text-xs">
                  {columns.map(col => {
                    const stageAccent = getTimelineStageAccent(col.id);
                    const isCollapsed = collapsedTimelineStages.includes(col.id);
                    
                    // Deals deste estágio
                    const stageDeals = filteredDeals.filter(d => d.status === col.id);
                    const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

                    return (
                      <tr 
                        key={`timeline-stage-row-${col.id}`}
                        className={`transition-colors ${isCollapsed ? 'bg-[#12161f]/80' : 'hover:bg-gray-900/30'}`}
                      >
                        {/* Célula Lateral Esquerda: Cabeçalho Colapsável do Estágio */}
                        <td className="p-3 align-top sticky left-0 z-20 bg-[#161b22] border-r border-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleTimelineStage(col.id)}
                              className="flex items-center justify-between text-left group/btn w-full select-none"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-gray-400 group-hover/btn:text-white transition-colors">
                                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </span>
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stageAccent.barBg} ring-2 ring-transparent group-hover/btn:ring-white/20 transition-all`} />
                                <span className="font-bold text-xs text-white uppercase tracking-wider truncate group-hover/btn:text-primary transition-colors">
                                  {col.title}
                                </span>
                              </div>
                            </button>

                            <div className="flex items-center justify-between pl-5 text-[11px] text-gray-400">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageAccent.badgeBg} ${stageAccent.badgeText} ${stageAccent.borderLight}`}>
                                {stageDeals.length} {stageDeals.length === 1 ? 'card' : 'cards'}
                              </span>
                              {stageTotal > 0 && (
                                <span className="font-mono font-bold text-emerald-400 text-[10px]">
                                  {formatCurrency(stageTotal)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 7 Células dos Dias da Semana para este Estágio */}
                        {weekDays.map((day, dayIndex) => {
                          if (isCollapsed) {
                            return (
                              <td 
                                key={`stage-${col.id}-day-${dayIndex}`}
                                className={`p-2 border-r border-gray-800/40 last:border-r-0 ${
                                  day.isToday ? 'bg-primary/5' : ''
                                }`}
                              >
                                <div className="h-6 flex items-center justify-center">
                                  <span className="text-gray-700 text-xs">-</span>
                                </div>
                              </td>
                            );
                          }

                          // Deals deste estágio neste dia da semana
                          const dealsForCell = stageDeals.filter(deal => {
                            const rawDate = deal.expectedCloseDate || deal.updatedAt || deal.createdAt;
                            if (!rawDate) return false;
                            const d = new Date(rawDate);
                            return !isNaN(d.getTime()) && d.toDateString() === day.date.toDateString();
                          });

                          return (
                            <td
                              key={`stage-${col.id}-day-${dayIndex}`}
                              className={`p-2 align-top border-r border-gray-800/60 last:border-r-0 min-w-[145px] transition-colors ${
                                day.isToday ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex flex-col gap-1.5 min-h-[50px]">
                                {dealsForCell.length === 0 ? (
                                  <div className="flex-1 flex items-center justify-center py-2 text-gray-700">
                                    <span className="text-[11px] opacity-40 select-none">-</span>
                                  </div>
                                ) : (
                                  dealsForCell.map(deal => {
                                    const leadName = deal.contact?.name || deal.title || "Oportunidade";
                                    const hasPhone = !!deal.contact?.phone;

                                    return (
                                      <div
                                        key={`timeline-bar-${deal.id}`}
                                        onClick={() => handleOpenDeal(deal)}
                                        title={`${deal.title || 'Sem título'} | ${leadName} | ${col.title} | ${formatCurrency(Number(deal.value || 0))}`}
                                        className="relative flex items-center justify-between gap-1.5 pl-2.5 pr-2 py-1.5 rounded-lg bg-[#0d1117] hover:bg-[#1f2633] border border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-150 shadow-sm text-left group overflow-hidden"
                                      >
                                        {/* Barra lateral colorida do estágio */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${stageAccent.barBg}`} />

                                        {/* Nome do Lead / Título em destaque */}
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <span className="text-xs font-bold text-white group-hover:text-primary truncate transition-colors">
                                            {leadName}
                                          </span>
                                        </div>

                                        {/* Indicador de WhatsApp / Contato e Valor */}
                                        <div className="flex items-center gap-1 shrink-0">
                                          {hasPhone && (
                                            <span 
                                              className="text-[#25D366] flex items-center text-[10px] font-bold bg-[#25D366]/10 p-0.5 rounded"
                                              title={`WhatsApp: ${deal.contact.phone}`}
                                            >
                                              <MessageCircle size={10} className="text-[#25D366]" />
                                            </span>
                                          )}

                                          {deal.value && Number(deal.value) > 0 && (
                                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-800/30">
                                              {formatCurrency(Number(deal.value))}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA ETAPA (Mock) */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-sm rounded-xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95">
            <h2 className="text-lg font-bold text-white mb-4">Nova Etapa</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Nome da Etapa</label>
                <input type="text" className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-primary" placeholder="Ex: Demonstração" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {['bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'].map(color => (
                    <button key={color} className={`w-8 h-8 rounded-full ${color} cursor-pointer hover:scale-110 transition-transform ring-2 ring-transparent focus:ring-white`}></button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowStageModal(false)} className="text-gray-400 text-sm font-bold">Cancelar</button>
              <button onClick={() => { setShowStageModal(false); toast.success("Etapa Criada (Simulado)"); }} className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAR ETAPAS (Mock) */}
      {showManageStagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col p-6 animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-primary" /> Gerenciar Etapas do Funil
            </h2>
            <p className="text-xs text-gray-400 mb-4">Arraste para reordenar, ou altere as propriedades abaixo.</p>
            
            <div className="flex flex-col gap-2">
              {columns.map((col, idx) => (
                <div key={col.id} className="bg-[#25262c] border border-gray-800 rounded-lg p-3 flex items-center justify-between group cursor-move hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${col.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-sm font-bold text-white">{col.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-gray-800 rounded text-gray-400 hover:text-white" title="Alerta de estagnação">
                      <Clock size={14} />
                    </button>
                    {idx === columns.length - 2 && (
                       <button className="p-1.5 bg-green-500/10 rounded text-green-500" title="Marcar como Ganho">
                         <Target size={14} />
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowManageStagesModal(false)} className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-lg">Concluído</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Componente Isolado do Card no Kanban
function DealCard({ deal, index, col, onOpenDeal, setSelectedDeal, router }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contactTags = deal.contact?.tags || [];
  const primaryTag = contactTags.length > 0 ? contactTags[0] : null;

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          onClick={() => {
            if (onOpenDeal) {
              onOpenDeal(deal);
            } else {
              setSelectedDeal(deal);
            }
          }}
          className={`group relative flex flex-col gap-2.5 rounded-xl border border-slate-800/80 bg-[#161b22] p-4 text-slate-200 shadow-md transition-all hover:border-slate-700 cursor-pointer ${
            snapshot.isDragging ? `rotate-2 scale-[1.02] shadow-2xl transition-transform duration-150 z-50 ring-1 ${col.borderLight} bg-gray-800` : ''
          }`}
        >
          {/* CABEÇALHO: ID E BADGE */}
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono font-bold ${col.color}`}>
              #{deal.id?.split('-')[0]?.toUpperCase() || 'DEAL'}
            </span>
            {primaryTag ? (
              <span className={`rounded ${col.bgLight} border ${col.borderLight} px-2 py-0.5 text-[11px] font-bold ${col.color} uppercase`}>
                {primaryTag}
              </span>
            ) : (
              <span className={`rounded ${col.bgLight} border ${col.borderLight} px-2 py-0.5 text-[11px] font-bold ${col.color} uppercase`}>
                NOVO
              </span>
            )}
          </div>

          {/* AVATAR DO LEAD + NOME + TELEFONE */}
          <div className="flex flex-col mt-1">
            <div className="flex items-center gap-3">
              <div className={`flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-[#0d1117] text-sm font-bold shadow-sm ring-2 ${col.color.replace('text-', 'ring-')}/40 ${col.color.replace('500', '400').replace('600', '400')}`}>
                {deal.contact?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className={`text-[15px] font-bold leading-snug truncate group-hover:text-primary transition-colors ${col.color.replace('500', '400').replace('600', '400')}`}>
                  {deal.contact?.name || deal.title || "Nome do Contato"}
                </h4>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[#25D366]">🟢</span>
                  <span className="truncate">{deal.contact?.phone || "+55 00 00000-0000"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BADGE DE TIPO */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-1">
            <span className="text-emerald-400">•</span>
            <span>Lead</span>
          </div>

          {/* CAIXA CINZA DE METADADOS & ACCORDION */}
          <div className="rounded-lg bg-[#0d1117] p-3 text-xs text-slate-300 border border-slate-800/60" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-slate-200">ORIGEM: [{deal.contact?.source || 'ORGÂNICO'}]</p>
            <p className="font-semibold text-slate-400">FORMULÁRIO: VERSÁTIL</p>
            <p className="mt-1 text-slate-400 line-clamp-2">
              Lead recebido pelo formulário nativo da Meta Ads solicitando contato comercial urgente.
            </p>

            {/* CONTEÚDO EXPANSÍVEL */}
            {isExpanded && (
              <div className="mt-2.5 space-y-1.5 border-t border-slate-800/80 pt-2 text-slate-300 text-[11px] animate-in slide-in-from-top-2">
                <p className="font-bold text-slate-200">RESPOSTAS DO FORMULÁRIO:</p>
                <p>• <span className="text-slate-400">Qual modelo:</span> Versátil Tractor</p>
                <p>• <span className="text-slate-400">Cidade:</span> São Paulo - SP</p>
                <p>• <span className="text-slate-400">E-mail:</span> {deal.contact?.email || "contato@email.com"}</p>
              </div>
            )}

            {/* BOTÕES DO ACCORDION: MAIS / MENOS & COPIAR */}
            <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800/40">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>{isExpanded ? "⌃ Menos" : "⌵ Mais"}</span>
              </button>

              {isExpanded && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toast.success("Copiado!"); }}
                  className="group/btn flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Copy size={13} className="text-slate-500 group-hover/btn:text-slate-300 transition-colors" /> Copiar descrição
                </button>
              )}
            </div>
          </div>

          {/* BARRA DE FERRAMENTAS E AUDITORIA (HOVER DRAWER) */}
          <div className="max-h-0 opacity-0 group-hover:max-h-[100px] group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden flex flex-col gap-2 pt-0 group-hover:pt-2 border-t border-transparent group-hover:border-slate-800/40">
            <p className="text-[10px] text-slate-500 font-medium">
              Criado por {deal.assignedTo?.name || deal.assignee?.name || "Sistema"}.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <button 
                title="Enviar Mensagem / Ver Chat" 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const contactId = deal.contactId || deal.contact?.id;
                  if (contactId) {
                    router.push(`/inbox?contactId=${contactId}`);
                  } else if (onOpenDeal) {
                    onOpenDeal(deal, 'chat');
                  } else {
                    setSelectedDeal(deal);
                  }
                }} 
                className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <MessageSquare size={15} />
              </button>

              <button 
                title="Criar Evento / Reunião" 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenDeal) {
                    onOpenDeal(deal, 'event');
                  } else {
                    setSelectedDeal(deal);
                  }
                }} 
                className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Calendar size={15} />
              </button>

              <button 
                title="Criar Nova Tarefa" 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenDeal) {
                    onOpenDeal(deal, 'task');
                  } else {
                    setSelectedDeal(deal);
                  }
                }} 
                className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <CheckSquare size={15} />
              </button>

              <button
                title="Ir para Atendimento / Conversa"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const contactId = deal.contactId || deal.contact?.id;
                  if (contactId) {
                    router.push(`/inbox?contactId=${contactId}`);
                  } else {
                    router.push(`/inbox`);
                  }
                }}
                className="ml-auto rounded p-1.5 hover:bg-slate-700 hover:text-emerald-400 transition-colors"
              >
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>

          {/* VALOR EM VERDE DESTAQUE */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 bg-emerald-950/20 px-2.5 py-1 rounded-md border border-emerald-800/30 w-fit">
              <span>💲</span>
              <span>{deal.value ? `R$ ${Number(deal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"}</span>
            </div>
          </div>

          {/* RESPONSÁVEL / ASSIGNEE */}
          <div className="mt-1 flex items-center gap-2 border-t border-slate-800/40 pt-3">
            {(deal.assignedTo?.name || deal.assignee?.name) ? (
               <>
                 <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-md">
                   {(deal.assignedTo?.name || deal.assignee?.name)[0]}
                 </div>
                 <span className="text-[11px] text-slate-400 font-semibold truncate">
                   {deal.assignedTo?.name || deal.assignee?.name}
                 </span>
               </>
            ) : (
               <>
                 <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-300 shadow-md">
                   F
                 </div>
                 <span className="text-[11px] text-slate-400 font-semibold italic">
                   Fila Geral
                 </span>
               </>
            )}
          </div>

        </div>
      )}
    </Draggable>
  );
}

export default function CrmPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500 font-semibold">Carregando CRM...</div>}>
      <CrmContent />
    </Suspense>
  );
}