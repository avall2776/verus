"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  LifeBuoy, X, Plus, RefreshCw, ChevronRight, ArrowLeft, 
  ExternalLink, CheckCircle2, AlertCircle, Clock, Send,
  Smartphone, Mail, Bot, ShieldCheck, Sparkles, AlertTriangle
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
}

interface SystemStatusItem {
  id: string;
  name: string;
  status: string;
  label: string;
  indicator: "healthy" | "warning" | "neutral";
}

interface AnnouncementItem {
  id: string;
  title: string;
  badge: string;
  date: string;
  description: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  OPEN: { label: "Aberto", bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30" },
  IN_PROGRESS: { label: "Em Atendimento", bg: "bg-indigo-600/15", text: "text-indigo-400", border: "border-indigo-500/30" },
  WAITING_CLIENT: { label: "Aguardando Resposta", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  RESOLVED: { label: "Resolvido", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  CLOSED: { label: "Encerrado", bg: "bg-slate-800/80", text: "text-slate-400", border: "border-slate-700" },
};

const CATEGORY_OPTIONS = [
  { value: "DUVIDA_TECNICA", label: "Dúvida Técnica" },
  { value: "FINANCEIRO", label: "Financeiro & Faturamento" },
  { value: "BUG", label: "Reporte de Falha / Bug" },
  { value: "SOLICITACAO_RECURSO", label: "Solicitação de Recurso" },
  { value: "OUTROS", label: "Outros Assuntos" },
];

export default function FloatingSupportWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"support" | "notices">("support");
  const [currentView, setCurrentView] = useState<"list" | "new_ticket">("list");
  
  // Dados de Suporte
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  // Dados de Avisos e Telemetria
  const [systemStatuses, setSystemStatuses] = useState<SystemStatusItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Formulário de Novo Chamado
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("DUVIDA_TECNICA");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Busca de chamados do usuário logado
  const fetchMyTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get("/support/tickets", { params: { myOnly: "true" } });
      const ticketList: SupportTicket[] = res.data?.tickets || [];
      setTickets(ticketList);

      const active = ticketList.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS" || t.status === "WAITING_CLIENT");
      setOpenCount(active.length);
    } catch (err) {
      console.error("[FLOATING_SUPPORT] Erro ao carregar chamados:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Busca de avisos e status do sistema
  const fetchNotices = useCallback(async () => {
    setLoadingNotices(true);
    try {
      const res = await api.get("/support/notices");
      setSystemStatuses(res.data?.systemStatus || []);
      setAnnouncements(res.data?.announcements || []);
    } catch (err) {
      console.error("[FLOATING_SUPPORT] Erro ao carregar avisos:", err);
      // Fallback gracioso caso a rota ainda esteja sendo carregada
      setSystemStatuses([
        { id: "ai", name: "IA Vitor Online", status: "OPERATIONAL", label: "Motor Ativo", indicator: "healthy" },
        { id: "wa", name: "WhatsApp API", status: "OPERATIONAL", label: "Operacional", indicator: "healthy" },
        { id: "infra", name: "Servidores Cloud", status: "OPERATIONAL", label: "99.9% Uptime", indicator: "healthy" }
      ]);
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  // Recarrega dados ao abrir o widget
  useEffect(() => {
    if (isOpen) {
      fetchMyTickets();
      fetchNotices();
    }
  }, [isOpen, fetchMyTickets, fetchNotices]);

  // Carrega contagem inicial em background
  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  // Fechamento com tecla ESC e clique fora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Submissão do novo chamado
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Por favor, preencha o assunto e a descrição.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/support/tickets", {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });

      toast.success("Chamado de suporte aberto com sucesso!");
      setSubject("");
      setDescription("");
      setCategory("DUVIDA_TECNICA");
      setPriority("MEDIUM");
      setCurrentView("list");
      fetchMyTickets();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Não foi possível abrir o chamado. Tente novamente.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="floating-support-widget" ref={containerRef} className="fixed bottom-6 right-6 z-50 select-none print:hidden">
      {/* ========================================================================= */}
      {/* POPOVER / MODAL EXPANSÍVEL ("SUPORTE VERSUS")                             */}
      {/* ========================================================================= */}
      {isOpen && (
        <div 
          className="fixed sm:absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[400px] bg-[#0B1224]/95 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[580px] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header Superior do Widget */}
          <div className="p-4 border-b border-slate-800/80 bg-[#070D1B]/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <LifeBuoy size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Suporte Versus</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Atendimento & Central Operacional</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Fechar Suporte (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Seletor de Abas Corporativas */}
          <div className="px-4 pt-2.5 pb-2 bg-[#0B1224] border-b border-slate-800/60 flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("support");
                setCurrentView("list");
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === "support"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/80"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <LifeBuoy size={14} />
              <span>Suporte</span>
              {openCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {openCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("notices")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === "notices"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700/80"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Sparkles size={14} />
              <span>Avisos</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </button>
          </div>

          {/* Conteúdo do Popover */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* ================================================================= */}
            {/* ABA 1: SUPORTE                                                    */}
            {/* ================================================================= */}
            {activeTab === "support" && (
              <>
                {currentView === "list" ? (
                  <>
                    {/* Botão Primário em Destaque */}
                    <button
                      onClick={() => setCurrentView("new_ticket")}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                      <Plus size={16} />
                      <span>Abrir solicitação de suporte</span>
                    </button>

                    {/* Cabeçalho da Listagem */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold text-slate-300">Seus chamados recentes</span>
                      <button
                        onClick={fetchMyTickets}
                        disabled={loadingTickets}
                        className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors disabled:opacity-50"
                        title="Atualizar chamados"
                      >
                        <RefreshCw size={13} className={loadingTickets ? "animate-spin text-blue-400" : ""} />
                      </button>
                    </div>

                    {/* Listagem de Chamados */}
                    {loadingTickets ? (
                      <div className="space-y-2 py-3">
                        <div className="h-14 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
                        <div className="h-14 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="p-6 rounded-xl border border-slate-800/60 bg-[#070D1B]/50 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800/60 text-slate-400 mx-auto flex items-center justify-center">
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        </div>
                        <p className="text-xs font-medium text-white">Nenhum chamado aberto</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Tudo em ordem com sua operação. Se precisar de auxílio ou ajuste técnico, basta abrir uma solicitação.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-0.5">
                        {tickets.slice(0, 5).map((ticket) => {
                          const statusInfo = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                          return (
                            <div
                              key={ticket.id}
                              onClick={() => {
                                setIsOpen(false);
                                router.push(`/support?ticketId=${ticket.id}`);
                              }}
                              className="group p-3 rounded-xl bg-[#070D1B]/70 hover:bg-[#070D1B] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold text-blue-400">
                                  #HD-{String(ticket.ticketNumber).padStart(4, "0")}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                  {statusInfo.label}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                                {ticket.subject}
                              </p>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {formatDate(ticket.updatedAt || ticket.createdAt)}
                                </span>
                                <span className="text-slate-400 group-hover:text-white flex items-center gap-0.5 transition-colors">
                                  Ver chat <ChevronRight size={12} />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  /* ========================================================= */
                  /* FORMULÁRIO EMBUTIDO DE NOVO CHAMADO                       */
                  /* ========================================================= */
                  <form onSubmit={handleSubmitTicket} className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCurrentView("list")}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <ArrowLeft size={14} />
                        Voltar à lista
                      </button>
                      <span className="text-xs font-bold text-white">Novo Chamado</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Assunto / Título *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ex: Dúvida sobre conexão do WhatsApp"
                        required
                        className="w-full px-3 py-2 bg-[#070D1B] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Categoria
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-2.5 py-2 bg-[#070D1B] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.value} className="bg-[#0B1224] text-white">
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Prioridade
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full px-2.5 py-2 bg-[#070D1B] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="LOW" className="bg-[#0B1224] text-white">Baixa</option>
                          <option value="MEDIUM" className="bg-[#0B1224] text-white">Média</option>
                          <option value="HIGH" className="bg-[#0B1224] text-white">Alta</option>
                          <option value="URGENT" className="bg-[#0B1224] text-white">Urgente</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Descrição Detalhada *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o que ocorreu ou como nossa equipe pode ajudar..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 bg-[#070D1B] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentView("list")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} />
                            <span>Enviar Chamado</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ================================================================= */}
            {/* ABA 2: AVISOS E TELEMETRIA DO SISTEMA                              */}
            {/* ================================================================= */}
            {activeTab === "notices" && (
              <div className="space-y-4">
                {/* Status dos Componentes do Sistema */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Saúde do Ecossistema
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {systemStatuses.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#070D1B]/70 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.id === "ai-vitor" && <Bot size={15} className="text-blue-400" />}
                          {item.id === "whatsapp" && <Smartphone size={15} className="text-emerald-400" />}
                          {item.id === "email-smtp" && <Mail size={15} className="text-amber-400" />}
                          {item.id === "cloud-infra" && <ShieldCheck size={15} className="text-cyan-400" />}
                          <div>
                            <p className="font-semibold text-white leading-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{item.label}</p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.indicator === "healthy"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : item.indicator === "warning"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.indicator === "healthy" ? "bg-emerald-400" : item.indicator === "warning" ? "bg-amber-400 animate-pulse" : "bg-slate-400"
                          }`} />
                          {item.status === "OPERATIONAL" ? "Operacional" : "Configurar"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comunicados & Novidades da Plataforma */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Comunicados & Novidades
                  </span>
                  <div className="space-y-2">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3 rounded-xl bg-[#070D1B]/50 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600/15 text-blue-400 border border-blue-500/30">
                            {ann.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{ann.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-white">{ann.title}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{ann.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé Fixo do Widget: Link para Central Completa */}
          <div className="p-3 border-t border-slate-800/80 bg-[#070D1B]/80 flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/support");
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/60 transition-all group"
            >
              <span>Ir para a Central de Ajuda</span>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTÃO FLUTUANTE (FLOATING TRIGGER)                                        */}
      {/* ========================================================================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir Suporte Versus"
        title="Suporte Versus (Ajuda e Chamados)"
        className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-xl transition-all duration-200 active:scale-95 ${
          isOpen
            ? "bg-slate-800 text-white border border-slate-700 shadow-slate-900/50"
            : "bg-[#0B1224] hover:bg-[#11192e] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 shadow-black/80"
        }`}
      >
        {isOpen ? (
          <X size={20} className="transition-transform rotate-0 group-hover:rotate-90 duration-200" />
        ) : (
          <LifeBuoy size={20} className="transition-transform group-hover:scale-110 duration-200 text-blue-400" />
        )}

        {/* Indicador de Status Online (Dot Verde Pulsante) */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0B1224]" />
          </span>
        )}

        {/* Badge Numérico caso haja chamados ativos */}
        {!isOpen && openCount > 0 && (
          <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-blue-600 text-white border-2 border-[#0B1224] shadow-sm">
            {openCount}
          </span>
        )}
      </button>
    </div>
  );
}
