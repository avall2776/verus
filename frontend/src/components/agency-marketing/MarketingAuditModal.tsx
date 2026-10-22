"use client";

import React from "react";
import { X, ShieldCheck, Clock, Monitor, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { TimeClockStatus } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timeStatus: TimeClockStatus | null;
}

export default function MarketingAuditModal({ isOpen, onClose, timeStatus }: Props) {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success("Hash de auditoria copiado!");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const logs = timeStatus?.todayLogs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-white space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Extrato de Auditoria de Sessão</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registros imutáveis de presença com assinatura SHA-256</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo da Sessão */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Jornada Acumulada</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{timeStatus?.activeHoursFormatted || "00h 00m"}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Status da Sessão</span>
            <span className="text-sm font-bold text-blue-600 dark:text-cyan-400">{timeStatus?.currentState || "NOT_STARTED"}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total de Batidas</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{logs.length}</span>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Histórico de Batidas de Hoje
          </span>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50 dark:bg-[#070D1B]/50">
              Nenhuma batida de ponto registrada na data de hoje.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#070D1B] overflow-hidden">
              {logs.map((log) => {
                const date = new Date(log.timestamp);
                const isCopied = copiedHash === log.sessionHash;

                return (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border ${
                          log.type === "ENTRADA"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : log.type === "PAUSA"
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : log.type === "RETORNO"
                            ? "bg-blue-500/20 text-blue-600 dark:text-cyan-400 border-blue-500/30"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {log.type.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{log.type}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {date.toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Monitor className="w-3 h-3" />
                          <span>IP: {log.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0B1224] p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 select-all truncate max-w-[200px] sm:max-w-xs">
                        {log.sessionHash}
                      </span>
                      <button
                        onClick={() => copyHash(log.sessionHash)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
                        title="Copiar Hash SHA-256"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs transition-colors border border-slate-300 dark:border-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
