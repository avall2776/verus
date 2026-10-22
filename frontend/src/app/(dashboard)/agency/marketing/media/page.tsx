"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderArchive,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  Layers,
  Flame,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building,
  User,
  LayoutGrid,
  List,
  FileText,
  Calendar,
  Plus,
  Play,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

import {
  MarketingCardItem,
  MarketingClientItem,
  TeamMember,
} from "@/components/agency-marketing/types";

import { useMarketingAuth } from "@/components/agency-marketing/useMarketingAuth";
import MarketingCardModal from "@/components/agency-marketing/MarketingCardModal";
import MarketingMediaApprovalModal from "@/components/agency-marketing/MarketingMediaApprovalModal";
import MarketingDriveImportModal from "@/components/agency-marketing/MarketingDriveImportModal";
import MarketingDriveSyncModal from "@/components/agency-marketing/MarketingDriveSyncModal";
import {
  extractGoogleDriveId,
  getDriveThumbnailUrl,
  detectMediaType,
  isGoogleDriveUrl,
} from "@/lib/googleDriveHelper";

export default function MarketingMediaPage() {
  const router = useRouter();
  const { authChecked, isAuthorized } = useMarketingAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cards, setCards] = useState<MarketingCardItem[]>([]);
  const [clients, setClients] = useState<MarketingClientItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modais
  const [isDriveSyncOpen, setIsDriveSyncOpen] = useState(false);
  const [isDriveImportOpen, setIsDriveImportOpen] = useState(false);
  const [approvalModalCard, setApprovalModalCard] = useState<MarketingCardItem | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MarketingCardItem | null>(null);

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
      console.error("[LOAD_MEDIA_ERROR]", err);
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

  // Filtragem dos cards/ativos
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(q);
        const matchesClient = card.marketingClient?.name.toLowerCase().includes(q);
        const matchesDesc = (card.description || "").toLowerCase().includes(q);
        const matchesAttachment = (card.attachments || []).some((att) =>
          att.name.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesClient && !matchesDesc && !matchesAttachment) {
          return false;
        }
      }

      // Filtro de cliente
      if (selectedClient !== "ALL" && card.marketingClientId !== selectedClient) {
        return false;
      }

      // Filtro de formato
      if (selectedFormat !== "ALL" && card.format !== selectedFormat) {
        return false;
      }

      // Filtro de status de aprovação
      if (selectedStatus !== "ALL") {
        if (selectedStatus === "APROVADO" && card.status !== "AGENDADO_POSTADO") return false;
        if (selectedStatus === "EM_APROVACAO" && card.status !== "APROVACAO_CLIENTE") return false;
        if (selectedStatus === "EM_REVISAO" && card.status !== "REVISAO_INTERNA") return false;
        if (selectedStatus === "EM_PRODUCAO" && card.status !== "DESIGN_VIDEO") return false;
        if (selectedStatus === "PLANEJAMENTO" && (card.status !== "BACKLOG" && card.status !== "PLANEJAMENTO")) return false;
      }

      return true;
    });
  }, [cards, searchQuery, selectedClient, selectedFormat, selectedStatus]);

  const handleOpenApproval = (card: MarketingCardItem) => {
    setApprovalModalCard(card);
  };

  const getFormatBadge = (format: string) => {
    switch (format) {
      case "REELS":
        return {
          icon: <Video className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />,
          label: "Reels / Vídeo",
          bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
        };
      case "CARROSSEL":
        return {
          icon: <Layers className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.75} />,
          label: "Carrossel",
          bg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
        };
      case "POST":
        return {
          icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />,
          label: "Post Feed",
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
        };
      case "CAMPANHA":
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.75} />,
          label: "Campanha",
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />,
          label: format || "Peça",
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AGENDADO_POSTADO":
        return {
          label: "Aprovado / Postado",
          color: "bg-emerald-950/40 text-emerald-400 border-emerald-800/60",
        };
      case "APROVACAO_CLIENTE":
        return {
          label: "Aprovação do Cliente",
          color: "bg-amber-950/40 text-amber-400 border-amber-800/60",
        };
      case "REVISAO_INTERNA":
        return {
          label: "Revisão Interna",
          color: "bg-purple-950/40 text-purple-400 border-purple-800/60",
        };
      case "DESIGN_VIDEO":
        return {
          label: "Design & Vídeo",
          color: "bg-cyan-950/40 text-cyan-400 border-cyan-800/60",
        };
      case "PLANEJAMENTO":
        return {
          label: "Planejamento / Copy",
          color: "bg-blue-950/40 text-blue-400 border-blue-800/60",
        };
      default:
        return {
          label: "Backlog",
          color: "bg-slate-800 text-slate-400 border-slate-700",
        };
    }
  };

  if (!authChecked || !isAuthorized) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" strokeWidth={1.75} />
        <span className="text-xs text-slate-400 font-medium">Validando credenciais da agência...</span>
      </div>
    );
  }

  const totalAttachments = cards.reduce(
    (acc, c) => acc + (c.attachments?.length || 0),
    0
  );
  const approvedCount = cards.filter((c) => c.status === "AGENDADO_POSTADO").length;

  // Link da pasta do cliente selecionado no Drive se houver
  const currentClientObj = clients.find((c) => c.id === selectedClient);
  const clientDriveFolder = currentClientObj?.monthlyDeliverables?.materialsUrl;

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto gap-5 pb-10 animate-in fade-in duration-200">
      
      {/* 1. Header Executivo com Suporte ao Google Drive 5TB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-blue-600 dark:text-cyan-400" strokeWidth={1.75} />
              <span>Biblioteca de Mídia & Ativos</span>
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
              Google Drive (5 TB)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Os arquivos pesados permanecem armazenados no seu Google Drive, com miniaturas e reprodutor de vídeo integrados no sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Sincronização Automática de Pastas (Monitoramento) - Azul Sólido Corporativo */}
          <button
            onClick={() => setIsDriveSyncOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <FolderArchive className="w-4 h-4" strokeWidth={1.75} />
            <span>Sincronizar Pastas do Drive</span>
          </button>

          {/* Botão Vincular Mídia do Google Drive */}
          <button
            onClick={() => setIsDriveImportOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-cyan-400 dark:hover:text-white border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>+ Adicionar Manual</span>
          </button>

          {/* Atalho de Pasta no Google Drive */}
          {clientDriveFolder ? (
            <a
              href={clientDriveFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Abrir Pasta do Cliente no Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Pasta do Cliente</span>
            </a>
          ) : (
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-300 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Abrir Google Drive 5TB"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Google Drive</span>
            </a>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            title="Atualizar biblioteca"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600 dark:text-cyan-400" : ""}`} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* 2. Barra de Busca e Filtros Dedicados */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, cliente, anexo ou texto..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-600 dark:focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Filtro por Cliente */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="p-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-600 dark:focus:border-cyan-500"
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filtro por Formato */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="p-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-600 dark:focus:border-cyan-500"
          >
            <option value="ALL">Todos os Formatos</option>
            <option value="REELS">Reels / Vídeo (9:16)</option>
            <option value="POST">Post Feed (1:1 / 4:5)</option>
            <option value="CARROSSEL">Carrossel Contínuo</option>
            <option value="CAMPANHA">Campanha de Tráfego</option>
            <option value="STORIES">Stories Interativos</option>
          </select>

          {/* Filtro por Status de Aprovação */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-600 dark:focus:border-cyan-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="APROVADO">Aprovado / Postado</option>
            <option value="EM_APROVACAO">Aprovação do Cliente</option>
            <option value="EM_REVISAO">Revisão Interna</option>
            <option value="EM_PRODUCAO">Design & Vídeo</option>
            <option value="PLANEJAMENTO">Planejamento / Copy</option>
          </select>

          {/* Alternador de Visualização */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#070D1B] p-1 rounded-xl border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white dark:bg-slate-800 dark:text-cyan-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white dark:bg-slate-800 dark:text-cyan-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
              title="Visualização em Lista"
            >
              <List className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

        </div>
      </div>

      {/* 3. Conteúdo da Galeria */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" strokeWidth={1.75} />
          <span className="text-xs">Carregando galeria de mídia...</span>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-16 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-[#0B1224]/50 flex flex-col items-center justify-center gap-3">
          <FolderArchive className="w-12 h-12 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
          <div className="max-w-md">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Nenhum ativo ou peça encontrado</h4>
            <p className="text-xs text-slate-500">
              Vincule os arquivos do Google Drive dos seus clientes para assistir a vídeos e aprovar imagens diretamente no sistema.
            </p>
          </div>
          
          <button
            onClick={() => setIsDriveImportOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Vincular Primeira Mídia do Google Drive</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Modo Grade de Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
            const formatBadge = getFormatBadge(card.format);
            const statusBadge = getStatusBadge(card.status);
            const attachmentsCount = card.attachments?.length || 0;
            const primaryAttachment = card.attachments?.[0];
            const mediaUrl = primaryAttachment?.url || card.description;
            const driveThumbnail = getDriveThumbnailUrl(mediaUrl, 800);
            const isVideo = detectMediaType(primaryAttachment?.name || card.title, card.format) === "video";

            return (
              <div
                key={card.id}
                onClick={() => handleOpenApproval(card)}
                className="group rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-cyan-500/40 transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Visual Header / Thumbnail Direta do Google Drive */}
                <div className="h-44 w-full relative bg-slate-50 dark:bg-[#070D1B] flex items-center justify-center border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                  {driveThumbnail ? (
                    <img
                      src={driveThumbnail}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-slate-50 dark:bg-[#070D1B]">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                        {formatBadge.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[80%]">
                        {formatBadge.label}
                      </span>
                    </div>
                  )}

                  {/* Ícone de Play centralizado se for Vídeo */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-cyan-400 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-cyan-400 ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Formato Badge Flutuante */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#050814]/90 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                    {formatBadge.icon}
                    <span>{formatBadge.label}</span>
                  </div>

                  {/* Status de Aprovação Flutuante */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Overlay no Hover para Inspeção e Aprovação */}
                  <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#050814]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{isVideo ? "Assistir e Avaliar" : "Inspecionar e Aprovar"}</span>
                    </span>
                  </div>
                </div>

                {/* Corpo do Card de Mídia */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    {/* Linha do Cliente */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: card.marketingClient?.brandColor || "#00D2FF",
                        }}
                      />
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {card.marketingClient?.name || "Cliente"}
                      </span>
                    </div>

                    {/* Título da Peça */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                      {card.title}
                    </h4>

                    {/* Resumo do Copy / Descrição se houver */}
                    {card.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    )}
                  </div>

                  {/* Rodapé com Data de Postagem e Anexos */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
                      <span>
                        {card.publishDate
                          ? new Date(card.publishDate).toLocaleDateString("pt-BR")
                          : card.dueDate
                          ? new Date(card.dueDate).toLocaleDateString("pt-BR")
                          : "Sem data"}
                      </span>
                    </span>

                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      <FileText className="w-3 h-3 text-blue-600 dark:text-cyan-400" strokeWidth={1.75} />
                      <span>
                        {attachmentsCount} {attachmentsCount === 1 ? "arquivo" : "arquivos"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Modo Lista Compacta */
        <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredCards.map((card) => {
            const formatBadge = getFormatBadge(card.format);
            const statusBadge = getStatusBadge(card.status);
            const attachmentsCount = card.attachments?.length || 0;

            return (
              <div
                key={card.id}
                onClick={() => handleOpenApproval(card)}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {formatBadge.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: card.marketingClient?.brandColor || "#00D2FF",
                        }}
                      />
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {card.marketingClient?.name || "Cliente"}
                      </span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatBadge.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                      {card.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden md:inline">
                    {card.publishDate
                      ? new Date(card.publishDate).toLocaleDateString("pt-BR")
                      : card.dueDate
                      ? new Date(card.dueDate).toLocaleDateString("pt-BR")
                      : "Sem data"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenApproval(card);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Assistir / Inspecionar Peça"
                  >
                    <Eye className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal de Visualização, Player de Vídeo e Aprovação de Mídia */}
      <MarketingMediaApprovalModal
        isOpen={Boolean(approvalModalCard)}
        onClose={() => setApprovalModalCard(null)}
        card={approvalModalCard}
        onUpdated={() => loadData(true)}
      />

      {/* 5. Modal de Importação Rápida do Google Drive */}
      <MarketingDriveImportModal
        isOpen={isDriveImportOpen}
        onClose={() => setIsDriveImportOpen(false)}
        clients={clients}
        teamMembers={teamMembers}
        onImported={() => loadData(true)}
      />

      {/* 6. Modal de Edição Geral da Peça */}
      <MarketingCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={editingCard}
        defaultStatus="BACKLOG"
        clients={clients}
        teamMembers={teamMembers}
        onSaved={() => loadData(true)}
      />

      {/* 7. Modal de Monitoramento & Sincronização de Pastas do Google Drive */}
      <MarketingDriveSyncModal
        isOpen={isDriveSyncOpen}
        onClose={() => setIsDriveSyncOpen(false)}
        onSyncCompleted={() => loadData(true)}
      />
    </div>
  );
}
