"use client";

import React, { useState, useEffect } from "react";
import { Building2, Save, ShieldCheck, CreditCard, Users, FileText, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function CompanySettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Plano {company.plan.name}</span>
          </div>
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
