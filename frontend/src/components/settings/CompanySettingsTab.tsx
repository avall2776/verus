"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, ShieldCheck, CreditCard, Users, FileText, Phone, Mail, MapPin, Loader2, ChevronRight, BellRing } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function CompanySettingsTab() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    leadNotificationPhone: "",
    aiEnabled: true,
    address: "",
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenants/me");
      setCompany(res.data);
      setForm({
        name: res.data.name || "",
        cnpj: res.data.cnpj || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        leadNotificationPhone: res.data.leadNotificationPhone || "",
        aiEnabled: res.data.aiEnabled !== false,
        address: res.data.address || "",
      });
    } catch (err: any) {
      console.error("[COMPANY_SETTINGS_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao carregar dados da empresa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("O nome da empresa é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch("/tenants/me", form);
      toast.success("Dados da empresa atualizados com sucesso!");
      setCompany(res.data);
    } catch (err: any) {
      console.error("[COMPANY_UPDATE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar dados da empresa.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-semibold">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Dados Cadastrais da Empresa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Informações institucionais e fiscais utilizadas nos módulos operacionais e contratos.
          </p>
        </div>

        {company?.plan && (
          <button
            type="button"
            onClick={() => router.push("/settings?tab=plan")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-xs font-semibold text-blue-300 transition-all group"
            title="Clique para ver os detalhes da assinatura e limites"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Plano {company.plan.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Métricas Rápidas */}
      {company?._count && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Membros</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{company._count.users || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contratos</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{company._count.contracts || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contatos CRM</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{company._count.contacts || 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>Chamados</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{company._count.supportTickets || 0}</span>
          </div>
        </div>
      )}

      {/* Formulário de Dados */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Razão Social / Nome Fantasia *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Nexus Logística e Tecnologia LTDA"
              className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              CNPJ ou CPF
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              E-mail Comercial
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contato@empresa.com.br"
              className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Telefone / WhatsApp Oficial
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+55 (11) 99999-9999"
              className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Notificação de Leads Qualificados (Multi-Tenant) */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <BellRing className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
              WhatsApp da Central / Alerta de Novos Leads
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Informe o número de WhatsApp do gerente comercial ou o ID de grupo da equipe de vendas para onde a IA enviará os alertas imediatos de <strong>Novos Leads Qualificados</strong>.
          </p>
          <div className="pt-1">
            <input
              type="text"
              value={form.leadNotificationPhone}
              onChange={(e) => setForm({ ...form, leadNotificationPhone: e.target.value })}
              placeholder="Ex: +55 (54) 99999-9999 ou 12036304... (ID do Grupo)"
              className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-blue-500/30 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Interruptor Master do Auto-Atendimento por IA */}
        <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Auto-Atendimento por IA (WhatsApp)
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                  form.aiEnabled
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                {form.aiEnabled ? "Ligado" : "Desligado"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
              Quando desligado, o robô para de responder novas mensagens e todos os novos chamados caem diretamente para atendimento humano no Inbox.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setForm({ ...form, aiEnabled: !form.aiEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.aiEnabled ? "bg-emerald-500" : "bg-red-500/80"
            }`}
            role="switch"
            aria-checked={form.aiEnabled}
            title={form.aiEnabled ? "Clique para desligar a IA" : "Clique para ligar a IA"}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                form.aiEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Endereço Completo da Sede
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Avenida Paulista, 1000, Sala 50 - São Paulo, SP"
            className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Informações da Empresa</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
