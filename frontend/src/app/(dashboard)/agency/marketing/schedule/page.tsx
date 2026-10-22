"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

import {
  MarketingCardItem,
  MarketingClientItem,
  TeamMember,
} from "@/components/agency-marketing/types";

import { useMarketingAuth } from "@/components/agency-marketing/useMarketingAuth";
import MarketingScheduleTab from "@/components/agency-marketing/MarketingScheduleTab";
import MarketingCardModal from "@/components/agency-marketing/MarketingCardModal";

export default function MarketingSchedulePage() {
  const router = useRouter();
  const { authChecked, isAuthorized } = useMarketingAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cards, setCards] = useState<MarketingCardItem[]>([]);
  const [clients, setClients] = useState<MarketingClientItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MarketingCardItem | null>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [cardsRes, clientsRes, teamRes] = await Promise.all([
        api.get("/agency/marketing/cards"),
        api.get("/agency/marketing/clients"),
        api.get("/agency/marketing/team"),
      ]);

      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setTeamMembers(Array.isArray(teamRes.data) ? teamRes.data : []);
    } catch (err: any) {
      console.error("[LOAD_SCHEDULE_ERROR]", err);
      if (err.response?.status === 403) {
        toast.error("Acesso negado.");
        router.replace("/dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized, loadData]);

  const handleOpenCardModal = (card?: MarketingCardItem) => {
    setSelectedCard(card || null);
    setIsCardModalOpen(true);
  };

  if (!authChecked || !isAuthorized) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" strokeWidth={1.75} />
        <span className="text-xs text-slate-400 font-medium">Validando credenciais da agência...</span>
      </div>
    );
  }

  const scheduledCount = cards.filter((c) => Boolean(c.publishDate || c.dueDate)).length;

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto gap-5 pb-10 animate-in fade-in duration-200">
      {/* Header Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-cyan-400" strokeWidth={1.75} />
              <span>Cronograma de Publicações</span>
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
              Calendário
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Planejamento temporal das datas de postagem, gravação e entrega por marca e operador.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Com Data Marcada</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400 font-mono">{scheduledCount}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total de Peças</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{cards.length}</span>
            </div>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            title="Atualizar cronograma"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600 dark:text-cyan-400" : ""}`} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Calendário */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" strokeWidth={1.75} />
          <span className="text-xs">Carregando calendário de peças...</span>
        </div>
      ) : (
        <MarketingScheduleTab
          cards={cards}
          clients={clients}
          teamMembers={teamMembers}
          onOpenCardModal={handleOpenCardModal}
        />
      )}

      {/* Modal de Detalhes da Peça */}
      <MarketingCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={selectedCard}
        defaultStatus="BACKLOG"
        clients={clients}
        teamMembers={teamMembers}
        onSaved={() => loadData(true)}
      />
    </div>
  );
}
