"use client";

import React, { useState } from "react";
import {
  X,
  FolderArchive,
  ExternalLink,
  Plus,
  Loader2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { MarketingClientItem, TeamMember } from "./types";
import {
  extractGoogleDriveId,
  getDriveThumbnailUrl,
  detectMediaType,
} from "@/lib/googleDriveHelper";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clients: MarketingClientItem[];
  teamMembers: TeamMember[];
  onImported: () => void;
}

export default function MarketingDriveImportModal({
  isOpen,
  onClose,
  clients,
  teamMembers,
  onImported,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [title, setTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [format, setFormat] = useState<string>("REELS");
  const [status, setStatus] = useState<string>("APROVACAO_CLIENTE");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const driveId = extractGoogleDriveId(driveUrl);
  const detectedType = detectMediaType(driveUrl, format);
  const previewThumbnail = driveId ? getDriveThumbnailUrl(driveId, 600) : null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da peça.");
      return;
    }
    if (!selectedClientId) {
      toast.error("Selecione o cliente.");
      return;
    }
    if (!driveUrl.trim()) {
      toast.error("Cole o link do Google Drive.");
      return;
    }

    setSubmitting(true);
    try {
      const fileName = title.trim();
      const payload = {
        marketingClientId: selectedClientId,
        title: title.trim(),
        format,
        status,
        description: description.trim() || undefined,
        assignedUserId: assignedUserId || undefined,
        publishDate: publishDate || undefined,
        priority: "ALTA",
        attachments: [
          {
            id: crypto.randomUUID(),
            name: `${fileName} (${format})`,
            url: driveUrl.trim(),
            type: "google-drive",
            date: new Date().toISOString(),
          },
        ],
      };

      await api.post("/agency/marketing/cards", payload);
      toast.success("Mídia do Google Drive vinculada com sucesso!");
      onImported();
      onClose();
    } catch (err: any) {
      console.error("[IMPORT_DRIVE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao vincular mídia do Google Drive.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <FolderArchive className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Vincular Mídia do Google Drive (5 TB)
              </h3>
              <p className="text-xs text-slate-400">
                O arquivo pesado permanece no Drive sem consumir o banco de dados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleImport} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Link do Google Drive */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Link do Arquivo ou Vídeo no Google Drive *</span>
              <span className="text-[10px] text-cyan-400 font-mono">5 TB em Nuvem</span>
            </label>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/1A2B3C.../view"
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>

          {/* Pré-visualização da Miniatura se o link for válido */}
          {previewThumbnail && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-black/60 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={previewThumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Google Drive Conectado</span>
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  ID: {driveId}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Tipo identificado: {detectedType === "video" ? "Vídeo / Reels" : "Imagem / Arte"}
                </span>
              </div>
            </div>
          )}

          {/* Selecionar Cliente e Título */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Cliente *</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
                required
              >
                <option value="">Selecione o Cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Formato da Peça</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
              >
                <option value="REELS">Reels / Vídeo (9:16)</option>
                <option value="POST">Post Feed (1:1 / 4:5)</option>
                <option value="CARROSSEL">Carrossel Contínuo</option>
                <option value="STORIES">Stories</option>
                <option value="CAMPANHA">Campanha de Tráfego</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Título da Peça / Vídeo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reels: Dica de Aplicação de Adubo"
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Status Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
              >
                <option value="APROVACAO_CLIENTE">Aprovação do Cliente</option>
                <option value="REVISAO_INTERNA">Revisão Interna</option>
                <option value="DESIGN_VIDEO">Design & Vídeo</option>
                <option value="AGENDADO_POSTADO">Aprovado / Postado</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Data de Publicação</label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Legenda / Copy da Peça (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite ou cole aqui a legenda pronta da postagem..."
              rows={3}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Plus className="w-4 h-4" />}
              <span>Vincular e Criar Peça</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
