"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  KanbanSquare as LayoutKanban,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

import {
  MarketingCardItem,
  MarketingClientItem,
  TimeClockStatus,
  TeamMember,
} from "@/components/agency-marketing/types";

import { useMarketingAuth } from "@/components/agency-marketing/useMarketingAuth";
import MarketingTimeClockWidget from "@/components/agency-marketing/MarketingTimeClockWidget";
import MarketingKanban from "@/components/agency-marketing/MarketingKanban";
import MarketingCardModal from "@/components/agency-marketing/MarketingCardModal";
import MarketingClientModal from "@/components/agency-marketing/MarketingClientModal";
import MarketingClientHistoryModal from "@/components/agency-marketing/MarketingClientHistoryModal";
import MarketingAuditModal from "@/components/agency-marketing/MarketingAuditModal";

export default function AgencyMarketingPage() {
  const router = useRouter();
  const { currentUser, authChecked, isAuthorized } = useMarketingAuth();

  // Estados de dados do Kanban
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cards, setCards] = useState<MarketingCardItem[]>([]);
  const [clients, setClients] = useState<MarketingClientItem[]>([]);
  const [timeStatus, setTimeStatus] = useState<TimeClockStatus | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Estados dos Modais
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MarketingCardItem | null>(null);
  const [defaultCardStatus, setDefaultCardStatus] = useState<MarketingCardItem["status"]>("BACKLOG");

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<MarketingClientItem | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<MarketingClientItem | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Carregamento dos dados
  const loadModuleData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [cardsRes, clientsRes, timeRes, teamRes] = await Promise.all([
        api.get("/agency/marketing/cards"),
        api.get("/agency/marketing/clients"),
        api.get("/agency/marketing/time-clock/today"),
        api.get("/agency/marketing/team"),
      ]);

      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setTimeStatus(timeRes.data || null);
      setTeamMembers(Array.isArray(teamRes.data) ? teamRes.data : []);
    } catch (err: any) {
      console.error("[LOAD_MARKETING_ERROR]", err);
      if (err.response?.status === 403) {
        toast.error("Acesso negado às rotas da agência.");
        router.replace("/dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadModuleData();
    }
  }, [isAuthorized, loadModuleData]);

  // Manipulação de cards no Kanban com atualização otimista imediata
  const handleCardMoved = async (
    cardId: string,
    newStatus: MarketingCardItem["status"],
    newPosition: number
  ) => {
    const cardIndex = cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const updatedCards = [...cards];
    const movedCard = { ...updatedCards[cardIndex], status: newStatus, position: newPosition };
    updatedCards[cardIndex] = movedCard;

    // Atualização otimista
    setCards(updatedCards);

    try {
      await api.patch(`/agency/marketing/cards/${cardId}`, {
        status: newStatus,
        position: newPosition,
      });
    } catch (err: any) {
      console.error("[MOVE_CARD_ERROR]", err);
      toast.error("Erro ao sincronizar movimento da peça.");
      loadModuleData(true);
    }
  };

  // Handlers para abertura dos modais
  const handleOpenCardModal = (card?: MarketingCardItem, defaultStatus?: MarketingCardItem["status"]) => {
    if (clients.length === 0) {
      toast.error("Cadastre ao menos um cliente antes de criar demandas.");
      setIsClientModalOpen(true);
      return;
    }
    setEditingCard(card || null);
    setDefaultCardStatus(defaultStatus || "BACKLOG");
    setIsCardModalOpen(true);
  };

  const handleOpenClientModal = (client?: MarketingClientItem) => {
    setEditingClient(client || null);
    setIsClientModalOpen(true);
  };

  const handleOpenHistoryModal = (client: MarketingClientItem) => {
    setHistoryClient(client);
    setIsHistoryModalOpen(true);
  };

  // Se ainda estiver validando o acesso
  if (!authChecked || !isAuthorized) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" strokeWidth={1.75} />
        <span className="text-xs text-slate-400 font-medium">Validando credenciais da agência...</span>
      </div>
    );
  }

  // Métricas operacionais de produção (100% livres de valores em dinheiro)
  const completedCount = cards.filter((c) => c.status === "AGENDADO_POSTADO").length;
  const inProductionCount = cards.filter((c) => c.status !== "AGENDADO_POSTADO").length;

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto gap-5 pb-10 animate-in fade-in duration-200">
      
      {/* 1. Header Executivo do Kanban de Produção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <LayoutKanban className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-cyan-400 shrink-0" strokeWidth={1.75} />
                <span>Kanban de Produção</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-cyan-500/15 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30">
                Operacional
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Fluxo contínuo de criação, revisão técnica, aprovação de clientes e agendamento.
            </p>
          </div>

          <button
            onClick={() => loadModuleData(true)}
            disabled={refreshing}
            className="md:hidden p-2 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            title="Sincronizar esteira"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600 dark:text-cyan-400" : ""}`} strokeWidth={1.75} />
          </button>
        </div>

        {/* Resumo Operacional e Botão de Sincronização no Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white dark:bg-[#0B1224]/80 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">No Fluxo</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{cards.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Em Produção</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400 font-mono">{inProductionCount}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Concluídas</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{completedCount}</span>
            </div>
          </div>

          <button
            onClick={() => loadModuleData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Sincronizar esteira"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600 dark:text-cyan-400" : ""}`} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* 2. Widget de Ponto Eletrônico & Auditoria de Sessão */}
      <MarketingTimeClockWidget
        timeStatus={timeStatus}
        onRefresh={() => loadModuleData(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
      />

      {/* 3. Esteira Kanban de Produção */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" strokeWidth={1.75} />
          <span className="text-xs">Carregando esteira de produção...</span>
        </div>
      ) : (
        <MarketingKanban
          cards={cards}
          clients={clients}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onOpenCardModal={handleOpenCardModal}
          onCardMoved={handleCardMoved}
          onRefresh={() => loadModuleData(true)}
        />
      )}

      {/* 4. Modais do Fluxo */}
      <MarketingCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={editingCard}
        defaultStatus={defaultCardStatus}
        clients={clients}
        teamMembers={teamMembers}
        onSaved={() => loadModuleData(true)}
        onOpenClientHistory={handleOpenHistoryModal}
      />

      <MarketingClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={editingClient}
        teamMembers={teamMembers}
        onSaved={() => loadModuleData(true)}
      />

      <MarketingClientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        client={historyClient}
        onSelectCard={(c) => {
          setEditingCard(c);
          setIsCardModalOpen(true);
        }}
      />

      <MarketingAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        timeStatus={timeStatus}
      />
    </div>
  );
}
