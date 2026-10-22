"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Plus,
  Loader2,
  RefreshCw,
  Building,
  FolderArchive,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

import {
  MarketingClientItem,
  MarketingCardItem,
  TeamMember,
} from "@/components/agency-marketing/types";

import { useMarketingAuth } from "@/components/agency-marketing/useMarketingAuth";
import MarketingClientsTab from "@/components/agency-marketing/MarketingClientsTab";
import MarketingClientDetailView from "@/components/agency-marketing/MarketingClientDetailView";
import MarketingClientModal from "@/components/agency-marketing/MarketingClientModal";
import MarketingClientHistoryModal from "@/components/agency-marketing/MarketingClientHistoryModal";
import MarketingCardModal from "@/components/agency-marketing/MarketingCardModal";
import MarketingDriveSyncModal from "@/components/agency-marketing/MarketingDriveSyncModal";

export default function MarketingClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authChecked, isAuthorized } = useMarketingAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [clients, setClients] = useState<MarketingClientItem[]>([]);
  const [cards, setCards] = useState<MarketingCardItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Cliente selecionado para a visão "PROJETO DO CLIENTE"
  const [selectedClient, setSelectedClient] = useState<MarketingClientItem | null>(null);

  // Modais
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<MarketingClientItem | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<MarketingClientItem | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MarketingCardItem | null>(null);
  const [defaultCardClientId, setDefaultCardClientId] = useState<string | undefined>(undefined);
  const [isDriveSyncOpen, setIsDriveSyncOpen] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [clientsRes, cardsRes, teamRes] = await Promise.all([
        api.get("/agency/marketing/clients"),
        api.get("/agency/marketing/cards"),
        api.get("/agency/marketing/team"),
      ]);

      const clientList: MarketingClientItem[] = Array.isArray(clientsRes.data) ? clientsRes.data : [];
      setClients(clientList);
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
      setTeamMembers(Array.isArray(teamRes.data) ? teamRes.data : []);

      // Se houver um cliente atualmente selecionado, atualiza ele com os dados mais recentes
      setSelectedClient((prev) => {
        if (!prev) return null;
        const updated = clientList.find((c) => c.id === prev.id);
        return updated || prev;
      });
    } catch (err: any) {
      console.error("[LOAD_CLIENTS_ERROR]", err);
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

  // Se a rota contiver ?id=... auto-seleciona o cliente
  useEffect(() => {
    const clientIdParam = searchParams.get("id") || searchParams.get("clientId");
    if (clientIdParam && clients.length > 0 && !selectedClient) {
      const found = clients.find((c) => c.id === clientIdParam);
      if (found) setSelectedClient(found);
    }
  }, [searchParams, clients, selectedClient]);

  const handleOpenClientModal = (client?: MarketingClientItem) => {
    setEditingClient(client || null);
    setIsClientModalOpen(true);
  };

  const handleOpenHistoryModal = (client: MarketingClientItem) => {
    setHistoryClient(client);
    setIsHistoryModalOpen(true);
  };

  const handleOpenCardModal = (card?: MarketingCardItem, defaultClientId?: string) => {
    setSelectedCard(card || null);
    setDefaultCardClientId(defaultClientId);
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

  const activeClientsCount = clients.filter((c) => c.status === "ACTIVE" || c.status === "FECHADO").length;

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto gap-5 pb-10 animate-in fade-in duration-200">
      
      {/* Se houver um cliente selecionado, exibe a visualização PROJETO DO CLIENTE (Conforme o Print!) */}
      {selectedClient ? (
        <MarketingClientDetailView
          client={selectedClient}
          cards={cards}
          teamMembers={teamMembers}
          onBack={() => setSelectedClient(null)}
          onEditClient={handleOpenClientModal}
          onOpenCardModal={handleOpenCardModal}
          onRefresh={() => loadData(true)}
        />
      ) : (
        <>
          {/* Header Executivo da Listagem de Clientes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-blue-600 dark:text-cyan-400" strokeWidth={1.75} />
                  <span>Clientes & Escopos</span>
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
                  {clients.length} {clients.length === 1 ? "Marca" : "Marcas"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gestão corporativa de marcas, contratos, SLAs de entrega, briefing e histórico de atendimento.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Contas Ativas</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{activeClientsCount}</span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total de Clientes</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{clients.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDriveSyncOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Monitorar pastas e criar clientes automaticamente do Google Drive"
                >
                  <FolderArchive className="w-4 h-4" strokeWidth={1.75} />
                  <span>Sincronizar Google Drive</span>
                </button>

                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600 dark:text-cyan-400" : ""}`} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal com Busca e Cards */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" strokeWidth={1.75} />
              <span className="text-xs">Carregando carteira de clientes...</span>
            </div>
          ) : (
            <MarketingClientsTab
              clients={clients}
              teamMembers={teamMembers}
              onOpenClientModal={handleOpenClientModal}
              onOpenHistoryModal={handleOpenHistoryModal}
              onSelectClient={(c) => setSelectedClient(c)}
              onOpenDriveSync={() => setIsDriveSyncOpen(true)}
            />
          )}
        </>
      )}

      {/* Modais Compartilhados */}
      <MarketingClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={editingClient}
        teamMembers={teamMembers}
        onSaved={() => loadData(true)}
      />

      <MarketingClientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        client={historyClient}
        onSelectCard={(c) => {
          setSelectedCard(c);
          setIsCardModalOpen(true);
        }}
      />

      <MarketingCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={selectedCard}
        defaultStatus="BACKLOG"
        clients={clients}
        teamMembers={teamMembers}
        onSaved={() => loadData(true)}
      />

      {/* Modal de Monitoramento & Sincronização do Google Drive (5 TB) */}
      <MarketingDriveSyncModal
        isOpen={isDriveSyncOpen}
        onClose={() => setIsDriveSyncOpen(false)}
        onSyncCompleted={() => loadData(true)}
      />
    </div>
  );
}
