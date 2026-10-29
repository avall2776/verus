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
  MessageSquare,
  Key,
  Clock,
  Zap,
  AlertTriangle,
  GraduationCap,
  Lock,
  X,
  HeartPulse,
  ThumbsDown,
  Filter,
  CheckCircle,
  Flame,
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

interface AiConfigState {
  aiName: string;
  aiModel: string;
  aiPrompt: string;
  aiKnowledgeBase: string;
  aiTemperature: number;
}

interface LearningIncident {
  id: string;
  tenantId: string;
  conversationId?: string;
  contactId?: string;
  sentimento: string;
  tipoIncidente: string;
  reclamouDeBot: boolean;
  trechoCliente?: string;
  respostaIa?: string;
  diagnosticoCausa?: string;
  sugestaoDiretriz?: string;
  status: "PENDENTE" | "ASSIMILADO" | "DESCARTADO";
  assimiladoPor?: string;
  assimiladoEm?: string;
  createdAt: string;
  contact?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function SuperAdminAiAgentsPage() {
  // Lista de Tenants para Governança Centralizada (Inicialização Segura e Uniforme para SSR)
  const [tenants, setTenants] = useState<{ id: string; name: string; document?: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [loadingTenants, setLoadingTenants] = useState<boolean>(true);

  // Estados de Configuração da IA
  const [config, setConfig] = useState<AiConfigState>({
    aiName: "Sofia",
    aiModel: "gpt-4o-mini",
    aiPrompt: "",
    aiKnowledgeBase: "",
    aiTemperature: 0.7,
  });
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Estados de Treinamento & Mentoria do Agente
  const [trainingLogs, setTrainingLogs] = useState<{
    id: string;
    userName?: string;
    feedback: string;
    quotedText?: string;
    targetCategory: string;
    categoryLabel: string;
    explanation: string;
    learnedRule: string;
    createdAt: string;
  }[]>([]);
  const [loadingTrainingLogs, setLoadingTrainingLogs] = useState(false);
  const [trainingFeedback, setTrainingFeedback] = useState("");
  const [quotedTrainingText, setQuotedTrainingText] = useState<string | null>(null);
  const [trainingAi, setTrainingAi] = useState(false);
  const trainingInputRef = useRef<HTMLTextAreaElement>(null);

  // Estados do Radar de Sentimentos & Incidentes de Aprendizado (Fase 86)
  const [incidents, setIncidents] = useState<LearningIncident[]>([]);
  const [incidentMetrics, setIncidentMetrics] = useState<{ total: number; pending: number; assimilated: number }>({
    total: 0,
    pending: 0,
    assimilated: 0,
  });
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<'PENDENTE' | 'ASSIMILADO' | 'ALL'>('PENDENTE');
  const [applyingIncidentId, setApplyingIncidentId] = useState<string | null>(null);
  const [dismissingIncidentId, setDismissingIncidentId] = useState<string | null>(null);

  // Documentos RAG
  const [documents, setDocuments] = useState<{ id: string; filename: string; createdAt?: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Playground State
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const playgroundEndRef = useRef<HTMLDivElement>(null);

  // Governança de Chaves OpenAI & Bypass Super Admin (Modo Teste)
  const [tenantAiStatus, setTenantAiStatus] = useState<{
    tenantId: string;
    tenantName: string;
    aiPlatformKeyAllowed: boolean;
    canUseAi: boolean;
    source: string;
    daysLeft: number | null;
    totalTrialDays: number;
    statusText: string;
    hasCustomKey: boolean;
    maskedCustomKey: string | null;
    lastKeyTestAt: string | null;
  } | null>(null);
  const [loadingAiStatus, setLoadingAiStatus] = useState(false);
  const [togglingPlatformKey, setTogglingPlatformKey] = useState(false);
  const [testingMasterKey, setTestingMasterKey] = useState(false);
  const [extendingTrial, setExtendingTrial] = useState(false);

  // 1. Efeito de Montagem: Restaurar Cache do sessionStorage no Cliente com Segurança pós-hidratação (Zero Mismatch)
  useEffect(() => {
    try {
      const cachedTenants = sessionStorage.getItem("versus_super_tenants_simple");
      if (cachedTenants) {
        const list = JSON.parse(cachedTenants);
        if (Array.isArray(list) && list.length > 0) {
          setTenants(list);
          setLoadingTenants(false);
        }
      }

      const storedTenant = sessionStorage.getItem("versus_super_ai_selected_tenant");
      if (storedTenant) {
        setSelectedTenantId(storedTenant);
        const cachedCfg = sessionStorage.getItem(`versus_super_ai_config_${storedTenant}`);
        if (cachedCfg) {
          setConfig(JSON.parse(cachedCfg));
          setLoadingConfig(false);
        }
        const cachedDocs = sessionStorage.getItem(`versus_super_ai_docs_${storedTenant}`);
        if (cachedDocs) {
          setDocuments(JSON.parse(cachedDocs));
        }
        const cachedStatus = sessionStorage.getItem(`versus_super_ai_status_${storedTenant}`);
        if (cachedStatus) {
          setTenantAiStatus(JSON.parse(cachedStatus));
        }
      }
    } catch (e) {
      console.warn("Erro ao restaurar cache do agente:", e);
    }
  }, []);

  // 2. Carregar Lista de Empresas (Tenants) via API (SWR em Background)
  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await api.get("/tenants", { params: { limit: "100", simple: "true" } });
        const list = res.data?.data || res.data || [];
        setTenants(list);
        try {
          sessionStorage.setItem("versus_super_tenants_simple", JSON.stringify(list));
        } catch {}
        setSelectedTenantId((prev) => {
          if (prev && list.some((t: any) => t.id === prev)) return prev;
          if (list.length > 0) {
            try { sessionStorage.setItem("versus_super_ai_selected_tenant", list[0].id); } catch {}
            return list[0].id;
          }
          return "";
        });
      } catch (err) {
        console.error("Erro ao carregar lista de empresas:", err);
      } finally {
        setLoadingTenants(false);
      }
    }
    loadTenants();
  }, []);

  const fetchTenantAiStatus = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      const res = await api.get(`/tenants/${tenantId}/super-ai-key`);
      setTenantAiStatus(res.data);
      try { sessionStorage.setItem(`versus_super_ai_status_${tenantId}`, JSON.stringify(res.data)); } catch {}
    } catch (err) {
      console.error("Erro ao carregar status de chave do tenant:", err);
    } finally {
      setLoadingAiStatus(false);
    }
  }, []);

  const handleTogglePlatformKey = async () => {
    if (!selectedTenantId) return;
    try {
      setTogglingPlatformKey(true);
      const res = await api.patch(`/tenants/${selectedTenantId}/toggle-platform-key`, {});
      toast.success(res.data.message || "Permissão da Chave Master atualizada!");
      await fetchTenantAiStatus(selectedTenantId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alterar permissão de chave.");
    } finally {
      setTogglingPlatformKey(false);
    }
  };

  const handleSuperTestKey = async () => {
    if (!selectedTenantId) return;
    try {
      setTestingMasterKey(true);
      const res = await api.post(`/tenants/${selectedTenantId}/super-test-ai-key`, {});
      if (res.data.success) {
        toast.success(res.data.message || "Conexão OpenAI validada com sucesso!");
        await fetchTenantAiStatus(selectedTenantId);
      } else {
        toast.error(res.data.message || "Falha na conexão.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao testar chave.");
    } finally {
      setTestingMasterKey(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!selectedTenantId) return;
    try {
      setExtendingTrial(true);
      const res = await api.patch(`/tenants/${selectedTenantId}/super-extend-trial`, { extraDays: 7 });
      toast.success(res.data.message || "Período renovado por +7 dias!");
      await fetchTenantAiStatus(selectedTenantId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao renovar degustação.");
    } finally {
      setExtendingTrial(false);
    }
  };

  const fetchTrainingLogs = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setLoadingTrainingLogs(true);
    try {
      const headers = { "x-target-tenant-id": tenantId };
      const res = await api.get("/agent/training-logs", { headers });
      setTrainingLogs(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar histórico de treinamentos do agente:", err);
    } finally {
      setLoadingTrainingLogs(false);
    }
  }, []);

  const fetchLearningIncidents = useCallback(async (tenantId: string, status?: string) => {
    if (!tenantId) return;
    setLoadingIncidents(true);
    try {
      const headers = { "x-target-tenant-id": tenantId };
      const res = await api.get("/agent/learning-incidents", {
        headers,
        params: status && status !== "ALL" ? { status } : undefined,
      });
      setIncidents(res.data?.incidents || []);
      setIncidentMetrics(res.data?.metrics || { total: 0, pending: 0, assimilated: 0 });
    } catch (err) {
      console.error("Erro ao carregar incidentes de aprendizado:", err);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  const handleApplyIncident = async (incident: LearningIncident) => {
    if (!selectedTenantId || applyingIncidentId) return;
    setApplyingIncidentId(incident.id);
    try {
      const headers = { "x-target-tenant-id": selectedTenantId };
      const res = await api.post(`/agent/learning-incidents/${incident.id}/apply`, {}, { headers });
      toast.success(res.data?.confirmationMessage || "Diretriz aprovada e ensinada ao agente!");
      await Promise.all([
        fetchLearningIncidents(selectedTenantId, incidentStatusFilter),
        fetchTrainingLogs(selectedTenantId),
        loadTenantConfig(selectedTenantId),
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao assimilar diretriz do incidente.");
    } finally {
      setApplyingIncidentId(null);
    }
  };

  const handleDismissIncident = async (incidentId: string) => {
    if (!selectedTenantId || dismissingIncidentId) return;
    setDismissingIncidentId(incidentId);
    try {
      const headers = { "x-target-tenant-id": selectedTenantId };
      await api.patch(`/agent/learning-incidents/${incidentId}/dismiss`, {}, { headers });
      toast.info("Incidente descartado.");
      await fetchLearningIncidents(selectedTenantId, incidentStatusFilter);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao descartar incidente.");
    } finally {
      setDismissingIncidentId(null);
    }
  };

  const handleCoachAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trainingFeedback.trim() || !selectedTenantId || trainingAi) return;

    setTrainingAi(true);
    try {
      const headers = { "x-target-tenant-id": selectedTenantId };
      const res = await api.post(
        "/agent/coach",
        {
          feedback: trainingFeedback.trim(),
          quotedText: quotedTrainingText || undefined,
        },
        { headers }
      );

      const { updatedConfig, log, confirmationMessage, parsedResult } = res.data;

      if (updatedConfig) {
        setConfig((prev) => ({
          ...prev,
          aiPrompt: updatedConfig.aiPrompt !== undefined ? updatedConfig.aiPrompt : prev.aiPrompt,
          aiKnowledgeBase: updatedConfig.aiKnowledgeBase !== undefined ? updatedConfig.aiKnowledgeBase : prev.aiKnowledgeBase,
          aiName: updatedConfig.aiName || prev.aiName,
        }));
        try {
          sessionStorage.setItem(
            `versus_super_ai_config_${selectedTenantId}`,
            JSON.stringify({
              ...config,
              aiPrompt: updatedConfig.aiPrompt !== undefined ? updatedConfig.aiPrompt : config.aiPrompt,
              aiKnowledgeBase: updatedConfig.aiKnowledgeBase !== undefined ? updatedConfig.aiKnowledgeBase : config.aiKnowledgeBase,
              aiName: updatedConfig.aiName || config.aiName,
            })
          );
        } catch {}
      }

      if (log) {
        setTrainingLogs((prev) => [log, ...prev]);
      }

      setTrainingFeedback("");
      setQuotedTrainingText(null);
      toast.success(
        confirmationMessage ||
          `Diretriz assimilada com sucesso na camada: ${parsedResult?.categoryLabel || "Base de Conhecimento"}`
      );
    } catch (err: any) {
      console.error("Erro ao enviar treinamento do agente:", err);
      toast.error(err?.response?.data?.message || "Erro ao processar mentoria com o agente.");
    } finally {
      setTrainingAi(false);
    }
  };

  const handleStartTrainingFromMessage = (messageContent: string) => {
    setQuotedTrainingText(messageContent);
    toast.info("Trecho citado do simulador! Digite abaixo o que a IA deve ajustar.");
    setTimeout(() => {
      trainingInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      trainingInputRef.current?.focus();
    }, 150);
  };

  // Carregar Configuração e Documentos do Tenant Selecionado
  const loadTenantConfig = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try { sessionStorage.setItem("versus_super_ai_selected_tenant", tenantId); } catch {}
    
    // Se não tiver cache deste tenant em específico, exibe loading
    const hasCache = typeof window !== "undefined" && Boolean(sessionStorage.getItem(`versus_super_ai_config_${tenantId}`));
    if (!hasCache) {
      setLoadingConfig(true);
    }

    try {
      const headers = { "x-target-tenant-id": tenantId };
      const [configRes, docsRes] = await Promise.all([
        api.get("/agent/config", { headers }),
        api.get("/agent/documents", { headers }).catch(() => ({ data: [] })),
      ]);
      fetchTenantAiStatus(tenantId);
      fetchTrainingLogs(tenantId);
      fetchLearningIncidents(tenantId, incidentStatusFilter);

      if (configRes.data) {
        const rawTemp = typeof configRes.data.aiTemperature === "number" 
          ? configRes.data.aiTemperature 
          : parseFloat(configRes.data.aiTemperature);

        const newCfg = {
          aiName: configRes.data.aiName || "Sofia",
          aiModel: configRes.data.aiModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
          aiPrompt: configRes.data.aiPrompt || "",
          aiKnowledgeBase: configRes.data.aiKnowledgeBase || "",
          aiTemperature: isNaN(rawTemp) ? 0.7 : rawTemp,
        };
        setConfig(newCfg);
        try { sessionStorage.setItem(`versus_super_ai_config_${tenantId}`, JSON.stringify(newCfg)); } catch {}
      }

      const docs = docsRes.data || [];
      setDocuments(docs);
      try { sessionStorage.setItem(`versus_super_ai_docs_${tenantId}`, JSON.stringify(docs)); } catch {}
      setMessages([]); // Reseta histórico de simulação ao trocar de empresa
    } catch (err: any) {
      console.error("Erro ao carregar configurações de IA do tenant:", err);
      toast.error("Falha ao carregar configurações de IA desta empresa.");
    } finally {
      setLoadingConfig(false);
    }
  }, [fetchTenantAiStatus, fetchTrainingLogs, fetchLearningIncidents, incidentStatusFilter]);

  useEffect(() => {
    if (selectedTenantId) {
      loadTenantConfig(selectedTenantId);
    }
  }, [selectedTenantId, loadTenantConfig]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchLearningIncidents(selectedTenantId, incidentStatusFilter);
    }
  }, [incidentStatusFilter, selectedTenantId, fetchLearningIncidents]);


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
          aiName: config.aiName.trim() || "Sofia",
          aiModel: config.aiModel,
          aiPrompt: config.aiPrompt,
          aiKnowledgeBase: config.aiKnowledgeBase,
          aiTemperature: safeTemp,
        },
        { headers }
      );

      try {
        sessionStorage.setItem(
          `versus_super_ai_config_${selectedTenantId}`,
          JSON.stringify({
            ...config,
            aiName: config.aiName.trim() || "Sofia",
            aiTemperature: safeTemp,
          })
        );
      } catch {}

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
      const headers: Record<string, string> = { 
        "x-target-tenant-id": selectedTenantId,
      };
      await api.post("/agent/documents/upload", formData, { headers });
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

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 font-sans text-slate-100">
      
      {/* 1. TOP HEADER EXECUTIVO COM GOVERNANÇA GLOBAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white shrink-0 shadow-sm">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Governança de Agentes de IA
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Master Console
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gerenciamento centralizado de modelos, prompts cognitivos, bases de conhecimento (RAG) e simulações em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLES SUPER ADMIN: SELETOR DE EMPRESA + BOTÃO DE SALVAR */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Tenant */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs shadow-sm">
            <Building2 size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold hidden sm:inline">Empresa:</span>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={loadingTenants}
              className="bg-transparent text-slate-900 dark:text-white font-bold outline-none cursor-pointer pr-2 max-w-[180px] truncate"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-white dark:bg-[#0B1224] text-slate-900 dark:text-white">
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
          <div className="h-44 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800" />
          <div className="h-96 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800" />
          <div className="h-64 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800" />
        </div>
      ) : (
        /* LAYOUT FLUIDO E CONTÍNUO: SEM CAIXAS ANINHADAS E SEM SCROLL INTERNO PRESO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: CONFIGURAÇÕES DO AGENTE (7 COLUNAS) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* SEÇÃO 0: GOVERNANÇA DE CHAVES OPENAI & MODO TESTE (SUPER ADMIN) */}
            <div className={`rounded-2xl bg-white dark:bg-[#0B1224] border p-6 space-y-5 transition-all shadow-sm ${
              tenantAiStatus?.aiPlatformKeyAllowed 
                ? "border-emerald-300 dark:border-emerald-500/40 shadow-emerald-500/5" 
                : "border-slate-200 dark:border-slate-800"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <Key size={18} className={tenantAiStatus?.aiPlatformKeyAllowed ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Governança de Chave OpenAI & Modo Teste
                  </h2>
                </div>

                {/* Badge de Status Atual */}
                {loadingAiStatus ? (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Carregando...
                  </span>
                ) : tenantAiStatus?.aiPlatformKeyAllowed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck size={13} />
                    Chave Master Liberada (Sem Bloqueio)
                  </span>
                ) : tenantAiStatus?.hasCustomKey ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400">
                    <CheckCircle2 size={13} />
                    BYOK: {tenantAiStatus.maskedCustomKey}
                  </span>
                ) : (tenantAiStatus?.daysLeft || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400">
                    <Clock size={13} />
                    Degustação ({tenantAiStatus?.daysLeft} dias restantes)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-400">
                    <AlertTriangle size={13} />
                    Degustação Expirada
                  </span>
                )}
              </div>

              {/* CARD PRINCIPAL DO TOGGLE (INTERRUPTOR DE TESTES) */}
              <div className={`p-4 rounded-xl border transition-all ${
                tenantAiStatus?.aiPlatformKeyAllowed 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30" 
                  : "bg-slate-50 dark:bg-[#070D1B] border-slate-200 dark:border-slate-800"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Liberar Chave do Sistema (Modo Teste / Super Admin)
                      </span>
                      {tenantAiStatus?.aiPlatformKeyAllowed && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
                      Permite que a conta de <strong className="text-slate-950 dark:text-white">{tenantAiStatus?.tenantName || "esta empresa"}</strong> utilize a chave oficial OpenAI Master do servidor (<code className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-1 py-0.5 rounded font-mono text-[10px] font-semibold">OPENAI_API_KEY</code>) por tempo indeterminado, permitindo realizar testes de chat, WhatsApp e robôs sem a trava dos 7 dias.
                    </p>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={handleTogglePlatformKey}
                    disabled={togglingPlatformKey || loadingAiStatus}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      tenantAiStatus?.aiPlatformKeyAllowed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        tenantAiStatus?.aiPlatformKeyAllowed ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* AÇÕES COMPLEMENTARES: TESTAR CONEXÃO E RENOVAR TRIAL */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSuperTestKey}
                    disabled={testingMasterKey || loadingAiStatus}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {testingMasterKey ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} className="text-amber-500 dark:text-amber-400" />}
                    <span>{testingMasterKey ? "Testando..." : "Testar Conexão OpenAI"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExtendTrial}
                    disabled={extendingTrial || loadingAiStatus}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {extendingTrial ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} className="text-blue-600 dark:text-blue-400" />}
                    <span>{extendingTrial ? "Renovando..." : "+7 Dias de Degustação"}</span>
                  </button>
                </div>

                {tenantAiStatus?.lastKeyTestAt && (
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium" suppressHydrationWarning>
                    Último teste: {new Date(tenantAiStatus.lastKeyTestAt).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </div>
            </div>

            {/* SEÇÃO 1: IDENTIDADE DO AGENTE & MOTOR COGNITIVO */}
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <ShieldCheck size={18} className="text-slate-600 dark:text-slate-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Identidade do Agente & Motor de Processamento
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Nome do Atendente Virtual
                  </label>
                  <input
                    type="text"
                    name="aiName"
                    value={config.aiName}
                    onChange={handleChange}
                    placeholder="Ex: Vitor (IA)"
                    className="w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 transition-colors shadow-sm"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Nome com o qual o robô se apresenta aos clientes nas conversas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Motor Cognitivo (OpenAI)
                  </label>
                  <select
                    name="aiModel"
                    value={config.aiModel}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Recomendado • Ultra Rápido e Econômico)</option>
                    <option value="gpt-4o">GPT-4 Omni (Raciocínio Complexo & Multimodal)</option>
                  </select>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Modelo de última geração com suporte nativo a JSON estruturado.
                  </p>
                </div>
              </div>

              {/* PRESETS RÁPIDOS DE PERSONA */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Modelos Prontos de Persona & Conduta
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PROMPT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.prompt)}
                      className="p-3.5 text-left rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all text-xs group cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-slate-200">
                          {p.title}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEÇÃO 1.5: CANAL DE TREINAMENTO & MENTORIA DA IA DO CLIENTE */}
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-cyan-300 dark:border-cyan-500/40 p-6 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-200 dark:border-cyan-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-600/20 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shrink-0">
                    <GraduationCap size={22} className="text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        Treinamento & Mentoria do Agente
                      </h2>
                      <span className="text-[10px] bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 px-2 py-0.5 rounded-full font-mono uppercase flex items-center gap-1 font-bold">
                        <Lock size={10} /> Canal Interno
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Ensine e oriente <strong className="text-slate-900 dark:text-white">{config.aiName || "Sofia"}</strong> para a empresa <strong className="text-slate-900 dark:text-white">{selectedTenant?.name || "selecionada"}</strong>. As diretrizes são assimiladas na camada ideal (Roteiro, Conhecimento ou Cancelas) e passam a valer imediatamente no WhatsApp e no Simulador.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 px-3 py-1 rounded-xl shrink-0 font-bold">
                  {trainingLogs.length} diretriz(es) aprendida(s)
                </span>
              </div>

              {/* Banner de Garantia */}
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Ambiente de Curadoria: O Curador Neural distribui seu alinhamento entre Persona, Base de Conhecimento e Cancelas de forma segura sem apagar o conteúdo existente.</span>
                </div>
              </div>

              {/* Caixa de Entrada de Treinamento */}
              <form onSubmit={handleCoachAgent} className="space-y-3">
                {quotedTrainingText && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/40 text-xs text-cyan-900 dark:text-cyan-200 animate-fadeIn">
                    <div className="flex items-center gap-2 truncate">
                      <GraduationCap size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">Orientando sobre resposta do simulador:</span>
                      <span className="truncate italic text-slate-600 dark:text-slate-300 text-[11px]">&ldquo;{quotedTrainingText}&rdquo;</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuotedTrainingText(null)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors shrink-0 ml-2 cursor-pointer"
                      title="Remover citação"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 bg-white dark:bg-[#070D1B] border border-cyan-300 dark:border-cyan-500/40 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30 rounded-2xl p-3 transition-all shadow-sm">
                  <textarea
                    ref={trainingInputRef}
                    value={trainingFeedback}
                    onChange={(e) => setTrainingFeedback(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCoachAgent();
                      }
                    }}
                    placeholder={`Diga à ${config.aiName || "Sofia"} o que ela deve ajustar, retirar, acrescentar na base ou como conduzir melhor o atendimento aos leads desta empresa...`}
                    rows={3}
                    className="w-full bg-transparent py-1 px-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none resize-none custom-scrollbar"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Enter</kbd> para enviar ou <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Shift+Enter</kbd> para quebra de linha
                    </span>

                    <button
                      type="submit"
                      disabled={trainingAi || !trainingFeedback.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                    >
                      {trainingAi ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Assimilando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} className="text-cyan-200" />
                          <span>Ensinar {config.aiName || "Sofia"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Histórico de Diretrizes Aprendidas */}
              {loadingTrainingLogs ? (
                <div className="py-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-400" />
                  <span>Carregando histórico de aprendizado do robô...</span>
                </div>
              ) : trainingLogs.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-semibold text-slate-300">
                    Diretrizes Recentes Assimiladas por este Agente
                  </span>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                    {trainingLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-gradient-to-br from-[#0c223c]/80 to-[#081729]/90 border border-cyan-500/30 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 border-b border-cyan-500/20 pb-1.5">
                          <div className="flex items-center gap-2">
                            <Bot size={14} className="text-cyan-400 shrink-0" />
                            <span className="text-white">{config.aiName || "Sofia"}</span>
                            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                              {log.categoryLabel || "Diretriz Assimilada"}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]" suppressHydrationWarning>
                            {new Date(log.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        {log.quotedText && (
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#070D1B] border border-cyan-500/20 text-[11px] text-slate-300 italic border-l-2 border-l-cyan-400">
                            <span className="text-[10px] text-cyan-400 font-bold block not-italic uppercase mb-0.5">
                              Trecho Discutido:
                            </span>
                            &ldquo;{log.quotedText}&rdquo;
                          </div>
                        )}

                        <div className="text-xs text-slate-100 space-y-1">
                          <p className="font-semibold text-cyan-200 text-[11px]">
                            Orientação: &ldquo;{log.feedback}&rdquo;
                          </p>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                            {log.explanation}
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-cyan-400">
                          <span>Diretriz ativa: &ldquo;{log.learnedRule}&rdquo;</span>
                          <span className="text-slate-500 font-mono">{log.userName || "Super Admin"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center max-w-md mx-auto">
                  <Lock size={22} className="opacity-30 mb-1.5 text-slate-400" />
                  <p className="text-slate-300 font-semibold mb-0.5">Nenhuma diretriz cadastrada ainda para este agente.</p>
                  <p className="text-slate-500 text-[11px]">
                    Use o campo acima ou o simulador ao lado para orientar a IA sobre novas regras de negócio, correções e conduta de atendimento.
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO 1.8: RADAR DE SENTIMENTOS & OPORTUNIDADES DE APRENDIZADO CONTÍNUO (FASE 86) */}
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-amber-500/30 p-6 space-y-5 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <HeartPulse size={22} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        Radar de Sentimentos & Ciclo de Aprendizado
                      </h2>
                      <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-2 py-0.5 rounded-full font-mono uppercase flex items-center gap-1 font-bold">
                        <Sparkles size={10} /> Fase 86 • Human-in-the-Loop
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Monitoramento emocional em tempo real no WhatsApp. Transforme atritos, queixas de robô e avaliações baixas em evolução permanente da IA com 1 clique.
                    </p>
                  </div>
                </div>

                {/* Badges de Métricas */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIncidentStatusFilter("PENDENTE")}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      incidentStatusFilter === "PENDENTE"
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Pendentes:</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                      {incidentMetrics.pending}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncidentStatusFilter("ASSIMILADO")}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      incidentStatusFilter === "ASSIMILADO"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Assimilados:</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
                      {incidentMetrics.assimilated}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncidentStatusFilter("ALL")}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      incidentStatusFilter === "ALL"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Todos:</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200">
                      {incidentMetrics.total}
                    </span>
                  </button>
                </div>
              </div>

              {/* Lista de Incidentes de Aprendizado */}
              {loadingIncidents ? (
                <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-amber-400" />
                  <span>Sincronizando radar emocional e incidentes...</span>
                </div>
              ) : incidents.length > 0 ? (
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                  {incidents.map((inc) => {
                    const isPending = inc.status === "PENDENTE";
                    const isAssimilated = inc.status === "ASSIMILADO";

                    return (
                      <div
                        key={inc.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          isPending
                            ? "bg-amber-50/70 dark:bg-gradient-to-br dark:from-[#1c1409]/70 dark:to-[#0F1420] border-amber-300 dark:border-amber-500/40 shadow-sm"
                            : isAssimilated
                            ? "bg-emerald-50/70 dark:bg-[#0A151C]/60 border-emerald-300 dark:border-emerald-500/30"
                            : "bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                        }`}
                      >
                        {/* Header do Incidente */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Tag de Sentimento */}
                            {inc.sentimento === "HOSTIL_RECLAMACAO" ? (
                              <span className="text-[10px] bg-rose-50 dark:bg-red-950 text-rose-800 dark:text-red-300 border border-rose-300 dark:border-red-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Flame size={11} className="text-rose-600 dark:text-red-400" /> Reclamação Hostil
                              </span>
                            ) : inc.sentimento === "FRUSTRADO_IRRITADO" ? (
                              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400" /> Cliente Frustrado/Irritado
                              </span>
                            ) : inc.tipoIncidente === "NOTA_BAIXA_CSAT" ? (
                              <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <ThumbsDown size={11} className="text-rose-600 dark:text-rose-400" /> CSAT Baixo (1-2 Estrelas)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Info size={11} className="text-blue-600 dark:text-blue-400" /> Dúvida Crítica
                              </span>
                            )}

                            {/* Tag de Robô */}
                            {inc.reclamouDeBot && (
                              <span className="text-[10px] bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Bot size={11} className="text-purple-600 dark:text-purple-400" /> Reclamou de Robô / IA
                              </span>
                            )}

                            {/* Contato */}
                            {inc.contact && (
                              <span className="text-[11px] text-slate-800 dark:text-slate-300 font-medium">
                                Lead: <strong className="text-slate-950 dark:text-white font-bold">{inc.contact.name || inc.contact.phone}</strong>
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium" suppressHydrationWarning>
                            {new Date(inc.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        {/* O que o cliente falou */}
                        {inc.trechoCliente && (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-[#070D1B] border border-amber-200 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 border-l-2 border-l-amber-500 shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                              💬 O que o cliente disse no WhatsApp:
                            </span>
                            &ldquo;{inc.trechoCliente}&rdquo;
                          </div>
                        )}

                        {/* Diagnóstico da IA */}
                        {inc.diagnosticoCausa && (
                          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                              🔍 Diagnóstico da Causa-Raiz (Cognitivo):
                            </span>
                            <p className="text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                              {inc.diagnosticoCausa}
                            </p>
                          </div>
                        )}

                        {/* Nova Diretriz Sugerida */}
                        {inc.sugestaoDiretriz && (
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 border-l-2 border-l-emerald-500 space-y-1 shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles size={11} /> Nova Diretriz Proposta pela IA para Evitar Reincidência:
                            </span>
                            <p className="text-[11px] text-emerald-950 dark:text-emerald-100 font-mono leading-relaxed font-semibold">
                              &ldquo;{inc.sugestaoDiretriz}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Barra de Ações */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                          <div>
                            {isAssimilated ? (
                              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                                <CheckCircle size={13} className="text-emerald-400" />
                                Diretriz assimilada por {inc.assimiladoPor || "Super Admin"}
                                {inc.assimiladoEm && (
                                  <span className="text-[10px] text-slate-500 font-mono" suppressHydrationWarning>
                                    ({new Date(inc.assimiladoEm).toLocaleDateString("pt-BR")})
                                  </span>
                                )}
                              </span>
                            ) : inc.status === "DESCARTADO" ? (
                              <span className="text-[11px] text-slate-500 italic">
                                Incidente descartado
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
                                <Clock size={11} /> Aguardando aprovação do gestor para ser assimilada
                              </span>
                            )}
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDismissIncident(inc.id)}
                                disabled={dismissingIncidentId === inc.id || applyingIncidentId === inc.id}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                {dismissingIncidentId === inc.id ? "Descartando..." : "Descartar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApplyIncident(inc)}
                                disabled={applyingIncidentId === inc.id || dismissingIncidentId === inc.id}
                                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md"
                              >
                                {applyingIncidentId === inc.id ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Assimilando na IA...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap size={13} className="text-amber-200" />
                                    <span>Aprovar & Ensinar com 1 Clique</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center max-w-md mx-auto">
                  <CheckCircle2 size={24} className="text-emerald-400 mb-1.5 opacity-80" />
                  <p className="text-slate-300 font-semibold mb-0.5">
                    {incidentStatusFilter === "PENDENTE"
                      ? "Nenhum incidente de atrito pendente!"
                      : "Nenhum registro encontrado neste filtro."}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {incidentStatusFilter === "PENDENTE"
                      ? "O agente está acolhendo os leads com excelente tom emocional. Caso algum cliente expresse atrito ou reclame de robô no WhatsApp, o incidente aparecerá aqui com sugestão de diretriz para aprovação com 1 clique."
                      : "Alterne os filtros acima para ver outros status de incidentes e feedbacks."}
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO 2: INSTRUÇÕES DO SISTEMA (SYSTEM PROMPT) */}
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <Terminal size={18} className="text-slate-600 dark:text-slate-300" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Diretrizes do Sistema (System Prompt)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Roteiro principal de atendimento, limites operacionais e postura do atendente.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 px-2.5 py-0.5 rounded font-semibold">
                  {config.aiPrompt.length} caracteres
                </span>
              </div>

              <textarea
                name="aiPrompt"
                rows={16}
                value={config.aiPrompt}
                onChange={handleChange}
                placeholder="Insira as diretrizes detalhadas de atendimento, regras de qualificação, perguntas permitidas e limites de atuação do robô..."
                className="w-full min-h-[380px] bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500 leading-relaxed transition-colors resize-y shadow-sm"
              />

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Info size={16} className="text-blue-600 dark:text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 dark:text-white">Dica de Engenharia:</strong> Oriente o atendente a fazer no máximo 1 pergunta por mensagem e a manter frases objetivas para evitar que o lead abandone a conversa no WhatsApp.
                </p>
              </div>
            </div>

            {/* SEÇÃO 3: BASE DE CONHECIMENTO (RAG & MEMÓRIA DE TEXTO) */}
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <BookOpen size={18} className="text-slate-600 dark:text-slate-300" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Base de Conhecimento & RAG
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Memória rápida de texto e manuais em PDF indexados com busca semântica vetorial (pgvector).
                  </p>
                </div>
              </div>

              {/* Memória Rápida de Texto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText size={15} className="text-slate-500 dark:text-slate-400" />
                    <span>Memória Rápida de Texto (Tabelas de Preços, Endereços & FAQs)</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                    {config.aiKnowledgeBase.length} caracteres
                  </span>
                </div>
                <textarea
                  name="aiKnowledgeBase"
                  rows={8}
                  value={config.aiKnowledgeBase}
                  onChange={handleChange}
                  placeholder="Ex: Planos mensais: Starter (R$ 197/mês), Pro (R$ 497/mês). Horário de funcionamento: Seg a Sex das 08h às 18h..."
                  className="w-full min-h-[180px] bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500 leading-relaxed transition-colors resize-y shadow-sm"
                />
              </div>

              {/* Upload e Lista de PDFs */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Documentos & Manuais em PDF (Indexação Vetorial)
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Fazer upload de novo arquivo PDF</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      O arquivo é fragmentado e gravado no banco de vetores para busca semântica contextual.
                    </p>
                  </div>
                  <label className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors shadow-sm ${uploadingDoc ? "opacity-50 pointer-events-none" : ""}`}>
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
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200 truncate font-semibold">{doc.filename}</span>
                          {doc.createdAt && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline" suppressHydrationWarning>
                              • {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remover documento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2 font-medium">
                    Nenhum documento PDF indexado para esta empresa no momento.
                  </p>
                )}
              </div>
            </div>

            {/* SEÇÃO 4: CALIBRAÇÃO & TEMPERATURA */}
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <Sliders size={18} className="text-slate-600 dark:text-slate-300" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Calibração de Criatividade & Temperatura
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ajuste fino da previsibilidade e aderência do modelo às regras de negócio.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">Temperatura do Modelo</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded">
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

                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium pt-1">
                  <span>0.0 (Preciso / Frio)</span>
                  <span>0.7 (Equilibrado)</span>
                  <span>1.2 (Criativo / Quente)</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium">
                  {getTemperatureDescription(config.aiTemperature)}
                </p>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: PLAYGROUND DE TESTE EM TEMPO REAL (5 COLUNAS) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xl">
              
              {/* Header do Playground */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white shadow-sm">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Simulador em Tempo Real
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                      Testando com: <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">{config.aiModel}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Limpar histórico do teste"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Quick Chips de Simulação Rápida */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-[#070D1B] flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentMessage(q);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 transition-colors cursor-pointer text-left shadow-sm dark:shadow-none font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Área de Mensagens da Conversa */}
              <div className="p-4 space-y-4 min-h-[380px] max-h-[500px] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#070D1B]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                      <Bot size={24} />
                    </div>
                    <div className="space-y-1 max-w-[260px]">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Simulação Pronta
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
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
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 px-1 font-semibold">
                        {m.role === "user" ? "Você (Cliente)" : `${config.aiName}`}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                          m.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-sm shadow-md"
                            : "bg-white dark:bg-[#0B1224] text-slate-900 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-800 shadow-sm"
                        }`}
                      >
                        <MarkdownRenderer content={m.content} />
                        {m.role === "assistant" && (
                          <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-2.5">
                            <button
                              type="button"
                              onClick={() => handleStartTrainingFromMessage(m.content)}
                              className="text-[10px] text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 font-bold flex items-center gap-1.5 hover:underline cursor-pointer transition-colors"
                              title="Usar esta resposta para orientar e treinar a IA deste cliente"
                            >
                              <GraduationCap size={12} className="text-blue-600 dark:text-cyan-400" />
                              <span>Orientar IA sobre esta resposta</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 p-2 font-medium">
                    <Loader2 size={14} className="animate-spin text-blue-600 dark:text-slate-300" />
                    <span>{config.aiName} está gerando a resposta...</span>
                  </div>
                )}
                <div ref={playgroundEndRef} />
              </div>

              {/* Caixa de Entrada do Playground */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1224] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Digite uma mensagem para simular..."
                  disabled={isGenerating}
                  className="flex-1 bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 transition-colors shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!currentMessage.trim() || isGenerating}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm"
                  title="Enviar mensagem"
                >
                  <Send size={15} />
                </button>
              </form>

            </div>

            {/* Banner de Governança Segura */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-400 space-y-1 shadow-sm">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🔒 Governança Restrita Super Admin</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Este módulo foi realocado exclusivamente para este console. Clientes e usuários comuns não possuem permissão de editar parâmetros e prompts cognitivos da IA.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
