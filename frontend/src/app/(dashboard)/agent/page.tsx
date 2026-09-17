"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Sparkles, 
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
  Cpu,
  Info,
  Zap,
  MessageSquare,
  ArrowRight,
  Sparkle,
  Layers,
  UserCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

// Presets de Persona e Roteiro de Atendimento
const PROMPT_PRESETS = [
  {
    id: "sac",
    title: "Atendimento & SAC",
    badge: "Recepção",
    description: "Acolhimento amigável e resolução ágil de dúvidas",
    prompt: `Você é o(a) assistente virtual oficial da nossa empresa.
Sua missão é atender clientes e potenciais clientes via WhatsApp com extremo profissionalismo, empatia e agilidade.

DIRETRIZES DE CONDUTA:
1. Cumprimente o cliente com educação, cordialidade e tom humano.
2. Responda de forma clara e objetiva, em parágrafos curtos adequados para leitura no celular.
3. Utilize exclusivamente as informações da Base de Conhecimento para responder sobre produtos, serviços, prazos e preços.
4. Caso o cliente solicite algo fora da sua base ou peça um humano, informe cordialmente que você irá transferir para um especialista da equipe.
5. Jamais invente dados técnicos, valores ou prazos inexistentes.`,
  },
  {
    id: "sdr",
    title: "Qualificação & Vendas (SDR)",
    badge: "Comercial",
    description: "Qualificação BANT e condução consultiva para fechamento",
    prompt: `Você é o(a) consultor(a) comercial e especialista de pré-vendas (SDR) da nossa empresa.
Seu objetivo principal é acolher leads interessados, diagnosticar suas necessidades e qualificá-los para agendamento de uma demonstração ou fechamento de proposta.

ROTEIRO DE ATENDIMENTO:
1. Acolha o lead com entusiasmo profissional e energia positiva.
2. Faça perguntas investigativas curtas para entender a dor atual do lead e o volume de demanda.
3. Apresente os diferenciais da nossa solução de forma consultiva e focada no valor gerado.
4. Conduza o lead para o próximo passo natural: agendar uma reunião com o consultor ou receber a proposta detalhada.
5. Mantenha uma comunicação empática, segura e persuasiva.`,
  },
  {
    id: "support",
    title: "Suporte Técnico N1",
    badge: "Técnico",
    description: "Diagnóstico metódico e instruções passo a passo",
    prompt: `Você é o(a) analista de Suporte Técnico Nível 1 da nossa plataforma.
Seu objetivo é auxiliar usuários a solucionar dúvidas operacionais, configurações e diagnosticar incidentes com precisão.

DIRETRIZES DE SUPORTE:
1. Solicite detalhes objetivos do comportamento inesperado, sistema operacional e mensagens de erro exibidas.
2. Forneça instruções passo a passo numeradas e fáceis de reproduzir.
3. Incentive o envio de capturas de tela quando necessário para esclarecer o contexto.
4. Se o incidente envolver falha crítica, instabilidade de servidor ou dados sensíveis, direcione imediatamente para o plantão de engenharia humana.`,
  },
];

// Perguntas Rápidas de Demonstração para o Playground
const QUICK_PROMPTS = [
  "Quais são os planos e preços?",
  "Gostaria de falar com um atendente humano.",
  "Qual o horário de atendimento?",
  "Vocês oferecem garantia?",
];

type TabType = "prompt" | "rag" | "params";

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("prompt");
  const [saving, setSaving] = useState(false);
  
  // Playground State
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const playgroundEndRef = useRef<HTMLDivElement>(null);
  
  // Documentos RAG
  const [documents, setDocuments] = useState<{ id: string; filename: string; createdAt?: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Configurações do Agente
  const [config, setConfig] = useState({
    aiName: "Vitor (IA)",
    aiModel: "gpt-4o-mini",
    aiPrompt: "",
    aiKnowledgeBase: "",
    aiTemperature: 0.7,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["agentConfig"],
    queryFn: async () => {
      const res = await api.get("/agent/config");
      return res.data;
    },
    retry: false,
  });

  const { data: docsData, refetch: refetchDocs } = useQuery({
    queryKey: ["agentDocuments"],
    queryFn: async () => {
      const res = await api.get("/agent/documents");
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (data) {
      const rawTemp = typeof data.aiTemperature === "number" ? data.aiTemperature : parseFloat(data.aiTemperature);
      setConfig({
        aiName: data.aiName || "Vitor (IA)",
        aiModel: data.aiModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
        aiPrompt: data.aiPrompt || "",
        aiKnowledgeBase: data.aiKnowledgeBase || "",
        aiTemperature: isNaN(rawTemp) ? 0.7 : rawTemp,
      });
    }
  }, [data]);

  useEffect(() => {
    if (docsData) {
      setDocuments(docsData);
    }
  }, [docsData]);

  useEffect(() => {
    playgroundEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Temperatura segura garantida
  const safeTemperature = typeof config.aiTemperature === "number" && !isNaN(config.aiTemperature)
    ? config.aiTemperature
    : parseFloat(String(config.aiTemperature)) || 0.7;

  // Salvar Configurações
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch("/agent/config", {
        ...config,
        aiTemperature: safeTemperature,
      });
      toast.success("Cérebro da IA atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações do agente.");
    } finally {
      setSaving(false);
    }
  };

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

  const handleApplyPreset = (promptText: string) => {
    if (config.aiPrompt.trim() && !confirm("Deseja substituir o System Prompt atual por este modelo de persona?")) {
      return;
    }
    setConfig((prev) => ({ ...prev, aiPrompt: promptText }));
    toast.success("Preset de persona aplicado ao System Prompt!");
  };

  // Upload de Documentos RAG
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos para indexação vetorial.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingDoc(true);
      toast.loading("Dividindo em chunks e gerando embeddings pgvector...", { id: "rag-upload" });
      await api.post("/agent/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Documento PDF indexado com sucesso no pgvector!", { id: "rag-upload" });
      refetchDocs();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload e indexar o documento.", { id: "rag-upload" });
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Deseja remover este documento da base de conhecimento da IA?")) return;
    try {
      await api.delete(`/agent/documents/${id}`);
      toast.success("Documento removido da base vetorial.");
      refetchDocs();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover documento.");
    }
  };

  // Playground Message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || currentMessage).trim();
    if (!textToSend || isGenerating) return;

    const userMsg = { role: "user" as const, content: textToSend };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      const res = await api.post("/agent/playground", {
        messages: newMessages,
        config: {
          ...config,
          aiTemperature: safeTemperature,
        },
      });

      if (res.data && res.data.resposta_cliente) {
        setMessages([...newMessages, { role: "assistant", content: res.data.resposta_cliente }]);
      } else if (res.data && (res.data.reply || res.data.response || res.data.content)) {
        setMessages([...newMessages, { role: "assistant", content: res.data.reply || res.data.response || res.data.content }]);
      } else {
        toast.error("Resposta não estruturada recebida do modelo.");
      }
    } catch (error: any) {
      console.error("Erro no playground:", error);
      const serverMsg = error?.response?.data?.message;
      const errorText = typeof serverMsg === "string" ? serverMsg : "Erro na comunicação com a IA durante o teste.";
      toast.error(errorText);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentMessage("");
    toast.info("Histórico de simulação resetado.");
  };

  // Rótulo da Temperatura
  const getTemperatureLabel = (val: number) => {
    if (val < 0.35) return { text: "Determinístico & Preciso (Zero Alucinações)", color: "text-cyan-400", badge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" };
    if (val <= 0.75) return { text: "Equilibrado Corporativo (Recomendado)", color: "text-blue-400", badge: "bg-blue-500/10 border-blue-500/30 text-blue-300" };
    return { text: "Criativo & Persuasivo (Alta Fluidez)", color: "text-amber-400", badge: "bg-amber-500/10 border-amber-500/30 text-amber-300" };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row h-full w-full gap-6 p-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="h-16 w-3/4 bg-[#0B1224] border border-slate-800 rounded-2xl animate-pulse" />
          <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 h-[600px] animate-pulse" />
        </div>
        <div className="w-full lg:w-[420px] bg-[#0B1224] border border-slate-800 rounded-2xl h-[600px] animate-pulse" />
      </div>
    );
  }

  const tempInfo = getTemperatureLabel(safeTemperature);

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto gap-4 md:gap-5 p-4 md:p-6 font-sans">
      
      {/* CABEÇALHO CORPORATIVO */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/10">
            <Bot size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
                Agente de Inteligência Artificial
              </h1>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase tracking-wider">
                VERSUS Neural Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina a persona, regras de atendimento e a base vetorial consultada pelo seu robô de WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? "Salvando Alterações..." : "Salvar Configurações"}</span>
          </button>
        </div>
      </header>

      {/* CORPO: 2 COLUNAS (PAINEL DE CONFIGURAÇÃO EM ABAS + PLAYGROUND SINCRONIZADO) */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0 items-stretch">
        
        {/* COLUNA ESQUERDA: WORKSPACE DE CONFIGURAÇÃO EM ABAS */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#0B1224] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* BARRA DE NAVEGAÇÃO DE ABAS EXECUTIVAS */}
          <div className="flex items-center border-b border-slate-800 bg-[#070D1B] p-2 gap-2 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("prompt")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "prompt"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Terminal size={15} className={activeTab === "prompt" ? "text-cyan-400" : "text-slate-500"} />
              <span>Persona & Prompt</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400 font-mono">
                {config.aiName}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rag")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "rag"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <BookOpen size={15} className={activeTab === "rag" ? "text-cyan-400" : "text-slate-500"} />
              <span>Base de Conhecimento (RAG)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400 font-mono">
                {documents.length} PDF{documents.length !== 1 ? "s" : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("params")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "params"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Sliders size={15} className={activeTab === "params" ? "text-cyan-400" : "text-slate-500"} />
              <span>Calibração & Parâmetros</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400 font-mono">
                {safeTemperature.toFixed(2)}
              </span>
            </button>
          </div>

          {/* CONTEÚDO DAS ABAS (VISIBILIDADE INTEGRAL SEM ROLAGEM DUPLA DESNECESSÁRIA) */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5">
            
            {/* ======================================================== */}
            {/* ABA 1: PERSONA & SYSTEM PROMPT */}
            {/* ======================================================== */}
            {activeTab === "prompt" && (
              <div className="space-y-5">
                
                {/* LINHA SUPERIOR: NOME DO AGENTE + MOTOR COGNITIVO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#070D1B] border border-slate-800/80">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Nome do Atendente Virtual
                    </label>
                    <input
                      type="text"
                      name="aiName"
                      value={config.aiName}
                      onChange={handleChange}
                      placeholder="Ex: Vitor (Atendente Virtual)"
                      className="w-full bg-[#0B1224] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-all font-medium"
                    />
                    <p className="text-[10px] text-slate-500">Como o atendente se apresenta no WhatsApp e no chat.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Motor de Inteligência (OpenAI)
                    </label>
                    <div className="relative">
                      <select
                        name="aiModel"
                        value={config.aiModel}
                        onChange={handleChange}
                        className="w-full bg-[#0B1224] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-cyan-300 outline-none focus:border-cyan-500/50 transition-all cursor-pointer appearance-none pr-8"
                      >
                        <option value="gpt-4o-mini">GPT-4o Mini (Recomendado • Ultra Rápido & Econômico)</option>
                        <option value="gpt-4o">GPT-4 Omni (Raciocínio Avançado & Alta Complexidade)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">Modelos modernos compatíveis com saídas estruturadas.</p>
                  </div>
                </div>

                {/* PRESETS DE PERSONA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-cyan-400" />
                      <span>Modelos de Persona Prontos (Clique para Carregar):</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Substitui o System Prompt</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PROMPT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p.prompt)}
                        className="p-3 rounded-xl bg-[#070D1B] border border-slate-800 hover:border-cyan-500/40 hover:bg-[#0C152B] transition-all text-left flex flex-col gap-1.5 cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {p.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-mono font-medium">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          {p.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TEXTAREA DO SYSTEM PROMPT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal size={13} className="text-cyan-400" />
                      <span>Instruções do Sistema (System Prompt)</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {config.aiPrompt.length} caracteres
                    </span>
                  </div>

                  <textarea
                    name="aiPrompt"
                    rows={12}
                    value={config.aiPrompt}
                    onChange={handleChange}
                    placeholder="Defina com precisão as diretrizes de atendimento, tom de voz, regras de qualificação de vendas e limites operacionais..."
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 leading-relaxed resize-y transition-all shadow-inner"
                  />

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-[#070D1B] border border-slate-800/80 text-[11px] text-slate-400">
                    <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Boas práticas para WhatsApp:</strong> Oriente o atendente a formular no máximo 1 pergunta por mensagem e evitar blocos de texto excessivos.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 2: BASE DE CONHECIMENTO (RAG & PDFS) */}
            {/* ======================================================== */}
            {activeTab === "rag" && (
              <div className="space-y-6">
                
                {/* SUB-SEÇÃO 1: MEMÓRIA RÁPIDA DE TEXTO (CONTEXTO DIRETO) */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} className="text-cyan-400" />
                        <span>Memória Rápida de Texto (Tabelas, Preços & Políticas)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Informações injetadas diretamente no contexto da conversa para consulta rápida e imediata.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {config.aiKnowledgeBase.length} caracteres
                    </span>
                  </div>

                  <textarea
                    name="aiKnowledgeBase"
                    rows={7}
                    value={config.aiKnowledgeBase}
                    onChange={handleChange}
                    placeholder="Exemplo de Conteúdo:&#10;• Planos: Básico R$ 97/mês, Pro R$ 197/mês.&#10;• Horário de Atendimento: Segunda a Sexta, das 08h às 18h.&#10;• Formas de Pagamento: Cartão de Crédito e Pix com desconto.&#10;• Política de Reembolso: 7 dias de garantia incondicional."
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-xl p-4 text-xs font-sans text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 leading-relaxed resize-y transition-all shadow-inner"
                  />
                </div>

                {/* SUB-SEÇÃO 2: DOCUMENTOS PDF COM CHUNKING & PGVECTOR */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen size={14} className="text-cyan-400" />
                        <span>Documentos & Catálogos em PDF (Indexação Vetorial pgvector)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Os arquivos PDF são convertidos em vetores semânticos no PostgreSQL e recuperados automaticamente via RAG quando o cliente faz perguntas sobre o assunto.
                      </p>
                    </div>

                    <div>
                      <input
                        type="file"
                        accept="application/pdf"
                        id="doc-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingDoc}
                      />
                      <label
                        htmlFor="doc-upload"
                        className={`px-4 py-2.5 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                          uploadingDoc ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        <span>{uploadingDoc ? "Indexando no pgvector..." : "Upload Documento PDF"}</span>
                      </label>
                    </div>
                  </div>

                  {/* LISTAGEM DE DOCUMENTOS INDEXADOS */}
                  {documents.length === 0 ? (
                    <div className="p-8 text-center bg-[#070D1B] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500">
                        <FileText size={20} />
                      </div>
                      <p className="text-xs font-semibold text-slate-300">Nenhum documento PDF indexado na base vetorial.</p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        Faça upload de catálogos técnicos, propostas comerciais ou manuais em PDF para que o agente responda dúvidas com precisão.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 bg-[#070D1B] border border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{doc.filename}</p>
                              <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono mt-0.5">
                                <CheckCircle2 size={10} /> Ativo no pgvector
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                            title="Remover documento da base vetorial"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 3: CALIBRAÇÃO DE TEMPERATURA & PARÂMETROS */}
            {/* ======================================================== */}
            {activeTab === "params" && (
              <div className="space-y-6">
                
                {/* CALIBRAÇÃO DE CRIATIVIDADE (TEMPERATURE) */}
                <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders size={14} className="text-cyan-400" />
                        <span>Calibração de Criatividade (Temperature)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Controla a aleatoriedade e o nível de inventividade das respostas geradas pelo modelo.
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border shrink-0 ${tempInfo.badge}`}>
                      {safeTemperature.toFixed(2)} • {tempInfo.text.split(" ")[0]}
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">Modo Atual:</span>
                      <span className={`text-xs font-bold ${tempInfo.color}`}>
                        {tempInfo.text}
                      </span>
                    </div>

                    <input
                      type="range"
                      name="aiTemperature"
                      min="0"
                      max="1"
                      step="0.05"
                      value={safeTemperature}
                      onChange={handleChange}
                      className="w-full h-2 bg-[#0B1224] rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
                    />

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span>0.0 (Determinístico / Rígido)</span>
                      <span>0.7 (Equilibrado Comercial)</span>
                      <span>1.0 (Criativo / Persuasivo)</span>
                    </div>
                  </div>
                </div>

                {/* REGRAS DE TRANSBORDO HUMANO AUTOMÁTICO */}
                <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-400" />
                    <span>Regras de Transbordo Humano (Handover)</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    O cérebro do VERSUS analisa cada mensagem em tempo real. Se o cliente solicitar explicitamente um atendente humano, manifestar intenção de fechamento imediato ou apresentar dúvidas complexas fora da base, a IA executa o transbordo estruturado:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-lg bg-[#0B1224] border border-slate-800 text-[11px]">
                      <span className="font-bold text-slate-200 block mb-1">1. Mensagem de Transição</span>
                      <p className="text-slate-400">Envia uma resposta cordial avisando que um consultor assumirá o chat.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0B1224] border border-slate-800 text-[11px]">
                      <span className="font-bold text-slate-200 block mb-1">2. Resumo Executivo</span>
                      <p className="text-slate-400">Gera um resumo com necessidades, dores e produtos de interesse.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0B1224] border border-slate-800 text-[11px]">
                      <span className="font-bold text-slate-200 block mb-1">3. Fila do Atendente</span>
                      <p className="text-slate-400">Notifica a equipe e deixa o lead pronto para o fechamento.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* COLUNA DIREITA: PLAYGROUND DE SIMULAÇÃO EM TEMPO REAL */}
        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 h-[640px] lg:h-auto bg-[#0B1224] border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          
          {/* HEADER DO PLAYGROUND */}
          <div className="p-3.5 px-4 bg-[#070D1B] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Bot size={16} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#070D1B]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide truncate max-w-[180px]">
                  {config.aiName || "Assistente Virtual"}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {config.aiModel} • Temp {safeTemperature.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Limpar histórico de teste"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* STREAM DE MENSAGENS */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#070D1B]/40 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1 shadow-sm">
                  <Bot size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Playground de Teste em Tempo Real</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1 max-w-[280px]">
                    Envie mensagens para testar como <strong className="text-cyan-300">{config.aiName || "a IA"}</strong> responde com base no seu System Prompt e RAG.
                  </p>
                </div>

                {/* SUGESTÕES RÁPIDAS DE TESTE (QUICK CHIPS) */}
                <div className="pt-2 w-full space-y-1.5 text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                    Sugestões para simulação rápida:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-[#0B1224] hover:bg-[#0E172F] border border-slate-800/80 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-cyan-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                      >
                        <span className="truncate">{prompt}</span>
                        <ArrowRight size={12} className="text-slate-500 group-hover:text-cyan-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? "items-end ml-auto" : "items-start mr-auto"} max-w-[88%]`}
                  >
                    <span className="text-[9px] text-slate-500 mb-1 px-1">
                      {isUser ? "Você (Cliente Simulado)" : config.aiName || "Assistente"}
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed border shadow-sm ${
                        isUser
                          ? "bg-blue-600 text-white border-blue-500 rounded-tr-sm"
                          : "bg-[#0B1224] border-slate-800 text-slate-200 rounded-tl-sm"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isGenerating && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0B1224] border border-slate-800 text-slate-300 text-xs w-fit">
                <Loader2 size={13} className="animate-spin text-cyan-400" />
                <span className="font-medium text-[11px]">{config.aiName || "O agente"} está formulando a resposta...</span>
              </div>
            )}
            <div ref={playgroundEndRef} />
          </div>

          {/* INPUT DO PLAYGROUND */}
          <div className="p-3 bg-[#070D1B] border-t border-slate-800 shrink-0 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#0B1224] border border-slate-800 focus-within:border-cyan-500/50 rounded-xl px-3 py-1.5 transition-all"
            >
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Simule uma mensagem de cliente..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none py-1"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={isGenerating || !currentMessage.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-30 cursor-pointer shrink-0 shadow-sm"
              >
                <Send size={13} />
              </button>
            </form>

            <div className="flex items-start gap-1.5 px-1 text-[10px] text-slate-500">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0 mt-0.5" />
              <p>Ambiente isolado de testes. Nenhuma mensagem é disparada para o WhatsApp real.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}