"use client";

import { useState, useEffect } from "react";
import { Save, Sliders, Bot, AlertCircle, RefreshCw, Send, Loader2, BookOpen } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AgentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    aiName: "Vitor (IA)",
    aiModel: "gpt-4o-mini",
    aiPrompt: "",
    aiKnowledgeBase: "",
    aiTemperature: 0.7
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/agent/config');
      if (res.data) {
        setConfig({
          aiName: res.data.aiName || "Vitor (IA)",
          aiModel: res.data.aiModel || "gpt-4o-mini",
          aiPrompt: res.data.aiPrompt || "",
          aiKnowledgeBase: res.data.aiKnowledgeBase || "",
          aiTemperature: typeof res.data.aiTemperature === 'number' ? res.data.aiTemperature : 0.7
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações da IA.");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="animate-spin text-accent" size={32} />
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
            <button className="text-gray-500 hover:text-accent transition-colors" title="Limpar conversa">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Área de Mensagens (Mock) */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background/0 to-background/0">
            
            <div className="bg-gray-800/80 text-text-primary p-3 rounded-2xl rounded-tr-sm text-sm border border-gray-700/50 max-w-[85%] self-end">
              Olá, tem alguém aí?
            </div>

            <div className="bg-primary/20 text-blue-100 p-3 rounded-2xl rounded-tl-sm text-sm border border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)] max-w-[85%] self-start relative">
               Olá! Aqui é {config.aiName}. Tudo ótimo por aqui! Como posso ajudar sua empresa hoje a vender mais?
            </div>

          </div>

          {/* Input Playground */}
          <div className="p-3 border-t border-gray-800 bg-panel/80 z-10">
            <div className="bg-background border border-gray-700 rounded-xl p-1.5 flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Teste uma mensagem..." 
                className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-gray-600"
              />
              <button className="p-2 bg-accent text-background rounded-lg hover:bg-accent/80 transition-colors">
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