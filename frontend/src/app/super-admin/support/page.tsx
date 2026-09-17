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
  Maximize2,
  FileText,
  Copy,
  Check,
  X,
  Users,
  ShieldCheck,
  HelpCircle,
  Tag
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

const PRIORITY_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  LOW: { label: "Baixa", color: "text-slate-400", badge: "bg-slate-800 text-slate-300 border-slate-700" },
  MEDIUM: { label: "Média", color: "text-blue-400", badge: "bg-blue-900/30 text-blue-400 border-blue-800" },
  HIGH: { label: "Alta", color: "text-amber-400", badge: "bg-amber-900/30 text-amber-400 border-amber-800" },
  URGENT: { label: "Urgente", color: "text-rose-400", badge: "bg-rose-900/30 text-rose-400 border-rose-800" },
};

const CATEGORY_CONFIG: Record<string, string> = {
  DUVIDA_TECNICA: "Dúvida Técnica",
  BUG: "Erro / Bug",
  FINANCEIRO: "Financeiro",
  SOLICITACAO_RECURSO: "Sugestão de Recurso",
  OUTROS: "Outros",
};

function SuperAdminSupportContent() {
  const searchParams = useSearchParams();
  const initialTicketId = searchParams.get("ticketId");

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Filtros da fila
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("ALL");

  // Sincronização Bidirecional de Canais de Envio (Topo e Rodapé)
  // 'public' = Atendimento Completo (Resposta oficial ao cliente)
  // 'internal_note' = Nota Técnica Privada (Confidencial equipe)
  // 'team_chat' = Chat Interno da Equipe (Alinhamento confidencial entre operadores)
  type ChannelMode = 'public' | 'internal_note' | 'team_chat';
  const [channelMode, setChannelMode] = useState<ChannelMode>('public');
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);

  // Modais
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar detalhes do chamado.");
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedTicket || sending) return;

    const isInternal = channelMode === 'internal_note' || channelMode === 'team_chat';
    setSending(true);

    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: messageContent.trim(),
        isInternal,
      });

      // Atualiza mensagens no ticket ativo
      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [...(prev.messages || []), res.data],
      }));

      setMessageContent("");
      if (channelMode === 'team_chat') {
        toast.success("Mensagem enviada ao Chat da Equipe!");
      } else if (channelMode === 'internal_note') {
        toast.success("Nota interna registrada!");
      } else {
        toast.success("Resposta enviada ao cliente!");
      }

      // Recarrega listagem em segundo plano para sincronizar status e contadores
      fetchTickets();

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
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
      toast.success(`Status alterado para ${statusLabel}`);
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

  // Filtragem de mensagens conforme o canal selecionado
  const displayedMessages = (selectedTicket?.messages || []).filter((msg: any) => {
    if (channelMode === 'team_chat' || channelMode === 'internal_note') {
      return msg.isInternal === true;
    }
    return true; // No modo 'public' (Atendimento Completo), exibe todo o histórico
  });

  const totalMessagesCount = selectedTicket?.messages?.length || 0;
  const internalMessagesCount = (selectedTicket?.messages || []).filter((m: any) => m.isInternal).length;

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col w-full max-w-[1600px] mx-auto overflow-hidden text-slate-100">
      
      {/* Topo do Módulo */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Headphones size={20} className="text-blue-500" />
            Central de Atendimento Omnichannel ao Vivo
          </h1>
          <p className="text-xs text-slate-400">
            Fila corporativa multi-empresa com chat em tempo real, notas técnicas, chat de equipe e Raio-X.
          </p>
        </div>

        <button
          onClick={() => fetchTickets()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loadingList ? "animate-spin text-blue-400" : ""} />
          <span>Atualizar Fila</span>
        </button>
      </div>

      {/* Grid 3-Pane: Fila (320px), Chat (flex-1), Raio-X Lateral (320px) */}
      <div className="flex-1 flex overflow-hidden pt-3 gap-3">
        
        {/* COLUNA 1: FILA DE ATENDIMENTO */}
        <div className="w-80 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0">
          
          {/* Filtros da Fila */}
          <div className="p-3 border-b border-slate-800 bg-[#070D1B] space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar chamados..."
                className="w-full bg-[#0B1224] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
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

          {/* Lista de Chamados com Correção de Layout e Sem Sobreposição */}
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

                return (
                  <div
                    key={ticket.id}
                    onClick={() => loadTicketDetails(ticket.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-600/15 border-l-4 border-blue-500"
                        : "hover:bg-slate-800/30 border-l-4 border-transparent"
                    }`}
                  >
                    {/* Linha 1: Protocolo + Tag de Status Traduzida com shrink-0 */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-blue-400">
                        #{ticket.ticketNumber || ticket.id.substring(0, 6).toUpperCase()}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Linha 2: Título com quebra suave e sem sobrepor tags */}
                    <h4 
                      className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1.5 break-words"
                      title={ticket.subject}
                    >
                      {ticket.subject}
                    </h4>
                    
                    {/* Linha 3: Empresa Solicitante */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                      <Building2 size={11} className="text-slate-500 shrink-0" />
                      <span className="truncate font-medium text-slate-300">
                        {ticket.tenant?.name || "Empresa"}
                      </span>
                    </div>

                    {/* Linha 4: Operador + Contador de Mensagens */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[140px]">
                        {ticket.user?.name || "Solicitante"}
                      </span>
                      <span className="shrink-0">{ticket._count?.messages || 0} msgs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA 2: CHAT AO VIVO & CHAT INTERNO DA EQUIPE */}
        <div className="flex-1 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header do Atendimento com Layout Refinado e Sem Sobreposição */}
              <div className="p-3.5 border-b border-slate-800 bg-[#070D1B] flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
                {/* Lado Esquerdo: Identificação do Chamado */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-blue-400 shrink-0">
                      #{selectedTicket.ticketNumber || selectedTicket.id.substring(0, 6).toUpperCase()}
                    </span>
                    <h2 
                      className="text-sm font-bold text-white truncate max-w-xl"
                      title={selectedTicket.subject}
                    >
                      {selectedTicket.subject}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 truncate">
                    <span className="font-semibold text-slate-300 shrink-0">{selectedTicket.tenant?.name}</span>
                    <span>•</span>
                    <span className="truncate">Solicitado por: <strong className="text-white">{selectedTicket.user?.name}</strong></span>
                    {selectedTicket.category && (
                      <>
                        <span>•</span>
                        <span className="text-blue-400 text-[11px]">{CATEGORY_CONFIG[selectedTicket.category] || selectedTicket.category}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Ações Rápidas (Ver Dúvida Completa + Seletor de Status Traduzido) */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Botão de Expansão / Modal da Dúvida Completa */}
                  <button
                    onClick={() => setIsDetailModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    title="Ler texto completo da solicitação do cliente"
                  >
                    <FileText size={13} />
                    <span>Ver Dúvida Completa</span>
                  </button>

                  {/* Seletor de Status Traduzido */}
                  <div className="flex items-center gap-1.5 bg-[#0B1224] border border-slate-800 rounded-lg px-2 py-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase hidden xl:inline">Status:</span>
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
                </div>
              </div>

              {/* Barra de Abas Superiores com Sincronização Bidirecional */}
              <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0B1224] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Aba 1: Atendimento Completo */}
                  <button
                    type="button"
                    onClick={() => setChannelMode('public')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      channelMode === 'public'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <MessageSquare size={13} className={channelMode === 'public' ? "text-blue-400" : "text-slate-400"} />
                    <span>Atendimento Completo</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      channelMode === 'public' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {totalMessagesCount}
                    </span>
                  </button>

                  {/* Aba 2: Nota Técnica Privada */}
                  <button
                    type="button"
                    onClick={() => setChannelMode('internal_note')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      channelMode === 'internal_note'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <Lock size={13} className={channelMode === 'internal_note' ? "text-amber-400" : "text-slate-400"} />
                    <span>Nota Técnica Privada</span>
                    {internalMessagesCount > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded-full font-mono font-bold">
                        {internalMessagesCount}
                      </span>
                    )}
                  </button>

                  {/* Aba 3: Chat Interno da Equipe */}
                  <button
                    type="button"
                    onClick={() => setChannelMode('team_chat')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      channelMode === 'team_chat'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50 shadow-sm ring-1 ring-purple-500/30'
                        : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <Users size={13} className={channelMode === 'team_chat' ? "text-purple-400" : "text-slate-400"} />
                    <span>Chat Interno da Equipe</span>
                    {internalMessagesCount > 0 && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded-full font-mono font-bold">
                        {internalMessagesCount}
                      </span>
                    )}
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                  {channelMode === 'public' && "💬 Canal Aberto com o Cliente"}
                  {channelMode === 'internal_note' && "🔒 Nota de Auditoria Confidencial"}
                  {channelMode === 'team_chat' && "👥 Discussão Privada entre Operadores"}
                </span>
              </div>

              {/* Área de Mensagens com Card de Abertura Inicial */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#070D1B]/40">
                
                {/* CARD DE SOLICITAÇÃO ORIGINAL DO CLIENTE */}
                {selectedTicket.description && (
                  <div className="w-full p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2 mb-4 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-400 border-b border-blue-900/40 pb-2">
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} />
                        <span>Dúvida Inicial do Solicitante ({selectedTicket.user?.name || "Cliente"})</span>
                      </span>
                      <button
                        onClick={() => setIsDetailModalOpen(true)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 size={11} />
                        <span>Abrir Completo</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-blue-950/60">
                      <span>Aberto em: {new Date(selectedTicket.createdAt).toLocaleString("pt-BR")}</span>
                      <span className="font-mono text-blue-400">Assunto: {selectedTicket.subject}</span>
                    </div>
                  </div>
                )}

                {/* Mensagens da Conversa */}
                {displayedMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center">
                    <MessageSquare size={28} className="opacity-30 mb-2" />
                    <span>
                      {channelMode === 'team_chat'
                        ? "Nenhuma mensagem interna da equipe neste chamado ainda. Use o campo abaixo para alinhar com os atendentes."
                        : channelMode === 'internal_note'
                        ? "Nenhuma nota técnica registrada ainda. Use o campo abaixo para registrar anotações confidenciais."
                        : "Nenhuma resposta enviada ainda. Escreva uma resposta oficial ao cliente abaixo."}
                    </span>
                  </div>
                ) : (
                  displayedMessages.map((msg: any) => {
                    const isSuperAdmin = msg.senderRole === "SUPER_ADMIN" || msg.senderRole === "ADMIN" || msg.senderRole === "AGENT";
                    const isInternal = msg.isInternal;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isInternal
                            ? "mx-auto w-full max-w-xl"
                            : isSuperAdmin
                            ? "ml-auto items-end"
                            : "mr-auto items-start"
                        }`}
                      >
                        {/* NOTA INTERNA / CHAT DE EQUIPE */}
                        {isInternal ? (
                          <div className="w-full p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 my-1 shadow-sm">
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 border-b border-amber-500/20 pb-1">
                              <span className="flex items-center gap-1.5">
                                <Users size={13} />
                                <span>CHAT INTERNO DA EQUIPE • Visível apenas para Operadores</span>
                              </span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-xs text-amber-100/90 whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-amber-400/70 pt-0.5">
                              <span>Enviado por: <strong className="text-amber-300">{msg.senderName || "Operador"}</strong></span>
                              <span>{new Date(msg.createdAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                        ) : (
                          /* MENSAGEM PÚBLICA AO CLIENTE */
                          <div
                            className={`p-3.5 rounded-2xl text-xs space-y-1 shadow-sm leading-relaxed ${
                              isSuperAdmin
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-[#0B1224] border border-slate-800 text-slate-100 rounded-bl-none"
                            }`}
                          >
                            <div className={`flex items-center justify-between gap-3 text-[10px] font-bold ${
                              isSuperAdmin ? "text-blue-200" : "text-slate-400"
                            }`}>
                              <span>{msg.senderName || (isSuperAdmin ? "Suporte VERSUS" : "Cliente")}</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer com Sincronização Bidirecional & Blindagem Contra Envio Acidental */}
              <div className="p-3.5 border-t border-slate-800 bg-[#070D1B]">
                <form onSubmit={handleSendMessage} className="space-y-2.5">
                  
                  {/* Seletor de Modo Inferior (Sincronizado Bidirecionalmente com o Topo) */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setChannelMode('public')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          channelMode === 'public'
                            ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40"
                            : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                        }`}
                      >
                        <MessageSquare size={13} />
                        <span>💬 Resposta Pública ao Cliente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChannelMode('internal_note')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          channelMode === 'internal_note'
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30"
                            : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                        }`}
                      >
                        <Lock size={13} />
                        <span>🔒 Nota Técnica Privada</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChannelMode('team_chat')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          channelMode === 'team_chat'
                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/50 shadow-sm ring-1 ring-purple-500/30"
                            : "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
                        }`}
                      >
                        <Users size={13} />
                        <span>👥 Chat Interno da Equipe</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      Shift + Enter para nova linha • Enter para enviar
                    </span>
                  </div>

                  {/* BANNER DE BLINDAGEM VISUAL CONTRA ENVIO ACIDENTAL */}
                  {channelMode === 'public' ? (
                    <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-[11px] text-blue-300">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-blue-400 shrink-0" />
                        <span>
                          <strong className="text-blue-200 uppercase font-semibold text-[10px]">Canal Externo:</strong> A mensagem digitada abaixo será enviada e visualizada diretamente pelo cliente solicitante.
                        </span>
                      </div>
                      <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase font-mono font-bold shrink-0 hidden sm:inline">
                        Público
                      </span>
                    </div>
                  ) : channelMode === 'internal_note' ? (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0B1224] border border-amber-500/50 text-[11px] text-amber-300 shadow-md ring-1 ring-amber-500/20">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-400 uppercase tracking-wide">🛡️ Blindagem Ativa • Nota Técnica:</span>{" "}
                          <span className="text-slate-200">Registro restrito à auditoria interna. </span>
                          <strong className="text-amber-300 underline underline-offset-2">Esta mensagem NÃO será enviada ao cliente final.</strong>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/40 uppercase font-mono font-bold shrink-0">
                        🔒 100% Confidencial
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0B1224] border border-purple-500/50 text-[11px] text-purple-300 shadow-md ring-1 ring-purple-500/20">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-purple-400 shrink-0" />
                        <div>
                          <span className="font-bold text-purple-400 uppercase tracking-wide">🛡️ Blindagem Ativa • Chat da Equipe:</span>{" "}
                          <span className="text-slate-200">Canal exclusivo de alinhamento entre operadores. </span>
                          <strong className="text-purple-300 underline underline-offset-2">Esta mensagem NÃO será visualizada pelo cliente final.</strong>
                        </div>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded border border-purple-500/40 uppercase font-mono font-bold shrink-0">
                        👥 Apenas Operadores
                      </span>
                    </div>
                  )}

                  {/* Input Textarea & Botão de Envio com Bloqueio e Rótulo Contextual */}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder={
                        channelMode === 'team_chat'
                          ? "👥 [Chat Interno] Converse com outros atendentes e administradores... (Oculto para o cliente)"
                          : channelMode === 'internal_note'
                          ? "🔒 [Nota Técnica] Registre anotação de auditoria técnica... (Oculto para o cliente)"
                          : "💬 [Resposta Oficial] Escreva a mensagem que será enviada diretamente ao cliente..."
                      }
                      rows={2}
                      className={`flex-1 bg-[#0B1224] border rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 outline-none resize-none transition-all ${
                        channelMode === 'team_chat'
                          ? "border-purple-500/50 focus:border-purple-400 ring-1 ring-purple-500/20"
                          : channelMode === 'internal_note'
                          ? "border-amber-500/50 focus:border-amber-400 ring-1 ring-amber-500/20"
                          : "border-slate-800 focus:border-blue-500"
                      }`}
                    />

                    <button
                      type="submit"
                      disabled={sending || !messageContent.trim()}
                      className={`px-3.5 py-2.5 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-40 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                        channelMode === 'team_chat'
                          ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30"
                          : channelMode === 'internal_note'
                          ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
                          : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
                      }`}
                    >
                      {sending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : channelMode === 'team_chat' ? (
                        <>
                          <Users size={14} />
                          <span>Enviar à Equipe</span>
                        </>
                      ) : channelMode === 'internal_note' ? (
                        <>
                          <Lock size={14} />
                          <span>Salvar Nota</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Enviar ao Cliente</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 gap-2">
              <Headphones size={36} className="text-slate-600" />
              <p className="font-semibold text-slate-400 text-sm">Nenhum chamado selecionado</p>
              <p>Escolha um chamado na fila lateral para iniciar o atendimento ao vivo.</p>
            </div>
          )}
        </div>

        {/* COLUNA 3: RAIO-X LATERAL DA EMPRESA */}
        {selectedTicket?.tenant && (
          <div className="w-80 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-slate-800 bg-[#070D1B] flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-400" />
                Raio-X do Solicitante
              </h3>

              <button
                onClick={() => setIsXRayOpen(true)}
                title="Abrir Raio-X Completo"
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <span>Expandir</span>
                <ExternalLink size={11} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
              {/* Card Empresa */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                    {selectedTicket.tenant.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white truncate">{selectedTicket.tenant.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {selectedTicket.tenant.cnpj || "Sem CNPJ cadastrado"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    selectedTicket.tenant.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    {selectedTicket.tenant.isActive ? "Conta Ativa" : "Bloqueada"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {selectedTicket.tenant.plan?.name || "Standard"}
                  </span>
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="p-3 rounded-lg bg-[#070D1B] border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail size={13} className="text-slate-500 shrink-0" />
                  <span className="truncate">{selectedTicket.tenant.email || "E-mail não informado"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <PhoneCall size={13} className="text-slate-500 shrink-0" />
                  <span>{selectedTicket.tenant.phone || "Telefone não informado"}</span>
                </div>
              </div>

              {/* Diagnóstico de Conexões */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status de Conexões
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">WhatsApp</span>
                    <span className={`text-[11px] font-bold ${
                      selectedTicket.tenant.metaPhoneNumberId ? "text-emerald-400" : "text-slate-500"
                    }`}>
                      {selectedTicket.tenant.metaPhoneNumberId ? "Conectado" : "Inativo"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">SMTP</span>
                    <span className={`text-[11px] font-bold ${
                      selectedTicket.tenant.emailSettings?.isActive ? "text-blue-400" : "text-slate-500"
                    }`}>
                      {selectedTicket.tenant.emailSettings?.isActive ? "Ativo" : "Padrão"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solicitante */}
              <div className="p-3 rounded-lg bg-[#070D1B] border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Operador Solicitante</span>
                <p className="font-semibold text-white">{selectedTicket.user?.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{selectedTicket.user?.email}</p>
              </div>
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
