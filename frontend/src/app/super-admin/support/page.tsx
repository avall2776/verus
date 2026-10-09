"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Headphones, 
  Search, 
  Send, 
  Lock, 
  MessageSquare, 
  Building2, 
  PhoneCall, 
  Mail, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Loader2, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Maximize2, 
  FileText, 
  Copy, 
  Check, 
  CheckCheck,
  X, 
  Users, 
  ShieldCheck, 
  HelpCircle, 
  Tag, 
  Cpu,
  Sparkles,
  MessageCircle,
  Eye,
  PanelRight,
  Zap,
  Bot,
  Play,
  Pause,
  Save,
  Star,
  Sliders,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  GraduationCap,
  BookOpen,
  Wand2,
  Settings
} from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/components/ui/SocketProvider";
import { toast } from "sonner";
import CompanyXRayModal from "@/components/super-admin/CompanyXRayModal";

export const dynamic = "force-dynamic";

// Dicionários Oficiais de Tradução e Estilo (100% PT-BR)
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  OPEN: { label: "Aberto", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  IN_PROGRESS: { label: "Em Atendimento", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  WAITING_CLIENT: { label: "Aguardando Cliente", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  RESOLVED: { label: "Resolvido", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  CLOSED: { label: "Fechado", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; badge: string; dot: string }> = {
  LOW: { label: "Baixa", color: "text-slate-400", badge: "bg-slate-800 text-slate-300 border-slate-700", dot: "bg-slate-400" },
  MEDIUM: { label: "Média", color: "text-blue-400", badge: "bg-blue-900/30 text-blue-400 border-blue-800", dot: "bg-blue-400" },
  HIGH: { label: "Alta", color: "text-amber-400", badge: "bg-amber-900/30 text-amber-400 border-amber-800", dot: "bg-amber-400" },
  URGENT: { label: "Urgente", color: "text-rose-400", badge: "bg-rose-900/30 text-rose-400 border-rose-800", dot: "bg-rose-500" },
};

const CATEGORY_CONFIG: Record<string, string> = {
  DUVIDA_TECNICA: "Dúvida Técnica",
  BUG: "Erro / Bug",
  FINANCEIRO: "Financeiro",
  SOLICITACAO_RECURSO: "Sugestão de Recurso",
  OUTROS: "Outros",
};

function getChatDateLabel(dateInput?: string | number | Date): string {
  if (!dateInput) return 'Hoje';
  const date = new Date(dateInput);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function SuperAdminSupportContent() {
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const initialTicketId = searchParams.get("ticketId");

  // Sub-aba Ativa: 'customer_service' (Atendimento ao Cliente) | 'team_chat' (Chat da Equipe) | 'ai_config' (Agente IA de Suporte)
  const [activeSubView, setActiveSubView] = useState<'customer_service' | 'team_chat' | 'ai_config'>('customer_service');

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Sincronização em tempo real via WebSocket para o Super Admin
  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdated = (updatedTicket: any) => {
      if (!updatedTicket || !updatedTicket.id) return;

      if (updatedTicket.updatedConfig) {
        setAiConfig(updatedTicket.updatedConfig);
      }

      setSelectedTicket((prev: any) => {
        if (prev && prev.id === updatedTicket.id) {
          return {
            ...prev,
            ...updatedTicket,
            messages: updatedTicket.messages || prev.messages,
          };
        }
        return prev;
      });

      setTickets((prev) => {
        const idx = prev.findIndex((t) => t.id === updatedTicket.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updatedTicket };
          return next;
        }
        return [updatedTicket, ...prev];
      });
    };

    socket.on("adminTicketUpdated", handleTicketUpdated);
    socket.on("ticketUpdated", handleTicketUpdated);

    return () => {
      socket.off("adminTicketUpdated", handleTicketUpdated);
      socket.off("ticketUpdated", handleTicketUpdated);
    };
  }, [socket]);

  // Governança & Configuração do Agente IA de Suporte
  const [aiConfig, setAiConfig] = useState<{
    id?: string;
    name: string;
    model: string;
    prompt: string;
    knowledgeBase: string;
    guardrails: string;
    isActive: boolean;
    autoHandoffCrm: boolean;
    autoCloseSolved: boolean;
  }>({
    name: "Sofia - Suporte Vallor",
    model: "gpt-4o-mini",
    prompt: "",
    knowledgeBase: "",
    guardrails: "",
    isActive: true,
    autoHandoffCrm: true,
    autoCloseSolved: true,
  });
  const [loadingAiConfig, setLoadingAiConfig] = useState(false);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [togglingTicketAi, setTogglingTicketAi] = useState(false);

  // Filtros da fila
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("ALL");

  // Restaurar dados do cache no cliente com segurança pós-hidratação (Zero Mismatch)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("versus_super_support_tickets");
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          setTickets(list);
          setLoadingList(false);
        }
      }
      const cachedTenants = sessionStorage.getItem("versus_super_tenants_simple");
      if (cachedTenants) {
        const tList = JSON.parse(cachedTenants);
        if (Array.isArray(tList) && tList.length > 0) {
          setTenantsList(tList);
        }
      }
    } catch {}
  }, []);

  // Mensagens do Cliente (Atendimento WhatsApp)
  const [clientMessage, setClientMessage] = useState("");
  const [sendingClientMessage, setSendingClientMessage] = useState(false);

  // Mensagens do Chat Interno da Equipe
  const [teamMessage, setTeamMessage] = useState("");
  const [sendingTeamMessage, setSendingTeamMessage] = useState(false);

  // Mentoria & Treinamento da IA (Sofia) no Chat Interno
  const [internalMode, setInternalMode] = useState<'note' | 'coach_ai'>('coach_ai');
  const [quotedCoachMessage, setQuotedCoachMessage] = useState<any | null>(null);
  const [coachingAi, setCoachingAi] = useState(false);

  // Copiloto IA de Atendimento Híbrido
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotData, setCopilotData] = useState<{
    summary?: string;
    suggestedResponse?: string;
    recommendedStatus?: string;
    recommendedStatusReason?: string;
    keyActions?: string[];
  } | null>(null);

  // Modais e Painéis
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const [showQueuePanel, setShowQueuePanel] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [sendingToEngineering, setSendingToEngineering] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sincronizar preferências de layout das barras laterais com localStorage
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem("versus_support_queue_open");
      if (savedQueue !== null) setShowQueuePanel(savedQueue === "true");
      const savedSide = localStorage.getItem("versus_support_side_open");
      if (savedSide !== null) setShowSidePanel(savedSide === "true");
    } catch {}
  }, []);

  const toggleQueuePanel = () => {
    setShowQueuePanel((prev) => {
      const next = !prev;
      try { localStorage.setItem("versus_support_queue_open", String(next)); } catch {}
      return next;
    });
  };

  const toggleSidePanel = () => {
    setShowSidePanel((prev) => {
      const next = !prev;
      try { localStorage.setItem("versus_support_side_open", String(next)); } catch {}
      return next;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamMessagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar lista de empresas para o filtro
  useEffect(() => {
    api.get("/tenants", { params: { limit: "100", simple: "true" } })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setTenantsList(list);
        try {
          sessionStorage.setItem("versus_super_tenants_simple", JSON.stringify(list));
        } catch {}
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchTickets = useCallback(async (selectIdAfter?: string) => {
    const hasCache = typeof window !== "undefined" && Boolean(sessionStorage.getItem("versus_super_support_tickets"));
    if (!hasCache) {
      setLoadingList(true);
    }
    try {
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      if (selectedTenantId !== "ALL") params.tenantId = selectedTenantId;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/support/tickets", { params });
      const fetched = res.data.tickets || [];
      setTickets(fetched);
      try {
        sessionStorage.setItem("versus_super_support_tickets", JSON.stringify(fetched));
      } catch {}

      // Auto-selecionar ticket inicial ou manter seleção
      const targetId = selectIdAfter || initialTicketId;
      if (targetId) {
        const found = fetched.find((t: any) => t.id === targetId);
        if (found) {
          loadTicketDetails(targetId);
        } else if (fetched.length > 0 && !selectedTicket) {
          if (typeof window !== "undefined" && window.innerWidth >= 768) {
            loadTicketDetails(fetched[0].id);
          }
        }
      } else if (fetched.length > 0 && !selectedTicket) {
        // No desktop auto-seleciona o primeiro da fila; no mobile mantém a lista visível
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
          loadTicketDetails(fetched[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar fila de chamados.");
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, priorityFilter, selectedTenantId, search, initialTicketId, selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadTicketDetails = async (ticketId: string) => {
    setLoadingTicket(true);
    // Limpa sugestão anterior de IA ao trocar de chamado
    setCopilotData(null);

    // Otimização de transição ágil (especialmente em conexões móveis):
    // Pré-carrega dados do ticket básico se já estiver na lista para abrir a tela de imediato
    const basicTicket = tickets.find((t: any) => t.id === ticketId);
    if (basicTicket) {
      setSelectedTicket((prev: any) => ({
        ...basicTicket,
        messages: prev?.id === ticketId ? (prev.messages || []) : [],
      }));
    }

    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        teamMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar detalhes do chamado.");
    } finally {
      setLoadingTicket(false);
    }
  };

  // Quando a URL contiver ticketId (ex: clicou em "Atender Chamado" na notificação)
  useEffect(() => {
    if (initialTicketId) {
      setActiveSubView('customer_service');
      loadTicketDetails(initialTicketId);
    }
  }, [initialTicketId]);

  // Carregar Configuração do Agente IA
  const fetchAiConfig = useCallback(async () => {
    setLoadingAiConfig(true);
    try {
      const res = await api.get("/support/ai/config");
      if (res.data) {
        setAiConfig(res.data);
      }
    } catch (err) {
      console.error("Erro ao carregar configuração da IA de Suporte:", err);
    } finally {
      setLoadingAiConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchAiConfig();
  }, [fetchAiConfig]);

  // Recarrega dados frescos sempre que o Super Admin alternar para a aba do Agente IA
  useEffect(() => {
    if (activeSubView === 'ai_config') {
      fetchAiConfig();
    }
  }, [activeSubView, fetchAiConfig]);

  // Salvar Configuração do Agente IA
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAiConfig(true);
    try {
      const { id, createdAt, updatedAt, ...cleanPayload } = aiConfig as any;
      const res = await api.patch("/support/ai/config", cleanPayload);
      setAiConfig(res.data);
      toast.success("Configuração do Agente IA salva com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao salvar configuração da IA.");
    } finally {
      setSavingAiConfig(false);
    }
  };

  // Pausar ou Retomar IA no Chamado Selecionado
  const handleToggleTicketAi = async () => {
    if (!selectedTicket || togglingTicketAi) return;
    setTogglingTicketAi(true);
    try {
      const nextPaused = !selectedTicket.isAiPaused;
      const res = await api.patch(`/support/tickets/${selectedTicket.id}/toggle-ai`, {
        isPaused: nextPaused,
      });
      setSelectedTicket((prev: any) => ({
        ...prev,
        isAiPaused: res.data.isAiPaused,
      }));
      if (nextPaused) {
        toast.success("Atendimento Humano assumido: IA pausada neste chamado!");
      } else {
        toast.success("IA de Suporte reativada para responder este chamado!");
      }
      fetchTickets();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao alterar controle da IA para este chamado.");
    } finally {
      setTogglingTicketAi(false);
    }
  };

  // Envio de Mensagem Oficial ao Cliente (WhatsApp)
  const handleSendClientMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientMessage.trim() || !selectedTicket || sendingClientMessage) return;

    setSendingClientMessage(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: clientMessage.trim(),
        isInternal: false,
      });

      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [...(prev.messages || []), res.data],
      }));

      setClientMessage("");
      setShowEmojiPicker(false);
      toast.success("Resposta enviada ao cliente com sucesso!");

      fetchTickets();

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao enviar resposta ao cliente.");
    } finally {
      setSendingClientMessage(false);
    }
  };

  // Iniciar mentoria a partir de uma resposta específica da Sofia no chat
  const handleStartCoachingFromMessage = (msg: any) => {
    setQuotedCoachMessage(msg);
    setInternalMode('coach_ai');
    setActiveSubView('team_chat');
  };

  // Enviar instrução de mentoria e treinamento para a Sofia
  const handleCoachSupportAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!teamMessage.trim() || !selectedTicket || coachingAi) return;

    setCoachingAi(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/coach-ai`, {
        feedback: teamMessage.trim(),
        targetMessageId: quotedCoachMessage?.id || undefined,
        quotedText: quotedCoachMessage?.content || undefined,
      });

      const { parsedResult, updatedConfig, aiResponseMessage, adminMessage } = res.data;

      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          adminMessage,
          aiResponseMessage,
        ],
      }));

      if (updatedConfig) {
        setAiConfig(updatedConfig);
      }

      setTeamMessage("");
      setQuotedCoachMessage(null);
      toast.success(
        `Diretriz assimilada pela Sofia com sucesso na camada: ${parsedResult?.categoryLabel || "Base de Conhecimento"}`
      );

      setTimeout(() => {
        teamMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao processar mentoria com a IA.");
    } finally {
      setCoachingAi(false);
    }
  };

  // Envio de Mensagem Privada no Chat da Equipe
  const handleSendTeamMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!teamMessage.trim() || !selectedTicket || sendingTeamMessage) return;

    setSendingTeamMessage(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: teamMessage.trim(),
        isInternal: true,
      });

      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [...(prev.messages || []), res.data],
      }));

      setTeamMessage("");
      toast.success("Mensagem interna registrada com sucesso!");

      setTimeout(() => {
        teamMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao enviar mensagem interna.");
    } finally {
      setSendingTeamMessage(false);
    }
  };

  // Roteador de envio do chat interno (Nota Técnica vs Treinamento IA)
  const handleSendTeamAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (internalMode === 'coach_ai') {
      return handleCoachSupportAi(e);
    }
    return handleSendTeamMessage(e);
  };

  // Acionar Copiloto IA de Atendimento Híbrido
  const handleTriggerAiCopilot = async () => {
    if (!selectedTicket || copilotLoading) return;
    setIsCopilotOpen(true);
    setCopilotLoading(true);

    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/ai-copilot-suggest`);
      setCopilotData(res.data);
      toast.success("Sugestão técnica gerada com sucesso pelo Copiloto IA!");
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível gerar a sugestão com IA no momento.");
    } finally {
      setCopilotLoading(false);
    }
  };

  // Aplicar Sugestão da IA diretamente no input do atendente humano
  const handleApplyAiSuggestion = () => {
    if (!copilotData?.suggestedResponse) return;
    setClientMessage(copilotData.suggestedResponse);
    toast.success("Sugestão inserida no campo de resposta! Revise e envie.");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Aplicar Status Recomendado pela IA
  const handleApplyAiStatus = async () => {
    if (!copilotData?.recommendedStatus) return;
    await handleUpdateStatus(copilotData.recommendedStatus);
  };

  const handleSendToEngineering = async () => {
    if (!selectedTicket || sendingToEngineering) return;
    setSendingToEngineering(true);
    try {
      await api.post('/engineering/items/from-ticket', {
        ticketId: selectedTicket.id,
      });
      toast.success("Demanda enviada com sucesso para o Backlog de Engenharia de Produto!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao enviar chamado para a Engenharia.");
    } finally {
      setSendingToEngineering(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    try {
      const res = await api.patch(`/support/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
      });
      setSelectedTicket((prev: any) => ({ ...prev, status: res.data.status }));
      const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
      
      if (newStatus === 'RESOLVED') {
        toast.success(`Chamado marcado como Resolvido! Deseja converter em melhoria técnica?`, {
          action: {
            label: "Enviar p/ Engenharia",
            onClick: () => handleSendToEngineering(),
          },
          duration: 7000,
        });
      } else {
        toast.success(`Status alterado para ${statusLabel}`);
      }
      fetchTickets();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao atualizar status do chamado.");
    }
  };

  const handleCopyDescription = () => {
    if (!selectedTicket?.description) return;
    navigator.clipboard.writeText(selectedTicket.description);
    setCopiedDescription(true);
    toast.success("Texto da dúvida copiado para a área de transferência!");
    setTimeout(() => setCopiedDescription(false), 2000);
  };

  // Separação Rígida das Mensagens:
  // - publicMessages: 100% visíveis ao cliente no WhatsApp
  // - teamMessages: 100% internas entre os operadores
  const publicMessages = (selectedTicket?.messages || []).filter((msg: any) => !msg.isInternal);
  const teamMessages = (selectedTicket?.messages || []).filter((msg: any) => msg.isInternal);

  const totalOpenTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col w-full max-w-[1600px] mx-auto overflow-hidden text-slate-100">
      
      {/* 1. TOPO DA CENTRAL: TÍTULO & NAVEGAÇÃO DE SUBCATEGORIAS */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pb-3 border-b border-slate-800 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Headphones size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Central de Atendimento ao Vivo
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                Vallor Suporte
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Atendimento unificado ao cliente, respostas com Copiloto IA e canal interno dedicado da equipe.
            </p>
          </div>
        </div>

        {/* NAVEGADOR DE SUBCATEGORIAS: ATENDIMENTO AO CLIENTE vs CHAT INTERNO DA EQUIPE */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070D1B] p-1 rounded-xl border border-slate-800">
            {/* Aba 1: Atendimento ao Cliente */}
            <button
              type="button"
              onClick={() => setActiveSubView('customer_service')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubView === 'customer_service'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare size={14} />
              <span>Atendimento ao Cliente</span>
              {totalOpenTickets > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeSubView === 'customer_service' ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300'
                }`}>
                  {totalOpenTickets}
                </span>
              )}
            </button>

            {/* Aba 2: Chat Interno da Equipe */}
            <button
              type="button"
              onClick={() => setActiveSubView('team_chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubView === 'team_chat'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users size={14} />
              <span>Chat Interno da Equipe</span>
              {teamMessages.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeSubView === 'team_chat' ? 'bg-purple-800 text-purple-100' : 'bg-purple-950/80 text-purple-300'
                }`}>
                  {teamMessages.length}
                </span>
              )}
            </button>

            {/* Aba 3: Agente IA de Suporte */}
            <button
              type="button"
              onClick={() => {
                setActiveSubView('ai_config');
                fetchAiConfig();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubView === 'ai_config'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot size={14} className={aiConfig.isActive ? "text-cyan-300" : "text-slate-400"} />
              <span>Agente IA de Suporte</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                aiConfig.isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {aiConfig.isActive ? "ATIVO" : "OFF"}
              </span>
            </button>
          </div>

          <button
            onClick={() => fetchTickets()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1224] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Atualizar lista de chamados"
          >
            <RefreshCw size={13} className={loadingList ? "animate-spin text-blue-400" : ""} />
            <span className="hidden md:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* 2. CORPO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden pt-3 gap-3">
        
        {/* ========================================================================= */}
        {/* SUB-ABA 1: ATENDIMENTO AO CLIENTE (PADRÃO WHATSAPP BUSINESS)               */}
        {/* ========================================================================= */}
        {activeSubView === 'customer_service' && (
          <>
            {/* COLUNA 1: FILA DE ATENDIMENTO (Minimizável) */}
            {showQueuePanel && (
              <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-84 xl:w-90 bg-[#0B1224] border border-slate-800 rounded-xl flex-col overflow-hidden shrink-0 shadow-xl transition-all duration-200 animate-fadeIn`}>
                
                {/* Topo da Fila: Título com Contador & Botão Minimizar */}
                <div className="p-3 border-b border-slate-800 bg-[#070D1B] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={15} className="text-blue-400" />
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">Conversas & Fila</h2>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold px-1.5 py-0.2 rounded-full">
                        {tickets.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleQueuePanel}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Minimizar fila lateral de conversas"
                    >
                      <PanelLeftClose size={16} />
                    </button>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar chamados..."
                      className="w-full bg-[#070D1B] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#070D1B] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none cursor-pointer focus:border-blue-500"
                    >
                      <option value="ALL">Status: Todos</option>
                      <option value="OPEN">Abertos</option>
                      <option value="IN_PROGRESS">Em Atendimento</option>
                      <option value="WAITING_CLIENT">Aguardando Cliente</option>
                      <option value="RESOLVED">Resolvidos</option>
                      <option value="CLOSED">Fechados</option>
                    </select>

                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      className="bg-[#070D1B] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none truncate cursor-pointer focus:border-blue-500"
                    >
                      <option value="ALL">Empresa: Todas</option>
                      {tenantsList.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista de Chamados */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar bg-[#0B1224]">
                  {loadingList ? (
                    <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-blue-400" />
                      <span>Carregando conversas...</span>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Nenhum chamado encontrado na fila.
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const isSelected = selectedTicket?.id === ticket.id;
                      const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                      const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
                      const companyInitial = (ticket.tenant?.name || "E").charAt(0).toUpperCase();

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => loadTicketDetails(ticket.id)}
                          className={`p-3 cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-slate-800/80 border-l-4 border-blue-500 shadow-sm"
                              : "hover:bg-slate-800/30 border-l-4 border-transparent"
                          }`}
                        >
                          {/* Avatar com Inicial da Empresa */}
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 relative mt-0.5">
                            {companyInitial}
                            {ticket.status === 'OPEN' && (
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute -top-0.5 -right-0.5 ring-2 ring-[#0B1224]" />
                            )}
                          </div>

                          {/* Conteúdo do Card */}
                          <div className="flex-1 min-w-0">
                            {/* Linha 1: Nome da Empresa + Hora */}
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-semibold text-xs text-white truncate">
                                {ticket.tenant?.name || "Empresa"}
                              </span>
                              <span className={`text-[10px] shrink-0 font-mono ${ticket.status === 'OPEN' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                                {new Date(ticket.updatedAt || ticket.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            {/* Linha 2: Solicitante + Assunto em formato snippet */}
                            <p className="text-[11px] text-slate-400 truncate mb-1">
                              <strong className="text-slate-300">{ticket.user?.name ? `${ticket.user.name.split(' ')[0]}: ` : ''}</strong>
                              {ticket.subject}
                            </p>

                            {/* Linha 3: Protocolo + Status Traduzido + Prioridade */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="font-mono text-[9px] font-bold text-blue-400">
                                  #{ticket.ticketNumber || ticket.id.substring(0, 5).toUpperCase()}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                  {statusCfg.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                                <span className="text-[9px] text-slate-400">{priorityCfg.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* COLUNA 2: JANELA DE ATENDIMENTO */}
            <div className={`${!selectedTicket ? 'hidden md:flex' : 'flex'} flex-1 w-full bg-[#0B1224] border border-slate-800 rounded-xl flex-col overflow-hidden relative shadow-2xl transition-all duration-200`}>
              
              {/* Textura Sutil no Padrão do Layout */}
              <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

              {selectedTicket ? (
                <>
                  {/* HEADER DO ATENDIMENTO: LAYOUT FLEXÍVEL SEM SOBREPOSIÇÃO */}
                  <div className="min-h-[58px] px-3 md:px-4 py-2 border-b border-slate-800 bg-[#070D1B] flex flex-wrap items-center justify-between gap-2 z-10 shrink-0">
                    
                    {/* Bloco Esquerdo: Informações do Cliente & Alternador da Fila */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Botão Voltar para Fila (Mobile) */}
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                        className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="Voltar para a lista de chamados"
                      >
                        <ArrowLeft size={18} />
                      </button>

                      {/* Botão Expandir/Minimizar Fila (Desktop) */}
                      <button
                        type="button"
                        onClick={toggleQueuePanel}
                        className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#0B1224] hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0 shadow-sm"
                        title={showQueuePanel ? "Recolher fila de chamados" : "Expandir fila de chamados"}
                      >
                        {showQueuePanel ? (
                          <>
                            <PanelLeftClose size={15} className="text-slate-400" />
                            <span className="text-[11px] text-slate-400">Recolher</span>
                          </>
                        ) : (
                          <>
                            <PanelLeftOpen size={15} className="text-blue-400" />
                            <span className="text-[11px] text-blue-300 font-bold">Fila ({tickets.length})</span>
                          </>
                        )}
                      </button>

                      {/* Avatar do Cliente */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                          {(selectedTicket.tenant?.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-[#070D1B]" title="Canal Ativo" />
                      </div>

                      {/* Dados do Cliente: truncate com min-w-0 para nunca sobrepor os botões */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs md:text-sm font-bold text-white truncate" title={selectedTicket.tenant?.name}>
                            {selectedTicket.tenant?.name || "Empresa Cliente"}
                          </h2>
                          <span className="font-mono text-[10px] md:text-xs text-blue-400 font-bold px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 shrink-0">
                            #{selectedTicket.ticketNumber || selectedTicket.id.substring(0, 5).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <span className="truncate">Solicitante: <strong className="text-slate-200">{selectedTicket.user?.name || "Cliente"}</strong></span>
                          <span>•</span>
                          <span className="text-cyan-400 text-[10px] truncate">{CATEGORY_CONFIG[selectedTicket.category] || selectedTicket.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco Direito: Botões de Ação Compactos e Organizados */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">

                      {/* BADGE CSAT (se avaliado pelo cliente) */}
                      {selectedTicket.satisfactionRating && (
                        <div 
                          className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-bold text-amber-300 shrink-0"
                          title={selectedTicket.satisfactionFeedback ? `Avaliação do Cliente: "${selectedTicket.satisfactionFeedback}"` : "Avaliação CSAT registrada"}
                        >
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>CSAT {selectedTicket.satisfactionRating}/5</span>
                        </div>
                      )}

                      {/* BADGE DEMANDA ENGENHARIA/CRM */}
                      {selectedTicket.aiHandoffDemandId && (
                        <div 
                          className="hidden lg:flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-lg text-xs font-bold text-cyan-300 shrink-0"
                          title="Demanda catalogada no Backlog de Engenharia"
                        >
                          <Cpu size={12} className="text-cyan-400" />
                          <span>Demanda</span>
                        </div>
                      )}

                      {/* BOTÃO ASSUMIR ATENDIMENTO HUMANO / REATIVAR IA */}
                      <button
                        type="button"
                        onClick={handleToggleTicketAi}
                        disabled={togglingTicketAi}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-sm shrink-0 ${
                          selectedTicket.isAiPaused
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                            : "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60"
                        }`}
                        title={
                          selectedTicket.isAiPaused
                            ? "A IA está pausada para este chamado. Clique para reativar as respostas da IA."
                            : "Clique para assumir o chamado com operador humano e pausar a IA."
                        }
                      >
                        {togglingTicketAi ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : selectedTicket.isAiPaused ? (
                          <>
                            <Play size={13} className="text-emerald-400 shrink-0" />
                            <span>Reativar IA</span>
                          </>
                        ) : (
                          <>
                            <Pause size={13} className="text-amber-400 shrink-0" />
                            <span>Pausar IA</span>
                          </>
                        )}
                      </button>

                      {/* BOTÃO DO COPILOTO IA */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCopilotOpen && !copilotData) {
                            handleTriggerAiCopilot();
                          } else {
                            setIsCopilotOpen(prev => !prev);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
                          isCopilotOpen
                            ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 font-black"
                            : "bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40"
                        }`}
                        title="Abrir o Copiloto IA de Atendimento Híbrido"
                      >
                        <Sparkles size={13} className={copilotLoading ? "animate-spin" : isCopilotOpen ? "text-slate-950" : "text-cyan-400"} />
                        <span>Copiloto</span>
                      </button>

                      {/* Botão Ver Dúvida Original */}
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(true)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer shrink-0"
                        title="Ler a solicitação original completa do cliente"
                      >
                        <FileText size={13} className="text-blue-400" />
                        <span className="hidden sm:inline">Dúvida</span>
                      </button>

                      {/* Botão Enviar para Engenharia */}
                      <button
                        type="button"
                        onClick={handleSendToEngineering}
                        disabled={sendingToEngineering}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer shrink-0"
                        title="Enviar para o Kanban de Engenharia de Produto"
                      >
                        <Cpu size={13} className="text-cyan-400" />
                        <span className="hidden sm:inline">{sendingToEngineering ? "..." : "Engenharia"}</span>
                      </button>

                      {/* Seletor de Status Traduzido */}
                      <div className="flex items-center bg-[#0B1224] border border-slate-800 rounded-lg px-2 py-1 shrink-0">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="OPEN" className="bg-[#0B1224] text-amber-400">Aberto</option>
                          <option value="IN_PROGRESS" className="bg-[#0B1224] text-blue-400">Em Atendimento</option>
                          <option value="WAITING_CLIENT" className="bg-[#0B1224] text-purple-400">Aguardando Cliente</option>
                          <option value="RESOLVED" className="bg-[#0B1224] text-emerald-400">Resolvido</option>
                          <option value="CLOSED" className="bg-[#0B1224] text-slate-400">Fechado</option>
                        </select>
                      </div>

                      {/* Alternador do Painel Lateral Raio-X */}
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined" && window.innerWidth < 1280) {
                            setIsXRayOpen(true);
                          } else {
                            toggleSidePanel();
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors cursor-pointer text-xs font-semibold shrink-0 ${
                          showSidePanel
                            ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                            : "bg-[#0B1224] border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                        title={showSidePanel ? "Ocultar painel Raio-X" : "Exibir painel Raio-X"}
                      >
                        {showSidePanel ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                        <span className="hidden sm:inline">Raio-X</span>
                      </button>
                    </div>
                  </div>

                  {/* PAINEL RETRÁTIL DO COPILOTO IA DE ATENDIMENTO HÍBRIDO */}
                  {isCopilotOpen && (
                    <div className="border-b border-cyan-500/30 bg-gradient-to-r from-[#071322] via-[#0B1A2E] to-[#071322] p-4 z-10 shadow-lg relative animate-fadeIn shrink-0">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-cyan-500 text-slate-950 font-bold">
                            <Sparkles size={14} />
                          </div>
                          <span className="text-xs font-bold text-white tracking-wide">
                            Copiloto IA de Atendimento Híbrido
                          </span>
                          <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.2 rounded-full font-mono">
                            Sugestão Técnica para o Atendente
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleTriggerAiCopilot}
                            disabled={copilotLoading}
                            className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer px-2 py-0.5 rounded bg-[#0B1224] border border-cyan-500/30"
                          >
                            <RefreshCw size={11} className={copilotLoading ? "animate-spin" : ""} />
                            <span>{copilotLoading ? "Analisando..." : "Regerar Sugestão"}</span>
                          </button>
                          <button
                            onClick={() => setIsCopilotOpen(false)}
                            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                            title="Fechar Copiloto"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>

                      {copilotLoading ? (
                        <div className="py-6 text-center text-cyan-300 text-xs flex flex-col items-center justify-center gap-2">
                          <Loader2 size={20} className="animate-spin text-cyan-400" />
                          <span>O Copiloto IA está analisando a dúvida técnica e histórico do cliente...</span>
                        </div>
                      ) : copilotData ? (
                        <div className="space-y-3 text-xs">
                          {/* Diagnóstico em 1 frase */}
                          {copilotData.summary && (
                            <div className="text-[11px] text-slate-200 bg-[#0B1224]/80 border border-cyan-500/20 p-2 rounded-lg">
                              <strong className="text-cyan-400 font-semibold">Resumo do Diagnóstico:</strong> {copilotData.summary}
                            </div>
                          )}

                          {/* Caixa da Resposta Sugerida */}
                          <div className="bg-[#0B1224] border border-cyan-500/30 rounded-xl p-3 text-slate-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-normal">
                            {copilotData.suggestedResponse}
                          </div>

                          {/* Ações de 1 Clique: Usar Sugestão & Atualizar Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              {copilotData.recommendedStatus && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <span>Status Recomendado:</span>
                                  <span className="font-bold text-blue-400 font-mono">
                                    {STATUS_CONFIG[copilotData.recommendedStatus]?.label || copilotData.recommendedStatus}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleApplyAiStatus}
                                    className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Aplicar Status
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleApplyAiSuggestion}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
                            >
                              <Sparkles size={14} />
                              <span>Usar Sugestão no Chat</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs">
                          Clique em &quot;Regerar Sugestão&quot; para acionar o copiloto.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. ÁREA DE MENSAGENS COM BALÕES NO PADRÃO DO LAYOUT */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar z-10">
                    
                    {/* MENSAGEM FIXADA NO TOPO: SOLICITAÇÃO ORIGINAL DO CLIENTE */}
                    {selectedTicket.description && (
                      <div className="flex justify-center mb-4">
                        <div className="w-full max-w-2xl bg-[#070D1B] border border-slate-800 rounded-xl p-3.5 shadow-md">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-400 border-b border-slate-800 pb-1.5 mb-2">
                            <span className="flex items-center gap-1.5">
                              <FileText size={14} />
                              <span>Solicitação Original #{selectedTicket.ticketNumber} ({selectedTicket.user?.name || "Cliente"})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsDetailModalOpen(true)}
                              className="text-[11px] text-blue-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                            >
                              <Maximize2 size={11} />
                              <span>Expandir</span>
                            </button>
                          </div>

                          <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {selectedTicket.description}
                          </p>

                          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
                            <span>Aberto em: {new Date(selectedTicket.createdAt).toLocaleString("pt-BR")}</span>
                            <span className="font-semibold text-blue-400">{selectedTicket.subject}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LISTAGEM DE MENSAGENS PÚBLICAS */}
                    {publicMessages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center">
                        <MessageSquare size={32} className="opacity-30 mb-2 text-blue-400" />
                        <p className="text-white font-semibold">Inicie a conversa com o cliente.</p>
                        <p>Digite uma resposta humanizada ou use o Copiloto IA para sugerir uma solução técnica pronta.</p>
                      </div>
                    ) : (
                      publicMessages.map((msg: any, idx: number) => {
                        const isAi = msg.senderRole === "AI_AGENT";
                        const isOperator = msg.senderRole === "SUPER_ADMIN" || msg.senderRole === "ADMIN" || msg.senderRole === "AGENT" || isAi;
                        
                        // Separador de Data
                        const prevMsg = idx > 0 ? publicMessages[idx - 1] : null;
                        const currentDateLabel = getChatDateLabel(msg.createdAt);
                        const prevDateLabel = prevMsg ? getChatDateLabel(prevMsg.createdAt) : null;
                        const showDateDivider = idx === 0 || currentDateLabel !== prevDateLabel;

                        return (
                          <div key={msg.id || idx} className="flex flex-col">
                            {/* Pílula de Data */}
                            {showDateDivider && (
                              <div className="flex justify-center my-2">
                                <div className="bg-[#070D1B] text-slate-400 text-[10px] font-medium px-3 py-0.5 rounded-lg shadow-sm border border-slate-800 uppercase tracking-wide">
                                  {currentDateLabel}
                                </div>
                              </div>
                            )}

                            {/* Balão de Mensagem */}
                            <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%] ${isOperator ? 'self-end items-end' : 'self-start items-start'} relative group my-1`}>
                              <div className={`text-xs shadow-md relative pt-2.5 pb-2 px-3.5 min-w-[140px] leading-relaxed rounded-2xl ${
                                isAi
                                  ? 'bg-gradient-to-br from-[#0c223c] to-[#081729] text-slate-100 rounded-tr-sm border border-cyan-500/40 ring-1 ring-cyan-500/20'
                                  : isOperator
                                  ? 'bg-[#13233e] text-slate-100 rounded-tr-sm border border-blue-500/30'
                                  : 'bg-[#1E293B] text-slate-100 rounded-tl-sm border border-slate-700/60'
                              }`}>

                                {/* Nome do Remetente */}
                                <div className="flex items-center justify-between gap-3 text-[10px] font-bold mb-1 pb-0.5 border-b border-white/10">
                                  <span className={isAi ? "text-cyan-300 flex items-center gap-1.5" : isOperator ? "text-blue-300" : "text-slate-300"}>
                                    {isAi && <Bot size={12} className="text-cyan-300 shrink-0" />}
                                    {msg.senderName || (isAi ? "Sofia - Suporte Vallor" : isOperator ? "Suporte Vallor" : "Cliente")}
                                  </span>
                                  <span className={`font-mono text-[9px] px-1 py-0.2 rounded uppercase ${
                                    isAi 
                                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40" 
                                      : isOperator 
                                      ? "text-blue-300/80" 
                                      : "text-slate-400"
                                  }`}>
                                    {isAi ? "IA Autônoma" : isOperator ? "Operador" : "Cliente"}
                                  </span>
                                </div>

                                {/* Texto da Mensagem */}
                                <p className="whitespace-pre-wrap leading-relaxed text-slate-100 font-normal">{msg.content}</p>

                                {/* Horário e Check ou Sparkles para IA */}
                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                                  <span className="text-slate-400">
                                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  {isAi ? (
                                    <span title="Gerado por IA Autônoma">
                                      <Sparkles size={12} className="text-cyan-300" />
                                    </span>
                                  ) : isOperator ? (
                                    <CheckCheck size={13} className="text-blue-400" />
                                  ) : null}
                                </div>

                                {/* Botão Executivo de Mentoria sobre a Resposta da Sofia */}
                                {isAi && (
                                  <div className="pt-1.5 mt-1.5 border-t border-cyan-500/20 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartCoachingFromMessage(msg)}
                                      className="text-[10px] font-semibold text-cyan-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30"
                                      title="Orientar a Sofia sobre esta resposta no canal interno de treinamento"
                                    >
                                      <GraduationCap size={11} className="text-cyan-400" />
                                      <span>Orientar / Treinar Sofia</span>
                                    </button>
                                    <span className="text-[9px] text-cyan-400/80 font-mono">
                                      Resposta Autônoma
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 4. COMPOSER NO PADRÃO DO LAYOUT (SEM EMOJIS INFORMÁIS) */}
                  <div className="p-3 border-t border-slate-800 bg-[#070D1B] z-10 relative shrink-0">
                    {/* Formulário de Envio */}
                    <form onSubmit={handleSendClientMessage} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {/* Botão Treinar IA */}
                        <button
                          type="button"
                          onClick={() => {
                            setInternalMode('coach_ai');
                            setActiveSubView('team_chat');
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-xs font-semibold text-blue-300 transition-all cursor-pointer shrink-0 shadow-sm"
                          title="Abrir o canal de treinamento da equipe para orientar a Sofia"
                        >
                          <Bot size={14} className="text-cyan-400" />
                          <span className="hidden sm:inline">Treinar IA</span>
                        </button>

                        {/* Botão Copiloto IA (Sugerir IA) */}
                        <button
                          type="button"
                          onClick={handleTriggerAiCopilot}
                          disabled={copilotLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-all cursor-pointer shrink-0 shadow-sm"
                          title="Pedir para o Copiloto IA formular a resposta técnica"
                        >
                          <Sparkles size={14} className={copilotLoading ? "animate-spin text-cyan-400" : "text-cyan-400"} />
                          <span className="hidden sm:inline">Sugerir IA</span>
                        </button>

                        {/* Caixa de Texto */}
                        <textarea
                          ref={textareaRef}
                          value={clientMessage}
                          onChange={(e) => setClientMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendClientMessage();
                            }
                          }}
                          placeholder="Digite uma mensagem para o cliente..."
                          rows={1}
                          className="flex-1 bg-[#0B1224] py-2 px-3 text-xs text-white placeholder:text-slate-500 border border-slate-800 rounded-xl outline-none resize-none max-h-32 custom-scrollbar focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />

                        {/* Botão Enviar Circular Azul */}
                        <button
                          type="submit"
                          disabled={sendingClientMessage || !clientMessage.trim()}
                          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95"
                          title="Enviar resposta ao cliente (Enter)"
                        >
                          {sendingClientMessage ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} className="ml-0.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
                        <span>💬 Canal Oficial • A mensagem é sincronizada e entregue ao solicitante em tempo real.</span>
                        <span className="hidden sm:inline">Enter para enviar • Shift + Enter para nova linha</span>
                      </div>
                    </form>
                  </div>
                </>
              ) : loadingTicket ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 gap-3 z-10">
                  <Loader2 size={36} className="animate-spin text-blue-500" />
                  <p className="font-semibold text-white text-sm">Abrindo chamado...</p>
                  <p className="text-slate-500">Buscando mensagens e histórico de atendimento.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 gap-2 z-10">
                  <Headphones size={38} className="text-slate-600" />
                  <p className="font-semibold text-slate-300 text-sm">Nenhum chamado selecionado</p>
                  <p className="text-slate-500">Escolha um chamado na fila lateral para iniciar o atendimento ao cliente.</p>
                </div>
              )}
            </div>

            {/* COLUNA 3: PAINEL LATERAL RAIO-X DA EMPRESA (Minimizável) */}
            {showSidePanel && selectedTicket?.tenant && (
              <div className="hidden xl:flex w-72 lg:w-80 bg-[#0B1224] border border-slate-800 rounded-xl flex-col overflow-hidden shrink-0 shadow-xl animate-fadeIn transition-all duration-200">
                <div className="p-3 border-b border-slate-800 bg-[#070D1B] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-400" />
                    Raio-X da Empresa
                  </h3>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsXRayOpen(true)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-slate-800"
                      title="Abrir detalhes completos em tela cheia"
                    >
                      <span>Expandir</span>
                      <ExternalLink size={11} />
                    </button>
                    <button
                      onClick={toggleSidePanel}
                      className="text-slate-400 hover:text-white cursor-pointer p-1 rounded hover:bg-slate-800"
                      title="Minimizar Raio-X"
                    >
                      <PanelRightClose size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-xs bg-[#0B1224]">
                  {/* Card Empresa */}
                  <div className="p-3 rounded-xl bg-[#070D1B] border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-white truncate text-sm">{selectedTicket.tenant.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {selectedTicket.tenant.cnpj || "Sem CNPJ cadastrado"}
                    </span>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                        Conta Ativa
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {selectedTicket.tenant.plan?.name || "Standard"}
                      </span>
                    </div>
                  </div>

                  {/* Contatos */}
                  <div className="space-y-1.5 text-[11px] p-2.5 rounded-lg bg-[#070D1B] border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate">{selectedTicket.tenant.email || "E-mail não informado"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <PhoneCall size={12} className="text-slate-500 shrink-0" />
                      <span>{selectedTicket.tenant.phone || "Telefone não informado"}</span>
                    </div>
                  </div>

                  {/* Solicitante */}
                  <div className="p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Operador Solicitante</span>
                    <p className="font-semibold text-white truncate">{selectedTicket.user?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedTicket.user?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* SUB-ABA 2: CHAT INTERNO DA EQUIPE & MENTORIA DA IA (SOFIA)               */}
        {/* ========================================================================= */}
        {activeSubView === 'team_chat' && (
          <div className="flex-1 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
            
            {/* Header da Subcategoria da Equipe */}
            <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-[#0F172A] to-[#0B1224] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                  <Bot size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Canal Interno & Mentoria da IA de Suporte
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono uppercase flex items-center gap-1 font-bold">
                      <Lock size={10} /> Confidencial
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Alinhamentos técnicos da equipe e mentoria direta para treinar e ajustar as diretrizes da Sofia. <strong>100% invisível para o cliente.</strong>
                  </p>
                </div>
              </div>

              {selectedTicket && (
                <div className="flex items-center gap-2 bg-[#070D1B] border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-400">Chamado Vinculado:</span>
                  <span className="font-mono text-cyan-400 font-bold">#{selectedTicket.ticketNumber}</span>
                  <span className="text-white font-semibold truncate max-w-xs">{selectedTicket.tenant?.name}</span>
                </div>
              )}
            </div>

            {/* Banner de Garantia e Blindagem */}
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-400 shrink-0" />
                <span>Ambiente Seguro: Nenhuma anotação ou instrução de treinamento postada nesta aba é transmitida para o cliente.</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-bold hidden sm:inline">
                {teamMessages.length} registro(s) interno(s)
              </span>
            </div>

            {/* Listagem de Mensagens do Chat Interno da Equipe */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#070D1B]/50">
              {teamMessages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center max-w-md mx-auto">
                  <Lock size={32} className="opacity-30 mb-2 text-slate-400" />
                  <p className="text-slate-300 font-bold text-sm mb-1">Nenhum registro interno ainda.</p>
                  <p className="text-slate-400">
                    Use o campo abaixo para registrar notas técnicas ou orientar a Sofia sobre correções, novas regras e postura para este chamado.
                  </p>
                </div>
              ) : (
                teamMessages.map((msg: any, idx: number) => {
                  const isSofiaResponse = msg.senderRole === "AI_AGENT";
                  const isCoachingPrompt = msg.content?.startsWith("[ORIENTAÇÃO IA]:");
                  const quoteAttachment = Array.isArray(msg.attachments) ? msg.attachments.find((a: any) => a.type === 'quote') : null;

                  if (isSofiaResponse) {
                    return (
                      <div key={msg.id || idx} className="max-w-2xl mx-auto w-full animate-fadeIn">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c223c]/90 to-[#081729]/95 border border-cyan-500/40 space-y-2 shadow-lg ring-1 ring-cyan-500/20">
                          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 border-b border-cyan-500/20 pb-1.5">
                            <div className="flex items-center gap-2">
                              <Bot size={15} className="text-cyan-400 shrink-0" />
                              <span className="text-white">{msg.senderName || "Sofia - Suporte Vallor"}</span>
                              <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                                Diretriz Assimilada
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(msg.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>

                          <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                            {msg.content}
                          </p>

                          <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                            <span className="text-[10px] text-cyan-400 font-medium">
                              Configuração atualizada no banco de dados e em vigor.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubView('ai_config');
                                fetchAiConfig();
                              }}
                              className="text-[11px] font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 hover:underline cursor-pointer"
                            >
                              <Settings size={12} />
                              <span>Ver no Painel da IA</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isCoachingPrompt) {
                    return (
                      <div key={msg.id || idx} className="max-w-2xl mx-auto w-full animate-fadeIn">
                        <div className="p-3.5 rounded-xl bg-blue-950/25 border border-blue-500/40 space-y-2 shadow-sm">
                          <div className="flex items-center justify-between text-[11px] font-bold text-blue-300 border-b border-blue-500/20 pb-1">
                            <div className="flex items-center gap-2">
                              <GraduationCap size={14} className="text-blue-400 shrink-0" />
                              <span className="text-white">{msg.senderName || "Super Admin"}</span>
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono uppercase font-bold">
                                Treinamento / Mentoria
                              </span>
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(msg.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>

                          {quoteAttachment?.text && (
                            <div className="p-2 rounded-lg bg-[#070D1B] border border-blue-500/20 text-[11px] text-slate-300 italic border-l-2 border-l-cyan-400">
                              <span className="text-[10px] text-cyan-400 font-bold block not-italic uppercase mb-0.5">Resposta do Chamado:</span>
                              &ldquo;{quoteAttachment.text}&rdquo;
                            </div>
                          )}

                          <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {msg.content.replace("[ORIENTAÇÃO IA]:", "").trim()}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id || idx} className="max-w-2xl mx-auto w-full">
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 border-b border-purple-500/20 pb-1">
                          <div className="flex items-center gap-2">
                            <User size={13} className="text-purple-400 shrink-0" />
                            <span>{msg.senderName || "Operador"}</span>
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono uppercase">
                              {msg.senderRole || "OPERADOR"}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {new Date(msg.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={teamMessagesEndRef} />
            </div>

            {/* Composer Privativo da Equipe & Mentoria */}
            <div className="p-4 border-t border-slate-800 bg-[#070D1B]">
              <form onSubmit={handleSendTeamAction} className="space-y-2.5 max-w-3xl mx-auto">
                {/* Alternador de Modo: Nota Técnica vs Mentoria da IA */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center bg-[#0B1224] p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setInternalMode('coach_ai')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        internalMode === 'coach_ai'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Bot size={13} className={internalMode === 'coach_ai' ? 'text-cyan-300' : 'text-slate-500'} />
                      <span>Treinar & Orientar Sofia (IA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInternalMode('note')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        internalMode === 'note'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Lock size={12} className={internalMode === 'note' ? 'text-purple-200' : 'text-slate-500'} />
                      <span>Nota Técnica Interna</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                    {internalMode === 'coach_ai' ? "Modo Curadoria Ativo" : "Modo Alinhamento da Equipe"}
                  </span>
                </div>

                {/* Banner de Mensagem Citada (se vindo do chat do cliente) */}
                {quotedCoachMessage && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs text-blue-200 animate-fadeIn">
                    <div className="flex items-center gap-2 truncate">
                      <GraduationCap size={14} className="text-cyan-400 shrink-0" />
                      <span className="font-bold text-white shrink-0">Orientando sobre resposta da Sofia:</span>
                      <span className="truncate italic text-slate-300 text-[11px]">&ldquo;{quotedCoachMessage.content}&rdquo;</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setQuotedCoachMessage(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors shrink-0 ml-2 cursor-pointer"
                      title="Remover citação"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* Caixa de Texto */}
                <div className={`flex items-end gap-2 bg-[#0B1224] border rounded-2xl p-2.5 transition-all ${
                  internalMode === 'coach_ai'
                    ? 'border-blue-500/50 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30'
                    : 'border-purple-500/40 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/30'
                }`}>
                  <textarea
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendTeamAction();
                      }
                    }}
                    placeholder={
                      internalMode === 'coach_ai'
                        ? "Diga à Sofia o que ela deve ajustar, retirar, acrescentar na base ou como conduzir melhor este tipo de chamado..."
                        : "Escreva um alinhamento interno ou nota técnica para os operadores..."
                    }
                    rows={2}
                    className="flex-1 bg-transparent py-1 px-2 text-xs text-white placeholder:text-slate-500 outline-none resize-none max-h-32 custom-scrollbar"
                  />

                  <button
                    type="submit"
                    disabled={coachingAi || sendingTeamMessage || !teamMessage.trim()}
                    className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 shrink-0 cursor-pointer shadow-md ${
                      internalMode === 'coach_ai'
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                  >
                    {coachingAi || sendingTeamMessage ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>{internalMode === 'coach_ai' ? "Sintetizando..." : "Registrando..."}</span>
                      </>
                    ) : (
                      <>
                        {internalMode === 'coach_ai' ? <Bot size={14} /> : <Lock size={13} />}
                        <span>{internalMode === 'coach_ai' ? "Ensinar Sofia" : "Registrar na Equipe"}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-2">
                  <span className="flex items-center gap-1">
                    <Lock size={11} className="text-slate-500 shrink-0" />
                    <span>Visível exclusivamente para operadores master do Vallor.</span>
                  </span>
                  <span>Enter para enviar • Shift + Enter para quebra de linha</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-ABA 3: CONFIGURAÇÃO DO AGENTE IA DE SUPORTE (GOVERNANÇA & REGRAS)     */}
        {/* ========================================================================= */}
        {activeSubView === 'ai_config' && (
          <div className="flex-1 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
            
            {/* Header da Aba de Governança da IA */}
            <div className="p-4 border-b border-cyan-500/30 bg-gradient-to-r from-[#071322] via-[#0B1A2E] to-[#071322] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg">
                  <Bot size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Agente de IA Autônomo • Central de Atendimento
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                      aiConfig.isActive 
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {aiConfig.isActive ? "Operação Ativa" : "Pausado"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Acolhimento imediato, solução com base nos manuais do Vallor, cancelas de segurança e handoff ao CRM.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAiConfig}
                  disabled={loadingAiConfig}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Recarregar configurações do servidor"
                >
                  <RefreshCw size={13} className={loadingAiConfig ? "animate-spin text-cyan-400" : ""} />
                  <span className="hidden sm:inline">Recarregar</span>
                </button>

                <button
                  type="submit"
                  form="ai-config-form"
                  disabled={savingAiConfig}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {savingAiConfig ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>

            {/* Formulário de Configuração */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#070D1B]/60">
              <form id="ai-config-form" onSubmit={handleSaveAiConfig} className="max-w-4xl mx-auto space-y-6">
                
                {/* 1. Toggles de Automação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Toggle 1: Atendimento Ativo */}
                  <label className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    aiConfig.isActive 
                      ? "bg-cyan-950/20 border-cyan-500/50 shadow-cyan-950/20 shadow-sm" 
                      : "bg-[#0B1224] border-slate-800 opacity-80"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot size={16} className={aiConfig.isActive ? "text-cyan-400" : "text-slate-500"} />
                        <span className="text-xs font-bold text-white">Atendimento Autônomo</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={aiConfig.isActive}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Responde instantaneamente a abertura de chamados e réplicas dos clientes com acolhimento humanizado.
                    </p>
                  </label>

                  {/* Toggle 2: Auto Handoff CRM */}
                  <label className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    aiConfig.autoHandoffCrm 
                      ? "bg-blue-950/20 border-blue-500/50 shadow-blue-950/20 shadow-sm" 
                      : "bg-[#0B1224] border-slate-800 opacity-80"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className={aiConfig.autoHandoffCrm ? "text-blue-400" : "text-slate-500"} />
                        <span className="text-xs font-bold text-white">Handoff CRM / Backlog</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={aiConfig.autoHandoffCrm}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, autoHandoffCrm: e.target.checked }))}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Detecta automaticamente upgrades de planos, novos recursos ou bugs e cria card no Kanban de Engenharia.
                    </p>
                  </label>

                  {/* Toggle 3: Auto Close & CSAT */}
                  <label className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    aiConfig.autoCloseSolved 
                      ? "bg-emerald-950/20 border-emerald-500/50 shadow-emerald-950/20 shadow-sm" 
                      : "bg-[#0B1224] border-slate-800 opacity-80"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={16} className={aiConfig.autoCloseSolved ? "text-emerald-400" : "text-slate-500"} />
                        <span className="text-xs font-bold text-white">Encerramento & CSAT</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={aiConfig.autoCloseSolved}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, autoCloseSolved: e.target.checked }))}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Detecta agradecimento ou confirmação de resolução, marca o ticket como RESOLVIDO e solicita nota de 1 a 5 estrelas.
                    </p>
                  </label>
                </div>

                {/* 2. Identidade & Modelo LLM */}
                <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={14} className="text-cyan-400" />
                    <span>Identidade & Modelo Neural</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Nome de Exibição do Agente
                      </label>
                      <input 
                        type="text"
                        value={aiConfig.name}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Sofia - Suporte Vallor"
                        className="w-full bg-[#070D1B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Modelo de Linguagem (LLM)
                      </label>
                      <select
                        value={aiConfig.model}
                        onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full bg-[#070D1B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (Recomendado • Alta Velocidade & Precisão)</option>
                        <option value="gpt-4o">gpt-4o (Máxima Capacidade Cognitiva & Diagnóstico)</option>
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legado)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2.1 Card de Diretrizes Aprendidas via Mentoria (Visual & Imediato) */}
                {(() => {
                  const allText = `${aiConfig.prompt || ''}\n${aiConfig.knowledgeBase || ''}\n${aiConfig.guardrails || ''}`;
                  const mentorRules: string[] = [];
                  const lines = allText.split('\n');
                  lines.forEach(l => {
                    const trimmed = l.trim();
                    if (trimmed.startsWith('- [CHAMADO') || trimmed.startsWith('- [REGRA ESTRITA - CHAMADO')) {
                      mentorRules.push(trimmed.replace(/^-\s*/, ''));
                    }
                  });

                  if (mentorRules.length === 0) return null;

                  return (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-[#0B1224] border border-cyan-500/40 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-cyan-400" />
                          <span>Diretrizes Aprendidas via Mentoria em Tempo Real</span>
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                          {mentorRules.length} regra(s) ativa(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Orientações assimiladas pela Sofia durante os chamados da Central. Elas estão incorporadas às instruções ativas e já são seguidas nos próximos atendimentos.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {mentorRules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#070D1B]/90 border border-cyan-500/20 text-xs text-slate-200">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0 animate-pulse" />
                            <span className="font-mono text-xs leading-relaxed text-cyan-100">{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Prompt do Sistema / Tom de Voz */}
                <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-cyan-400" />
                      <span>Prompt de Personalidade & Tom de Voz</span>
                    </h3>
                    <span className="text-[10px] text-slate-500">Humanizado, acolhedor e corporativo</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Define como o agente se comunica com os clientes. Ele sempre chama pelo primeiro nome e adota postura resolutiva.
                  </p>
                  <textarea 
                    rows={6}
                    value={aiConfig.prompt}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Instruções de personalidade e acolhimento..."
                    className="w-full bg-[#070D1B] border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors font-mono leading-relaxed custom-scrollbar"
                  />
                </div>

                {/* 4. Base de Conhecimento RAG do Vallor */}
                <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-blue-400" />
                      <span>Base de Conhecimento do Vallor (Manual dos Módulos)</span>
                    </h3>
                    <span className="text-[10px] text-slate-500">Manual operacional completo</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Instruções sobre conexão de WhatsApp (QR Code / Evolution), Whisper áudio, funis de CRM, propostas, contratos com assinatura digital, metas, VoIP e configurações gerais.
                  </p>
                  <textarea 
                    rows={8}
                    value={aiConfig.knowledgeBase}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, knowledgeBase: e.target.value }))}
                    placeholder="Documentação de arquitetura funcional e módulos para resposta aos clientes..."
                    className="w-full bg-[#070D1B] border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors font-mono leading-relaxed custom-scrollbar"
                  />
                </div>

                {/* 5. Cancelas de Segurança (Anti-Leak Guardrails) */}
                <div className="p-4 rounded-xl bg-[#0B1224] border border-rose-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert size={14} className="text-rose-400" />
                      <span>Cancelas Rígidas de Segurança (Anti-Vazamento)</span>
                    </h3>
                    <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 uppercase font-mono font-bold">
                      Blindagem
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Regras inegociáveis para impedir que usuários extraiam dados de outros clientes, credenciais, senhas, chaves de API ou detalhes de código de backend.
                  </p>
                  <textarea 
                    rows={6}
                    value={aiConfig.guardrails}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, guardrails: e.target.value }))}
                    placeholder="Regras estritas de segurança e bloqueio..."
                    className="w-full bg-[#070D1B] border border-rose-900/40 rounded-xl p-3 text-xs text-rose-100 placeholder-slate-500 outline-none focus:border-rose-500 transition-colors font-mono leading-relaxed custom-scrollbar"
                  />
                </div>

                {/* Rodapé de Ações */}
                <div className="flex items-center justify-end gap-3 pt-2 pb-6">
                  <button
                    type="submit"
                    disabled={savingAiConfig}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingAiConfig ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>Salvar Configurações da IA</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO COMPLETA DA DÚVIDA / CHAMADO */}
      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header do Modal */}
            <div className="p-4 border-b border-slate-800 bg-[#0B1224] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      #{selectedTicket.ticketNumber || selectedTicket.id.substring(0, 6).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded border uppercase ${
                      STATUS_CONFIG[selectedTicket.status]?.bg || "bg-blue-500/10"
                    } ${STATUS_CONFIG[selectedTicket.status]?.text || "text-blue-400"} ${
                      STATUS_CONFIG[selectedTicket.status]?.border || "border-blue-500/30"
                    }`}>
                      {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedTicket.subject}</h3>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              
              {/* Metadados do Chamado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#070D1B] border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Empresa</span>
                  <span className="font-bold text-white truncate block">{selectedTicket.tenant?.name || "Empresa"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Solicitante</span>
                  <span className="font-bold text-white truncate block">{selectedTicket.user?.name || "Cliente"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Prioridade</span>
                  <span className={`font-bold block ${PRIORITY_CONFIG[selectedTicket.priority]?.color || "text-blue-400"}`}>
                    {PRIORITY_CONFIG[selectedTicket.priority]?.label || "Média"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Categoria</span>
                  <span className="font-bold text-white truncate block">
                    {CATEGORY_CONFIG[selectedTicket.category] || "Dúvida Técnica"}
                  </span>
                </div>
              </div>

              {/* Texto Completo da Dúvida */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-blue-400" />
                    <span>Descrição / Dúvida Completa Enviada</span>
                  </h4>
                  <button
                    onClick={handleCopyDescription}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
                  >
                    {copiedDescription ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedDescription ? "Copiado!" : "Copiar Texto"}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 text-slate-100 text-xs leading-relaxed whitespace-pre-wrap font-normal">
                  {selectedTicket.description || "Nenhuma descrição fornecida pelo solicitante."}
                </div>
              </div>

              {/* Informações Complementares */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span>Criado em: {new Date(selectedTicket.createdAt).toLocaleString("pt-BR")}</span>
                <span>Última atualização: {new Date(selectedTicket.updatedAt).toLocaleString("pt-BR")}</span>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3 border-t border-slate-800 bg-[#0B1224] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Raio-X Completo */}
      {selectedTicket?.tenant && (
        <CompanyXRayModal
          tenantId={selectedTicket.tenant.id}
          isOpen={isXRayOpen}
          onClose={() => setIsXRayOpen(false)}
        />
      )}
    </div>
  );
}

export default function SuperAdminSupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full py-16 text-slate-400 text-xs gap-2">
          <Loader2 size={16} className="animate-spin text-blue-500" />
          <span>Carregando Central de Atendimento...</span>
        </div>
      }
    >
      <SuperAdminSupportContent />
    </Suspense>
  );
}
