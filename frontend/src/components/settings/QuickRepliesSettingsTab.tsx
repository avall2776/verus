"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  MessageSquare,
  Save,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Copy,
  Check,
  Cloud,
  FileCheck2,
  Sparkles,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";
import { useTheme } from "@/contexts/ThemeContext";
import {
  extractGoogleDriveId,
  isGoogleDriveUrl,
  getDriveThumbnailUrl,
  detectMediaType,
} from "@/lib/googleDriveHelper";

export interface QuickReplyItem {
  id: string;
  shortcut: string;
  title?: string | null;
  type?: "text" | "document" | "image" | "video";
  content: string;
  mediaUrl?: string | null;
  mediaDriveId?: string | null;
  fileName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function QuickRepliesSettingsTab() {
  const { isWhatsApp, isClean } = useTheme();
  const primaryBtnClass = isWhatsApp 
    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20" 
    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20";
  const focusBorderClass = isWhatsApp 
    ? "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
    : "focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const accentTextClass = isWhatsApp ? "text-emerald-500 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400";

  const [replies, setReplies] = useState<QuickReplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "text" | "document" | "image" | "video">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReplyItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    shortcut: "",
    title: "",
    type: "text" as "text" | "document" | "image" | "video",
    content: "",
    mediaUrl: "",
    fileName: "",
  });

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quick-replies");
      setReplies(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("[QUICK_REPLIES_FETCH_ERROR]", error);
      toast.error(error.response?.data?.message || "Erro ao carregar atalhos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, []);

  const handleOpenModal = (reply: QuickReplyItem | null = null, defaultType: "text" | "document" = "text") => {
    if (reply) {
      setEditingReply(reply);
      setForm({
        shortcut: reply.shortcut.startsWith("/") ? reply.shortcut.substring(1) : reply.shortcut,
        title: reply.title || "",
        type: reply.type || "text",
        content: reply.content || "",
        mediaUrl: reply.mediaUrl || "",
        fileName: reply.fileName || "",
      });
    } else {
      setEditingReply(null);
      setForm({
        shortcut: "",
        title: "",
        type: defaultType,
        content: "",
        mediaUrl: "",
        fileName: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      shortcut: "",
      title: "",
      type: "text",
      content: "",
      mediaUrl: "",
      fileName: "",
    });
    setEditingReply(null);
  };

  // Detecção automática de Google Drive e tipo de arquivo ao colar link
  const handleMediaUrlChange = (url: string) => {
    const trimmed = url.trim();
    const driveId = extractGoogleDriveId(trimmed);

    let nextType = form.type;
    let nextFileName = form.fileName;

    if (trimmed) {
      const detected = detectMediaType(trimmed);
      if (form.type === "text" || !form.mediaUrl) {
        nextType = detected;
      }
      if (!nextFileName) {
        const ext = nextType === "document" ? ".pdf" : nextType === "video" ? ".mp4" : ".jpg";
        nextFileName = form.title ? `${form.title.replace(/\s+/g, "_")}${ext}` : `arquivo_${Date.now().toString().slice(-4)}${ext}`;
      }
    }

    setForm((prev) => ({
      ...prev,
      mediaUrl: trimmed,
      type: nextType,
      fileName: nextFileName,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shortcut.trim()) {
      toast.error("Informe a palavra-chave do atalho.");
      return;
    }

    if (form.type !== "text" && !form.mediaUrl.trim()) {
      toast.error("Informe o link do Google Drive para o catálogo/mídia.");
      return;
    }

    if (form.type === "text" && !form.content.trim()) {
      toast.error("Preencha a mensagem de texto.");
      return;
    }

    const formattedShortcut = form.shortcut.startsWith("/")
      ? form.shortcut.trim()
      : `/${form.shortcut.trim()}`;

    setSaving(true);
    try {
      const payload: any = {
        shortcut: formattedShortcut,
        title: form.title.trim() || undefined,
        type: form.type,
        content: form.content.trim(),
        mediaUrl: form.mediaUrl.trim() || undefined,
        fileName: form.fileName.trim() || undefined,
      };

      if (editingReply) {
        await api.patch(`/quick-replies/${editingReply.id}`, payload);
        toast.success("Atalho atualizado com sucesso!");
      } else {
        await api.post("/quick-replies", payload);
        toast.success(
          form.type === "text"
            ? "Atalho de texto criado com sucesso!"
            : "Catálogo / Mídia via Drive cadastrado com sucesso!"
        );
      }
      handleCloseModal();
      fetchReplies();
    } catch (error: any) {
      console.error("[QUICK_REPLY_SAVE_ERROR]", error);
      toast.error(error.response?.data?.message || "Erro ao salvar atalho.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, shortcut: string) => {
    if (!confirm(`Tem certeza que deseja excluir o atalho "${shortcut}"?`)) return;

    try {
      await api.delete(`/quick-replies/${id}`);
      toast.success("Atalho excluído!");
      setReplies((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      console.error("[QUICK_REPLY_DELETE_ERROR]", error);
      toast.error(error.response?.data?.message || "Erro ao excluir atalho.");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Atalho "${text}" copiado!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredReplies = useMemo(() => {
    return replies.filter((r) => {
      const matchesSearch =
        r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
        (r.title && r.title.toLowerCase().includes(search.toLowerCase())) ||
        (r.fileName && r.fileName.toLowerCase().includes(search.toLowerCase())) ||
        r.content.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === "ALL") return true;
      const rType = r.type || "text";
      return rType === categoryFilter;
    });
  }, [replies, search, categoryFilter]);

  const counts = useMemo(() => {
    return {
      all: replies.length,
      text: replies.filter((r) => (r.type || "text") === "text").length,
      document: replies.filter((r) => r.type === "document").length,
      image: replies.filter((r) => r.type === "image").length,
      video: replies.filter((r) => r.type === "video").length,
    };
  }, [replies]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba com Destaque de Google Drive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className={`w-5 h-5 ${accentTextClass}`} />
            Respostas Rápidas & Catálogo de Mídias via Drive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Cadastre atalhos acionados pelo teclado (<span className={`${accentTextClass} font-mono font-bold`}>/</span>) no Inbox.
            Suporta mensagens de texto e envio de <strong>PDFs, catálogos e fotos</strong> hospedados no seu Google Drive, sem consumir espaço no servidor do VERSUS.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenModal(null, "document")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-600/20 transition-all shadow-sm cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            + Novo Catálogo (Drive)
          </button>
          <button
            onClick={() => handleOpenModal(null, "text")}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer ${primaryBtnClass}`}
          >
            <Plus className="w-4 h-4" />
            + Atalho de Texto
          </button>
        </div>
      </div>

      {/* Segmented Filter de Categorias (Scroll Horizontal no Mobile) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setCategoryFilter("ALL")}
          className={`shrink-0 px-3 py-1.5 rounded-lg font-medium transition-all ${
            categoryFilter === "ALL"
              ? `bg-white dark:bg-slate-800 ${accentTextClass} shadow-sm font-bold`
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Todos ({counts.all})
        </button>
        <button
          onClick={() => setCategoryFilter("document")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            categoryFilter === "document"
              ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          PDFs / Catálogos ({counts.document})
        </button>
        <button
          onClick={() => setCategoryFilter("image")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            categoryFilter === "image"
              ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Fotos / Imagens ({counts.image})
        </button>
        <button
          onClick={() => setCategoryFilter("video")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            categoryFilter === "video"
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Vídeos ({counts.video})
        </button>
        <button
          onClick={() => setCategoryFilter("text")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            categoryFilter === "text"
              ? `bg-white dark:bg-slate-800 ${accentTextClass} shadow-sm font-bold`
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Textos Rápidos ({counts.text})
        </button>
      </div>

      {/* Barra de Busca e Contador */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por /atalho, título ou arquivo..."
            className={`w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none transition-colors shadow-sm ${focusBorderClass}`}
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando <span className="text-slate-900 dark:text-white font-bold">{filteredReplies.length}</span> itens
        </div>
      </div>

      {/* Lista de Atalhos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <Loader2 className={`w-8 h-8 animate-spin ${accentTextClass}`} />
          <p className="text-xs font-semibold">Carregando catálogo e atalhos...</p>
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-[#070D1B]/40 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum atalho ou material encontrado</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {search
              ? "Tente buscar por outras palavras-chave ou crie um novo item."
              : "Cadastre catálogos em PDF do Google Drive ou mensagens prontas para agilizar suas vendas no WhatsApp."}
          </p>
          {!search && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => handleOpenModal(null, "document")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-600/20 transition-colors"
              >
                <Cloud className="w-3.5 h-3.5" /> Cadastrar Catálogo Drive
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReplies.map((reply) => {
            const isMedia = reply.type && reply.type !== "text";
            const driveId = reply.mediaDriveId || extractGoogleDriveId(reply.mediaUrl);
            const isDrive = Boolean(driveId || isGoogleDriveUrl(reply.mediaUrl));

            return (
              <div
                key={reply.id}
                className={`p-4 rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                  isWhatsApp ? "hover:border-emerald-500/50" : "hover:border-blue-500/50"
                } dark:hover:border-slate-700`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopy(reply.shortcut, reply.id)}
                        title="Clique para copiar o comando"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-colors ${
                          isWhatsApp
                            ? "bg-emerald-50 dark:bg-emerald-600/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-600/20"
                            : "bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/20"
                        }`}
                      >
                        {reply.shortcut}
                        {copiedId === reply.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>

                      {/* Badge de Tipo */}
                      {reply.type === "document" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                          <FileText className="w-3 h-3" /> PDF / Catálogo
                        </span>
                      )}
                      {reply.type === "image" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                          <ImageIcon className="w-3 h-3" /> Foto / Produto
                        </span>
                      )}
                      {reply.type === "video" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <Video className="w-3 h-3" /> Vídeo
                        </span>
                      )}
                      {(!reply.type || reply.type === "text") && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                          <MessageSquare className="w-3 h-3" /> Texto
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {reply.mediaUrl && (
                        <a
                          href={reply.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir arquivo original no Google Drive"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenModal(reply)}
                        title="Editar atalho"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(reply.id, reply.shortcut)}
                        title="Excluir atalho"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Título do Material */}
                  {reply.title && (
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      {reply.title}
                    </h4>
                  )}

                  {/* Nome do Arquivo no WhatsApp */}
                  {reply.fileName && isMedia && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono break-all">
                      <FileCheck2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{reply.fileName}</span>
                    </div>
                  )}

                  {/* Mensagem / Legenda */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    {isDrive ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Google Drive (Nuvem)
                      </span>
                    ) : (
                      <span>Atalho de Texto</span>
                    )}
                  </span>
                  <span>Acionável via tecla &quot;/&quot; no chat</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição Completo */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isWhatsApp 
                    ? "bg-emerald-50 dark:bg-emerald-600/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                    : "bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
                }`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingReply ? "Editar Atalho / Catálogo" : "Novo Atalho / Catálogo"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Defina o comando rápido e o material que será enviado ao lead.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Seletor de Tipo de Material */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo de Atalho / Material <span className={accentTextClass}>*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "document" })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.type === "document"
                        ? "bg-rose-50 dark:bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-[#070D1B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    <FileText className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">PDF / Catálogo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "image" })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.type === "image"
                        ? "bg-purple-50 dark:bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-[#070D1B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">Foto / Imagem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "video" })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.type === "video"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-[#070D1B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    <Video className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">Vídeo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "text" })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.type === "text"
                        ? (isWhatsApp
                            ? "bg-emerald-50 dark:bg-emerald-600/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm"
                            : "bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-400 font-bold shadow-sm")
                        : "bg-slate-50 dark:bg-[#070D1B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">Texto Rápido</span>
                  </button>
                </div>
              </div>

              {/* Comando de Atalho */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Comando de Atalho <span className={accentTextClass}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                    /
                  </span>
                  <input
                    type="text"
                    required
                    value={form.shortcut}
                    onChange={(e) => setForm({ ...form, shortcut: e.target.value.replace(/[\s\/]/g, "").toLowerCase() })}
                    placeholder="ex: catalogo, tabela-precos, foto-maquina"
                    className={`w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl pl-7 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none font-mono font-bold shadow-sm transition-colors ${focusBorderClass}`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  O atendente acionará digitando <span className={`${accentTextClass} font-mono font-bold`}>/{form.shortcut || "atalho"}</span> no chat.
                </p>
              </div>

              {/* Título do Material */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Título / Identificação do Material {form.type !== "text" && <span className={accentTextClass}>*</span>}
                </label>
                <input
                  type="text"
                  required={form.type !== "text"}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex: Catálogo Oficial Linha Verto 2026"
                  className={`w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none shadow-sm transition-colors ${focusBorderClass}`}
                />
              </div>

              {/* Se for Mídia (Documento, Imagem ou Vídeo) */}
              {form.type !== "text" && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <span>Conexão com Google Drive (Zero Espaço no Servidor)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Link do Arquivo no Google Drive <span className={accentTextClass}>*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={form.mediaUrl}
                      onChange={(e) => handleMediaUrlChange(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                      className={`w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none font-mono shadow-sm transition-colors ${focusBorderClass}`}
                    />
                    {form.mediaUrl && extractGoogleDriveId(form.mediaUrl) && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Arquivo do Google Drive detectado com sucesso (ID: {extractGoogleDriveId(form.mediaUrl)})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Arquivo no WhatsApp <span className="text-slate-400 text-[10px] font-normal">(exibido para o cliente)</span>
                    </label>
                    <input
                      type="text"
                      value={form.fileName}
                      onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                      placeholder={form.type === "document" ? "Catalogo_Verto_2026.pdf" : form.type === "video" ? "video_demonstrativo.mp4" : "foto_produto.jpg"}
                      className={`w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none font-mono shadow-sm transition-colors ${focusBorderClass}`}
                    />
                  </div>
                </div>
              )}

              {/* Mensagem / Legenda */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {form.type === "text" ? "Texto da Mensagem Rápida" : "Legenda que acompanha o Arquivo no WhatsApp"}
                  {form.type === "text" && <span className={accentTextClass}>*</span>}
                </label>
                <textarea
                  rows={form.type === "text" ? 5 : 3}
                  required={form.type === "text"}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={
                    form.type === "text"
                      ? "Digite a mensagem completa que será inserida no chat..."
                      : "ex: Olá! Segue em anexo nosso catálogo oficial completo. Fico à disposição para tirar qualquer dúvida!"
                  }
                  className={`w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none leading-relaxed resize-none shadow-sm transition-colors ${focusBorderClass}`}
                />
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold shadow-lg disabled:opacity-50 transition-all cursor-pointer ${primaryBtnClass}`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {editingReply ? "Salvar Alterações" : "Cadastrar Atalho"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
