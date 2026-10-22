"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Video,
  FileText,
  Sparkles,
  ExternalLink,
  Edit2,
  Plus,
  Save,
  MessageSquare,
  Clock,
  CheckCircle2,
  FolderArchive,
  Download,
  Send,
  Loader2,
  FileCheck,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  MarketingClientItem,
  MarketingCardItem,
  TeamMember,
} from "./types";

interface Props {
  client: MarketingClientItem;
  cards: MarketingCardItem[];
  teamMembers: TeamMember[];
  onBack: () => void;
  onEditClient: (client: MarketingClientItem) => void;
  onOpenCardModal: (card?: MarketingCardItem, defaultClientId?: string) => void;
  onRefresh: () => void;
}

type TabType =
  | "resumo"
  | "cronograma"
  | "materiais"
  | "ia"
  | "conversa"
  | "contrato"
  | "historico";

export default function MarketingClientDetailView({
  client,
  cards,
  teamMembers,
  onBack,
  onEditClient,
  onOpenCardModal,
  onRefresh,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("resumo");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  // Estados locais para edição rápida de notas e IA
  const [notes, setNotes] = useState(client.monthlyDeliverables?.notes || "");
  const [aiGuidelines, setAiGuidelines] = useState(client.monthlyDeliverables?.aiGuidelines || "");
  const [newHistoryAction, setNewHistoryAction] = useState("");

  const del = client.monthlyDeliverables || {};
  const assigned = teamMembers.find((m) => m.id === client.assignedUserId);

  // Cards apenas deste cliente
  const clientCards = cards.filter((c) => c.marketingClientId === client.id);

  // Entregas e progresso
  const postsProgress = client.metrics?.postsProgress || {
    delivered: clientCards.filter((c) => (c.format === "POST" || c.format === "CARROSSEL") && c.status === "AGENDADO_POSTADO").length,
    target: del.posts ?? 12,
  };
  const reelsProgress = client.metrics?.reelsProgress || {
    delivered: clientCards.filter((c) => c.format === "REELS" && c.status === "AGENDADO_POSTADO").length,
    target: del.reels ?? 4,
  };

  // Histórico auditado
  const historyList = Array.isArray(del.history) ? del.history : [
    {
      id: "init",
      action: `Cadastrado: ${client.name}`,
      author: assigned?.name || "Operador",
      date: client.createdAt || new Date().toISOString(),
    },
  ];

  // Salvar Notas da Conversa / Alinhamentos
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/agency/marketing/clients/${client.id}`, {
        monthlyDeliverables: {
          ...del,
          notes,
        },
      });
      toast.success("Anotações de conversa salvas com sucesso!");
      onRefresh();
    } catch (err: any) {
      console.error("[SAVE_NOTES_ERROR]", err);
      toast.error("Erro ao salvar anotações.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Salvar Diretrizes de IA
  const handleSaveAi = async () => {
    setSavingAi(true);
    try {
      await api.patch(`/agency/marketing/clients/${client.id}`, {
        monthlyDeliverables: {
          ...del,
          aiGuidelines,
        },
      });
      toast.success("Diretrizes de IA salvas para este cliente!");
      onRefresh();
    } catch (err: any) {
      console.error("[SAVE_AI_ERROR]", err);
      toast.error("Erro ao salvar diretrizes de IA.");
    } finally {
      setSavingAi(false);
    }
  };

  // Registrar Evento Manual no Histórico
  const handleAddHistoryLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryAction.trim()) return;

    setSavingHistory(true);
    try {
      const newLog = {
        id: crypto.randomUUID(),
        action: newHistoryAction.trim(),
        author: assigned?.name || "Operador",
        date: new Date().toISOString(),
      };
      const updatedHistory = [newLog, ...historyList];

      await api.patch(`/agency/marketing/clients/${client.id}`, {
        monthlyDeliverables: {
          ...del,
          history: updatedHistory,
        },
      });

      toast.success("Evento registrado no histórico!");
      setNewHistoryAction("");
      onRefresh();
    } catch (err: any) {
      console.error("[ADD_HISTORY_ERROR]", err);
      toast.error("Erro ao registrar no histórico.");
    } finally {
      setSavingHistory(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // WhatsApp Link
  const waCleanPhone = (client.contactPhone || "").replace(/\D/g, "");
  const waLink = waCleanPhone ? `https://wa.me/55${waCleanPhone}` : undefined;

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto gap-5 pb-10 animate-in fade-in duration-200">
      
      {/* 1. Header do Projeto do Cliente (Conforme Modelo da Imagem) */}
      <div className="space-y-3 pb-3 border-b border-slate-800">
        
        {/* Linha Superior: Breadcrumb & Botão Voltar */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
            PROJETO DO CLIENTE
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditClient(client)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Editar Ficha</span>
            </button>

            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              <span>Clientes</span>
            </button>
          </div>
        </div>

        {/* Nome do Cliente & Subtítulo */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {client.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {del.segment || "Loja de defensivos agrícolas, adubos e fertilizantes"}
            {(del.city || del.state) && (
              <span> • {del.city || "Campo Belo do Sul"}{del.state ? ` - ${del.state}` : " - SC"}</span>
            )}
          </p>
        </div>

        {/* Badges de Atributos & Contato */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Status Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 font-semibold text-[11px]">
            {client.status === "ACTIVE"
              ? "Ativo"
              : client.status === "FECHADO"
              ? "Fechado"
              : client.status === "PAUSED"
              ? "Pausado"
              : client.status}
          </span>

          {/* Responsável da Agência */}
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5 font-medium text-[11px]">
            <User className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span>{assigned?.name || "Sem responsável"}</span>
          </span>

          {/* WhatsApp Action */}
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B1224] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 font-medium text-[11px] transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
              <span>WhatsApp</span>
            </a>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B1224] text-slate-500 border border-slate-800 flex items-center gap-1.5 text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>WhatsApp</span>
            </span>
          )}

          {/* Plano Badge */}
          <span className="text-[11px] text-slate-400 font-medium ml-1">
            Plano: <strong className="text-slate-200">{client.planTier || "Standard"}</strong>
          </span>
        </div>

        {/* 2. Abas de Navegação (Exatamente as do print!) */}
        <div className="flex items-center gap-6 border-b border-slate-800 pt-3 overflow-x-auto text-xs font-semibold custom-scrollbar">
          {(
            [
              { id: "resumo", label: "Resumo" },
              { id: "cronograma", label: "Cronograma" },
              { id: "materiais", label: "Materiais" },
              { id: "ia", label: "IA do cliente" },
              { id: "conversa", label: "Conversa" },
              { id: "contrato", label: "Contrato" },
              { id: "historico", label: "Histórico" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 whitespace-nowrap transition-all duration-150 relative ${
                activeTab === tab.id
                  ? "text-cyan-400 font-bold border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              {tab.id === "cronograma" && clientCards.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {clientCards.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Conteúdo Dinâmico da Aba Selecionada */}
      
      {/* ABA 1: RESUMO */}
      {activeTab === "resumo" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-150">
          
          {/* Coluna 1: Dados Cadastrais & Empresa */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Building className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
              <span>Ficha Cadastral Padrão</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Razão Social</span>
                <span className="text-white font-medium">{del.corporateName || client.name}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">CNPJ</span>
                <span className="text-white font-mono">{del.cnpj || "Não cadastrado"}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Segmento / Ramo</span>
                <span className="text-slate-300">{del.segment || "Não informado"}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Cidade e Estado</span>
                <span className="text-slate-300">
                  {del.city || "Não informada"} {del.state ? `- ${del.state}` : ""}
                </span>
              </div>

              {del.address && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Endereço</span>
                  <span className="text-slate-300">{del.address}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Contato Principal</span>
                <span className="text-white font-semibold">{client.contactName || "Não informado"}</span>
                {del.contactRole && <span className="text-[11px] text-slate-400 block">{del.contactRole}</span>}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">E-mail</span>
                <span className="text-slate-300 font-mono">{client.contactEmail || "Não informado"}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">WhatsApp / Telefone</span>
                <span className="text-slate-300 font-mono">{client.contactPhone || "Não informado"}</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Escopo Acordado & Metas Mensais */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Layers className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
              <span>Escopo & Entregas Mensais</span>
            </h3>

            {/* Metas de Entregas */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.75} />
                    <span>Posts & Carrosséis</span>
                  </span>
                  <span className="font-mono text-white font-bold">
                    {postsProgress.delivered}/{postsProgress.target}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((postsProgress.delivered / (postsProgress.target || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                    <span>Reels & Vídeos</span>
                  </span>
                  <span className="font-mono text-white font-bold">
                    {reelsProgress.delivered}/{reelsProgress.target}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((reelsProgress.delivered / (reelsProgress.target || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Stories</span>
                  <span className="font-bold text-white font-mono text-sm">{del.stories ?? 20} /mês</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Campanhas Ads</span>
                  <span className="font-bold text-white font-mono text-sm">{del.campaigns ?? 2} ativas</span>
                </div>
              </div>
            </div>

            {/* Valores e Verbas */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Verba de Anúncios:</span>
                <span className="font-mono font-bold text-emerald-400">
                  R$ {Number(client.adBudget || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {del.contractValue !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mensalidade (Fee):</span>
                  <span className="font-mono font-bold text-cyan-400">
                    R$ {Number(del.contractValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Briefing & Posicionamento */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <FileText className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
              <span>Briefing & Diretrizes da Marca</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Briefing do Negócio
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#070D1B] p-3 rounded-xl border border-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {del.briefing || "Nenhum briefing cadastrado. Clique em 'Editar Ficha' para adicionar a descrição do cliente."}
                </p>
              </div>

              {del.scope && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Escopo Específico de Trabalho
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#070D1B] p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                    {del.scope}
                  </p>
                </div>
              )}

              {del.brandGuidelines && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Tom de Voz & Diretrizes
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#070D1B] p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                    {del.brandGuidelines}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ABA 2: CRONOGRAMA */}
      {activeTab === "cronograma" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
                <span>Cronograma de Peças do Cliente</span>
              </h3>
              <p className="text-xs text-slate-400">
                Todas as peças ativas e publicadas vinculadas a {client.name}
              </p>
            </div>

            <button
              onClick={() => onOpenCardModal(undefined, client.id)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>Nova Peça para este Cliente</span>
            </button>
          </div>

          {clientCards.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Calendar className="w-8 h-8 text-slate-600" strokeWidth={1.5} />
              <span className="text-xs">Nenhuma peça cadastrada para este cliente ainda.</span>
              <button
                onClick={() => onOpenCardModal(undefined, client.id)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 text-xs font-semibold"
              >
                Criar Primeira Peça
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {clientCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onOpenCardModal(card)}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono shrink-0">
                      {card.format}
                    </span>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {card.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {card.status}
                    </span>

                    <span className="text-slate-400 font-mono text-[11px]">
                      {card.publishDate
                        ? new Date(card.publishDate).toLocaleDateString("pt-BR")
                        : card.dueDate
                        ? new Date(card.dueDate).toLocaleDateString("pt-BR")
                        : "Sem data"}
                    </span>

                    <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" strokeWidth={1.75} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: MATERIAIS */}
      {activeTab === "materiais" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
              <span>Repositório de Materiais & Ativos da Marca</span>
            </h3>
            <p className="text-xs text-slate-400">
              Links da nuvem, manuais de identidade e arquivos de design
            </p>
          </div>

          {/* Link do Google Drive / Nuvem */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Pasta na Nuvem / Google Drive</span>
              <span className="text-xs text-slate-400 truncate block max-w-lg font-mono mt-0.5">
                {del.materialsUrl || "Nenhum link de pasta configurado."}
              </span>
            </div>

            {del.materialsUrl ? (
              <a
                href={del.materialsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Abrir Pasta de Materiais</span>
              </a>
            ) : (
              <button
                onClick={() => onEditClient(client)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold shrink-0"
              >
                Adicionar Link de Drive
              </button>
            )}
          </div>

          {/* Diretrizes Visuais */}
          {del.brandGuidelines && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-white block">Diretrizes de Identidade Visual</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {del.brandGuidelines}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA 4: IA DO CLIENTE */}
      {activeTab === "ia" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
              <span>Instruções & Base de Conhecimento para a Inteligência Artificial</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure as regras de tom de voz, persona e restrições que os agentes de IA devem seguir para esta marca.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Regras e Diretrizes para Geração de Conteúdo (Copy, Reels, Carrosséis)
            </label>
            <textarea
              value={aiGuidelines}
              onChange={(e) => setAiGuidelines(e.target.value)}
              placeholder="Descreva aqui:&#10;- Persona da marca&#10;- Tom de voz (formal, descontraído, técnico)&#10;- Expressões recomendadas e termos proibidos&#10;- Chamadas para ação (CTA) padrão"
              rows={8}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSaveAi}
                disabled={savingAi}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {savingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={1.75} />}
                <span>Salvar Configurações da IA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: CONVERSA / ALINHAMENTOS */}
      {activeTab === "conversa" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
                <span>Conversa & Alinhamentos da Equipe</span>
              </h3>
              <p className="text-xs text-slate-400">
                Notas internas de alinhamento e atalho de comunicação com o cliente
              </p>
            </div>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Abrir Conversa WhatsApp</span>
              </a>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Notas de Reunião & Alinhamentos Internos
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registre aqui anotações de alinhamento com o cliente, decisões tomadas em reuniões ou observações da equipe..."
              rows={6}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={1.75} />}
                <span>Salvar Anotações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 6: CONTRATO */}
      {activeTab === "contrato" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
              <span>Contrato de Prestação de Serviços</span>
            </h3>
            <p className="text-xs text-slate-400">
              Vigência, valores de mensalidade e termos do contrato acordado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Mensalidade (Fee)</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                R$ {Number(del.contractValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Plano Contratado</span>
              <span className="text-base font-bold text-white">{client.planTier || "Standard"}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Vigência</span>
              <span className="text-base font-bold text-slate-300">
                {del.contractDurationMonths ? `${del.contractDurationMonths} meses` : "12 meses"}
              </span>
            </div>
          </div>

          {del.scope && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white block">Termos e Condições do Escopo</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {del.scope}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA 7: HISTÓRICO (EXATAMENTE COMO NO PRINT DO USUÁRIO!) */}
      {activeTab === "historico" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in duration-150">
          
          <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
                <span>Linha do Tempo & Histórico do Cliente</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registro cronológico de alterações cadastrais e marcos de atendimento
              </p>
            </div>

            {/* Input Rápido para Novo Registro */}
            <form onSubmit={handleAddHistoryLog} className="flex items-center gap-2">
              <input
                type="text"
                value={newHistoryAction}
                onChange={(e) => setNewHistoryAction(e.target.value)}
                placeholder="Registrar evento ou atualização..."
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 w-56 sm:w-72"
              />
              <button
                type="submit"
                disabled={savingHistory || !newHistoryAction.trim()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                {savingHistory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" strokeWidth={1.75} />}
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Timeline Vertical com pontos e traços contínuos (Idêntico ao print) */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {historyList.map((item, idx) => (
              <div key={item.id || idx} className="relative flex flex-col gap-0.5">
                {/* Marcador em círculo ciano/azul escuro */}
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-[#0B1224]" />

                {/* Título da Ação */}
                <h4 className="text-xs font-bold text-slate-200">
                  {item.action}
                </h4>

                {/* Autor e Data/Hora formatada */}
                <span className="text-[11px] text-slate-500">
                  {item.author} • {formatDateTime(item.date)}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
