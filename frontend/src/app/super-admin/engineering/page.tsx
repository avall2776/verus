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
  Users,
  Mic,
  MicOff,
  StopCircle,
  ArrowUp,
  PhoneCall,
  CreditCard,
  Briefcase,
  Play,
  Activity
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import api from "@/lib/api";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import ProductSandboxModal from "@/components/super-admin/ProductSandboxModal";
import SoftphoneModal from "@/components/voip/SoftphoneModal";

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
  const [activeTab, setActiveTab] = useState<"kanban" | "ai_chat" | "products">("kanban");
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

  // Áudio e Gravação com Whisper
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Estados para Produtos & Sandboxes em Desenvolvimento
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSoftphoneOpen, setIsSoftphoneOpen] = useState(false);
  const [quickTestingId, setQuickTestingId] = useState<string | null>(null);

  // Carregar Produtos em R&D
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/engineering/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar módulos em desenvolvimento.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  const handleQuickTest = async (prodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickTestingId(prodId);
    try {
      const res = await api.post(`/engineering/products/${prodId}/test`);
      toast.success(`Diagnóstico de '${res.data.productName}' concluído com ${res.data.stabilityScore}% de estabilidade!`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao executar teste rápido de sandbox.");
    } finally {
      setQuickTestingId(null);
    }
  };

  const handleOpenProductSandbox = (prod: any) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleProductUpdated = (updated: any) => {
    setSelectedProduct(updated);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const filteredProducts = products.filter((p) => {
    if (productStatusFilter !== "ALL" && p.status !== productStatusFilter) {
      return false;
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchTagline = p.tagline?.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q);
      const matchEngine = p.engine?.toLowerCase().includes(q);
      if (!matchName && !matchTagline && !matchCategory && !matchEngine) {
        return false;
      }
    }
    return true;
  });

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

  // Copiar Conteúdo da Mensagem da IA
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Resposta copiada para a área de transferência!");
  };

  // Iniciar Gravação de Áudio via Navegador
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Seu navegador não possui suporte para gravação de áudio.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      toast.info("Gravando áudio... Fale sua demanda para o Arquiteto IA.");
    } catch (err: any) {
      console.error("Erro ao iniciar microfone:", err);
      toast.error("Permissão de microfone negada ou microfone indisponível.");
    }
  };

  // Parar Gravação e Transcrever com OpenAI Whisper
  const stopRecordingAndSend = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingDuration(0);

      if (audioBlob.size < 500) {
        toast.warning("Gravação muito curta ou vazia.");
        return;
      }

      setIsTranscribing(true);
      const loadingToastId = toast.loading("Transcrevendo áudio via OpenAI Whisper...");

      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        const res = await api.post("/engineering/chat/transcribe-audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const text = res.data?.text?.trim();
        if (!text) {
          toast.dismiss(loadingToastId);
          toast.warning("Nenhuma fala detectada no áudio.");
          return;
        }

        toast.dismiss(loadingToastId);
        toast.success(`Transcrito: "${text.slice(0, 50)}..."`);
        await handleSendChatMessage(text);
      } catch (err: any) {
        console.error("Erro ao transcrever áudio:", err);
        toast.dismiss(loadingToastId);
        toast.error(err.response?.data?.message || "Erro ao transcrever áudio com Whisper.");
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.stop();
  };

  // Cancelar Gravação de Áudio
  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
    toast.info("Gravação de áudio cancelada.");
  };

  // Formatador de Tempo de Áudio (mm:ss)
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Limpeza de Streams de Áudio
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "products"
                  ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu size={14} className="text-cyan-400" />
              <span>Produtos / Roadmap</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {products.length || 5}
              </span>
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

          {/* Controles Exclusivos da Aba Kanban / Produtos / IA */}
          {activeTab === "kanban" ? (
            <>
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
            </>
          ) : activeTab === "products" ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Zero Mocks • Sandboxes Isoladas</span>
              </span>
              <button
                onClick={fetchProducts}
                disabled={loadingProducts}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1224] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                title="Atualizar telemetria dos produtos"
              >
                <RefreshCw size={13} className={loadingProducts ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Recarregar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <Sparkles size={12} className="text-purple-400" />
                <span>OpenAI GPT-4o & Whisper</span>
              </span>
              <button
                onClick={handleClearChat}
                className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Limpar histórico de conversa"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Limpar Chat</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MÉTRICAS DE TOPO (KPIs) - Visíveis apenas no Pipeline & Backlog */}
      {activeTab === "kanban" && (
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
      )}

      {/* MÉTRICAS DE TOPO (KPIs) - Produtos e Módulos em R&D */}
      {activeTab === "products" && (
        <section className="px-4 md:px-6 py-3 border-b border-slate-800/80 bg-[#091020] grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
          <div className="bg-[#0B1224] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total em R&D</p>
              <p className="text-lg font-black text-white">{products.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-300">
              <Cpu size={16} />
            </div>
          </div>

          <div className="bg-[#0B1224] border border-amber-500/20 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Em Planejamento</p>
              <p className="text-lg font-black text-amber-300">
                {products.filter((p) => p.status === "EM_PLANEJAMENTO").length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={16} />
            </div>
          </div>

          <div className="bg-[#0B1224] border border-blue-500/20 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Em Desenvolvimento</p>
              <p className="text-lg font-black text-blue-300">
                {products.filter((p) => p.status === "EM_DESENVOLVIMENTO").length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Code size={16} />
            </div>
          </div>

          <div className="bg-[#0B1224] border border-purple-500/20 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Em Homologação</p>
              <p className="text-lg font-black text-purple-300">
                {products.filter((p) => p.status === "EM_HOMOLOGACAO").length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Activity size={16} />
            </div>
          </div>

          <div className="bg-[#0B1224] border border-emerald-500/20 rounded-lg p-2.5 flex items-center justify-between col-span-2 md:col-span-1">
            <div>
              <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Em Produção</p>
              <p className="text-lg font-black text-emerald-300">
                {products.filter((p) => p.status === "EM_PRODUCAO").length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Rocket size={16} />
            </div>
          </div>
        </section>
      )}

      {/* CONTEÚDO PRINCIPAL: TAB 1 (KANBAN/TABELA) OU TAB 2 (PRODUTOS) OU TAB 3 (AI CHAT) */}
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
      ) : activeTab === "products" ? (
        /* TAB 2: PRODUTOS E MÓDULOS EM DESENVOLVIMENTO (SANDBOX & HOMOLOGAÇÃO) */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#070D1B]">
          
          {/* BARRA DE PESQUISA & FILTROS DE STATUS DOS PRODUTOS */}
          <div className="p-3 md:px-6 bg-[#070D1B] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Input de Busca */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-[#0B1224] border border-slate-800 rounded-lg px-3 py-1.5">
              <Search size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar por produto, tecnologia, protocolo ou engine..."
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
              />
              {productSearch && (
                <button onClick={() => setProductSearch("")} className="text-slate-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filtros de Status (Pílulas Monocromáticas) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "Todos os Produtos" },
                { id: "EM_DESENVOLVIMENTO", label: "Em Desenvolvimento" },
                { id: "EM_HOMOLOGACAO", label: "Em Homologação" },
                { id: "EM_PLANEJAMENTO", label: "Em Planejamento" },
                { id: "EM_PRODUCAO", label: "Em Produção" },
              ].map((filter) => {
                const isActive = productStatusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setProductStatusFilter(filter.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                        : "bg-[#0B1224] text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID DE CARDS DE PRODUTOS & SANDBOXES */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {loadingProducts ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
                <p className="text-xs">Carregando módulos e sandboxes de engenharia...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                <Cpu size={32} className="text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-300">Nenhum produto encontrado</p>
                <p className="text-xs text-slate-500 mt-1">Ajuste os filtros de busca ou recarregue a lista.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {filteredProducts.map((prod) => {
                  const statusConfig: Record<string, { label: string; badge: string }> = {
                    EM_PLANEJAMENTO: {
                      label: "Em Planejamento",
                      badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
                    },
                    EM_DESENVOLVIMENTO: {
                      label: "Em Desenvolvimento",
                      badge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
                    },
                    EM_HOMOLOGACAO: {
                      label: "Em Homologação",
                      badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
                    },
                    EM_PRODUCAO: {
                      label: "Em Produção (Ativo)",
                      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
                    },
                  };

                  const currentStatus = statusConfig[prod.status] || {
                    label: prod.status,
                    badge: "bg-slate-800 text-slate-300 border-slate-700",
                  };

                  const doneTasks = prod.tasks?.filter((t: any) => t.done).length || 0;
                  const totalTasks = prod.tasks?.length || 1;
                  const progressPct = Math.round((doneTasks / totalTasks) * 100);

                  const getProductIcon = (id: string) => {
                    switch (id) {
                      case "voice-ai-agent":
                        return <Bot size={18} className="text-cyan-400" />;
                      case "voip-sip-server":
                        return <PhoneCall size={18} className="text-blue-400" />;
                      case "suite-erp":
                        return <Briefcase size={18} className="text-purple-400" />;
                      case "billing-subscription":
                        return <CreditCard size={18} className="text-emerald-400" />;
                      case "onboarding-self-service":
                        return <Rocket size={18} className="text-amber-400" />;
                      default:
                        return <Cpu size={18} className="text-blue-400" />;
                    }
                  };

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleOpenProductSandbox(prod)}
                      className="bg-[#0B1224] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group cursor-pointer shadow-lg hover:shadow-xl hover:shadow-blue-950/20"
                    >
                      {/* Topo do Card: Categoria, Status & Badge de Isolamento */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#070D1B] border border-slate-800 flex items-center justify-center">
                              {getProductIcon(prod.id)}
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                              {prod.category}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${currentStatus.badge}`}>
                            {currentStatus.label}
                          </span>
                        </div>

                        {/* Nome & Tagline */}
                        <div>
                          <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {prod.tagline}
                          </p>
                        </div>

                        {/* Especificações Técnicas Rápidas */}
                        <div className="p-2.5 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Code size={12} />
                              <span>Engine:</span>
                            </span>
                            <span className="text-slate-300 font-semibold truncate max-w-[170px]" title={prod.engine}>
                              {prod.engine}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Clock size={12} />
                              <span>Latência:</span>
                            </span>
                            <span className="text-cyan-400 font-semibold">
                              {prod.targetLatency}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Activity size={12} />
                              <span>Estabilidade:</span>
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              {prod.stabilityScore}%
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso de Checklist */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Checklist do Módulo:</span>
                            <span className="font-mono text-slate-200">
                              {doneTasks}/{totalTasks} ({progressPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ações Inferiores do Card */}
                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                        {/* Botão de Teste Rápido */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleQuickTest(prod.id, e)}
                            disabled={quickTestingId === prod.id}
                            className="px-2.5 py-1.5 rounded-lg bg-[#070D1B] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Disparar bateria rápida de testes"
                          >
                            <Play size={12} className={quickTestingId === prod.id ? "animate-spin text-blue-400" : ""} />
                            <span>{quickTestingId === prod.id ? "Testando..." : "Diagnóstico"}</span>
                          </button>

                          {prod.id === "voip-sip-server" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsSoftphoneOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Abrir Softphone Dialpad WebAudio"
                            >
                              <PhoneCall size={12} className="text-emerald-400" />
                              <span>Softphone</span>
                            </button>
                          )}
                        </div>

                        {/* Botão de Abrir Sandbox & Copilot */}
                        <button
                          onClick={() => handleOpenProductSandbox(prod)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                        >
                          <Terminal size={13} />
                          <span>Abrir Sandbox</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 3: CHAT DEDICADO COM A IA (FULLSCREEN CHATGPT / OPENAI STYLE) */
        <div className="flex-1 flex flex-col min-h-0 bg-[#070D1B] overflow-hidden">
          {/* SUB-HEADER ELEGANTE DO AGENTE IA */}
          <div className="px-4 md:px-6 py-2.5 bg-[#0B1224]/80 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-sm">
                  <Bot size={18} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0B1224]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs md:text-sm font-bold text-white tracking-wide">
                    Engenheiro de Software Chefe (VERSUS AI Architect)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Agente Agêntico Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Arquitetura de microsserviços, geração de código e criação direta de cards no Kanban
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Limpar histórico de conversa"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Limpar Chat</span>
              </button>
            </div>
          </div>

          {/* STREAM DE MENSAGENS ESTILO OPENAI / CHATGPT */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 md:py-6 md:px-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {chatMessages.length === 0 ? (
                /* ESTADO INICIAL / BOAS-VINDAS ESTILO CHATGPT */
                <div className="py-8 md:py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-xl shadow-purple-500/10">
                      <Sparkles size={32} className="text-purple-400" />
                    </div>
                  </div>

                  <h2 className="text-lg md:text-xl font-black text-white tracking-tight mb-2">
                    Como posso ajudar na engenharia do VERSUS hoje?
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed mb-8">
                    Converse com o Engenheiro Chefe para desenhar novas ferramentas, planejar integrações de APIs ou desmembrar chamados de suporte em tarefas técnicas. Quando estiver pronto, gere o Card no Kanban com 1 clique!
                  </p>

                  {/* CARDS DE SUGESTÃO DE PROMPTS ESTILO OPENAI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                    <button
                      onClick={() => handleSendChatMessage("Quero criar uma nova integração com gateway de pagamento Pix para gerar cobranças automáticas no CRM. Como arquitetar isso no backend NestJS e frontend Next.js?")}
                      className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 hover:border-cyan-500/50 hover:bg-[#0E172E] transition-all group cursor-pointer text-left flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                          💳 Nova API de Cobrança Pix
                        </span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Como arquitetar cobranças automáticas, conciliação e webhooks no NestJS e Next.js?
                      </p>
                    </button>

                    <button
                      onClick={() => handleSendChatMessage("Analise o backlog atual de feedbacks capturados do suporte e me dê as 3 prioridades críticas de arquitetura para a plataforma.")}
                      className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 hover:border-purple-500/50 hover:bg-[#0E172E] transition-all group cursor-pointer text-left flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300">
                          💡 Priorizar Backlog de Feedbacks
                        </span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Analise os chamados do suporte e aponte as 3 melhorias prioritárias para o produto.
                      </p>
                    </button>

                    <button
                      onClick={() => handleSendChatMessage("Projete a arquitetura de uma nova API RESTful e Webhook para integração de novos canais de mensageria no VERSUS.")}
                      className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 hover:border-blue-500/50 hover:bg-[#0E172E] transition-all group cursor-pointer text-left flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
                          🔌 Arquitetar Nova API & Webhook
                        </span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Projete contratos RESTful, segurança com HMAC e processamento assíncrono via Redis.
                      </p>
                    </button>

                    <button
                      onClick={() => handleSendChatMessage("Como otimizar a performance de entrega e renderização do feed de mensagens no Live Chat utilizando cache Redis e Socket.io?")}
                      className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 hover:border-amber-500/50 hover:bg-[#0E172E] transition-all group cursor-pointer text-left flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                          ⚡ Otimização & Cache Redis
                        </span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Estratégia para reduzir latência e consumo de banco de dados no Live Chat de alta densidade.
                      </p>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* BARRA DE SUGESTÕES RÁPIDAS QUANDO JÁ EXISTEM MENSAGENS */}
                  <div className="flex items-center gap-2 pb-2 overflow-x-auto border-b border-slate-800/60 custom-scrollbar">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <Zap size={11} className="text-amber-400" /> Sugestões:
                    </span>
                    <button
                      onClick={() => handleSendChatMessage("Quero criar uma nova integração com gateway de pagamento Pix para gerar cobranças automáticas no CRM. Como arquitetar isso?")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0B1224] border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                    >
                      💳 Nova API Pix
                    </button>
                    <button
                      onClick={() => handleSendChatMessage("Analise o backlog atual de feedbacks capturados do suporte e me dê as 3 prioridades críticas de arquitetura.")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0B1224] border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                    >
                      💡 Priorizar Backlog
                    </button>
                    <button
                      onClick={() => handleSendChatMessage("Projete a arquitetura de uma nova API RESTful e Webhook para integração de novos canais de mensageria no VERSUS.")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0B1224] border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                    >
                      🔌 Arquitetar API & Webhook
                    </button>
                  </div>

                  {/* LISTA DE MENSAGENS */}
                  {chatMessages.map((msg, index) => {
                    const isAI = msg.role === "assistant";
                    const isCreating = creatingCardFromMessageId === (msg.id || index.toString());

                    return (
                      <div
                        key={index}
                        className={`flex gap-3.5 ${isAI ? "items-start" : "items-start justify-end"}`}
                      >
                        {/* Avatar IA */}
                        {isAI && (
                          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-1 shadow-sm">
                            <Bot size={16} />
                          </div>
                        )}

                        {/* Conteúdo da Mensagem */}
                        <div className={`flex flex-col gap-2 ${isAI ? "flex-1 min-w-0" : "max-w-2xl"}`}>
                          {/* Nome e Hora */}
                          <div className={`flex items-center gap-2 text-[11px] ${isAI ? "text-purple-300" : "justify-end text-slate-400"}`}>
                            <span className="font-bold">{isAI ? "VERSUS AI Architect" : "Você"}</span>
                            {isAI && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                                Engenheiro Chefe
                              </span>
                            )}
                            <span className="text-slate-500 text-[10px]">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>

                          {/* Caixa de Mensagem */}
                          <div
                            className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed border shadow-md ${
                              isAI
                                ? "bg-[#0B1224] border-slate-800 text-slate-200"
                                : "bg-blue-600 text-white border-blue-500/80 rounded-tr-sm ml-auto"
                            }`}
                          >
                            {isAI ? (
                              <MarkdownRenderer content={msg.content} />
                            ) : (
                              <div className="whitespace-pre-wrap font-sans font-normal selection:bg-cyan-500/30">
                                {msg.content}
                              </div>
                            )}
                          </div>

                          {/* AÇÕES DA MENSAGEM (APENAS PARA RESPOSTAS DA IA) */}
                          {isAI && (
                            <div className="flex items-center gap-2.5 pt-1">
                              {/* Botão de Criação de Card no Kanban com esta Solução */}
                              <button
                                onClick={() => handleCreateCardFromChat(msg.content, msg.id || index.toString())}
                                disabled={isCreating}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                <Plus size={13} className={isCreating ? "animate-spin" : "text-cyan-400"} />
                                <span>{isCreating ? "Criando Card..." : "📌 Criar Card no Kanban com Esta Solução"}</span>
                              </button>

                              {/* Copiar Resposta Completa */}
                              <button
                                onClick={() => handleCopyMessage(msg.content)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B1224] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs transition-all cursor-pointer"
                                title="Copiar resposta completa"
                              >
                                <Copy size={13} />
                                <span className="hidden sm:inline">Copiar</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Avatar Usuário */}
                        {!isAI && (
                          <div className="w-8 h-8 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* FEEDBACK DE CARREGAMENTO / RACIOCÍNIO */}
              {chatLoading && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0B1224] border border-slate-800 text-slate-300 text-xs flex items-center gap-3 shadow-md">
                    <RefreshCw size={14} className="animate-spin text-purple-400" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">O Engenheiro Chefe está raciocinando...</p>
                      <p className="text-[11px] text-slate-400">Analisando arquitetura, banco de dados e gerando plano técnico com snippets de código.</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* BARRA DE INPUT ESTILO CHATGPT / OPENAI CAPSULE */}
          <div className="p-4 md:px-6 bg-gradient-to-t from-[#070D1B] via-[#070D1B] to-transparent shrink-0">
            <div className="max-w-4xl mx-auto w-full">
              {/* BARRA DE GRAVAÇÃO DE ÁUDIO ATIVA */}
              {isRecording ? (
                <div className="bg-[#0B1224] border border-rose-500/50 rounded-2xl p-3 px-4 shadow-xl flex items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <div>
                      <p className="text-xs font-bold text-rose-300 flex items-center gap-2">
                        <span>Gravando áudio com Whisper...</span>
                        <span className="font-mono text-white bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                          {formatRecordingTime(recordingDuration)}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Fale sua ideia ou dúvida técnica com naturalidade
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={13} className="text-rose-400" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopRecordingAndSend}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Enviar Áudio</span>
                    </button>
                  </div>
                </div>
              ) : isTranscribing ? (
                <div className="bg-[#0B1224] border border-cyan-500/40 rounded-2xl p-3 px-4 shadow-xl flex items-center gap-3">
                  <RefreshCw size={16} className="animate-spin text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-cyan-300">Processando áudio com OpenAI Whisper...</p>
                    <p className="text-[11px] text-slate-400">Convertendo sua fala em texto técnico de alta precisão</p>
                  </div>
                </div>
              ) : (
                /* CAPSULA DE TEXTO PADRÃO CHATGPT */
                <div className="bg-[#0B1224] border border-slate-800 focus-within:border-purple-500/60 rounded-2xl p-3 shadow-xl transition-all">
                  <textarea
                    rows={2}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder="Converse com o Engenheiro Chefe (arquitetura, sugestão de código, análise de backlog)..."
                    className="bg-transparent text-xs md:text-sm text-white placeholder-slate-500 outline-none w-full resize-none leading-relaxed font-sans"
                    disabled={chatLoading}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      Pressione <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">Enter</kbd> para enviar ou <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">Shift+Enter</kbd> para nova linha
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      {/* Botão de Gravação de Áudio */}
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={chatLoading}
                        className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer disabled:opacity-40"
                        title="Falar por áudio (OpenAI Whisper)"
                      >
                        <Mic size={17} />
                      </button>

                      {/* Botão Enviar Mensagem */}
                      <button
                        type="button"
                        onClick={() => handleSendChatMessage()}
                        disabled={chatLoading || !chatInput.trim()}
                        className="p-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-500 text-center mt-2">
                O VERSUS AI Architect utiliza inteligência artificial com raciocínio de engenharia e transcrição de áudio Whisper.
              </p>
            </div>
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
                    <div className="p-4 bg-[#0B1224] border border-purple-500/30 rounded-xl text-xs text-purple-100 leading-relaxed shadow-md">
                      <MarkdownRenderer content={selectedItem.aiSummary} />
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

      {/* MODAL DE SANDBOX E LABORATÓRIO DE TESTES ISOLADOS (ZERO MOCKS) */}
      <ProductSandboxModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />

      {/* SOFTPHONE CORPORATIVO WEBRTC & DIALPAD WEBAUDIO */}
      <SoftphoneModal
        isOpen={isSoftphoneOpen}
        onClose={() => setIsSoftphoneOpen(false)}
      />
    </div>
  );
}
