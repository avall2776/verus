"use client";

import React, { useState, useEffect } from "react";
import { 
  X, User, Award, DollarSign, TrendingUp, CheckCircle2, 
  Calendar, Briefcase, Loader2, ArrowUpRight, ShieldCheck 
} from "lucide-react";
import { SellerDrilldownData } from "@/types/commercial";
import api from "@/lib/api";

interface SellerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName?: string;
}

export function SellerDetailModal({
  isOpen,
  onClose,
  userId,
  userName,
}: SellerDetailModalProps) {
  const [data, setData] = useState<SellerDrilldownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      api
        .get(`/goals/leaderboard/${userId}/details`)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          console.error("Erro ao carregar detalhes do vendedor:", err);
          setError("Não foi possível carregar os detalhes do consultor.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl text-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-base">
              {userName
                ? userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "VD"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {data?.user?.name || userName || "Detalhes do Consultor"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Performance Comercial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {data?.user?.email || "Histórico consolidado de propostas e vendas"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-medium">Carregando métricas do consultor...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-sm">
              {error}
            </div>
          ) : data ? (
            <>
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Receita Faturada
                  </span>
                  <div className="text-lg font-bold font-mono text-white">
                    R${" "}
                    {data.metrics.totalRevenueWon.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Contratos Ganhos
                  </span>
                  <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1.5">
                    {data.metrics.dealsWon}
                    <span className="text-xs font-normal text-slate-500">
                      de {data.metrics.totalDeals}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Taxa de Conversão
                  </span>
                  <div className="text-lg font-bold font-mono text-blue-400">
                    {data.metrics.conversionRate}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Ticket Médio
                  </span>
                  <div className="text-lg font-bold font-mono text-white">
                    R${" "}
                    {data.metrics.avgTicket.toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                    })}
                  </div>
                </div>
              </div>

              {/* Badges de Conquistas do Consultor */}
              {data.badges && data.badges.length > 0 && (
                <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-400" />
                      Conquistas & Selos Desbloqueados ({data.badges.length})
                    </h4>
                    <span className="text-[10px] text-blue-400/80 font-medium">
                      Reconhecimento Gamificado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {data.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="p-2.5 rounded-lg bg-[#0B1224] border border-slate-800 flex items-start gap-2.5"
                      >
                        <span className="text-xl p-1.5 rounded-md bg-slate-800/80 shrink-0">
                          {badge.icon}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {badge.title}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela de Negócios Recentes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    Histórico de Negócios Recentes ({data.recentDeals.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Últimas 20 negociações
                  </span>
                </div>

                {data.recentDeals.length === 0 ? (
                  <div className="py-8 text-center rounded-xl bg-[#070D1B] border border-slate-800/80 text-xs text-slate-500">
                    Nenhum negócio associado a este consultor no período.
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800/80 overflow-hidden bg-[#070D1B]">
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                      {data.recentDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-white flex items-center gap-2">
                              {deal.title}
                              {deal.isWon && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                  Ganho
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Cliente: {deal.clientName}
                              {deal.clientPhone ? ` • ${deal.clientPhone}` : ""}
                            </div>
                          </div>

                          <div className="text-right space-y-0.5">
                            <div className="font-mono font-bold text-white">
                              R${" "}
                              {deal.value.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(0,85,255,0.25)] transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
}
