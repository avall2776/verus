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
  X,
  Kanban,
  Mail,
  BarChart3,
  Target,
  FileText,
  Zap,
  LifeBuoy,
  MessagesSquare,
  Check
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface SystemModule {
  key: string;
  name: string;
  desc: string;
}

const ALL_SYSTEM_MODULES: SystemModule[] = [
  {
    key: "crm",
    name: "Funil Comercial (CRM)",
    desc: "Pipeline comercial Kanban, gestão de oportunidades e etapas de vendas",
  },
  {
    key: "whatsapp",
    name: "Conexão WhatsApp & Disparos",
    desc: "Instância WhatsApp oficial, QR Code, webhooks e disparos em massa",
  },
  {
    key: "aiAgent",
    name: "Agente de IA (Vitor / Automação)",
    desc: "Atendimento autônomo com LLM treinado com inteligência de negócio",
  },
  {
    key: "emailInbox",
    name: "Inbox de E-mail Unificado Enterprise",
    desc: "Sincronização SMTP/IMAP, leitura e resposta centralizada pelo painel",
  },
  {
    key: "analytics",
    name: "Analytics Avançado (PRO)",
    desc: "Relatórios preditivos, taxas de conversão por canal e métricas em tempo real",
  },
  {
    key: "goals",
    name: "Metas Comerciais & Leaderboard",
    desc: "Metas individuais e em equipe com ranking de performance e produtividade",
  },
  {
    key: "proposalsContracts",
    name: "Propostas Comerciais & Contratos Digitais",
    desc: "Gerador de propostas, minutas contratuais e esteira de fechamento",
  },
  {
    key: "automations",
    name: "Motor de Automações & Gatilhos",
    desc: "Fluxos programados de mensagens, follow-ups e mudança de status",
  },
  {
    key: "support",
    name: "Central de Suporte Omnichannel",
    desc: "Abertura de chamados prioritários, troubleshooting e suporte técnico",
  },
  {
    key: "teamChat",
    name: "Chat Interno da Equipe",
    desc: "Comunicação interna direta entre operadores e gestores de cada tenant",
  },
];

const getModuleIcon = (key: string) => {
  switch (key) {
    case "crm": return Kanban;
    case "whatsapp": return MessageSquare;
    case "aiAgent": return Bot;
    case "emailInbox": return Mail;
    case "analytics": return BarChart3;
    case "goals": return Target;
    case "proposalsContracts": return FileText;
    case "automations": return Zap;
    case "support": return LifeBuoy;
    case "teamChat": return MessagesSquare;
    default: return CheckCircle2;
  }
};

const getPlanModuleStatus = (plan: any, moduleKey: string): boolean => {
  if (plan.modules && typeof plan.modules === "object" && plan.modules[moduleKey] !== undefined) {
    return Boolean(plan.modules[moduleKey]);
  }
  if (moduleKey === "crm") return Boolean(plan.hasCRM);
  if (moduleKey === "whatsapp") return Boolean(plan.hasWhatsApp);
  if (moduleKey === "aiAgent") return Boolean(plan.hasAIAgent);
  if (moduleKey === "support" || moduleKey === "teamChat") return true;
  return false;
};

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
  const [newModules, setNewModules] = useState<Record<string, boolean>>({
    crm: true,
    whatsapp: true,
    aiAgent: true,
    emailInbox: true,
    analytics: false,
    goals: true,
    proposalsContracts: false,
    automations: false,
    support: true,
    teamChat: true,
  });
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

  const handleToggleModule = (planId: string, moduleKey: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const currentModules: Record<string, boolean> = plan.modules && typeof plan.modules === "object" 
          ? { ...plan.modules } 
          : {
              crm: plan.hasCRM ?? true,
              whatsapp: plan.hasWhatsApp ?? true,
              aiAgent: plan.hasAIAgent ?? false,
              emailInbox: false,
              analytics: false,
              goals: false,
              proposalsContracts: false,
              automations: false,
              support: true,
              teamChat: true,
            };

        const nextVal = !getPlanModuleStatus(plan, moduleKey);
        currentModules[moduleKey] = nextVal;

        return {
          ...plan,
          modules: currentModules,
          hasCRM: moduleKey === "crm" ? nextVal : plan.hasCRM,
          hasWhatsApp: moduleKey === "whatsapp" ? nextVal : plan.hasWhatsApp,
          hasAIAgent: moduleKey === "aiAgent" ? nextVal : plan.hasAIAgent,
        };
      }
      return plan;
    }));
  };

  const handleToggleAllModules = (planId: string, activate: boolean) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const nextModules: Record<string, boolean> = {};
        ALL_SYSTEM_MODULES.forEach(m => {
          nextModules[m.key] = activate;
        });
        return {
          ...plan,
          modules: nextModules,
          hasCRM: activate,
          hasWhatsApp: activate,
          hasAIAgent: activate,
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
      const activeModules = plan.modules || {
        crm: Boolean(plan.hasCRM),
        whatsapp: Boolean(plan.hasWhatsApp),
        aiAgent: Boolean(plan.hasAIAgent),
        emailInbox: false,
        analytics: false,
        goals: false,
        proposalsContracts: false,
        automations: false,
        support: true,
        teamChat: true,
      };

      await api.patch(`/tenants/plans/${plan.id}`, {
        name: plan.name,
        price: parseFloat(plan.price),
        maxUsers: parseInt(plan.maxUsers, 10),
        maxAIMsgs: parseInt(plan.maxAIMsgs, 10),
        hasCRM: activeModules.crm ?? plan.hasCRM,
        hasWhatsApp: activeModules.whatsapp ?? plan.hasWhatsApp,
        hasAIAgent: activeModules.aiAgent ?? plan.hasAIAgent,
        modules: activeModules,
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
        hasCRM: Boolean(newModules.crm),
        hasWhatsApp: Boolean(newModules.whatsapp),
        hasAIAgent: Boolean(newModules.aiAgent),
        modules: newModules,
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
            Configure os 10 módulos do sistema, limites operacionais e cotas de IA para cada nível de assinatura.
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
          <strong className="block text-white mb-0.5">Governança Master & Persistência em Tempo Real:</strong>
          As permissões e módulos definidos aqui governam diretamente o que os operadores das empresas (tenants) conseguem acessar no VERSUS. A desativação de um módulo bloqueia o recurso no respectivo tenant.
        </div>
      </div>

      {/* Modal/Formulário de Criação de Novo Plano */}
      {isCreating && (
        <form onSubmit={handleCreatePlan} className="p-6 rounded-2xl bg-[#0B1224] border border-blue-500/40 space-y-5 animate-in fade-in duration-200 shadow-2xl">
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-300">
                Módulos do Sistema ({Object.values(newModules).filter(Boolean).length}/10 selecionados):
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    ALL_SYSTEM_MODULES.forEach(m => (all[m.key] = true));
                    setNewModules(all);
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Marcar Todos
                </button>
                <span className="text-slate-600 text-[10px]">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    ALL_SYSTEM_MODULES.forEach(m => (all[m.key] = false));
                    setNewModules(all);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white font-semibold"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {ALL_SYSTEM_MODULES.map((mod) => {
                const IconComponent = getModuleIcon(mod.key);
                const active = Boolean(newModules[mod.key]);
                return (
                  <div
                    key={mod.key}
                    onClick={() => setNewModules(prev => ({ ...prev, [mod.key]: !prev[mod.key] }))}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-2 ${
                      active 
                        ? "bg-blue-950/20 border-blue-500/40 text-white" 
                        : "bg-[#070D1B] border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent size={16} className={active ? "text-blue-400" : "text-slate-500"} />
                      <div className={`w-7 h-4 rounded-full relative transition-colors ${active ? "bg-blue-600" : "bg-slate-800"}`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${active ? "left-3.5" : "left-0.5"}`} />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-snug">{mod.name}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{mod.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
          <span className="text-xs font-medium">Carregando matriz de planos e permissões...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-[#0B1224] border border-slate-800 rounded-2xl text-slate-400 text-xs">
          Nenhum plano cadastrado no sistema. Clique em &quot;Criar Novo Plano&quot; para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const activeCount = ALL_SYSTEM_MODULES.filter(m => getPlanModuleStatus(plan, m.key)).length;

            return (
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
                        <span className="text-xl font-black text-blue-400">R$ {Number(plan.price).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">/mês</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {plan.maxUsers} {plan.maxUsers === 1 ? "usuário" : "usuários"}
                    </span>
                  </div>

                  {/* Módulos do Sistema (10 Módulos) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Módulos Liberados ({activeCount}/10)
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleAllModules(plan.id, true)}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Todos
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAllModules(plan.id, false)}
                          className="text-slate-400 hover:text-white font-semibold"
                        >
                          Nenhum
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {ALL_SYSTEM_MODULES.map((mod) => {
                        const IconComponent = getModuleIcon(mod.key);
                        const isEnabled = getPlanModuleStatus(plan, mod.key);

                        return (
                          <div 
                            key={mod.key} 
                            onClick={() => handleToggleModule(plan.id, mod.key)}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-all ${
                              isEnabled 
                                ? "bg-[#070D1B] border-slate-800 hover:border-slate-700" 
                                : "bg-[#070D1B]/40 border-slate-900/60 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <IconComponent size={14} className={isEnabled ? "text-blue-400 shrink-0" : "text-slate-500 shrink-0"} />
                              <div className="min-w-0">
                                <span className={`text-xs font-medium block truncate ${isEnabled ? "text-slate-200" : "text-slate-500"}`}>
                                  {mod.name}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleModule(plan.id, mod.key);
                              }}
                              className={`w-8 h-4.5 rounded-full relative transition-colors shrink-0 ${
                                isEnabled ? "bg-blue-600" : "bg-slate-800"
                              }`}
                            >
                              <div 
                                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                                  isEnabled ? "left-4" : "left-0.5"
                                }`} 
                              />
                            </button>
                          </div>
                        );
                      })}
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
            );
          })}
        </div>
      )}

    </div>
  );
}
