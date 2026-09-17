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

  // Modal / Formulário de Criação de Plano
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
          Nenhum plano cadastrado. Clique em "Criar Novo Plano" acima para iniciar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => {
            const isSaving = savingId === plan.id;
            const activeCount = ALL_SYSTEM_MODULES.filter(m => getPlanModuleStatus(plan, m.key)).length;

            return (
              <div 
                key={plan.id}
                className="flex flex-col rounded-2xl bg-[#0B1224] border border-slate-800 hover:border-slate-700/80 transition-all shadow-xl overflow-hidden"
              >
                {/* Header do Card do Plano */}
                <div className="p-5 border-b border-slate-800/80 bg-[#070D1B]/70 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 block mb-1">
                        Nível de Assinatura
                      </span>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => handleUpdateLimit(plan.id, "name", e.target.value)}
                        className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-[#0B1224] rounded px-1.5 py-0.5 outline-none transition-colors w-full"
                        title="Clique para editar o nome do plano"
                      />
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Mensalidade</span>
                      <div className="flex items-center justify-end gap-1 bg-[#0B1224] px-2.5 py-1 rounded-lg border border-slate-800">
                        <span className="text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={plan.price}
                          onChange={(e) => handleUpdateLimit(plan.id, "price", e.target.value)}
                          className="w-20 text-sm font-extrabold text-white bg-transparent outline-none text-right"
                          title="Valor da mensalidade"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Limites Operacionais & Cotas */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#0B1224] border border-slate-800/90 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Operadores</span>
                        <Users size={12} className="text-blue-400" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          value={plan.maxUsers}
                          onChange={(e) => handleUpdateLimit(plan.id, "maxUsers", e.target.value)}
                          className="w-full text-sm font-bold text-white bg-transparent outline-none border-b border-transparent focus:border-blue-500"
                        />
                        <span className="text-[10px] text-slate-500">usuários</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0B1224] border border-slate-800/90 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Cota IA</span>
                        <Bot size={12} className="text-blue-400" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          value={plan.maxAIMsgs}
                          onChange={(e) => handleUpdateLimit(plan.id, "maxAIMsgs", e.target.value)}
                          className="w-full text-sm font-bold text-white bg-transparent outline-none border-b border-transparent focus:border-blue-500"
                        />
                        <span className="text-[10px] text-slate-500">msgs/mês</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção de Módulos (Sem Scroll Interno, Contraste Máximo) */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <span className="text-[11px] font-bold text-slate-300">
                      Módulos Habilitados:
                      <span className="ml-1.5 text-blue-400 font-extrabold">{activeCount} / 10</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAllModules(plan.id, true)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Ativar Todos
                      </button>
                      <span className="text-slate-700 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllModules(plan.id, false)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
                      >
                        Desativar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ALL_SYSTEM_MODULES.map((mod) => {
                      const IconComp = getModuleIcon(mod.key);
                      const isActive = getPlanModuleStatus(plan, mod.key);

                      return (
                        <div
                          key={mod.key}
                          onClick={() => handleToggleModule(plan.id, mod.key)}
                          className={`group cursor-pointer select-none rounded-xl p-3 border transition-all duration-150 flex items-center justify-between gap-3 ${
                            isActive
                              ? "bg-[#070D1B] border-slate-700/80 border-l-4 border-l-blue-500 shadow-sm"
                              : "bg-[#070D1B]/40 border-slate-800/40 border-l-4 border-l-slate-800 opacity-45 hover:opacity-75"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors ${
                              isActive 
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                                : "bg-slate-800/50 text-slate-500 border border-slate-800/40"
                            }`}>
                              <IconComp size={15} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold leading-tight block truncate ${
                                  isActive ? "text-white" : "text-slate-400"
                                }`}>
                                  {mod.name}
                                </span>
                              </div>
                              <p className={`text-[10px] leading-relaxed mt-0.5 line-clamp-1 ${
                                isActive ? "text-slate-400" : "text-slate-600"
                              }`}>
                                {mod.desc}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch Visual Corporativo */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:inline-block px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                : "bg-slate-800 text-slate-500 border border-slate-800"
                            }`}>
                              {isActive ? "Ligado" : "Desligado"}
                            </span>

                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                              isActive ? "bg-blue-600 justify-end" : "bg-slate-800 justify-start"
                            }`}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                                isActive ? "text-blue-600" : "text-slate-400"
                              }`}>
                                {isActive && <Check size={10} strokeWidth={3} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botão de Ação Salvar */}
                <div className="p-4 bg-[#070D1B]/80 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isSaving ? "Persistindo matriz..." : "Modificações salvas localmente"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSavePlan(plan)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-bold text-white shadow-md hover:shadow-blue-600/20 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    <span>{isSaving ? "Salvando..." : "Salvar Matriz"}</span>
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
