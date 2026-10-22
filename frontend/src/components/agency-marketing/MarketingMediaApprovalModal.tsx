"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Download,
  Copy,
  Video,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Calendar,
  User,
  Clock,
  Loader2,
  Send,
  MessageSquare,
  FileText,
  Maximize2,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { MarketingCardItem } from "./types";
import {
  extractGoogleDriveId,
  getDriveThumbnailUrl,
  getDriveEmbedPlayerUrl,
  detectMediaType,
  isGoogleDriveUrl,
} from "@/lib/googleDriveHelper";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: MarketingCardItem | null;
  onUpdated: () => void;
}

export default function MarketingMediaApprovalModal({
  isOpen,
  onClose,
  card,
  onUpdated,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);

  if (!isOpen || !card) return null;

  const attachments = card.attachments || [];
  const currentAttachment = attachments[selectedAttachmentIndex] || attachments[0];
  const mediaUrl = currentAttachment?.url || card.description || "";
  const mediaType = detectMediaType(currentAttachment?.name || card.title, card.format);

  const driveFileId = extractGoogleDriveId(mediaUrl);
  const embedPlayerUrl = getDriveEmbedPlayerUrl(driveFileId || mediaUrl);
  const directThumbnail = getDriveThumbnailUrl(driveFileId || mediaUrl, 1200);

  // 1. Ação: APROVAR PEÇA
  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const updatedTimeline = [
        ...(card.timeline || []),
        {
          id: crypto.randomUUID(),
          type: "APPROVAL",
          title: "Peça Aprovada para Publicação",
          stage: "AGENDADO_POSTADO",
          author: "Revisor / Cliente",
          date: new Date().toISOString(),
        },
      ];

      await api.patch(`/agency/marketing/cards/${card.id}`, {
        status: "AGENDADO_POSTADO",
        timeline: updatedTimeline,
      });

      toast.success("Peça aprovada com sucesso! Movida para agendada/postada.");
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error("[APPROVE_ERROR]", err);
      toast.error("Erro ao aprovar peça.");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Ação: SOLICITAR AJUSTES / ALTERAÇÕES
  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error("Descreva as alterações necessárias para a equipe de criação.");
      return;
    }

    setSubmitting(true);
    try {
      const updatedTimeline = [
        ...(card.timeline || []),
        {
          id: crypto.randomUUID(),
          type: "REVISION_REQUESTED",
          title: `Ajuste Solicitado: ${revisionNotes.trim()}`,
          stage: "DESIGN_VIDEO",
          author: "Revisor / Cliente",
          date: new Date().toISOString(),
        },
      ];

      await api.patch(`/agency/marketing/cards/${card.id}`, {
        status: "DESIGN_VIDEO",
        timeline: updatedTimeline,
      });

      toast.success("Solicitação de ajuste enviada para o designer/videomaker!");
      setShowRevisionInput(false);
      setRevisionNotes("");
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error("[REVISION_ERROR]", err);
      toast.error("Erro ao registrar pedido de alteração.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Ação: REPROVAR
  const handleReject = async () => {
    if (!confirm("Tem certeza que deseja reprovar esta peça? Ela voltará para o planejamento.")) {
      return;
    }

    setSubmitting(true);
    try {
      const updatedTimeline = [
        ...(card.timeline || []),
        {
          id: crypto.randomUUID(),
          type: "REJECTED",
          title: "Peça Reprovada",
          stage: "PLANEJAMENTO",
          author: "Revisor / Cliente",
          date: new Date().toISOString(),
        },
      ];

      await api.patch(`/agency/marketing/cards/${card.id}`, {
        status: "PLANEJAMENTO",
        timeline: updatedTimeline,
      });

      toast.success("Peça reprovada e devolvida ao planejamento.");
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error("[REJECT_ERROR]", err);
      toast.error("Erro ao reprovar peça.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCopyText = () => {
    if (!card.description) return;
    navigator.clipboard?.writeText(card.description);
    toast.success("Texto da legenda copiado!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-white flex flex-col max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: card.marketingClient?.brandColor || "#00D2FF" }}
            />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 block truncate">
                {card.marketingClient?.name || "Cliente"} • {card.format}
              </span>
              <h3 className="text-base font-bold text-white truncate">
                {card.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Abrir no Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Google Drive</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal: Split 2 Colunas */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Coluna Esquerda: Reprodutor de Vídeo ou Visualizador de Imagem */}
          <div className="flex-1 bg-slate-900 dark:bg-[#050814] flex flex-col justify-between p-4 shrink-0 lg:shrink lg:overflow-y-auto">
            
            {/* Área Central de Visualização de Mídia */}
            <div className="flex-1 flex items-center justify-center min-h-[320px] max-h-[560px] relative rounded-2xl overflow-hidden bg-black/40 border border-slate-800/80">
              
              {/* Caso seja Vídeo (Reels / Vídeo) */}
              {mediaType === "video" ? (
                embedPlayerUrl ? (
                  <iframe
                    src={embedPlayerUrl}
                    title={card.title}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="w-full h-full min-h-[360px] sm:min-h-[460px] border-0 rounded-2xl"
                  />
                ) : mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm") ? (
                  <video
                    src={mediaUrl}
                    controls
                    playsInline
                    className="w-full h-full max-h-[500px] object-contain rounded-2xl"
                  />
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <Video className="w-12 h-12 text-cyan-400" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-white">Vídeo Hospedado no Google Drive</span>
                    <p className="text-xs text-slate-400 max-w-sm">
                      O arquivo está armazenado no seu Google Drive (5 TB). Clique no botão abaixo para assistir ou abrir diretamente.
                    </p>
                    {mediaUrl && (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-2 border border-slate-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir Player no Google Drive</span>
                      </a>
                    )}
                  </div>
                )
              ) : directThumbnail ? (
                /* Caso seja Imagem (Post / Carrossel) */
                <img
                  src={directThumbnail}
                  alt={card.title}
                  className="w-full h-full object-contain max-h-[520px] rounded-2xl"
                  onError={(e) => {
                    // Se falhar a miniatura do Drive, exibe fallback limpo
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                  <ImageIcon className="w-12 h-12 text-slate-600" strokeWidth={1.5} />
                  <span className="text-sm font-bold text-white">Criativo Hospedado no Google Drive</span>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {mediaUrl ? "Arquivo vinculado no Google Drive de 5 TB." : "Nenhum arquivo anexado ainda a este card."}
                  </p>
                  {mediaUrl && (
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-2 border border-slate-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ver no Google Drive</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Seletor de Arquivos Múltiplos (ex: Carrossel de Imagens) */}
            {attachments.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {attachments.map((att, idx) => (
                  <button
                    key={att.id || idx}
                    onClick={() => setSelectedAttachmentIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-colors ${
                      selectedAttachmentIndex === idx
                        ? "bg-slate-800 text-cyan-400 border-cyan-500/50"
                        : "bg-white dark:bg-[#0B1224] text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    Arquivo {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita: Informações & Painel de Aprovação Executiva */}
          <div className="w-full lg:w-96 p-5 flex flex-col justify-between gap-4 shrink-0 lg:overflow-y-auto custom-scrollbar">
            
            <div className="space-y-4 text-xs">
              
              {/* Metadados da Peça */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status Atual:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 text-[10px]">
                    {card.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Formato:</span>
                  <span className="text-slate-200 font-medium">{card.format}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Data de Publicação:</span>
                  <span className="font-mono text-slate-200">
                    {card.publishDate
                      ? new Date(card.publishDate).toLocaleDateString("pt-BR")
                      : card.dueDate
                      ? new Date(card.dueDate).toLocaleDateString("pt-BR")
                      : "Sem data agendada"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Responsável:</span>
                  <span className="text-slate-200 font-medium">
                    {card.assignedUser?.name || "Não atribuído"}
                  </span>
                </div>
              </div>

              {/* Legenda / Copy do Post */}
              {card.description && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Legenda / Copy da Peça
                    </span>
                    <button
                      type="button"
                      onClick={copyCopyText}
                      className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-slate-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap font-sans text-xs">
                    {card.description}
                  </p>
                </div>
              )}

              {/* Caixa para Digitar Alterações / Ajustes Solicitados */}
              {showRevisionInput && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Descreva os ajustes necessários</span>
                  </span>
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Ex: Trocar a trilha sonora aos 0:15, alterar a cor do texto do título para branco, corrigir a palavra..."
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionInput(false)}
                      className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestRevision}
                      disabled={submitting || !revisionNotes.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Enviar para o Videomaker/Designer</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Painel Inferior de Botões de Ação (Aprovar / Pedir Alteração / Reprovar) */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              
              {/* Botão Primário: APROVAR */}
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                )}
                <span>Aprovar Peça</span>
              </button>

              {/* Botão Secundário: SOLICITAR ALTERAÇÃO */}
              {!showRevisionInput && (
                <button
                  type="button"
                  onClick={() => setShowRevisionInput(true)}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                  <span>Pedir Alteração / Ajuste</span>
                </button>
              )}

              {/* Botão Terciário: REPROVAR */}
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Reprovar Peça</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
