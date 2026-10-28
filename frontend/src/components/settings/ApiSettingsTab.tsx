"use client";

import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Code2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Power, 
  ExternalLink, 
  Terminal, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  PlayCircle, 
  Layers, 
  Users, 
  Kanban, 
  Send,
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";
import { useTheme } from "@/contexts/ThemeContext";

interface ApiTokenItem {
  id: string;
  name: string;
  tokenPrefix: string;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export default function ApiSettingsTab() {
  const { isWhatsApp } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<"tokens" | "docs" | "simulator">("tokens");
  const [tokens, setTokens] = useState<ApiTokenItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais de Criação e Exibição de Token
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdTokenData, setCreatedTokenData] = useState<{ token: string; name: string } | null>(null);

  // Copiados
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Documentação e Exemplos de Código
  const [codeLang, setCodeLang] = useState<"curl" | "fetch" | "python" | "json">("curl");

  // Simulador de Leads
  const [simForm, setSimForm] = useState({
    name: "Carlos Eduardo da Silva",
    phone: "49998058952",
    email: "carlos.silva@exemplo.com.br",
    value: 2500,
    stage: "new",
    source: "Meta Ads (Instagram)",
    campaign: "Campanha Lançamento Q4",
    notes: "Lead interessado em plano empresarial. Solicita contato via WhatsApp.",
  });
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Obtenção da URL Base da API
  const [baseUrl, setBaseUrl] = useState("https://api.versus.io/api/v1/public");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(`${window.location.origin}/api/v1/public`);
    }
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/api-tokens");
      if (Array.isArray(res.data)) {
        setTokens(res.data);
      }
    } catch (err: any) {
      console.warn("[API_TOKENS_FETCH]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) {
      toast.error("Informe um nome para identificar esta integração.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await api.post("/api/v1/api-tokens", {
        name: newTokenName.trim(),
        permissions: { leads: true, contacts: true, deals: true },
      });

      if (res.data && res.data.token) {
        setCreatedTokenData({
          token: res.data.token,
          name: res.data.data?.name || newTokenName.trim(),
        });
        setIsCreateModalOpen(false);
        setNewTokenName("");
        fetchTokens();
        toast.success("Token de API gerado com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao gerar token.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleToken = async (id: string) => {
    try {
      const res = await api.patch(`/api/v1/api-tokens/${id}/toggle`);
      toast.success(res.data?.message || "Status do token atualizado.");
      fetchTokens();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alternar token.");
    }
  };

  const handleDeleteToken = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente revogar e excluir permanentemente o token "${name}"? Todas as integrações conectadas a ele deixarão de funcionar.`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/api-tokens/${id}`);
      toast.success(`Token "${name}" revogado com sucesso.`);
      fetchTokens();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao revogar token.");
    }
  };

  const handleRunSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    // Encontra o primeiro token ativo
    const activeToken = tokens.find(t => t.isActive);
    if (!activeToken && !createdTokenData?.token) {
      toast.error("Você precisa gerar ao menos um Token de API ativo antes de simular a ingestão.");
      return;
    }

    setSimLoading(true);
    setSimResult(null);

    try {
      // Faz chamada interna usando api cliente autenticada no backend
      const res = await api.post("/api/v1/public/leads", {
        name: simForm.name,
        phone: simForm.phone,
        email: simForm.email,
        value: Number(simForm.value),
        stage: simForm.stage,
        source: simForm.source,
        campaign: simForm.campaign,
        notes: simForm.notes,
        custom_fields: { simulacao: true, canal: "Instagram Lead Ads" },
      }, {
        headers: createdTokenData?.token ? {
          "Authorization": `Bearer ${createdTokenData.token}`
        } : undefined
      });

      setSimResult(res.data);
      toast.success("Lead de teste ingerido com sucesso no CRM e no Inbox!");
    } catch (err: any) {
      console.error("[SIMULATOR_ERROR]", err);
      setSimResult(err.response?.data || { error: err.message });
      toast.error(err.response?.data?.message || "Falha ao enviar lead de teste.");
    } finally {
      setSimLoading(false);
    }
  };

  const formatRelativeDate = (dateStr?: string | null) => {
    if (!dateStr) return "Nunca utilizado";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "há poucos instantes";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    return d.toLocaleDateString("pt-BR");
  };

  // Modelos de Código para a Documentação
  const curlExample = `curl -X POST "${baseUrl}/leads" \\
  -H "Authorization: Bearer <SEU_TOKEN_DE_API>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Carlos Eduardo",
    "phone": "+5549998058952",
    "email": "carlos@empresa.com.br",
    "value": 15000,
    "stage": "new",
    "source": "Meta Ads",
    "campaign": "Campanha Black Friday Q4",
    "ad_name": "Criativo Vídeo 03 - Depoimento",
    "notes": "Cliente busca solução completa para 5 atendentes."
  }'`;

  const fetchExample = `const response = await fetch("${baseUrl}/leads", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <SEU_TOKEN_DE_API>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Carlos Eduardo",
    phone: "+5549998058952",
    email: "carlos@empresa.com.br",
    value: 15000,
    stage: "new",
    source: "Meta Ads",
    campaign: "Campanha Black Friday Q4",
    ad_name: "Criativo Vídeo 03 - Depoimento",
    notes: "Cliente busca solução completa para 5 atendentes."
  })
});

const data = await response.json();
console.log("Lead criado no CRM:", data);`;

  const pythonExample = `import requests

url = "${baseUrl}/leads"
headers = {
    "Authorization": "Bearer <SEU_TOKEN_DE_API>",
    "Content-Type": "application/json"
}
payload = {
    "name": "Carlos Eduardo",
    "phone": "+5549998058952",
    "email": "carlos@empresa.com.br",
    "value": 15000,
    "stage": "new",
    "source": "Meta Ads",
    "campaign": "Campanha Black Friday Q4",
    "ad_name": "Criativo Vídeo 03 - Depoimento",
    "notes": "Cliente busca solução completa para 5 atendentes."
}

response = requests.post(url, json=payload, headers=headers)
print("Status:", response.status_code)
print("Resposta:", response.json())`;

  const jsonPayloadExample = `{
  "name": "Carlos Eduardo",
  "phone": "+5549998058952",
  "email": "carlos@empresa.com.br",
  "value": 15000,
  "stage": "new",
  "source": "Meta Ads",
  "campaign": "Campanha Black Friday Q4",
  "ad_name": "Criativo Vídeo 03 - Depoimento",
  "adset_name": "Público Aberto 25-54 anos",
  "utm_source": "facebook",
  "utm_medium": "paid_social",
  "utm_campaign": "black_friday_2026",
  "notes": "Lead qualificado direto do formulário instantâneo."
}`;

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isWhatsApp ? 'bg-[#00A884]/15 text-[#00A884]' : 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
          }`}>
            <KeyRound size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                APIs & Webhooks de Tráfego Pago
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ingestão Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Conecte formulários do Meta Ads (Facebook/Instagram), landing pages, n8n, Make e Typebot diretamente ao CRM e à fila de atendimento.
            </p>
          </div>
        </div>

        {/* Botão de Criação de Token */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer ${
            isWhatsApp
              ? 'bg-[#00A884] hover:bg-[#02906F] shadow-[#00A884]/20'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
          }`}
        >
          <Plus size={15} />
          <span>Gerar Token de API</span>
        </button>
      </div>

      {/* Sub-Tabs de Navegação (Scroll Suave no Mobile) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab("tokens")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeSubTab === "tokens"
              ? isWhatsApp
                ? 'bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
          }`}
        >
          <KeyRound size={14} />
          <span>Tokens de Acesso ({tokens.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("docs")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeSubTab === "docs"
              ? isWhatsApp
                ? 'bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
          }`}
        >
          <BookOpen size={14} />
          <span>Documentação & Webhook</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("simulator")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeSubTab === "simulator"
              ? isWhatsApp
                ? 'bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
          }`}
        >
          <PlayCircle size={14} />
          <span>Simulador de Lead</span>
        </button>
      </div>

      {/* =========================================================================
          SUB-ABA 1: TOKENS DE ACESSO
          ========================================================================= */}
      {activeSubTab === "tokens" && (
        <div className="flex flex-col gap-4">
          {/* Card de Aviso / Instrução Padrão Lero / Stripe */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
              <span>
                Tokens de API concedem acesso seguro às rotas públicas de ingestão. Nunca compartilhe suas chaves em repositórios públicos.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab("docs")}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 text-xs flex items-center gap-1"
            >
              <span>Ver Documentação</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Tabela de Tokens */}
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span>Carregando tokens cadastrados...</span>
              </div>
            ) : tokens.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400">
                  <KeyRound size={22} />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Nenhum Token de API Gerado</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Gere seu primeiro token para conectar anúncios do Meta Ads, webhooks do n8n, Typebot ou formulários de landing page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                    isWhatsApp
                      ? 'bg-[#00A884] hover:bg-[#02906F]'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Plus size={14} />
                  <span>Gerar Primeiro Token</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3 px-4">Nome da Integração</th>
                      <th className="py-3 px-4">Chave de API</th>
                      <th className="py-3 px-4">Último Acesso</th>
                      <th className="py-3 px-4">Criado em</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {tokens.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>{t.name}</span>
                          </div>
                          {t.createdBy && (
                            <span className="text-[10px] text-slate-400">Criado por {t.createdBy}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <Lock size={11} className="text-slate-400 shrink-0" />
                            <span>{t.tokenPrefix}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {formatRelativeDate(t.lastUsedAt)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleToken(t.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              t.isActive
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-300'
                            }`}
                            title="Clique para alternar o status do token"
                          >
                            {t.isActive ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleToken(t.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={t.isActive ? "Desativar token" : "Ativar token"}
                            >
                              <Power size={13} className={t.isActive ? "text-emerald-500" : "text-slate-400"} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteToken(t.id, t.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Revogar e excluir token permanentemente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 2: DOCUMENTAÇÃO & WEBHOOK
          ========================================================================= */}
      {activeSubTab === "docs" && (
        <div className="flex flex-col gap-6">
          {/* Box de URL Base */}
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoint Base da API</span>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                {baseUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(baseUrl, "base_url")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
            >
              {copiedKey === "base_url" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedKey === "base_url" ? "Copiado!" : "Copiar URL"}</span>
            </button>
          </div>

          {/* Guia Rápido para o Gestor de Tráfego */}
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Sparkles className="text-amber-500" size={17} />
              <span>Como Conectar Campanhas de Tráfego Pago (Meta Ads &rarr; CRM)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">1</span>
                  Autenticação Bearer
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Envie o cabeçalho <code className="text-blue-500 font-mono">Authorization: Bearer &lt;TOKEN&gt;</code> em todas as requisições HTTP.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">2</span>
                  Disparo do Webhook
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  No Meta Leads / n8n / Zapier, aponte a URL do webhook para <code className="text-emerald-500 font-mono">POST /leads</code> com os dados do lead.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">3</span>
                  Entrada Instantânea
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  O lead é criado automaticamente no <strong>CRM Kanban</strong> e entra na fila <strong>"Aguardando"</strong> do Inbox em tempo real.
                </p>
              </div>
            </div>
          </div>

          {/* Endpoint Principal: POST /leads */}
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold">POST</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">/api/v1/public/leads</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">• Ingestão de Leads de Campanhas</span>
              </div>

              {/* Seletor de Linguagem do Exemplo */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCodeLang("curl")}
                  className={`px-2 py-1 rounded-md transition-colors ${codeLang === "curl" ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400"}`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLang("fetch")}
                  className={`px-2 py-1 rounded-md transition-colors ${codeLang === "fetch" ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400"}`}
                >
                  Fetch (JS)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLang("python")}
                  className={`px-2 py-1 rounded-md transition-colors ${codeLang === "python" ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400"}`}
                >
                  Python
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLang("json")}
                  className={`px-2 py-1 rounded-md transition-colors ${codeLang === "json" ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400"}`}
                >
                  JSON Payload
                </button>
              </div>
            </div>

            {/* Código com Syntax Highlight */}
            <div className="relative bg-[#070D18] p-4 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  const toCopy = codeLang === "curl" ? curlExample : codeLang === "fetch" ? fetchExample : codeLang === "python" ? pythonExample : jsonPayloadExample;
                  handleCopy(toCopy, "code_snippet");
                }}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
              >
                {copiedKey === "code_snippet" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedKey === "code_snippet" ? "Copiado!" : "Copiar"}</span>
              </button>
              <pre>{codeLang === "curl" ? curlExample : codeLang === "fetch" ? fetchExample : codeLang === "python" ? pythonExample : jsonPayloadExample}</pre>
            </div>

            {/* Tabela de Parâmetros Aceitos */}
            <div className="p-4 bg-white dark:bg-[#0B1224] border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2.5">
                Parâmetros do Payload (JSON Body):
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="py-2 pr-3">Campo</th>
                      <th className="py-2 pr-3">Tipo</th>
                      <th className="py-2 pr-3">Obrigatório?</th>
                      <th className="py-2">Descrição & Exemplo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">name</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-rose-500 font-bold">Sim</td>
                      <td className="py-2">Nome completo do lead (ex: "Carlos Eduardo").</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">phone</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-rose-500 font-bold">Sim</td>
                      <td className="py-2">Telefone com DDD. Aceita formatos como "+5549998058952", "49998058952" ou "(49) 99805-8952".</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">email</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">E-mail do lead para comunicações e propostas.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">value</td>
                      <td className="py-2 pr-3 font-mono text-emerald-400">number</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">Valor estimado da oportunidade comercial em reais (R$). Ex: 2500.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">stage</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">Estágio do funil CRM (ex: "new", "seed", "qualified", "follow-up"). Padrão: "new".</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">source</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">Origem da oportunidade. Ex: "Meta Ads", "Google Ads", "TikTok", "Landing Page".</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">campaign</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">Nome da campanha de anúncios para relatórios de ROI e conversão.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">ad_name</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">Nome do criativo/anúncio específico que gerou a conversão.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">notes</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">Observações adicionais ou respostas de perguntas do formulário.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-white">assigned_to</td>
                      <td className="py-2 pr-3 font-mono text-purple-400">string (UUID)</td>
                      <td className="py-2 pr-3 text-slate-400">Não</td>
                      <td className="py-2">ID do operador para atribuição direta (consulte via GET /users).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Endpoints Adicionais: GET /funnels e GET /users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">/api/v1/public/funnels</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-2">Mapeamento de Etapas do CRM</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Retorna a listagem dos funis e IDs de cada etapa (Novo Contato, Qualificação, Negociação) para rotear o lead dinamicamente.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Requer Bearer Token</span>
                <span className="text-emerald-500 font-semibold">200 OK</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">/api/v1/public/users</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-2">Listagem de Atendentes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Retorna a lista de colaboradores ativos da equipe com ID e nome para atribuição automática do responsável pelo lead.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Requer Bearer Token</span>
                <span className="text-emerald-500 font-semibold">200 OK</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 3: SIMULADOR / TESTADOR DE LEAD
          ========================================================================= */}
      {activeSubTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Disparo de Teste */}
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1">
              <PlayCircle className="text-emerald-500" size={18} />
              <span>Disparar Lead de Teste no CRM</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Simule a chegada de um lead exatamente como enviado pelo formulário do Meta Ads ou webhook externo.
            </p>

            <form onSubmit={handleRunSimulator} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nome do Lead *</label>
                  <input
                    type="text"
                    required
                    value={simForm.name}
                    onChange={(e) => setSimForm({ ...simForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={simForm.phone}
                    onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    value={simForm.email}
                    onChange={(e) => setSimForm({ ...simForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={simForm.value}
                    onChange={(e) => setSimForm({ ...simForm, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Origem do Anúncio</label>
                  <input
                    type="text"
                    value={simForm.source}
                    onChange={(e) => setSimForm({ ...simForm, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nome da Campanha</label>
                  <input
                    type="text"
                    value={simForm.campaign}
                    onChange={(e) => setSimForm({ ...simForm, campaign: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Observações do Formulário</label>
                <textarea
                  rows={2}
                  value={simForm.notes}
                  onChange={(e) => setSimForm({ ...simForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className={`w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                  isWhatsApp
                    ? 'bg-[#00A884] hover:bg-[#02906F]'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {simLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Processando Lead no Motor VERSUS...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Enviar Lead de Teste via API</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resultado do Teste em Tempo Real */}
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Terminal size={14} className="text-blue-500" />
                  Resposta do Servidor (HTTP Response):
                </span>
                {simResult && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    simResult.success ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                  }`}>
                    {simResult.success ? "HTTP 200 OK" : "Erro"}
                  </span>
                )}
              </div>

              <div className="bg-[#070D18] rounded-xl p-3.5 font-mono text-[11px] text-slate-300 min-h-[220px] max-h-[320px] overflow-y-auto">
                {simResult ? (
                  <pre className="text-emerald-400">{JSON.stringify(simResult, null, 2)}</pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-10">
                    <Send size={24} className="opacity-40 mb-2" />
                    <span>Clique em "Enviar Lead de Teste" para ver o payload de retorno e verificar a chegada do lead no CRM.</span>
                  </div>
                )}
              </div>
            </div>

            {simResult && simResult.success && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Lead cadastrado! Card criado no funil e na fila de espera do Inbox.</span>
                </div>
                <a
                  href="/crm"
                  className="font-bold hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Ver no CRM</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CRIAR NOVO TOKEN DE API
          ========================================================================= */}
      {isCreateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Gerar Token de API</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Para Tráfego Pago, Webhooks ou Integrações</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nome da Integração *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Meta Ads - Gestor de Tráfego"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Identificador que ajudará você a lembrar onde este token foi configurado.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Permissões Incluídas:</div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Check size={12} />
                  <span>Ingestão de Leads e Contatos (POST /leads, POST /contacts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Check size={12} />
                  <span>Criação de Oportunidades no CRM (POST /deals)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Check size={12} />
                  <span>Consulta de Funis e Atendentes (GET /funnels, GET /users)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`px-4 py-2 rounded-xl font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                    isWhatsApp
                      ? 'bg-[#00A884] hover:bg-[#02906F]'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isCreating ? "Gerando..." : "Gerar Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* =========================================================================
          MODAL 2: EXIBIÇÃO ÚNICA DO TOKEN GERADO (PADRÃO STRIPE / GITHUB)
          ========================================================================= */}
      {createdTokenData && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Token de API Gerado!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{createdTokenData.name}</p>
              </div>
            </div>

            {/* Alerta de Cópia Única */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Copie este token de API agora mesmo. Por questões de segurança corporativa, ele <strong>não será exibido novamente</strong> após fechar esta janela.
              </span>
            </div>

            {/* Box com Token Completo */}
            <div className="relative">
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs break-all pr-12 border border-slate-800 select-all">
                {createdTokenData.token}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(createdTokenData.token, "modal_token")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copiar Token Completo"
              >
                {copiedKey === "modal_token" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setCreatedTokenData(null)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                  isWhatsApp ? 'bg-[#00A884] hover:bg-[#02906F]' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
