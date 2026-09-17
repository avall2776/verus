"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  LifeBuoy, MessageSquare, ShieldCheck, AlertCircle, CheckCircle2, 
  Clock, Plus, Search, Filter, RefreshCw, Send, Lock, User, 
  ExternalLink, ChevronRight, HelpCircle, Smartphone, Mail, 
  Target, Bot, Zap, ArrowRight, X, AlertTriangle, Eye, Building2
} from "lucide-react";
import api from "@/lib/api";
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

export default function SupportPage() {
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

  // Autoatendimento - Busca Instantânea
  const [knowledgeSearch, setKnowledgeSearch] = useState("");

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
      if (res.data) handleSelectTicket(res.data);
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
            {/* Coluna 1: Lista de Chamados (col-span-5) */}
            <div className="lg:col-span-5 rounded-2xl bg-[#0B1224] border border-slate-800 p-3 space-y-2 overflow-y-auto max-h-[640px]">
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
                tickets.map((t) => {
                  const statusCfg = STATUS_BADGES[t.status] || STATUS_BADGES.OPEN;
                  const priorityCfg = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM;
                  const isSelected = selectedTicket?.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-800/80 border-blue-500 shadow-md ring-1 ring-blue-500/20"
                          : "bg-[#070D1B] border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          #{t.ticketNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}>
                            {priorityCfg.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                        {t.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                        {t.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                        <span>{CATEGORY_LABELS[t.category] || t.category}</span>
                        <span>{new Date(t.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Coluna 2: Detalhes do Chamado & Chat Bidirecional (col-span-7) */}
            <div className="lg:col-span-7 rounded-2xl bg-[#0B1224] border border-slate-800 p-5 flex flex-col justify-between max-h-[640px]">
              {selectedTicket ? (
                <>
                  {/* Cabeçalho do Chamado Selecionado */}
                  <div className="border-b border-slate-800 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-blue-400">
                            Chamado #{selectedTicket.ticketNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {selectedTicket.subject}
                        </h3>
                      </div>

                      {/* Transição de Status */}
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500"
                      >
                        <option value="OPEN">Aberto</option>
                        <option value="IN_PROGRESS">Em Atendimento</option>
                        <option value="WAITING_CLIENT">Aguardando Resposta</option>
                        <option value="RESOLVED">Marcar como Resolvido</option>
                        <option value="CLOSED">Encerrar Chamado</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      <span>Solicitante: <strong className="text-slate-200">{selectedTicket.user?.name || "Usuário"}</strong></span>
                      <span>Criado em: {new Date(selectedTicket.createdAt).toLocaleDateString("pt-BR")}</span>
                      {selectedTicket.assignedTo && (
                        <span>Atendente: <strong className="text-blue-300">{selectedTicket.assignedTo.name}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Card de Dados Cadastrais da Empresa */}
                  {selectedTicket.tenant && (
                    <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2.5 my-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            {selectedTicket.tenant.name}
                          </span>
                          {selectedTicket.tenant.plan && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-600/10 border border-blue-500/20 text-[10px] font-semibold text-blue-300">
                              Plano {selectedTicket.tenant.plan.name}
                            </span>
                          )}
                        </div>

                        {selectedTicket.tenant.cnpj && (
                          <span className="text-[10px] font-mono text-slate-400">
                            CNPJ: {selectedTicket.tenant.cnpj}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 block">E-mail:</span>
                          <span className="text-slate-300 truncate block font-medium" title={selectedTicket.tenant.email}>
                            {selectedTicket.tenant.email || "Não cadastrado"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Telefone:</span>
                          <span className="text-slate-300 truncate block font-medium">
                            {selectedTicket.tenant.phone || "Não cadastrado"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Usuários no Tenant:</span>
                          <span className="text-slate-300 font-semibold">
                            {selectedTicket.tenant._count?.users ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total de Chamados:</span>
                          <span className="text-slate-300 font-semibold">
                            {selectedTicket.tenant._count?.supportTickets ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra de Abas Superiores com Sincronização Bidirecional */}
                  <div className="py-2 px-1 border-b border-slate-800 flex items-center justify-between gap-2">
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
                      {isInternalNote ? "🔒 Modo Confidencial Ativo" : "💬 Canal Oficial com o Solicitante"}
                    </span>
                  </div>

                  {/* Mensagens do Chamado (Timeline) */}
                  <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
                    {loadingDetails ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Carregando mensagens...
                      </div>
                    ) : (
                      selectedTicket.messages?.map((msg) => {
                        const isAgentOrAdmin = msg.senderRole === "AGENT" || msg.senderRole === "ADMIN";
                        return (
                          <div 
                            key={msg.id}
                            className={`p-3.5 rounded-xl border text-xs leading-relaxed max-w-[90%] ${
                              msg.isInternal
                                ? "bg-amber-950/20 border-amber-500/30 text-amber-200 ml-auto"
                                : isAgentOrAdmin
                                ? "bg-slate-800/80 border-slate-700 text-slate-200 mr-auto"
                                : "bg-blue-600/10 border-blue-500/30 text-slate-200 ml-auto"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <span className="font-bold text-[11px] text-white flex items-center gap-1.5">
                                {msg.senderName || msg.sender?.name || "Atendente"}
                                {msg.isInternal && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                    Nota Interna
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Caixa de Resposta com Sincronização & Blindagem Contra Envio Acidental */}
                  <form onSubmit={handleSendReply} className="border-t border-slate-800 pt-3 space-y-2.5">
                    {/* Seletor Inferior */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(false)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            !isInternalNote
                              ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40"
                              : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>💬 Resposta Pública ao Solicitante</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsInternalNote(true)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isInternalNote
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30"
                              : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>🔒 Nota Técnica Privada</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        Shift + Enter para pular linha
                      </span>
                    </div>

                    {/* BANNER DE BLINDAGEM VISUAL CONTRA ENVIO ACIDENTAL */}
                    {isInternalNote ? (
                      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0B1224] border border-amber-500/50 text-[11px] text-amber-300 shadow-md ring-1 ring-amber-500/20">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-400 uppercase tracking-wide">🛡️ Blindagem Ativa • Nota Técnica:</span>{" "}
                            <span className="text-slate-200">Registro restrito à auditoria e equipe técnica. </span>
                            <strong className="text-amber-300 underline underline-offset-2">Esta mensagem NÃO será enviada ao cliente final.</strong>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 uppercase font-mono font-bold shrink-0">
                          🔒 100% Confidencial
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-[11px] text-blue-300">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>
                            <strong className="text-blue-200 uppercase font-semibold text-[10px]">Canal Externo:</strong> A mensagem digitada abaixo será enviada e visualizada diretamente pelo solicitante.
                          </span>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase font-mono font-bold shrink-0 hidden sm:inline">
                          Público
                        </span>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <textarea 
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={
                          isInternalNote 
                            ? "🔒 [Nota Técnica] Registre anotação de auditoria técnica... (Oculto para o cliente)" 
                            : "💬 [Resposta Oficial] Escreva a mensagem que será enviada diretamente ao solicitante..."
                        }
                        className={`flex-1 p-2.5 rounded-xl text-xs outline-none transition-all resize-none text-white placeholder-slate-500 ${
                          isInternalNote
                            ? "bg-[#070D1B] border border-amber-500/50 focus:border-amber-400 ring-1 ring-amber-500/20"
                            : "bg-[#070D1B] border border-slate-700 focus:border-blue-500"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !replyContent.trim()}
                        className={`px-3.5 py-2.5 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-40 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                          isInternalNote 
                            ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30" 
                            : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
                        }`}
                      >
                        {isSendingReply ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : isInternalNote ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Salvar Nota</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-20 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                  <p>Selecione um chamado ao lado para visualizar a conversa e histórico completo.</p>
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
