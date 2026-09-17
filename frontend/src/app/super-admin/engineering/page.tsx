"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Cpu, 
  Layers, 
  Sparkles, 
  Code, 
  Rocket, 
  Inbox, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  FileText, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Tag, 
  Terminal, 
  ExternalLink, 
  ChevronRight, 
  Check, 
  RefreshCw, 
  Zap, 
  Database, 
  ShieldCheck, 
  Copy,
  Building2,
  X,
  Kanban as KanbanIcon,
  Table as TableIcon,
  CheckSquare,
  Square,
  ArrowUpDown,
  Users
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

// Dicionários e Configurações Visuais
const STAGES = [
  { id: "CAPTURED", label: "Ideias Capturadas", icon: Inbox, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { id: "AI_ANALYSIS", label: "Em Análise por IA", icon: Sparkles, color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "IN_DEVELOPMENT", label: "Em Desenvolvimento", icon: Code, color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "DEPLOYED", label: "Deploy Realizado", icon: Rocket, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
];

const CATEGORIES: Record<string, { label: string; badge: string }> = {
  FEATURE: { label: "Nova Feature", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  API: { label: "Nova API / Webhook", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  EXTENSION: { label: "Nova Extensão", badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  PERFORMANCE: { label: "Ajuste de Performance", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  BUG_FIX: { label: "Correção de Bug", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  ARCHITECTURE: { label: "Arquitetura & Refactor", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

const PRIORITIES: Record<string, { label: string; color: string; badge: string }> = {
  LOW: { label: "Baixa", color: "text-slate-400", badge: "bg-slate-800 text-slate-300 border-slate-700" },
  MEDIUM: { label: "Média", color: "text-blue-400", badge: "bg-blue-900/30 text-blue-400 border-blue-800" },
  HIGH: { label: "Alta", color: "text-amber-400", badge: "bg-amber-900/30 text-amber-400 border-amber-800" },
  CRITICAL: { label: "Crítica", color: "text-rose-400", badge: "bg-rose-900/30 text-rose-400 border-rose-800" },
};

export default function EngineeringDashboard() {
  const [activeTab, setActiveTab] = useState<"kanban" | "ai_chat">("kanban");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    captured: 0,
    aiAnalysis: 0,
    inDevelopment: 0,
    deployed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Ordenação na Tabela
  const [tableSortField, setTableSortField] = useState<string>("createdAt");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("desc");

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "clients" | "checklist" | "ai_plan">("overview");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [syncingDeploy, setSyncingDeploy] = useState(false);

  // Form State para Criação Manual
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("FEATURE");
  const [formPriority, setFormPriority] = useState("MEDIUM");
  const [formStage, setFormStage] = useState("CAPTURED");
  const [formDescription, setFormDescription] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  // Chat com IA State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [creatingCardFromMessageId, setCreatingCardFromMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Carregar Backlog
  const fetchBacklog = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/engineering/items", { params });
      setItems(res.data.items || []);
      setStats(res.data.stats || {
        total: 0,
        captured: 0,
        aiAnalysis: 0,
        inDevelopment: 0,
        deployed: 0,
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar backlog de engenharia.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, priorityFilter, search]);

  useEffect(() => {
    fetchBacklog();
  }, [fetchBacklog]);

  // Carregar Histórico do Chat de IA
  const fetchChatHistory = async () => {
    try {
      const res = await api.get("/engineering/chat/history");
      setChatMessages(res.data || []);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "ai_chat") {
      fetchChatHistory();
    }
  }, [activeTab]);

  // DRAG AND DROP NATIVO (@hello-pangea/dnd)
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetStage = destination.droppableId;
    const previousItems = [...items];

    // Atualização Otimista
    setItems((prev) =>
      prev.map((item) => (item.id === draggableId ? { ...item, stage: targetStage } : item))
    );

    try {
      await api.patch(`/engineering/items/${draggableId}`, { stage: targetStage });
      const stageLabel = STAGES.find((s) => s.id === targetStage)?.label || targetStage;
      toast.success(`Iniciativa movida para "${stageLabel}"`);
      fetchBacklog();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao sincronizar estágio da iniciativa.");
      setItems(previousItems); // Rollback
    }
  };

  // Criar Item Manualmente
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      toast.error("Preencha título e descrição da iniciativa.");
      return;
    }

    setSubmittingForm(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await api.post("/engineering/items", {
        title: formTitle.trim(),
        category: formCategory,
        priority: formPriority,
        stage: formStage,
        description: formDescription.trim(),
        tags: tagsArray,
        assignedTo: formAssignedTo.trim() || null,
        sourceType: "MANUAL",
      });

      toast.success("Iniciativa criada com sucesso no Backlog!");
      setIsCreateModalOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormTags("");
      setFormAssignedTo("");
      fetchBacklog();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao criar iniciativa.");
    } finally {
      setSubmittingForm(false);
    }
  };

  // Mover Estágio do Card (Botões)
  const handleMoveStage = async (item: any, newStage: string) => {
    try {
      await api.patch(`/engineering/items/${item.id}`, { stage: newStage });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, stage: newStage } : i))
      );
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({ ...selectedItem, stage: newStage });
      }
      toast.success(`Iniciativa movida para ${STAGES.find((s) => s.id === newStage)?.label}`);
      fetchBacklog();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar estágio da iniciativa.");
    }
  };

  // Excluir Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta iniciativa do backlog?")) return;

    try {
      await api.delete(`/engineering/items/${id}`);
      toast.success("Iniciativa removida com sucesso.");
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchBacklog();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir iniciativa.");
    }
  };

  // Análise com IA do Card
  const handleAnalyzeWithAI = async (item: any) => {
    setAnalyzingId(item.id);
    toast.info("A IA está analisando a arquitetura e impacto técnico...");
    try {
      const res = await api.post(`/engineering/items/${item.id}/analyze`);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? res.data : i))
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem(res.data);
      }
      toast.success("Parecer técnico da IA gerado com sucesso!");
      fetchBacklog();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar análise da IA.");
    } finally {
      setAnalyzingId(null);
    }
  };

  // Checklist: Toggle Task
  const handleToggleChecklist = async (taskId: string) => {
    if (!selectedItem) return;

    const currentChecklist = Array.isArray(selectedItem.checklist) ? [...selectedItem.checklist] : [];
    const updatedChecklist = currentChecklist.map((task: any) =>
      task.id === taskId ? { ...task, done: !task.done } : task
    );

    setSelectedItem({ ...selectedItem, checklist: updatedChecklist });
    setItems((prev) =>
      prev.map((i) => (i.id === selectedItem.id ? { ...i, checklist: updatedChecklist } : i))
    );

    try {
      await api.patch(`/engineering/items/${selectedItem.id}/checklist`, {
        checklist: updatedChecklist,
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar sub-tarefa.");
    }
  };

  // Checklist: Adicionar Nova Tarefa
  const handleAddChecklistTask = async () => {
    if (!newChecklistText.trim() || !selectedItem) return;

    const currentChecklist = Array.isArray(selectedItem.checklist) ? [...selectedItem.checklist] : [];
    const newTask = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      done: false,
    };
    const updatedChecklist = [...currentChecklist, newTask];

    setSelectedItem({ ...selectedItem, checklist: updatedChecklist });
    setItems((prev) =>
      prev.map((i) => (i.id === selectedItem.id ? { ...i, checklist: updatedChecklist } : i))
    );
    setNewChecklistText("");

    try {
      await api.patch(`/engineering/items/${selectedItem.id}/checklist`, {
        checklist: updatedChecklist,
      });
      toast.success("Sub-tarefa adicionada ao checklist!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar sub-tarefa.");
    }
  };

  // Atualizar Responsável Técnico no Card
  const handleUpdateAssignee = async (newAssignee: string) => {
    if (!selectedItem) return;
    setSelectedItem({ ...selectedItem, assignedTo: newAssignee });
    setItems((prev) =>
      prev.map((i) => (i.id === selectedItem.id ? { ...i, assignedTo: newAssignee } : i))
    );
    try {
      await api.patch(`/engineering/items/${selectedItem.id}`, { assignedTo: newAssignee });
      toast.success("Responsável técnico atualizado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar responsável.");
    }
  };

  // Enviar Mensagem no Chat de IA
  const handleSendChatMessage = async (presetPrompt?: string) => {
    const text = presetPrompt || chatInput;
    if (!text.trim() || chatLoading) return;

    const userMsg = { role: "user", content: text.trim(), createdAt: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetPrompt) setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await api.post("/engineering/chat", {
        message: text.trim(),
        history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply, createdAt: res.data.createdAt },
      ]);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao comunicar com a IA de Engenharia.");
    } finally {
      setChatLoading(false);
    }
  };

  // CRIAR CARD NO KANBAN DIRETAMENTE DO CHAT COM A IA
  const handleCreateCardFromChat = async (messageContent: string, messageId: string) => {
    setCreatingCardFromMessageId(messageId);
    toast.info("A IA Arquiteta está transformando esta solução em um card do Kanban...");

    try {
      const res = await api.post("/engineering/chat/create-card", {
        messageContext: messageContent,
        stage: "AI_ANALYSIS",
      });

      toast.success("Iniciativa criada com sucesso no Kanban!");
      await fetchBacklog();

      // Transiciona para o Kanban e abre o card criado
      setActiveTab("kanban");
      setSelectedItem(res.data);
      setModalTab("ai_plan");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao criar card pelo chat.");
    } finally {
      setCreatingCardFromMessageId(null);
    }
  };

  // Sincronizar Deploy Automático (Mover tarefas em desenvolvimento para DEPLOYED)
  const handleSyncDeploy = async () => {
    if (!confirm("Deseja marcar todas as frentes 'Em Desenvolvimento' como 'Deploy Realizado'?")) return;

    setSyncingDeploy(true);
    try {
      const res = await api.post("/engineering/sync-deploy");
      toast.success(res.data.message || "Deploy sincronizado com sucesso!");
      fetchBacklog();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao sincronizar deploy.");
    } finally {
      setSyncingDeploy(false);
    }
  };

  // Limpar Chat de IA
  const handleClearChat = async () => {
    if (!confirm("Deseja limpar todo o histórico de conversas com a IA?")) return;
    try {
      await api.delete("/engineering/chat/history");
      setChatMessages([]);
      toast.success("Histórico de conversas limpo!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao limpar histórico.");
    }
  };

  // Itens ordenados para a visualização em Tabela
  const sortedTableItems = [...items].sort((a, b) => {
    if (tableSortField === "priority") {
      const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const diff = (order[b.priority] || 0) - (order[a.priority] || 0);
      return tableSortDirection === "desc" ? diff : -diff;
    }
    if (tableSortField === "title") {
      return tableSortDirection === "desc"
        ? b.title.localeCompare(a.title)
        : a.title.localeCompare(b.title);
    }
    if (tableSortField === "affectedCount") {
      const diff = (b.affectedCount || 1) - (a.affectedCount || 1);
      return tableSortDirection === "desc" ? diff : -diff;
    }
    // Default: createdAt
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return tableSortDirection === "desc" ? diff : -diff;
  });

  return (
    <div className="flex flex-col h-full bg-[#070D1B] text-slate-100 overflow-hidden font-sans">
      {/* HEADER SUPERIOR */}
      <header className="p-4 md:px-6 border-b border-slate-800 bg-[#0B1224] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/10">
            <Cpu size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-white tracking-wide uppercase">
                Engenharia de Produto
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                Enterprise Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kanban Nível CRM, Drag & Drop nativo, IA Arquiteta Agêntica e Desduplicação de Suporte
            </p>
          </div>
        </div>

        {/* CONTROLES DO TOPO: Alternador de Abas, Sincronizar Deploy & Nova Iniciativa */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Alternador de Abas Principais */}
          <div className="flex items-center p-1 bg-[#070D1B] border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "kanban"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={14} />
              <span>Pipeline & Backlog</span>
            </button>

            <button
              onClick={() => setActiveTab("ai_chat")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "ai_chat"
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles size={14} className="text-purple-400" />
              <span>IA Arquiteto-Chefe</span>
            </button>
          </div>

          {/* Sincronização Automática de Deploy */}
          <button
            onClick={handleSyncDeploy}
            disabled={syncingDeploy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Mover tarefas em desenvolvimento para 'Deploy Realizado'"
          >
            <Rocket size={14} className={syncingDeploy ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sincronizar Deploy</span>
          </button>

          {/* Botão Nova Iniciativa */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus size={15} />
            <span>Nova Frente</span>
          </button>
        </div>
      </header>

      {/* MÉTRICAS DE TOPO (KPIs) */}
      <section className="px-4 md:px-6 py-3 border-b border-slate-800/80 bg-[#091020] grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <div className="bg-[#0B1224] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Iniciativas</p>
            <p className="text-lg font-black text-white">{stats.total}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-300">
            <Layers size={16} />
          </div>
        </div>

        <div className="bg-[#0B1224] border border-amber-500/20 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Capturadas</p>
            <p className="text-lg font-black text-amber-300">{stats.captured}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Inbox size={16} />
          </div>
        </div>

        <div className="bg-[#0B1224] border border-purple-500/20 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Em Análise IA</p>
            <p className="text-lg font-black text-purple-300">{stats.aiAnalysis}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles size={16} />
          </div>
        </div>

        <div className="bg-[#0B1224] border border-blue-500/20 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Em Desenvolvimento</p>
            <p className="text-lg font-black text-blue-300">{stats.inDevelopment}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Code size={16} />
          </div>
        </div>

        <div className="bg-[#0B1224] border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Deploy Realizado</p>
            <p className="text-lg font-black text-emerald-300">{stats.deployed}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Rocket size={16} />
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: TAB 1 (KANBAN/TABELA) OU TAB 2 (AI CHAT) */}
      {activeTab === "kanban" ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* BARRA DE FILTROS & VISÃO DUPLA (KANBAN VS TABELA) */}
          <div className="p-3 md:px-6 bg-[#070D1B] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-1.5">
              <Search size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, chamado, cliente ou responsável..."
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Alternador Kanban vs Tabela */}
              <div className="flex items-center p-1 bg-[#0B1224] border border-slate-800 rounded-lg">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === "kanban"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Modo Visual Kanban"
                >
                  <KanbanIcon size={14} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === "table"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Modo Tabela Detalhada"
                >
                  <TableIcon size={14} />
                </button>
              </div>

              {/* Filtro Categoria */}
              <div className="flex items-center gap-1.5 bg-[#0B1224] border border-slate-800 rounded-lg px-2.5 py-1">
                <Filter size={12} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Categoria:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0B1224]">Todas</option>
                  <option value="FEATURE" className="bg-[#0B1224]">Nova Feature</option>
                  <option value="API" className="bg-[#0B1224]">Nova API</option>
                  <option value="EXTENSION" className="bg-[#0B1224]">Nova Extensão</option>
                  <option value="PERFORMANCE" className="bg-[#0B1224]">Performance</option>
                  <option value="BUG_FIX" className="bg-[#0B1224]">Bug Fix</option>
                  <option value="ARCHITECTURE" className="bg-[#0B1224]">Arquitetura</option>
                </select>
              </div>

              {/* Filtro Prioridade */}
              <div className="flex items-center gap-1.5 bg-[#0B1224] border border-slate-800 rounded-lg px-2.5 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Prioridade:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0B1224]">Todas</option>
                  <option value="LOW" className="bg-[#0B1224]">Baixa</option>
                  <option value="MEDIUM" className="bg-[#0B1224]">Média</option>
                  <option value="HIGH" className="bg-[#0B1224]">Alta</option>
                  <option value="CRITICAL" className="bg-[#0B1224]">Crítica</option>
                </select>
              </div>

              <button
                onClick={fetchBacklog}
                className="p-1.5 bg-[#0B1224] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Atualizar Backlog"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* VISUALIZAÇÃO KANBAN (DRAG AND DROP) */}
          {viewMode === "kanban" ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 overflow-x-auto p-4 md:px-6 bg-[#070D1B]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[1050px] h-full items-start">
                  {STAGES.map((col) => {
                    const colItems = items.filter((item) => item.stage === col.id);
                    const ColIcon = col.icon;

                    return (
                      <Droppable droppableId={col.id} key={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`bg-[#0B1224] border rounded-xl flex flex-col max-h-full overflow-hidden shadow-sm transition-all ${
                              snapshot.isDraggingOver
                                ? "border-cyan-500/60 bg-[#0c162f] shadow-lg shadow-cyan-500/10"
                                : "border-slate-800"
                            }`}
                          >
                            {/* Cabeçalho da Coluna */}
                            <div className="p-3 border-b border-slate-800/80 bg-[#091020] flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${col.bg} ${col.border} border`}>
                                  <ColIcon size={14} className={col.color} />
                                </div>
                                <h3 className="text-xs font-bold text-white tracking-wide">
                                  {col.label}
                                </h3>
                              </div>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                                {colItems.length}
                              </span>
                            </div>

                            {/* Lista de Cards com Draggable */}
                            <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-[380px]">
                              {colItems.length === 0 ? (
                                <div className="p-6 text-center border border-dashed border-slate-800/80 rounded-lg text-slate-500 text-xs my-auto">
                                  Arraste ou crie cards aqui
                                </div>
                              ) : (
                                colItems.map((item, index) => {
                                  const catInfo = CATEGORIES[item.category] || { label: item.category, badge: "bg-slate-800 text-slate-300" };
                                  const prioInfo = PRIORITIES[item.priority] || { label: item.priority, badge: "bg-slate-800 text-slate-300" };
                                  const isAnalyzing = analyzingId === item.id;
                                  const checklistCount = Array.isArray(item.checklist) ? item.checklist.length : 0;
                                  const checklistDone = Array.isArray(item.checklist) ? item.checklist.filter((t: any) => t.done).length : 0;

                                  return (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                      {(dragProvided, dragSnapshot) => (
                                        <div
                                          ref={dragProvided.innerRef}
                                          {...dragProvided.draggableProps}
                                          {...dragProvided.dragHandleProps}
                                          className={`p-3.5 bg-[#0F172A] border rounded-xl transition-all shadow-sm flex flex-col gap-2.5 group cursor-grab active:cursor-grabbing ${
                                            dragSnapshot.isDragging
                                              ? "border-cyan-400 bg-[#17233f] shadow-2xl scale-[1.02] ring-2 ring-cyan-500/30"
                                              : "border-slate-800 hover:border-slate-700 hover:shadow-md"
                                          }`}
                                        >
                                          {/* Badges: Categoria & Prioridade */}
                                          <div className="flex items-center justify-between gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.badge}`}>
                                              {catInfo.label}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prioInfo.badge}`}>
                                              {prioInfo.label}
                                            </span>
                                          </div>

                                          {/* Título & Empresas Afetadas */}
                                          <div>
                                            <h4
                                              onClick={() => {
                                                setSelectedItem(item);
                                                setModalTab("overview");
                                              }}
                                              className="text-xs font-bold text-white hover:text-cyan-400 transition-all cursor-pointer leading-snug"
                                            >
                                              {item.title}
                                            </h4>

                                            {/* Indicador de Múltiplos Clientes Afetados */}
                                            {item.affectedCount > 1 ? (
                                              <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold mt-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md w-fit">
                                                <Building2 size={11} className="shrink-0" />
                                                <span>{item.affectedCount} empresas impactadas</span>
                                              </div>
                                            ) : item.tenantName ? (
                                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                                                <Building2 size={11} className="text-cyan-400 shrink-0" />
                                                <span className="truncate">{item.tenantName}</span>
                                              </div>
                                            ) : null}
                                          </div>

                                          {/* Descrição Snippet */}
                                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                            {item.description}
                                          </p>

                                          {/* Checklist Mini Status */}
                                          {checklistCount > 0 && (
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-[#070D1B] px-2 py-1 rounded-lg border border-slate-800/80">
                                              <CheckSquare size={11} className={checklistDone === checklistCount ? "text-emerald-400" : "text-blue-400"} />
                                              <span>{checklistDone}/{checklistCount} tarefas concluídas</span>
                                              <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden ml-1">
                                                <div
                                                  className="bg-blue-500 h-full transition-all"
                                                  style={{ width: `${(checklistDone / checklistCount) * 100}%` }}
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {/* Indicador de Parecer IA */}
                                          {item.aiSummary && (
                                            <div
                                              onClick={() => {
                                                setSelectedItem(item);
                                                setModalTab("ai_plan");
                                              }}
                                              className="flex items-center gap-1.5 p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-semibold cursor-pointer hover:bg-purple-500/20 transition-all"
                                            >
                                              <Sparkles size={12} className="text-purple-400 shrink-0" />
                                              <span className="truncate">Parecer de Engenharia pronto</span>
                                            </div>
                                          )}

                                          {/* Responsável & Ações Rápidas */}
                                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                                            <div className="flex items-center gap-1.5 truncate text-slate-400">
                                              <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-[9px] shrink-0">
                                                {item.assignedTo ? item.assignedTo.slice(0, 2).toUpperCase() : <User size={10} />}
                                              </div>
                                              <span className="truncate max-w-[90px] font-medium text-slate-300">
                                                {item.assignedTo || "Sem time"}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={() => handleAnalyzeWithAI(item)}
                                                disabled={isAnalyzing}
                                                className="p-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-[10px] font-bold flex items-center gap-1 px-1.5 transition-all cursor-pointer"
                                                title="Gerar parecer de arquitetura com IA"
                                              >
                                                <Sparkles size={11} className={isAnalyzing ? "animate-spin" : ""} />
                                                <span>IA</span>
                                              </button>

                                              <button
                                                onClick={() => {
                                                  setSelectedItem(item);
                                                  setModalTab("overview");
                                                }}
                                                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] px-2 font-medium transition-all cursor-pointer"
                                              >
                                                Abrir
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })
                              )}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </div>
            </DragDropContext>
          ) : (
            /* VISUALIZAÇÃO EM TABELA / LISTA (ESTILO CRM) */
            <div className="flex-1 overflow-auto p-4 md:px-6 bg-[#070D1B]">
              <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#091020] text-[10px] uppercase font-bold text-slate-400">
                      <th
                        onClick={() => {
                          setTableSortField("title");
                          setTableSortDirection(tableSortDirection === "asc" ? "desc" : "asc");
                        }}
                        className="p-3.5 cursor-pointer hover:text-white transition-all"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Iniciativa de Engenharia</span>
                          <ArrowUpDown size={11} />
                        </div>
                      </th>
                      <th className="p-3.5">Categoria</th>
                      <th
                        onClick={() => {
                          setTableSortField("priority");
                          setTableSortDirection(tableSortDirection === "asc" ? "desc" : "asc");
                        }}
                        className="p-3.5 cursor-pointer hover:text-white transition-all"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Prioridade</span>
                          <ArrowUpDown size={11} />
                        </div>
                      </th>
                      <th className="p-3.5">Estágio</th>
                      <th
                        onClick={() => {
                          setTableSortField("affectedCount");
                          setTableSortDirection(tableSortDirection === "asc" ? "desc" : "asc");
                        }}
                        className="p-3.5 cursor-pointer hover:text-white transition-all"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Impacto</span>
                          <ArrowUpDown size={11} />
                        </div>
                      </th>
                      <th className="p-3.5">Responsável</th>
                      <th
                        onClick={() => {
                          setTableSortField("createdAt");
                          setTableSortDirection(tableSortDirection === "asc" ? "desc" : "asc");
                        }}
                        className="p-3.5 cursor-pointer hover:text-white transition-all"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Criação</span>
                          <ArrowUpDown size={11} />
                        </div>
                      </th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {sortedTableItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Nenhuma iniciativa encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      sortedTableItems.map((item) => {
                        const catInfo = CATEGORIES[item.category] || { label: item.category, badge: "bg-slate-800 text-slate-300" };
                        const prioInfo = PRIORITIES[item.priority] || { label: item.priority, badge: "bg-slate-800 text-slate-300" };
                        const stageInfo = STAGES.find((s) => s.id === item.stage) || STAGES[0];

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-800/30 transition-all cursor-pointer"
                            onClick={() => {
                              setSelectedItem(item);
                              setModalTab("overview");
                            }}
                          >
                            <td className="p-3.5">
                              <div className="font-bold text-white max-w-sm truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.badge}`}>
                                {catInfo.label}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prioInfo.badge}`}>
                                {prioInfo.label}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageInfo.bg} ${stageInfo.border} ${stageInfo.color}`}>
                                {stageInfo.label}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {item.affectedCount > 1 ? (
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                  {item.affectedCount} empresas
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 truncate max-w-[120px] block">
                                  {item.tenantName || "1 empresa"}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="text-slate-300 font-medium text-[11px]">
                                {item.assignedTo || "—"}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 text-[11px]">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setModalTab("overview");
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                              >
                                Abrir
                              </button>
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
        </div>
      ) : (
        /* TAB 2: CHAT DEDICADO COM A IA COM CRIAÇÃO DE CARDS NO KANBAN */
        <div className="flex-1 flex flex-col min-h-0 bg-[#070D1B] overflow-hidden">
          {/* BARRA SUPERIOR DO CHAT */}
          <div className="p-3 md:px-6 bg-[#0B1224] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs md:text-sm font-bold text-white">
                    Engenheiro de Software Chefe (VERSUS AI Architect)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Agente de Criação Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Converse para projetar novas ferramentas, arquitetar APIs e clique em "Criar Card no Kanban" para abrir a demanda automaticamente
                </p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Limpar histórico de conversa"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Limpar Chat</span>
            </button>
          </div>

          {/* QUICK PROMPTS */}
          <div className="p-2 md:px-6 bg-[#091020] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap size={11} className="text-amber-400" /> Prompts Rápidos:
            </span>
            <button
              onClick={() => handleSendChatMessage("Quero criar uma nova integração com gateway de pagamento Pix para gerar cobranças automáticas no CRM. Como arquitetar isso?")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              💳 Nova API de Cobrança Pix
            </button>
            <button
              onClick={() => handleSendChatMessage("Analise o backlog atual de feedbacks capturados do suporte e me dê as 3 prioridades críticas de arquitetura.")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              💡 Priorizar Backlog de Feedbacks
            </button>
            <button
              onClick={() => handleSendChatMessage("Projete a arquitetura de uma nova API RESTful e Webhook para integração de novos canais de mensageria no VERSUS.")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              🔌 Arquitetar Nova API & Webhook
            </button>
          </div>

          {/* STREAM DE MENSAGENS COM BOTÃO DE CRIAÇÃO NO KANBAN */}
          <div className="flex-1 overflow-y-auto p-4 md:px-6 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
                  <Cpu size={28} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Assistente de Engenharia & Inovação Agêntica
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Diga a ideia de ferramenta ou melhoria que deseja construir. A IA projetará o código e permitirá você criar o card no Kanban com 1 clique!
                </p>
                <div className="text-[11px] text-slate-500 bg-[#0B1224] p-3 rounded-lg border border-slate-800 text-left w-full space-y-1">
                  <p className="font-semibold text-slate-400">Exemplos práticos:</p>
                  <p>• "IA, como criar uma extensão para discador VoIP no WhatsApp?"</p>
                  <p>• "Quero otimizar o tempo de resposta das mensagens usando cache Redis."</p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isAI = msg.role === "assistant";
                const isCreating = creatingCardFromMessageId === msg.id;

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 max-w-4xl ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        isAI
                          ? "bg-purple-600/20 border border-purple-500/40 text-purple-300"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {isAI ? <Bot size={15} /> : <User size={15} />}
                    </div>

                    <div className="flex flex-col gap-2 max-w-2xl">
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed border shadow-sm ${
                          isAI
                            ? "bg-[#0B1224] border-slate-800 text-slate-200"
                            : "bg-blue-600 text-white border-blue-500"
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans font-normal selection:bg-cyan-500/30">
                          {msg.content}
                        </div>
                        <div className={`text-[9px] mt-1 text-right ${isAI ? "text-slate-500" : "text-blue-200"}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </div>
                      </div>

                      {/* BOTÃO DE CRIAÇÃO NO KANBAN COM ESTA SOLUÇÃO */}
                      {isAI && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCreateCardFromChat(msg.content, msg.id || index.toString())}
                            disabled={isCreating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Plus size={13} className={isCreating ? "animate-spin" : "text-cyan-400"} />
                            <span>{isCreating ? "Criando Card..." : "📌 Criar Card no Kanban com Esta Solução"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {chatLoading && (
              <div className="flex items-start gap-3 max-w-4xl mr-auto">
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0B1224] border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin text-purple-400" />
                  <span>O Engenheiro Chefe está arquitetando a solução...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT DO CHAT */}
          <div className="p-3 md:px-6 bg-[#0B1224] border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center gap-2 bg-[#070D1B] border border-slate-800 focus-within:border-purple-500/50 rounded-xl px-3 py-1.5 transition-all"
            >
              <Terminal size={16} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pergunte ao Engenheiro Chefe (arquitetura, sugestão de código, análise de backlog)..."
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full py-1.5"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-30 cursor-pointer shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: + NOVA FRENTE TÉCNICA (MANUAL) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 bg-[#070D1B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nova Frente de Engenharia</h3>
                  <p className="text-[11px] text-slate-400">Crie uma nova iniciativa ou requisito técnico para o backlog</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Título da Iniciativa *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Criar Nova API REST de Webhooks para Integrações Externas"
                  className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="FEATURE">Nova Feature</option>
                    <option value="API">Nova API / Webhook</option>
                    <option value="EXTENSION">Nova Extensão</option>
                    <option value="PERFORMANCE">Ajuste de Performance</option>
                    <option value="BUG_FIX">Correção de Bug</option>
                    <option value="ARCHITECTURE">Arquitetura & Refactor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Estágio Inicial
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="CAPTURED">Ideias Capturadas</option>
                    <option value="AI_ANALYSIS">Em Análise por IA</option>
                    <option value="IN_DEVELOPMENT">Em Desenvolvimento</option>
                    <option value="DEPLOYED">Deploy Realizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Responsável / Equipe
                  </label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="Ex: Time Backend, Vitor"
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Descrição do Requisito / Problema *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva o escopo técnico, regras de negócio e objetivo final..."
                  className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="api, webhook, redis, seguranca"
                  className="w-full bg-[#070D1B] border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {submittingForm ? "Cadastrando..." : "Cadastrar no Backlog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTERPRISE DE INICIATIVA (NÍVEL DEALMODAL CRM) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header do Modal */}
            <div className="p-4 border-b border-slate-800 bg-[#070D1B] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Cpu size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-lg">
                    {selectedItem.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>Origem: <strong>{selectedItem.sourceType}</strong></span>
                    <span>•</span>
                    <span>Criado em {new Date(selectedItem.createdAt).toLocaleDateString('pt-BR')}</span>
                    {selectedItem.affectedCount > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">{selectedItem.affectedCount} empresas impactadas</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas do Modal Enterprise */}
            <div className="px-5 border-b border-slate-800 bg-[#091020] flex items-center gap-4 text-xs font-bold shrink-0">
              <button
                onClick={() => setModalTab("overview")}
                className={`py-3 border-b-2 transition-all cursor-pointer ${
                  modalTab === "overview"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Visão Geral & Time
              </button>
              <button
                onClick={() => setModalTab("clients")}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === "clients"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Raio-X dos Clientes</span>
                {selectedItem.affectedCount > 1 && (
                  <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-bold">
                    {selectedItem.affectedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setModalTab("checklist")}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === "checklist"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Checklist Técnico</span>
                {Array.isArray(selectedItem.checklist) && selectedItem.checklist.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full text-[10px]">
                    {selectedItem.checklist.filter((t: any) => t.done).length}/{selectedItem.checklist.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setModalTab("ai_plan")}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === "ai_plan"
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles size={12} />
                <span>Parecer IA</span>
              </button>
            </div>

            {/* Conteúdo das Abas */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* ABA 1: VISÃO GERAL */}
              {modalTab === "overview" && (
                <div className="space-y-4">
                  {/* Badges & Controles de Estágio e Responsável */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-[#070D1B] border border-slate-800 rounded-xl">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estágio do Kanban:</span>
                      <select
                        value={selectedItem.stage}
                        onChange={(e) => handleMoveStage(selectedItem, e.target.value)}
                        className="w-full bg-[#0B1224] border border-slate-700 text-xs font-bold text-cyan-300 rounded-lg p-2 outline-none cursor-pointer"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável / Equipe:</span>
                      <input
                        type="text"
                        defaultValue={selectedItem.assignedTo || ""}
                        onBlur={(e) => handleUpdateAssignee(e.target.value)}
                        placeholder="Ex: Time Backend, Vitor"
                        className="w-full bg-[#0B1224] border border-slate-700 text-xs font-semibold text-white rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Descrição Completa */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-400" />
                      <span>Descrição da Iniciativa & Relato</span>
                    </h4>
                    <div className="p-3.5 bg-[#070D1B] border border-slate-800 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                      {selectedItem.description}
                    </div>
                  </div>

                  {/* Notas Técnicas Adicionais */}
                  {selectedItem.technicalNotes && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Histórico & Notas Técnicas
                      </h4>
                      <div className="p-3 bg-[#070D1B] border border-slate-800 rounded-xl text-xs text-slate-400 whitespace-pre-wrap">
                        {selectedItem.technicalNotes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: RAIO-X DOS CLIENTES AFETADOS & ORIGEM */}
              {modalTab === "clients" && (
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Impacto em Clientes</h4>
                      <p className="text-[11px] text-slate-400">
                        {selectedItem.affectedCount > 1
                          ? `Identificado por ${selectedItem.affectedCount} empresas diferentes. Prioridade unificada.`
                          : `Identificado pelo chamado de 1 empresa.`}
                      </p>
                    </div>
                    <span className="text-lg font-black text-cyan-300 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-lg">
                      {selectedItem.affectedCount} {selectedItem.affectedCount === 1 ? "Cliente" : "Clientes"}
                    </span>
                  </div>

                  {/* Lista de Empresas Afetadas */}
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Empresas com Ocorrências Registradas
                    </h5>
                    <div className="space-y-2">
                      {Array.isArray(selectedItem.affectedTenants) && selectedItem.affectedTenants.length > 0 ? (
                        selectedItem.affectedTenants.map((tenant: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-[#070D1B] border border-slate-800 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className="text-cyan-400" />
                              <span className="text-xs font-bold text-white">{tenant.name || "Empresa"}</span>
                              {tenant.ticketNumber && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-mono">
                                  #{tenant.ticketNumber}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {tenant.date ? new Date(tenant.date).toLocaleDateString('pt-BR') : ""}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-[#070D1B] border border-slate-800 rounded-lg text-xs text-slate-400">
                          {selectedItem.tenantName || "Empresa solicitante única"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: CHECKLIST TÉCNICO INTERATIVO */}
              {modalTab === "checklist" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Sub-tarefas de Desenvolvimento</h4>
                      <p className="text-[11px] text-slate-400">Marque as etapas conforme forem construídas e testadas</p>
                    </div>
                  </div>

                  {/* Input para Nova Sub-tarefa */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChecklistTask();
                        }
                      }}
                      placeholder="Adicionar nova sub-tarefa técnica (ex: Criar migration no Prisma)..."
                      className="flex-1 bg-[#070D1B] border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistTask}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Lista de Tarefas */}
                  <div className="space-y-2">
                    {Array.isArray(selectedItem.checklist) && selectedItem.checklist.length > 0 ? (
                      selectedItem.checklist.map((task: any) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleChecklist(task.id)}
                          className={`p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                            task.done
                              ? "bg-emerald-950/15 border-emerald-500/30 text-emerald-200"
                              : "bg-[#070D1B] border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${task.done ? "bg-emerald-500 border-emerald-500 text-slate-950" : "border-slate-600"}`}>
                            {task.done && <Check size={12} className="stroke-[3]" />}
                          </div>
                          <span className={`text-xs flex-1 ${task.done ? "line-through opacity-70" : "font-medium"}`}>
                            {task.text}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                        Nenhuma sub-tarefa adicionada ainda.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 4: PARECER TÉCNICO DO ARQUITETO IA */}
              {modalTab === "ai_plan" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-purple-400" />
                      <span>Parecer do Arquiteto de Software Chefe (IA)</span>
                    </h4>
                    <button
                      onClick={() => handleAnalyzeWithAI(selectedItem)}
                      disabled={analyzingId === selectedItem.id}
                      className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles size={11} className={analyzingId === selectedItem.id ? "animate-spin" : ""} />
                      <span>{analyzingId === selectedItem.id ? "Analisando..." : "Regerar Parecer IA"}</span>
                    </button>
                  </div>

                  {selectedItem.aiSummary ? (
                    <div className="p-4 bg-purple-950/15 border border-purple-500/30 rounded-xl text-xs text-purple-100 whitespace-pre-wrap leading-relaxed font-sans">
                      {selectedItem.aiSummary}
                    </div>
                  ) : (
                    <div className="p-6 bg-[#070D1B] border border-dashed border-purple-500/30 rounded-xl text-center">
                      <p className="text-xs text-slate-400 mb-3">
                        Nenhum parecer técnico gerado ainda para esta iniciativa.
                      </p>
                      <button
                        onClick={() => handleAnalyzeWithAI(selectedItem)}
                        disabled={analyzingId === selectedItem.id}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>Gerar Parecer de Arquitetura com IA</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-800 bg-[#070D1B] flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDeleteItem(selectedItem.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Excluir Iniciativa</span>
              </button>

              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
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
