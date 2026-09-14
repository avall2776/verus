"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Search, Filter, MoreHorizontal, MessageCircle, Copy, FileText, 
  Maximize2, Minimize2, Activity, Users, Building, LayoutDashboard, 
  Plus, Settings, DollarSign, Target, ChevronDown, ChevronUp, Calendar, 
  CheckSquare, ArrowRight, Clock, MessageSquare, ArrowUpRight, 
  Kanban as KanbanIcon, Table as TableIcon, CalendarDays, ChevronLeft, 
  ChevronRight, X, User as UserIcon, Phone, Mail, Check
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

export default function CrmPage() {
  const router = useRouter();
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
  
  // Tabela: estágios colapsados
  const [collapsedTableStages, setCollapsedTableStages] = useState<string[]>([]);
  
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
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_columns_widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

  const handleUpdateDeal = async (dealId: string, data: any) => {
    try {
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
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
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

      return true;
    });
  }, [deals, searchQuery, activeTab, currentUser]);

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
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
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

  if (loading) return <div className="p-8 text-gray-500 font-semibold">Carregando CRM...</div>;

  return (
    <div className={`flex flex-col gap-4 relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0d1117] p-4 h-screen w-screen overflow-hidden' : 'h-full w-full'}`}>
      <DealModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
        onUpdate={handleUpdateDeal}
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

      {/* Toolbar Superior */}
      <div className="bg-[#1c1d22] border border-gray-800 rounded-xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Seletor de Funil */}
          <div className="flex items-center gap-2.5 pr-3 border-r border-gray-800">
            <LayoutDashboard className="text-primary" size={22} />
            <select className="bg-transparent text-white font-bold text-base outline-none cursor-pointer appearance-none">
              <option value="main">Funil Principal (Padrão)</option>
              <option value="sales">Vendas B2B</option>
            </select>
          </div>
          
          {/* SELETORES DE VISUALIZAÇÃO: QUADRO | TABELA | LINHA DO TEMPO */}
          <div className="flex bg-[#0B1224] rounded-lg p-1 border border-gray-800 shadow-inner">
            <button
              id="view-mode-kanban-btn"
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <KanbanIcon size={14} />
              <span>Quadro</span>
            </button>

            <button
              id="view-mode-table-btn"
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
              title="Visualização em Tabela Densa"
            >
              <TableIcon size={14} />
              <span>Tabela</span>
            </button>

            <button
              id="view-mode-timeline-btn"
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
              title="Visualização em Linha do Tempo Semanal"
            >
              <CalendarDays size={14} />
              <span>Linha do Tempo</span>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-800 hidden sm:block"></div>

          {/* FILTROS POR CATEGORIA: TUDO | MINHAS | CONTATOS | EMPRESAS */}
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 overflow-x-auto max-w-full">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-gray-700 text-white shadow font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* LADO DIREITO: BUSCA + BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
          {/* Campo de Busca Reativo */}
          <div className="relative flex-1 sm:w-56 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              id="crm-search-input"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar oportunidade..." 
              className="bg-[#0B1224] border border-gray-800 rounded-full pl-9 pr-8 py-1.5 text-xs text-text-primary outline-none focus:border-primary w-full transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
          
          <button 
            type="button"
            onClick={() => setNeutralMode(!neutralMode)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
              neutralMode ? 'bg-gray-100 text-black border-gray-100' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            Neutro
          </button>
          
          <div className="h-6 w-px bg-gray-800 hidden sm:block"></div>

          <button 
            type="button"
            onClick={() => setShowStageModal(true)} 
            className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <Plus size={14}/> Nova Etapa
          </button>
          
          <button 
            type="button"
            onClick={() => setShowManageStagesModal(true)} 
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
          >
            <Settings size={14}/> Gerenciar Etapas
          </button>

          <button 
            type="button"
            title="Expanda o CRM em tela cheia"
            onClick={toggleFullscreen} 
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 p-2 rounded-full transition-all flex items-center justify-center shrink-0"
          >
            {isFullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
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
      {/* 2. VISÃO EM TABELA DO CRM (Densa e agrupada por estágios)                 */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="flex-1 flex flex-col bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in-50 duration-200">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f141c] border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-[280px]">Título da Oportunidade</th>
                  <th className="py-3 px-4 w-[220px]">Contato</th>
                  <th className="py-3 px-4">Descrição / Detalhes</th>
                  <th className="py-3 px-4 w-[160px]">Responsável</th>
                  <th className="py-3 px-4 w-[140px] text-right">Valor (R$)</th>
                  <th className="py-3 px-4 w-[160px]">Última Interação</th>
                  <th className="py-3 px-4 w-[130px]">Criação</th>
                  <th className="py-3 px-4 w-[80px] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {columns.map(col => {
                  const stageDeals = filteredDeals.filter(d => d.status === col.id);
                  const isCollapsed = collapsedTableStages.includes(col.id);
                  const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

                  return (
                    <React.Fragment key={`table-stage-${col.id}`}>
                      {/* Linha Cabeçalho do Estágio */}
                      <tr 
                        onClick={() => toggleTableStage(col.id)}
                        className="bg-[#1c2128] hover:bg-[#222832] cursor-pointer transition-colors border-t border-b border-gray-800"
                      >
                        <td colSpan={8} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-gray-400">
                                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                              </span>
                              <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`}></div>
                              <span className="font-extrabold text-white uppercase tracking-wider text-xs">
                                {col.title}
                              </span>
                              <span className="bg-gray-800/80 border border-gray-700 text-gray-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {stageDeals.length} {stageDeals.length === 1 ? 'oportunidade' : 'oportunidades'}
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
                                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                              >
                                <Plus size={13} /> Nova Oportunidade
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Linhas das Oportunidades do Estágio */}
                      {!isCollapsed && stageDeals.length === 0 && (
                        <tr className="bg-[#12161f]/40">
                          <td colSpan={8} className="py-4 px-8 text-gray-500 italic text-center">
                            Nenhuma oportunidade nesta etapa.
                          </td>
                        </tr>
                      )}

                      {!isCollapsed && stageDeals.map(deal => {
                        const assigneeName = deal.assignedTo?.name || deal.assignee?.name;
                        return (
                          <tr 
                            key={deal.id}
                            onClick={() => setSelectedDeal(deal)}
                            className="hover:bg-[#1f2530] transition-colors cursor-pointer group"
                          >
                            {/* Título */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-100 group-hover:text-primary transition-colors text-sm">
                                  {deal.title || "Sem título"}
                                </span>
                                <span className="text-[11px] font-mono text-gray-500">
                                  #{deal.id.split('-')[0].toUpperCase()}
                                </span>
                              </div>
                            </td>

                            {/* Contato */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs text-gray-200 shrink-0">
                                  {deal.contact?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-slate-200 truncate">
                                    {deal.contact?.name || "Contato não informado"}
                                  </span>
                                  {deal.contact?.phone && (
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                      <Phone size={10} className="text-emerald-500" />
                                      {deal.contact.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Descrição */}
                            <td className="py-3 px-4 max-w-[320px]">
                              <span className="text-gray-400 line-clamp-1">
                                {deal.notes || deal.description || "Lead recebido pelo formulário nativo Meta Ads"}
                              </span>
                            </td>

                            {/* Responsável */}
                            <td className="py-3 px-4">
                              {assigneeName ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                                    {assigneeName[0].toUpperCase()}
                                  </div>
                                  <span className="text-slate-300 font-medium truncate">
                                    {assigneeName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic text-[11px]">Fila Geral</span>
                              )}
                            </td>

                            {/* Valor (R$) */}
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-xs">
                                {formatCurrency(Number(deal.value || 0))}
                              </span>
                            </td>

                            {/* Última Interação */}
                            <td className="py-3 px-4 text-gray-400">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock size={12} className="text-gray-500" />
                                {formatRelativeTime(deal.updatedAt || deal.createdAt)}
                              </span>
                            </td>

                            {/* Criação */}
                            <td className="py-3 px-4 text-gray-400 text-[11px]">
                              {formatDate(deal.createdAt)}
                            </td>

                            {/* Ações Rápidas */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  title="Abrir no WhatsApp"
                                  onClick={() => router.push(`/inbox?contactId=${deal.contactId}`)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-950/40 text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                  <MessageSquare size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Ver Detalhes"
                                  onClick={() => setSelectedDeal(deal)}
                                  className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                >
                                  <ArrowUpRight size={14} />
                                </button>
                              </div>
                            </td>
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
      )}

      {/* ========================================================================= */}
      {/* 3. VISÃO EM LINHA DO TEMPO (TIMELINE SEMANAL)                             */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div className="flex-1 flex flex-col gap-4 animate-in fade-in-50 duration-200 overflow-hidden">
          {/* Barra de Navegação do Período Semanal */}
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
                title="Semana Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={handleTodayWeek}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-colors border border-gray-700 flex items-center gap-1.5"
              >
                <Calendar size={13} className="text-primary" />
                <span>Hoje</span>
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
                title="Próxima Semana"
              >
                <ChevronRight size={16} />
              </button>

              <div className="h-5 w-px bg-gray-800 mx-1"></div>

              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CalendarDays size={16} className="text-primary" />
                <span className="capitalize">{timelineWeekLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="bg-[#0B1224] border border-gray-800 px-3 py-1 rounded-full font-semibold">
                <span className="text-white font-bold">{filteredDeals.length}</span> oportunidades no pipeline
              </span>
            </div>
          </div>

          {/* Grid de 7 Colunas Semanais (Domingo a Sábado) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-y-auto custom-scrollbar pb-4">
            {weekDays.map((day, dayIndex) => {
              // Filtrar os deals que correspondem a este dia da semana
              const dealsForDay = filteredDeals.filter(deal => {
                // Prioriza expectedCloseDate, depois updatedAt, depois createdAt
                const rawDate = deal.expectedCloseDate || deal.updatedAt || deal.createdAt;
                if (!rawDate) return false;
                const d = new Date(rawDate);
                if (isNaN(d.getTime())) return false;
                return d.toDateString() === day.date.toDateString();
              });

              const dayTotal = dealsForDay.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

              return (
                <div 
                  key={`day-col-${dayIndex}`}
                  className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[380px] bg-[#161b22] ${
                    day.isToday 
                      ? 'border-primary/60 shadow-lg shadow-primary/5 ring-1 ring-primary/30' 
                      : 'border-gray-800'
                  }`}
                >
                  {/* Cabeçalho do Dia */}
                  <div className={`p-3 border-b flex flex-col gap-1 rounded-t-xl ${
                    day.isToday 
                      ? 'bg-primary/10 border-primary/40' 
                      : 'bg-[#1c2128] border-gray-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${
                        day.isToday ? 'text-primary' : 'text-gray-400'
                      }`}>
                        {day.dayName}
                      </span>
                      {day.isToday && (
                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Hoje
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                      <span className={`text-lg font-black ${
                        day.isToday ? 'text-white' : 'text-slate-200'
                      }`}>
                        {day.formattedDate}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400">
                        {dealsForDay.length} {dealsForDay.length === 1 ? 'card' : 'cards'}
                      </span>
                    </div>

                    {dayTotal > 0 && (
                      <span className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                        {formatCurrency(dayTotal)}
                      </span>
                    )}
                  </div>

                  {/* Lista de Oportunidades do Dia */}
                  <div className="flex-1 p-2.5 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
                    {dealsForDay.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500">
                        <Clock size={20} className="mb-2 opacity-40" />
                        <span className="text-xs italic">Sem atividades</span>
                      </div>
                    ) : (
                      dealsForDay.map(deal => {
                        const colInfo = columns.find(c => c.id === deal.status) || columns[0];
                        const assigneeName = deal.assignedTo?.name || deal.assignee?.name;

                        return (
                          <div
                            key={`timeline-card-${deal.id}`}
                            onClick={() => setSelectedDeal(deal)}
                            className="bg-[#0f141c] hover:bg-[#1a202c] border border-gray-800 hover:border-gray-700 p-3 rounded-lg cursor-pointer transition-all shadow-sm flex flex-col gap-2 group"
                          >
                            {/* Tag do Estágio */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${colInfo.bgLight} ${colInfo.color} border ${colInfo.borderLight}`}>
                                {colInfo.title}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500">
                                #{deal.id.split('-')[0].toUpperCase()}
                              </span>
                            </div>

                            {/* Título */}
                            <h4 className="font-bold text-xs text-white group-hover:text-primary transition-colors line-clamp-2">
                              {deal.title || "Sem título"}
                            </h4>

                            {/* Contato */}
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                              <UserIcon size={12} className="text-gray-500 shrink-0" />
                              <span className="truncate">{deal.contact?.name || "Contato"}</span>
                            </div>

                            {/* Valor e Responsável */}
                            <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 mt-1">
                              <span className="font-mono font-bold text-emerald-400 text-xs">
                                {formatCurrency(Number(deal.value || 0))}
                              </span>
                              
                              {assigneeName ? (
                                <div className="flex items-center gap-1" title={`Responsável: ${assigneeName}`}>
                                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[8px] flex items-center justify-center">
                                    {assigneeName[0].toUpperCase()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-500 italic">Fila</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
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
function DealCard({ deal, index, col, setSelectedDeal, router }: any) {
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
          onClick={() => setSelectedDeal(deal)}
          className={`group relative flex flex-col gap-2.5 rounded-xl border border-slate-800/80 bg-[#161b22] p-4 text-slate-200 shadow-md transition-all hover:border-slate-700 cursor-pointer ${
            snapshot.isDragging ? `rotate-2 scale-[1.02] shadow-2xl transition-transform duration-150 z-50 ring-1 ${col.borderLight} bg-gray-800` : ''
          }`}
        >
          {/* CABEÇALHO: ID E BADGE */}
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono font-bold ${col.color}`}>
              #{deal.id.split('-')[0].toUpperCase()}
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
                <h4 className={`text-[15px] font-bold leading-snug truncate ${col.color.replace('500', '400').replace('600', '400')}`}>
                  {deal.contact?.name || "Nome do Contato"}
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
              <button title="Enviar Mensagem" onClick={(e) => e.stopPropagation()} className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"><MessageSquare size={15} /></button>
              <button title="Criar Evento" onClick={(e) => e.stopPropagation()} className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"><Calendar size={15} /></button>
              <button title="Criar Tarefa" onClick={(e) => e.stopPropagation()} className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"><CheckSquare size={15} /></button>
              <button
                title="Ir para Atendimento"
                onClick={(e) => { e.stopPropagation(); router.push(`/inbox?contactId=${deal.contactId}`); }}
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