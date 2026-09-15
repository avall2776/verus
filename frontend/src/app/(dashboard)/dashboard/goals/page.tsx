"use client";

import React, { useState, useMemo } from "react";
import { 
  Target, TrendingUp, Award, Users, Plus, Calendar, 
  CheckCircle2, AlertTriangle, Flame, ArrowUpRight, Zap,
  Trophy, Medal, ShieldAlert, Sparkles, DollarSign
} from "lucide-react";
import { CommercialGoal, SalesRepRanking } from "@/types/commercial";
import { NewGoalModal } from "@/components/goals/NewGoalModal";
import toast from "react-hot-toast";

const INITIAL_GOALS: CommercialGoal[] = [
  {
    id: "g-1",
    title: "Faturamento Mensal Geral",
    category: "revenue",
    period: "monthly",
    targetValue: 250000,
    currentValue: 194200,
    unit: "currency",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    projectionRate: 108.8, // Run rate de 108.8%
    status: "on_track"
  },
  {
    id: "g-2",
    title: "Novos Clientes Enterprise",
    category: "new_clients",
    period: "monthly",
    targetValue: 40,
    currentValue: 33,
    unit: "count",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    projectionRate: 115.0,
    status: "on_track"
  },
  {
    id: "g-3",
    title: "Reuniões & Demonstrações (SDR)",
    category: "qualified_leads",
    period: "monthly",
    targetValue: 120,
    currentValue: 98,
    unit: "count",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    projectionRate: 98.2,
    status: "on_track"
  },
  {
    id: "g-4",
    title: "Ticket Médio Comercial",
    category: "revenue",
    period: "monthly",
    targetValue: 10000,
    currentValue: 11450,
    unit: "currency",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    projectionRate: 114.5,
    status: "achieved"
  }
];

const INITIAL_RANKING: SalesRepRanking[] = [
  {
    id: "rep-1",
    name: "Ana Paula Mendes",
    role: "Senior Account Executive",
    achievedValue: 82500,
    targetValue: 70000,
    percentAchieved: 117.8,
    dealsCount: 14,
    rank: 1,
    badgeTier: "gold"
  },
  {
    id: "rep-2",
    name: "Lucas Fontes",
    role: "Closer Specialist",
    achievedValue: 56400,
    targetValue: 60000,
    percentAchieved: 94.0,
    dealsCount: 9,
    rank: 2,
    badgeTier: "silver"
  },
  {
    id: "rep-3",
    name: "Gabriel Sampaio",
    role: "Inside Sales",
    achievedValue: 52800,
    targetValue: 60000,
    percentAchieved: 88.0,
    dealsCount: 8,
    rank: 3,
    badgeTier: "bronze"
  },
  {
    id: "rep-4",
    name: "Beatriz Nogueira",
    role: "Business Developer",
    achievedValue: 43200,
    targetValue: 60000,
    percentAchieved: 72.0,
    dealsCount: 6,
    rank: 4,
    badgeTier: "participant"
  }
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<CommercialGoal[]>(INITIAL_GOALS);
  const [ranking, setRanking] = useState<SalesRepRanking[]>(INITIAL_RANKING);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "quarterly">("monthly");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cálculos gerais de Run Rate
  const runRateMetrics = useMemo(() => {
    const revenueGoal = goals.find((g) => g.category === "revenue");
    if (!revenueGoal) return { currentRunRate: 100, projectedRevenue: 0, daysRemaining: 15 };

    const daysRemaining = 15; // Setembro tem 30 dias, hoje é dia 15
    const daysPassed = 15;
    const dailyAvg = revenueGoal.currentValue / daysPassed;
    const projectedRevenue = revenueGoal.currentValue + (dailyAvg * daysRemaining);
    const currentRunRate = (projectedRevenue / revenueGoal.targetValue) * 100;

    return {
      currentRunRate,
      projectedRevenue,
      daysRemaining
    };
  }, [goals]);

  const handleSaveGoal = (newGoal: CommercialGoal) => {
    setGoals((prev) => [newGoal, ...prev]);
  };

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

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Metas & Desempenho Comercial
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                Setembro 2026
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Acompanhamento de ritmo (Run Rate), projeção de faturamento e ranking gamificado da equipe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedPeriod("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedPeriod === "monthly"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setSelectedPeriod("quarterly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedPeriod === "quarterly"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Trimestre (Q3)
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Definir Nova Meta
          </button>
        </div>
      </div>

      {/* Banner de Projeção de Ritmo (Run Rate Comercial) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0B1528] to-slate-900/90 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              Projeção Preditiva de Ritmo (Run Rate)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Ritmo Atual aponta para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                {runRateMetrics.currentRunRate.toFixed(1)}% de Atingimento
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Com base no volume negociado nos primeiros 15 dias, a projeção calculada estima o fechamento em{" "}
              <strong className="text-white">
                R$ {runRateMetrics.projectedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
              , superando a meta global estipulada em R$ 250.000,00.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Dias Restantes</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {runRateMetrics.daysRemaining} dias
              </span>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Média / Dia</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                R$ 12.946
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Probabilidade</span>
              <span className="text-xl font-bold font-mono text-white">
                94.2%
              </span>
            </div>
          </div>
        </div>

        {/* Efeito luminoso de fundo */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid de Cards de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
          const isCurrency = goal.unit === "currency";

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4 hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {goal.category.replace("_", " ")}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5 group-hover:text-cyan-300 transition-colors">
                    {goal.title}
                  </h3>
                </div>
                {getStatusBadge(goal.status)}
              </div>

              {/* Valores */}
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white">
                    {isCurrency
                      ? `R$ ${(goal.currentValue / 1000).toFixed(1)}k`
                      : goal.currentValue}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Alvo: {isCurrency ? `R$ ${(goal.targetValue / 1000).toFixed(1)}k` : goal.targetValue}
                  </span>
                </div>

                {/* Barra de Progresso Gradiente */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-700 shadow-sm shadow-cyan-500/50"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Rodapé do Card com Run Rate Individual */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Progresso Atual:</span>
                <span className="font-bold text-cyan-400 font-mono">{percent}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Projeção Estimada:</span>
                <span className="font-bold text-emerald-400 font-mono">{goal.projectionRate}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção Leaderboard (Ranking Gamificado da Equipe Comercial) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Leaderboard de Vendas
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  Ranking Gamificado
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Desempenho individual por meta atingida, volume negociado e contratos fechados
              </p>
            </div>
          </div>
        </div>

        {/* Pódio dos Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2º Lugar - Prata */}
          {ranking[1] && (
            <div className="order-2 md:order-1 p-5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-600/40 relative flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-700/60 text-slate-300 border border-slate-600 flex items-center gap-1.5">
                  🥈 2º Lugar
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {ranking[1].dealsCount} vendas
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-slate-400 to-slate-600 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-base font-bold text-white">
                    {ranking[1].name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{ranking[1].name}</h4>
                <p className="text-xs text-slate-400">{ranking[1].role}</p>
                <div className="text-lg font-extrabold text-cyan-400 font-mono mt-2">
                  R$ {ranking[1].achievedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Atingimento da Meta</span>
                  <span className="font-bold text-white">{ranking[1].percentAchieved}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${Math.min(100, ranking[1].percentAchieved)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 1º Lugar - Ouro (Destaque Principal) */}
          {ranking[0] && (
            <div className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-[#131B32] to-slate-900/90 border-2 border-amber-500/40 relative flex flex-col justify-between shadow-2xl shadow-amber-500/10 md:-translate-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                  🥇 1º Lugar • Líder Geral
                </span>
                <span className="text-xs font-semibold text-amber-400 font-mono">
                  {ranking[0].dealsCount} vendas
                </span>
              </div>

              <div className="my-5 text-center">
                <div className="w-18 h-18 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 p-1 shadow-lg shadow-amber-500/30">
                  <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center text-lg font-black text-amber-400">
                    {ranking[0].name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                </div>
                <h4 className="text-base font-extrabold text-white mt-2">{ranking[0].name}</h4>
                <p className="text-xs text-amber-300/80">{ranking[0].role}</p>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 font-mono mt-2">
                  R$ {ranking[0].achievedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-amber-300 font-medium mb-1">
                  <span>Meta Superada!</span>
                  <span className="font-extrabold text-white">{ranking[0].percentAchieved}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3º Lugar - Bronze */}
          {ranking[2] && (
            <div className="order-3 p-5 rounded-2xl bg-gradient-to-b from-amber-900/20 to-slate-900/80 border border-amber-800/40 relative flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-900/40 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                  🥉 3º Lugar
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {ranking[2].dealsCount} vendas
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 to-amber-800 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-base font-bold text-amber-200">
                    {ranking[2].name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{ranking[2].name}</h4>
                <p className="text-xs text-slate-400">{ranking[2].role}</p>
                <div className="text-lg font-extrabold text-cyan-400 font-mono mt-2">
                  R$ {ranking[2].achievedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Atingimento da Meta</span>
                  <span className="font-bold text-white">{ranking[2].percentAchieved}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full"
                    style={{ width: `${Math.min(100, ranking[2].percentAchieved)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabela de classificação geral da equipe */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Posição</th>
                <th className="p-3.5">Consultor Comercial</th>
                <th className="p-3.5 text-center">Contratos Fechados</th>
                <th className="p-3.5 text-right">Meta Alvo</th>
                <th className="p-3.5 text-right">Faturado</th>
                <th className="p-3.5 text-right">% da Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ranking.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-bold font-mono">
                    {rep.rank === 1 ? "🥇 1º" : rep.rank === 2 ? "🥈 2º" : rep.rank === 3 ? "🥉 3º" : `#${rep.rank}`}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{rep.name}</div>
                    <div className="text-[11px] text-slate-400">{rep.role}</div>
                  </td>
                  <td className="p-3.5 text-center font-semibold text-slate-300">
                    {rep.dealsCount}
                  </td>
                  <td className="p-3.5 text-right text-slate-400 font-mono">
                    R$ {rep.targetValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right font-bold text-white font-mono">
                    R$ {rep.achievedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                        rep.percentAchieved >= 100
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : rep.percentAchieved >= 80
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {rep.percentAchieved}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Meta */}
      <NewGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
