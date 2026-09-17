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
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Cpu,
  Info
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
    prompt: `Você é o(a) analista de Suporte Técnico Nível 1 da nossa plataforma.
Seu objetivo é auxiliar usuários a solucionar dúvidas operacionais, configurações e diagnosticar incidentes com precisão.

DIRETRIZES DE SUPORTE:
1. Solicite detalhes objetivos do comportamento inesperado, sistema operacional e mensagens de erro exibidas.
2. Forneça instruções passo a passo numeradas e fáceis de reproduzir.
3. Incentive o envio de capturas de tela quando necessário para esclarecer o contexto.
4. Se o incidente envolver falha crítica, instabilidade de servidor ou dados sensíveis, direcione imediatamente para o plantão de engenharia humana.`,
  },
];

export default function AgentPage() {
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
      setConfig({
        aiName: data.aiName || "Vitor (IA)",
        aiModel: data.aiModel || "gpt-4o-mini",
        aiPrompt: data.aiPrompt || "",
        aiKnowledgeBase: data.aiKnowledgeBase || "",
        aiTemperature: typeof data.aiTemperature === "number" ? data.aiTemperature : 0.7,
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

  // Salvar Configurações
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch("/agent/config", config);
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
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyPreset = (promptText: string) => {
    if (config.aiPrompt.trim() && !confirm("Deseja substituir o System Prompt atual por este modelo?")) {
      return;
    }
    setConfig((prev) => ({ ...prev, aiPrompt: promptText }));
    toast.success("Preset de persona aplicado ao Prompt!");
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
      toast.loading("Indexando e gerando embeddings pgvector...", { id: "rag-upload" });
      await api.post("/agent/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Documento PDF indexado com sucesso!", { id: "rag-upload" });
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
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return;

    const userMsg = { role: "user" as const, content: currentMessage.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      const res = await api.post("/agent/playground", {
        messages: newMessages,
        config: config,
      });

      if (res.data && res.data.resposta_cliente) {
        setMessages([...newMessages, { role: "assistant", content: res.data.resposta_cliente }]);
      } else {
        toast.error("Resposta não compreendida pelo modelo.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na comunicação com a IA durante o teste.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentMessage("");
    toast.info("Histórico do playground resetado.");
  };

  // Rótulo da Temperatura
  const getTemperatureLabel = (val: number) => {
    if (val < 0.35) return { text: "Determinístico & Preciso (Zero Alucinações)", color: "text-cyan-400", badge: "bg-cyan-500/10 border-cyan-500/30" };
    if (val <= 0.75) return { text: "Equilibrado Corporativo (Recomendado)", color: "text-blue-400", badge: "bg-blue-500/10 border-blue-500/30" };
    return { text: "Criativo & Persuasivo (Alta Fluidez)", color: "text-amber-400", badge: "bg-amber-500/10 border-amber-500/30" };
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

  const tempInfo = getTemperatureLabel(config.aiTemperature);

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto gap-6 p-4 md:p-6 font-sans">
      
      {/* CABEÇALHO CORPORATIVO */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/10">
            <Bot size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
                Agente de Inteligência Artificial
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                VERSUS Neural Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure a persona, motor de inferência, regras de negócio e a base de conhecimento vetorial (RAG) do seu bot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? "Salvando..." : "Salvar Configurações"}</span>
          </button>
        </div>
      </header>

      {/* CORPO: 2 COLUNAS (CONFIGURAÇÃO À ESQUERDA + PLAYGROUND À DIREITA) */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 items-start overflow-hidden">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE ENGENHARIA DE PROMPT & RAG */}
        <div className="flex-1 w-full space-y-6 overflow-y-auto pr-1 custom-scrollbar max-h-full pb-8">
          
          {/* CARD 1: IDENTIDADE & MOTOR COGNITIVO */}
          <section className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Identidade & Modelo Cognitivo
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Parâmetros centrais de inferência</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Agente */}
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
                  className="w-full bg-[#070D1B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-all font-medium"
                />
                <p className="text-[10px] text-slate-500">Como a IA se apresenta aos clientes no WhatsApp e chat.</p>
              </div>

              {/* Modelo OpenAI */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Motor de Inteligência (OpenAI)
                </label>
                <div className="relative">
                  <select
                    name="aiModel"
                    value={config.aiModel}
                    onChange={handleChange}
                    className="w-full bg-[#070D1B] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-cyan-300 outline-none focus:border-cyan-500/50 transition-all cursor-pointer appearance-none pr-8"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Recomendado • Ultra Rápido & Econômico)</option>
                    <option value="gpt-4o">GPT-4 Omni (Raciocínio Avançado & Alta Complexidade)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legado)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">O modelo define a velocidade de resposta e poder de raciocínio.</p>
              </div>
            </div>
          </section>

          {/* CARD 2: INSTRUÇÕES DO SISTEMA (SYSTEM PROMPT) */}
          <section className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Instruções do Sistema (System Prompt)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Regras inegociáveis de conduta e tom de voz</span>
            </div>

            {/* PRESETS DE PERSONA */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Modelos de Persona Prontos (Clique para aplicar):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PROMPT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.prompt)}
                    className="p-2.5 rounded-xl bg-[#070D1B] border border-slate-800 hover:border-cyan-500/40 hover:bg-[#0C152B] transition-all text-left flex flex-col gap-1 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {p.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {p.id === "sac" && "Acolhimento amigável e resolução ágil"}
                      {p.id === "sdr" && "Qualificação BANT e agendamento de reuniões"}
                      {p.id === "support" && "Diagnóstico técnico e instruções passo a passo"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* TEXTAREA DO PROMPT */}
            <div className="space-y-1.5">
              <textarea
                name="aiPrompt"
                rows={9}
                value={config.aiPrompt}
                onChange={handleChange}
                placeholder="Defina detalhadamente a personalidade, o que o bot deve fazer, como responder, o que não pode prometer e quando transferir..."
                className="w-full bg-[#070D1B] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 leading-relaxed resize-none transition-all shadow-inner"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Info size={12} className="text-cyan-400" />
                  Dica: Instrua a IA a ser amigável e usar quebras de linha curtas para o WhatsApp.
                </span>
                <span>{config.aiPrompt.length} caracteres</span>
              </div>
            </div>
          </section>

          {/* CARD 3: BASE DE CONHECIMENTO & RAG (MEMORY INJECTION + DOCUMENTOS PDF) */}
          <section className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Base de Conhecimento Corporativa (RAG & Memória)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Documentos e FAQs consultados pela IA</span>
            </div>

            {/* PARTE A: INJEÇÃO RÁPIDA DE TEXTO (FAQ, PREÇOS E POLÍTICAS) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Memória Rápida em Texto (FAQs, Produtos & Valores)
                </label>
                <span className="text-[10px] text-slate-500">Injetado diretamente no contexto</span>
              </div>
              <textarea
                name="aiKnowledgeBase"
                rows={6}
                value={config.aiKnowledgeBase}
                onChange={handleChange}
                placeholder="Exemplo de Conteúdo:&#10;• Planos: Básico R$ 97/mês, Pro R$ 197/mês.&#10;• Horário de Atendimento: Segunda a Sexta, das 08h às 18h.&#10;• Formas de Pagamento: Cartão de Crédito e Pix com desconto.&#10;• Política de Reembolso: 7 dias de garantia incondicional."
                className="w-full bg-[#070D1B] border border-slate-800 rounded-xl p-4 text-xs font-sans text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 leading-relaxed resize-none transition-all shadow-inner"
              />
            </div>

            {/* PARTE B: UPLOAD DE DOCUMENTOS PDF COM CHUNKING & PGVECTOR */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-cyan-400" />
                    <span>Manuais & Documentos em PDF (RAG Vetorial)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Os PDFs são quebrados em chunks semânticos e consultados com embeddings via PostgreSQL pgvector.
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
                    className={`px-3.5 py-2 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                      uploadingDoc ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    <span>{uploadingDoc ? "Indexando..." : "Upload PDF"}</span>
                  </label>
                </div>
              </div>

              {/* LISTAGEM DE DOCUMENTOS INDEXADOS */}
              {documents.length === 0 ? (
                <div className="p-5 text-center bg-[#070D1B] border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Nenhum documento PDF indexado na base vetorial ainda.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Faça upload de propostas, catálogos ou políticas da empresa em PDF.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-[#070D1B] border border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                          <FileText size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{doc.filename}</p>
                          <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 size={10} /> Indexado no pgvector
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                        title="Remover documento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CARD 4: CALIBRAÇÃO DE TEMPERATURA & CRIATIVIDADE */}
          <section className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Calibração de Criatividade (Temperature)
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tempInfo.badge} ${tempInfo.color}`}>
                {config.aiTemperature.toFixed(2)} • {tempInfo.text.split(" ")[0]}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Nível Atual:</span>
                <span className={`text-xs font-bold ${tempInfo.color}`}>
                  {tempInfo.text}
                </span>
              </div>

              {/* SLIDER CUSTOMIZADO */}
              <input
                type="range"
                name="aiTemperature"
                min="0"
                max="1"
                step="0.05"
                value={config.aiTemperature}
                onChange={handleChange}
                className="w-full h-2 bg-[#070D1B] rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>0.0 (Determinístico / Robótico)</span>
                <span>0.5 (Equilibrado)</span>
                <span>1.0 (Criativo / Persuasivo)</span>
              </div>
            </div>
          </section>

        </div>

        {/* COLUNA DIREITA: PLAYGROUND DE SIMULAÇÃO EM TEMPO REAL */}
        <div className="w-full lg:w-[420px] shrink-0 h-[620px] lg:h-[calc(100vh-170px)] bg-[#0B1224] border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          
          {/* HEADER DO PLAYGROUND */}
          <div className="p-3.5 px-4 bg-[#070D1B] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Bot size={16} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-[#070D1B]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide truncate max-w-[170px]">
                  {config.aiName || "Assistente Virtual"}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {config.aiModel} • Temp {config.aiTemperature}
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
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#070D1B]/50 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1 shadow-sm">
                  <Bot size={20} />
                </div>
                <p className="text-xs font-bold text-white">Playground de Teste em Tempo Real</p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[260px]">
                  Envie uma mensagem simulando o cliente para testar como <strong className="text-cyan-300">{config.aiName || "o bot"}</strong> responde com base no seu System Prompt e RAG.
                </p>
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
                <span className="font-medium text-[11px]">{config.aiName || "O agente"} está digitando...</span>
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
              <p>O playground não envia mensagens para o WhatsApp real e não grava leads no CRM.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}