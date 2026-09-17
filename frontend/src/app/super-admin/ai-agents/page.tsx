"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Bot, 
  Terminal, 
  BookOpen, 
  Sliders, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Send, 
  RefreshCw, 
  Loader2, 
  Save, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
  Check,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

// Presets Corporativos de Persona e Roteiro de Atendimento
const PROMPT_PRESETS = [
  {
    id: "sac",
    title: "Atendimento & SAC",
    badge: "Recepção",
    description: "Acolhimento profissional e resolução metódica de dúvidas",
    prompt: `Você é o(a) assistente virtual oficial da nossa empresa.
Sua missão é atender clientes e potenciais clientes via WhatsApp com extremo profissionalismo, empatia e agilidade.

DIRETRIZES DE CONDUTA:
1. Cumprimente o cliente com educação, cordialidade e tom humano corporativo.
2. Responda de forma clara e objetiva, em parágrafos curtos adequados para leitura no celular.
3. Utilize exclusivamente as informações da Base de Conhecimento para responder sobre produtos, serviços, prazos e preços.
4. Caso o cliente solicite algo fora da sua base ou peça um atendente humano, informe cordialmente que você irá transferir para um especialista da equipe.
5. Jamais invente dados técnicos, valores ou prazos inexistentes.`,
  },
  {
    id: "sdr",
    title: "Qualificação & Vendas (SDR)",
    badge: "Comercial",
    description: "Qualificação consultiva e condução para fechamento",
    prompt: `Você é o(a) consultor(a) comercial e especialista de pré-vendas (SDR) da nossa empresa.
Seu objetivo principal é acolher leads interessados, diagnosticar suas necessidades e qualificá-los para agendamento de uma demonstração ou fechamento de proposta.

ROTEIRO DE ATENDIMENTO:
1. Acolha o lead com entusiasmo profissional e segurança.
2. Faça perguntas investigativas curtas para entender a dor atual do lead e o volume de demanda.
3. Apresente os diferenciais da nossa solução de forma consultiva e focada no valor gerado.
4. Conduza o lead para o próximo passo natural: agendar uma reunião com o consultor ou receber a proposta detalhada.
5. Mantenha uma comunicação empática, segura e persuasiva.`,
  },
  {
    id: "support",
    title: "Suporte Técnico N1",
    badge: "Técnico",
    description: "Diagnóstico estruturado e instruções passo a passo",
    prompt: `Você é o(a) analista de Suporte Técnico Nível 1 da nossa plataforma.
Seu objetivo é auxiliar usuários a solucionar dúvidas operacionais, configurações e diagnosticar incidentes com precisão.

DIRETRIZES DE SUPORTE:
1. Solicite detalhes objetivos do comportamento inesperado, sistema operacional e mensagens de erro exibidas.
2. Forneceça instruções passo a passo numeradas e fáceis de reproduzir.
3. Incentive o envio de capturas de tela quando necessário para esclarecer o contexto.
4. Se o incidente envolver falha crítica, instabilidade de servidor ou dados sensíveis, direcione imediatamente para o plantão de engenharia humana.`,
  },
];

// Perguntas Rápidas de Simulação para o Playground
const QUICK_PROMPTS = [
  "Quais são os planos e preços?",
  "Gostaria de falar com um atendente humano.",
  "Qual o horário de atendimento?",
  "Vocês oferecem suporte e garantia?",
];

export default function SuperAdminAiAgentsPage() {
  // Lista de Tenants para Governança Centralizada
  const [tenants, setTenants] = useState<{ id: string; name: string; document?: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Estados de Configuração da IA
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    aiName: "Vitor (IA)",
    aiModel: "gpt-4o-mini",
    aiPrompt: "",
    aiKnowledgeBase: "",
    aiTemperature: 0.7,
  });

  // Documentos RAG
  const [documents, setDocuments] = useState<{ id: string; filename: string; createdAt?: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Playground State
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const playgroundEndRef = useRef<HTMLDivElement>(null);

  // Carregar Lista de Empresas (Tenants)
  useEffect(() => {
    async function loadTenants() {
      try {
        setLoadingTenants(true);
        const res = await api.get("/tenants", { params: { limit: "100" } });
        const list = res.data?.data || res.data || [];
        setTenants(list);
        if (list.length > 0) {
          setSelectedTenantId(list[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar lista de empresas:", err);
      } finally {
        setLoadingTenants(false);
      }
    }
    loadTenants();
  }, []);

  // Carregar Configuração e Documentos do Tenant Selecionado
  const loadTenantConfig = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setLoadingConfig(true);
    try {
      const headers = { "x-target-tenant-id": tenantId };
      const [configRes, docsRes] = await Promise.all([
        api.get("/agent/config", { headers }),
        api.get("/agent/documents", { headers }).catch(() => ({ data: [] })),
      ]);

      if (configRes.data) {
        const rawTemp = typeof configRes.data.aiTemperature === "number" 
          ? configRes.data.aiTemperature 
          : parseFloat(configRes.data.aiTemperature);

        setConfig({
          aiName: configRes.data.aiName || "Vitor (IA)",
          aiModel: configRes.data.aiModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
          aiPrompt: configRes.data.aiPrompt || "",
          aiKnowledgeBase: configRes.data.aiKnowledgeBase || "",
          aiTemperature: isNaN(rawTemp) ? 0.7 : rawTemp,
        });
      }

      setDocuments(docsRes.data || []);
      setMessages([]); // Reseta histórico de simulação ao trocar de empresa
    } catch (err: any) {
      console.error("Erro ao carregar configurações de IA do tenant:", err);
      toast.error("Falha ao carregar configurações de IA desta empresa.");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadTenantConfig(selectedTenantId);
    }
  }, [selectedTenantId, loadTenantConfig]);

  // Atualização dos inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "aiTemperature") {
      const parsed = parseFloat(value);
      setConfig((prev) => ({
        ...prev,
        aiTemperature: isNaN(parsed) ? 0.7 : parsed,
      }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const applyPreset = (presetPrompt: string) => {
    setConfig((prev) => ({ ...prev, aiPrompt: presetPrompt }));
    toast.success("Preset de persona aplicado ao prompt com sucesso!");
  };

  // Salvar Configurações
  const handleSave = async () => {
    if (!selectedTenantId) {
      toast.error("Nenhuma empresa selecionada para salvar.");
      return;
    }

    setSaving(true);
    try {
      const headers = { "x-target-tenant-id": selectedTenantId };
      const safeTemp = Math.min(Math.max(Number(config.aiTemperature) || 0.7, 0), 1.5);
      
      await api.patch(
        "/agent/config",
        {
          aiName: config.aiName.trim() || "Vitor (IA)",
          aiModel: config.aiModel,
          aiPrompt: config.aiPrompt,
          aiKnowledgeBase: config.aiKnowledgeBase,
          aiTemperature: safeTemp,
        },
        { headers }
      );

      toast.success("Diretrizes da IA salvas e sincronizadas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar configurações do bot:", err);
      const msg = err?.response?.data?.message || "Erro ao salvar alterações no banco de dados.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Upload de Documentos RAG
  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos para indexação vetorial.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("O arquivo PDF deve ter no máximo 15MB.");
      return;
    }

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers = { 
        "x-target-tenant-id": selectedTenantId,
        "Content-Type": "multipart/form-data"
      };
      await api.post("/agent/upload-knowledge", formData, { headers });
      toast.success(`Documento "${file.name}" indexado com sucesso no pgvector!`);
      // Recarrega documentos
      const docsRes = await api.get("/agent/documents", { headers: { "x-target-tenant-id": selectedTenantId } });
      setDocuments(docsRes.data || []);
    } catch (err: any) {
      console.error("Erro ao fazer upload do documento RAG:", err);
      toast.error(err?.response?.data?.message || "Erro ao indexar documento na base de conhecimento.");
    } finally {
      setUploadingDoc(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      const headers = { "x-target-tenant-id": selectedTenantId };
      await api.delete(`/agent/documents/${id}`, { headers });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Documento removido da base vetorial.");
    } catch (err: any) {
      console.error("Erro ao excluir documento:", err);
      toast.error("Erro ao remover documento da base.");
    }
  };

  // Playground Chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentMessage.trim() || isGenerating) return;

    const userText = currentMessage.trim();
    const newMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(newMessages);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      const headers = { "x-target-tenant-id": selectedTenantId };
      const safeTemp = Math.min(Math.max(Number(config.aiTemperature) || 0.7, 0), 1.5);

      const res = await api.post(
        "/agent/playground",
        {
          messages: newMessages,
          config: {
            ...config,
            aiTemperature: safeTemp,
          },
        },
        { headers }
      );

      if (res.data && res.data.resposta_cliente) {
        setMessages([...newMessages, { role: "assistant", content: res.data.resposta_cliente }]);
      } else if (res.data && (res.data.reply || res.data.response || res.data.content)) {
        setMessages([...newMessages, { role: "assistant", content: res.data.reply || res.data.response || res.data.content }]);
      } else {
        toast.error("Resposta não estruturada recebida do modelo.");
      }
    } catch (err: any) {
      console.error("Erro no playground:", err);
      const msg = err?.response?.data?.message || "Erro de comunicação com a IA durante o teste.";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentMessage("");
    toast.info("Histórico do simulador resetado.");
  };

  useEffect(() => {
    playgroundEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Labels sóbrios de temperatura
  const getTemperatureDescription = (val: number) => {
    if (val < 0.35) return "Determinístico & Preciso (Respostas estritamente fundamentadas na base)";
    if (val <= 0.75) return "Equilibrado Corporativo (Padrão recomendado para atendimento humanizado)";
    return "Criativo & Persuasivo (Maior flexibilidade no vocabulário e condução consultiva)";
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 font-sans text-slate-100">
      
      {/* 1. TOP HEADER EXECUTIVO COM GOVERNANÇA GLOBAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Governança de Agentes de IA
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Master Console
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gerenciamento centralizado de modelos, prompts cognitivos, bases de conhecimento (RAG) e simulações em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLES SUPER ADMIN: SELETOR DE EMPRESA + BOTÃO DE SALVAR */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Tenant */}
          <div className="flex items-center gap-2 bg-[#0B1224] border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Building2 size={16} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 font-medium hidden sm:inline">Empresa:</span>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={loadingTenants}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-2 max-w-[180px] truncate"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0B1224] text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Salvar Alterações */}
          <button
            onClick={handleSave}
            disabled={saving || loadingConfig}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? "Salvando..." : "Salvar Configurações"}</span>
          </button>
        </div>
      </div>

      {loadingConfig ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 rounded-2xl bg-[#0B1224] border border-slate-800" />
          <div className="h-96 rounded-2xl bg-[#0B1224] border border-slate-800" />
          <div className="h-64 rounded-2xl bg-[#0B1224] border border-slate-800" />
        </div>
      ) : (
        /* LAYOUT FLUIDO E CONTÍNUO: SEM CAIXAS ANINHADAS E SEM SCROLL INTERNO PRESO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: CONFIGURAÇÕES DO AGENTE (7 COLUNAS) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* SEÇÃO 1: IDENTIDADE DO AGENTE & MOTOR COGNITIVO */}
            <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-4">
                <ShieldCheck size={18} className="text-slate-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Identidade do Agente & Motor de Processamento
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nome do Atendente Virtual
                  </label>
                  <input
                    type="text"
                    name="aiName"
                    value={config.aiName}
                    onChange={handleChange}
                    placeholder="Ex: Vitor (IA)"
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Nome com o qual o robô se apresenta aos clientes nas conversas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Motor Cognitivo (OpenAI)
                  </label>
                  <select
                    name="aiModel"
                    value={config.aiModel}
                    onChange={handleChange}
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white outline-none focus:border-slate-600 transition-colors cursor-pointer"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Recomendado • Ultra Rápido e Econômico)</option>
                    <option value="gpt-4o">GPT-4 Omni (Raciocínio Complexo & Multimodal)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Modelo de última geração com suporte nativo a JSON estruturado.
                  </p>
                </div>
              </div>

              {/* PRESETS RÁPIDOS DE PERSONA */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-slate-300">
                  Modelos Prontos de Persona & Conduta
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PROMPT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.prompt)}
                      className="p-3.5 text-left rounded-xl bg-[#070D1B] border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all text-xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white group-hover:text-slate-200">
                          {p.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: INSTRUÇÕES DO SISTEMA (SYSTEM PROMPT) */}
            <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <Terminal size={18} className="text-slate-300" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Diretrizes do Sistema (System Prompt)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Roteiro principal de atendimento, limites operacionais e postura do atendente.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800/70 border border-slate-700/60 px-2 py-0.5 rounded">
                  {config.aiPrompt.length} caracteres
                </span>
              </div>

              <textarea
                name="aiPrompt"
                rows={16}
                value={config.aiPrompt}
                onChange={handleChange}
                placeholder="Insira as diretrizes detalhadas de atendimento, regras de qualificação, perguntas permitidas e limites de atuação do robô..."
                className="w-full min-h-[380px] bg-[#070D1B] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-slate-600 leading-relaxed transition-colors resize-y"
              />

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#070D1B] border border-slate-800 text-xs text-slate-400">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Dica de Engenharia:</strong> Oriente o atendente a fazer no máximo 1 pergunta por mensagem e a manter frases objetivas para evitar que o lead abandone a conversa no WhatsApp.
                </p>
              </div>
            </div>

            {/* SEÇÃO 3: BASE DE CONHECIMENTO (RAG & MEMÓRIA DE TEXTO) */}
            <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-4">
                <BookOpen size={18} className="text-slate-300" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Base de Conhecimento & RAG
                  </h2>
                  <p className="text-xs text-slate-400">
                    Memória rápida de texto e manuais em PDF indexados com busca semântica vetorial (pgvector).
                  </p>
                </div>
              </div>

              {/* Memória Rápida de Texto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <FileText size={15} className="text-slate-400" />
                    <span>Memória Rápida de Texto (Tabelas de Preços, Endereços & FAQs)</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {config.aiKnowledgeBase.length} caracteres
                  </span>
                </div>
                <textarea
                  name="aiKnowledgeBase"
                  rows={8}
                  value={config.aiKnowledgeBase}
                  onChange={handleChange}
                  placeholder="Ex: Planos mensais: Starter (R$ 197/mês), Pro (R$ 497/mês). Horário de funcionamento: Seg a Sex das 08h às 18h..."
                  className="w-full min-h-[180px] bg-[#070D1B] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-slate-600 leading-relaxed transition-colors resize-y"
                />
              </div>

              {/* Upload e Lista de PDFs */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-slate-300">
                  Documentos & Manuais em PDF (Indexação Vetorial)
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#070D1B] border border-slate-800">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">Fazer upload de novo arquivo PDF</p>
                    <p className="text-[11px] text-slate-500">
                      O arquivo é fragmentado e gravado no banco de vetores para busca semântica contextual.
                    </p>
                  </div>
                  <label className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 cursor-pointer transition-colors ${uploadingDoc ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    <span>{uploadingDoc ? "Processando..." : "Selecionar PDF"}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleUploadDoc}
                      className="hidden"
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>

                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#070D1B] border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={16} className="text-slate-400 shrink-0" />
                          <span className="text-slate-200 truncate font-medium">{doc.filename}</span>
                          {doc.createdAt && (
                            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                              • {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remover documento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">
                    Nenhum documento PDF indexado para esta empresa no momento.
                  </p>
                )}
              </div>
            </div>

            {/* SEÇÃO 4: CALIBRAÇÃO & TEMPERATURA */}
            <div className="rounded-2xl bg-[#0B1224] border border-slate-800 p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-4">
                <Sliders size={18} className="text-slate-300" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Calibração de Criatividade & Temperatura
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ajuste fino da previsibilidade e aderência do modelo às regras de negócio.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-[#070D1B] border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Temperatura do Modelo</span>
                  <span className="font-mono font-bold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                    {Number(config.aiTemperature).toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  name="aiTemperature"
                  min="0"
                  max="1.2"
                  step="0.05"
                  value={config.aiTemperature}
                  onChange={handleChange}
                  className="w-full accent-blue-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>0.0 (Preciso / Frio)</span>
                  <span>0.7 (Equilibrado)</span>
                  <span>1.2 (Criativo / Quente)</span>
                </div>

                <p className="text-xs text-slate-400 mt-2 font-medium">
                  {getTemperatureDescription(config.aiTemperature)}
                </p>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: PLAYGROUND DE TESTE EM TEMPO REAL (5 COLUNAS) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl bg-[#0B1224] border border-slate-800 flex flex-col overflow-hidden shadow-xl">
              
              {/* Header do Playground */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#070D1B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Simulador em Tempo Real
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Testando com: <span className="text-slate-200 font-mono">{config.aiModel}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Limpar histórico do teste"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Quick Chips de Simulação Rápida */}
              <div className="p-3 border-b border-slate-800/80 bg-[#070D1B]/50 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentMessage(q);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Área de Mensagens da Conversa */}
              <div className="p-4 space-y-4 min-h-[380px] max-h-[500px] overflow-y-auto custom-scrollbar bg-[#070D1B]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <Bot size={24} />
                    </div>
                    <div className="space-y-1 max-w-[260px]">
                      <p className="text-xs font-semibold text-slate-300">
                        Simulação Pronta
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Envie uma mensagem ou clique em uma pergunta acima para simular a resposta do robô.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-slate-500 mb-1 px-1 font-medium">
                        {m.role === "user" ? "Você (Cliente)" : `${config.aiName}`}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          m.role === "user"
                            ? "bg-slate-800 text-white rounded-tr-sm border border-slate-700"
                            : "bg-[#0B1224] text-slate-200 rounded-tl-sm border border-slate-800 shadow-sm"
                        }`}
                      >
                        <MarkdownRenderer content={m.content} />
                      </div>
                    </div>
                  ))
                )}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <Loader2 size={14} className="animate-spin text-slate-300" />
                    <span>{config.aiName} está gerando a resposta...</span>
                  </div>
                )}
                <div ref={playgroundEndRef} />
              </div>

              {/* Caixa de Entrada do Playground */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-800 bg-[#0B1224] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Digite uma mensagem para simular..."
                  disabled={isGenerating}
                  className="flex-1 bg-[#070D1B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!currentMessage.trim() || isGenerating}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Enviar mensagem"
                >
                  <Send size={15} />
                </button>
              </form>

            </div>

            {/* Banner de Governança Segura */}
            <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-white">🔒 Governança Restrita Super Admin</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este módulo foi realocado exclusivamente para este console. Clientes e usuários comuns não possuem permissão de editar parâmetros e prompts cognitivos da IA.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
