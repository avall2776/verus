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
  Smile,
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
  ShieldAlert
} from "lucide-react";
import api from "@/lib/api";
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

// Emojis Populares para Atendimento Rápido
const QUICK_EMOJIS = [
  '👍', '🤝', '😊', '🙏', '👋', '✅', '🚀', '💡', '💬', '✨',
  '🔥', '🎯', '⭐', '👏', '🙂', '😉', '🙌', '💪', '📞', '⏳'
];

// Textura Sutil Autêntica do WhatsApp Corporativo
const WHATSAPP_WALLPAPER_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360' fill='none' stroke='%23ffffff' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M30 40c0-5.5 4.5-10 10-10h30c5.5 0 10 4.5 10 10v20c0 5.5-4.5 10-10 10H40l-15 15V40z'/%3E%3Ccircle cx='180' cy='60' r='14'/%3E%3Cpath d='M180 52v8l5 3'/%3E%3Cpath d='M315 35l12 24h-24z'/%3E%3Cpath d='M60 180c-5-8-15-8-20 0-5 8 0 16 10 24 10-8 15-16 10-24z'/%3E%3Cpath d='M150 170h35v18c0 9-9 18-18 18s-18-9-18-18v-18z'/%3E%3Cpath d='M185 174c4 0 9 3 9 9s-5 9-9 9'/%3E%3Cpath d='M290 160c-9 0-16 7-16 16v22c0 9 7 16 16 16s16-7 16-16v-22c0-9-7-16-16-16z'/%3E%3Cpath d='M274 182h32'/%3E%3Cpath d='M40 310l25-8-8 25-6-10z'/%3E%3Ccircle cx='160' cy='310' r='13'/%3E%3Cpath d='M155 306l4 4 7-7'/%3E%3Cpath d='M280 290c0-5 4-9 9-9h18c5 0 9 4 9 9v14l-9-5h-18c-5 0-9-4-9-9z'/%3E%3Cpath d='M335 180c0-4 3-7 7-7h12c4 0 7 3 7 7v10l-7-3h-12c-4 0-7-3-7-7z'/%3E%3Cpath d='M100 80l10 10M110 80l-10 10'/%3E%3Cpath d='M230 110l3 7 7 3-7 3-3 7-3-7-7-3 7-3z'/%3E%3Cpath d='M70 250l3 5 5 3-5 3-3 5-3-5-5-3 5-3z'/%3E%3Cpath d='M220 250c0-5 4-8 8-8s8 3 8 8c0 8-16 16-16 16s-16-8-16-16c0-5 4-8 8-8s8 3 8 8z'/%3E%3Cpath d='M335 315c-3 0-6 3-6 6s3 6 6 6 6-3 6-6-3-6-6-6z'/%3E%3Cpath d='M120 345h40'/%3E%3C/svg%3E")`;

function getWhatsAppDateLabel(dateInput?: string | number | Date): string {
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
  const searchParams = useSearchParams();
  const initialTicketId = searchParams.get("ticketId");

  // Sub-aba Ativa: 'customer_service' (WhatsApp ao Cliente) | 'team_chat' (Chat da Equipe) | 'ai_config' (Agente IA de Suporte)
  const [activeSubView, setActiveSubView] = useState<'customer_service' | 'team_chat' | 'ai_config'>('customer_service');

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

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
    name: "Sofia - Suporte VERSUS",
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

  // Mensagens do Cliente (Atendimento WhatsApp)
  const [clientMessage, setClientMessage] = useState("");
  const [sendingClientMessage, setSendingClientMessage] = useState(false);

  // Mensagens do Chat Interno da Equipe
  const [teamMessage, setTeamMessage] = useState("");
  const [sendingTeamMessage, setSendingTeamMessage] = useState(false);

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
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [sendingToEngineering, setSendingToEngineering] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamMessagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar lista de empresas para o filtro
  useEffect(() => {
    api.get("/tenants?limit=100")
      .then((res) => {
        setTenantsList(res.data.data || []);
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchTickets = useCallback(async (selectIdAfter?: string) => {
    setLoadingList(true);
    try {
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      if (selectedTenantId !== "ALL") params.tenantId = selectedTenantId;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/support/tickets", { params });
      const fetched = res.data.tickets || [];
      setTickets(fetched);

      // Auto-selecionar ticket inicial ou manter seleção
      const targetId = selectIdAfter || initialTicketId;
      if (targetId) {
        const found = fetched.find((t: any) => t.id === targetId);
        if (found) {
          loadTicketDetails(targetId);
        } else if (fetched.length > 0 && !selectedTicket) {
          loadTicketDetails(fetched[0].id);
        }
      } else if (fetched.length > 0 && !selectedTicket) {
        loadTicketDetails(fetched[0].id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar fila de chamados.");
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, priorityFilter, selectedTenantId, search, initialTicketId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadTicketDetails = async (ticketId: string) => {
    setLoadingTicket(true);
    // Limpa sugestão anterior de IA ao trocar de chamado
    setCopilotData(null);
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

  // Salvar Configuração do Agente IA
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAiConfig(true);
    try {
      const res = await api.patch("/support/ai/config", aiConfig);
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
                WhatsApp Business
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Atendimento com padrão visual do WhatsApp, respostas com Copiloto IA e canal interno dedicado.
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
            {/* COLUNA 1: FILA DE ATENDIMENTO ESTILO WHATSAPP (320px) */}
            <div className="w-80 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0 shadow-md">
              
              {/* Topo da Fila: Busca & Filtros Rápidos */}
              <div className="p-3 border-b border-slate-800 bg-[#070D1B] space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar chamados..."
                    className="w-full bg-[#0B1224] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#0B1224] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none cursor-pointer"
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
                    className="bg-[#0B1224] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none truncate cursor-pointer"
                  >
                    <option value="ALL">Empresa: Todas</option>
                    {tenantsList.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Chamados Estilo Contatos WhatsApp */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                {loadingList ? (
                  <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span>Carregando chamados...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
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
                            ? "bg-blue-600/15 border-l-4 border-blue-500"
                            : "hover:bg-slate-800/30 border-l-4 border-transparent"
                        }`}
                      >
                        {/* Avatar com Inicial da Empresa */}
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0 relative mt-0.5">
                          {companyInitial}
                          {ticket.status === 'OPEN' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 ring-2 ring-[#0B1224]" />
                          )}
                        </div>

                        {/* Conteúdo do Card */}
                        <div className="flex-1 min-w-0">
                          {/* Linha 1: Nome da Empresa + Hora */}
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs text-white truncate">
                              {ticket.tenant?.name || "Empresa"}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {new Date(ticket.updatedAt || ticket.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {/* Linha 2: Solicitante + Assunto em formato snippet */}
                          <p className="text-[11px] text-slate-300 truncate mb-1">
                            <strong className="text-slate-400">{ticket.user?.name ? `${ticket.user.name.split(' ')[0]}: ` : ''}</strong>
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

            {/* COLUNA 2: JANELA DE ATENDIMENTO WHATSAPP BUSINESS COM COPILOTO IA */}
            <div className="flex-1 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden relative shadow-lg">
              
              {/* Papel de Parede Sutil Autêntico WhatsApp Dark Mode */}
              <div 
                className="absolute inset-0 opacity-[0.025] pointer-events-none z-0" 
                style={{ 
                  backgroundImage: WHATSAPP_WALLPAPER_BG, 
                  backgroundRepeat: 'repeat', 
                  backgroundSize: '400px 400px' 
                }} 
              />

              {selectedTicket ? (
                <>
                  {/* HEADER DO ATENDIMENTO ESTILO WHATSAPP WEB */}
                  <div className="h-16 px-4 border-b border-slate-800/90 bg-[#070D1B] flex items-center justify-between gap-3 z-10 shrink-0">
                    
                    {/* Informações do Cliente */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm">
                          {(selectedTicket.tenant?.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <span className="w-3 h-3 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-[#070D1B]" title="Canal Ativo" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-white truncate" title={selectedTicket.tenant?.name}>
                            {selectedTicket.tenant?.name || "Empresa Cliente"}
                          </h2>
                          <span className="font-mono text-xs text-blue-400 font-bold shrink-0">
                            #{selectedTicket.ticketNumber || selectedTicket.id.substring(0, 5).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="truncate">Solicitante: <strong className="text-slate-200">{selectedTicket.user?.name || "Cliente"}</strong></span>
                          <span>•</span>
                          <span className="text-blue-400 text-[11px] truncate">{CATEGORY_CONFIG[selectedTicket.category] || selectedTicket.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação do Header */}
                    <div className="flex items-center gap-2 shrink-0">

                      {/* BADGE CSAT (se avaliado pelo cliente) */}
                      {selectedTicket.satisfactionRating && (
                        <div 
                          className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-bold text-amber-300"
                          title={selectedTicket.satisfactionFeedback ? `Avaliação do Cliente: "${selectedTicket.satisfactionFeedback}"` : "Avaliação CSAT registrada"}
                        >
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>CSAT: {selectedTicket.satisfactionRating}/5</span>
                        </div>
                      )}

                      {/* BADGE DEMANDA ENGENHARIA/CRM */}
                      {selectedTicket.aiHandoffDemandId && (
                        <div 
                          className="flex items-center gap-1 bg-cyan-500/15 border border-cyan-500/30 px-2 py-1 rounded-lg text-xs font-bold text-cyan-300"
                          title="Demanda catalogada automaticamente no Backlog de Engenharia/CRM"
                        >
                          <Cpu size={13} className="text-cyan-400" />
                          <span className="hidden md:inline">Demanda Vinculada</span>
                        </div>
                      )}

                      {/* BOTÃO ASSUMIR ATENDIMENTO HUMANO / REATIVAR IA */}
                      <button
                        type="button"
                        onClick={handleToggleTicketAi}
                        disabled={togglingTicketAi}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                          selectedTicket.isAiPaused
                            ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                            : "bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/60"
                        }`}
                        title={
                          selectedTicket.isAiPaused
                            ? "A IA está pausada para este chamado. Clique para reativar as respostas automáticas da IA."
                            : "Clique para assumir o chamado com operador humano e pausar a IA."
                        }
                      >
                        {togglingTicketAi ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : selectedTicket.isAiPaused ? (
                          <>
                            <Play size={13} className="text-emerald-400" />
                            <span className="hidden sm:inline">Reativar IA</span>
                          </>
                        ) : (
                          <>
                            <Pause size={13} className="text-amber-400" />
                            <span className="hidden sm:inline">Assumir (Pausar IA)</span>
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
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                          isCopilotOpen
                            ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 font-black"
                            : "bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60"
                        }`}
                        title="Abrir o Copiloto IA de Atendimento Híbrido"
                      >
                        <Sparkles size={14} className={copilotLoading ? "animate-spin" : isCopilotOpen ? "text-slate-950" : "text-cyan-400"} />
                        <span>Copiloto IA</span>
                      </button>

                      {/* Botão Ver Dúvida Original */}
                      <button
                        type="button"
                        onClick={() => setIsDetailModalOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all cursor-pointer"
                        title="Ler a dúvida original completa enviada pelo cliente"
                      >
                        <FileText size={13} className="text-blue-400" />
                        <span className="hidden sm:inline">Ver Dúvida</span>
                      </button>

                      {/* Botão Enviar para Engenharia */}
                      <button
                        type="button"
                        onClick={handleSendToEngineering}
                        disabled={sendingToEngineering}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all cursor-pointer"
                        title="Enviar para o Kanban de Engenharia de Produto"
                      >
                        <Cpu size={13} className="text-cyan-400" />
                        <span className="hidden sm:inline">{sendingToEngineering ? "Enviando..." : "Engenharia"}</span>
                      </button>

                      {/* Seletor de Status Traduzido */}
                      <div className="flex items-center gap-1.5 bg-[#0B1224] border border-slate-800 rounded-lg px-2 py-1">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                        >
                          <option value="OPEN" className="bg-[#0F172A] text-amber-400">Aberto</option>
                          <option value="IN_PROGRESS" className="bg-[#0F172A] text-blue-400">Em Atendimento</option>
                          <option value="WAITING_CLIENT" className="bg-[#0F172A] text-purple-400">Aguardando Cliente</option>
                          <option value="RESOLVED" className="bg-[#0F172A] text-emerald-400">Resolvido</option>
                          <option value="CLOSED" className="bg-[#0F172A] text-slate-400">Fechado</option>
                        </select>
                      </div>

                      {/* Alternador do Painel Lateral Raio-X */}
                      <button
                        type="button"
                        onClick={() => setShowSidePanel(prev => !prev)}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                          showSidePanel
                            ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                        }`}
                        title="Mostrar/ocultar Raio-X da empresa"
                      >
                        <PanelRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* PAINEL RETRÁTIL DO COPILOTO IA DE ATENDIMENTO HÍBRIDO */}
                  {isCopilotOpen && (
                    <div className="border-b border-cyan-500/30 bg-gradient-to-r from-[#081528] via-[#0b1b36] to-[#081528] p-4 z-10 shadow-lg relative animate-fadeIn shrink-0">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-cyan-400 text-slate-950 font-bold">
                            <Sparkles size={14} />
                          </div>
                          <span className="text-xs font-bold text-white tracking-wide">
                            Copiloto IA de Atendimento Híbrido
                          </span>
                          <span className="text-[10px] bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 px-2 py-0.2 rounded-full font-mono">
                            Sugestão Técnica para o Atendente
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleTriggerAiCopilot}
                            disabled={copilotLoading}
                            className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30"
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
                            <div className="text-[11px] text-slate-300 bg-cyan-950/40 border border-cyan-500/20 p-2 rounded-lg">
                              <strong className="text-cyan-300 font-semibold">Resumo do Diagnóstico:</strong> {copilotData.summary}
                            </div>
                          )}

                          {/* Caixa da Resposta Sugerida */}
                          <div className="bg-[#070D1B] border border-cyan-500/30 rounded-xl p-3 text-slate-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-normal">
                            {copilotData.suggestedResponse}
                          </div>

                          {/* Ações de 1 Clique: Usar Sugestão & Atualizar Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              {copilotData.recommendedStatus && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <span className="text-slate-400">Status Recomendado:</span>
                                  <span className="font-bold text-cyan-300 font-mono">
                                    {STATUS_CONFIG[copilotData.recommendedStatus]?.label || copilotData.recommendedStatus}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleApplyAiStatus}
                                    className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-500/40 text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Aplicar Status
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleApplyAiSuggestion}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md"
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

                  {/* 3. ÁREA DE MENSAGENS COM BALÕES ESTILO WHATSAPP */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar z-10">
                    
                    {/* MENSAGEM FIXADA NO TOPO: SOLICITAÇÃO ORIGINAL DO CLIENTE */}
                    {selectedTicket.description && (
                      <div className="flex justify-center mb-4">
                        <div className="w-full max-w-2xl bg-[#0F172A]/90 border border-blue-900/40 rounded-xl p-3.5 shadow-md backdrop-blur-sm">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-400 border-b border-blue-900/40 pb-1.5 mb-2">
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

                    {/* LISTAGEM DE MENSAGENS PÚBLICAS NO PADRÃO WHATSAPP */}
                    {publicMessages.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center">
                        <MessageSquare size={32} className="opacity-30 mb-2" />
                        <p className="text-slate-400 font-semibold">Inicie a conversa com o cliente.</p>
                        <p>Digite uma resposta humanizada ou use o Copiloto IA para sugerir uma solução técnica pronta.</p>
                      </div>
                    ) : (
                      publicMessages.map((msg: any, idx: number) => {
                        const isAi = msg.senderRole === "AI_AGENT";
                        const isOperator = msg.senderRole === "SUPER_ADMIN" || msg.senderRole === "ADMIN" || msg.senderRole === "AGENT" || isAi;
                        
                        // Separador de Data estilo WhatsApp
                        const prevMsg = idx > 0 ? publicMessages[idx - 1] : null;
                        const currentDateLabel = getWhatsAppDateLabel(msg.createdAt);
                        const prevDateLabel = prevMsg ? getWhatsAppDateLabel(prevMsg.createdAt) : null;
                        const showDateDivider = idx === 0 || currentDateLabel !== prevDateLabel;

                        return (
                          <div key={msg.id || idx} className="flex flex-col">
                            {/* Pílula de Data WhatsApp */}
                            {showDateDivider && (
                              <div className="flex justify-center my-2">
                                <div className="bg-[#111A2E]/95 text-slate-300 text-[10px] font-medium px-3 py-0.5 rounded-lg shadow-sm border border-slate-800/80 backdrop-blur-sm uppercase tracking-wide">
                                  {currentDateLabel}
                                </div>
                              </div>
                            )}

                            {/* Balão de Mensagem WhatsApp com Cauda SVG */}
                            <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%] ${isOperator ? 'self-end items-end' : 'self-start items-start'} relative group my-0.5`}>
                              <div className={`text-xs shadow-sm relative pt-2 pb-2 px-3.5 min-w-[100px] leading-relaxed ${
                                isAi
                                  ? 'bg-[#0e223b] text-slate-100 rounded-lg rounded-tr-none border border-cyan-500/40 shadow-cyan-950/30'
                                  : isOperator
                                  ? 'bg-[#17253D] text-slate-100 rounded-lg rounded-tr-none border border-blue-900/30'
                                  : 'bg-[#1E293B] text-slate-100 rounded-lg rounded-tl-none border border-slate-700/40'
                              }`}>
                                
                                {/* Cauda SVG do Balão WhatsApp */}
                                {isOperator ? (
                                  <svg className={`absolute -top-[0.5px] -right-2 pointer-events-none drop-shadow-sm ${isAi ? 'text-[#0e223b]' : 'text-[#17253D]'}`} width="9" height="13" viewBox="0 0 9 13">
                                    <path fill="currentColor" d="M0 0h6.5c1.1 0 1.8.9 1.3 1.9l-5.2 9.8c-.7 1.4-2.6.8-2.6-.8V0z" />
                                  </svg>
                                ) : (
                                  <svg className="absolute -top-[0.5px] -left-2 text-[#1E293B] pointer-events-none drop-shadow-sm" width="9" height="13" viewBox="0 0 9 13">
                                    <path fill="currentColor" d="M9 0H2.5C1.4 0 .7.9 1.2 1.9l5.2 9.8c.7 1.4 2.6.8 2.6-.8V0z" />
                                  </svg>
                                )}

                                {/* Nome do Remetente */}
                                <div className="flex items-center justify-between gap-3 text-[10px] font-bold mb-1 pb-0.5 border-b border-white/5">
                                  <span className={isAi ? "text-cyan-300 flex items-center gap-1.5" : isOperator ? "text-cyan-300" : "text-blue-400"}>
                                    {isAi && <Bot size={12} className="text-cyan-400 shrink-0" />}
                                    {msg.senderName || (isAi ? "Sofia - Suporte VERSUS" : isOperator ? "Suporte VERSUS" : "Cliente")}
                                  </span>
                                  <span className={`font-mono text-[9px] px-1 py-0.2 rounded uppercase ${
                                    isAi 
                                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                                      : isOperator 
                                      ? "text-slate-400" 
                                      : "text-slate-400"
                                  }`}>
                                    {isAi ? "IA Autônoma" : isOperator ? "Operador" : "Cliente"}
                                  </span>
                                </div>

                                {/* Texto da Mensagem */}
                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                {/* Horário e Duplo Check em Ciano ou Sparkles para IA */}
                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                                  <span>
                                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  {isAi ? (
                                    <span title="Gerado por IA Autônoma">
                                      <Sparkles size={12} className="text-cyan-400" />
                                    </span>
                                  ) : isOperator ? (
                                    <CheckCheck size={13} className="text-cyan-400" />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 4. COMPOSER ESTILO WHATSAPP WEB (CÁPSULA COM EMOJIS & ENVIO RÁPIDO) */}
                  <div className="p-3 border-t border-slate-800/90 bg-[#070D1B] z-10 relative shrink-0">
                    
                    {/* Popover Rápido de Emojis */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-16 left-4 bg-[#0F172A] border border-slate-700 rounded-xl p-2 shadow-2xl z-30 flex flex-wrap gap-1.5 max-w-xs animate-fadeIn">
                        {QUICK_EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setClientMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-base transition-transform hover:scale-110 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSendClientMessage} className="space-y-2">
                      <div className="flex items-end gap-2 bg-[#0B1224] border border-slate-800 rounded-2xl p-1.5 focus-within:border-blue-500 transition-all">
                        
                        {/* Botão Emoji */}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(prev => !prev)}
                          className={`p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ${
                            showEmojiPicker ? "text-amber-400 bg-amber-400/10" : ""
                          }`}
                          title="Inserir emoji"
                        >
                          <Smile size={18} />
                        </button>

                        {/* Botão Rápido Copiloto IA dentro da cápsula */}
                        <button
                          type="button"
                          onClick={handleTriggerAiCopilot}
                          className="px-2 py-1 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 border border-cyan-500/20"
                          title="Pedir sugestão de resposta técnica à IA"
                        >
                          <Sparkles size={12} />
                          <span className="hidden md:inline">Sugerir IA</span>
                        </button>

                        {/* Input Textarea Expansível */}
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
                          placeholder="Digite uma resposta para o cliente..."
                          rows={1}
                          className="flex-1 bg-transparent py-1.5 px-2 text-xs text-white placeholder:text-slate-500 outline-none resize-none max-h-32 custom-scrollbar"
                        />

                        {/* Botão Enviar Circular */}
                        <button
                          type="submit"
                          disabled={sendingClientMessage || !clientMessage.trim()}
                          className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-30 shrink-0 cursor-pointer shadow-md"
                          title="Enviar resposta ao cliente (Enter)"
                        >
                          {sendingClientMessage ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} className="ml-0.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
                        <span>💬 Canal Oficial • A mensagem será entregue diretamente ao cliente solicitante.</span>
                        <span className="hidden sm:inline">Enter para enviar • Shift + Enter para nova linha</span>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 gap-2 z-10">
                  <Headphones size={38} className="text-slate-600" />
                  <p className="font-semibold text-slate-400 text-sm">Nenhum chamado selecionado</p>
                  <p>Escolha um chamado na fila lateral para iniciar o atendimento ao cliente no padrão WhatsApp.</p>
                </div>
              )}
            </div>

            {/* COLUNA 3: PAINEL LATERAL RAIO-X DA EMPRESA (300px) */}
            {showSidePanel && selectedTicket?.tenant && (
              <div className="w-72 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0 shadow-md animate-fadeIn">
                <div className="p-3 border-b border-slate-800 bg-[#070D1B] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-400" />
                    Raio-X da Empresa
                  </h3>

                  <button
                    onClick={() => setIsXRayOpen(true)}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Expandir</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-xs">
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
        {/* SUB-ABA 2: CHAT INTERNO DA EQUIPE (SUBCATEGORIA DE OPERADORES)           */}
        {/* ========================================================================= */}
        {activeSubView === 'team_chat' && (
          <div className="flex-1 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
            
            {/* Header da Subcategoria da Equipe */}
            <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-[#120D24] to-[#0B1224] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Canal Interno da Equipe de Atendimento
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.2 rounded-full font-mono uppercase">
                      🔒 Confidencial
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Alinhamentos técnicos e notas entre operadores master e atendentes. <strong>100% invisível para o cliente.</strong>
                  </p>
                </div>
              </div>

              {selectedTicket && (
                <div className="flex items-center gap-2 bg-[#070D1B] border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-400">Chamado Vinculado:</span>
                  <span className="font-mono text-purple-300 font-bold">#{selectedTicket.ticketNumber}</span>
                  <span className="text-white font-semibold truncate max-w-xs">{selectedTicket.tenant?.name}</span>
                </div>
              )}
            </div>

            {/* Banner de Garantia e Blindagem */}
            <div className="px-4 py-2 bg-purple-950/30 border-b border-purple-500/20 flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-purple-400" />
                <span>Ambiente Seguro: Nenhuma mensagem postada nesta aba é transmitida para o cliente ou para fora da equipe.</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400 font-bold hidden sm:inline">
                {teamMessages.length} mensagem(ns) interna(s)
              </span>
            </div>

            {/* Listagem de Mensagens do Chat Interno da Equipe */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#070D1B]/50">
              {teamMessages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center max-w-md mx-auto">
                  <Lock size={32} className="opacity-30 mb-2 text-purple-400" />
                  <p className="text-slate-300 font-bold text-sm mb-1">Nenhuma anotação de equipe registrada ainda.</p>
                  <p className="text-slate-400">
                    Use o campo abaixo para registrar notas técnicas, alinhamentos confidenciais ou trocar instruções com os demais operadores sobre o atendimento deste chamado.
                  </p>
                </div>
              ) : (
                teamMessages.map((msg: any, idx: number) => (
                  <div key={msg.id || idx} className="max-w-2xl mx-auto w-full">
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 border-b border-purple-500/20 pb-1">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-purple-400" />
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
                ))
              )}
              <div ref={teamMessagesEndRef} />
            </div>

            {/* Composer Privativo da Equipe */}
            <div className="p-4 border-t border-purple-500/30 bg-[#070D1B]">
              <form onSubmit={handleSendTeamMessage} className="space-y-2 max-w-3xl mx-auto">
                <div className="flex items-end gap-2 bg-[#0B1224] border border-purple-500/40 rounded-2xl p-2 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/30 transition-all">
                  <textarea
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendTeamMessage();
                      }
                    }}
                    placeholder="Escreva um alinhamento interno ou nota técnica para os operadores..."
                    rows={2}
                    className="flex-1 bg-transparent py-1 px-2 text-xs text-white placeholder:text-slate-500 outline-none resize-none max-h-32 custom-scrollbar"
                  />

                  <button
                    type="submit"
                    disabled={sendingTeamMessage || !teamMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 shrink-0 cursor-pointer shadow-md"
                  >
                    {sendingTeamMessage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Users size={14} />
                        <span>Registrar na Equipe</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-purple-400/80 px-2">
                  <span>🔒 Visível exclusivamente para operadores master e atendentes cadastrados no VERSUS.</span>
                  <span>Enter para registrar • Shift + Enter para quebra de linha</span>
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
                    Acolhimento imediato, solução com base nos manuais do VERSUS, cancelas de segurança e handoff ao CRM.
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
                        placeholder="Ex: Sofia - Suporte VERSUS"
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

                {/* 4. Base de Conhecimento RAG do VERSUS */}
                <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-blue-400" />
                      <span>Base de Conhecimento do VERSUS (Manual dos Módulos)</span>
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
