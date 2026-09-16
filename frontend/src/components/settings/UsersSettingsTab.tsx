"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Shield, User, Loader2, X, Check, Mail, Lock } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function UsersSettingsTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form de novo usuário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "AGENT">("AGENT");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("[USERS_FETCH_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao carregar equipe de usuários.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/users", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        role,
      });

      toast.success("Usuário adicionado com sucesso!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("AGENT");
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("[CREATE_USER_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao cadastrar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${userName}" da empresa?`)) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success("Usuário removido com sucesso!");
      fetchUsers();
    } catch (err: any) {
      console.error("[DELETE_USER_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao remover usuário.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-semibold">Carregando lista de colaboradores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Equipe e Gestão de Acessos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os atendentes e administradores que operam a plataforma VERSUS.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Convidar Membro</span>
        </button>
      </div>

      {/* Lista de Usuários */}
      <div className="rounded-xl bg-[#070D1B] border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60">
        {users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum colaborador cadastrado além do administrador principal.
          </div>
        ) : (
          users.map((u) => {
            const isAdmin = u.role === "ADMIN" || u.role === "SUPER_ADMIN";
            return (
              <div key={u.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{u.name?.charAt(0).toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{u.name}</h4>
                      {u.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online no sistema" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      isAdmin
                        ? "bg-blue-600/10 text-blue-300 border-blue-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {isAdmin ? <Shield className="w-3 h-3 text-blue-400" /> : <User className="w-3 h-3 text-slate-400" />}
                    {isAdmin ? "Administrador" : "Atendente"}
                  </span>

                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Remover usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Convidar / Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0B1224] border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Adicionar Novo Membro</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">E-mail Corporativo *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@suaempresa.com.br"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Senha Provisória</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Padrão: Versus@123"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500">Deixe em branco para usar a senha padrão segura.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Perfil de Acesso *</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRole("AGENT")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === "AGENT"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Atendente
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === "ADMIN"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Administrador
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Confirmar e Criar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
