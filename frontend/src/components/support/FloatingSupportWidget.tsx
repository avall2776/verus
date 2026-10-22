"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LifeBuoy, X, Plus, RefreshCw, ChevronRight, ArrowLeft, 
  ExternalLink, CheckCircle2, AlertCircle, Clock, Send,
  Smartphone, Mail, Bot, ShieldCheck, Sparkles, AlertTriangle
} from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/components/ui/SocketProvider";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme, isWhatsApp, isClean } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();
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

  // Posição Flutuante Arrastável (Draggable) & Persistência
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragJustEndedRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Carrega posição salva no localStorage ou calcula padrão inferior direito
  useEffect(() => {
    try {
      const saved = localStorage.getItem("versus_floating_support_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const maxX = window.innerWidth - 64;
          const maxY = window.innerHeight - 64;
          const clampedX = Math.max(16, Math.min(parsed.x, maxX));
          const clampedY = Math.max(16, Math.min(parsed.y, maxY));
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      }
      // Posição inicial padrão: canto inferior direito
      setPosition({
        x: Math.max(16, window.innerWidth - 72),
        y: Math.max(16, window.innerHeight - 80),
      });
    } catch (e) {
      console.error("Erro ao carregar posição do widget de suporte:", e);
    }
  }, []);

  // Ajusta a posição ao redimensionar a janela garantindo que permaneça visível
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const maxX = window.innerWidth - 64;
        const maxY = window.innerHeight - 64;
        const clampedX = Math.max(16, Math.min(prev.x, maxX));
        const clampedY = Math.max(16, Math.min(prev.y, maxY));
        if (clampedX !== prev.x || clampedY !== prev.y) {
          return { x: clampedX, y: clampedY };
        }
        return prev;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Gerenciamento de Drag and Drop via Pointer Events
  const handlePointerDown = (e: React.PointerEvent) => {
    // Permite apenas clique com o botão principal do mouse ou touch
    if (e.button !== 0) return;

    startPointerRef.current = { x: e.clientX, y: e.clientY };
    const currentX = position ? position.x : (window.innerWidth - 72);
    const currentY = position ? position.y : (window.innerHeight - 80);
    startPosRef.current = { x: currentX, y: currentY };
    hasMovedRef.current = false;
    isDraggingRef.current = true;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - startPointerRef.current.x;
      const dy = moveEvent.clientY - startPointerRef.current.y;

      if (!hasMovedRef.current && Math.hypot(dx, dy) > 4) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        const maxX = window.innerWidth - 64;
        const maxY = window.innerHeight - 64;
        const newX = Math.max(16, Math.min(startPosRef.current.x + dx, maxX));
        const newY = Math.max(16, Math.min(startPosRef.current.y + dy, maxY));
        setPosition({ x: newX, y: newY });
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (hasMovedRef.current) {
        setIsDragging(false);
        dragJustEndedRef.current = true;
        setTimeout(() => {
          dragJustEndedRef.current = false;
        }, 120);

        // Salva a posição solta no localStorage
        setPosition(finalPos => {
          if (finalPos) {
            try {
              localStorage.setItem("versus_floating_support_pos", JSON.stringify(finalPos));
            } catch (err) {
              console.error("Erro ao salvar posição no localStorage:", err);
            }
          }
          return finalPos;
        });
      } else {
        setIsDragging(false);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const handleToggleOpen = () => {
    if (dragJustEndedRef.current) return;
    setIsOpen(prev => !prev);
  };

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
        { id: "ai", name: "Agente de IA", status: "OPERATIONAL", label: "Motor Ativo", indicator: "healthy" },
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

  // Atualização em tempo real via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchMyTickets();
    };

    socket.on("ticketUpdated", handleUpdate);
    socket.on("adminTicketUpdated", handleUpdate);

    return () => {
      socket.off("ticketUpdated", handleUpdate);
      socket.off("adminTicketUpdated", handleUpdate);
    };
  }, [socket, fetchMyTickets]);

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

  const openDownwards = position ? position.y < 380 : false;
  const alignLeft = position ? position.x < 360 : false;

  return (
    <div 
      id="floating-support-widget" 
      ref={containerRef} 
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px`, bottom: "auto", right: "auto" }
          : undefined
      }
      className={`fixed z-50 select-none print:hidden ${
        !position ? "bottom-20 right-4 md:bottom-6 md:right-6" : ""
      } ${pathname === '/inbox' ? 'hidden md:block' : ''}`}
    >
      {/* ========================================================================= */}
      {/* POPOVER / MODAL EXPANSÍVEL ("SUPORTE VERSUS")                             */}
      {/* ========================================================================= */}
      {isOpen && (
        <div 
          className={`fixed sm:absolute w-[calc(100vw-2rem)] sm:w-[400px] backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col max-h-[580px] overflow-hidden animate-in fade-in duration-200 z-50 border ${
            isWhatsApp
              ? "bg-[#111B21] border-[#222D34] shadow-black/80"
              : isClean
              ? "bg-white border-slate-200 shadow-slate-300/50"
              : "bg-[#0B1224] border-slate-800 shadow-black/80"
          } ${
            openDownwards ? "top-14 slide-in-from-top-3" : "bottom-14 slide-in-from-bottom-3"
          } ${
            alignLeft ? "left-0" : "right-0"
          }`}
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header Superior do Widget */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isWhatsApp
              ? "bg-[#202C33] border-[#222D34]"
              : isClean
              ? "bg-slate-50 border-slate-200"
              : "bg-[#070D1B] border-slate-800/80"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-1.5 overflow-hidden shadow-sm border ${
                isWhatsApp
                  ? "bg-emerald-500/10 border-emerald-500/25"
                  : isClean
                  ? "bg-blue-50 border-blue-200"
                  : "bg-blue-600/15 border-blue-500/30"
              }`}>
                <img src="/vallor/Favicon_vallor.svg?v=4" alt="Vallor" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-bold tracking-wide ${isClean ? "text-slate-900" : "text-white"}`}>Suporte Vallor</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className={`text-[11px] ${isClean ? "text-slate-500" : "text-slate-400"}`}>Atendimento & Central Operacional</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                isClean
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                  : isWhatsApp
                  ? "text-slate-400 hover:text-white hover:bg-[#202C33]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
              title="Fechar Suporte (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Seletor de Abas Corporativas */}
          <div className={`px-4 pt-2.5 pb-2 border-b flex items-center gap-2 ${
            isWhatsApp
              ? "bg-[#111B21] border-[#222D34]"
              : isClean
              ? "bg-white border-slate-200"
              : "bg-[#0B1224] border-slate-800/60"
          }`}>
            <button
              onClick={() => {
                setActiveTab("support");
                setCurrentView("list");
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === "support"
                  ? isWhatsApp
                    ? "bg-[#202C33] text-white shadow-sm border border-[#2a3942]"
                    : isClean
                    ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-300"
                    : "bg-slate-800 text-white shadow-sm border border-slate-700/80"
                  : isClean
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  : isWhatsApp
                  ? "text-slate-400 hover:text-white hover:bg-[#202C33]/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <LifeBuoy size={14} className={activeTab === "support" && isWhatsApp ? "text-emerald-400" : ""} />
              <span>Suporte</span>
              {openCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                  isWhatsApp ? "bg-emerald-600" : "bg-blue-600"
                }`}>
                  {openCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("notices")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === "notices"
                  ? isWhatsApp
                    ? "bg-[#202C33] text-white shadow-sm border border-[#2a3942]"
                    : isClean
                    ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-300"
                    : "bg-slate-800 text-white shadow-sm border border-slate-700/80"
                  : isClean
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  : isWhatsApp
                  ? "text-slate-400 hover:text-white hover:bg-[#202C33]/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Sparkles size={14} className={activeTab === "notices" && isWhatsApp ? "text-emerald-400" : ""} />
              <span>Avisos</span>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isWhatsApp ? "bg-emerald-400" : "bg-cyan-400"}`} />
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
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                        isWhatsApp
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                      }`}
                    >
                      <Plus size={16} />
                      <span>Abrir solicitação de suporte</span>
                    </button>

                    {/* Cabeçalho da Listagem */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-xs font-semibold ${isClean ? "text-slate-600" : "text-slate-300"}`}>
                        Seus chamados recentes
                      </span>
                      <button
                        onClick={fetchMyTickets}
                        disabled={loadingTickets}
                        className={`p-1 rounded transition-colors disabled:opacity-50 ${
                          isClean ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Atualizar chamados"
                      >
                        <RefreshCw size={13} className={loadingTickets ? `animate-spin ${isWhatsApp ? "text-emerald-400" : "text-blue-400"}` : ""} />
                      </button>
                    </div>

                    {/* Listagem de Chamados */}
                    {loadingTickets ? (
                      <div className="space-y-2 py-3">
                        <div className={`h-14 rounded-xl animate-pulse border ${
                          isClean ? "bg-slate-100 border-slate-200" : isWhatsApp ? "bg-[#202C33] border-[#2a3942]" : "bg-slate-800/40 border-slate-800"
                        }`} />
                        <div className={`h-14 rounded-xl animate-pulse border ${
                          isClean ? "bg-slate-100 border-slate-200" : isWhatsApp ? "bg-[#202C33] border-[#2a3942]" : "bg-slate-800/40 border-slate-800"
                        }`} />
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className={`p-6 rounded-xl border text-center space-y-2 ${
                        isWhatsApp
                          ? "bg-[#202C33] border-[#222D34]"
                          : isClean
                          ? "bg-slate-50 border-slate-200"
                          : "bg-[#070D1B] border-slate-800/80"
                      }`}>
                        <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                          isClean ? "bg-slate-200 text-slate-600" : isWhatsApp ? "bg-[#111B21] text-emerald-400" : "bg-slate-800/60 text-slate-400"
                        }`}>
                          <CheckCircle2 size={20} className={isClean ? "text-emerald-600" : "text-emerald-400"} />
                        </div>
                        <p className={`text-xs font-medium ${isClean ? "text-slate-900" : "text-white"}`}>Nenhum chamado aberto</p>
                        <p className={`text-[11px] leading-relaxed ${isClean ? "text-slate-600" : "text-slate-400"}`}>
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
                              className={`group p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                                isWhatsApp
                                  ? "bg-[#202C33] hover:bg-[#2a3942] border-[#222D34]"
                                  : isClean
                                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200"
                                  : "bg-[#070D1B] hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-mono font-bold ${isWhatsApp ? "text-emerald-400" : "text-blue-400"}`}>
                                  #HD-{String(ticket.ticketNumber).padStart(4, "0")}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                  {statusInfo.label}
                                </span>
                              </div>

                              <p className={`text-xs font-semibold transition-colors line-clamp-1 ${
                                isClean ? "text-slate-900 group-hover:text-blue-600" : isWhatsApp ? "text-[#E9EDEF] group-hover:text-emerald-300" : "text-white group-hover:text-blue-300"
                              }`}>
                                {ticket.subject}
                              </p>

                              <div className={`flex items-center justify-between text-[10px] pt-0.5 ${isClean ? "text-slate-500" : "text-slate-400"}`}>
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {formatDate(ticket.updatedAt || ticket.createdAt)}
                                </span>
                                <span className={`flex items-center gap-0.5 transition-colors ${
                                  isClean ? "group-hover:text-slate-900" : isWhatsApp ? "group-hover:text-emerald-300" : "group-hover:text-white"
                                }`}>
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
                    <div className={`flex items-center justify-between pb-1 border-b ${
                      isWhatsApp ? "border-[#202C33]" : isClean ? "border-slate-200" : "border-slate-800"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setCurrentView("list")}
                        className={`text-xs flex items-center gap-1 transition-colors ${
                          isClean ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <ArrowLeft size={14} />
                        Voltar à lista
                      </button>
                      <span className={`text-xs font-bold ${isClean ? "text-slate-900" : "text-white"}`}>Novo Chamado</span>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${isClean ? "text-slate-700" : "text-slate-300"}`}>
                        Assunto / Título *
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ex: Dúvida sobre conexão do WhatsApp"
                        required
                        className={`w-full px-3 py-2 rounded-lg text-xs transition-colors border focus:outline-none ${
                          isWhatsApp
                            ? "bg-[#202C33] border-[#2a3942] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-emerald-500"
                            : isClean
                            ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                            : "bg-[#070D1B] border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 ${isClean ? "text-slate-700" : "text-slate-300"}`}>
                          Categoria
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className={`w-full px-2.5 py-2 rounded-lg text-xs transition-colors border focus:outline-none ${
                            isWhatsApp
                              ? "bg-[#202C33] border-[#2a3942] text-[#E9EDEF] focus:border-emerald-500"
                              : isClean
                              ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                              : "bg-[#070D1B] border-slate-800 text-white focus:border-blue-500"
                          }`}
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option
                              key={cat.value}
                              value={cat.value}
                              className={isWhatsApp ? "bg-[#202C33] text-white" : isClean ? "bg-white text-slate-900" : "bg-[#0B1224] text-white"}
                            >
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 ${isClean ? "text-slate-700" : "text-slate-300"}`}>
                          Prioridade
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className={`w-full px-2.5 py-2 rounded-lg text-xs transition-colors border focus:outline-none ${
                            isWhatsApp
                              ? "bg-[#202C33] border-[#2a3942] text-[#E9EDEF] focus:border-emerald-500"
                              : isClean
                              ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500"
                              : "bg-[#070D1B] border-slate-800 text-white focus:border-blue-500"
                          }`}
                        >
                          <option value="LOW" className={isWhatsApp ? "bg-[#202C33] text-white" : isClean ? "bg-white text-slate-900" : "bg-[#0B1224] text-white"}>Baixa</option>
                          <option value="MEDIUM" className={isWhatsApp ? "bg-[#202C33] text-white" : isClean ? "bg-white text-slate-900" : "bg-[#0B1224] text-white"}>Média</option>
                          <option value="HIGH" className={isWhatsApp ? "bg-[#202C33] text-white" : isClean ? "bg-white text-slate-900" : "bg-[#0B1224] text-white"}>Alta</option>
                          <option value="URGENT" className={isWhatsApp ? "bg-[#202C33] text-white" : isClean ? "bg-white text-slate-900" : "bg-[#0B1224] text-white"}>Urgente</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${isClean ? "text-slate-700" : "text-slate-300"}`}>
                        Descrição Detalhada *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o que ocorreu ou como nossa equipe pode ajudar..."
                        rows={3}
                        required
                        className={`w-full px-3 py-2 rounded-lg text-xs transition-colors resize-none border focus:outline-none ${
                          isWhatsApp
                            ? "bg-[#202C33] border-[#2a3942] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-emerald-500"
                            : isClean
                            ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                            : "bg-[#070D1B] border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentView("list")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isClean ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                          isWhatsApp ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                        }`}
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
                  <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
                    isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                  }`}>
                    Saúde do Ecossistema
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {systemStatuses.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isWhatsApp
                            ? "bg-[#202C33] border-[#222D34]"
                            : isClean
                            ? "bg-slate-50 border-slate-200"
                            : "bg-[#070D1B] border-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.id === "ai-vitor" && <Bot size={15} className={isWhatsApp ? "text-emerald-400" : "text-blue-400"} />}
                          {item.id === "whatsapp" && <Smartphone size={15} className="text-emerald-400" />}
                          {item.id === "email-smtp" && <Mail size={15} className="text-amber-400" />}
                          {item.id === "cloud-infra" && <ShieldCheck size={15} className="text-cyan-400" />}
                          <div>
                            <p className={`font-semibold leading-tight ${isClean ? "text-slate-900" : "text-white"}`}>{item.name}</p>
                            <p className={`text-[10px] ${isClean ? "text-slate-500" : "text-slate-400"}`}>{item.label}</p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.indicator === "healthy"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : item.indicator === "warning"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : isClean
                            ? "bg-slate-200 text-slate-700 border-slate-300"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.indicator === "healthy" ? "bg-emerald-400" : item.indicator === "warning" ? "bg-amber-400 animate-pulse" : isClean ? "bg-slate-500" : "bg-slate-400"
                          }`} />
                          {item.status === "OPERATIONAL" ? "Operacional" : "Configurar"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comunicados & Novidades da Plataforma */}
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
                    isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                  }`}>
                    Comunicados & Novidades
                  </span>
                  <div className="space-y-2">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className={`p-3 rounded-xl border space-y-1 transition-colors ${
                          isWhatsApp
                            ? "bg-[#202C33] border-[#222D34]"
                            : isClean
                            ? "bg-slate-50 border-slate-200"
                            : "bg-[#070D1B] border-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            isWhatsApp
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-blue-600/15 text-blue-400 border-blue-500/30"
                          }`}>
                            {ann.badge}
                          </span>
                          <span className={`text-[10px] font-mono ${isClean ? "text-slate-500" : "text-slate-400"}`}>{ann.date}</span>
                        </div>
                        <p className={`text-xs font-semibold ${isClean ? "text-slate-900" : "text-white"}`}>{ann.title}</p>
                        <p className={`text-[11px] leading-relaxed ${isClean ? "text-slate-600" : "text-slate-400"}`}>{ann.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé Fixo do Widget: Link para Central Completa */}
          <div className={`p-3 border-t flex items-center justify-between ${
            isWhatsApp
              ? "bg-[#202C33] border-[#222D34]"
              : isClean
              ? "bg-slate-50 border-slate-200"
              : "bg-[#070D1B] border-slate-800/80"
          }`}>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/support");
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all group ${
                isWhatsApp
                  ? "bg-[#111B21] hover:bg-[#16222a] text-[#E9EDEF] border-[#2a3942]"
                  : isClean
                  ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60"
              }`}
            >
              <span>Ir para a Central de Ajuda</span>
              <ExternalLink size={13} className={
                isWhatsApp ? "text-emerald-400 group-hover:translate-x-0.5 transition-all" : isClean ? "text-blue-600 group-hover:translate-x-0.5 transition-all" : "text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
              } />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTÃO FLUTUANTE (FLOATING TRIGGER & DRAGGABLE HANDLE)                     */}
      {/* ========================================================================= */}
      <button
        onPointerDown={handlePointerDown}
        onClick={handleToggleOpen}
        aria-label="Abrir Suporte Vallor"
        title={
          isDragging 
            ? "Solte para fixar a posição" 
            : "Suporte Vallor (Clique para abrir, segure e arraste para mover)"
        }
        className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-xl transition-all duration-150 touch-none select-none ${
          isDragging 
            ? isWhatsApp
              ? "cursor-grabbing scale-105 shadow-2xl border-emerald-500/60 ring-2 ring-emerald-500/30 bg-[#202C33] text-white"
              : isClean
              ? "cursor-grabbing scale-105 shadow-2xl border-blue-500/60 ring-2 ring-blue-500/30 bg-slate-100 text-slate-900"
              : "cursor-grabbing scale-105 shadow-2xl border-blue-500/60 ring-2 ring-blue-500/30 bg-slate-800 text-white" 
            : "cursor-grab active:cursor-grabbing active:scale-95"
        } ${
          isOpen
            ? isWhatsApp
              ? "bg-[#202C33] text-white border border-[#2a3942] shadow-black/80"
              : isClean
              ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-slate-300/50"
              : "bg-slate-800 text-white border border-slate-700 shadow-slate-900/50"
            : isWhatsApp
            ? "bg-[#111B21] hover:bg-[#202C33] text-white border border-[#222D34] shadow-black/80"
            : isClean
            ? "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-slate-300/50"
            : "bg-[#0B1224] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shadow-black/80"
        }`}
      >
        {isOpen ? (
          <X size={20} className="transition-transform rotate-0 group-hover:rotate-90 duration-200 pointer-events-none" />
        ) : (
          <img src="/vallor/Favicon_vallor.svg?v=4" alt="Suporte Vallor" className="w-6 h-6 object-contain transition-transform group-hover:scale-110 duration-200 pointer-events-none" />
        )}

        {/* Indicador de Status Online (Dot Verde Pulsante) */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 ${
              isWhatsApp ? "border-[#111B21]" : isClean ? "border-white" : "border-[#0B1224]"
            }`} />
          </span>
        )}

        {/* Badge Numérico caso haja chamados ativos */}
        {!isOpen && openCount > 0 && (
          <span className={`absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold text-white border-2 shadow-sm pointer-events-none ${
            isWhatsApp
              ? "bg-emerald-600 border-[#111B21]"
              : isClean
              ? "bg-blue-600 border-white"
              : "bg-blue-600 border-[#0B1224]"
          }`}>
            {openCount}
          </span>
        )}
      </button>
    </div>
  );
}
