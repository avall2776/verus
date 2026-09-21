"use client";

import { useState, useEffect } from "react";
import { X, Building2, Save, Loader2, CreditCard, Mail, Phone, MapPin, FileText, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface EditCompanyModalProps {
  isOpen: boolean;
  tenantId: string | null;
  initialData?: any;
  onClose: () => void;
  onCompanyUpdated: (updatedCompany: any) => void;
}

export default function EditCompanyModal({
  isOpen,
  tenantId,
  initialData,
  onClose,
  onCompanyUpdated,
}: EditCompanyModalProps) {
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadNotificationPhone, setLeadNotificationPhone] = useState("");
  const [address, setAddress] = useState("");
  const [planId, setPlanId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Estados de Plano Personalizado
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPlanName, setCustomPlanName] = useState("");
  const [customPlanPrice, setCustomPlanPrice] = useState("299.00");
  const [customMaxUsers, setCustomMaxUsers] = useState("5");
  const [customMaxAIMsgs, setCustomMaxAIMsgs] = useState("3000");
  const [customModules, setCustomModules] = useState<Record<string, boolean>>({
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

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !tenantId) return;

    // Se tiver dados iniciais passados
    if (initialData) {
      setName(initialData.name || "");
      setCnpj(initialData.cnpj || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setLeadNotificationPhone(initialData.leadNotificationPhone || "");
      setAddress(initialData.address || "");
      setPlanId(initialData.planId || initialData.plan?.id || "");
      setIsActive(initialData.isActive !== false);
    } else {
      // Carregar dados da empresa
      api.get(`/tenants/${tenantId}`)
        .then((res) => {
          const comp = res.data.company;
          setName(comp.name || "");
          setCnpj(comp.cnpj || "");
          setEmail(comp.email || "");
          setPhone(comp.phone || "");
          setLeadNotificationPhone(comp.leadNotificationPhone || "");
          setAddress(comp.address || "");
          setPlanId(comp.planId || comp.plan?.id || "");
          setIsActive(comp.isActive !== false);
        })
        .catch((e) => console.error(e));
    }

    // Carregar planos disponíveis
    setLoadingPlans(true);
    api.get("/tenants/plans/list")
      .then((res) => {
        setPlans(res.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoadingPlans(false);
      });
  }, [isOpen, tenantId, initialData]);

  if (!isOpen || !tenantId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome / razão social da empresa é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      let resolvedPlanId = planId;

      // Cabeçalhos explícitos com token e identificadores do tenant alvo
      const rawToken = typeof window !== 'undefined'
        ? localStorage.getItem('versus_auth_token') ||
          localStorage.getItem('versus_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('auth_token')
        : null;

      const cleanToken = rawToken
        ? rawToken.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '').trim()
        : null;

      const requestHeaders: Record<string, string> = {
        'x-target-tenant-id': tenantId,
        'x-tenant-id': tenantId,
      };
      if (cleanToken) {
        requestHeaders['Authorization'] = `Bearer ${cleanToken}`;
      }

      // Se for plano personalizado, cria o plano primeiro
      if (isCustomPlan) {
        if (!customPlanName.trim()) {
          toast.error("Informe o nome do plano personalizado.");
          setSaving(false);
          return;
        }

        const priceNumber = parseFloat(customPlanPrice);
        if (isNaN(priceNumber) || priceNumber < 0) {
          toast.error("Informe um valor mensal válido para o plano personalizado.");
          setSaving(false);
          return;
        }

        const planRes = await api.post("/tenants/plans", {
          name: customPlanName.trim(),
          price: priceNumber,
          maxUsers: parseInt(customMaxUsers, 10) || 3,
          maxAIMsgs: parseInt(customMaxAIMsgs, 10) || 0,
          hasCRM: Boolean(customModules.crm),
          hasWhatsApp: Boolean(customModules.whatsapp),
          hasInstagram: Boolean(customModules.instagram),
          hasAIAgent: Boolean(customModules.aiAgent),
          modules: customModules,
        }, { headers: requestHeaders });

        resolvedPlanId = planRes.data.id;
      }

      const payload: any = {
        name: name.trim(),
        cnpj: cnpj.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        leadNotificationPhone: leadNotificationPhone.trim() || null,
        address: address.trim() || null,
        isActive,
      };

      if (resolvedPlanId && resolvedPlanId !== "custom") {
        payload.planId = resolvedPlanId;
      }

      let res: any;
      try {
        res = await api.patch(`/tenants/${tenantId}`, payload, { headers: requestHeaders });
      } catch (patchErr: any) {
        // Fallback resiliente para PUT caso o método PATCH sofra restrições de proxy
        res = await api.put(`/tenants/${tenantId}`, payload, { headers: requestHeaders });
      }

      toast.success(res.data?.message || "Dados da empresa atualizados com sucesso!");
      onCompanyUpdated(res.data?.tenant);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao atualizar dados da empresa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Editar Dados da Empresa</h2>
              <p className="text-[11px] text-slate-400">
                Altere razão social, CNPJ, dados de contato e plano de assinatura.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Nome da Empresa */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Razão Social / Nome da Empresa *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clínica Harmonize Ltda"
              className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CNPJ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">CNPJ / CPF</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Telefone Comercial</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* WhatsApp Alerta de Leads */}
            <div className="space-y-1.5 sm:col-span-2 p-3 rounded-lg bg-blue-950/20 border border-blue-500/20">
              <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <span>WhatsApp / Grupo para Alertas de Novos Leads (IA)</span>
              </label>
              <input
                type="text"
                value={leadNotificationPhone}
                onChange={(e) => setLeadNotificationPhone(e.target.value)}
                placeholder="Ex: +55 (54) 99999-9999 ou 12036304... (ID do Grupo)"
                className="w-full bg-[#070D1B] border border-blue-500/30 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Número do gerente comercial ou ID de grupo do WhatsApp para onde o robô enviará alertas de novos leads qualificados.
              </p>
            </div>
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">E-mail de Contato / Financeiro</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@empresa.com.br"
              className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Endereço */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Endereço Completo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
              className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Plano de Assinatura */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Plano de Assinatura</label>
              <select
                value={isCustomPlan ? "custom" : planId}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomPlan(true);
                  } else {
                    setIsCustomPlan(false);
                    setPlanId(e.target.value);
                  }
                }}
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="">Manter plano atual</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - R$ {Number(p.price).toFixed(2)}/mês
                  </option>
                ))}
                <option value="custom" className="text-blue-400 font-bold">+ Criar Plano Personalizado...</option>
              </select>
            </div>

            {/* Status da Conta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Status de Acesso</label>
              <select
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="true">Conta Ativa (Desbloqueada)</option>
                <option value="false">Conta Bloqueada (Acesso Suspenso)</option>
              </select>
            </div>
          </div>

          {/* Sub-Card: Configuração de Plano Personalizado */}
          {isCustomPlan && (
            <div className="p-4 rounded-xl bg-[#070D1B] border border-blue-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Novo Plano Personalizado
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Parâmetros exclusivos para este cliente</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Nome do Plano *</label>
                  <input
                    type="text"
                    placeholder="Ex: Custom Avall"
                    value={customPlanName}
                    onChange={(e) => setCustomPlanName(e.target.value)}
                    className="w-full bg-[#0B1224] border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    required={isCustomPlan}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Valor Mensal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 350.00"
                    value={customPlanPrice}
                    onChange={(e) => setCustomPlanPrice(e.target.value)}
                    className="w-full bg-[#0B1224] border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    required={isCustomPlan}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Limite de Usuários</label>
                  <input
                    type="number"
                    placeholder="Ex: 5"
                    value={customMaxUsers}
                    onChange={(e) => setCustomMaxUsers(e.target.value)}
                    className="w-full bg-[#0B1224] border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5">
                  Módulos Liberados no Plano Customizado ({Object.values(customModules).filter(Boolean).length}/10):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { key: "crm", label: "Funil CRM" },
                    { key: "whatsapp", label: "WhatsApp" },
                    { key: "aiAgent", label: "Agente IA" },
                    { key: "emailInbox", label: "E-mail Inbox" },
                    { key: "analytics", label: "Analytics PRO" },
                    { key: "goals", label: "Metas/Ranking" },
                    { key: "proposalsContracts", label: "Propostas/Contr." },
                    { key: "automations", label: "Automações" },
                    { key: "support", label: "Central Suporte" },
                    { key: "teamChat", label: "Chat Equipe" },
                  ].map((mod) => (
                    <label 
                      key={mod.key} 
                      className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all ${
                        customModules[mod.key]
                          ? "bg-[#0B1224] border-blue-500/40 text-white"
                          : "bg-[#0B1224] border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(customModules[mod.key])}
                        onChange={(e) => setCustomModules(prev => ({ ...prev, [mod.key]: e.target.checked }))}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-medium truncate">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rodapé de Ações */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

