"use client";

import { useState, useEffect } from "react";
import { Play, Zap, Plus, Settings2, Trash2, CheckCircle2, XCircle, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Automation {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: string;
  conditions: any;
  actions: any[];
}

interface AutomationLog {
  id: string;
  automation: Automation;
  contact?: { name: string };
  status: string;
  error?: string;
  executedAt: string;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'logs'>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Builder State
  const [newName, setNewName] = useState("");
  const [triggerType, setTriggerType] = useState("NEW_CONVERSATION");
  const [conditions, setConditions] = useState<any>({});
  const [actionType, setActionType] = useState("SEND_MESSAGE");
  const [actionData, setActionData] = useState<any>({ message: "Olá {{nome}}, logo iremos te atender!" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [autoRes, logsRes] = await Promise.all([
        axios.get('http://localhost:3001/automations', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3001/automations/logs', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAutomations(autoRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar automações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:3001/automations/${id}/toggle`, { isActive: !current }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutomations(automations.map(a => a.id === id ? { ...a, isActive: !current } : a));
      toast.success(current ? "Automação desativada" : "Automação ativada");
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta automação?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/automations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutomations(automations.filter(a => a.id !== id));
      toast.success("Automação excluída com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir automação");
    }
  };

  const handleSave = async () => {
    if (!newName) return toast.error("Dê um nome para a automação.");
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: newName,
        triggerType,
        conditions,
        actions: [{ type: actionType, ...actionData }]
      };
      const res = await axios.post('http://localhost:3001/automations', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutomations([res.data, ...automations]);
      setIsCreating(false);
      resetBuilder();
      toast.success("Automação criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar automação");
    }
  };

  const resetBuilder = () => {
    setNewName("");
    setTriggerType("NEW_CONVERSATION");
    setConditions({});
    setActionType("SEND_MESSAGE");
    setActionData({ message: "Olá {{nome}}, logo iremos te atender!" });
  };

  const getTriggerLabel = (type: string) => {
    const map: Record<string, string> = {
      INACTIVITY_TIMEOUT: "Lead ficar inativo",
      DEAL_STAGE_CHANGED: "Etapa do Funil alterada",
      TAG_ADDED: "Tag adicionada",
      NEW_CONVERSATION: "Nova conversa iniciada"
    };
    return map[type] || type;
  };

  const getActionLabel = (act: any) => {
    if (act.type === 'SEND_MESSAGE') return `Enviar WhatsApp: "${act.message.substring(0, 20)}..."`;
    if (act.type === 'TRANSFER') return `Transferir para fila ${act.departmentId}`;
    if (act.type === 'ADD_TAG') return `Adicionar tag: ${act.tag}`;
    if (act.type === 'MOVE_STAGE') return `Mover para etapa: ${act.stage}`;
    return act.type;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050A15]">
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#0B1224] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Zap className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Motor de Automações</h1>
            <p className="text-sm text-gray-400">Construa workflows para reduzir o trabalho manual</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#050A15] p-1 rounded-lg border border-gray-800 flex items-center">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'list' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Minhas Regras
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'logs' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Histórico (Logs)
            </button>
          </div>
          {activeTab === 'list' && (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Plus size={16} />
              Nova Automação
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        {isCreating ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings2 className="text-blue-400" />
                Criador de Workflow
              </h2>
              <button onClick={() => { setIsCreating(false); resetBuilder(); }} className="text-gray-400 hover:text-white text-sm font-medium">Cancelar</button>
            </div>

            <div className="space-y-6">
              {/* NOME */}
              <div className="bg-[#0B1224] border border-gray-800 rounded-xl p-6">
                <label className="block text-sm font-bold text-white mb-2">Nome da Regra</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Mensagem de Boas-Vindas"
                  className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-medium"
                />
              </div>

              {/* BLOCO 1: QUANDO (Trigger) */}
              <div className="bg-[#0B1224] border border-blue-500/30 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                  <h3 className="text-lg font-bold text-white">QUANDO (Gatilho)</h3>
                </div>
                <select 
                  value={triggerType}
                  onChange={(e) => {
                    setTriggerType(e.target.value);
                    if (e.target.value === 'INACTIVITY_TIMEOUT') setConditions({ timeoutMinutes: 60 });
                    else if (e.target.value === 'DEAL_STAGE_CHANGED') setConditions({ stage: 'ganho' });
                    else if (e.target.value === 'TAG_ADDED') setConditions({ tag: 'vip' });
                    else setConditions({});
                  }}
                  className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="NEW_CONVERSATION">Nova conversa iniciada pelo contato</option>
                  <option value="INACTIVITY_TIMEOUT">Lead ficar inativo por X tempo</option>
                  <option value="DEAL_STAGE_CHANGED">Card do CRM for arrastado para etapa</option>
                  <option value="TAG_ADDED">Nova tag adicionada ao contato</option>
                </select>
              </div>

              {/* BLOCO 2: SE (Condition) */}
              {Object.keys(conditions).length > 0 && (
                <div className="bg-[#0B1224] border border-yellow-500/30 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">2</div>
                    <h3 className="text-lg font-bold text-white">SE (Condição)</h3>
                  </div>
                  
                  {triggerType === 'INACTIVITY_TIMEOUT' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Minutos de inatividade aguardando resposta:</label>
                      <input 
                        type="number" 
                        value={conditions.timeoutMinutes || 60}
                        onChange={(e) => setConditions({ timeoutMinutes: parseInt(e.target.value) })}
                        className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  )}

                  {triggerType === 'DEAL_STAGE_CHANGED' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">ID ou Nome da Etapa de destino:</label>
                      <input 
                        type="text" 
                        value={conditions.stage || ''}
                        onChange={(e) => setConditions({ stage: e.target.value })}
                        className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  )}

                  {triggerType === 'TAG_ADDED' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Tag exata:</label>
                      <input 
                        type="text" 
                        value={conditions.tag || ''}
                        onChange={(e) => setConditions({ tag: e.target.value })}
                        className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* BLOCO 3: ENTÃO (Action) */}
              <div className="bg-[#0B1224] border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</div>
                  <h3 className="text-lg font-bold text-white">ENTÃO (Ação)</h3>
                </div>
                <div className="space-y-4">
                  <select 
                    value={actionType}
                    onChange={(e) => {
                      setActionType(e.target.value);
                      if (e.target.value === 'SEND_MESSAGE') setActionData({ message: "Sua mensagem aqui..." });
                      else if (e.target.value === 'TRANSFER') setActionData({ departmentId: "id-da-fila" });
                      else if (e.target.value === 'ADD_TAG') setActionData({ tag: "vip" });
                    }}
                    className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="SEND_MESSAGE">Disparar Mensagem no WhatsApp</option>
                    <option value="TRANSFER">Transferir para Departamento</option>
                    <option value="ADD_TAG">Adicionar Tag no Contato</option>
                  </select>

                  {actionType === 'SEND_MESSAGE' && (
                    <textarea 
                      value={actionData.message || ''}
                      onChange={(e) => setActionData({ message: e.target.value })}
                      placeholder="Ex: Olá {{nome}}, tudo bem?"
                      rows={3}
                      className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  )}

                  {actionType === 'TRANSFER' && (
                    <input 
                      type="text"
                      value={actionData.departmentId || ''}
                      onChange={(e) => setActionData({ departmentId: e.target.value })}
                      placeholder="ID do Departamento"
                      className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  )}

                  {actionType === 'ADD_TAG' && (
                    <input 
                      type="text"
                      value={actionData.tag || ''}
                      onChange={(e) => setActionData({ tag: e.target.value })}
                      placeholder="Nome da Tag"
                      className="w-full bg-[#050A15] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <Play size={18} fill="currentColor" />
                  Salvar e Ativar Automação
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'list' ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
               <div className="col-span-full text-center text-gray-500 py-10">Carregando automações...</div>
            ) : automations.length === 0 ? (
               <div className="col-span-full text-center text-gray-500 py-20 bg-[#0B1224] rounded-2xl border border-gray-800 border-dashed">
                 Nenhuma automação configurada.
               </div>
            ) : automations.map(auto => (
              <div key={auto.id} className="bg-[#0B1224] border border-gray-800 rounded-xl p-6 flex flex-col relative overflow-hidden group">
                <div className={`absolute left-0 top-0 w-1 h-full ${auto.isActive ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="pl-3">
                    <h3 className="text-lg font-bold text-white mb-1">{auto.name}</h3>
                    <p className="text-xs text-gray-500">Criado em: {new Date(auto.createdAt).toLocaleDateString()}</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={auto.isActive}
                        onChange={() => handleToggle(auto.id, auto.isActive)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${auto.isActive ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${auto.isActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="bg-[#050A15] rounded-lg p-4 border border-gray-800/50 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</div>
                    <p className="text-sm text-gray-300"><span className="text-gray-500">Quando:</span> {getTriggerLabel(auto.triggerType)}</p>
                  </div>
                  
                  {Object.keys(auto.conditions || {}).length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">S</div>
                      <p className="text-sm text-gray-300"><span className="text-gray-500">Se:</span> {JSON.stringify(auto.conditions)}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">E</div>
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">Então:</span> {auto.actions?.length > 0 ? getActionLabel(auto.actions[0]) : 'Nenhuma'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(auto.id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-[#0B1224] rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-[#050A15]/50 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Histórico de Execuções (Logs)
              </h3>
            </div>
            <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma execução registrada.</div>
              ) : logs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    ) : (
                      <XCircle className="text-red-500 shrink-0" size={20} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{log.automation.name}</span>
                        <ArrowRight size={12} className="text-gray-600" />
                        <span className="text-sm text-gray-300">{log.contact?.name || 'Sistema'}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(log.executedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {log.error && (
                    <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1 rounded-md text-xs">
                      <ShieldAlert size={12} />
                      <span className="truncate max-w-[200px]">{log.error}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
