"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Target, TrendingUp, Award, Users, Plus, Calendar, 
  CheckCircle2, AlertTriangle, Flame, ArrowUpRight, Zap,
  Trophy, Medal, ShieldAlert, Sparkles, DollarSign, RefreshCw,
  MoreVertical, Edit3, Trash2, Eye, Sliders, ChevronRight,
  UserCheck, Briefcase, Activity, Filter
} from "lucide-react";
import { CommercialGoal, SalesRepRanking, GoalRunRateSummary } from "@/types/commercial";
import { NewGoalModal } from "@/components/goals/NewGoalModal";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { SellerDetailModal } from "@/components/goals/SellerDetailModal";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Formatadores seguros contra valores undefined/null
const formatMoney = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatShortMoney = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString("pt-BR");
};

const formatNumber = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("pt-BR");
};

const getInitials = (name?: string | null) => {
  if (!name || typeof name !== "string") return "VD";
  const clean = name.trim();
  if (!clean) return "VD";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<CommercialGoal[]>([]);
  const [ranking, setRanking] = useState<SalesRepRanking[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtro por canal de origem
  const [selectedChannel, setSelectedChannel] = useState<string>("all");

  // Modais
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CommercialGoal | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [selectedSellerName, setSelectedSellerName] = useState<string>("");

  // Simulador de ritmo diário
  const [dailyPaceBonus, setDailyPaceBonus] = useState<number>(0);

  // Carregar dados reais da API
  const loadData = useCallback(async (isSilent = false, channel?: string) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const activeChannel = channel !== undefined ? channel : selectedChannel;

    try {
      const [summaryRes, goalsRes, rankingRes] = await Promise.all([
        api.get("/goals/summary", { params: { channel: activeChannel } }).catch((err) => {
          console.error("Erro summary:", err);
          return { data: null };
        }),
        api.get("/goals").catch((err) => {
          console.error("Erro goals:", err);
          return { data: [] };
        }),
        api.get("/goals/leaderboard").catch((err) => {
          console.error("Erro leaderboard:", err);
          return { data: [] };
        }),
      ]);

      if (summaryRes?.data) {
        setSummary(summaryRes.data);
      }

      if (Array.isArray(goalsRes?.data)) {
        setGoals(goalsRes.data);
      }

      if (Array.isArray(rankingRes?.data)) {
        setRanking(rankingRes.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de metas:", error);
      toast.error("Erro ao conectar com o serviço de metas comerciais.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChannel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Valores normalizados de Summary
  const summaryMetrics = useMemo(() => {
    if (!summary) return null;

    const totalTarget = Number(summary.totalTarget ?? summary.totalRevenueTarget ?? 0);
    const totalCurrent = Number(summary.totalCurrent ?? summary.totalRevenueWon ?? 0);
    const projectedRevenue = Number(summary.projectedRevenue ?? 0);
    const currentDailyPace = Number(summary.currentDailyPace ?? summary.dailyPace ?? 0);
    const dailyPaceNeeded = Number(summary.dailyPaceNeeded ?? summary.requiredDailyPace ?? 0);
    const daysPassed = Number(summary.daysPassed ?? 0);
    const daysRemaining = Number(summary.daysRemaining ?? 0);
    const overallProgress = Number(summary.overallProgress ?? summary.progressPercentage ?? 0);
    const expectedPacePercentage = Number(summary.expectedPacePercentage ?? 0);
    const paceGap = Number(summary.paceGap ?? 0);
    const healthStatus = String(summary.healthStatus ?? "on_track").toUpperCase();

    return {
      totalTarget,
      totalCurrent,
      projectedRevenue,
      currentDailyPace,
      dailyPaceNeeded,
      daysPassed,
      daysRemaining,
      overallProgress,
      expectedPacePercentage,
      paceGap,
      healthStatus,
    };
  }, [summary]);

  // Cálculos do Simulador Preditivo
  const simulatedRunRate = useMemo(() => {
    if (!summaryMetrics) return null;

    const baseProjected = summaryMetrics.projectedRevenue;
    const additionalFromBonus = (Number(dailyPaceBonus) || 0) * summaryMetrics.daysRemaining;
    const totalProjected = baseProjected + additionalFromBonus;
    const target = summaryMetrics.totalTarget > 0 ? summaryMetrics.totalTarget : 1;
    const simulatedProgress = Math.round((totalProjected / target) * 100);

    return {
      totalProjected,
      simulatedProgress,
      additionalRevenue: additionalFromBonus,
      target,
    };
  }, [summaryMetrics, dailyPaceBonus]);

  const getStatusBadge = (status: CommercialGoal["status"]) => {
    switch (status) {
      case "achieved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Meta Superada
          </span>
        );
      case "on_track":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> No Ritmo
          </span>
        );
      case "at_risk":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Em Risco
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Abaixo da Meta
          </span>
        );
    }
  };

  const getHealthBadge = (health?: string) => {
    const h = String(health || "").toUpperCase();
    if (h === "EXCEEDED" || h === "ACHIEVED") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Meta Batida
        </span>
      );
    }
    if (h === "ON_TRACK") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
          <Flame className="w-3.5 h-3.5 text-cyan-400" /> No Ritmo (No Prazo)
        </span>
      );
    }
    if (h === "BEHIND" || h === "AT_RISK") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Desacelerado (Atenção)
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Ritmo Crítico
      </span>
    );
  };

  const openSellerDrilldown = (userId?: string | null, name?: string) => {
    if (!userId) return;
    setSelectedSellerId(userId);
    setSelectedSellerName(name || "Consultor Comercial");
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta meta comercial?")) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success("Meta excluída com sucesso.");
      loadData(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao excluir meta.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Metas & Desempenho Comercial
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                Run Rate & Gamificação
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Acompanhamento preditivo de ritmo, projeção de fechamento e leaderboard gamificado da equipe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1224] border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            title="Atualizar dados agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          <button
            onClick={() => setIsNewGoalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(0,85,255,0.25)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Hero: Motor Preditivo de Run Rate */}
      {summaryMetrics && (
        <div className="p-6 rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  Motor Preditivo de Run Rate Comercial
                </div>
                {getHealthBadge(summaryMetrics.healthStatus)}
              </div>

              <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                Ritmo aponta para{" "}
                <span className="text-blue-400 font-black font-mono">
                  {summaryMetrics.totalTarget > 0
                    ? `${Math.round((summaryMetrics.projectedRevenue / summaryMetrics.totalTarget) * 100)}% da Meta`
                    : "0% da Meta"}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Com base nos {summaryMetrics.daysPassed} dias decorridos do mês atual e na velocidade média diária de{" "}
                <strong className="text-slate-200 font-mono">
                  R$ {formatMoney(summaryMetrics.currentDailyPace)}/dia
                </strong>
                , a projeção matemática estima o faturamento final em{" "}
                <strong className="text-white font-mono">
                  R$ {formatMoney(summaryMetrics.projectedRevenue)}
                </strong>
                .
              </p>

              {/* Filtro Dinâmico por Canal de Origem */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  Canal de Aquisição:
                </span>
                {[
                  { id: "all", label: "Todos os Canais" },
                  { id: "whatsapp", label: "WhatsApp" },
                  { id: "meta_ads", label: "Meta Ads" },
                  { id: "google_ads", label: "Google Ads" },
                  { id: "organico", label: "Orgânico" },
                  { id: "indicacao", label: "Indicação" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChannel(ch.id);
                      loadData(true, ch.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedChannel === ch.id
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold"
                        : "bg-[#070D1B] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Metrics Badges (Monocromáticos e Sóbrios) */}
            <div className="grid grid-cols-3 gap-3 shrink-0 bg-[#070D1B] p-4 rounded-xl border border-slate-800">
              <div className="text-center px-2 border-r border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Dias Restantes
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-white">
                  {summaryMetrics.daysRemaining} dias
                </span>
              </div>

              <div className="text-center px-2 border-r border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Ritmo Necessário
                </span>
                <span className={`text-lg sm:text-xl font-bold font-mono ${summaryMetrics.dailyPaceNeeded > summaryMetrics.currentDailyPace ? "text-amber-400" : "text-slate-200"}`}>
                  R$ {formatShortMoney(summaryMetrics.dailyPaceNeeded)}
                </span>
              </div>

              <div className="text-center px-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Ritmo Atual
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-blue-400">
                  R$ {formatShortMoney(summaryMetrics.currentDailyPace)}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso Comparativa: Ritmo Esperado vs Ritmo Real */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Faturamento Real Realizado (
                <strong className="text-white font-mono">
                  R$ {formatMoney(summaryMetrics.totalCurrent)}
                </strong>
                ) de{" "}
                <span className="text-slate-500 font-mono">
                  R$ {formatMoney(summaryMetrics.totalTarget)}
                </span>
              </span>
              <span className="font-bold text-white font-mono">{summaryMetrics.overallProgress}%</span>
            </div>

            <div className="w-full h-3 bg-[#070D1B] rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
              {/* Linha vertical que marca o ritmo de tempo decorrido no mês */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                style={{ left: `${Math.min(100, Math.max(0, summaryMetrics.expectedPacePercentage))}%` }}
                title={`Ritmo de Tempo no Mês: ${summaryMetrics.expectedPacePercentage}%`}
              />
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, summaryMetrics.overallProgress))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Marcador amarelo: Tempo decorrido no mês ({summaryMetrics.expectedPacePercentage}%)
              </span>
              <span>
                {summaryMetrics.paceGap >= 0 ? (
                  <span className="text-blue-400 font-semibold font-mono">
                    +{summaryMetrics.paceGap}% vs cronograma
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold font-mono">
                    {summaryMetrics.paceGap}% vs cronograma
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Simulador Interativo de Aceleração */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">
                  Simulador de Cenários: E se a equipe acelerar as vendas?
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Incremento adicional simulado:{" "}
                <span className="font-mono font-bold text-blue-400">
                  +R$ {formatNumber(dailyPaceBonus)}/dia
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={15000}
                step={500}
                value={dailyPaceBonus}
                onChange={(e) => setDailyPaceBonus(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <button
                onClick={() => setDailyPaceBonus(0)}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white shrink-0"
              >
                Resetar
              </button>
            </div>

            {simulatedRunRate && dailyPaceBonus > 0 && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-slate-800/60 animate-in fade-in">
                <span className="text-slate-300">
                  Impacto projetado:{" "}
                  <strong className="text-white font-mono">
                    +R$ {formatMoney(simulatedRunRate.additionalRevenue)}
                  </strong>{" "}
                  adicionais até o fechamento.
                </span>
                <span className="text-slate-200 font-medium">
                  Novo Fechamento Estimado:{" "}
                  <strong className="text-blue-400 font-mono">
                    R$ {formatMoney(simulatedRunRate.totalProjected)}
                  </strong>{" "}
                  ({simulatedRunRate.simulatedProgress}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerta Executivo de Aceleração Comercial (Quando Pace Gap é negativo ou status é At_risk/Behind) */}
      {summaryMetrics && (summaryMetrics.paceGap < 0 || summaryMetrics.healthStatus === "BEHIND" || summaryMetrics.healthStatus === "CRITICAL" || summaryMetrics.healthStatus === "AT_RISK") && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#181512] to-rose-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Alerta Executivo de Ritmo Comercial: Ritmo {Math.abs(summaryMetrics.paceGap)}% abaixo do cronograma
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Ação Recomendada
                </span>
              </div>
              <p className="text-xs text-slate-300">
                A velocidade média atual aponta para um déficit de{" "}
                <strong className="text-rose-400 font-mono">
                  R$ {formatMoney(Math.max(0, summaryMetrics.totalTarget - summaryMetrics.projectedRevenue))}
                </strong>{" "}
                em relação à meta do ciclo. Acione o playbook de recuperação comercial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/settings/automations"
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Ativar Resgate de Leads
            </a>
            <a
              href="/dashboard/analytics"
              className="px-3.5 py-2 rounded-xl bg-[#070D1B] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Ver Funil & Gargalos
            </a>
          </div>
        </div>
      )}

      {/* Grid de Metas Comerciais Ativas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Metas Comerciais Estabelecidas ({goals.length})
          </h3>
          <span className="text-xs text-slate-400">
            Acompanhamento individual e coletivo
          </span>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0B1224] border border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Nenhuma meta configurada ainda</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Defina as metas do mês para calcular o Run Rate diário e classificar os vendedores no Leaderboard.
            </p>
            <button
              onClick={() => setIsNewGoalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(0,85,255,0.25)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {goals.map((goal) => {
              const currentVal = Number(goal.currentValue || 0);
              const targetVal = Number(goal.targetValue || 1) || 1;
              const percent = goal.progressPercentage !== undefined
                ? Number(goal.progressPercentage)
                : Math.min(100, Math.round((currentVal / targetVal) * 100));
              const isCurrency = goal.targetType === "REVENUE" || goal.unit === "currency";

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl bg-[#0B1224] border border-slate-800/80 hover:border-blue-500/40 transition-all group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate max-w-[180px]">
                        {goal.user?.name ? `Vendedor: ${goal.user.name}` : "Meta Coletiva (Equipe)"}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingGoal(goal)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar meta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Excluir meta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {goal.title || "Meta"}
                    </h4>

                    <div className="pt-1">
                      {getStatusBadge(goal.status)}
                    </div>
                  </div>

                  {/* Números */}
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-white font-mono">
                        {isCurrency ? `R$ ${formatShortMoney(currentVal)}` : formatNumber(currentVal)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Alvo: {isCurrency ? `R$ ${formatShortMoney(targetVal)}` : formatNumber(targetVal)}
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full h-2 bg-[#070D1B] rounded-full overflow-hidden mt-2 p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Atingimento:</span>
                    <span className="font-bold text-blue-400 font-mono">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard Gamificado & Pódio dos Top 3 */}
      <div className="p-6 rounded-2xl bg-[#0B1224] border border-slate-800/80 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Leaderboard Gamificado da Equipe
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                  Top Closers
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Classificação em tempo real por contratos fechados, receita acumulada e taxa de conversão
              </p>
            </div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs rounded-xl bg-[#070D1B] border border-slate-800">
            Nenhum contrato fechado no período atual para exibir o Leaderboard.
          </div>
        ) : (
          <>
            {/* Pódio Visual dos Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 2º Lugar - Prata */}
              {ranking[1] && (
                <div 
                  onClick={() => openSellerDrilldown(ranking[1].userId || ranking[1].id, ranking[1].name)}
                  className="order-2 md:order-1 p-5 rounded-2xl bg-[#0B1224] border border-slate-800 relative flex flex-col justify-between hover:border-slate-700 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                      🥈 2º Lugar
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatNumber(ranking[1].dealsWon ?? ranking[1].dealsCount)} vendas
                    </span>
                  </div>

                  <div className="my-4 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-700 p-0.5 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#070D1B] flex items-center justify-center text-base font-bold text-slate-200">
                        {getInitials(ranking[1].name)}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">
                      {ranking[1].name || "Consultor"}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{ranking[1].email || "Consultor"}</p>
                    <div className="text-lg font-extrabold text-white font-mono mt-2">
                      R$ {formatMoney(ranking[1].totalRevenueWon ?? ranking[1].achievedValue)}
                    </div>

                    {/* Badges de Conquistas */}
                    {ranking[1].badges && ranking[1].badges.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                        {ranking[1].badges.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            title={`${b.title}: ${b.description}`}
                            className="text-xs px-1.5 py-0.5 rounded bg-[#070D1B] border border-slate-800 text-slate-300 flex items-center gap-1 cursor-help"
                          >
                            <span>{b.icon}</span>
                            <span className="text-[10px] font-semibold">{b.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Conversão: {Number(ranking[1].conversionRate || 0)}%</span>
                      <span className="text-slate-300 font-bold font-mono">
                        Ticket: R$ {formatShortMoney(ranking[1].avgTicket)}
                      </span>
                    </div>
                    <div className="text-[11px] text-center text-blue-400 flex items-center justify-center gap-1 pt-1 opacity-80 group-hover:opacity-100">
                      <span>Ver histórico completo</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* 1º Lugar - Destaque Líder */}
              {ranking[0] && (
                <div 
                  onClick={() => openSellerDrilldown(ranking[0].userId || ranking[0].id, ranking[0].name)}
                  className="order-1 md:order-2 p-6 rounded-2xl bg-[#0B1224] border-2 border-blue-500/40 relative flex flex-col justify-between shadow-xl shadow-blue-500/5 md:-translate-y-2 hover:border-blue-500/70 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
                      🥇 1º Lugar • Líder Comercial
                    </span>
                    <span className="text-xs font-semibold text-blue-400 font-mono">
                      {formatNumber(ranking[0].dealsWon ?? ranking[0].dealsCount)} vendas
                    </span>
                  </div>

                  <div className="my-5 text-center">
                    <div className="w-18 h-18 mx-auto rounded-full bg-blue-600/20 border border-blue-500/30 p-1 shadow-md">
                      <div className="w-16 h-16 rounded-full bg-[#070D1B] flex items-center justify-center text-lg font-black text-blue-400">
                        {getInitials(ranking[0].name)}
                      </div>
                    </div>
                    <h4 className="text-base font-extrabold text-white mt-2 group-hover:text-blue-400 transition-colors">
                      {ranking[0].name || "Líder Comercial"}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{ranking[0].email || "Líder de Vendas"}</p>
                    <div className="text-2xl font-black text-white font-mono mt-2">
                      R$ {formatMoney(ranking[0].totalRevenueWon ?? ranking[0].achievedValue)}
                    </div>

                    {/* Badges de Conquistas */}
                    {ranking[0].badges && ranking[0].badges.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5">
                        {ranking[0].badges.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            title={`${b.title}: ${b.description}`}
                            className="text-xs px-2 py-0.5 rounded-lg bg-[#070D1B] border border-slate-800 text-slate-300 flex items-center gap-1 cursor-help"
                          >
                            <span>{b.icon}</span>
                            <span className="text-[10px] font-bold">{b.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>Conversão: {Number(ranking[0].conversionRate || 0)}%</span>
                      <span className="text-slate-300 font-bold font-mono">
                        Ticket: R$ {formatShortMoney(ranking[0].avgTicket)}
                      </span>
                    </div>
                    <div className="text-[11px] text-center text-blue-400 flex items-center justify-center gap-1 pt-1 opacity-80 group-hover:opacity-100">
                      <span>Ver histórico completo</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* 3º Lugar - Bronze */}
              {ranking[2] && (
                <div 
                  onClick={() => openSellerDrilldown(ranking[2].userId || ranking[2].id, ranking[2].name)}
                  className="order-3 p-5 rounded-2xl bg-[#0B1224] border border-slate-800 relative flex flex-col justify-between hover:border-slate-700 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                      🥉 3º Lugar
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatNumber(ranking[2].dealsWon ?? ranking[2].dealsCount)} vendas
                    </span>
                  </div>

                  <div className="my-4 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-700 p-0.5 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#0B1224] flex items-center justify-center text-base font-bold text-slate-200">
                        {getInitials(ranking[2].name)}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">
                      {ranking[2].name || "Consultor"}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{ranking[2].email || "Consultor"}</p>
                    <div className="text-lg font-extrabold text-white font-mono mt-2">
                      R$ {formatMoney(ranking[2].totalRevenueWon ?? ranking[2].achievedValue)}
                    </div>

                    {/* Badges de Conquistas */}
                    {ranking[2].badges && ranking[2].badges.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                        {ranking[2].badges.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            title={`${b.title}: ${b.description}`}
                            className="text-xs px-1.5 py-0.5 rounded bg-[#070D1B] border border-slate-800 text-slate-300 flex items-center gap-1 cursor-help"
                          >
                            <span>{b.icon}</span>
                            <span className="text-[10px] font-semibold">{b.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Conversão: {Number(ranking[2].conversionRate || 0)}%</span>
                      <span className="text-slate-300 font-bold font-mono">
                        Ticket: R$ {formatShortMoney(ranking[2].avgTicket)}
                      </span>
                    </div>
                    <div className="text-[11px] text-center text-blue-400 flex items-center justify-center gap-1 pt-1 opacity-80 group-hover:opacity-100">
                      <span>Ver histórico completo</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabela de Classificação Geral da Equipe */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070D1B] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Posição</th>
                    <th className="p-3.5">Consultor Comercial</th>
                    <th className="p-3.5">Conquistas</th>
                    <th className="p-3.5 text-center">Vendas Fechadas</th>
                    <th className="p-3.5 text-center">Taxa de Conversão</th>
                    <th className="p-3.5 text-right">Ticket Médio</th>
                    <th className="p-3.5 text-right">Faturamento Total</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0B1224]/50">
                  {ranking.map((rep) => (
                    <tr key={rep.userId || rep.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-300">
                        {rep.rank === 1 ? "🥇 1º" : rep.rank === 2 ? "🥈 2º" : rep.rank === 3 ? "🥉 3º" : `#${rep.rank}`}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{rep.name || "Consultor"}</div>
                        <div className="text-[11px] text-slate-400">{rep.email || "Consultor"}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {rep.badges && rep.badges.length > 0 ? (
                            rep.badges.slice(0, 3).map((b) => (
                              <span
                                key={b.id}
                                title={`${b.title}: ${b.description}`}
                                className="text-xs px-1.5 py-0.5 rounded bg-[#070D1B] border border-slate-800 cursor-help"
                              >
                                {b.icon}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-300">
                        {formatNumber(rep.dealsWon ?? rep.dealsCount)}
                      </td>
                      <td className="p-3.5 text-center font-mono text-blue-400 font-semibold">
                        {Number(rep.conversionRate || 0)}%
                      </td>
                      <td className="p-3.5 text-right text-slate-300 font-mono">
                        R$ {formatShortMoney(rep.avgTicket)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-white font-mono">
                        R$ {formatMoney(rep.totalRevenueWon ?? rep.achievedValue)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openSellerDrilldown(rep.userId || rep.id, rep.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modais Integrados */}
      <NewGoalModal
        isOpen={isNewGoalOpen}
        onClose={() => setIsNewGoalOpen(false)}
        onSuccess={() => loadData(true)}
      />

      <EditGoalModal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        goal={editingGoal}
        onSuccess={() => loadData(true)}
      />

      <SellerDetailModal
        isOpen={!!selectedSellerId}
        onClose={() => setSelectedSellerId(null)}
        userId={selectedSellerId}
        userName={selectedSellerName}
      />
    </div>
  );
}
