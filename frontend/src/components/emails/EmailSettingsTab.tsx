"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, Shield, Key, Server, CheckCircle2, AlertTriangle, 
  XCircle, RefreshCw, Send, HelpCircle, ExternalLink, 
  Lock, Eye, EyeOff, Save, Check, Sparkles, Building2, Globe
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface EmailSettingsData {
  provider: "gmail" | "hostinger" | "resend" | "smtp";
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass?: string;
  hasPassword?: boolean;
  fromName: string;
  fromEmail: string;
  resendApiKey?: string;
  isActive: boolean;
  configured?: boolean;
  connected?: boolean;
  connectionError?: string | null;
  source?: "tenant" | "env" | "none";
}

interface EmailSettingsTabProps {
  onSettingsSaved?: () => void;
}

export default function EmailSettingsTab({ onSettingsSaved }: EmailSettingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Status retornado do teste
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
    details?: string;
  }>({ tested: false, success: false });

  // Formulário
  const [formData, setFormData] = useState<EmailSettingsData>({
    provider: "gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    hasPassword: false,
    fromName: "",
    fromEmail: "",
    resendApiKey: "",
    isActive: true,
  });

  // Carregar configurações atuais
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/emails/settings");
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          ...res.data,
          smtpPass: "", // Nunca exibe a senha pura
        }));
        if (res.data.connected) {
          setTestResult({
            tested: true,
            success: true,
            message: "Conexão ativa e validada com sucesso!",
          });
        } else if (res.data.connectionError) {
          setTestResult({
            tested: true,
            success: false,
            message: res.data.connectionError,
          });
        }
      }
    } catch (error: any) {
      console.error("[LOAD_EMAIL_SETTINGS_ERROR]", error);
      toast.error("Erro ao carregar configurações de e-mail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Selecionar provedor com defaults automáticos
  const handleSelectProvider = (prov: "gmail" | "hostinger" | "resend" | "smtp") => {
    setTestResult({ tested: false, success: false });
    if (prov === "gmail") {
      setFormData((prev) => ({
        ...prev,
        provider: "gmail",
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpSecure: false,
      }));
    } else if (prov === "hostinger") {
      setFormData((prev) => ({
        ...prev,
        provider: "hostinger",
        smtpHost: "smtp.hostinger.com",
        smtpPort: 465,
        smtpSecure: true,
      }));
    } else if (prov === "resend") {
      setFormData((prev) => ({
        ...prev,
        provider: "resend",
        smtpHost: "smtp.resend.com",
        smtpPort: 465,
        smtpSecure: true,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        provider: "smtp",
      }));
    }
  };

  // Testar conexão em tempo real
  const handleTestConnection = async () => {
    if (formData.provider === "resend") {
      if (!formData.resendApiKey && !formData.hasPassword) {
        toast.error("Informe a Chave de API do Resend.");
        return;
      }
    } else {
      if (!formData.smtpUser) {
        toast.error("Informe o e-mail da conta.");
        return;
      }
      if (!formData.smtpPass && !formData.hasPassword) {
        toast.error("Informe a senha ou senha de app da conta.");
        return;
      }
    }

    setTesting(true);
    setTestResult({ tested: false, success: false });

    const cleanPayload = {
      provider: formData.provider,
      smtpHost: formData.smtpHost,
      smtpPort: Number(formData.smtpPort),
      smtpSecure: Boolean(formData.smtpSecure),
      smtpUser: formData.smtpUser?.trim(),
      smtpPass: formData.smtpPass ? formData.smtpPass.replace(/\s+/g, '') : undefined,
      fromName: formData.fromName?.trim(),
      fromEmail: formData.fromEmail?.trim(),
      resendApiKey: formData.resendApiKey?.trim(),
      isActive: formData.isActive,
    };

    try {
      const res = await api.post("/emails/test-connection", cleanPayload);
      if (res.data.success) {
        setTestResult({
          tested: true,
          success: true,
          message: res.data.message || "Conexão e autenticação validadas com sucesso!",
        });
        toast.success("Conexão validada com sucesso!");
      } else {
        setTestResult({
          tested: true,
          success: false,
          message: res.data.error || "Falha na autenticação.",
          details: res.data.details,
        });
        toast.error(res.data.error || "Falha na conexão SMTP.");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Erro ao testar conexão.";
      setTestResult({
        tested: true,
        success: false,
        message: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg),
      });
      toast.error("Falha ao comunicar com o servidor de e-mail.");
    } finally {
      setTesting(false);
    }
  };

  // Salvar configurações
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.provider === "resend") {
      if (!formData.resendApiKey && !formData.hasPassword) {
        toast.error("Informe a Chave de API do Resend.");
        return;
      }
    } else {
      if (!formData.smtpUser) {
        toast.error("Informe o e-mail da conta.");
        return;
      }
      if (!formData.smtpPass && !formData.hasPassword) {
        toast.error("Informe a senha de app para salvar.");
        return;
      }
    }

    setSaving(true);

    const cleanPayload = {
      provider: formData.provider,
      smtpHost: formData.smtpHost,
      smtpPort: Number(formData.smtpPort),
      smtpSecure: Boolean(formData.smtpSecure),
      smtpUser: formData.smtpUser?.trim(),
      smtpPass: formData.smtpPass ? formData.smtpPass.replace(/\s+/g, '') : undefined,
      fromName: formData.fromName?.trim(),
      fromEmail: formData.fromEmail?.trim(),
      resendApiKey: formData.resendApiKey?.trim(),
      isActive: formData.isActive,
    };

    try {
      const res = await api.post("/emails/settings", cleanPayload);
      toast.success(res.data.message || "Configurações salvas com sucesso!");
      if (res.data.connected) {
        setTestResult({
          tested: true,
          success: true,
          message: "Configuração salva e conexão validada!",
        });
      }
      setFormData((prev) => ({
        ...prev,
        hasPassword: res.data.settings?.hasPassword ?? prev.hasPassword,
        smtpPass: "",
      }));
      if (onSettingsSaved) onSettingsSaved();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Erro ao salvar configurações de e-mail.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Carregando configurações de e-mail do cliente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Banner de Status Atual */}
      <div className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        testResult.tested && testResult.success
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : testResult.tested && !testResult.success
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
          : formData.configured
          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            testResult.tested && testResult.success
              ? "bg-emerald-500/20 text-emerald-400"
              : testResult.tested && !testResult.success
              ? "bg-rose-500/20 text-rose-400"
              : formData.configured
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-amber-500/20 text-amber-400"
          }`}>
            {testResult.tested && testResult.success ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : testResult.tested && !testResult.success ? (
              <XCircle className="w-5 h-5" />
            ) : formData.configured ? (
              <Shield className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {testResult.tested && testResult.success
                  ? "Conexão Ativa & Validada"
                  : testResult.tested && !testResult.success
                  ? "Erro de Conexão ou Credenciais"
                  : formData.configured
                  ? "Configuração Registrada"
                  : "Nenhum E-mail Conectado"}
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-slate-300">
                Cliente Individual
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {testResult.tested
                ? testResult.message
                : formData.configured
                ? `Disparos configurados via ${formData.provider.toUpperCase()} (${formData.smtpUser || formData.fromEmail})`
                : "Configure a conta de e-mail exclusiva desta empresa para disparar orçamentos e contratos com identidade própria."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-white transition-all shadow-md flex-shrink-0 disabled:opacity-50"
        >
          {testing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Testando Handshake...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              Testar Conexão Agora
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Seletor de Provedores */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Selecione o Provedor de E-mail:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Gmail */}
            <div
              onClick={() => handleSelectProvider("gmail")}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.provider === "gmail"
                  ? "bg-gradient-to-b from-rose-500/20 to-red-600/10 border-red-500/50 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                    G
                  </span>
                  {formData.provider === "gmail" && <Check className="w-4 h-4 text-red-400" />}
                </div>
                <h4 className="text-xs font-bold text-white">Gmail / Workspace</h4>
                <p className="text-[11px] text-slate-400 mt-1">smtp.gmail.com:587</p>
              </div>
              <span className="text-[10px] text-red-400/90 font-medium mt-3">Requer Senha de App</span>
            </div>

            {/* Hostinger */}
            <div
              onClick={() => handleSelectProvider("hostinger")}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.provider === "hostinger"
                  ? "bg-gradient-to-b from-purple-500/20 to-indigo-600/10 border-purple-500/50 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    H
                  </span>
                  {formData.provider === "hostinger" && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <h4 className="text-xs font-bold text-white">Hostinger / Titan</h4>
                <p className="text-[11px] text-slate-400 mt-1">smtp.hostinger.com:465</p>
              </div>
              <span className="text-[10px] text-purple-400/90 font-medium mt-3">Senha comum do Webmail</span>
            </div>

            {/* Resend */}
            <div
              onClick={() => handleSelectProvider("resend")}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.provider === "resend"
                  ? "bg-gradient-to-b from-cyan-500/20 to-blue-600/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    R
                  </span>
                  {formData.provider === "resend" && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <h4 className="text-xs font-bold text-white">Resend API</h4>
                <p className="text-[11px] text-slate-400 mt-1">Alta entregabilidade</p>
              </div>
              <span className="text-[10px] text-cyan-400/90 font-medium mt-3">Chave de API (re_...)</span>
            </div>

            {/* Custom SMTP */}
            <div
              onClick={() => handleSelectProvider("smtp")}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.provider === "smtp"
                  ? "bg-gradient-to-b from-amber-500/20 to-orange-600/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Server className="w-5 h-5 text-amber-400" />
                  {formData.provider === "smtp" && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <h4 className="text-xs font-bold text-white">SMTP Customizado</h4>
                <p className="text-[11px] text-slate-400 mt-1">SendGrid, SES, Outlook...</p>
              </div>
              <span className="text-[10px] text-amber-400/90 font-medium mt-3">Host e porta manuais</span>
            </div>
          </div>
        </div>

        {/* Guia de Ajuda Específico do Provedor Selecionado */}
        {formData.provider === "gmail" && (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <HelpCircle className="w-4 h-4" />
              Como configurar o Gmail / Google Workspace:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[12px] text-slate-400 pl-1 leading-relaxed">
              <li>
                Sua conta Google precisa ter a <strong>Verificação em duas etapas (2FA)</strong> ativada.
              </li>
              <li>
                Acesse o painel direto:{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  myaccount.google.com/apppasswords
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>Crie uma senha com o nome <strong>VERSUS</strong> e copie o código amarelo de 16 letras gerado.</li>
              <li>Cole o e-mail completo e a senha de 16 dígitos nos campos abaixo e clique em <strong>Testar Conexão</strong>.</li>
            </ol>
          </div>
        )}

        {formData.provider === "hostinger" && (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <HelpCircle className="w-4 h-4" />
              Como configurar o E-mail Hostinger / Titan:
            </div>
            <p className="text-[12px] text-slate-400">
              Insira o e-mail completo do seu domínio (ex: <code className="text-purple-300">contato@seudominio.com.br</code>) e a mesma senha utilizada para entrar no Webmail da Hostinger. A porta 465 com SSL já está configurada.
            </p>
          </div>
        )}

        {formData.provider === "resend" && (
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <HelpCircle className="w-4 h-4" />
              Como configurar o Resend:
            </div>
            <p className="text-[12px] text-slate-400">
              Crie uma conta gratuita em{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1"
              >
                resend.com
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              , gere uma API Key em <strong>API Keys</strong> e cole no campo abaixo.
            </p>
          </div>
        )}

        {/* Campos do Formulário */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-cyan-400" />
            Credenciais de Autenticação do Cliente
          </h4>

          {formData.provider === "resend" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chave de API do Resend (RESEND_API_KEY) *
              </label>
              <input
                type="password"
                value={formData.resendApiKey || ""}
                onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                placeholder={formData.hasPassword ? "•••••••••••••••• (Chave já salva)" : "re_123456789..."}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          ) : (
            <>
              {/* E-mail da Conta e Senha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Endereço de E-mail da Conta *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.smtpUser || ""}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                    placeholder={
                      formData.provider === "gmail"
                        ? "seu-email@gmail.com"
                        : "comercial@suaempresa.com.br"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {formData.provider === "gmail" ? "Senha de App de 16 Dígitos *" : "Senha do E-mail *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.smtpPass || ""}
                      onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                      placeholder={formData.hasPassword ? "•••••••••••••••• (Senha já salva)" : "Digite a senha"}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.hasPassword && !formData.smtpPass && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Deixe em branco para manter a senha cadastrada atualmente.
                    </span>
                  )}
                </div>
              </div>

              {/* Servidor e Porta (visível se SMTP customizado) */}
              {(formData.provider === "smtp" || formData.provider === "hostinger" || formData.provider === "gmail") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Servidor SMTP (Host)
                    </label>
                    <input
                      type="text"
                      value={formData.smtpHost || ""}
                      disabled={formData.provider !== "smtp"}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white disabled:opacity-60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Porta SMTP
                    </label>
                    <input
                      type="number"
                      value={formData.smtpPort || 587}
                      disabled={formData.provider !== "smtp"}
                      onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white disabled:opacity-60 transition-colors"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Identidade de Exibição do Remetente */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Identidade do Remetente nos E-mails Enviados
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome de Exibição da Empresa / Atendente
                </label>
                <input
                  type="text"
                  value={formData.fromName || ""}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  placeholder="Ex: VERSUS Comercial ou Agência 26"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail de Envio Exibido para o Destinatário
                </label>
                <input
                  type="email"
                  value={formData.fromEmail || ""}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  placeholder={formData.smtpUser || "comercial@empresa.com.br"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando Credenciais do Cliente...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações de E-mail
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
