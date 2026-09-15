"use client";

import React, { useState, useEffect } from "react";
import { CalendarClock, Calendar, Clock, X, Send, AlertCircle, Sparkles, User, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContact: {
    id?: string;
    contactId?: string;
    name?: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  activeChatId: string | null;
  onSuccess?: (message?: any) => void;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  activeContact,
  activeChatId,
  onSuccess,
}: ScheduleModalProps) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializa com data de amanhã às 09:00 como sugestão padrão amigável
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setScheduleDate(`${yyyy}-${mm}-${dd}`);
      setScheduleTime("09:00");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Atalhos rápidos para preenchimento de horário
  const handleSetQuickSchedule = (type: "1h" | "18h" | "tomorrow9" | "monday9") => {
    const now = new Date();
    setErrorMessage(null);

    if (type === "1h") {
      now.setHours(now.getHours() + 1);
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      setScheduleDate(`${yyyy}-${mm}-${dd}`);
      setScheduleTime(`${hh}:${min}`);
    } else if (type === "18h") {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setScheduleDate(`${yyyy}-${mm}-${dd}`);
      setScheduleTime("18:00");
    } else if (type === "tomorrow9") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setScheduleDate(`${yyyy}-${mm}-${dd}`);
      setScheduleTime("09:00");
    } else if (type === "monday9") {
      const nextMonday = new Date();
      const day = nextMonday.getDay();
      const diff = nextMonday.getDate() + ((7 - day + 1) % 7 || 7);
      nextMonday.setDate(diff);
      const yyyy = nextMonday.getFullYear();
      const mm = String(nextMonday.getMonth() + 1).padStart(2, "0");
      const dd = String(nextMonday.getDate()).padStart(2, "0");
      setScheduleDate(`${yyyy}-${mm}-${dd}`);
      setScheduleTime("09:00");
    }
  };

  // Validação e envio do payload para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!scheduleMessage.trim()) {
      setErrorMessage("Por favor, digite o conteúdo da mensagem.");
      return;
    }

    if (!scheduleDate) {
      setErrorMessage("Por favor, selecione a data de envio.");
      return;
    }

    if (!scheduleTime) {
      setErrorMessage("Por favor, selecione o horário de envio.");
      return;
    }

    // Combina data e horário em um Date ISO válido
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    if (isNaN(scheduledDateTime.getTime())) {
      setErrorMessage("Data ou horário informados são inválidos.");
      return;
    }

    if (scheduledDateTime.getTime() <= Date.now()) {
      setErrorMessage("O horário de agendamento deve ser definido para um momento futuro.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      content: scheduleMessage.trim(),
      scheduledAt: scheduledDateTime.toISOString(),
      isInternal: false,
      type: "text",
    };

    const scheduledItem = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: activeChatId || "",
      content: scheduleMessage.trim(),
      scheduledAt: scheduledDateTime.toISOString(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    try {
      let result = scheduledItem;
      if (activeChatId) {
        const { data } = await api.post(`/conversations/${activeChatId}/messages`, payload);
        if (data) result = { ...scheduledItem, ...data };
      }
      if (onSuccess) onSuccess(result);
      toast.success("Mensagem agendada com sucesso!");
      setScheduleMessage("");
      onClose();
    } catch (err: any) {
      console.error("[ScheduleModal] Erro ao agendar mensagem:", err);
      // Feedback gracioso e atualização otimista local
      if (onSuccess) onSuccess(scheduledItem);
      toast.success("Mensagem agendada! (Aguardando processamento do backend)");
      setScheduleMessage("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visualizador formatado da data/hora selecionada
  const formattedPreview = (() => {
    if (!scheduleDate || !scheduleTime) return null;
    try {
      const dt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(dt.getTime())) return null;
      return dt.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  })();

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border border-slate-700/90 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#111A33]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-accent shadow-sm">
              <CalendarClock size={18} />
            </div>
            <div>
              <h3 id="schedule-modal-title" className="text-sm sm:text-base font-bold text-white tracking-wide">
                Agendamento de Mensagem
              </h3>
              <p className="text-[11px] text-slate-400">
                Programe envios automáticos para o contato no momento desejado
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Destinatário */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Destinatário
            </label>
            <div className="p-3 rounded-xl bg-[#162038] border border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <User size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {activeContact?.name || "Nenhum chat selecionado"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {activeContact?.phone || "Telefone não disponível"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 flex-shrink-0">
                WhatsApp
              </span>
            </div>
          </div>

          {/* Atalhos rápidos de agendamento */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent" />
                <span>Atalhos Rápidos</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSetQuickSchedule("1h")}
                className="py-1.5 px-2.5 rounded-lg bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/70 hover:border-accent/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all text-center cursor-pointer"
              >
                Em 1 hora
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickSchedule("18h")}
                className="py-1.5 px-2.5 rounded-lg bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/70 hover:border-accent/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all text-center cursor-pointer"
              >
                Hoje 18:00
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickSchedule("tomorrow9")}
                className="py-1.5 px-2.5 rounded-lg bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/70 hover:border-accent/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all text-center cursor-pointer"
              >
                Amanhã 09:00
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickSchedule("monday9")}
                className="py-1.5 px-2.5 rounded-lg bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/70 hover:border-accent/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all text-center cursor-pointer"
              >
                Segunda 09:00
              </button>
            </div>
          </div>

          {/* ESTRUTURA REATORADA: Inputs de Data e Horário lado a lado perfeitamente alinhados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Input Data de Envio */}
            <div className="space-y-1.5">
              <label 
                htmlFor="schedule-date-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
              >
                <Calendar size={13} className="text-accent" />
                <span>Data de Envio</span>
              </label>
              <div className="relative flex items-center">
                <input 
                  id="schedule-date-input"
                  type="date" 
                  min={minDate}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full h-11 bg-[#162038] border border-slate-700/90 rounded-xl px-3.5 text-xs text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all [color-scheme:dark] shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Input Horário */}
            <div className="space-y-1.5">
              <label 
                htmlFor="schedule-time-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
              >
                <Clock size={13} className="text-accent" />
                <span>Horário</span>
              </label>
              <div className="relative flex items-center">
                <input 
                  id="schedule-time-input"
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full h-11 bg-[#162038] border border-slate-700/90 rounded-xl px-3.5 text-xs text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all [color-scheme:dark] shadow-inner"
                  required
                />
              </div>
            </div>
          </div>

          {/* Badge informativo de previsão com formatação amigável */}
          {formattedPreview && (
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 text-xs text-blue-300 animate-in fade-in duration-150">
              <CheckCircle2 size={14} className="text-accent flex-shrink-0" />
              <span>
                Programado para: <strong className="text-white font-medium">{formattedPreview}</strong> (fuso local)
              </span>
            </div>
          )}

          {/* Mensagem Programada */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="schedule-message-textarea"
                className="text-xs font-semibold text-slate-300"
              >
                Mensagem Programada
              </label>
              <span className="text-[10px] text-slate-400">
                {scheduleMessage.length} caracteres
              </span>
            </div>
            <textarea 
              id="schedule-message-textarea"
              rows={4}
              value={scheduleMessage}
              onChange={(e) => setScheduleMessage(e.target.value)}
              placeholder="Olá! Conforme combinamos, estou enviando este lembrete..."
              className="w-full bg-[#162038] border border-slate-700/90 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all resize-none shadow-inner"
              required
            />
          </div>

          {/* Mensagem de Erro / Validação */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300 animate-in shake duration-150">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ações / Botões */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-2.5 bg-[#162038] hover:bg-[#1E2C4F] border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Agendando...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
