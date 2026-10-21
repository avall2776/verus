"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Settings,
  Calendar,
  CheckSquare,
  Maximize2,
  Minimize2,
  Activity,
  FileText,
  Users,
  Building,
  Kanban as KanbanIcon,
  Table as TableIcon,
  CalendarDays,
  Copy,
  MessageSquare,
  ArrowUpRight,
  Edit2,
  Trash2,
  Video,
  Layers,
  Image as ImageIcon,
  Flame,
  User as UserIcon,
  Columns,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  Play,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { MarketingCardItem, MarketingClientItem, TeamMember } from "./types";
import { getDriveThumbnailUrl, detectMediaType } from "@/lib/googleDriveHelper";

export const DEFAULT_MARKETING_COLUMNS = [
  { id: "BACKLOG", title: "Backlog", color: "text-gray-400", bgLight: "bg-gray-500/10", borderLight: "border-gray-500/30", borderColor: "border-t-gray-500" },
  { id: "PLANEJAMENTO", title: "Planejamento / Copy", color: "text-blue-500", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/30", borderColor: "border-t-blue-500" },
  { id: "DESIGN_VIDEO", title: "Design & Vídeo", color: "text-purple-500", bgLight: "bg-purple-500/10", borderLight: "border-purple-500/30", borderColor: "border-t-purple-500" },
  { id: "REVISAO_INTERNA", title: "Revisão Interna", color: "text-yellow-500", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/30", borderColor: "border-t-yellow-500" },
  { id: "APROVACAO_CLIENTE", title: "Aprovação Cliente", color: "text-orange-500", bgLight: "bg-orange-500/10", borderLight: "border-orange-500/30", borderColor: "border-t-orange-500" },
  { id: "AGENDADO_POSTADO", title: "Agendado / Postado", color: "text-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/30", borderColor: "border-t-emerald-500" },
];

type ViewMode = "kanban" | "table" | "timeline";

interface Props {
  cards: MarketingCardItem[];
  clients: MarketingClientItem[];
  teamMembers?: TeamMember[];
  currentUser?: any;
  onOpenCardModal: (card?: MarketingCardItem, defaultStatus?: string) => void;
  onCardMoved: (cardId: string, newStatus: string, newPosition: number) => void;
  onRefresh?: () => void;
}

function getSundayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

export default function MarketingKanban({
  cards,
  clients,
  teamMembers = [],
  currentUser,
  onOpenCardModal,
  onCardMoved,
  onRefresh,
}: Props) {
  // Colunas do Kanban
  const [columns, setColumns] = useState<any[]>(DEFAULT_MARKETING_COLUMNS);
  const [collapsedCols, setCollapsedCols] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [neutralMode, setNeutralMode] = useState(false);

  // Modos de visualização e filtros
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [activeTab, setActiveTab] = useState<string>("all"); // 'all' | 'mine' | 'clients' | 'formats'
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>("all");

  // Nome do Funil Editável
  const [funnelName, setFunnelName] = useState<string>("Operações de Marketing (Kanban)");
  const [isEditingFunnel, setIsEditingFunnel] = useState<boolean>(false);
  const [tempFunnelName, setTempFunnelName] = useState<string>("Operações de Marketing (Kanban)");

  // Tela cheia
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modais de gerenciamento de etapas
  const [showStageModal, setShowStageModal] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageColor, setNewStageColor] = useState("text-blue-500");
  const [showManageStagesModal, setShowManageStagesModal] = useState(false);

  // Tabela: ordenação e colunas visíveis
  type TableSortField = "title" | "client" | "format" | "assignee" | "dueDate" | "status" | "createdAt";
  const [sortField, setSortField] = useState<TableSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    title: true,
    client: true,
    format: true,
    assignee: true,
    dueDate: true,
    status: true,
    createdAt: true,
  });

  // Linha do Tempo
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => getSundayOfWeek(new Date()));

  // Carregar configurações locais
  useEffect(() => {
    const savedCols = localStorage.getItem("marketing_kanban_columns");
    if (savedCols) {
      try {
        setColumns(JSON.parse(savedCols));
      } catch {
        setColumns(DEFAULT_MARKETING_COLUMNS);
      }
    }
    const savedWidths = localStorage.getItem("marketing_columns_widths");
    if (savedWidths) {
      try {
        setColumnWidths(JSON.parse(savedWidths));
      } catch {}
    }
    const savedName = localStorage.getItem("marketing_funnel_name");
    if (savedName) {
      setFunnelName(savedName);
      setTempFunnelName(savedName);
    }
  }, []);

  const handleSaveFunnelName = () => {
    if (!tempFunnelName.trim()) {
      toast.error("O nome do funil não pode ser vazio.");
      return;
    }
    const newName = tempFunnelName.trim();
    setFunnelName(newName);
    localStorage.setItem("marketing_funnel_name", newName);
    setIsEditingFunnel(false);
    toast.success("Nome do funil atualizado com sucesso!");
  };

  const toggleColumn = (colId: string) => {
    setCollapsedCols((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Redimensionamento de Colunas
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const currentW = columnWidths[colId] || 300;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(240, Math.min(500, currentW + delta));
      setColumnWidths((prev) => {
        const next = { ...prev, [colId]: newWidth };
        localStorage.setItem("marketing_columns_widths", JSON.stringify(next));
        return next;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Filtragem dos Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // 1. Busca por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = card.title?.toLowerCase().includes(q);
        const matchClient = card.marketingClient?.name?.toLowerCase().includes(q);
        const matchFormat = card.format?.toLowerCase().includes(q);
        const matchAssignee = card.assignedUser?.name?.toLowerCase().includes(q);
        const matchNotes = card.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchFormat && !matchAssignee && !matchNotes) {
          return false;
        }
      }

      // 2. Abas rápidas
      if (activeTab === "mine") {
        if (!currentUser?.id || card.assignedUserId !== currentUser.id) return false;
      }

      // 3. Filtro de Cliente
      if (selectedClientFilter !== "all" && card.marketingClientId !== selectedClientFilter) {
        return false;
      }

      // 4. Filtro de Formato
      if (selectedFormatFilter !== "all" && card.format !== selectedFormatFilter) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, activeTab, currentUser?.id, selectedClientFilter, selectedFormatFilter]);

  // Drag & Drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    onCardMoved(draggableId, destination.droppableId, destination.index);
  };

  // Adicionar Nova Etapa
  const handleAddStage = () => {
    if (!newStageTitle.trim()) {
      toast.error("Informe o título da etapa.");
      return;
    }
    const newId = newStageTitle.trim().toUpperCase().replace(/\s+/g, "_");
    if (columns.some((c) => c.id === newId)) {
      toast.error("Já existe uma etapa com identificador similar.");
      return;
    }

    const newCol = {
      id: newId,
      title: newStageTitle.trim(),
      color: newStageColor,
      bgLight: "bg-blue-500/10",
      borderLight: "border-blue-500/30",
      borderColor: "border-t-blue-500",
    };

    const next = [...columns, newCol];
    setColumns(next);
    localStorage.setItem("marketing_kanban_columns", JSON.stringify(next));
    setShowStageModal(false);
    setNewStageTitle("");
    toast.success("Etapa adicionada com sucesso!");
  };

  // Excluir Etapa
  const handleDeleteStage = (stageId: string) => {
    if (columns.length <= 1) {
      toast.error("Você precisa manter pelo menos uma etapa.");
      return;
    }
    const next = columns.filter((c) => c.id !== stageId);
    setColumns(next);
    localStorage.setItem("marketing_kanban_columns", JSON.stringify(next));
    toast.success("Etapa removida.");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  return (
    <div className="flex-1 flex flex-col gap-3 h-full min-h-[600px]">
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR IDÊNTICA AO CRM COMERCIAL                                  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#161b22] border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Esquerda: Nome do Funil Editável + Seletores de Visualização */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Nome do Funil Editável */}
          <div className="flex items-center gap-2 group">
            {isEditingFunnel ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={tempFunnelName}
                  onChange={(e) => setTempFunnelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveFunnelName();
                    if (e.key === "Escape") setIsEditingFunnel(false);
                  }}
                  className="bg-white dark:bg-[#0B1224] border border-primary text-white text-sm font-bold px-2 py-1 rounded-md outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveFunnelName}
                  className="bg-primary text-white p-1 rounded hover:bg-primary/80 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingFunnel(false)}
                  className="text-gray-400 hover:text-white p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {funnelName}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setTempFunnelName(funnelName);
                    setIsEditingFunnel(true);
                  }}
                  className="text-gray-500 hover:text-primary transition-colors p-1 rounded opacity-70 group-hover:opacity-100"
                  title="Editar nome do funil"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-800 shrink-0 hidden sm:block" />

          {/* Botões de Visualização: Quadro, Tabela e Linha do Tempo */}
          <div className="flex bg-slate-100 dark:bg-[#0d1117] rounded-lg p-0.5 border border-gray-800">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-primary text-white shadow font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <KanbanIcon size={13} />
              <span>Quadro</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-primary text-white shadow font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <TableIcon size={13} />
              <span>Tabela</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "timeline"
                  ? "bg-primary text-white shadow font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CalendarDays size={13} />
              <span>Linha do Tempo</span>
            </button>
          </div>
        </div>

        {/* Centro: Campo de Busca com Ícone */}
        <div className="flex-1 max-w-xs min-w-[200px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar demandas ou peças..."
              className="w-full bg-slate-100 dark:bg-[#0d1117] border border-gray-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={12} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>

        {/* Direita: Filtros Rápidos & Ações da Barra */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pílulas de Filtro Rápido */}
          <div className="flex bg-slate-100 dark:bg-[#0d1117] rounded-lg p-0.5 border border-gray-800 shrink-0">
            {[
              { id: "all", label: "Tudo", icon: Activity },
              { id: "mine", label: "Minhas", icon: FileText },
              { id: "clients", label: "Clientes", icon: Users },
              { id: "formats", label: "Formatos", icon: Layers },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "all") {
                    setSelectedClientFilter("all");
                    setSelectedFormatFilter("all");
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gray-800 text-white shadow font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon size={12} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-800 shrink-0 hidden sm:block" />

          {/* Botão Neutro */}
          <button
            type="button"
            onClick={() => setNeutralMode(!neutralMode)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all whitespace-nowrap ${
              neutralMode
                ? "bg-gray-100 text-black border-gray-100"
                : "bg-slate-100 dark:bg-[#0d1117] text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
            }`}
          >
            Neutro
          </button>

          {/* Botão Nova Etapa */}
          <button
            type="button"
            onClick={() => setShowStageModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
          >
            <Plus size={13} />
            <span>Nova Etapa</span>
          </button>

          {/* Botão Gerenciar Etapas */}
          <button
            type="button"
            onClick={() => setShowManageStagesModal(true)}
            className="bg-slate-100 dark:bg-[#0d1117] hover:bg-gray-800 text-gray-300 border border-gray-800 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap hover:text-white"
          >
            <Settings size={13} />
            <span className="hidden sm:inline">Gerenciar Etapas</span>
          </button>

          {/* Botão Tela Cheia */}
          <button
            type="button"
            title={isFullscreen ? "Sair da tela cheia" : "Expandir em tela cheia"}
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
              isFullscreen
                ? "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30"
                : "bg-slate-100 dark:bg-[#0d1117] hover:bg-gray-800 text-gray-300 border-gray-800 hover:text-white"
            }`}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VISÃO EM QUADRO (KANBAN) - IDÊNTICA AO CRM COMERCIAL                    */}
      {/* ========================================================================= */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex gap-2.5 overflow-x-auto pb-4 custom-scrollbar items-start min-h-[550px]">
            {columns.map((col, idx) => {
              const isCollapsed = collapsedCols.includes(col.id);
              const columnCards = filteredCards.filter((c) => c.status === col.id);
              const totalValue = columnCards.reduce((sum, c) => sum + (c.value ? Number(c.value) : 0), 0);

              const colColorClass = neutralMode ? "text-gray-300" : col.color;
              const borderTopClass = neutralMode ? "border-t-gray-600" : col.borderColor;

              return (
                <React.Fragment key={col.id}>
                  <div
                    className="flex flex-col h-full shrink-0 transition-all duration-300 ease-out"
                    style={{ width: isCollapsed ? "60px" : `${columnWidths[col.id] || 310}px` }}
                  >
                    {isCollapsed ? (
                      /* Coluna Colapsada (Faixa Vertical com Título a -90 Graus) */
                      <div
                        onClick={() => toggleColumn(col.id)}
                        className={`w-full h-full flex-shrink-0 flex flex-col bg-white dark:bg-[#1c1d22] border border-gray-800 border-t-2 ${borderTopClass} rounded-xl items-center py-4 cursor-pointer hover:bg-gray-800/50 transition-colors group min-h-[500px]`}
                      >
                        <button className="text-gray-500 group-hover:text-white mb-6">
                          <Maximize2 size={16} />
                        </button>
                        <div className="flex-1 relative w-full">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top-left -rotate-90 whitespace-nowrap font-bold text-sm text-gray-500 tracking-widest uppercase">
                            {col.title} ({columnCards.length})
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Coluna Expandida com Header e Cards */
                      <div className="w-full shrink-0 flex flex-col h-full gap-3">
                        {/* Header da Coluna (Limpo: apenas Título e Badge de contagem) */}
                        <div
                          className={`p-3.5 rounded-xl border border-gray-800 bg-white dark:bg-[#1c1d22] border-t-2 ${borderTopClass} flex items-center justify-between shadow-sm shrink-0`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className={`text-xs font-bold uppercase tracking-wider truncate ${colColorClass}`}>
                              {col.title}
                            </h3>
                            <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0">
                              {columnCards.length} cards
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleColumn(col.id)}
                              className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
                              title="Recolher coluna"
                            >
                              <Minimize2 size={13} strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>

                        {/* Área Droppable */}
                        <Droppable droppableId={col.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 flex flex-col gap-3 overflow-y-auto rounded-xl p-1 transition-all duration-200 ease-out custom-scrollbar min-h-[350px] ${
                                snapshot.isDraggingOver
                                  ? `border-2 border-dashed ${col.borderColor.replace("border-t-", "border-")}/50 bg-slate-900/40`
                                  : "border-2 border-transparent"
                              }`}
                            >
                              {columnCards.map((card, index) => (
                                <MarketingKanbanCard
                                  key={card.id}
                                  card={card}
                                  index={index}
                                  col={col}
                                  onOpenCard={() => onOpenCardModal(card)}
                                />
                              ))}
                              {provided.placeholder}

                              {/* Botão Adicionar Novo Cartão no Rodapé da Coluna */}
                              <button
                                type="button"
                                onClick={() => onOpenCardModal(undefined, col.id)}
                                className="mt-auto shrink-0 w-full bg-white dark:bg-[#161b22] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Plus size={16} /> Adicionar novo cartão
                              </button>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </div>

                  {/* Resizer Handle Entre Colunas */}
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
      {/* 2. VISÃO EM TABELA (DENSA E ALINHADA AO CRM COMERCIAL)                     */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1c2128] border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Demanda / Título</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Formato</th>
                  <th className="py-3 px-4">Etapa</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Prazo Entrega</th>
                  <th className="py-3 px-4 text-right">Checklist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      Nenhuma demanda encontrada com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => {
                    const col = columns.find((c) => c.id === card.status) || columns[0];
                    const completed = (card.checklist || []).filter((i) => i.completed).length;
                    const total = (card.checklist || []).length;
                    return (
                      <tr
                        key={card.id}
                        onClick={() => onOpenCardModal(card)}
                        className="hover:bg-[#1f242d] cursor-pointer transition-colors text-slate-300"
                      >
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${col?.color?.replace("text-", "bg-") || "bg-cyan-400"}`} />
                          <span className="truncate max-w-[280px]">{card.title}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200">
                            {card.marketingClient?.name || "Cliente"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">
                            {card.format}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${col?.bgLight} ${col?.color} border ${col?.borderLight} uppercase`}>
                            {col?.title || card.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {card.assignedUser?.name || "Fila da Agência"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {card.dueDate ? new Date(card.dueDate).toLocaleDateString("pt-BR") : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px]">
                          {total > 0 ? (
                            <span className={completed === total ? "text-emerald-400 font-bold" : "text-slate-400"}>
                              {completed}/{total}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISÃO EM LINHA DO TEMPO (CALENDÁRIO DA SEMANA)                          */}
      {/* ========================================================================= */}
      {viewMode === "timeline" && (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#161b22] border border-gray-800 rounded-xl p-4 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>Cronograma da Semana</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(timelineStartDate);
                  d.setDate(d.getDate() - 7);
                  setTimelineStartDate(d);
                }}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#0d1117] border border-gray-800 text-xs text-gray-300 hover:text-white"
              >
                Semana Anterior
              </button>
              <button
                type="button"
                onClick={() => setTimelineStartDate(getSundayOfWeek(new Date()))}
                className="px-2.5 py-1 rounded bg-primary text-white text-xs font-bold"
              >
                Esta Semana
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(timelineStartDate);
                  d.setDate(d.getDate() + 7);
                  setTimelineStartDate(d);
                }}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#0d1117] border border-gray-800 text-xs text-gray-300 hover:text-white"
              >
                Próxima Semana
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 flex-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const dayDate = new Date(timelineStartDate);
              dayDate.setDate(dayDate.getDate() + i);
              const dayStr = dayDate.toISOString().substring(0, 10);
              const dayCards = filteredCards.filter(
                (c) => c.dueDate?.substring(0, 10) === dayStr || c.publishDate?.substring(0, 10) === dayStr
              );

              return (
                <div
                  key={i}
                  className="bg-slate-100 dark:bg-[#0d1117] border border-gray-800/80 rounded-xl p-2.5 flex flex-col min-h-[300px]"
                >
                  <div className="text-center pb-2 border-b border-gray-800 mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      {dayDate.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {dayDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                    {dayCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onOpenCardModal(card)}
                        className="p-2 rounded-lg bg-white dark:bg-[#161b22] border border-gray-800 hover:border-cyan-500/50 cursor-pointer transition-colors shadow-sm text-xs"
                      >
                        <span className="font-bold text-white truncate block">{card.title}</span>
                        <span className="text-[10px] text-cyan-400 block truncate">
                          {card.marketingClient?.name || "Cliente"}
                        </span>
                      </div>
                    ))}
                    {dayCards.length === 0 && (
                      <span className="text-[10px] text-gray-600 block text-center pt-8">
                        Livre
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA ETAPA (PADRÃO CRM)                                            */}
      {/* ========================================================================= */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">Criar Nova Etapa no Funil</h3>
              <button
                type="button"
                onClick={() => setShowStageModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1">Título da Etapa</label>
              <input
                type="text"
                value={newStageTitle}
                onChange={(e) => setNewStageTitle(e.target.value)}
                placeholder="Ex: Aprovação de Mídia, Gravação..."
                className="w-full bg-slate-100 dark:bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1">Cor do Destaque</label>
              <select
                value={newStageColor}
                onChange={(e) => setNewStageColor(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              >
                <option value="text-blue-500">Azul</option>
                <option value="text-purple-500">Roxo</option>
                <option value="text-cyan-500">Ciano</option>
                <option value="text-yellow-500">Amarelo</option>
                <option value="text-emerald-500">Verde</option>
                <option value="text-rose-500">Rosa</option>
                <option value="text-gray-400">Cinza</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowStageModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddStage}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs"
              >
                Criar Etapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR ETAPAS (PADRÃO CRM)                                       */}
      {/* ========================================================================= */}
      {showManageStagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161b22] border border-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">Gerenciar Etapas do Funil</h3>
              <button
                type="button"
                onClick={() => setShowManageStagesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
              {columns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-[#0d1117] border border-gray-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.color.replace("text-", "bg-")}`} />
                    <span className="font-bold text-white uppercase">{c.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStage(c.id)}
                    className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                    title="Excluir etapa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowManageStagesModal(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE ISOLADO DO CARD NO KANBAN (IDÊNTICO AO DealCard DO CRM COMERCIAL)
// =============================================================================
function MarketingKanbanCard({
  card,
  index,
  col,
  onOpenCard,
}: {
  card: MarketingCardItem;
  index: number;
  col: any;
  onOpenCard: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityLabel = card.priority || "MEDIA";
  const completedChecklist = (card.checklist || []).filter((i) => i.completed).length;
  const totalChecklist = (card.checklist || []).length;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          onClick={onOpenCard}
          className={`group relative flex flex-col gap-2.5 rounded-xl border border-slate-800/80 bg-white dark:bg-[#161b22] p-4 text-slate-200 shadow-md transition-all hover:border-slate-700 cursor-pointer ${
            snapshot.isDragging
              ? `rotate-2 scale-[1.02] shadow-2xl transition-transform duration-150 z-50 ring-1 ${col.borderLight} bg-gray-800`
              : ""
          }`}
        >
          {/* CABEÇALHO: ID E BADGE */}
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono font-bold ${col.color}`}>
              #{card.id?.split("-")[0]?.toUpperCase() || "DEMANDA"}
            </span>
            <span
              className={`rounded ${col.bgLight} border ${col.borderLight} px-2 py-0.5 text-[11px] font-bold ${col.color} uppercase`}
            >
              {priorityLabel}
            </span>
          </div>

          {/* AVATAR DO CLIENTE + TÍTULO DA PEÇA + SUBTÍTULO */}
          <div className="flex flex-col mt-1">
            <div className="flex items-center gap-3">
              <div
                className={`flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-[#0d1117] text-sm font-bold shadow-sm ring-2 ${col.color.replace("text-", "ring-")}/40 ${col.color}`}
              >
                {card.marketingClient?.name?.[0]?.toUpperCase() || card.title?.[0]?.toUpperCase() || "M"}
              </div>
              <div className="flex flex-col min-w-0">
                <h4
                  className={`text-[15px] font-bold leading-snug truncate group-hover:text-primary transition-colors ${col.color.replace("500", "400").replace("600", "400")}`}
                >
                  {card.title || "Demanda sem título"}
                </h4>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block" />
                  <span className="truncate">
                    {card.marketingClient?.contactPhone || card.marketingClient?.name || "Cliente Agência"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VISUALIZAÇÃO DIRETA DA MÍDIA / THUMBNAIL DO GOOGLE DRIVE */}
          {(() => {
            const mediaAtt = (card.attachments || []).find((a) => a.url);
            const mediaUrl = mediaAtt?.url || (card.description?.includes("http") ? card.description.match(/https?:\/\/[^\s]+/)?.[0] : null);
            const thumbUrl = getDriveThumbnailUrl(mediaUrl, 400);
            if (!thumbUrl) return null;
            const isVideo = card.format === "REELS" || detectMediaType(mediaAtt?.name || card.title, card.format) === "video";

            return (
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black/50 border border-slate-800/80 my-1 group/thumb">
                <img
                  src={thumbUrl}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[0.5px]">
                    <div className="w-8 h-8 rounded-full bg-cyan-600/90 text-white flex items-center justify-center shadow-lg border border-cyan-400/30">
                      <Play size={13} className="fill-white ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* BADGE DE TIPO / FORMATO */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-1">
            <span className="text-emerald-400">•</span>
            <span className="capitalize">{card.format?.toLowerCase() || "peça"}</span>
          </div>

          {/* CAIXA CINZA DE METADADOS & ACCORDION (IDÊNTICA AO CRM) */}
          <div
            className="rounded-lg bg-slate-100 dark:bg-[#0d1117] p-3 text-xs text-slate-300 border border-slate-800/60"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-bold text-slate-200">
              ORIGEM: [{card.marketingClient?.name ? `CLIENTE: ${card.marketingClient.name}` : "BRIEFING"}]
            </p>

            {card.description ? (
              <p className="mt-1 text-slate-400 line-clamp-2">
                {card.description}
              </p>
            ) : null}

            {/* CONTEÚDO EXPANSÍVEL */}
            {isExpanded && (
              <div className="mt-2.5 space-y-1.5 border-t border-slate-800/80 pt-2 text-slate-300 text-[11px] animate-in slide-in-from-top-2">
                <p className="font-bold text-slate-200">DETALHES DA DEMANDA & PRAZOS:</p>
                {card.dueDate && (
                  <p>
                    • <span className="text-slate-400">Prazo de Entrega:</span>{" "}
                    {new Date(card.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {card.publishDate && (
                  <p>
                    • <span className="text-slate-400">Publicação:</span>{" "}
                    {new Date(card.publishDate).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {totalChecklist > 0 && (
                  <p>
                    • <span className="text-slate-400">Checklist:</span> {completedChecklist}/{totalChecklist} concluídas
                  </p>
                )}
                {!card.description && !card.dueDate && !card.publishDate && (
                  <p className="text-slate-500 italic">Sem metadados adicionais.</p>
                )}
              </div>
            )}

            {/* BOTÕES DO ACCORDION: MAIS / MENOS & COPIAR */}
            <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800/40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Menos</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Mais</span>
                  </>
                )}
              </button>

              {isExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(card.description || card.title);
                    toast.success("Copiado!");
                  }}
                  className="group/btn flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Copy size={13} className="text-slate-500 group-hover/btn:text-slate-300 transition-colors" /> Copiar descrição
                </button>
              )}
            </div>
          </div>

          {/* BARRA DE FERRAMENTAS E AUDITORIA (HOVER DRAWER IDÊNTICO AO CRM) */}
          <div className="max-h-0 opacity-0 group-hover:max-h-[100px] group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden flex flex-col gap-2 pt-0 group-hover:pt-2 border-t border-transparent group-hover:border-slate-800/40">
            <p className="text-[10px] text-slate-500 font-medium">
              Criado por {card.assignedUser?.name || "Equipe da Agência"}.
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <button
                title="Ver Chat / Briefing"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCard();
                }}
                className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <MessageSquare size={15} />
              </button>

              <button
                title="Data de Entrega"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCard();
                }}
                className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Calendar size={15} />
              </button>

              <button
                title="Checklist"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCard();
                }}
                className="rounded p-1.5 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <CheckSquare size={15} />
              </button>

              <button
                title="Abrir Demanda"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCard();
                }}
                className="ml-auto rounded p-1.5 hover:bg-slate-700 hover:text-cyan-400 transition-colors"
              >
                <ArrowUpRight size={15} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* TAGS DE FORMATO & ENTREGA DA PEÇA */}
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 uppercase">
              {card.format || "Peça"}
            </span>

            {card.dueDate && (
              <span className="text-slate-400 font-mono flex items-center gap-1">
                <Calendar size={12} strokeWidth={1.5} className="text-cyan-400" />
                {new Date(card.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </div>

          {/* RESPONSÁVEL / ASSIGNEE */}
          <div className="mt-1 flex items-center gap-2 border-t border-slate-800/40 pt-3">
            {card.assignedUser?.name ? (
              <>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-md">
                  {card.assignedUser.name[0]?.toUpperCase()}
                </div>
                <span className="text-[11px] text-slate-400 font-semibold truncate">
                  {card.assignedUser.name}
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
