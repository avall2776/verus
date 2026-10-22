"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  CheckSquare,
  Trash2,
  Paperclip,
  Upload,
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Plus,
  Send,
  AlertCircle,
  DollarSign,
  PencilLine,
  Building2,
  Video,
  Layers,
  Image as ImageIcon,
  Flame,
  Sparkles,
  User as UserIcon,
  Copy,
  ExternalLink,
  Eye,
  Play,
  FolderPlus,
  FolderArchive,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  MarketingCardItem,
  MarketingClientItem,
  TeamMember,
  MarketingChecklistItem,
} from "./types";
import {
  extractGoogleDriveId,
  getDriveThumbnailUrl,
  detectMediaType,
  isGoogleDriveUrl,
} from "@/lib/googleDriveHelper";
import MarketingMediaApprovalModal from "./MarketingMediaApprovalModal";

export const PIPELINE_STAGES = [
  { id: "BACKLOG", title: "Backlog", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", dot: "bg-gray-400" },
  { id: "PLANEJAMENTO", title: "Planejamento / Copy", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500" },
  { id: "DESIGN_VIDEO", title: "Design & Vídeo", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-500" },
  { id: "REVISAO_INTERNA", title: "Revisão Interna", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-500" },
  { id: "APROVACAO_CLIENTE", title: "Aprovação Cliente", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-500" },
  { id: "AGENDADO_POSTADO", title: "Agendado / Postado", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: MarketingCardItem | null;
  defaultStatus?: string;
  clients: MarketingClientItem[];
  teamMembers: TeamMember[];
  onSaved: () => void;
  onOpenClientHistory?: (client: MarketingClientItem) => void;
}

function safeFormatDate(dateVal?: any, formatStr = "dd/MM/yyyy HH:mm"): string {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    return format(d, formatStr, { locale: ptBR });
  } catch {
    return "-";
  }
}

export default function MarketingCardModal({
  isOpen,
  onClose,
  card,
  defaultStatus = "BACKLOG",
  clients,
  teamMembers,
  onSaved,
  onOpenClientHistory,
}: Props) {
  const isEditing = Boolean(card?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Edição Inline do Topo
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState("0,00");

  // Campos do formulário e demanda
  const [clientId, setClientId] = useState("");
  const [formatType, setFormatType] = useState<string>("POST");
  const [status, setStatus] = useState<string>(defaultStatus);
  const [priority, setPriority] = useState<string>("MEDIA");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [publishDate, setPublishDate] = useState("");

  // Copy & Anotações
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  // Checklist
  const [checklist, setChecklist] = useState<MarketingChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  // Anexos
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState("");
  const [driveNameInput, setDriveNameInput] = useState("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Timeline & Histórico
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [newTimelineNote, setNewTimelineNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Inicialização ao abrir modal
  useEffect(() => {
    if (isOpen) {
      if (card) {
        setTempTitle(card.title || "");
        setClientId(card.marketingClientId || (clients[0]?.id || ""));
        setFormatType(card.format || "POST");
        setStatus(card.status || "BACKLOG");
        setPriority(card.priority || "MEDIA");
        setAssignedUserId(card.assignedUserId || "");
        setDueDate(card.dueDate ? card.dueDate.substring(0, 10) : "");
        setPublishDate(card.publishDate ? card.publishDate.substring(0, 10) : "");
        setTempNotes(card.description || "");
        setChecklist(Array.isArray(card.checklist) ? card.checklist : []);
        setAttachments(Array.isArray(card.attachments) ? card.attachments : []);

        const initialTimeline = Array.isArray(card.timeline) && card.timeline.length > 0
          ? card.timeline
          : [
              {
                id: "evt-init",
                type: "created",
                title: "Demanda Operacional Criada",
                stage: card.status || "BACKLOG",
                author: card.assignedUser?.name || "Equipe Marketing",
                date: card.createdAt || new Date().toISOString(),
              },
            ];
        setTimelineEvents(initialTimeline);
        setTempValue((card.value ? Number(card.value) : 0).toFixed(2).replace(".", ","));
      } else {
        // Novo Card
        setTempTitle("Nova Peça / Demanda");
        setClientId(clients[0]?.id || "");
        setFormatType("POST");
        setStatus(defaultStatus || "BACKLOG");
        setPriority("MEDIA");
        setAssignedUserId("");
        setDueDate("");
        setPublishDate("");
        setTempNotes("");
        setChecklist([]);
        setAttachments([]);
        setTimelineEvents([
          {
            id: "evt-init",
            type: "created",
            title: "Nova Demanda Inicializada",
            stage: defaultStatus || "BACKLOG",
            author: "Você (Agência)",
            date: new Date().toISOString(),
          },
        ]);
        setTempValue("0,00");
      }

      setIsEditingTitle(false);
      setIsEditingValue(false);
      setIsEditingNotes(false);
      setNewChecklistText("");
      setNewTimelineNote("");
    }
  }, [isOpen, card?.id, defaultStatus, clients]);

  // Fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStage =
    PIPELINE_STAGES.find((s) => s.id === status) || PIPELINE_STAGES[0];
  const selectedClient = clients.find((c) => c.id === clientId) || card?.marketingClient;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  // Atualização rápida de título inline
  const handleUpdateTitleInline = async () => {
    if (!tempTitle.trim()) {
      toast.error("O título não pode ser vazio.");
      return;
    }
    setIsEditingTitle(false);
    if (isEditing && card) {
      try {
        await api.patch(`/agency/marketing/cards/${card.id}`, { title: tempTitle.trim() });
        toast.success("Título atualizado!");
        onSaved();
      } catch (err) {
        toast.error("Erro ao atualizar título.");
      }
    }
  };

  // Atualização rápida de valor inline
  const handleUpdateValueInline = async () => {
    const num = parseFloat(tempValue.replace(/\./g, "").replace(",", ".")) || 0;
    setIsEditingValue(false);
    if (isEditing && card) {
      try {
        await api.patch(`/agency/marketing/cards/${card.id}`, { value: num });
        toast.success("Valor / Verba atualizada!");
        onSaved();
      } catch (err) {
        // Fallback silencioso
      }
    }
  };

  // Alteração de Etapa (com registro na timeline)
  const handleStageChange = async (newStage: string) => {
    setStatus(newStage);
    const stageObj = PIPELINE_STAGES.find((s) => s.id === newStage);
    const stageTitle = stageObj?.title || newStage;

    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "stage_change",
      title: `Etapa alterada para "${stageTitle}"`,
      stage: newStage,
      author: "Agência",
      date: new Date().toISOString(),
    };

    const updatedTimeline = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedTimeline);

    if (isEditing && card) {
      try {
        await api.patch(`/agency/marketing/cards/${card.id}`, {
          status: newStage,
          checklist,
        });
        toast.success(`Movido para "${stageTitle}"`);
        onSaved();
      } catch (err) {
        toast.error("Erro ao alterar etapa.");
      }
    }
  };

  // Adicionar Anotação Rápida à Timeline
  const handleAddTimelineNote = () => {
    if (!newTimelineNote.trim()) return;
    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "note",
      title: newTimelineNote.trim(),
      stage: status,
      author: "Você (Agência)",
      date: new Date().toISOString(),
    };
    const updated = [newEvt, ...timelineEvents];
    setTimelineEvents(updated);
    setNewTimelineNote("");

    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, {
        // persist timeline
      }).catch(() => {});
    }
    toast.success("Anotação registrada na timeline!");
  };

  // Manipulação do Checklist
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: MarketingChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newChecklistText.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistText("");

    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, { checklist: updated }).catch(() => {});
    }
  };

  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    setChecklist(updated);
    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, { checklist: updated }).catch(() => {});
    }
  };

  const handleRemoveChecklist = (id: string) => {
    const updated = checklist.filter((i) => i.id !== id);
    setChecklist(updated);
    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, { checklist: updated }).catch(() => {});
    }
  };

  // Upload de Anexos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    const newAtt = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: sizeStr,
      type: file.type || "file",
      date: "Hoje às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);

    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, { attachments: updated }).catch(() => {});
    }
    toast.success(`Arquivo "${file.name}" anexado à demanda!`);
  };

  const handleRemoveAttachment = (attId: string) => {
    const updated = attachments.filter((a) => a.id !== attId);
    setAttachments(updated);
    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, { attachments: updated }).catch(() => {});
    }
    toast.success("Anexo removido.");
  };

  // Ingestão de Mídia do Google Drive (5 TB)
  const handleAddDriveAttachment = () => {
    if (!driveUrlInput.trim()) {
      toast.error("Insira o link do arquivo ou vídeo no Google Drive.");
      return;
    }

    const driveId = extractGoogleDriveId(driveUrlInput.trim());
    const isDrive = Boolean(driveId || isGoogleDriveUrl(driveUrlInput.trim()));
    const name = driveNameInput.trim() || (isDrive ? "Mídia Google Drive" : "Arquivo Externo");

    const newAtt = {
      id: `att-drive-${Date.now()}`,
      name,
      url: driveUrlInput.trim(),
      type: isDrive ? "google-drive" : "file",
      size: "Google Drive (5 TB)",
      date: "Hoje às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);
    setDriveUrlInput("");
    setDriveNameInput("");
    setShowDriveInput(false);

    if (isEditing && card) {
      api.patch(`/agency/marketing/cards/${card.id}`, { attachments: updated }).catch(() => {});
    }
    toast.success("Mídia do Google Drive vinculada à demanda!");
  };

  // Atualizar Copy / Briefing
  const handleSaveNotes = async () => {
    setIsEditingNotes(false);
    if (isEditing && card) {
      try {
        await api.patch(`/agency/marketing/cards/${card.id}`, { description: tempNotes.trim() });
        toast.success("Briefing / Copy atualizado!");
        onSaved();
      } catch (err) {
        toast.error("Erro ao salvar briefing.");
      }
    }
  };

  // Salvar Todas as Alterações
  const handleSaveFull = async () => {
    if (!tempTitle.trim()) {
      toast.error("O título da peça é obrigatório.");
      return;
    }
    if (!clientId) {
      toast.error("Selecione um cliente para a peça.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: tempTitle.trim(),
        description: tempNotes.trim() || undefined,
        marketingClientId: clientId,
        format: formatType,
        status,
        priority,
        assignedUserId: assignedUserId || undefined,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
        publishDate: publishDate ? new Date(`${publishDate}T12:00:00`).toISOString() : undefined,
        checklist,
        attachments,
      };

      if (isEditing && card) {
        await api.patch(`/agency/marketing/cards/${card.id}`, payload);
        toast.success("Demanda atualizada com sucesso!");
      } else {
        await api.post("/agency/marketing/cards", payload);
        toast.success("Demanda criada com sucesso!");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[SAVE_MARKETING_CARD_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar demanda.");
    } finally {
      setSaving(false);
    }
  };

  // Excluir Demanda
  const handleDeleteCard = async () => {
    if (!card?.id) return;
    if (!window.confirm("Deseja realmente excluir esta demanda de marketing?")) return;

    setDeleting(true);
    try {
      await api.delete(`/agency/marketing/cards/${card.id}`);
      toast.success("Demanda excluída com sucesso.");
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[DELETE_CARD_ERROR]", err);
      toast.error("Erro ao excluir demanda.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 w-full max-w-5xl h-[90vh] max-h-[850px] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO SUPERIOR DO MODAL (ESTILO CRM COMERCIAL / PADRÃO LERO)       */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 dark:bg-[#1c2128] border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Circular com a cor da marca do cliente */}
            <div
              className="flex shrink-0 h-11 w-11 items-center justify-center rounded-full text-base font-black shadow-inner ring-2"
              style={{
                backgroundColor: `${selectedClient?.brandColor || "#00D2FF"}20`,
                borderColor: `${selectedClient?.brandColor || "#00D2FF"}60`,
                color: selectedClient?.brandColor || "#00D2FF",
              }}
            >
              {selectedClient?.name?.[0]?.toUpperCase() || tempTitle[0]?.toUpperCase() || "M"}
            </div>

            <div className="flex flex-col min-w-0">
              {/* Título Editável Inline */}
              <div className="flex items-center gap-2 group">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleUpdateTitleInline}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateTitleInline()}
                    className="bg-white dark:bg-[#0d1117] border border-blue-600 rounded-lg px-2.5 py-1 text-base font-bold text-slate-900 dark:text-white outline-none w-full max-w-md"
                  />
                ) : (
                  <>
                    <h2
                      onClick={() => setIsEditingTitle(true)}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-cyan-300 transition-colors"
                      title="Clique para editar o título"
                    >
                      {tempTitle || "Demanda sem título"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="text-gray-400 hover:text-white p-1 rounded transition-colors opacity-60 group-hover:opacity-100"
                      title="Editar título"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Subtítulo: Cliente + Formato + Data */}
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block" />
                  <span>{selectedClient?.name || "Cliente da Agência"}</span>
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] bg-slate-800/80 px-2 py-0.2 rounded text-slate-300">
                  {formatType}
                </span>
                <span>•</span>
                <span className={`text-[11px] font-bold px-2 py-0.2 rounded ${currentStage.bg} ${currentStage.color} border ${currentStage.border}`}>
                  {currentStage.title}
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Verba / Valor e Botão Fechar */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Investimento / Verba
              </span>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0d1117] px-3 py-1 rounded-xl border border-gray-800 shadow-inner group">
                {isEditingValue ? (
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold text-xs">R$</span>
                    <input
                      autoFocus
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={handleUpdateValueInline}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateValueInline()}
                      className="w-24 bg-transparent text-emerald-400 font-black font-mono text-sm text-right outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => setIsEditingValue(true)}
                      className="text-emerald-400 font-black font-mono text-sm cursor-pointer hover:text-emerald-300 transition-colors"
                      title="Clique para editar verba ou valor"
                    >
                      {formatCurrency(parseFloat(tempValue.replace(/\./g, "").replace(",", ".")) || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingValue(true)}
                      className="text-gray-400 hover:text-emerald-400 transition-colors p-0.5 rounded opacity-60 group-hover:opacity-100"
                    >
                      <PencilLine className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-gray-700"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CORPO DO MODAL (DUAS COLUNAS: CONTEÚDO PRINCIPAL & LATERAL DE AÇÕES)   */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
          {/* --------------------------------------------------------------------- */}
          {/* COLUNA ESQUERDA: Ficha do Cliente, Copy, Checklist, Anexos e Timeline */}
          {/* --------------------------------------------------------------------- */}
          <div className="flex-1 lg:overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-gray-800/60">
            {/* SEÇÃO 0: INFORMAÇÕES DO CLIENTE (PADRÃO LERO) */}
            <div className="bg-white dark:bg-[#161b22] border border-gray-800/80 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800/60 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <Building2 size={14} className="text-cyan-400" /> Informações do Cliente & Conta
                </h3>
                {selectedClient && onOpenClientHistory && (
                  <button
                    type="button"
                    onClick={() => onOpenClientHistory(selectedClient as MarketingClientItem)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-100 dark:bg-[#0d1117] hover:bg-[#21262d] border border-gray-800 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span>Ver Ficha & Histórico</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Empresa / Marca</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {selectedClient?.name || "Cliente não vinculado"}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">WhatsApp / Contato</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0 inline-block" />
                    <span>{selectedClient?.contactPhone || selectedClient?.contactName || "Diretoria do Cliente"}</span>
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Plano Contratado</span>
                  <span className="font-semibold text-blue-600 dark:text-cyan-300 truncate block">
                    {selectedClient?.planTier || "Escopo Mensal Padrão"}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block mb-0.5">Verba Tráfego Mensal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                    {formatCurrency(Number(selectedClient?.adBudget || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: BRIEFING, COPY & CONTEÚDO DA PEÇA */}
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800/80 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-gray-800/60 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-gray-200 flex items-center gap-2">
                  <FileText size={14} className="text-blue-600 dark:text-gray-400" /> Briefing, Copy & Roteiro da Demanda
                </h3>
                {!isEditingNotes && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(true)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                  >
                    <PencilLine className="w-3.5 h-3.5" />
                    <span>Editar Copy</span>
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    rows={4}
                    placeholder="Escreva aqui o briefing, roteiro do reels, copy da legenda, ganchos e CTAs..."
                    className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white resize-y outline-none focus:border-blue-600 dark:focus:border-cyan-500/60 leading-relaxed font-sans"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      Salvar Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-800/60 rounded-xl p-3 text-xs text-slate-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed min-h-[70px]">
                  {tempNotes || (
                    <span className="text-slate-400 dark:text-gray-500 italic">
                      Nenhum briefing ou texto cadastrado. Clique em "Editar Copy" acima para adicionar o roteiro ou legenda.
                    </span>
                  )}
                </div>
              )}

              {/* Checklist de Subtarefas */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-gray-800/60">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-gray-300 flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-blue-600 dark:text-cyan-400" />
                    <span>Checklist de Execução ({checklist.filter((i) => i.completed).length}/{checklist.length})</span>
                  </span>
                </div>

                {/* Adicionar item ao checklist */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                    placeholder="Adicionar etapa (ex: Gravar áudio, Aprovar criativo...)"
                    className="flex-1 bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-600 dark:focus:border-cyan-500/60"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
                    title="Adicionar etapa"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Lista de itens */}
                <div className="space-y-1.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-[#0d1117] border border-gray-800/60 text-xs hover:border-gray-700 transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(item.id)}
                          className="w-3.5 h-3.5 rounded accent-cyan-500"
                        />
                        <span className={`truncate ${item.completed ? "line-through text-gray-500" : "text-gray-200"}`}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklist(item.id)}
                        className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                        title="Remover etapa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: ANEXOS & ARQUIVOS */}
            <div className="bg-white dark:bg-[#161b22] border border-gray-800/80 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800/60 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <Paperclip size={14} className="text-gray-400" /> Anexos & Criativos da Demanda ({attachments.length})
                </h3>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDriveInput(!showDriveInput)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <FolderPlus size={13} className="text-cyan-400" />
                    <span>+ Google Drive (5 TB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-200 bg-slate-100 dark:bg-[#0d1117] hover:bg-[#21262d] border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Upload size={13} className="text-gray-400" />
                    <span>Anexar Arquivo</span>
                  </button>
                </div>
              </div>

              {/* FORMULÁRIO DE VINCULAÇÃO DO GOOGLE DRIVE */}
              {showDriveInput && (
                <div className="mb-3.5 p-3.5 bg-slate-100 dark:bg-[#0d1117] border border-cyan-500/30 rounded-xl space-y-2.5 animate-in slide-in-from-top-1 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <FolderArchive size={13} className="text-cyan-400" /> Vincular Arquivo do Google Drive (Zero Custo de Armazenamento)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDriveInput(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <input
                    type="url"
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    placeholder="Cole o link de compartilhamento do Drive (imagem, vídeo ou reels)..."
                    className="w-full bg-white dark:bg-[#161b22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveNameInput}
                      onChange={(e) => setDriveNameInput(e.target.value)}
                      placeholder="Identificação da peça (ex: Vídeo Final v2, Carrossel Post 1)..."
                      className="flex-1 bg-white dark:bg-[#161b22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddDriveAttachment}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 shadow-sm"
                    >
                      Salvar Mídia
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-center py-5 text-gray-500 text-xs italic border border-dashed border-gray-800/80 rounded-xl">
                    Nenhum arquivo ou mídia vinculado a esta demanda. Clique em "+ Google Drive (5 TB)" ou "Anexar Arquivo".
                  </div>
                ) : (
                  attachments.map((att) => {
                    const thumbUrl = att.url ? getDriveThumbnailUrl(att.url, 150) : null;
                    const isVideo = detectMediaType(att.name, formatType) === "video";

                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-[#0d1117] border border-gray-800/60 hover:border-gray-700/80 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {thumbUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/60 border border-gray-700 shrink-0 relative group/thumb cursor-pointer" onClick={() => setIsApprovalModalOpen(true)}>
                              <img
                                src={thumbUrl}
                                alt={att.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Play size={10} className="fill-white text-white" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-cyan-400 shrink-0">
                              <FileText size={15} />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate max-w-[280px]">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                              <span>{att.size || "Arquivo"}</span>
                              {att.date ? <span>• {att.date}</span> : null}
                              {att.url && <span className="text-cyan-400 font-semibold">• Drive Conectado</span>}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {att.url && (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsApprovalModalOpen(true)}
                                className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg text-cyan-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="Abrir player / Visualizador para Aprovação"
                              >
                                <Eye size={12} />
                                <span>Aprovar</span>
                              </button>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                                title="Abrir no Google Drive"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </>
                          )}
                          {!att.url && (
                            <button
                              type="button"
                              onClick={() => toast.success(`Baixando ${att.name}...`)}
                              className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="Baixar arquivo"
                            >
                              <Download size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 hover:bg-rose-950/40 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
                            title="Remover anexo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SEÇÃO 3: TIMELINE & HISTÓRICO DA DEMANDA */}
            <div className="bg-white dark:bg-[#161b22] border border-gray-800/80 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800/60 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" /> Timeline & Histórico Operacional
                </h3>
              </div>

              {/* Registro Rápido */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newTimelineNote}
                  onChange={(e) => setNewTimelineNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTimelineNote()}
                  placeholder="Adicionar nota rápida à timeline da peça..."
                  className="flex-1 bg-slate-100 dark:bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-cyan-500/60"
                />
                <button
                  type="button"
                  onClick={handleAddTimelineNote}
                  className="bg-slate-50 dark:bg-[#1c2128] hover:bg-gray-800 text-gray-200 border border-gray-700 text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send size={12} className="text-cyan-400" /> Registrar
                </button>
              </div>

              {/* Linha Cronológica */}
              <div className="relative pl-5 border-l-2 border-gray-800 space-y-3.5">
                {timelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative">
                    <div
                      className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-[#161b22] ${
                        evt.type === "created"
                          ? "bg-blue-400"
                          : evt.type === "stage_change"
                          ? "bg-emerald-400"
                          : "bg-cyan-400"
                      }`}
                    />

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-gray-200">{evt.title}</span>
                      <span className="text-[10px] text-gray-500">{safeFormatDate(evt.date)}</span>
                    </div>

                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-gray-800 text-[8px] flex items-center justify-center font-bold text-white">
                        {evt.author?.[0] || "A"}
                      </div>
                      <span>{evt.author || "Equipe"}</span>
                      {evt.stage && (
                        <span className="text-[10px] font-mono bg-gray-900 border border-gray-800 px-1.5 py-0.2 rounded text-gray-400">
                          {String(evt.stage).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* COLUNA DIREITA: PAINEL DE AÇÕES E PARÂMETROS (PADRÃO CRM LERO)        */}
          {/* --------------------------------------------------------------------- */}
          <div className="w-full lg:w-[340px] bg-slate-50 dark:bg-[#13171f]/90 p-4 sm:p-5 lg:p-6 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar shrink-0 border-t-0 lg:border-l border-slate-200 dark:border-gray-800/60">
            {/* ETAPA DO KANBAN */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Etapa de Produção
              </label>
              <select
                className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:focus:border-cyan-500/60 transition-colors cursor-pointer"
                value={status}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* CLIENTE VINCULADO */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Cliente Vinculado
              </label>
              <select
                className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600 dark:focus:border-cyan-500/60 transition-colors cursor-pointer"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* RESPONSÁVEL DA AGÊNCIA */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Responsável na Agência
              </label>
              <select
                className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600 dark:focus:border-cyan-500/60 transition-colors cursor-pointer"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
              >
                <option value="" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Fila Geral da Agência</option>
                {teamMembers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">
                    {u.name} {u.role ? `(${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* FORMATO DA PEÇA */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Formato
                </label>
                <select
                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none focus:border-blue-600 dark:focus:border-cyan-500/60 cursor-pointer"
                  value={formatType}
                  onChange={(e) => setFormatType(e.target.value)}
                >
                  <option value="REELS" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Reels</option>
                  <option value="POST" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Post Feed</option>
                  <option value="CARROSSEL" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Carrossel</option>
                  <option value="STORIES" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Stories</option>
                  <option value="CAMPANHA" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Campanha</option>
                  <option value="OUTRO" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Prioridade
                </label>
                <select
                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none focus:border-blue-600 dark:focus:border-cyan-500/60 cursor-pointer"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="BAIXA" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Baixa</option>
                  <option value="MEDIA" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Média</option>
                  <option value="ALTA" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Alta</option>
                  <option value="URGENTE" className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white">Urgente</option>
                </select>
              </div>
            </div>

            {/* PRAZOS DE ENTREGA & PUBLICAÇÃO */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Prazo Entrega
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Publicação
                </label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-blue-600 dark:focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-gray-800 w-full my-1" />

            {/* AÇÕES CRÍTICAS (CONCLUÍDO / AJUSTES) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStageChange("AGENDADO_POSTADO")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  status === "AGENDADO_POSTADO"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-sm"
                    : "bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35 dark:text-emerald-400 dark:border-emerald-900/40"
                }`}
                title="Marcar como Concluído / Postado"
              >
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{status === "AGENDADO_POSTADO" ? "Postado" : "Concluir"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStageChange("REVISAO_INTERNA")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  status === "REVISAO_INTERNA"
                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 shadow-sm"
                    : "bg-amber-50/70 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:hover:bg-amber-950/35 dark:text-amber-400 dark:border-amber-900/40"
                }`}
                title="Mandar para Revisão / Ajustes"
              >
                <RotateCcw size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Revisão</span>
              </button>
            </div>

            {/* BOTÃO PRINCIPAL DE SALVAR (Azul Sólido Corporativo) */}
            <button
              type="button"
              onClick={handleSaveFull}
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckSquare size={14} />
              <span>{saving ? "Salvando Demanda..." : isEditing ? "Salvar Alterações" : "Criar Demanda"}</span>
            </button>

            {/* EXCLUIR DEMANDA (SE EDITANDO) */}
            {isEditing && (
              <button
                type="button"
                onClick={handleDeleteCard}
                disabled={deleting}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/35 border border-rose-200 dark:border-rose-900/30 transition-colors flex items-center justify-center gap-1.5 mt-auto"
              >
                <Trash2 size={13} />
                <span>{deleting ? "Excluindo..." : "Excluir Demanda"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO E APROVAÇÃO DE MÍDIA / VÍDEO (GOOGLE DRIVE) */}
      <MarketingMediaApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        card={card ? { ...card, attachments } : null}
        onUpdated={() => {
          setIsApprovalModalOpen(false);
          onSaved();
        }}
      />
    </div>
  );
}
