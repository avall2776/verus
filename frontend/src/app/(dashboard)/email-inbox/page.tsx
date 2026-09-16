"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Mail, Inbox, Send, Archive, Trash2, Star, 
  Search, RefreshCw, Plus, Paperclip, CheckCircle2, Clock,
  ShieldCheck, FileText, ChevronRight, Reply, Forward,
  Filter, ExternalLink, Download, ArrowRight, Sparkles, Eye,
  Building2, User as UserIcon, AlertCircle, Settings
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { EmailItem, EmailFolderCounts } from "@/types/email";
import EmailComposerModal from "@/components/emails/EmailComposerModal";
import EmailSettingsTab from "@/components/emails/EmailSettingsTab";

export default function EmailInboxPage() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>("INBOX");
  const [search, setSearch] = useState("");
  const [isStarredFilter, setIsStarredFilter] = useState(false);
  const [isUnreadFilter, setIsUnreadFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [counts, setCounts] = useState<EmailFolderCounts>({
    inbox: 0,
    unread: 0,
    starred: 0,
    sent: 0,
    draft: 0,
    trash: 0,
    archive: 0,
  });

  // Modal de Novo E-mail
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialRecipient, setComposerInitialRecipient] = useState("");
  const [composerInitialSubject, setComposerInitialSubject] = useState("");
  const [composerInitialBody, setComposerInitialBody] = useState("");

  // Aba Ativa: 'messages' (Caixa de mensagens) ou 'settings' (Configuração individual de e-mail)
  const [currentTab, setCurrentTab] = useState<"messages" | "settings">("messages");

  // Status do Transporte SMTP
  const [transportStatus, setTransportStatus] = useState<{
    configured: boolean;
    connected: boolean;
    provider: string;
    host: string | null;
    user: string | null;
    from: string | null;
    connectionError: string | null;
  } | null>(null);

  // Resposta rápida inline
  const [quickReplyText, setQuickReplyText] = useState("");
  const [sendingQuickReply, setSendingQuickReply] = useState(false);

  // Carregar status do SMTP
  const fetchTransportStatus = useCallback(async () => {
    try {
      const res = await api.get("/emails/transport/status");
      setTransportStatus(res.data);
    } catch (e) {
      console.warn("[EMAIL_TRANSPORT_STATUS_ERROR]", e);
    }
  }, []);

  // Carregar contadores de pastas
  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get("/emails/counts");
      setCounts(res.data);
    } catch (e) {
      console.error("[EMAIL_COUNTS_ERROR]", e);
    }
  }, []);

  // Carregar lista de e-mails
  const fetchEmails = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params: any = {
        folder: isStarredFilter ? undefined : activeFolder,
        isStarred: isStarredFilter ? true : undefined,
        isRead: isUnreadFilter ? false : undefined,
        search: search.trim() || undefined,
      };

      const res = await api.get("/emails", { params });
      const items: EmailItem[] = res.data?.emails || [];
      setEmails(items);

      // Manter ou selecionar o primeiro e-mail se nada estiver selecionado
      if (items.length > 0) {
        setSelectedEmail((prev) => {
          if (!prev) return items[0];
          const found = items.find((i) => i.id === prev.id);
          return found || items[0];
        });
      } else {
        setSelectedEmail(null);
      }

      fetchCounts();
      if (silent) toast.success("Caixa de entrada sincronizada!");
    } catch (error: any) {
      console.error("[EMAIL_FETCH_ERROR]", error);
      if (error.response?.status === 401) {
        toast.error("Sua sessão expirou. Redirecionando para login...");
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.href = "/login";
        }, 1200);
        return;
      }
      const msg = error.response?.data?.message || "Erro ao sincronizar mensagens.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeFolder, isStarredFilter, isUnreadFilter, search, fetchCounts]);

  // Sincronização IMAP em tempo real com o servidor de e-mail (Gmail/Hostinger)
  const handleSyncInbox = async () => {
    setIsRefreshing(true);
    try {
      toast.loading("Sincronizando com o Gmail...", { id: "sync-toast" });
      const res = await api.post("/emails/sync");
      toast.success(res.data.message || "E-mails sincronizados com sucesso!", { id: "sync-toast" });
      await fetchEmails(true);
    } catch (err: any) {
      console.warn("[SYNC_ERROR]", err);
      const msg = err.response?.data?.message || "Erro ao sincronizar com servidor IMAP.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg), { id: "sync-toast" });
      await fetchEmails(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchTransportStatus();
  }, [fetchEmails, fetchTransportStatus]);

  // Alternar Estrela / Favorito
  const handleToggleStar = async (emailId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.patch(`/emails/${emailId}/star`);
      setEmails((prev) =>
        prev.map((item) => (item.id === emailId ? { ...item, isStarred: res.data.isStarred } : item))
      );
      if (selectedEmail?.id === emailId) {
        setSelectedEmail((prev) => (prev ? { ...prev, isStarred: res.data.isStarred } : null));
      }
      fetchCounts();
    } catch (error) {
      toast.error("Erro ao favoritar e-mail.");
    }
  };

  // Mover para Pasta (Arquivo ou Lixeira)
  const handleMoveFolder = async (emailId: string, targetFolder: string) => {
    try {
      await api.patch(`/emails/${emailId}/folder`, { folder: targetFolder });
      toast.success(
        targetFolder === "TRASH" ? "E-mail movido para a Lixeira." : "E-mail arquivado com sucesso."
      );
      fetchEmails(true);
    } catch (error) {
      toast.error("Erro ao mover e-mail.");
    }
  };

  // Selecionar E-mail e Marcar como Lido
  const handleSelectEmail = async (email: EmailItem) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await api.get(`/emails/${email.id}`);
        setEmails((prev) =>
          prev.map((i) => (i.id === email.id ? { ...i, isRead: true } : i))
        );
        fetchCounts();
      } catch (e) {}
    }
  };

  // Enviar Resposta Rápida inline
  const handleSendQuickReply = async () => {
    if (!selectedEmail || !quickReplyText.trim()) return;

    setSendingQuickReply(true);
    try {
      const payload = {
        recipientEmail: selectedEmail.senderEmail,
        recipientName: selectedEmail.senderName,
        subject: selectedEmail.subject.startsWith("Re:") 
          ? selectedEmail.subject 
          : `Re: ${selectedEmail.subject}`,
        bodyText: quickReplyText.trim(),
        threadId: selectedEmail.id,
      };

      await api.post("/emails/send", payload);
      toast.success("Resposta enviada com sucesso!");
      setQuickReplyText("");
      fetchEmails(true);
    } catch (error: any) {
      console.error("[EMAIL_QUICK_REPLY_ERROR]", error);
      const msg = error.response?.data?.message || "Erro ao enviar resposta.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSendingQuickReply(false);
    }
  };

  // Abrir Modal de Novo E-mail como Resposta Completa
  const handleOpenReplyComposer = () => {
    if (!selectedEmail) return;
    setComposerInitialRecipient(selectedEmail.senderEmail);
    setComposerInitialSubject(
      selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`
    );
    setComposerInitialBody(`\n\n--- Em ${new Date(selectedEmail.createdAt).toLocaleString("pt-BR")}, ${selectedEmail.senderName} escreveu:\n> ${selectedEmail.bodyText.replace(/\n/g, "\n> ")}`);
    setIsComposerOpen(true);
  };

  const formatEmailDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Inbox Unificado de E-mails
              <span 
                onClick={() => setCurrentTab("settings")}
                title={
                  transportStatus?.configured 
                    ? (transportStatus?.connected 
                        ? `Servidor Conectado: ${transportStatus.host || transportStatus.provider || 'Ativo'}. Clique para gerenciar configurações.` 
                        : `Falha na Conexão: ${transportStatus.connectionError || 'Verifique credenciais'}. Clique para ajustar.`)
                    : "E-mail não configurado. Clique para configurar as credenciais."
                }
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 ${
                  transportStatus?.connected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : transportStatus?.configured
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  transportStatus?.connected ? "bg-emerald-400 animate-pulse" : transportStatus?.configured ? "bg-amber-400" : "bg-blue-400"
                }`} />
                {transportStatus?.connected
                  ? "E-MAIL CONECTADO"
                  : transportStatus?.configured
                  ? "CONFIGURADO (PENDENTE)"
                  : "CONFIGURAR E-MAIL"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gerencie tratativas comerciais, envie orçamentos e centralize trocas de mensagens por e-mail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncInbox}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all shadow-md disabled:opacity-50"
            title="Sincronizar e-mails recebidos do Gmail via IMAP"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sincronizar Gmail</span>
          </button>

          <button
            onClick={() => {
              setComposerInitialRecipient("");
              setComposerInitialSubject("");
              setComposerInitialBody("");
              setIsComposerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Escrever Novo E-mail
          </button>
        </div>
      </div>

      {/* Navegação de Abas do Módulo de E-mails */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <button
            onClick={() => setCurrentTab("messages")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentTab === "messages"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Caixa de Mensagens
            {counts.unread > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-bold ml-1">
                {counts.unread}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentTab === "settings"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Configuração de E-mail
            <span className={`w-2 h-2 rounded-full ml-1 ${
              transportStatus?.connected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            }`} />
          </button>
        </div>

        {currentTab === "messages" && (
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Pasta ativa: <strong className="text-white">{activeFolder}</strong> • {counts.inbox} mensagens
          </div>
        )}
      </div>

      {currentTab === "settings" ? (
        <EmailSettingsTab onSettingsSaved={() => {
          fetchTransportStatus();
          fetchEmails(true);
        }} />
      ) : (
        /* Container 3-Pane Enterprise */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[760px]">
        {/* PANE 1: Pastas e Navegação Lateral (col-span-3) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              Pastas & Diretórios
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveFolder("INBOX");
                  setIsStarredFilter(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === "INBOX" && !isStarredFilter
                    ? "bg-blue-600/15 text-blue-300 border border-blue-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Caixa de Entrada</span>
                </div>
                {counts.unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    {counts.unread}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsStarredFilter(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isStarredFilter
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4" />
                  <span>Com Estrela</span>
                </div>
                {counts.starred > 0 && (
                  <span className="text-slate-400 font-mono text-[11px]">{counts.starred}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder("SENT");
                  setIsStarredFilter(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === "SENT" && !isStarredFilter
                    ? "bg-blue-600/15 text-blue-300 border border-blue-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4" />
                  <span>Enviados</span>
                </div>
                {counts.sent > 0 && (
                  <span className="text-slate-400 font-mono text-[11px]">{counts.sent}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder("ARCHIVE");
                  setIsStarredFilter(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === "ARCHIVE" && !isStarredFilter
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4" />
                  <span>Arquivados</span>
                </div>
                {counts.archive > 0 && (
                  <span className="text-slate-400 font-mono text-[11px]">{counts.archive}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveFolder("TRASH");
                  setIsStarredFilter(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFolder === "TRASH" && !isStarredFilter
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Lixeira</span>
                </div>
                {counts.trash > 0 && (
                  <span className="text-slate-400 font-mono text-[11px]">{counts.trash}</span>
                )}
              </button>
            </nav>

            {/* Filtros Rápidos */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Filtros Dinâmicos
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setIsUnreadFilter(!isUnreadFilter)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isUnreadFilter
                      ? "bg-blue-600/15 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Somente Não Lidos
                  </span>
                  <span className="text-[10px] font-mono">{counts.unread}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Rodapé de Status */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado
            </span>
            <span className="font-mono text-slate-400">PostgreSQL</span>
          </div>
        </div>

        {/* PANE 2: Lista de Mensagens (col-span-4) */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col overflow-hidden shadow-xl">
          {/* Barra de Busca e Filtro */}
          <div className="p-3.5 border-b border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por remetente, assunto..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="font-semibold text-white">
                {isStarredFilter ? "Com Estrela" : activeFolder} ({emails.length})
              </span>
              <span>Ordenado por mais recente</span>
            </div>
          </div>

          {/* Lista de E-mails */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse space-y-2">
                <Mail className="w-6 h-6 mx-auto text-slate-600 animate-bounce" />
                <p>Carregando e-mails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-semibold text-slate-400">Nenhum e-mail encontrado</p>
                <p className="text-[11px] text-slate-500">Esta pasta está vazia no momento.</p>
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-3.5 cursor-pointer transition-all relative ${
                      isSelected
                        ? "bg-slate-800/80 border-l-4 border-blue-500 shadow-sm"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Não lido dot */}
                    {!email.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 absolute left-1 top-4" />
                    )}

                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className={`text-xs truncate ${!email.isRead ? "font-bold text-white" : "font-semibold text-slate-200"}`}>
                        {email.senderName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => handleToggleStar(email.id, e)}
                          className="text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-3.5 h-3.5 ${email.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatEmailDate(email.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className={`text-xs truncate mb-1 ${!email.isRead ? "font-semibold text-blue-300" : "text-slate-300"}`}>
                      {email.subject}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {email.preview || email.bodyText}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      {email.hasAttachments && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                          <Paperclip className="w-2.5 h-2.5 text-blue-400" />
                          Anexo
                        </span>
                      )}
                      {email.contact && (
                        <span className="text-[10px] text-slate-400 bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Lead: {email.contact.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 3: Visualizador de Mensagem & Ações (col-span-5) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col overflow-hidden shadow-xl p-6">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Header do E-mail Selecionado */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white leading-tight">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>De:</span>
                      <strong className="text-white font-semibold">{selectedEmail.senderName}</strong>
                      <span className="text-slate-500 font-mono">({selectedEmail.senderEmail})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Para: <span className="text-slate-300">{selectedEmail.recipientEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleStar(selectedEmail.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title="Favoritar"
                    >
                      <Star className={`w-4 h-4 ${selectedEmail.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleMoveFolder(selectedEmail.id, "ARCHIVE")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Arquivar"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveFolder(selectedEmail.id, "TRASH")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleOpenReplyComposer}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold border border-slate-700 transition-colors"
                      title="Responder com o editor completo"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Responder
                    </button>
                  </div>
                </div>

                {/* Vínculo Comercial no CRM se houver */}
                {(selectedEmail.contact || selectedEmail.deal) && (
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">
                        Vínculo CRM: <strong className="text-white">{selectedEmail.contact?.name || selectedEmail.deal?.title}</strong>
                      </span>
                    </div>
                    {selectedEmail.deal?.value && (
                      <span className="font-mono font-bold text-emerald-400">
                        R$ {Number(selectedEmail.deal.value).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                )}

                {/* Corpo do E-mail */}
                <div className="text-xs text-slate-200 leading-relaxed space-y-3 font-sans whitespace-pre-line p-2">
                  {selectedEmail.bodyText}
                </div>

                {/* Lista de Anexos */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Anexos ({selectedEmail.attachments.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedEmail.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 text-xs transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-slate-200 font-medium truncate">{att.name}</span>
                          </div>
                          <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Caixa de Resposta Rápida Inline */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Resposta Rápida
                </span>
                <textarea
                  rows={3}
                  value={quickReplyText}
                  onChange={(e) => setQuickReplyText(e.target.value)}
                  placeholder={`Responder para ${selectedEmail.senderName}...`}
                  className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleOpenReplyComposer}
                    className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Abrir editor completo
                  </button>
                  <button
                    onClick={handleSendQuickReply}
                    disabled={sendingQuickReply || !quickReplyText.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingQuickReply ? "Enviando..." : "Responder E-mail"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
              <Mail className="w-10 h-10 text-slate-700" />
              <p className="font-semibold text-slate-400">Nenhum e-mail selecionado</p>
              <p className="text-[11px] text-slate-500">Escolha uma mensagem na lista para ler e responder.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modal Composer */}
      <EmailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onEmailSent={() => fetchEmails(true)}
        initialRecipient={composerInitialRecipient}
        initialSubject={composerInitialSubject}
        initialBody={composerInitialBody}
        replyToId={selectedEmail?.id}
      />
    </div>
  );
}
