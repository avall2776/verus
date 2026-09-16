"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, MessageSquare, Save, X, Loader2, Sparkles } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface QuickReply {
  id: string;
  shortcut: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function QuickRepliesSettingsTab() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);

  const [form, setForm] = useState({ shortcut: "", content: "" });

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

  const handleOpenModal = (reply: QuickReply | null = null) => {
    if (reply) {
      setEditingReply(reply);
      setForm({
        shortcut: reply.shortcut.startsWith("/") ? reply.shortcut.substring(1) : reply.shortcut,
        content: reply.content,
      });
    } else {
      setEditingReply(null);
      setForm({ shortcut: "", content: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({ shortcut: "", content: "" });
    setEditingReply(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shortcut.trim() || !form.content.trim()) {
      toast.error("Preencha o atalho e a mensagem.");
      return;
    }

    const formattedShortcut = form.shortcut.startsWith("/")
      ? form.shortcut.trim()
      : `/${form.shortcut.trim()}`;

    setSaving(true);
    try {
      const payload = {
        shortcut: formattedShortcut,
        content: form.content.trim(),
      };

      if (editingReply) {
        await api.patch(`/quick-replies/${editingReply.id}`, payload);
        toast.success("Atalho rápido atualizado!");
      } else {
        await api.post("/quick-replies", payload);
        toast.success("Atalho rápido criado com sucesso!");
      }
      handleCloseModal();
      fetchReplies();
    } catch (error: any) {
      console.error("[QUICK_REPLY_SAVE_ERROR]", error);
      toast.error(error.response?.data?.message || "Erro ao salvar atalho rápido.");
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

  const filteredReplies = replies.filter(
    (r) =>
      r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Respostas Rápidas (Macros)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie atalhos inteligentes (ex: <span className="text-blue-400 font-mono">/pix</span>, <span className="text-blue-400 font-mono">/saudacao</span>) para agilizar o atendimento no Inbox.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Atalho
        </button>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por atalho ou texto..."
            className="w-full bg-[#070D1B] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total de macros: <span className="text-white font-bold">{filteredReplies.length}</span>
        </div>
      </div>

      {/* Lista de Atalhos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">Carregando macros...</p>
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#070D1B]/40 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Nenhum atalho rápido encontrado</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? "Tente buscar por outras palavras-chave ou crie um novo atalho."
              : "Cadastre respostas frequentes para enviar mensagens completas com apenas um comando no chat."}
          </p>
          {!search && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Criar primeiro atalho
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReplies.map((reply) => (
            <div
              key={reply.id}
              className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold">
                    {reply.shortcut}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(reply)}
                      title="Editar atalho"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(reply.id, reply.shortcut)}
                      title="Excluir atalho"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {reply.content}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500">
                <span>Atalho de teclado rápido</span>
                <span>Disponível no Inbox</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingReply ? "Editar Atalho Rápido" : "Novo Atalho Rápido"}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Atalho de comando <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-bold">
                    /
                  </span>
                  <input
                    type="text"
                    required
                    value={form.shortcut}
                    onChange={(e) => setForm({ ...form, shortcut: e.target.value.replace(/[\s\/]/g, "") })}
                    placeholder="ex: pix, boleto, suporte"
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-xl pl-7 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Digite apenas a palavra-chave. A barra <span className="text-slate-400 font-mono">/</span> será inserida automaticamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Texto da Resposta <span className="text-blue-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Digite a mensagem completa que será inserida no chat..."
                  className="w-full bg-[#070D1B] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Salvar Atalho
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
