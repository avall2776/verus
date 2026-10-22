"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Flame,
  Loader2,
  Trash2,
  DollarSign,
  TrendingUp,
  Target,
  Globe,
  Calendar,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { MarketingCampaignItem, MarketingClientItem } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaign: MarketingCampaignItem | null;
  clients: MarketingClientItem[];
  onSaved: () => void;
}

export default function MarketingCampaignModal({
  isOpen,
  onClose,
  campaign,
  clients,
  onSaved,
}: Props) {
  const isEditing = Boolean(campaign?.id);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [platform, setPlatform] = useState<MarketingCampaignItem["platform"]>("META_ADS");
  const [status, setStatus] = useState<MarketingCampaignItem["status"]>("ACTIVE");
  const [objective, setObjective] = useState<MarketingCampaignItem["objective"]>("LEADS");
  const [budgetDaily, setBudgetDaily] = useState<number>(0);
  const [budgetTotal, setBudgetTotal] = useState<number>(0);
  const [spentAmount, setSpentAmount] = useState<number>(0);
  const [leadsGenerated, setLeadsGenerated] = useState<number>(0);
  const [cpl, setCpl] = useState<number>(0);
  const [roas, setRoas] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [campaignUrl, setCampaignUrl] = useState("");

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || "");
      setClientId(campaign.marketingClientId || (clients[0]?.id || ""));
      setPlatform(campaign.platform || "META_ADS");
      setStatus(campaign.status || "ACTIVE");
      setObjective(campaign.objective || "LEADS");
      setBudgetDaily(campaign.budgetDaily || 0);
      setBudgetTotal(campaign.budgetTotal || 0);
      setSpentAmount(campaign.spentAmount || 0);
      setLeadsGenerated(campaign.leadsGenerated || 0);
      setCpl(campaign.cpl || 0);
      setRoas(campaign.roas || 0);
      setStartDate(campaign.startDate ? campaign.startDate.substring(0, 10) : "");
      setEndDate(campaign.endDate ? campaign.endDate.substring(0, 10) : "");
      setTargetAudience(campaign.targetAudience || "");
      setCampaignUrl(campaign.campaignUrl || "");
    } else {
      setName("");
      setClientId(clients[0]?.id || "");
      setPlatform("META_ADS");
      setStatus("ACTIVE");
      setObjective("LEADS");
      setBudgetDaily(50);
      setBudgetTotal(1500);
      setSpentAmount(0);
      setLeadsGenerated(0);
      setCpl(0);
      setRoas(0);
      setStartDate("");
      setEndDate("");
      setTargetAudience("");
      setCampaignUrl("");
    }
  }, [campaign, clients]);

  // Recálculo automático do CPL sugerido quando valor gasto e leads mudam
  const handleSpentChange = (spent: number) => {
    setSpentAmount(spent);
    if (leadsGenerated > 0) {
      setCpl(parseFloat((spent / leadsGenerated).toFixed(2)));
    }
  };

  const handleLeadsChange = (leads: number) => {
    setLeadsGenerated(leads);
    if (leads > 0 && spentAmount > 0) {
      setCpl(parseFloat((spentAmount / leads).toFixed(2)));
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome da campanha é obrigatório.");
      return;
    }
    if (!clientId) {
      toast.error("Selecione o cliente de marketing.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        marketingClientId: clientId,
        platform,
        status,
        objective,
        budgetDaily: Number(budgetDaily) || 0,
        budgetTotal: Number(budgetTotal) || 0,
        spentAmount: Number(spentAmount) || 0,
        leadsGenerated: Number(leadsGenerated) || 0,
        cpl: Number(cpl) || 0,
        roas: Number(roas) || 0,
        startDate: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T23:59:59`).toISOString() : undefined,
        targetAudience: targetAudience.trim() || undefined,
        campaignUrl: campaignUrl.trim() || undefined,
      };

      if (isEditing && campaign) {
        await api.patch(`/agency/marketing/campaigns/${campaign.id}`, payload);
        toast.success("Campanha de tráfego atualizada!");
      } else {
        await api.post("/agency/marketing/campaigns", payload);
        toast.success("Campanha de tráfego criada!");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[SAVE_CAMPAIGN_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar campanha.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign?.id) return;
    if (!window.confirm("Tem certeza que deseja excluir esta campanha de tráfego pago?")) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/agency/marketing/campaigns/${campaign.id}`);
      toast.success("Campanha removida com sucesso!");
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[DELETE_CAMPAIGN_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao remover campanha.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0B1224] border border-slate-700 rounded-3xl shadow-2xl p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? "Editar Campanha de Tráfego" : "Nova Campanha de Tráfego Pago"}
              </h3>
              <p className="text-xs text-slate-400">Meta Ads, Google Ads e métricas de conversão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Nome da Campanha */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nome da Campanha *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: [META] - Captação de Leads Imobiliários - Q4"
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Cliente e Plataforma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Cliente *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white outline-none focus:border-cyan-500"
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Plataforma de Anúncios</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white outline-none focus:border-cyan-500 font-medium"
              >
                <option value="META_ADS">Meta Ads (Instagram / Facebook)</option>
                <option value="GOOGLE_ADS">Google Ads (Search / Display)</option>
                <option value="TIKTOK_ADS">TikTok Ads</option>
                <option value="LINKEDIN_ADS">LinkedIn Ads</option>
              </select>
            </div>
          </div>

          {/* Objetivo e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Objetivo da Campanha</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white outline-none focus:border-cyan-500"
              >
                <option value="LEADS">Geração de Leads (Cadastro / WhatsApp)</option>
                <option value="VENDAS">Conversões e Vendas</option>
                <option value="TRAFEGO">Tráfego para Landing Page</option>
                <option value="RECONHECIMENTO">Alcance e Reconhecimento</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Status da Veiculação</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white outline-none focus:border-cyan-500"
              >
                <option value="ACTIVE">Ativa / Em Veiculação</option>
                <option value="PAUSED">Pausada</option>
                <option value="DRAFT">Rascunho / Em Criação</option>
                <option value="ENDED">Encerrada</option>
              </select>
            </div>
          </div>

          {/* Orçamentos: Diário e Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Orçamento Diário (R$)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={budgetDaily}
                onChange={(e) => setBudgetDaily(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 50.00"
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                <span>Orçamento Total Previsto (R$)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 1500.00"
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Métricas Reais: Gasto, Leads, CPL e ROAS */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Resultados & Performance da Campanha</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Investido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={spentAmount}
                  onChange={(e) => handleSpentChange(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Leads Gerados</label>
                <input
                  type="number"
                  value={leadsGenerated}
                  onChange={(e) => handleLeadsChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">CPL Médio (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cpl}
                  onChange={(e) => setCpl(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">ROAS (Retorno)</label>
                <input
                  type="number"
                  step="0.01"
                  value={roas}
                  onChange={(e) => setRoas(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Vigência e Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Data Início</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Data Término</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          {/* Rodapé com Botões de Ação */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Excluir Campanha</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isEditing ? "Salvar Campanha" : "Lançar Campanha"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
