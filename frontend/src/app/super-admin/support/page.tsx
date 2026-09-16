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
  Paperclip,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import CompanyXRayModal from "@/components/super-admin/CompanyXRayModal";

export const dynamic = "force-dynamic";

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

  // Composer
  const [messageContent, setMessageContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  // Modal Raio-X da Empresa
  const [isXRayOpen, setIsXRayOpen] = useState(false);

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

    setSending(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: messageContent.trim(),
        isInternal: isInternalNote,
      });

      // Atualiza mensagens no ticket ativo
      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [...(prev.messages || []), res.data],
      }));

      setMessageContent("");
      toast.success(isInternalNote ? "Nota interna registrada!" : "Resposta enviada ao cliente!");

      // Recarrega listagem em segundo plano para sincronizar status
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
      toast.success(`Status alterado para ${newStatus}`);
      fetchTickets();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao atualizar status do chamado.");
    }
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col w-full max-w-[1600px] mx-auto overflow-hidden">
      {/* Topo do Módulo */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Headphones size={20} className="text-blue-500" />
            Central de Atendimento Omnichannel ao Vivo
          </h1>
          <p className="text-xs text-slate-400">
            Fila global de chamados multi-empresa com chat em tempo real, notas internas e Raio-X corporativo.
          </p>
        </div>

        <button
          onClick={() => fetchTickets()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw size={13} className={loadingList ? "animate-spin text-blue-400" : ""} />
          <span>Atualizar Fila</span>
        </button>
      </div>

      {/* Grid 3-Pane: Fila (280px), Chat (flex-1), Raio-X Lateral (320px) */}
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
                className="bg-[#0B1224] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none"
              >
                <option value="ALL">Status: Todos</option>
                <option value="OPEN">Abertos</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="WAITING_CLIENT">Aguardando</option>
                <option value="RESOLVED">Resolvidos</option>
              </select>

              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="bg-[#0B1224] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none truncate"
              >
                <option value="ALL">Empresa: Todas</option>
                {tenantsList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Chamados */}
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
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-blue-400">
                        #{ticket.ticketNumber}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                        ticket.status === "OPEN"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : ticket.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{ticket.subject}</h4>
                    
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                      <Building2 size={11} className="text-slate-500 shrink-0" />
                      <span className="truncate font-medium text-slate-300">{ticket.tenant?.name || "Empresa"}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{ticket.user?.name || "Solicitante"}</span>
                      <span>{ticket._count?.messages || 0} msgs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA 2: CHAT AO VIVO */}
        <div className="flex-1 bg-[#0B1224] border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header do Chat */}
              <div className="p-3.5 border-b border-slate-800 bg-[#070D1B] flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        #{selectedTicket.ticketNumber}
                      </span>
                      <h2 className="text-sm font-bold text-white truncate max-w-md">
                        {selectedTicket.subject}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-300">{selectedTicket.tenant?.name}</span>
                      <span>•</span>
                      <span>Solicitado por: <strong className="text-white">{selectedTicket.user?.name}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Seletor de Status */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="bg-[#0B1224] border border-slate-800 rounded px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-blue-500"
                  >
                    <option value="OPEN">Aberto</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="WAITING_CLIENT">Aguardando Cliente</option>
                    <option value="RESOLVED">Resolvido</option>
                    <option value="CLOSED">Fechado</option>
                  </select>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#070D1B]/40">
                {selectedTicket.messages?.map((msg: any) => {
                  const isSuperAdmin = msg.senderRole === "SUPER_ADMIN" || msg.senderRole === "ADMIN" || msg.senderRole === "AGENT";
                  const isInternal = msg.isInternal;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        isInternal
                          ? "mx-auto w-full max-w-xl"
                          : isSuperAdmin
                          ? "ml-auto items-end"
                          : "mr-auto items-start"
                      }`}
                    >
                      {/* NOTA INTERNA */}
                      {isInternal ? (
                        <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1 my-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                            <span className="flex items-center gap-1">
                              <Lock size={12} />
                              <span>NOTA INTERNA (Visível apenas para Super Admin e Equipe)</span>
                            </span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-xs text-amber-100/90 whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                          <span className="text-[10px] text-amber-400/70 block pt-1">
                            Registrado por: {msg.senderName || "Super Admin"}
                          </span>
                        </div>
                      ) : (
                        /* MENSAGEM PÚBLICA */
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
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-slate-800 bg-[#070D1B]">
                <form onSubmit={handleSendMessage} className="space-y-2">
                  {/* Seletor de Modo (Pública vs Nota Interna) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          !isInternalNote
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-white bg-slate-800/40"
                        }`}
                      >
                        <MessageSquare size={13} />
                        <span>💬 Resposta Pública ao Cliente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          isInternalNote
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "text-slate-400 hover:text-white bg-slate-800/40"
                        }`}
                      >
                        <Lock size={13} />
                        <span>🔒 Nota Interna (Privada)</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      Shift + Enter para pular linha
                    </span>
                  </div>

                  {/* Input Textarea */}
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
                        isInternalNote
                          ? "Escreva uma nota interna técnica sobre este caso..."
                          : "Escreva uma resposta oficial ao cliente..."
                      }
                      rows={2}
                      className={`flex-1 bg-[#0B1224] border rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 outline-none resize-none ${
                        isInternalNote
                          ? "border-amber-500/40 focus:border-amber-400"
                          : "border-slate-800 focus:border-blue-500"
                      }`}
                    />

                    <button
                      type="submit"
                      disabled={sending || !messageContent.trim()}
                      className={`p-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-40 shrink-0 ${
                        isInternalNote
                          ? "bg-amber-600 hover:bg-amber-500"
                          : "bg-blue-600 hover:bg-blue-500"
                      }`}
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
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
