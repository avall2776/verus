"use client";

import React, { useState, useMemo } from "react";
import { 
  CalendarClock, Clock, Search, Filter, Trash2, Calendar, 
  ExternalLink, User, CheckCircle2, AlertCircle, Plus, X, 
  ChevronRight, MessageSquare, Sparkles, CheckCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { ScheduledMessage } from "./ScheduledMessagesDrawer";

interface ContactInfo {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
}

interface GlobalScheduledCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledMessagesByChat: { [chatId: string]: ScheduledMessage[] };
  contacts: ContactInfo[];
  onSelectChat: (chatId: string) => void;
  onCancelSchedule: (id: string, chatId: string) => Promise<void> | void;
  onOpenNewSchedule: () => void;
}

type DateFilter = "all" | "today" | "tomorrow" | "week";

export default function GlobalScheduledCenterModal({
  isOpen,
  onClose,
  scheduledMessagesByChat,
  contacts,
  onSelectChat,
  onCancelSchedule,
  onOpenNewSchedule,
}: GlobalScheduledCenterModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Achata todos os agendamentos de todos os chats em uma lista única
  const allScheduled = useMemo(() => {
    const list: Array<ScheduledMessage & { contact?: ContactInfo }> = [];
    
    Object.entries(scheduledMessagesByChat).forEach(([chatId, messages]) => {
      const contact = contacts.find((c) => c.id === chatId);
      messages.forEach((msg) => {
        list.push({
          ...msg,
          contact: contact || { id: chatId, name: "Contato Desconhecido", phone: "" },
        });
      });
    });

    // Ordena cronologicamente (os mais próximos primeiro)
    return list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [scheduledMessagesByChat, contacts]);

  // Contadores por filtro de data
  const counts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    let todayCount = 0;
    let tomorrowCount = 0;
    let weekCount = 0;

    allScheduled.forEach((item) => {
      const itemDate = item.scheduledAt.split("T")[0];
      const itemTime = new Date(item.scheduledAt).getTime();

      if (itemDate === todayStr) todayCount++;
      if (itemDate === tomorrowStr) tomorrowCount++;
      if (itemTime >= now.getTime() && itemTime <= nextWeek.getTime()) weekCount++;
    });

    return {
      all: allScheduled.length,
      today: todayCount,
      tomorrow: tomorrowCount,
      week: weekCount,
    };
  }, [allScheduled]);

  // Filtra itens com base na busca e filtro de data
  const filteredList = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return allScheduled.filter((item) => {
      // Filtro de data
      if (dateFilter === "today") {
        if (item.scheduledAt.split("T")[0] !== todayStr) return false;
      } else if (dateFilter === "tomorrow") {
        if (item.scheduledAt.split("T")[0] !== tomorrowStr) return false;
      } else if (dateFilter === "week") {
        const itemTime = new Date(item.scheduledAt).getTime();
        if (itemTime < now.getTime() || itemTime > nextWeek.getTime()) return false;
      }

      // Filtro de busca textual (nome, telefone ou conteúdo da mensagem)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const contactName = item.contact?.name.toLowerCase() || "";
        const contactPhone = item.contact?.phone?.toLowerCase() || "";
        const msgContent = item.content.toLowerCase();

        return (
          contactName.includes(query) ||
          contactPhone.includes(query) ||
          msgContent.includes(query)
        );
      }

      return true;
    });
  }, [allScheduled, dateFilter, searchTerm]);

  // Agrupa os itens por data para exibição de linha do tempo
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: typeof filteredList } = {};

    filteredList.forEach((item) => {
      const datePart = item.scheduledAt.split("T")[0];
      if (!groups[datePart]) groups[datePart] = [];
      groups[datePart].push(item);
    });

    return groups;
  }, [filteredList]);

  if (!isOpen) return null;

  // Formatação amigável do título do dia
  const formatDayHeading = (dateStr: string) => {
    try {
      const [yyyy, mm, dd] = dateStr.split("-").map(Number);
      const targetDate = new Date(yyyy, mm - 1, dd);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (targetDate.getTime() === now.getTime()) return "Hoje";
      if (targetDate.getTime() === tomorrow.getTime()) return "Amanhã";

      return targetDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
    } catch {
      return dateStr;
    }
  };

  // Formata hora (HH:mm)
  const formatTimeOnly = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  // Tempo relativo
  const getRelativeText = (isoString: string) => {
    try {
      const target = new Date(isoString).getTime();
      const diffMs = target - Date.now();
      if (diffMs <= 0) return "Momento de disparo";

      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `Em ${diffMins} min`;

      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `Em ${diffHours}h`;

      const diffDays = Math.round(diffHours / 24);
      return `Em ${diffDays}d`;
    } catch {
      return "";
    }
  };

  // Cancelamento individual
  const handleCancel = (item: typeof allScheduled[0]) => {
    if (window.confirm(`Deseja cancelar o agendamento para ${item.contact?.name || "este contato"}?`)) {
      onCancelSchedule(item.id, item.conversationId);
      toast.success("Agendamento cancelado!");
    }
  };

  // Cancelamento em lote dos selecionados
  const handleBatchCancel = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Deseja cancelar os ${selectedIds.length} agendamentos selecionados?`)) {
      selectedIds.forEach((id) => {
        const item = allScheduled.find((i) => i.id === id);
        if (item) {
          onCancelSchedule(item.id, item.conversationId);
        }
      });
      setSelectedIds([]);
      toast.success("Agendamentos selecionados foram cancelados!");
    }
  };

  // Toggle de seleção de checkbox
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((i) => i.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border border-slate-700/90 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-schedule-title"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#111A33]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <CalendarClock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="global-schedule-title" className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Central de Agendamentos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {counts.all} programado{counts.all !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gerencie todos os envios automáticos e mensagens programadas de toda a empresa
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Filtros, Busca e Ações Rápidas */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-[#0B1224] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs de Filtro de Data */}
          <div className="flex items-center gap-1.5 bg-[#162038] p-1 rounded-xl border border-slate-700/80 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === "all"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] font-black opacity-80">({counts.all})</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === "today"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
            >
              <span>Hoje</span>
              <span className="text-[10px] font-black opacity-80">({counts.today})</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("tomorrow")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === "tomorrow"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
            >
              <span>Amanhã</span>
              <span className="text-[10px] font-black opacity-80">({counts.tomorrow})</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === "week"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
            >
              <span>Esta Semana</span>
              <span className="text-[10px] font-black opacity-80">({counts.week})</span>
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por contato ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#162038] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Barra de Ações em Lote (quando houver seleção) */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-cyan-950/60 border-b border-cyan-800/60 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCheck size={14} className="text-cyan-400" />
              <span>
                <strong>{selectedIds.length}</strong> agendamento{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={handleBatchCancel}
              className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Cancelar Selecionados</span>
            </button>
          </div>
        )}

        {/* Corpo da Lista / Linha do Tempo */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#162038] border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-inner">
                <CalendarClock size={32} className="text-cyan-400/60" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Nenhum agendamento encontrado</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {searchTerm || dateFilter !== "all"
                    ? "Não foram encontrados agendamentos correspondentes aos filtros aplicados."
                    : "Sua empresa ainda não possui mensagens programadas para envio automático."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewSchedule();
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Programar Novo Envio</span>
              </button>
            </div>
          ) : (
            Object.entries(groupedByDay).map(([dayKey, items]) => (
              <div key={dayKey} className="space-y-3">
                {/* Cabeçalho do Dia */}
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-800">
                  <Calendar size={13} className="text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider capitalize">
                    {formatDayHeading(dayKey)}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">
                    ({items.length} disparo{items.length > 1 ? "s" : ""})
                  </span>
                </div>

                {/* Cards das Mensagens do Dia */}
                <div className="grid grid-cols-1 gap-3">
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const relativeText = getRelativeText(item.scheduledAt);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl bg-[#162038] border transition-all space-y-3 relative group ${
                          isSelected
                            ? "border-cyan-500 bg-[#162544] shadow-lg shadow-cyan-500/10"
                            : "border-slate-700/80 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Destinatário & Checkbox */}
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectId(item.id)}
                              className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/40 bg-slate-800 cursor-pointer shrink-0"
                            />
                            <div className="w-8 h-8 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              <User size={13} className="text-cyan-300" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">
                                  {item.contact?.name || "Contato"}
                                </span>
                                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-950/70 text-blue-300 border border-blue-800/40 shrink-0">
                                  WhatsApp
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-400 truncate">
                                {item.contact?.phone || "Sem telefone"}
                              </p>
                            </div>
                          </div>

                          {/* Horário Previsto & Tag Relativa */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                                <Clock size={12} className="text-cyan-400" />
                                <span>{formatTimeOnly(item.scheduledAt)}</span>
                              </div>
                              {relativeText && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {relativeText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo da Mensagem */}
                        <div className="p-3 rounded-lg bg-[#0B1224] border border-slate-800/90 text-xs text-slate-200 font-normal leading-relaxed whitespace-pre-wrap break-words">
                          {item.content}
                        </div>

                        {/* Ações do Card */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Aguardando Envio Automático</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectChat(item.conversationId);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-[11px] cursor-pointer"
                              title="Abrir o chat deste cliente"
                            >
                              <ExternalLink size={11} />
                              <span>Abrir Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancel(item)}
                              className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/60 border border-transparent hover:border-rose-800/50 transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                              title="Cancelar este envio"
                            >
                              <Trash2 size={11} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#111A33]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {filteredList.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                {selectedIds.length === filteredList.length ? "Desmarcar todos" : "Selecionar todos da lista"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewSchedule();
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
