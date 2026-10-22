"use client";

import React, { useState } from "react";
import {
  Flame,
  Plus,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Edit2,
  Calendar,
  ExternalLink,
  Layers,
} from "lucide-react";
import { MarketingCampaignItem, MarketingClientItem } from "./types";

interface Props {
  campaigns: MarketingCampaignItem[];
  clients: MarketingClientItem[];
  onOpenCampaignModal: (campaign?: MarketingCampaignItem) => void;
}

export default function MarketingTrafficTab({
  campaigns,
  clients,
  onOpenCampaignModal,
}: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [selectedClient, setSelectedClient] = useState<string>("ALL");

  // Filtros
  const filtered = campaigns.filter((c) => {
    if (selectedPlatform !== "ALL" && c.platform !== selectedPlatform) return false;
    if (selectedClient !== "ALL" && c.marketingClientId !== selectedClient) return false;
    return true;
  });

  // Métricas agregadas
  const totalSpent = filtered.reduce((acc, c) => acc + Number(c.spentAmount || 0), 0);
  const totalLeads = filtered.reduce((acc, c) => acc + Number(c.leadsGenerated || 0), 0);
  const avgCpl = totalLeads > 0 ? totalSpent / totalLeads : 0;
  const activeCount = filtered.filter((c) => c.status === "ACTIVE").length;

  const campaignsWithRoas = filtered.filter((c) => Number(c.roas || 0) > 0);
  const avgRoas =
    campaignsWithRoas.length > 0
      ? campaignsWithRoas.reduce((acc, c) => acc + Number(c.roas || 0), 0) / campaignsWithRoas.length
      : 0;

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "META_ADS":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-400 border border-blue-500/30">Meta Ads</span>;
      case "GOOGLE_ADS":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">Google Ads</span>;
      case "TIKTOK_ADS":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">TikTok Ads</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{platform}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Cards de Métricas de Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Investido</span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Leads Gerados</span>
          <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
            {totalLeads.toLocaleString("pt-BR")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CPL Médio</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            R$ {avgCpl.toFixed(2)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ROAS Médio</span>
          <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
            {avgRoas.toFixed(2)}x
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 shadow-md col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Campanhas Ativas</span>
          <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
            {activeCount}/{filtered.length}
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Plataforma */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#070D1B] p-1 rounded-xl border border-slate-800 text-xs">
            {["ALL", "META_ADS", "GOOGLE_ADS", "TIKTOK_ADS"].map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedPlatform === plat
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {plat === "ALL"
                  ? "Todas Plataformas"
                  : plat === "META_ADS"
                  ? "Meta Ads"
                  : plat === "GOOGLE_ADS"
                  ? "Google Ads"
                  : "TikTok"}
              </button>
            ))}
          </div>

          {/* Filtro por Cliente */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onOpenCampaignModal()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Campanha de Tráfego</span>
        </button>
      </div>

      {/* Lista de Campanhas */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-3xl bg-white dark:bg-[#0B1224]/50 flex flex-col items-center justify-center gap-3">
          <Flame className="w-10 h-10 text-slate-600" />
          <div className="max-w-sm">
            <h4 className="text-sm font-bold text-white mb-1">Nenhuma campanha de tráfego encontrada</h4>
            <p className="text-xs text-slate-500">
              Cadastre suas campanhas de Meta Ads ou Google Ads para acompanhar orçamentos, CPL e leads.
            </p>
          </div>
          <button
            onClick={() => onOpenCampaignModal()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold"
          >
            Lançar Primeira Campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((camp) => {
            const spent = Number(camp.spentAmount || 0);
            const budget = Number(camp.budgetTotal || 0);
            const leads = Number(camp.leadsGenerated || 0);
            const budgetPercent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

            return (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0B1224]/90 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getPlatformBadge(camp.platform)}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border truncate"
                        style={{
                          backgroundColor: `${camp.marketingClient?.brandColor || "#00D2FF"}15`,
                          borderColor: `${camp.marketingClient?.brandColor || "#00D2FF"}40`,
                          color: camp.marketingClient?.brandColor || "#00D2FF",
                        }}
                      >
                        {camp.marketingClient?.name || "Cliente"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          camp.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : camp.status === "PAUSED"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {camp.status === "ACTIVE"
                          ? "Ativa"
                          : camp.status === "PAUSED"
                          ? "Pausada"
                          : "Encerrada"}
                      </span>

                      <button
                        onClick={() => onOpenCampaignModal(camp)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar campanha"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-cyan-300 transition-colors">
                    {camp.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium block mb-3">
                    Objetivo: {camp.objective}
                  </span>

                  {/* Orçamento e Gasto */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80 space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Gasto Acumulado</span>
                      <span className="font-mono text-white font-bold">
                        R$ {spent.toFixed(2)} / R$ {budget.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Resultados: Leads, CPL e ROAS */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Leads</span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">{leads}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">CPL</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        R$ {Number(camp.cpl || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">ROAS</span>
                      <span className="font-mono font-bold text-purple-400 text-sm">
                        {Number(camp.roas || 0).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Campanha */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">
                    Diário: R$ {Number(camp.budgetDaily || 0).toFixed(2)}
                  </span>

                  {camp.startDate && (
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(camp.startDate).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
