"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, MessageSquare, Save, X } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function QuickRepliesSettings() {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<any | null>(null);
  
  const [form, setForm] = useState({ shortcut: "", content: "" });

  const fetchReplies = async () => {
    try {
      const { data } = await api.get('/quick-replies');
      setReplies(data);
    } catch (error) {
      toast.error("Erro ao carregar atalhos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, []);

  const handleOpenModal = (reply: any = null) => {
    if (reply) {
      setEditingReply(reply);
      setForm({ shortcut: reply.shortcut.replace('/', ''), content: reply.content });
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

  const handleSave = async () => {
    if (!form.shortcut.trim() || !form.content.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      if (editingReply) {
        await api.patch(`/quick-replies/${editingReply.id}`, form);
        toast.success("Macro atualizada!");
      } else {
        await api.post('/quick-replies', form);
        toast.success("Macro criada com sucesso!");
      }
      handleCloseModal();
      fetchReplies();
    } catch (error) {
      toast.error("Erro ao salvar macro.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este atalho?")) return;
    
    try {
      await api.delete(`/quick-replies/${id}`);
      toast.success("Excluído com sucesso!");
      fetchReplies();
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const filteredReplies = replies.filter(r => 
    r.shortcut.toLowerCase().includes(search.toLowerCase()) || 
    r.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="text-primary" /> 
            Respostas Rápidas (Macros)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Crie atalhos de teclado (ex: /pix) para agilizar o atendimento no Inbox.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)]"
        >
          <Plus size={18} /> Novo Atalho
        </button>
      </div>

      <div className="bg-panel border border-gray-800 rounded-xl p-4 flex-1 flex flex-col min-h-0">
        
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar atalhos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c1d22] border border-gray-800 rounded-lg pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Carregando macros...</div>
          ) : filteredReplies.length === 0 ? (
            <div className="text-center text-gray-500 py-10">Nenhum atalho encontrado.</div>
          ) : (
            filteredReplies.map((reply) => (
              <div key={reply.id} className="bg-[#1c1d22] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-blue-500/10 text-blue-400 font-mono text-sm px-2 py-0.5 rounded font-bold border border-blue-500/20">
                      {reply.shortcut}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{reply.content}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleOpenModal(reply)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(reply.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-lg rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#25262c] rounded-t-xl">
              <h2 className="text-lg font-bold text-white">
                {editingReply ? "Editar Atalho" : "Novo Atalho"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comando de Atalho</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono font-bold">/</span>
                  <input 
                    type="text" 
                    value={form.shortcut}
                    onChange={(e) => setForm({ ...form, shortcut: e.target.value.replace(/\s+/g, '').replace('/', '') })}
                    placeholder="pix"
                    className="w-full bg-[#25262c] border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-sm text-white outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Não use espaços. O sistema adicionará a barra automaticamente.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mensagem (Conteúdo)</label>
                <textarea 
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Digite a mensagem completa..."
                  rows={6}
                  className="w-full bg-[#25262c] border border-gray-700 rounded-lg p-4 text-sm text-white outline-none focus:border-primary resize-none custom-scrollbar"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-[#25262c] rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,85,255,0.3)] transition-all"
              >
                <Save size={16} /> Salvar Macro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
