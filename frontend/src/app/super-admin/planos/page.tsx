"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Save, 
  Plus, 
  Loader2, 
  Sparkles, 
  Users, 
  Bot, 
  MessageSquare, 
  RefreshCw, 
  DollarSign,
  CheckCircle2,
  X
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Modal / Inline de Criação de Plano
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("299.00");
  const [newMaxUsers, setNewMaxUsers] = useState("3");
  const [newMaxAIMsgs, setNewMaxAIMsgs] = useState("2000");
  const [newHasCRM, setNewHasCRM] = useState(true);
  const [newHasWhatsApp, setNewHasWhatsApp] = useState(true);
  const [newHasInstagram, setNewHasInstagram] = useState(false);
  const [newHasAIAgent, setNewHasAIAgent] = useState(true);
  const [creatingLoading, setCreatingLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenants/plans/list");
      setPlans(res.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleFeature = (planId: string, featureKey: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          [featureKey]: !plan[featureKey]
        };
      }
      return plan;
    }));
  };

  const handleUpdateLimit = (planId: string, field: string, value: any) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          [field]: value
        };
      }
      return plan;
    }));
  };

  const handleSavePlan = async (plan: any) => {
    setSavingId(plan.id);
    try {
      await api.patch(`/tenants/plans/${plan.id}`, {
        name: plan.name,
        price: parseFloat(plan.price),
        hasCRM: plan.hasCRM,
        hasWhatsApp: plan.hasWhatsApp,
        hasInstagram: plan.hasInstagram,
        hasAIAgent: plan.hasAIAgent,
        maxUsers: parseInt(plan.maxUsers, 10),
        maxAIMsgs: parseInt(plan.maxAIMsgs, 10),
      });
      toast.success(`Plano "${plan.name}" salvo com sucesso!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao salvar alterações no plano.");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) {
      toast.error("Informe o nome do plano.");
      return;
    }

    const price = parseFloat(newPlanPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Informe um preço mensal válido.");
      return;
    }

    setCreatingLoading(true);
    try {
      const res = await api.post("/tenants/plans", {
        name: newPlanName.trim(),
        price,
        maxUsers: parseInt(newMaxUsers, 10) || 1,
        maxAIMsgs: parseInt(newMaxAIMsgs, 10) || 0,
        hasCRM: newHasCRM,
        hasWhatsApp: newHasWhatsApp,
        hasInstagram: newHasInstagram,
        hasAIAgent: newHasAIAgent,
      });

      toast.success(`Plano "${res.data.name}" criado com sucesso!`);
      setIsCreating(false);
      setNewPlanName("");
      fetchPlans();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao criar novo plano.");
    } finally {
      setCreatingLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-400" />
            <span>Matriz de Planos & Permissões</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure os recursos contratados, limites de usuários e cotas de IA para cada nível de assinatura.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Criar Novo Plano</span>
          </button>

          <button
            onClick={fetchPlans}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-400" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de Impacto */}
      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <ShieldAlert size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300 leading-relaxed">
          <strong className="block text-white mb-0.5">Impacto Estratégico em Tempo Real:</strong>
          As permissões e limites definidos aqui governam diretamente o que os operadores das empresas clientes conseguem visualizar e utilizar no CRM.
        </div>
      </div>

      {/* Modal/Formulário de Criação de Novo Plano */}
      {isCreating && (
        <form onSubmit={handleCreatePlan} className="p-5 rounded-2xl bg-[#0B1224] border border-blue-500/40 space-y-4 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white">Criar Novo Nível de Assinatura</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Nome do Plano *</label>
              <input
                type="text"
                required
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Ex: Start, Enterprise Plus"
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Valor Mensal (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                placeholder="Ex: 199.90"
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Máx. Usuários (Operadores)</label>
              <input
                type="number"
                value={newMaxUsers}
                onChange={(e) => setNewMaxUsers(e.target.value)}
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">Cota Mensal de Mensagens IA</label>
              <input
                type="number"
                value={newMaxAIMsgs}
                onChange={(e) => setNewMaxAIMsgs(e.target.value)}
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Módulos Habilitados:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHasCRM}
                  onChange={(e) => setNewHasCRM(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Funil Comercial CRM</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHasWhatsApp}
                  onChange={(e) => setNewHasWhatsApp(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>WhatsApp Oficial</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHasAIAgent}
                  onChange={(e) => setNewHasAIAgent(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Agente IA Vitor</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#070D1B] border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHasInstagram}
                  onChange={(e) => setNewHasInstagram(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Instagram Direct</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creatingLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
            >
              {creatingLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Salvar Novo Plano</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Planos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-xs font-medium">Carregando matriz de planos...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-[#0B1224] border border-slate-800 rounded-2xl text-slate-400 text-xs">
          Nenhum plano cadastrado no sistema. Clique em &quot;Criar Novo Plano&quot; para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all hover:border-slate-700 relative"
            >
              <div>
                {/* Header do Card */}
                <div className="border-b border-slate-800 pb-4 mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide">{plan.name}</h2>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-black text-blue-400">R$ {Number(plan.price).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">/mês</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {plan.maxUsers} {plan.maxUsers === 1 ? "usuário" : "usuários"}
                  </span>
                </div>

                {/* Módulos do Sistema */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Módulos Liberados
                  </h3>

                  <div className="space-y-2">
                    {[
                      { key: "hasCRM", label: "Acesso ao Funil CRM" },
                      { key: "hasWhatsApp", label: "Conexão WhatsApp" },
                      { key: "hasAIAgent", label: "Agente IA (Vitor)" },
                      { key: "hasInstagram", label: "Integração Instagram" },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between p-2 rounded-lg bg-[#070D1B] border border-slate-800/80">
                        <span className="text-xs text-slate-300 font-medium">{feature.label}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(plan.id, feature.key)}
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            plan[feature.key] ? "bg-blue-600" : "bg-slate-800"
                          }`}
                        >
                          <div 
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                              plan[feature.key] ? "left-4.5" : "left-0.5"
                            }`} 
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limites Numéricos */}
                <div className="space-y-3 border-t border-slate-800 pt-4 mt-4">
                  <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Limites de Consumo
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 block">Máx. Usuários</label>
                      <input
                        type="number"
                        value={plan.maxUsers}
                        onChange={(e) => handleUpdateLimit(plan.id, "maxUsers", parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 block">Cota Mensagens IA</label>
                      <input
                        type="number"
                        value={plan.maxAIMsgs}
                        onChange={(e) => handleUpdateLimit(plan.id, "maxAIMsgs", parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ação Salvar Card */}
              <div className="pt-5 mt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  disabled={savingId === plan.id}
                  onClick={() => handleSavePlan(plan)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingId === plan.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
