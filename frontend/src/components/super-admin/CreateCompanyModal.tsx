"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Save, 
  Loader2, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw 
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (newCompany: any) => void;
}

export default function CreateCompanyModal({
  isOpen,
  onClose,
  onCompanyCreated,
}: CreateCompanyModalProps) {
  // Dados da Empresa
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Dados do Administrador Inicial
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Plano
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Custom Plan
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPlanName, setCustomPlanName] = useState("");
  const [customPlanPrice, setCustomPlanPrice] = useState("299.00");
  const [customMaxUsers, setCustomMaxUsers] = useState("5");
  const [customMaxAIMsgs, setCustomMaxAIMsgs] = useState("3000");
  const [customHasCRM, setCustomHasCRM] = useState(true);
  const [customHasWhatsApp, setCustomHasWhatsApp] = useState(true);
  const [customHasInstagram, setCustomHasInstagram] = useState(false);
  const [customHasAIAgent, setCustomHasAIAgent] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Reset formulário
    setName("");
    setCnpj("");
    setEmail("");
    setPhone("");
    setAddress("");
    setAdminName("");
    setAdminEmail("");
    generateRandomPassword();
    setIsCustomPlan(false);
    setCustomPlanName("");

    // Carregar planos disponíveis
    setLoadingPlans(true);
    api.get("/tenants/plans/list")
      .then((res) => {
        const loadedPlans = res.data || [];
        setPlans(loadedPlans);
        if (loadedPlans.length > 0) {
          // Seleciona o plano "Pro" ou o primeiro
          const defaultP = loadedPlans.find((p: any) => p.name.toLowerCase() === "pro") || loadedPlans[0];
          setSelectedPlanId(defaultP.id);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoadingPlans(false);
      });
  }, [isOpen]);

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "Versus@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pass);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("O nome / razão social da empresa é obrigatório.");
      return;
    }

    if (!adminName.trim()) {
      toast.error("O nome do administrador é obrigatório.");
      return;
    }

    if (!adminEmail.trim()) {
      toast.error("O e-mail do administrador é obrigatório.");
      return;
    }

    if (!adminPassword || adminPassword.length < 6) {
      toast.error("A senha do administrador deve ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        cnpj: cnpj.trim() || null,
        email: email.trim() || adminEmail.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        adminName: adminName.trim(),
        adminEmail: adminEmail.toLowerCase().trim(),
        adminPassword: adminPassword,
      };

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

        payload.customPlan = {
          name: customPlanName.trim(),
          price: priceNumber,
          maxUsers: parseInt(customMaxUsers, 10) || 3,
          maxAIMsgs: parseInt(customMaxAIMsgs, 10) || 0,
          hasCRM: customHasCRM,
          hasWhatsApp: customHasWhatsApp,
          hasInstagram: customHasInstagram,
          hasAIAgent: customHasAIAgent,
        };
      } else {
        payload.planId = selectedPlanId;
      }

      const res = await api.post("/tenants", payload);
      toast.success(res.data.message || "Nova empresa cadastrada com sucesso!");
      onCompanyCreated(res.data.tenant);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao cadastrar nova empresa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Cadastrar Nova Empresa (Tenant)</h2>
              <p className="text-[11px] text-slate-400">
                Provisione a empresa no SaaS, crie o acesso do administrador e defina o plano contratado.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[78vh] custom-scrollbar">
          
          {/* Seção 1: Dados Cadastrais da Empresa */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
              <Building2 size={14} /> 1. Dados da Empresa (Tenant)
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Razão Social / Nome Fantasia *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!adminName) setAdminName(`Admin ${e.target.value}`);
                }}
                placeholder="Ex: Avall Empreendimentos LTDA"
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">CNPJ / CPF</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Telefone Comercial</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">E-mail Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Endereço da Sede</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Paulista, 1000 - São Paulo, SP"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Usuário Administrador Inicial */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
              <User size={14} /> 2. Conta Inicial do Administrador
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Nome do Administrador *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Ex: Carlos Ferreira"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@empresa.com.br"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Senha Provisória de Acesso *</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <RefreshCw size={11} />
                  <span>Gerar Senha Segura</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Defina uma senha"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono outline-none pr-8"
                />
                <KeyRound size={14} className="absolute right-2.5 top-2.5 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-500">
                O administrador usará este e-mail e senha para realizar o primeiro login no sistema.
              </p>
            </div>
          </div>

          {/* Seção 3: Plano de Assinatura */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
              <CreditCard size={14} /> 3. Plano de Assinatura
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Escolha o Plano do Cliente</label>
              <select
                value={isCustomPlan ? "custom" : selectedPlanId}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomPlan(true);
                  } else {
                    setIsCustomPlan(false);
                    setSelectedPlanId(e.target.value);
                  }
                }}
                className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - R$ {Number(p.price).toFixed(2)}/mês ({p.maxUsers} usuário(s))
                  </option>
                ))}
                <option value="custom" className="text-blue-400 font-bold">+ Criar Plano Personalizado...</option>
              </select>
            </div>

            {/* Sub-Card: Criação de Plano Personalizado */}
            {isCustomPlan && (
              <div className="p-4 rounded-xl bg-[#070D1B] border border-blue-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Sparkles size={14} /> Criar Plano Sob Medida para Este Cliente
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Personalização Total</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Nome do Plano *</label>
                    <input
                      type="text"
                      placeholder="Ex: VIP Avall"
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
                  <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Módulos Inclusos:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={customHasCRM}
                        onChange={(e) => setCustomHasCRM(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-medium">Funil CRM</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={customHasWhatsApp}
                        onChange={(e) => setCustomHasWhatsApp(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-medium">WhatsApp</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={customHasAIAgent}
                        onChange={(e) => setCustomHasAIAgent(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-medium">Agente IA</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-[#0B1224] border border-slate-800 text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={customHasInstagram}
                        onChange={(e) => setCustomHasInstagram(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-medium">Instagram</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

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
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Cadastrar Empresa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
