"use client";

import React from "react";
import { 
  CalendarClock, Clock, Trash2, Plus, X, Calendar, AlertCircle, 
  Send, CheckCircle2, Sparkles, MessageSquare, ArrowRight 
} from "lucide-react";
import toast from "react-hot-toast";

export interface ScheduledMessage {
  id: string;
  conversationId: string;
  content: string;
  scheduledAt: string; // ISO 8601
  status: "pending" | "sent" | "cancelled" | "failed";
  createdAt?: string;
}

interface ScheduledMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeContact: {
    name?: string;
    phone?: string;
  } | null;
  scheduledMessages: ScheduledMessage[];
  onCancelSchedule: (id: string) => Promise<void> | void;
  onOpenNewSchedule: () => void;
}

export default function ScheduledMessagesDrawer({
  isOpen,
  onClose,
  activeContact,
  scheduledMessages,
  onCancelSchedule,
  onOpenNewSchedule,
}: ScheduledMessagesDrawerProps) {
  if (!isOpen) return null;

  // Função para formatar data e horário em pt-BR
  const formatScheduledDate = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      if (isNaN(dt.getTime())) return "Data não informada";
      return dt.toLocaleString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Calcula tempo relativo restante (ex: "em 2 horas", "amanhã")
  const getRelativeTimeText = (isoString: string) => {
    try {
      const target = new Date(isoString).getTime();
      const now = Date.now();
      const diffMs = target - now;

      if (diffMs <= 0) return "Momento de disparo";

      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `Em ${diffMins} min`;

      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `Em ${diffHours}h`;

      const diffDays = Math.round(diffHours / 24);
      return `Em ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
    } catch {
      return "";
    }
  };

  const handleCancel = (msg: ScheduledMessage) => {
    if (window.confirm("Deseja realmente cancelar este agendamento de mensagem?")) {
      onCancelSchedule(msg.id);
      toast.success("Agendamento cancelado com sucesso!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border-l border-slate-700/80 w-full sm:max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduled-drawer-title"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#111A33]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <CalendarClock size={18} />
            </div>
            <div>
              <h3 id="scheduled-drawer-title" className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Mensagens Agendadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {scheduledMessages.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">
                {activeContact?.name || "Conversa ativa"} {activeContact?.phone ? `(${activeContact.phone})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Fechar painel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Mensagens Agendadas */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {scheduledMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#162038] border border-slate-700/70 flex items-center justify-center text-slate-400 shadow-inner">
                <CalendarClock size={32} className="text-cyan-400/70" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Nenhum agendamento pendente</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Não há mensagens programadas para envio automático a este contato no momento.
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
                <span>Agendar Nova Mensagem</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Fila de Disparo</span>
                <span>{scheduledMessages.length} pendente{scheduledMessages.length > 1 ? "s" : ""}</span>
              </div>

              {scheduledMessages.map((msg) => {
                const relativeText = getRelativeTimeText(msg.scheduledAt);
                return (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl bg-[#162038] border border-slate-700/70 hover:border-slate-600 transition-all space-y-3 shadow-md group relative overflow-hidden"
                  >
                    {/* Linha de Data e Relógio */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
                        <Clock size={13} className="text-cyan-400 shrink-0" />
                        <span className="capitalize">{formatScheduledDate(msg.scheduledAt)}</span>
                      </div>
                      {relativeText && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 shrink-0">
                          {relativeText}
                        </span>
                      )}
                    </div>

                    {/* Conteúdo da Mensagem */}
                    <div className="p-3 rounded-lg bg-[#0B1224] border border-slate-800 text-xs text-slate-200 font-normal leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    {/* Rodapé do Card */}
                    <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-700/40">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-medium">Programado</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancel(msg)}
                        className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/50 border border-transparent hover:border-rose-800/60 transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                        title="Cancelar este envio programado"
                      >
                        <Trash2 size={12} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        {scheduledMessages.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-[#111A33]/70 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewSchedule();
              }}
              className="w-2/3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Novo Agendamento</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
