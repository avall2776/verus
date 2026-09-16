"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  User,
  Loader2,
  X,
  Check,
  Mail,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  avatarUrl?: string;
  isOnline?: boolean;
  createdAt?: string;
}

export default function UsersSettingsTab() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Convidar / Novo Usuário
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "AGENT">("AGENT");

  // Modal de Edição de Usuário
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "AGENT">("AGENT");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");

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

  const handleOpenInviteModal = () => {
    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("AGENT");
    setIsInviteModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Preencha o nome e e-mail do colaborador.");
      return;
    }

    setSubmittingInvite(true);
    try {
      const res = await api.post("/users", {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        password: invitePassword.trim() || undefined,
        role: inviteRole,
      });

      toast.success(res.data?.message || "Membro convidado com sucesso!");
      setIsInviteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("[CREATE_USER_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao convidar usuário.");
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleOpenEditModal = (u: UserItem) => {
    setEditingUserId(u.id);
    setEditName(u.name || "");
    setEditRole(u.role === "ADMIN" ? "ADMIN" : "AGENT");
    setEditIsActive(u.isActive !== false);
    setEditPassword("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editName.trim()) {
      toast.error("O nome do membro é obrigatório.");
      return;
    }

    setSubmittingEdit(true);
    try {
      const payload: any = {
        name: editName.trim(),
        role: editRole,
        isActive: editIsActive,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await api.patch(`/users/${editingUserId}`, payload);
      toast.success(res.data?.message || "Membro atualizado com sucesso!");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("[EDIT_USER_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao atualizar membro.");
    } finally {
      setSubmittingEdit(false);
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
          onClick={handleOpenInviteModal}
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
            const isActive = u.isActive !== false;

            return (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden relative">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{u.name?.charAt(0).toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{u.name}</h4>
                      {u.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online no sistema" />
                      )}
                      {isActive ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
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

                  {/* Botão de Edição */}
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                    title="Editar membro da equipe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Botão de Exclusão */}
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
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0B1224] border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Convidar Novo Membro</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
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
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">E-mail Corporativo *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="carlos@suaempresa.com.br"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Senha Provisória</label>
                <input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Padrão: Versus@123"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Deixe em branco para usar a senha padrão segura (Versus@123).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Perfil de Acesso *</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setInviteRole("AGENT")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      inviteRole === "AGENT"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Atendente
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteRole("ADMIN")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      inviteRole === "ADMIN"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Administrador
                  </button>
                </div>
              </div>

              {/* Aviso de Disparo SMTP Real */}
              <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-300">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Disparo Automático de Convite</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    O convite corporativo com o link de acesso e credenciais provisórias será disparado através do servidor de e-mail conectado (SMTP) da sua empresa.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingInvite ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando Convite...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Convidar e Enviar E-mail</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0B1224] border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Editar Membro da Equipe</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nome Completo *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Cargo / Função *</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditRole("AGENT")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      editRole === "AGENT"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Atendente
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole("ADMIN")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      editRole === "ADMIN"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Administrador
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Status de Acesso *</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditIsActive(true)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      editIsActive
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ativo
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsActive(false)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      !editIsActive
                        ? "bg-rose-600/20 border-rose-500 text-rose-300"
                        : "bg-[#070D1B] border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Inativo
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Redefinir Senha (Opcional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Preencha apenas se desejar atribuir uma nova senha para este operador.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Alterações</span>
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
