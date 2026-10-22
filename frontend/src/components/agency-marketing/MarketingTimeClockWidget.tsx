"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  Square,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  FileText,
  Activity,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { TimeClockStatus } from "./types";

interface Props {
  timeStatus: TimeClockStatus | null;
  onRefresh: () => void;
  onOpenAuditModal: () => void;
}

export default function MarketingTimeClockWidget({
  timeStatus,
  onRefresh,
  onOpenAuditModal,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsCounter, setSecondsCounter] = useState(0);

  // Inicializa e atualiza cronômetro de jornada ativa em tempo real
  useEffect(() => {
    if (timeStatus?.currentState === "ACTIVE") {
      const initialSeconds = (timeStatus.activeMinutes || 0) * 60;
      setSecondsCounter(initialSeconds);

      const interval = setInterval(() => {
        setSecondsCounter((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setSecondsCounter((timeStatus?.activeMinutes || 0) * 60);
    }
  }, [timeStatus?.currentState, timeStatus?.activeMinutes]);

  const formatSeconds = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleClockAction = async (type: "ENTRADA" | "PAUSA" | "RETORNO" | "SAIDA") => {
    setSubmitting(true);
    try {
      const res = await api.post("/agency/marketing/time-clock", { type });
      toast.success(res.data?.message || `Ponto registrado: ${type}`);
      onRefresh();
    } catch (err: any) {
      console.error("[TIME_CLOCK_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao registrar ponto eletrônico.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyHash = () => {
    if (!timeStatus?.lastAction?.sessionHash) return;
    navigator.clipboard.writeText(timeStatus.lastAction.sessionHash);
    setCopied(true);
    toast.success("Hash de auditoria copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const state = timeStatus?.currentState || "NOT_STARTED";

  return (
    <div className="w-full bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Bloco 1: Indicador de Presença e Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
                state === "ACTIVE"
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                  : state === "PAUSED"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : state === "ENDED"
                  ? "bg-slate-800/80 border-slate-700 text-slate-400"
                  : "bg-blue-600/10 border-blue-500/30 text-blue-400"
              }`}
            >
              <Clock className="w-6 h-6" />
            </div>
            {state === "ACTIVE" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ponto Eletrônico & Auditoria
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  state === "ACTIVE"
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : state === "PAUSED"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : state === "ENDED"
                    ? "bg-slate-800 text-slate-400 border-slate-700"
                    : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                }`}
              >
                {state === "ACTIVE"
                  ? "Jornada Ativa"
                  : state === "PAUSED"
                  ? "Em Pausa"
                  : state === "ENDED"
                  ? "Expediente Encerrado"
                  : "Aguardando Entrada"}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {state === "ACTIVE"
                  ? formatSeconds(secondsCounter)
                  : timeStatus?.activeHoursFormatted || "00:00:00"}
              </span>
              <span className="text-xs text-slate-500 font-medium">trabalhadas hoje</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Ações de Batida de Ponto */}
        <div className="flex flex-wrap items-center gap-2">
          {(state === "NOT_STARTED" || state === "ENDED") && (
            <button
              onClick={() => handleClockAction("ENTRADA")}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Iniciar Entrada</span>
            </button>
          )}

          {state === "ACTIVE" && (
            <>
              <button
                onClick={() => handleClockAction("PAUSA")}
                disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                <span>Pausa / Almoço</span>
              </button>
              <button
                onClick={() => handleClockAction("SAIDA")}
                disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                <span>Encerrar Saída</span>
              </button>
            </>
          )}

          {state === "PAUSED" && (
            <>
              <button
                onClick={() => handleClockAction("RETORNO")}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Retomar Expediente</span>
              </button>
              <button
                onClick={() => handleClockAction("SAIDA")}
                disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                <span>Encerrar Saída</span>
              </button>
            </>
          )}

          {/* Histórico e Auditoria */}
          <button
            onClick={onOpenAuditModal}
            className="px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            title="Ver registros de auditoria e extrato completo"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Auditoria</span>
          </button>
        </div>

        {/* Bloco 3: Hash Criptográfico SHA-256 */}
        {timeStatus?.lastAction?.sessionHash && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 max-w-full lg:max-w-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block leading-tight">
                Hash de Auditoria (SHA-256)
              </span>
              <span className="font-mono text-[10px] text-slate-300 truncate block">
                {timeStatus.lastAction.sessionHash.substring(0, 16)}...
              </span>
            </div>
            <button
              onClick={handleCopyHash}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Copiar Hash Completo"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
