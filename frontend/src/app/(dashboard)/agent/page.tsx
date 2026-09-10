"use client";

import { useState, useEffect } from "react";
import { Save, Sliders, Bot, AlertCircle, RefreshCw, Send, Loader2, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AgentPage() {
  const [saving, setSaving] = useState(false);
  
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [documents, setDocuments] = useState<{id: string, filename: string}[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  const [config, setConfig] = useState({
    aiName: "Vitor (IA)",
    aiModel: "gpt-4o-mini",
    aiPrompt: "",
    aiKnowledgeBase: "",
    aiTemperature: 0.7
  });

  const { data, isLoading } = useQuery({
    queryKey: ['agentConfig'],
    queryFn: async () => {
      const res = await api.get('/agent/config');
      return res.data;
    },
    retry: false
  });

  const { data: docsData, refetch: refetchDocs } = useQuery({
    queryKey: ['agentDocuments'],
    queryFn: async () => {
      const res = await api.get('/agent/documents');
      return res.data;
    },
    retry: false
  });

  useEffect(() => {
    if (data) {
      setConfig({
        aiName: data.aiName || "Vitor (IA)",
        aiModel: data.aiModel || "gpt-4o-mini",
        aiPrompt: data.aiPrompt || "",
        aiKnowledgeBase: data.aiKnowledgeBase || "",
        aiTemperature: typeof data.aiTemperature === 'number' ? data.aiTemperature : 0.7
      });
    }
  }, [data]);

  useEffect(() => {
    if (docsData) {
      setDocuments(docsData);
    }
  }, [docsData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch('/agent/config', config);
      toast.success("Cérebro da IA atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingDoc(true);
      await api.post('/agent/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Documento indexado com sucesso!');
      refetchDocs();
    } catch (error) {
      toast.error('Erro ao fazer upload do documento.');
    } finally {
      setUploadingDoc(false);
      e.target.value = ''; // clear input
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await api.delete(`/agent/documents/${id}`);
      toast.success('Documento removido.');
      refetchDocs();
    } catch (error) {
      toast.error('Erro ao remover documento.');
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return;
    
    const newMessages = [...messages, { role: 'user', content: currentMessage }] as {role: 'user' | 'assistant', content: string}[];
    setMessages(newMessages);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      const res = await api.post('/agent/playground', {
        messages: newMessages,
        config: config
      });
      
      if (res.data && res.data.resposta_cliente) {
        setMessages([...newMessages, { role: 'assistant', content: res.data.resposta_cliente }]);
      } else {
        toast.error("Erro ao processar resposta.");
      }
    } catch (error) {
      toast.error("Erro na comunicação com a IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentMessage("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row h-full w-full gap-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="h-16 w-3/4 bg-[#0B1224] border border-[#162038] rounded-2xl animate-pulse"></div>
          <div className="bg-[#0B1224] border border-[#162038] rounded-2xl p-6 flex flex-col gap-6 h-[600px] animate-pulse"></div>
        </div>
        <div className="w-full lg:w-[400px] bg-[#0B1224] border border-[#162038] rounded-2xl h-[600px] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6">
      
      {/* Esquerda: Engenharia de Prompt & Configurações */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">Agente de Inteligência Artificial</h1>
            <p className="text-sm text-text-secondary mt-1">Configure o cérebro, a persona e a base de conhecimento do seu bot autônomo.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)] flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
            Salvar Configurações
          </button>
        </div>

        {/* Formulário */}
        <div className="bg-panel/40 border border-gray-800/60 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">Nome do Agente</label>
              <input 
                type="text" 
                name="aiName"
                value={config.aiName}
                onChange={handleChange}
                className="w-full bg-background/80 border border-gray-800 text-text-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:shadow-[0_0_15px_rgba(0,210,255,0.15)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">Modelo OpenAI</label>
              <select 
                name="aiModel"
                value={config.aiModel}
                onChange={handleChange}
                className="w-full bg-background/80 border border-gray-800 text-text-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-accent appearance-none"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Rápido e Barato)</option>
                <option value="gpt-4o">GPT-4 Omni (Recomendado)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">Instruções do Sistema (Prompt Principal)</label>
              <span className="text-xs text-gray-500">Define a persona e regras de conduta</span>
            </div>
            <textarea 
              name="aiPrompt"
              rows={8}
              value={config.aiPrompt}
              onChange={handleChange}
              placeholder="Ex: Você é a Carol, recepcionista da Clínica X. Seja super simpática e sempre use emojis..."
              className="w-full bg-background/80 border border-gray-800 text-text-primary rounded-xl p-4 text-sm outline-none transition-all focus:border-accent focus:shadow-[0_0_15px_rgba(0,210,255,0.15)] resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-[0.75rem] font-bold text-purple-400 uppercase tracking-[0.12rem] flex items-center gap-2">
                <BookOpen size={14} /> Base de Conhecimento (Memory Injection)
              </label>
              <span className="text-xs text-gray-500">Cole FAQ, produtos, preços e detalhes do nicho</span>
            </div>
            <textarea 
              name="aiKnowledgeBase"
              rows={8}
              value={config.aiKnowledgeBase}
              onChange={handleChange}
              placeholder="Ex: Nossos preços são: Corte R$ 50, Barba R$ 35. Não aceitamos cheque. Nosso endereço é Rua Y..."
              className="w-full bg-background/80 border border-gray-800 text-purple-100/90 rounded-xl p-4 text-sm outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] resize-none"
            />
          </div>

          {/* Sessão RAG */}
          <div className="flex flex-col gap-4 border-t border-gray-800/60 pt-6">
            <div className="flex justify-between items-center">
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem] flex items-center gap-2">
                <BookOpen size={14} /> Base de Conhecimento Inteligente (PDFs)
              </label>
            </div>
            
            <div className="flex items-center gap-4">
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
                className={`cursor-pointer bg-background/80 border border-gray-800 hover:border-accent text-text-primary px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                Fazer Upload de PDF (RAG)
              </label>
            </div>

            {documents.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-[#0B1224] border border-[#162038] p-3 rounded-lg text-sm">
                    <span className="text-gray-300 truncate max-w-[300px]">{doc.filename}</span>
                    <button 
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                    >
                      REMOVER
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-800/60 pt-6">
            <div className="flex justify-between items-center">
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem] flex items-center gap-2">
                <Sliders size={14} /> Criatividade (Temperature)
              </label>
              <span className="text-sm font-bold text-white bg-gray-800 px-2 py-1 rounded-md">{config.aiTemperature}</span>
            </div>
            <input 
              type="range" 
              name="aiTemperature"
              min="0" max="1" step="0.1" 
              value={config.aiTemperature}
              onChange={handleChange}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mais Conservador (Robótico)</span>
              <span>Mais Criativo (Humano)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Direita: Playground de Teste */}
      <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-4">
        
        <div className="bg-[#0B1224] border border-gray-800/60 rounded-2xl flex flex-col h-[600px] overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Header Playground */}
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent/40">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Playground de Teste</h3>
                <p className="text-[0.65rem] text-gray-400">Fale com {config.aiName}</p>
              </div>
            </div>
            <button 
              onClick={clearChat}
              className="text-gray-500 hover:text-accent transition-colors" 
              title="Limpar conversa"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background/0 to-background/0">
            
            {messages.length === 0 && (
              <div className="bg-primary/20 text-blue-100 p-3 rounded-2xl rounded-tl-sm text-sm border border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)] max-w-[85%] self-start relative">
                 Olá! Aqui é {config.aiName}. Teste as configurações me enviando uma mensagem abaixo!
              </div>
            )}

            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-2xl text-sm border max-w-[85%] ${
                  msg.role === 'user' 
                  ? 'bg-gray-800/80 text-text-primary rounded-tr-sm border-gray-700/50 self-end' 
                  : 'bg-primary/20 text-blue-100 rounded-tl-sm border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)] self-start'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {isGenerating && (
              <div className="bg-primary/20 text-blue-100 p-3 rounded-2xl rounded-tl-sm text-sm border border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)] max-w-[85%] self-start flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Digitando...
              </div>
            )}

          </div>

          {/* Input Playground */}
          <div className="p-3 border-t border-gray-800 bg-panel/80 z-10">
            <div className="bg-background border border-gray-700 rounded-xl p-1.5 flex items-center gap-2">
              <input 
                type="text" 
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Teste uma mensagem..." 
                className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-gray-600"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isGenerating || !currentMessage.trim()}
                className="p-2 bg-accent text-background rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

        </div>

        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-400 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>O playground não consome créditos da sua cota de produção e não salva os leads no CRM.</p>
        </div>

      </div>

    </div>
  );
}