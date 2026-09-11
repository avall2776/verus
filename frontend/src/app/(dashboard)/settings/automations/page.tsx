"use client";

import { useState } from "react";
import { Zap, Plus, Trash2, Edit3, X, Save, Clock, Tag, MessageSquare, ArrowRightLeft, GitMerge } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function AutomationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    triggerType: "NEW_CONVERSATION",
    conditions: {},
    actionType: "SEND_MESSAGE",
    actionData: {},
  });

  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const res = await api.get('/automations');
      return res.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/automations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setShowModal(false);
      toast.success("Automação criada!");
    },
    onError: () => toast.error("Erro ao criar automação")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/automations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success("Removida!");
    }
  });

  const handleSave = () => {
    if (!formData.name) return toast.error("Nome obrigatório");
    createMutation.mutate(formData);
  };

  const getTriggerIcon = (type: string) => {
    switch(type) {
      case 'INACTIVITY': return <Clock size={16} />;
      case 'TAG_ADDED': return <Tag size={16} />;
      case 'STAGE_CHANGED': return <GitMerge size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const getActionIcon = (type: string) => {
    switch(type) {
      case 'ADD_TAG': return <Tag size={16} />;
      case 'TRANSFER': return <ArrowRightLeft size={16} />;
      case 'MOVE_STAGE': return <GitMerge size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="flex-1 bg-background p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Zap className="text-primary" size={28} />
              Automações & Gatilhos
            </h1>
            <p className="text-gray-400 mt-2">Crie regras inteligentes para engajar clientes e mover negócios automaticamente.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ name: "", triggerType: "NEW_CONVERSATION", conditions: {}, actionType: "SEND_MESSAGE", actionData: {} });
              setShowModal(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-[0_0_20px_rgba(0,85,255,0.3)] flex items-center gap-2"
          >
            <Plus size={18} /> Nova Automação
          </button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <p className="text-gray-500">Carregando automações...</p>
          ) : automations.length === 0 ? (
            <div className="col-span-full bg-[#1c1d22] border border-gray-800 p-8 rounded-xl text-center">
              <Zap size={40} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma automação configurada.</p>
            </div>
          ) : (
            automations.map((auto: any) => (
              <div key={auto.id} className="bg-[#1c1d22] border border-gray-800 p-5 rounded-xl flex flex-col gap-4 relative group">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-lg">{auto.name}</h3>
                  <button onClick={() => deleteMutation.mutate(auto.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
                    <span className="font-bold text-white w-16">QUANDO</span>
                    {getTriggerIcon(auto.triggerType)}
                    {auto.triggerType === 'INACTIVITY' && <span>Cliente inativo por {auto.conditions?.timeoutMinutes || 60} min</span>}
                    {auto.triggerType === 'TAG_ADDED' && <span>Tag '{auto.conditions?.tag}' adicionada</span>}
                    {auto.triggerType === 'STAGE_CHANGED' && <span>Movido para '{auto.conditions?.stage}'</span>}
                    {auto.triggerType === 'NEW_CONVERSATION' && <span>Nova Conversa Iniciada</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-primary/10 p-2 rounded-lg border border-primary/20">
                    <span className="font-bold text-primary w-16">FAZER</span>
                    {getActionIcon(auto.actionType)}
                    {auto.actionType === 'SEND_MESSAGE' && <span className="truncate">Enviar: "{auto.actionData?.message}"</span>}
                    {auto.actionType === 'ADD_TAG' && <span>Adicionar tag '{auto.actionData?.tag}'</span>}
                    {auto.actionType === 'TRANSFER' && <span>Transferir departamento</span>}
                    {auto.actionType === 'MOVE_STAGE' && <span>Mover para '{auto.actionData?.stage}'</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nova Automação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#25262c] rounded-t-xl shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Criar Automação (IF/THEN)
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Regra</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Mensagem de Boas-vindas"
                />
              </div>

              {/* GATILHO */}
              <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2"><span className="bg-gray-700 text-xs px-2 py-0.5 rounded">1</span> QUANDO (Gatilho)</h3>
                <select 
                  value={formData.triggerType}
                  onChange={e => setFormData({...formData, triggerType: e.target.value, conditions: {}})}
                  className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white outline-none focus:border-primary transition-colors"
                >
                  <option value="NEW_CONVERSATION">Nova Conversa Iniciada</option>
                  <option value="TAG_ADDED">Tag Adicionada</option>
                  <option value="STAGE_CHANGED">Etapa do Funil Alterada</option>
                  <option value="INACTIVITY">Tempo de Inatividade (Sem Resposta)</option>
                </select>

                {formData.triggerType === 'INACTIVITY' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tempo de Inatividade (minutos)</label>
                    <input type="number" className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.conditions?.timeoutMinutes || ''} onChange={e => setFormData({...formData, conditions: { timeoutMinutes: parseInt(e.target.value) }})} placeholder="Ex: 60" />
                  </div>
                )}
                {formData.triggerType === 'TAG_ADDED' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome da Tag Exata</label>
                    <input type="text" className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.conditions?.tag || ''} onChange={e => setFormData({...formData, conditions: { tag: e.target.value }})} placeholder="Ex: Urgente" />
                  </div>
                )}
                {formData.triggerType === 'STAGE_CHANGED' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome da Etapa do Funil</label>
                    <input type="text" className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.conditions?.stage || ''} onChange={e => setFormData({...formData, conditions: { stage: e.target.value }})} placeholder="Ex: Negociação" />
                  </div>
                )}
              </div>

              {/* AÇÃO */}
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-4">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2"><span className="bg-primary text-white text-xs px-2 py-0.5 rounded">2</span> FAÇA (Ação)</h3>
                <select 
                  value={formData.actionType}
                  onChange={e => setFormData({...formData, actionType: e.target.value, actionData: {}})}
                  className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white outline-none focus:border-primary transition-colors"
                >
                  <option value="SEND_MESSAGE">Enviar Mensagem (WhatsApp)</option>
                  <option value="ADD_TAG">Adicionar Tag ao Contato</option>
                  <option value="TRANSFER">Transferir p/ Departamento</option>
                  <option value="MOVE_STAGE">Mover Etapa no Funil</option>
                </select>

                {formData.actionType === 'SEND_MESSAGE' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Conteúdo da Mensagem (use {'{{nome}}'} para variável)</label>
                    <textarea rows={3} className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.actionData?.message || ''} onChange={e => setFormData({...formData, actionData: { message: e.target.value }})} placeholder="Olá {{nome}}, tudo bem?" />
                  </div>
                )}
                {formData.actionType === 'ADD_TAG' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tag a Adicionar</label>
                    <input type="text" className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.actionData?.tag || ''} onChange={e => setFormData({...formData, actionData: { tag: e.target.value }})} placeholder="Ex: VIP" />
                  </div>
                )}
                {formData.actionType === 'TRANSFER' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Selecione o Departamento</label>
                    <select className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.actionData?.departmentId || ''} onChange={e => setFormData({...formData, actionData: { departmentId: e.target.value }})}>
                      <option value="">Selecione...</option>
                      {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                {formData.actionType === 'MOVE_STAGE' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nova Etapa Exata</label>
                    <input type="text" className="w-full bg-[#0B1224] border border-gray-700/50 rounded-lg px-4 py-2 text-white" value={formData.actionData?.stage || ''} onChange={e => setFormData({...formData, actionData: { stage: e.target.value }})} placeholder="Ex: Ganho" />
                  </div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold transition-colors">Cancelar</button>
              <button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2">
                <Save size={18} /> Salvar Automação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
