"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  HelpCircle,
  Lock,
  ArrowUpRight,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface AiStatusData {
  canUseAi: boolean;
  source: "platform_authorized" | "byok" | "trial_active" | "trial_expired";
  daysLeft: number | null;
  totalTrialDays: number;
  statusText: string;
  isPlatformAllowed: boolean;
  hasCustomKey: boolean;
  maskedCustomKey: string | null;
  aiModel?: string;
  aiEnabled?: boolean;
  lastKeyTestAt?: string | null;
  trialStartedAt?: string | null;
}

export default function AiSettingsTab() {
  const [status, setStatus] = useState<AiStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);

  const fetchAiStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tenants/ai-status");
      setStatus(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar status de IA:", err);
      toast.error("Não foi possível carregar as informações de IA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  const handleTestKey = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest && !status?.hasCustomKey) {
      toast.error("Informe uma chave da OpenAI para testar.");
      return;
    }

    try {
      setTestingKey(true);
      const res = await api.post("/tenants/test-ai-key", {
        apiKey: keyToTest || undefined,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Conexão com a OpenAI validada com sucesso!");
        fetchAiStatus();
      } else {
        toast.error(res.data.message || "Falha ao validar chave.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Falha na comunicação com a OpenAI.";
      toast.error(msg);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      toast.error("Por favor, cole a sua chave da OpenAI.");
      return;
    }

    if (!key.startsWith("sk-")) {
      toast.error("Formato de chave inválido. A chave da OpenAI deve começar com 'sk-'.");
      return;
    }

    try {
      setSavingKey(true);
      const res = await api.patch("/tenants/save-ai-key", { apiKey: key });
      toast.success(res.data.message || "Chave própria salva com sucesso!");
      setApiKeyInput("");
      fetchAiStatus();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Não foi possível validar e salvar a chave.";
      toast.error(msg);
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!confirm("Deseja realmente desconectar a sua chave própria da OpenAI?")) {
      return;
    }

    try {
      setRemovingKey(true);
      const res = await api.delete("/tenants/remove-ai-key");
      toast.success(res.data.message || "Chave própria removida.");
      fetchAiStatus();
    } catch (err: any) {
      toast.error("Erro ao remover chave.");
    } finally {
      setRemovingKey(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Carregando status de Inteligência Artificial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. STATUS GERAL & BANNER DE DEGUSTAÇÃO / BYOK */}
      <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Motor de Inteligência Artificial & Créditos
                </h2>
                {status?.isPlatformAllowed ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Chave do Sistema Liberada
                  </span>
                ) : status?.hasCustomKey ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Chave Própria (BYOK)
                  </span>
                ) : (status?.daysLeft || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    Degustação: {status?.daysLeft} {status?.daysLeft === 1 ? "dia restante" : "dias restantes"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Degustação Expirada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Modelo cognitivo ativo: <span className="text-slate-200 font-mono font-medium">{status?.aiModel || "gpt-4o-mini"}</span> • Auto-atendimento:{" "}
                <span className={status?.aiEnabled ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {status?.aiEnabled ? "Habilitado" : "Pausado"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAiStatus}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Status</span>
            </button>
          </div>
        </div>

        {/* MENSAGEM CONTEXTUAL POR CENÁRIO */}
        {status?.isPlatformAllowed ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-300">Modo Homologação Ativo (Liberado pelo Administrador)</p>
              <p className="text-emerald-200/80 leading-relaxed">
                Esta conta foi autorizada pelo Super Admin a utilizar a chave Master oficial da plataforma sem prazo limite. Todas as interações de IA no WhatsApp, chat e automações utilizam a infraestrutura do sistema.
              </p>
            </div>
          </div>
        ) : status?.hasCustomKey ? (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-xs text-blue-200">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-300">Chave Própria da OpenAI Conectada (BYOK)</p>
              <p className="text-blue-200/80 leading-relaxed">
                Sua empresa está conectada diretamente à sua conta na OpenAI. O consumo de tokens é faturado diretamente em seu cartão cadastrado na plataforma OpenAI com máxima transparência de custos.
              </p>
            </div>
          </div>
        ) : (status?.daysLeft || 0) > 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                Período de Degustação Oficial: {status?.daysLeft} {status?.daysLeft === 1 ? "dia restante" : "dias restantes"} de {status?.totalTrialDays || 7}
              </p>
              <p className="text-amber-200/80 leading-relaxed">
                Você está experimentando gratuitamente toda a capacidade do agente de IA com a infraestrutura da plataforma. Para garantir a continuidade das respostas automáticas após esse prazo, conecte a sua chave de API própria no formulário abaixo.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Degustação Encerrada • Robô em Pausa Amigável</p>
              <p className="text-rose-200/80 leading-relaxed">
                O período de 7 dias de degustação terminou. Para sua total segurança, nenhuma mensagem de cliente é perdida: novos contatos são roteados imediatamente para a fila humana de atendentes. Conecte sua chave própria da OpenAI abaixo para reativar o atendimento autônomo instantaneamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. CHAVE ATIVA OU CONFIGURAÇÃO DE NOVA CHAVE */}
      <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-4">
          <Key className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Credenciais da OpenAI (Bring Your Own Key)
          </h3>
        </div>

        {status?.hasCustomKey && (
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Chave Cadastrada:</span>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400 font-semibold">
                  {status.maskedCustomKey || "••••••••••••••••"}
                </span>
              </div>
              {status.lastKeyTestAt && (
                <p className="text-[11px] text-slate-500">
                  Último teste com sucesso: {new Date(status.lastKeyTestAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingKey}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                <span>{testingKey ? "Testando..." : "Testar Conexão"}</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveKey}
                disabled={removingKey}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {removingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Desconectar</span>
              </button>
            </div>
          </div>
        )}

        {/* INPUT DE NOVA CHAVE */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            {status?.hasCustomKey ? "Substituir Chave OpenAI" : "Conectar Nova Chave de API"}
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-proj-abc123456789xyz..."
                className="w-full bg-[#070D1B] border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-slate-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showKey ? "Ocultar" : "Mostrar"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingKey || !apiKeyInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
              <span>Testar Prévia</span>
            </button>

            <button
              type="button"
              onClick={handleSaveKey}
              disabled={savingKey || !apiKeyInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
            >
              {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{savingKey ? "Validando e Salvando..." : "Salvar e Ativar"}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            Criptografia ponta a ponta (AES-256): sua chave nunca é exposta no navegador e é armazenada com cifra de alta segurança.
          </p>
        </div>
      </div>

      {/* 3. ASSISTENTE PASSO A PASSO PARA O CLIENTE GERAR A CHAVE NA OPENAI */}
      <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Como gerar sua chave na OpenAI (Passo a Passo)
            </h3>
          </div>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Ir para OpenAI Platform</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Passo 1 */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-white">Crie sua Conta</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Acesse <span className="text-blue-400">platform.openai.com</span> e faça login ou crie sua conta comercial.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-white">Adicione Créditos</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No menu lateral, vá em <span className="text-slate-200">Settings &gt; Billing</span> e adicione $5 ou $10 pré-pagos.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-white">Gere a Chave</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vá em <span className="text-slate-200">API Keys</span>, clique em <span className="text-blue-400">+ Create new secret key</span> e copie o código gerado.
            </p>
          </div>

          {/* Passo 4 */}
          <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h4 className="text-xs font-bold text-white">Ative no VERSUS</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cole a chave <span className="font-mono text-slate-300">sk-...</span> no campo acima e clique em <span className="text-emerald-400 font-semibold">Salvar e Ativar</span>.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">Dica de Custo:</strong> Em média, uma recarga de $5 dólares na OpenAI rende mais de 10.000 mensagens com o modelo ultra rápido <span className="font-mono text-slate-300 font-semibold">gpt-4o-mini</span>, proporcionando excelente custo-benefício para suas vendas e atendimento.
          </p>
        </div>
      </div>
    </div>
  );
}
