"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, Save, X, Network, Loader2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function DepartmentsSettingsTab() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  
  const [form, setForm] = useState({ name: "", color: "#2563eb" });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        api.get('/departments'),
        api.get('/users')
      ]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error) {
      toast.error("Erro ao carregar dados dos departamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (dept: any = null) => {
    if (dept) {
      setEditingDept(dept);
      setForm({ name: dept.name, color: dept.color || "#2563eb" });
      setSelectedUsers(dept.users?.map((u: any) => u.userId) || []);
    } else {
      setEditingDept(null);
      setForm({ name: "", color: "#2563eb" });
      setSelectedUsers([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({ name: "", color: "#2563eb" });
    setEditingDept(null);
    setSelectedUsers([]);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("O nome do departamento é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      let deptId = editingDept?.id;

      if (editingDept) {
        await api.patch(`/departments/${deptId}`, form);
        toast.success("Departamento atualizado!");
      } else {
        const { data } = await api.post('/departments', form);
        deptId = data.id;
        toast.success("Departamento criado com sucesso!");
      }

      if (editingDept) {
        const existingUserIds = editingDept.users?.map((u: any) => u.userId) || [];
        const toRemove = existingUserIds.filter((id: string) => !selectedUsers.includes(id));
        const toAdd = selectedUsers.filter(id => !existingUserIds.includes(id));

        await Promise.all([
          ...toRemove.map((id: string) => api.delete(`/departments/${deptId}/users/${id}`)),
          ...toAdd.map(id => api.post(`/departments/${deptId}/users`, { userId: id }))
        ]);
      } else {
        await Promise.all(selectedUsers.map(id => api.post(`/departments/${deptId}/users`, { userId: id })));
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar departamento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deptId: string, deptName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o setor "${deptName}"? As conversas serão redirecionadas para a fila geral.`)) {
      return;
    }

    try {
      await api.delete(`/departments/${deptId}`);
      toast.success("Departamento excluído!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir departamento.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-semibold">Carregando setores e departamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            Departamentos, Setores e Filas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize seus atendentes em filas especializadas (Comercial, Suporte, Financeiro).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Departamento</span>
        </button>
      </div>

      {/* Grid de Departamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-[#070D1B] rounded-xl border border-slate-800/80">
            Nenhum departamento cadastrado. Crie o primeiro para organizar seus atendimentos.
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color || "#2563eb" }}
                    />
                    <h4 className="text-xs font-bold text-white">{dept.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(dept)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>{dept.users?.length || 0} atendente(s) vinculado(s)</span>
                </div>
              </div>

              {dept.users && dept.users.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                  {dept.users.map((u: any) => (
                    <span
                      key={u.id}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300"
                    >
                      {u.user?.name || "Atendente"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0B1224] border border-slate-700 rounded-2xl shadow-2xl p-6 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingDept ? "Editar Departamento" : "Novo Departamento"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nome do Setor *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Comercial, Suporte N1, Financeiro"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Cor de Identificação</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">{form.color}</span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Atendentes Vinculados ({selectedUsers.length})
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#070D1B] border border-slate-800">
                  {users.length === 0 ? (
                    <span className="text-xs text-slate-500 block text-center p-2">Nenhum atendente disponível.</span>
                  ) : (
                    users.map((u) => {
                      const isSelected = selectedUsers.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUser(u.id)}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? "bg-blue-600/20 text-blue-300 border border-blue-500/30" : "text-slate-300 hover:bg-slate-800/60"
                          }`}
                        >
                          <span>{u.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Setor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
