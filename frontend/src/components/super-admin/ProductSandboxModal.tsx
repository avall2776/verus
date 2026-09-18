"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Terminal, 
  Rocket, 
  Send, 
  Mic, 
  MicOff, 
  StopCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  Copy, 
  Trash2, 
  Check, 
  Cpu, 
  ShieldCheck, 
  Play, 
  RefreshCw,
  Code,
  Zap,
  Bot,
  ChevronRight,
  Server,
  PhoneCall,
  CreditCard,
  Briefcase,
  Users
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface ProductSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onProductUpdated: (updatedProduct: any) => void;
}

export default function ProductSandboxModal({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}: ProductSandboxModalProps) {
  const [activeTab, setActiveTab] = useState<"ai_copilot" | "sandbox_test" | "integration">("ai_copilot");

  // Estado do Chat com IA
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Áudio e Gravação com Whisper
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Laboratório de Testes Sandbox
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Integração em Produção
  const [isIntegrating, setIsIntegrating] = useState(false);

  // Carregar histórico do chat e logs quando o produto é aberto
  useEffect(() => {
    if (product) {
      setChatMessages(product.chatHistory || []);
      setLogs(product.logs || []);
    }
  }, [product]);

  useEffect(() => {
    if (activeTab === "ai_copilot") {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [activeTab, chatMessages]);

  if (!isOpen || !product) return null;

  // Enviar mensagem para o Copilot Técnico
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || chatLoading) return;

    const userMsg = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post(`/engineering/products/${product.id}/chat`, {
        message: text.trim(),
      });

      if (res.data?.chatHistory) {
        setChatMessages(res.data.chatHistory);
      } else if (res.data?.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: "ai-" + Date.now(),
            role: "assistant",
            content: res.data.reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao comunicar com o Copilot Técnico.");
    } finally {
      setChatLoading(false);
    }
  };

  // Gravação de Áudio via Whisper
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleSendAudio(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Acesso ao microfone negado ou não suportado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "audio_prompt.webm");

      const res = await api.post("/engineering/chat/transcribe-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const transcribedText = res.data?.text;
      if (transcribedText?.trim()) {
        toast.success("Áudio transcrito com sucesso!");
        handleSendMessage(transcribedText.trim());
      } else {
        toast.error("Não foi possível transcrever a fala gravada.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Falha ao transcrever o áudio com o Whisper.");
    } finally {
      setIsTranscribing(false);
      setRecordingDuration(0);
    }
  };

  // Executar Bateria de Testes no Sandbox
  const handleRunSandboxTest = async () => {
    setIsRunningTest(true);
    try {
      const res = await api.post(`/engineering/products/${product.id}/test`);
      toast.success(`Bateria de testes executada com sucesso! Estabilidade: ${res.data.stabilityScore}%`);
      
      if (res.data?.logs) {
        setLogs(res.data.logs);
      }

      // Atualizar o produto localmente
      const updated = {
        ...product,
        lastTestRun: new Date().toISOString(),
        lastTestStatus: "PASS",
        stabilityScore: res.data.stabilityScore,
        logs: res.data.logs,
      };
      onProductUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao executar bateria de testes no laboratório.");
    } finally {
      setIsRunningTest(false);
    }
  };

  // Limpar Logs
  const handleClearLogs = async () => {
    try {
      await api.post(`/engineering/products/${product.id}/clear-logs`);
      setLogs([]);
      onProductUpdated({ ...product, logs: [] });
      toast.success("Logs do laboratório limpos com sucesso.");
    } catch (err) {
      toast.error("Erro ao limpar logs.");
    }
  };

  // Copiar Logs para Área de Transferência
  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    toast.success("Logs copiados para a área de transferência.");
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Promover / Integrar ao Sistema de Produção
  const handleIntegrateToProduction = async () => {
    setIsIntegrating(true);
    try {
      const res = await api.post(`/engineering/products/${product.id}/integrate`);
      toast.success(res.data.message || "Módulo homologado e ativado no sistema de produção!");
      
      const updated = {
        ...product,
        status: "EM_PRODUCAO",
        isIntegrated: true,
        integratedAt: new Date().toISOString(),
      };
      onProductUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao integrar módulo no sistema de produção.");
    } finally {
      setIsIntegrating(false);
    }
  };

  // Atualizar Status do Ciclo de Vida
  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await api.patch(`/engineering/products/${product.id}/status`, {
        status: newStatus,
      });
      toast.success(`Status atualizado para "${newStatus.replace("_", " ")}"`);
      onProductUpdated(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao alterar status do produto.");
    }
  };

  // Formatar tempo de gravação
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filtragem de logs
  const filteredLogs = logFilter === "ALL" 
    ? logs 
    : logs.filter((l) => l.level === logFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] bg-[#0B1224] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* HEADER DO MODAL */}
        <div className="p-4 md:px-6 bg-[#070D1B] border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Cpu size={20} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-black text-white tracking-wide">
                  {product.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                  {product.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {product.isolationLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {product.tagline}
              </p>
            </div>
          </div>

          {/* Status Selector & Fechar */}
          <div className="flex items-center gap-2.5 shrink-0">
            <select
              value={product.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-[#0B1224] border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="EM_PLANEJAMENTO">Em Planejamento</option>
              <option value="EM_DESENVOLVIMENTO">Em Desenvolvimento</option>
              <option value="EM_HOMOLOGACAO">Em Homologação</option>
              <option value="EM_PRODUCAO">Em Produção (Ativo)</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS */}
        <div className="px-4 md:px-6 bg-[#091020] border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 py-2">
            <button
              onClick={() => setActiveTab("ai_copilot")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "ai_copilot"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Bot size={14} className="text-purple-400" />
              <span>Copilot de Engenharia (IA)</span>
            </button>

            <button
              onClick={() => setActiveTab("sandbox_test")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "sandbox_test"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Terminal size={14} className="text-blue-400" />
              <span>Laboratório Sandbox (Zero Mocks)</span>
            </button>

            <button
              onClick={() => setActiveTab("integration")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "integration"
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Rocket size={14} className="text-emerald-400" />
              <span>Homologação & Produção</span>
              {product.isIntegrated && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Latência Alvo: <strong className="text-slate-200">{product.targetLatency}</strong></span>
            <span>•</span>
            <span>Estabilidade: <strong className="text-emerald-400">{product.stabilityScore}%</strong></span>
          </div>
        </div>

        {/* CORPO PRINCIPAL DO MODAL */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#070D1B]">

          {/* =========================================================================
              ABA 1: COPILOT DE ENGENHARIA COM IA (CHAT CONTEXTUALIZADO)
              ========================================================================= */}
          {activeTab === "ai_copilot" && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Barra de Instruções & Sugestões Rápidas */}
              <div className="p-3 bg-[#0B1224] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles size={14} className="text-purple-400 shrink-0" />
                  <span className="truncate">
                    Pergunte o que precisa programar, envie códigos implementados para validação ou solicite arquitetura.
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                  <button
                    onClick={() => handleSendMessage("O que preciso programar nesta etapa do projeto?")}
                    className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
                  >
                    O que programar agora?
                  </button>
                  <button
                    onClick={() => handleSendMessage("Quais os contratos de API e payloads recomendados?")}
                    className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
                  >
                    Contratos de API
                  </button>
                  <button
                    onClick={() => handleSendMessage("Como testar este módulo no Sandbox isolado?")}
                    className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
                  >
                    Guia de Teste Sandbox
                  </button>
                </div>
              </div>

              {/* Mensagens do Chat */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex items-start gap-3 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-purple-600/20 border border-purple-500/30 text-purple-300"
                      }`}
                    >
                      {msg.role === "user" ? <Users size={16} /> : <Bot size={16} />}
                    </div>

                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-xl p-3.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-[#0B1224] border border-slate-800 text-slate-200"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}

                      <div
                        className={`text-[10px] font-mono mt-2 flex items-center justify-end ${
                          msg.role === "user" ? "text-blue-200" : "text-slate-500"
                        }`}
                      >
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Bot size={16} className="animate-spin" />
                    </div>
                    <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      <span>Copilot Técnico analisando arquitetura e diretrizes...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Caixa de Entrada de Texto e Gravação de Áudio */}
              <div className="p-3 md:p-4 bg-[#0B1224] border-t border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Botão de Gravação de Áudio Whisper */}
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse cursor-pointer shrink-0"
                      title="Clique para parar e transcrever"
                    >
                      <StopCircle size={15} />
                      <span>{formatTime(recordingDuration)}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isTranscribing || chatLoading}
                      className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
                      title="Gravar instrução por voz (Whisper AI)"
                    >
                      <Mic size={16} className={isTranscribing ? "animate-spin text-purple-400" : ""} />
                    </button>
                  )}

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Converse com a IA sobre o que programar ou cole trechos de código..."
                    disabled={chatLoading || isRecording}
                    className="flex-1 bg-[#070D1B] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
                  >
                    <Send size={14} />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 2: LABORATÓRIO DE TESTES SANDBOX (ZERO MOCKS)
              ========================================================================= */}
          {activeTab === "sandbox_test" && (
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              
              {/* LADO ESQUERDO: CONTROLES & CHECKLIST DE TAREFAS */}
              <div className="w-full md:w-96 border-b md:border-b-0 md:border-r border-slate-800 p-4 bg-[#091020] flex flex-col justify-between overflow-y-auto shrink-0">
                <div className="space-y-4">
                  {/* Card de Disparo da Bateria de Testes */}
                  <div className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                        Bateria de Testes
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        Diagnóstico Real
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Executa rotina isolada de estabilidade, medição de latência e validação de schema sem poluir clientes de produção.
                    </p>

                    <button
                      onClick={handleRunSandboxTest}
                      disabled={isRunningTest}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      <Play size={14} className={isRunningTest ? "animate-spin" : ""} />
                      <span>{isRunningTest ? "Executando Teste..." : "Executar Teste de Sandbox"}</span>
                    </button>
                  </div>

                  {/* Checklist de Etapas de Programação */}
                  <div className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Checklist do Módulo
                    </span>

                    <div className="space-y-2">
                      {product.tasks?.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-[#070D1B] border border-slate-800/80 text-xs"
                        >
                          <div className={`mt-0.5 ${task.done ? "text-emerald-400" : "text-slate-600"}`}>
                            <CheckCircle2 size={14} />
                          </div>
                          <span className={`${task.done ? "text-slate-300" : "text-slate-400"}`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Especificações de Arquitetura */}
                  <div className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2.5 text-xs">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Especificações do Módulo
                    </span>
                    <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                      <div><strong className="text-slate-500">Engine:</strong> {product.engine}</div>
                      <div><strong className="text-slate-500">Portas:</strong> {product.ports}</div>
                      <div><strong className="text-slate-500">Isolamento:</strong> {product.isolationLevel}</div>
                    </div>
                  </div>
                </div>

                {/* Métricas Inferiores */}
                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                  <span>Último Teste:</span>
                  <span className="font-mono text-slate-300">
                    {product.lastTestRun ? new Date(product.lastTestRun).toLocaleTimeString("pt-BR") : "Nunca executado"}
                  </span>
                </div>
              </div>

              {/* LADO DIREITO: TERMINAL DE LOGS EM TEMPO REAL */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#050811] p-4">
                
                {/* Header do Terminal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                    <Terminal size={15} className="text-emerald-400" />
                    <span className="text-slate-200 font-bold">Terminal de Sandbox & Telemetria</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {filteredLogs.length} eventos
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Filtro de Nível */}
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-[#0B1224] border border-slate-800 text-[11px] font-mono text-slate-300 rounded px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos os Níveis</option>
                      <option value="INFO">INFO</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="WARN">WARN</option>
                      <option value="ERROR">ERROR</option>
                    </select>

                    <button
                      onClick={handleCopyLogs}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copiar Logs"
                    >
                      {copiedLogs ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={handleClearLogs}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Limpar Logs"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Console Output */}
                <div className="flex-1 overflow-y-auto font-mono text-xs py-3 space-y-2 text-slate-300 select-text">
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                      <Terminal size={24} />
                      <p className="text-xs">Nenhum log registrado para este sandbox.</p>
                      <p className="text-[11px]">Clique em "Executar Teste de Sandbox" para rodar a bateria.</p>
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => {
                      const levelColor =
                        log.level === "SUCCESS"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                          : log.level === "WARN"
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                          : log.level === "ERROR"
                          ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                          : "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";

                      return (
                        <div key={index} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/40 p-1 rounded">
                          <span className="text-[10px] text-slate-600 select-none shrink-0 pt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${levelColor}`}>
                            {log.level}
                          </span>
                          <span className="text-slate-300 break-all">{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 3: HOMOLOGAÇÃO & INTEGRAÇÃO EM PRODUÇÃO
              ========================================================================= */}
          {activeTab === "integration" && (
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Banner de Estado */}
                <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                  product.isIntegrated 
                    ? "bg-emerald-500/10 border-emerald-500/30" 
                    : "bg-[#0B1224] border-slate-800"
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    product.isIntegrated
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                  }`}>
                    {product.isIntegrated ? <CheckCircle2 size={22} /> : <Rocket size={22} />}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">
                      {product.isIntegrated 
                        ? "Módulo Homologado e Ativo em Produção" 
                        : "Pronto para Integração com o Ecossistema Principal"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {product.isIntegrated
                        ? `Este recurso foi validado no laboratório sandbox e liberado para os clientes da VERSUS em ${new Date(product.integratedAt).toLocaleString("pt-BR")}.`
                        : "Após validação técnica das APIs e testes no laboratório, você pode promover esta tecnologia diretamente para produção."}
                    </p>
                  </div>
                </div>

                {/* Critérios de Aceite e Homologação */}
                <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Checklist de Segurança e Homologação
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#070D1B] border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-slate-200">Ambiente Sandbox Isolado (Zero Mocks)</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        Aprovado
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#070D1B] border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-slate-200">Bateria de Testes de Latência & Protocolo</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {product.stabilityScore}% Estabilidade
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#070D1B] border border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-slate-200">Conformidade com Arquitetura e Contratos</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        Verificado
                      </span>
                    </div>
                  </div>
                </div>

                {/* AÇÃO PRINCIPAL DE INTEGRAÇÃO */}
                <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Ativação do Recurso no Ecossistema
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        A ativação atualiza o status para "EM PRODUÇÃO" e habilita os endpoints para uso direto.
                      </p>
                    </div>

                    <button
                      onClick={handleIntegrateToProduction}
                      disabled={isIntegrating || product.isIntegrated}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                        product.isIntegrated
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                      }`}
                    >
                      <Rocket size={16} className={isIntegrating ? "animate-spin" : ""} />
                      <span>{product.isIntegrated ? "Módulo Já Integrado" : "Integrar no Sistema de Produção"}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
