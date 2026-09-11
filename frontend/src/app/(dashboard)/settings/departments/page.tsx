"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Users, Save, X, Network } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function DepartmentsSettings() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  
  const [form, setForm] = useState({ name: "", color: "#2563eb" });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        api.get('/departments'),
        api.get('/users') // Assumindo que existe endpoint para listar usuarios da empresa
      ]);
      setDepartments(deptRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
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
      setSelectedUsers(dept.users.map((u: any) => u.userId));
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

      // Sync Users (a bit naive, but works for admin)
      if (editingDept) {
        // Find users to remove
        const existingUserIds = editingDept.users.map((u: any) => u.userId);
        const toRemove = existingUserIds.filter((id: string) => !selectedUsers.includes(id));
        const toAdd = selectedUsers.filter(id => !existingUserIds.includes(id));

        await Promise.all([
          ...toRemove.map((id: string) => api.delete(`/departments/${deptId}/users/${id}`)),
          ...toAdd.map(id => api.post(`/departments/${deptId}/users`, { userId: id }))
        ]);
      } else {
        // Brand new, just add all
        await Promise.all(selectedUsers.map(id => api.post(`/departments/${deptId}/users`, { userId: id })));
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar departamento.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este departamento? Todos os chats associados perderão essa atribuição.")) return;
    
    try {
      await api.delete(`/departments/${id}`);
      toast.success("Excluído com sucesso!");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Network className="text-primary" /> 
            Departamentos e Filas
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Organize sua equipe em setores (Vendas, Suporte) para rotear atendimentos.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)]"
        >
          <Plus size={18} /> Novo Departamento
        </button>
      </div>

      <div className="bg-panel border border-gray-800 rounded-xl p-4 flex-1 flex flex-col min-h-0">
        
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar departamentos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c1d22] border border-gray-800 rounded-lg pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Carregando...</div>
          ) : filteredDepts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">Nenhum departamento encontrado.</div>
          ) : (
            filteredDepts.map((dept) => (
              <div key={dept.id} className="bg-[#1c1d22] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-700 transition-colors">
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${dept.color}20`, border: `1px solid ${dept.color}40` }}>
                    <Network size={20} style={{ color: dept.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{dept.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Users size={12} /> {dept.users?.length || 0} membro(s) vinculados
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleOpenModal(dept)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(dept.id)}
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
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-lg rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#25262c] rounded-t-xl shrink-0">
              <h2 className="text-lg font-bold text-white">
                {editingDept ? "Editar Departamento" : "Novo Departamento"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nome do Departamento</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Vendas"
                  className="w-full bg-[#25262c] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cor de Identificação</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-sm font-mono text-gray-300">{form.color}</span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Membros da Equipe</label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {users.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Nenhum usuário cadastrado.</p>
                  ) : (
                    users.map(user => (
                      <label key={user.id} className="flex items-center justify-between bg-[#25262c] border border-gray-800 rounded-lg p-3 cursor-pointer hover:border-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                          className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-900"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-[#25262c] rounded-b-xl flex justify-end gap-3 shrink-0">
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
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
