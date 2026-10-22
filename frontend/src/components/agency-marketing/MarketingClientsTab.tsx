"use client";

import React, { useState, useMemo } from "react";
import {
  Building,
  Plus,
  Edit2,
  History,
  User,
  Phone,
  Mail,
  Video,
  Layers,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  FileText,
  ArrowRight,
  FolderArchive,
} from "lucide-react";
import { MarketingClientItem, TeamMember } from "./types";

interface Props {
  clients: MarketingClientItem[];
  teamMembers: TeamMember[];
  onOpenClientModal: (client?: MarketingClientItem) => void;
  onOpenHistoryModal: (client: MarketingClientItem) => void;
  onSelectClient: (client: MarketingClientItem) => void;
  onOpenDriveSync?: () => void;
}

export default function MarketingClientsTab({
  clients,
  teamMembers,
  onOpenClientModal,
  onOpenHistoryModal,
  onSelectClient,
  onOpenDriveSync,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");

  // Filtro de clientes
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const del = client.monthlyDeliverables || {};

      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(q);
        const matchesCorporate = (del.corporateName || "").toLowerCase().includes(q);
        const matchesCnpj = (del.cnpj || "").toLowerCase().includes(q);
        const matchesSegment = (del.segment || "").toLowerCase().includes(q);
        const matchesCity = (del.city || "").toLowerCase().includes(q);
        const matchesContact = (client.contactName || "").toLowerCase().includes(q);

        if (!matchesName && !matchesCorporate && !matchesCnpj && !matchesSegment && !matchesCity && !matchesContact) {
          return false;
        }
      }

      // Filtro de status
      if (statusFilter !== "ALL") {
        if (client.status !== statusFilter) return false;
      }

      // Filtro de responsável
      if (userFilter !== "ALL") {
        if (client.assignedUserId !== userFilter) return false;
      }

      return true;
    });
  }, [clients, searchQuery, statusFilter, userFilter]);

  return (
    <div className="space-y-4">
      
      {/* 1. Barra de Ações & Busca Rápida de Clientes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Campo de Busca em Tempo Real */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por marca, CNPJ, segmento, cidade ou contato..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filtros e Botão Novo Cliente */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="FECHADO">Fechado</option>
            <option value="PAUSED">Pausado</option>
            <option value="CHURNED">Cancelado</option>
          </select>

          {/* Filtro por Responsável */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">Toda a Equipe</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Botão Sincronizar Google Drive */}
          {onOpenDriveSync && (
            <button
              onClick={onOpenDriveSync}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border border-cyan-800/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
              title="Monitorar pastas e criar clientes automaticamente do Google Drive"
            >
              <FolderArchive className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Sincronizar Drive</span>
            </button>
          )}

          {/* Botão Novo Cliente (Zero Degradê, Padrão Corporativo) */}
          <button
            onClick={() => onOpenClientModal()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* 2. Grade de Clientes Padronizada */}
      {filteredClients.length === 0 ? (
        <div className="p-16 text-center text-slate-400 border border-slate-800 rounded-3xl bg-white dark:bg-[#0B1224]/50 flex flex-col items-center justify-center gap-3">
          <Building className="w-10 h-10 text-slate-600" strokeWidth={1.5} />
          <div className="max-w-sm">
            <h4 className="text-sm font-bold text-white mb-1">Nenhum cliente encontrado</h4>
            <p className="text-xs text-slate-500">
              {searchQuery || statusFilter !== "ALL" || userFilter !== "ALL"
                ? "Tente alterar os termos da busca para encontrar o cliente desejado."
                : "Cadastre o primeiro cliente da agência para estruturar o escopo e o Kanban."}
            </p>
          </div>
          {searchQuery || statusFilter !== "ALL" || userFilter !== "ALL" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setUserFilter("ALL");
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold"
            >
              Limpar Filtros
            </button>
          ) : (
            <button
              onClick={() => onOpenClientModal()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold"
            >
              Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const del = client.monthlyDeliverables || {};
            const assigned = teamMembers.find((m) => m.id === client.assignedUserId);
            const postsProgress = client.metrics?.postsProgress || { delivered: 0, target: del.posts ?? 12 };
            const reelsProgress = client.metrics?.reelsProgress || { delivered: 0, target: del.reels ?? 4 };

            const postsPercent = postsProgress.target > 0
              ? Math.min(100, Math.round((postsProgress.delivered / postsProgress.target) * 100))
              : 0;

            const reelsPercent = reelsProgress.target > 0
              ? Math.min(100, Math.round((reelsProgress.delivered / reelsProgress.target) * 100))
              : 0;

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-all shadow-md flex flex-col justify-between gap-4 group cursor-pointer"
              >
                {/* Topo do Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar / Ícone Monocromático Padronizado */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm border border-slate-700"
                        style={{ backgroundColor: client.brandColor || "#1E293B" }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {client.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {del.segment || "Segmento Geral"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Badge */}
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          client.status === "ACTIVE"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                            : client.status === "FECHADO"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                            : client.status === "PAUSED"
                            ? "bg-amber-950/40 text-amber-400 border-amber-800/60"
                            : "bg-rose-950/40 text-rose-400 border-rose-800/60"
                        }`}
                      >
                        {client.status === "ACTIVE"
                          ? "Ativo"
                          : client.status === "FECHADO"
                          ? "Fechado"
                          : client.status === "PAUSED"
                          ? "Pausado"
                          : "Cancelado"}
                      </span>

                      {/* Botão de Edição Rápida */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenClientModal(client);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar cadastro"
                      >
                        <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* Informações de Localização e CNPJ */}
                  {(del.city || del.cnpj) && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-slate-400">
                      {del.city && (
                        <span className="flex items-center gap-1 text-slate-400 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" strokeWidth={1.75} />
                          <span>{del.city}{del.state ? ` - ${del.state}` : ""}</span>
                        </span>
                      )}

                      {del.cnpj && (
                        <span className="font-mono text-slate-500 text-[10px]">
                          CNPJ: {del.cnpj}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Barras de Progresso de Entregas do Mês (Sem Degradê, Cores Sólidas) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                      <span>SLA / Entregas do Mês</span>
                      <span className="text-slate-500 font-mono lowercase">plano: {client.planTier || "Standard"}</span>
                    </div>

                    {/* Posts Feed */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-400" strokeWidth={1.75} />
                          <span>Posts / Carrosséis</span>
                        </span>
                        <span className="font-mono text-white font-bold">
                          {postsProgress.delivered}/{postsProgress.target}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full transition-all"
                          style={{ width: `${postsPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Reels */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Video className="w-3 h-3 text-blue-400" strokeWidth={1.75} />
                          <span>Reels / Vídeos</span>
                        </span>
                        <span className="font-mono text-white font-bold">
                          {reelsProgress.delivered}/{reelsProgress.target}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${reelsPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Responsável e Verba */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Responsável</span>
                      <span className="text-[11px] text-slate-200 truncate block font-medium">
                        {assigned?.name || "Não atribuído"}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Verba Anúncios</span>
                      <span className="font-mono font-bold text-emerald-400 text-[11px]">
                        R$ {Number(client.adBudget || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé: Acesso ao Projeto do Cliente */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    <strong className="text-white">{client.metrics?.totalCards || 0}</strong> peças no total
                  </span>

                  <span className="text-cyan-400 group-hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors">
                    <span>Ver Projeto</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
