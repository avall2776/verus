"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  LifeBuoy, MessageSquare, ShieldCheck, AlertCircle, CheckCircle2, 
  Clock, Plus, Search, Filter, RefreshCw, Send, Lock, User, 
  ExternalLink, ChevronRight, ChevronDown, ChevronUp, HelpCircle, Smartphone, Mail, 
  Target, Bot, Zap, ArrowRight, X, AlertTriangle, Eye, Building2,
  Star, Sparkles, Loader2, PanelLeftClose, PanelLeft, FileText, Maximize2
} from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/components/ui/SocketProvider";
import toast from "react-hot-toast";

interface TicketMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  senderRole: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
}

interface SupportTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_CLIENT" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
    isActive?: boolean;
    plan?: {
      id: string;
      name: string;
      price: number;
    };
    _count?: {
      users?: number;
      contracts?: number;
      contacts?: number;
      supportTickets?: number;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  _count?: {
    messages: number;
  };
  messages?: TicketMessage[];
  isAiPaused?: boolean;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  aiHandoffDemandId?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  DUVIDA_TECNICA: "Dúvida Técnica",
  FINANCEIRO: "Financeiro & Faturamento",
  BUG: "Reporte de Falha / Bug",
  SOLICITACAO_RECURSO: "Solicitação de Recurso",
  OUTROS: "Outros Assuntos",
};

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  LOW: { label: "Baixa", bg: "bg-slate-800/80", text: "text-slate-300", border: "border-slate-700" },
  MEDIUM: { label: "Média", bg: "bg-blue-600/10", text: "text-blue-400", border: "border-blue-500/30" },
  HIGH: { label: "Alta", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  URGENT: { label: "Urgente", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  OPEN: { label: "Aberto", bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30" },
  IN_PROGRESS: { label: "Em Atendimento", bg: "bg-indigo-600/15", text: "text-indigo-400", border: "border-indigo-500/30" },
  WAITING_CLIENT: { label: "Aguardando Resposta", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  RESOLVED: { label: "Resolvido", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  CLOSED: { label: "Encerrado", bg: "bg-slate-800/80", text: "text-slate-400", border: "border-slate-700" },
};

function SupportPageContent() {
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTicketId = searchParams.get("ticketId");

  const [activeTab, setActiveTab] = useState<"troubleshooting" | "my_tickets" | "admin_triage">("troubleshooting");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingClient: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Layout Responsivo & Amplo
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // Modal de Novo Chamado
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("DUVIDA_TECNICA");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Chat do Chamado Ativo
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Pesquisa de Satisfação (CSAT)
  const [csatRating, setCsatRating] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState("");
  const [isSubmittingCsat, setIsSubmittingCsat] = useState(false);

  // Autoatendimento - Busca Instantânea
  const [knowledgeSearch, setKnowledgeSearch] = useState("");

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (selectedTicket?.messages?.length) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages?.length]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();
      if (activeTab === "my_tickets") params.myOnly = "true";

      const res = await api.get("/support/tickets", { params });
      setTickets(res.data?.tickets || []);
      if (res.data?.counts) {
        setCounts(res.data.counts);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar chamados de suporte.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchFilter, activeTab]);

  useEffect(() => {
    if (activeTab !== "troubleshooting") {
      fetchTickets();
    }
  }, [activeTab, fetchTickets]);

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingDetails(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/support?ticketId=${ticket.id}`);
    }
    try {
      const res = await api.get(`/support/tickets/${ticket.id}`);
      setSelectedTicket(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar mensagens do chamado.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Deep-linking: ao carregar com ?ticketId=xxx na URL, ativa a aba "my_tickets" e carrega o chamado
  useEffect(() => {
    if (urlTicketId) {
      setActiveTab("my_tickets");
      setLoadingDetails(true);
      api.get(`/support/tickets/${urlTicketId}`)
        .then((res) => {
          if (res.data) {
            setSelectedTicket(res.data);
          }
        })
        .catch((err) => {
          console.warn("Falha ao buscar chamado por URL:", err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [urlTicketId]);

  // Sincronização em tempo real via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdated = (updatedTicket: any) => {
      if (!updatedTicket || !updatedTicket.id) return;

      setSelectedTicket((prev) => {
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
        const exists = prev.some((t) => t.id === updatedTicket.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t));
        }
        return [updatedTicket, ...prev];
      });
    };

    socket.on("ticketUpdated", handleTicketUpdated);
    socket.on("adminTicketUpdated", handleTicketUpdated);

    return () => {
      socket.off("ticketUpdated", handleTicketUpdated);
      socket.off("adminTicketUpdated", handleTicketUpdated);
    };
  }, [socket]);

  // Polling inteligente quando o chamado está ativo (garante que a resposta da IA e do suporte apareçam sem reload)
  useEffect(() => {
    if (!selectedTicket?.id) return;
    if (selectedTicket.status === "CLOSED") return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/support/tickets/${selectedTicket.id}`);
        if (res.data) {
          setSelectedTicket((prev) => {
            if (!prev || prev.id !== res.data.id) return prev;
            const currentMsgs = prev.messages?.length || 0;
            const newMsgs = res.data.messages?.length || 0;
            if (currentMsgs !== newMsgs || prev.status !== res.data.status) {
              return res.data;
            }
            return prev;
          });
        }
      } catch (err) {
        // silencioso
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedTicket?.id, selectedTicket?.status]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error("Preencha o assunto e a descrição do chamado.");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await api.post("/support/tickets", {
        subject: newSubject.trim(),
        description: newDescription.trim(),
        category: newCategory,
        priority: newPriority,
      });

      toast.success(`Chamado #${res.data?.ticketNumber || ""} aberto com sucesso!`);
      setIsNewTicketOpen(false);
      setNewSubject("");
      setNewDescription("");
      setActiveTab("my_tickets");
      fetchTickets();
      if (res.data) {
        handleSelectTicket(res.data);
        // Agendamento de re-consultas para carregar a resposta da Sofia IA instantaneamente
        setTimeout(() => {
          api.get(`/support/tickets/${res.data.id}`).then((r) => {
            if (r.data) setSelectedTicket(r.data);
          }).catch(() => {});
        }, 3000);
        setTimeout(() => {
          api.get(`/support/tickets/${res.data.id}`).then((r) => {
            if (r.data) setSelectedTicket(r.data);
          }).catch(() => {});
        }, 6500);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao abrir chamado de suporte.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: replyContent.trim(),
        isInternal: isInternalNote,
      });

      setSelectedTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), res.data],
        };
      });

      setReplyContent("");
      setIsInternalNote(false);
      toast.success(isInternalNote ? "Nota interna registrada!" : "Resposta enviada!");
      fetchTickets();

      // Checagem em 3.5s para capturar resposta da IA ao comentário
      setTimeout(() => {
        api.get(`/support/tickets/${selectedTicket.id}`).then((r) => {
          if (r.data) setSelectedTicket(r.data);
        }).catch(() => {});
      }, 3500);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      await api.patch(`/support/tickets/${selectedTicket.id}/status`, { status });
      toast.success(`Status atualizado para ${STATUS_BADGES[status]?.label || status}`);
      setSelectedTicket((prev) => prev ? { ...prev, status: status as any } : null);
      fetchTickets();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao alterar status do chamado.");
    }
  };

  const handleSubmitCsat = async () => {
    if (!selectedTicket || csatRating === 0 || isSubmittingCsat) return;
    setIsSubmittingCsat(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/csat`, {
        rating: csatRating,
        feedback: csatFeedback.trim() || undefined,
      });
      toast.success("Obrigado pela sua avaliação!");
      setSelectedTicket((prev) => prev ? {
        ...prev,
        satisfactionRating: res.data.satisfactionRating,
        satisfactionFeedback: res.data.satisfactionFeedback,
      } : null);
      fetchTickets();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Erro ao enviar avaliação de satisfação.");
    } finally {
      setIsSubmittingCsat(false);
    }
  };

  const knowledgeBaseItems = [
    {
      icon: Smartphone,
      title: "Conexão WhatsApp & Instâncias",
      tag: "WhatsApp API",
      items: [
        "Verifique se o seu celular principal está com conexão ativa com a internet.",
        "Se a instância desconectar, acesse Configurações > Conexões WhatsApp e solicite um novo QR Code.",
        "Caso utilize a Meta Cloud API oficial, certifique-se de que o token permanente do System User não expirou.",
      ],
    },
    {
      icon: Mail,
      title: "Configuração de E-mail & Envio SMTP",
      tag: "E-mail Inbox",
      items: [
        "No Gmail / Workspace, é obrigatório gerar uma 'Senha de App de 16 Dígitos' com 2FA ativado.",
        "Na Hostinger ou Titan, utilize a porta 465 com SSL e sua senha padrão de Webmail.",
        "Teste a conexão na aba de Configuração de E-mail antes de disparar contratos oficiais.",
      ],
    },
    {
      icon: Target,
      title: "Metas Comerciais & Ritmo (Run Rate)",
      tag: "CRM & Metas",
      items: [
        "O Run Rate projeta o faturamento do mês baseado na receita atual dividida pelos dias decorridos.",
        "Use o filtro por Canal de Origem para simular receitas vindas de WhatsApp vs Tráfego Pago.",
        "Badges de consultor são calculadas reativamente pelo total de contratos e ticket médio fechado.",
      ],
    },
    {
      icon: Zap,
      title: "Webhooks, Automações & Regras",
      tag: "Automação",
      items: [
        "Regras de transição de fase disparam ações automáticas quando um card é arrastado no CRM.",
        "Confira os logs de execução na aba Configurações > Automações para identificar disparos com falha.",
        "Variáveis suportadas: {nome}, {telefone}, {valor_proposta} e {consultor_responsavel}.",
      ],
    },
    {
      icon: Bot,
      title: "Agentes de IA & Base RAG de Conhecimento",
      tag: "Inteligência Artificial",
      items: [
        "Para respostas precisas, suba arquivos PDF ou textos limpos na aba Agente de IA > Base de Conhecimento.",
        "Ajuste a temperatura entre 0.3 e 0.7 para evitar respostas fora do escopo corporativo da empresa.",
        "O transbordo para atendente humano é acionado sempre que o cliente solicita atendimento explícito.",
      ],
    },
  ];

  const filteredKnowledge = knowledgeBaseItems.filter(
    (k) =>
      k.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.tag.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.items.some((i) => i.toLowerCase().includes(knowledgeSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner Corporativo */}
      <div className="p-6 rounded-2xl bg-[#0B1224] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">Central de Suporte & Atendimento</h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/15 border border-blue-500/30 text-[10px] font-mono text-blue-300 uppercase">
                Enterprise SLA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Resolução imediata de dúvidas técnicas, monitoramento de saúde do sistema e abertura de chamados oficiais com atendimento bidirecional.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          Abrir Novo Chamado
        </button>
      </div>

      {/* Cards de Métricas e SLA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total de Chamados</span>
          <span className="text-2xl font-black text-white mt-1 block">{counts.total}</span>
          <span className="text-[11px] text-slate-500">Histórico completo da empresa</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Chamados em Aberto</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{counts.open}</span>
          <span className="text-[11px] text-slate-500">Aguardando atendimento</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Em Atendimento</span>
          <span className="text-2xl font-black text-indigo-400 mt-1 block">{counts.inProgress}</span>
          <span className="text-[11px] text-slate-500">Com operador ou equipe</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Resolvidos</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{counts.resolved}</span>
          <span className="text-[11px] text-slate-500">Casos concluídos com êxito</span>
        </div>
      </div>

      {/* Barra de Abas Estilo Lero */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0B1224] border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("troubleshooting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "troubleshooting"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Autoatendimento & Dúvidas Rápidas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("my_tickets")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "my_tickets"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Meus Chamados
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin_triage")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "admin_triage"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Fila Geral & Gestão da Equipe
        </button>
      </div>

      {/* ABA 1: AUTOATENDIMENTO & TROUBLESHOOTING */}
      {activeTab === "troubleshooting" && (
        <div className="space-y-6">
          {/* Busca Instantânea */}
          <div className="p-6 rounded-2xl bg-[#0B1224] border border-slate-800 space-y-4">
            <div className="max-w-xl">
              <h3 className="text-sm font-bold text-white">Como podemos ajudar sua equipe hoje?</h3>
              <p className="text-xs text-slate-400 mt-1">Busque instruções de configuração, resoluções de WhatsApp, e-mail e regras de CRM.</p>
            </div>
            <div className="relative max-w-2xl">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input 
                type="text"
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                placeholder="Ex: Como reconectar WhatsApp, gerar senha de app do Gmail, calcular Run Rate..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Grid de Tópicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKnowledge.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-[#0B1224] border border-slate-800 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        {topic.tag}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{topic.title}</h4>
                    <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed list-disc list-inside">
                      {topic.items.map((it, itIdx) => (
                        <li key={itIdx}>{it}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSubject(`Dúvida sobre: ${topic.title}`);
                      setIsNewTicketOpen(true);
                    }}
                    className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Abrir chamado sobre este tema</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Banner de Chamado Direto */}
          <div className="p-5 rounded-2xl bg-[#0B1224] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Não encontrou a solução no autoatendimento?</h4>
                <p className="text-[11px] text-slate-400">Nossa equipe de suporte técnico e engenharia responde diretamente por chamado.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNewTicketOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white border border-slate-700 transition-colors shrink-0"
            >
              Criar Chamado Técnico
            </button>
          </div>
        </div>
      )}

      {/* ABAS 2 & 3: MEUS CHAMADOS & GESTÃO DA EQUIPE */}
      {(activeTab === "my_tickets" || activeTab === "admin_triage") && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar por assunto ou número..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Filtro por Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="OPEN">Abertos</option>
                <option value="IN_PROGRESS">Em Atendimento</option>
                <option value="WAITING_CLIENT">Aguardando Resposta</option>
                <option value="RESOLVED">Resolvidos</option>
                <option value="CLOSED">Encerrados</option>
              </select>

              {/* Filtro por Prioridade */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="ALL">Todas Prioridades</option>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchTickets}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
              Atualizar
            </button>
          </div>

          {/* Grid Split View: Lista de Chamados à esquerda e Detalhes/Chat à direita */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-14rem)] min-h-[720px]">
            {/* Coluna 1: Lista de Chamados (lg:col-span-4 / oculta quando expandido) */}
            <div className={`${
              isSidebarCollapsed ? "hidden" : "lg:col-span-4 xl:col-span-4"
            } rounded-2xl bg-[#0B1224] border border-slate-800 p-3 flex flex-col h-full overflow-hidden transition-all shadow-lg`}>
              <div className="flex items-center justify-between px-1.5 pb-2.5 border-b border-slate-800/80 mb-2">
                <span className="text-xs font-bold text-slate-300">Chamados ({tickets.length})</span>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  title="Recolher lista e expandir chat"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <PanelLeftClose size={15} />
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  Carregando chamados...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Nenhum chamado encontrado com os filtros selecionados.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {tickets.map((t) => {
                    const statusCfg = STATUS_BADGES[t.status] || STATUS_BADGES.OPEN;
                    const priorityCfg = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM;
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/30"
                            : "bg-[#070D1B] border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono text-blue-400 font-bold">
                            #{t.ticketNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}>
                              {priorityCfg.label}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                          {t.subject}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                          {t.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                          <span>{CATEGORY_LABELS[t.category] || t.category}</span>
                          <span>{new Date(t.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coluna 2: Detalhes do Chamado & Chat Completo e Amplo (lg:col-span-8 ou 12) */}
            <div className={`${
              isSidebarCollapsed ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-8"
            } rounded-2xl bg-[#0B1224] border border-slate-800 flex flex-col h-full overflow-hidden transition-all shadow-xl`}>
              {selectedTicket ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Cabeçalho do Chamado Selecionado */}
                  <div className="p-4 border-b border-slate-800 bg-[#070D1B]/80 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isSidebarCollapsed && (
                          <button
                            type="button"
                            onClick={() => setIsSidebarCollapsed(false)}
                            title="Expandir lista de chamados"
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
                          >
                            <PanelLeft size={16} />
                          </button>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-blue-400 shrink-0">
                              Chamado #{selectedTicket.ticketNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                              {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                            </span>
                            {selectedTicket.priority && PRIORITY_BADGES[selectedTicket.priority] && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${PRIORITY_BADGES[selectedTicket.priority].bg} ${PRIORITY_BADGES[selectedTicket.priority].text} ${PRIORITY_BADGES[selectedTicket.priority].border}`}>
                                {PRIORITY_BADGES[selectedTicket.priority].label}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white truncate mt-0.5 leading-snug" title={selectedTicket.subject}>
                            {selectedTicket.subject}
                          </h3>
                        </div>
                      </div>

                      {/* Transição de Status e Sincronização */}
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500 font-semibold cursor-pointer"
                        >
                          <option value="OPEN">Aberto</option>
                          <option value="IN_PROGRESS">Em Atendimento</option>
                          <option value="WAITING_CLIENT">Aguardando Resposta</option>
                          <option value="RESOLVED">Marcar como Resolvido</option>
                          <option value="CLOSED">Encerrar Chamado</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSelectTicket(selectedTicket)}
                          disabled={loadingDetails}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Atualizar mensagens agora"
                        >
                          <RefreshCw size={14} className={loadingDetails ? "animate-spin text-blue-400" : ""} />
                        </button>
                      </div>
                    </div>

                    {/* Sub-barra: Solicitante + Chip da Empresa (Compacto & Retrátil) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/50 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span>Solicitante: <strong className="text-slate-200">{selectedTicket.user?.name || "Usuário"}</strong></span>
                        <span>Criado em: {new Date(selectedTicket.createdAt).toLocaleDateString("pt-BR")}</span>
                        {selectedTicket.assignedTo && (
                          <span>Atendente: <strong className="text-cyan-300">{selectedTicket.assignedTo.name}</strong></span>
                        )}
                      </div>

                      {selectedTicket.tenant && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-950/40 border border-blue-800/40 text-blue-300 text-[10px] font-semibold">
                            <Building2 size={12} className="text-blue-400" />
                            <span>{selectedTicket.tenant.name}</span>
                            {selectedTicket.tenant.plan && (
                              <span className="text-blue-400/80 font-mono">• {selectedTicket.tenant.plan.name}</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCompanyDetails(prev => !prev)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer flex items-center gap-0.5"
                          >
                            <span>{showCompanyDetails ? "Ocultar dados" : "Ver dados da conta"}</span>
                            {showCompanyDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Gaveta Retrátil de Dados Cadastrais da Empresa */}
                    {showCompanyDetails && selectedTicket.tenant && (
                      <div className="mt-1 p-3 rounded-xl bg-[#0B1224] border border-slate-700/80 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
                        <div>
                          <span className="text-[10px] text-slate-500 block">E-mail:</span>
                          <span className="text-slate-300 truncate block font-medium">{selectedTicket.tenant.email || "Não cadastrado"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Telefone:</span>
                          <span className="text-slate-300 truncate block font-medium">{selectedTicket.tenant.phone || "Não cadastrado"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Usuários no Tenant:</span>
                          <span className="text-slate-300 font-semibold">{selectedTicket.tenant._count?.users ?? "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total de Chamados:</span>
                          <span className="text-slate-300 font-semibold">{selectedTicket.tenant._count?.supportTickets ?? "—"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Barra de Abas Superiores com Controles de Canal */}
                  <div className="py-2 px-4 border-b border-slate-800/80 bg-[#0B1224] flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          !isInternalNote
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Atendimento Completo</span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-400 font-mono">
                          {selectedTicket.messages?.length || 0}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isInternalNote
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Nota Técnica Privada</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {isInternalNote ? "🔒 Modo Confidencial Ativo (Oculto ao Cliente)" : "💬 Canal Oficial com o Suporte"}
                    </span>
                  </div>

                  {/* Mensagens do Chamado (Timeline Ampla, Clara e Confortável) */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#080E1C]/60">
                    {/* CARD FIXADO NO TOPO: SOLICITAÇÃO ORIGINAL DO CLIENTE */}
                    {selectedTicket.description && (
                      <div className="mx-auto max-w-3xl bg-[#0B1224] border border-slate-800 rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-400 border-b border-slate-800/80 pb-1.5 mb-2">
                          <span className="flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-400" />
                            <span>Descrição Inicial do Chamado #{selectedTicket.ticketNumber}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(selectedTicket.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {selectedTicket.description}
                        </p>
                      </div>
                    )}

                    {/* DIVISOR DE HISTÓRICO */}
                    <div className="flex items-center justify-center my-2">
                      <span className="text-[10px] text-slate-500 bg-[#0B1224] px-3 py-1 rounded-full border border-slate-800 font-mono uppercase tracking-wider">
                        Histórico de Mensagens
                      </span>
                    </div>

                    {loadingDetails ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                        <span>Carregando mensagens...</span>
                      </div>
                    ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map((msg) => {
                        const isAi = msg.senderRole === "AI_AGENT";
                        const isOperator = msg.senderRole === "AGENT" || msg.senderRole === "ADMIN" || msg.senderRole === "SUPER_ADMIN";
                        const isClient = !isAi && !isOperator;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isClient ? "items-end" : "items-start"} max-w-full`}
                          >
                            <div 
                              className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] md:max-w-[75%] shadow-md transition-all ${
                                msg.isInternal
                                  ? "bg-amber-950/25 border border-amber-500/40 text-amber-200"
                                  : isAi
                                  ? "bg-gradient-to-br from-[#0c1f36] via-[#091626] to-[#071322] border border-cyan-500/40 text-slate-100 ring-1 ring-cyan-500/20 shadow-cyan-950/20"
                                  : isOperator
                                  ? "bg-[#0F172A] border border-slate-700/80 text-slate-100 shadow-slate-950/40"
                                  : "bg-blue-600/25 border border-blue-500/40 text-white shadow-blue-950/30"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10">
                                <div className="flex items-center gap-1.5">
                                  {isAi ? (
                                    <>
                                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                        <Bot size={12} className="text-cyan-400" />
                                      </div>
                                      <span className="text-cyan-300 font-bold text-xs">{msg.senderName || "Sofia - Suporte Vallor"}</span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold font-mono uppercase">
                                        IA de Suporte
                                      </span>
                                    </>
                                  ) : isOperator ? (
                                    <>
                                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                        <ShieldCheck size={12} className="text-indigo-400" />
                                      </div>
                                      <span className="text-slate-100 font-bold text-xs">{msg.senderName || msg.sender?.name || "Suporte Vallor"}</span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono uppercase">
                                        Atendente
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                        <User size={12} className="text-blue-300" />
                                      </div>
                                      <span className="text-white font-bold text-xs">{msg.senderName || msg.sender?.name || "Você"}</span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold font-mono uppercase">
                                        Solicitante
                                      </span>
                                    </>
                                  )}

                                  {msg.isInternal && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                      Nota Interna
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                  <span>
                                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  {isAi && <Sparkles size={11} className="text-cyan-400" />}
                                </div>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed select-text font-normal">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Nenhuma mensagem ainda neste chamado. Escreva abaixo para interagir.
                      </div>
                    )}

                    {/* Scroll to bottom anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Card de Pesquisa de Satisfação (CSAT) quando o chamado estiver Resolvido ou Fechado */}
                  {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                    <div className="p-3 bg-[#070D1B] border-t border-slate-800 shrink-0">
                      {selectedTicket.satisfactionRating ? (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  size={16} 
                                  className={star <= (selectedTicket.satisfactionRating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-600"} 
                                />
                              ))}
                            </div>
                            <div>
                              <span className="font-bold text-emerald-300 block">
                                Atendimento Avaliado ({selectedTicket.satisfactionRating}/5)
                              </span>
                              {selectedTicket.satisfactionFeedback && (
                                <p className="text-slate-300 italic text-[11px] mt-0.5">&quot;{selectedTicket.satisfactionFeedback}&quot;</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase font-mono font-bold">
                            Obrigado pelo Feedback!
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-[#0B1224] border border-blue-500/30 space-y-2.5 shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star size={16} className="text-amber-400 fill-amber-400" />
                              <h4 className="text-xs font-bold text-white">Como foi sua experiência com este chamado?</h4>
                            </div>
                            <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-semibold">
                              Pesquisa de Satisfação
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setCsatRating(star)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  csatRating >= star
                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400 scale-110"
                                    : "bg-slate-800/60 border-slate-700 text-slate-500 hover:text-amber-300"
                                }`}
                              >
                                <Star size={18} className={csatRating >= star ? "fill-amber-400" : ""} />
                              </button>
                            ))}
                            <span className="text-xs text-slate-300 ml-2 font-semibold">
                              {csatRating === 5 && "Excelente! 🚀"}
                              {csatRating === 4 && "Muito Bom! 👍"}
                              {csatRating === 3 && "Regular 🙂"}
                              {csatRating === 2 && "Ruim 😕"}
                              {csatRating === 1 && "Muito Insatisfeito 😞"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={csatFeedback}
                              onChange={(e) => setCsatFeedback(e.target.value)}
                              placeholder="Deixe um comentário sobre o atendimento (opcional)..."
                              className="flex-1 p-2 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={handleSubmitCsat}
                              disabled={csatRating === 0 || isSubmittingCsat}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-md shrink-0"
                            >
                              {isSubmittingCsat ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                              <span>Avaliar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Caixa de Resposta (Composer Amplo e Confortável) */}
                  <form onSubmit={handleSendReply} className="p-3.5 border-t border-slate-800 bg-[#070D1B] space-y-2 shrink-0">
                    {/* Alerta de Confidencialidade se Nota Interna estiver ativa */}
                    {isInternalNote && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-[11px] text-amber-300">
                        <div className="flex items-center gap-1.5">
                          <Lock size={13} className="text-amber-400" />
                          <span><strong>Nota Técnica Privada:</strong> Visível apenas para administradores internos da equipe.</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Confidencial</span>
                      </div>
                    )}

                    <div className="flex items-end gap-2.5">
                      <textarea 
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
                          }
                        }}
                        placeholder={
                          isInternalNote 
                            ? "🔒 [Nota Técnica] Registre anotação de auditoria técnica... (Enter para enviar, Shift+Enter para pular linha)" 
                            : "💬 Escreva sua mensagem para o suporte... (Pressione Enter para enviar, Shift+Enter para quebra de linha)"
                        }
                        className={`flex-1 p-3 rounded-xl text-xs sm:text-sm outline-none transition-all resize-none text-white placeholder-slate-500 custom-scrollbar ${
                          isInternalNote
                            ? "bg-[#0B1224] border border-amber-500/50 focus:border-amber-400 ring-1 ring-amber-500/20"
                            : "bg-[#0B1224] border border-slate-700 focus:border-blue-500"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !replyContent.trim()}
                        className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition-all disabled:opacity-40 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 ${
                          isInternalNote 
                            ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30" 
                            : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
                        }`}
                      >
                        {isSendingReply ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : isInternalNote ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Salvar Nota</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Enviar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                    <MessageSquare className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Selecione um chamado ao lado</p>
                  <p className="text-xs text-slate-500 max-w-sm text-center">
                    Clique em qualquer chamado da lista para acompanhar a resposta em tempo real, interagir com a Sofia IA ou com nossa equipe humana.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Abertura de Novo Chamado */}
      {isNewTicketOpen && (
        <div 
          onClick={() => setIsNewTicketOpen(false)}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B1224] border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Abertura de Chamado Técnico</h3>
                  <p className="text-[11px] text-slate-400">Atendimento oficial com acompanhamento de protocolo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Assunto do Chamado *
                </label>
                <input 
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ex: Falha ao enviar contrato por e-mail ou Dúvida de Meta"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Categoria *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="DUVIDA_TECNICA">Dúvida Técnica</option>
                    <option value="BUG">Reporte de Falha / Bug</option>
                    <option value="FINANCEIRO">Financeiro & Planos</option>
                    <option value="SOLICITACAO_RECURSO">Solicitação de Recurso</option>
                    <option value="OUTROS">Outros Assuntos</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Urgência / Prioridade *
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Baixa (Dúvida comum)</option>
                    <option value="MEDIUM">Média (Ajuste operacional)</option>
                    <option value="HIGH">Alta (Impacta clientes)</option>
                    <option value="URGENT">Urgente (Sistema parado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Descrição Detalhada do Problema / Solicitação *
                </label>
                <textarea 
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o ocorrido, telas envolvidas e passos para reproduzir o problema..."
                  className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingTicket ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Abrindo Chamado...</span>
                    </>
                  ) : (
                    <span>Confirmar & Enviar Chamado</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Carregando suporte...</div>}>
      <SupportPageContent />
    </Suspense>
  );
}

