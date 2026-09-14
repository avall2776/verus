"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, MessageSquare, ExternalLink, Calendar, CheckSquare, RefreshCw, 
  Trash2, Tag, User as UserIcon, Paperclip, Upload, FileText, Download, 
  RotateCcw, CheckCircle2, Clock, Phone, Mail, ChevronRight, Plus, Send, 
  AlertCircle, Check, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

const PIPELINE_STAGES = [
  { id: "seed", title: "LEADS SEED", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", dot: "bg-gray-400" },
  { id: "new", title: "Novo Contato", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500" },
  { id: "qualified", title: "Em Qualificação", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-500" },
  { id: "follow-up", title: "Follow-up", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-500" },
  { id: "proposal", title: "Proposta", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  { id: "negotiation", title: "Negociação", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-500" },
  { id: "won", title: "Fechado/Ganho", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", dot: "bg-green-500" },
  { id: "lost", title: "Fechado/Perdido", color: "text-rose-600", bg: "bg-rose-600/10", border: "border-rose-600/30", dot: "bg-rose-600" },
  { id: "disqualified", title: "Duplicados/Desqualificados", color: "text-gray-600", bg: "bg-gray-600/10", border: "border-gray-600/30", dot: "bg-gray-600" }
];

interface DealModalProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (dealId: string, data: any) => Promise<void>;
}

export function DealModal({ deal, isOpen, onClose, onUpdate }: DealModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Chat
  const [chatMode, setChatMode] = useState<'none' | 'send' | 'view'>('none');
  const [chatData, setChatData] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Estados de Edição
  const [users, setUsers] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  // Timeline & Notas
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [newTimelineNote, setNewTimelineNote] = useState("");

  // Anexos
  const [attachments, setAttachments] = useState<any[]>([]);

  // Submodais de Ações Rápidas
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");

  useEffect(() => {
    if (isOpen && deal) {
      setChatMode('none');
      setChatData(null);
      setTempName(deal.contact?.name || deal.title || "");
      setTempValue((deal.value || 0).toFixed(2).replace('.', ','));
      setTempNotes(deal.notes || "");

      // Carregar anexos existentes
      const existingAttachments = deal.metadata?.attachments || [
        { id: "att-1", name: "Proposta_Comercial_Safra2026.pdf", size: "1.8 MB", date: "Ontem às 16:40" },
        { id: "att-2", name: "Comprovante_Residencia_CNH.pdf", size: "840 KB", date: "11/09/2026" }
      ];
      setAttachments(existingAttachments);

      // Carregar Timeline
      const initialTimeline = deal.metadata?.timeline || [
        {
          id: "evt-1",
          type: "created",
          title: "Oportunidade Criada",
          stage: deal.status || "new",
          author: deal.assignedTo?.name || "Sistema (Meta Ads)",
          date: deal.createdAt || new Date().toISOString()
        }
      ];
      setTimelineEvents(initialTimeline);

      // Carregar Colaboradores
      api.get('/deals/users')
        .then(res => setUsers(res.data))
        .catch(() => {
          api.get('/users').then(res => setUsers(res.data)).catch(console.error);
        });
    }
  }, [isOpen, deal?.id]);

  if (!isOpen || !deal) return null;

  const currentStage = PIPELINE_STAGES.find(s => s.id === deal.status) || PIPELINE_STAGES[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleUpdateContact = async () => {
    if (!tempName.trim() || tempName.trim() === deal.contact?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      if (deal.contactId) {
        await api.patch(`/contacts/${deal.contactId}`, { name: tempName });
      }
      deal.contact = { ...deal.contact, name: tempName };
      await onUpdate(deal.id, { title: tempName });
      setIsEditingName(false);
      toast.success("Nome atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar nome");
    }
  };

  const handleUpdateValue = async () => {
    const numericValue = parseFloat(tempValue.replace(/\./g, '').replace(',', '.')) || 0;
    try {
      await onUpdate(deal.id, { value: numericValue });
      deal.value = numericValue;
      setIsEditingValue(false);
      toast.success("Valor atualizado!");
    } catch (err) {
      toast.error("Erro ao atualizar valor");
    }
  };

  const handleUpdateNotes = async () => {
    try {
      await onUpdate(deal.id, { notes: tempNotes });
      deal.notes = tempNotes;
      setIsEditingNotes(false);
      toast.success("Anotações salvas com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar anotações");
    }
  };

  // Reativar Negociação
  const handleReactivateDeal = async () => {
    try {
      const activeStage = "qualified";
      await onUpdate(deal.id, { 
        status: activeStage, 
        lossReason: null, 
        lossComment: null 
      });
      deal.status = activeStage;
      
      const newEvt = {
        id: `evt-${Date.now()}`,
        type: "reactivated",
        title: "Negociação Reativada",
        stage: activeStage,
        author: "Atendente (Manual)",
        date: new Date().toISOString()
      };
      setTimelineEvents(prev => [newEvt, ...prev]);
      toast.success("Negociação reativada na etapa 'Em Qualificação'!");
    } catch (error) {
      toast.error("Erro ao reativar negociação");
    }
  };

  // Alterar Etapa
  const handleStageChange = async (newStatus: string) => {
    try {
      await onUpdate(deal.id, { status: newStatus });
      const stageName = PIPELINE_STAGES.find(s => s.id === newStatus)?.title || newStatus;
      deal.status = newStatus;

      const newEvt = {
        id: `evt-${Date.now()}`,
        type: "stage_change",
        title: `Etapa alterada para ${stageName}`,
        stage: newStatus,
        author: "Atendente",
        date: new Date().toISOString()
      };
      setTimelineEvents(prev => [newEvt, ...prev]);
      toast.success(`Movido para ${stageName}`);
    } catch (error) {
      toast.error("Erro ao alterar etapa");
    }
  };

  // Adicionar Nota à Timeline
  const handleAddTimelineNote = () => {
    if (!newTimelineNote.trim()) return;
    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "note",
      title: newTimelineNote,
      stage: deal.status,
      author: "Você (Atendente)",
      date: new Date().toISOString()
    };
    const updated = [newEvt, ...timelineEvents];
    setTimelineEvents(updated);
    setNewTimelineNote("");
    onUpdate(deal.id, {
      metadata: { ...(deal.metadata || {}), timeline: updated }
    });
    toast.success("Anotação adicionada à timeline!");
  };

  // Upload de Anexo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const newAtt = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: sizeStr,
      date: "Hoje às " + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);
    onUpdate(deal.id, {
      metadata: { ...(deal.metadata || {}), attachments: updated }
    });
    toast.success(`Arquivo "${file.name}" anexado com sucesso!`);
  };

  const handleRemoveAttachment = (attId: string) => {
    const updated = attachments.filter(a => a.id !== attId);
    setAttachments(updated);
    onUpdate(deal.id, {
      metadata: { ...(deal.metadata || {}), attachments: updated }
    });
    toast.success("Anexo removido.");
  };

  // Salvar Tarefa
  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }
    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "task",
      title: `Tarefa Agendada: ${taskTitle} (Prazo: ${taskDueDate || 'Sem data'})`,
      stage: deal.status,
      author: "Atendente",
      date: new Date().toISOString()
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
    setShowTaskModal(false);
    setTaskTitle("");
    setTaskDueDate("");
    toast.success("Tarefa criada com sucesso!");
  };

  // Salvar Evento
  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      toast.error("Informe o título do evento");
      return;
    }
    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "event",
      title: `Evento Marcado: ${eventTitle} (${eventDateTime || 'A definir'})`,
      stage: deal.status,
      author: "Atendente",
      date: new Date().toISOString()
    };
    setTimelineEvents(prev => [newEvt, ...prev]);
    setShowEventModal(false);
    setEventTitle("");
    setEventDateTime("");
    toast.success("Evento agendado com sucesso!");
  };

  // Chat Rápido
  const loadChat = async (mode: 'send' | 'view') => {
    setChatMode(mode);
    setIsLoadingChat(true);
    try {
      const { data } = await api.get(`/conversations/contact/${deal.contactId}`);
      setChatData(data);
    } catch (err) {
      toast.error("Nenhuma conversa ativa encontrada ou sem histórico.");
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMsg = async () => {
    if (!chatInput.trim()) return;
    try {
      if (chatData?.id) {
        const { data } = await api.post(`/conversations/${chatData.id}/messages`, {
          content: chatInput,
          isInternal,
          type: 'text'
        });
        setChatData((prev: any) => ({ ...prev, messages: [...(prev?.messages || []), data] }));
      } else {
        await api.post(`/conversations/contact/${deal.contactId}/messages`, {
          content: chatInput,
          isInternal,
          type: 'text'
        });
        await loadChat('send');
      }
      setChatInput("");
      toast.success("Mensagem enviada!");
    } catch (err) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#161b22] border border-gray-800 w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
        
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO DO DEALMODAL (Padrão Lero)                                    */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1c2128] shrink-0 gap-4">
          {/* Avatar + Lead + Telefone + Badge de Status */}
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-12 h-12 rounded-full border-2 ${currentStage.border} flex items-center justify-center ${currentStage.bg} ${currentStage.color} font-black text-lg shadow-md shrink-0`}>
              {deal.contact?.name ? deal.contact.name.substring(0, 2).toUpperCase() : 'LE'}
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                  #{deal.id.split('-')[0].toUpperCase()}
                </span>
                
                {isEditingName ? (
                  <input 
                    autoFocus
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onBlur={handleUpdateContact}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateContact()}
                    className="text-lg font-bold text-white bg-gray-800 border border-primary px-2 rounded outline-none"
                  />
                ) : (
                  <h2 
                    className="text-lg font-bold text-white hover:text-primary cursor-pointer transition-colors truncate"
                    onClick={() => { setTempName(deal.contact?.name || deal.title || ''); setIsEditingName(true); }}
                    title="Clique para renomear"
                  >
                    {deal.contact?.name || deal.title || 'Lead Sem Nome'}
                  </h2>
                )}

                {/* Badge de Status da Etapa Atual */}
                <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${currentStage.bg} ${currentStage.color} border ${currentStage.border}`}>
                  <span className={`w-2 h-2 rounded-full ${currentStage.dot}`}></span>
                  {currentStage.title}
                </span>
              </div>

              {/* Telefone Clicável com WhatsApp */}
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                {deal.contact?.phone ? (
                  <a 
                    href={`https://wa.me/${deal.contact.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    <span className="text-[#25D366]">🟢</span>
                    <span>{deal.contact.phone}</span>
                  </a>
                ) : (
                  <span className="text-gray-500 italic">Sem telefone</span>
                )}
                {deal.contact?.email && (
                  <span className="text-gray-400 flex items-center gap-1">
                    <Mail size={12} className="text-gray-500" /> {deal.contact.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Valor do Negócio + Botão Fechar */}
          <div className="flex items-center gap-5 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valor do Negócio</span>
              <div className="flex items-center gap-1 bg-[#0B1224] px-3 py-1.5 rounded-lg border border-emerald-900/50 shadow-inner">
                {isEditingValue ? (
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">R$</span>
                    <input 
                      autoFocus
                      value={tempValue}
                      onChange={e => setTempValue(e.target.value)}
                      onBlur={handleUpdateValue}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateValue()}
                      className="w-28 bg-transparent text-emerald-400 font-black font-mono text-lg text-right outline-none"
                    />
                  </div>
                ) : (
                  <span 
                    className="text-emerald-400 font-black font-mono text-xl cursor-pointer hover:text-emerald-300 transition-colors"
                    onClick={() => { setTempValue((deal.value || 0).toFixed(2).replace('.', ',')); setIsEditingValue(true); }}
                    title="Clique para editar o valor"
                  >
                    {formatCurrency(Number(deal.value || 0))}
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CORPO DO MODAL (Duas Colunas: Conteúdo Principal e Lateral de Ações)      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* COLUNA ESQUERDA: Detalhes, Formulário Meta Ads, Anexos e Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar border-r border-gray-800/60">
            
            {/* SEÇÃO 1: DESCRIÇÃO & RESPOSTAS DE FORMULÁRIO (META ADS / CRM) */}
            <div className="bg-[#1c2128] border border-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <ExternalLink size={14} /> Respostas de Formulário & Metadados
                </h3>
                <span className="text-[10px] font-bold text-gray-400 bg-[#0B1224] border border-gray-800 px-2 py-0.5 rounded uppercase">
                  Origem: {deal.contact?.source || 'Meta Ads (Facebook/Instagram)'}
                </span>
              </div>

              {/* Grid Formatado de Respostas Meta Ads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0f141c] border border-gray-800/80 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Formulário de Captação</span>
                  <span className="text-xs font-semibold text-white">Versátil Tractor - Campanha Safra 2026</span>
                </div>
                <div className="bg-[#0f141c] border border-gray-800/80 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Modelo de Interesse</span>
                  <span className="text-xs font-semibold text-emerald-400">Versátil Tractor 80cv Cabinada</span>
                </div>
                <div className="bg-[#0f141c] border border-gray-800/80 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Cidade / UF</span>
                  <span className="text-xs font-semibold text-slate-200">São Paulo - SP</span>
                </div>
                <div className="bg-[#0f141c] border border-gray-800/80 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">E-mail Cadastrado</span>
                  <span className="text-xs font-semibold text-slate-200">{deal.contact?.email || 'contato@cliente.com.br'}</span>
                </div>
              </div>

              {/* Anotações do Atendente / Histórico */}
              <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-xs font-bold text-gray-300">Anotações do Negócio</span>
                {!isEditingNotes && (
                  <button 
                    onClick={() => { setTempNotes(deal.notes || ''); setIsEditingNotes(true); }}
                    className="text-xs text-primary hover:text-primary/80 font-semibold"
                  >
                    ✏️ Editar Anotações
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="flex flex-col gap-2">
                  <textarea 
                    value={tempNotes}
                    onChange={e => setTempNotes(e.target.value)}
                    className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-3 text-xs text-white resize-y min-h-[100px] outline-none focus:border-primary"
                    placeholder="Digite anotações ou observações comerciais..."
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 text-xs text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={handleUpdateNotes} className="px-3 py-1 text-xs bg-primary text-white font-bold rounded hover:bg-primary/90">Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0f141c] border border-gray-800/80 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap">
                  {deal.notes || "Lead recebido pelo formulário nativo da Meta Ads solicitando contato comercial urgente com equipe de vendas."}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: ANEXOS (ÁREA DE UPLOAD E LISTAGEM DE ARQUIVOS) */}
            <div className="bg-[#1c2128] border border-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Paperclip size={14} /> Anexos da Oportunidade ({attachments.length})
                </h3>
                
                {/* Botão de Upload com Input File Oculto */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 px-3 py-1 rounded-lg transition-colors"
                >
                  <Upload size={13} /> Anexar Arquivo
                </button>
              </div>

              {/* Lista de Arquivos Anexados */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs italic border border-dashed border-gray-800 rounded-lg">
                    Nenhum arquivo anexado a esta oportunidade. Clique em "Anexar Arquivo" acima.
                  </div>
                ) : (
                  attachments.map(att => (
                    <div 
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-[#0f141c] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-primary shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white truncate max-w-[320px]">{att.name}</span>
                          <span className="text-[10px] text-gray-400">{att.size} • Anexado em {att.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toast.success(`Baixando ${att.name}...`)}
                          className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                          title="Baixar arquivo"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 hover:bg-rose-950/40 rounded text-gray-400 hover:text-rose-400 transition-colors"
                          title="Remover anexo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEÇÃO 3: TIMELINE DO CARD (HISTÓRICO CRONOLÓGICO) */}
            <div className="bg-[#1c2128] border border-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#f37021] flex items-center gap-2">
                  <Clock size={14} /> Timeline do Card & Histórico
                </h3>
              </div>

              {/* Caixa para Adicionar Nota Rápida na Timeline */}
              <div className="flex items-center gap-2 mb-5">
                <input 
                  type="text" 
                  value={newTimelineNote}
                  onChange={e => setNewTimelineNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTimelineNote()}
                  placeholder="Adicionar nota rápida à timeline do negócio..."
                  className="flex-1 bg-[#0B1224] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTimelineNote}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0"
                >
                  <Send size={13} /> Registrar
                </button>
              </div>

              {/* Linha Cronológica */}
              <div className="relative pl-6 border-l-2 border-gray-800 space-y-4">
                {timelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#161b22] ${
                      evt.type === 'created' ? 'bg-blue-500' :
                      evt.type === 'reactivated' ? 'bg-orange-500' :
                      evt.type === 'task' ? 'bg-yellow-500' :
                      evt.type === 'event' ? 'bg-purple-500' :
                      evt.type === 'stage_change' ? 'bg-emerald-500' : 'bg-primary'
                    }`}></div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-200">{evt.title}</span>
                      <span className="text-[10px] text-gray-500">
                        {evt.date ? format(new Date(evt.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Recente"}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-gray-800 text-[8px] flex items-center justify-center font-bold text-white">
                        {evt.author?.[0] || "S"}
                      </div>
                      <span>{evt.author || "Sistema"}</span>
                      {evt.stage && (
                        <span className="text-[10px] font-mono bg-gray-900 border border-gray-800 px-1.5 py-0.2 rounded text-gray-400">
                          {evt.stage.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: PAINEL DE AÇÕES RÁPIDAS (PADRÃO LERO)                     */}
          {/* ========================================================================= */}
          <div className="w-full lg:w-[340px] bg-[#1c2128]/70 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar shrink-0 border-t lg:border-t-0 border-gray-800">
            
            {/* ETAPA ATUAL & RESPONSÁVEL */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Etapa do Funil
                </label>
                <select 
                  className="w-full bg-[#0B1224] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-colors cursor-pointer"
                  value={deal.status}
                  onChange={(e) => handleStageChange(e.target.value)}
                >
                  {PIPELINE_STAGES.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#161b22] text-white">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Responsável pelo Negócio
                </label>
                <select 
                  className="w-full bg-[#0B1224] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-colors cursor-pointer"
                  value={deal.assignedTo?.id || (typeof deal.assignedTo === 'string' ? deal.assignedTo : "")}
                  onChange={(e) => onUpdate(deal.id, { assignedTo: e.target.value || null })}
                >
                  <option value="" className="bg-[#161b22]">Nenhum (Fila Geral)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-[#161b22]">
                      {u.name} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-px bg-gray-800 w-full"></div>

            {/* BOTÕES DE AÇÃO RÁPIDA */}
            <div className="flex flex-col gap-2.5">
              
              {/* 1. Reativar Negociação */}
              <button 
                type="button"
                onClick={handleReactivateDeal} 
                className="flex items-center gap-2.5 w-full p-3 rounded-xl text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all shadow-sm"
              >
                <RotateCcw size={15} /> Reativar Negociação
              </button>
              
              {/* 2. Ver Conversa no WhatsApp (Redirecionando para /inbox) */}
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/inbox?contactId=${deal.contactId}`);
                }} 
                className="flex items-center gap-2.5 w-full p-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-sm"
              >
                <MessageSquare size={15} /> Ver Conversa no WhatsApp
              </button>

              {/* 3. Enviar Mensagem Rápida (Modal Interno) */}
              <button 
                type="button"
                onClick={() => loadChat('send')} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-bold text-gray-300 bg-[#0B1224] border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                <Send size={14} className="text-primary" /> Enviar Mensagem Rápida
              </button>

              {/* 4. Criar Tarefa */}
              <button 
                type="button"
                onClick={() => setShowTaskModal(true)} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-bold text-gray-300 bg-[#0B1224] border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                <CheckSquare size={14} className="text-yellow-500" /> Criar Tarefa
              </button>

              {/* 5. Criar Evento */}
              <button 
                type="button"
                onClick={() => setShowEventModal(true)} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-bold text-gray-300 bg-[#0B1224] border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                <Calendar size={14} className="text-purple-500" /> Criar Evento
              </button>
            </div>

            {/* Rodapé da Coluna Direita */}
            <div className="mt-auto pt-6 border-t border-gray-800 flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 text-center">
                Criado em: {deal.createdAt ? format(new Date(deal.createdAt), "dd/MM/yyyy HH:mm") : "-"}
              </span>

              <button 
                type="button"
                onClick={() => {
                  if (confirm("Deseja mover esta oportunidade para Desqualificados?")) {
                    handleStageChange('disqualified');
                  }
                }}
                className="flex items-center justify-center gap-1.5 w-full p-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
              >
                <Trash2 size={13} /> Desqualificar / Excluir
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* SUBMODAIS DE AÇÕES RÁPIDAS: CRIAR TAREFA & CRIAR EVENTO                    */}
        {/* ========================================================================= */}
        {showTaskModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#1c2128] border border-gray-800 w-full max-w-sm rounded-xl p-5 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckSquare size={16} className="text-yellow-500" /> Criar Nova Tarefa
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Título da Tarefa</label>
                  <input 
                    type="text" 
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Ex: Ligar para confirmar proposta"
                    className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Prazo / Vencimento</label>
                  <input 
                    type="date" 
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowTaskModal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={handleSaveTask} className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs rounded-lg">Salvar Tarefa</button>
              </div>
            </div>
          </div>
        )}

        {showEventModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#1c2128] border border-gray-800 w-full max-w-sm rounded-xl p-5 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-purple-500" /> Agendar Evento / Reunião
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Título do Evento</label>
                  <input 
                    type="text" 
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="Ex: Demonstração Técnica Online"
                    className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Data e Hora</label>
                  <input 
                    type="datetime-local" 
                    value={eventDateTime}
                    onChange={e => setEventDateTime(e.target.value)}
                    className="w-full bg-[#0B1224] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEventModal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={handleSaveEvent} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg">Agendar Evento</button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INNER CHAT DRAWER (Mensagem Rápida)                                       */}
        {/* ========================================================================= */}
        {chatMode !== 'none' && (
          <div className="absolute inset-0 z-50 bg-[#161b22] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1c2128] shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  Mensagem Rápida | {deal.contact?.name || deal.title}
                </h2>
              </div>
              <button onClick={() => setChatMode('none')} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {isLoadingChat ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Carregando histórico...</div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 flex flex-col bg-[#0B1224] p-4 overflow-y-auto custom-scrollbar gap-3">
                  {(!chatData?.messages || chatData.messages.length === 0) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs italic">
                      Nenhuma mensagem prévia registrada para este contato.
                    </div>
                  ) : (
                    chatData.messages.map((msg: any, i: number) => {
                      const isMe = msg.direction === 'OUTBOUND';
                      return (
                        <div key={i} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`p-3 text-xs rounded-xl ${
                            msg.isInternal 
                              ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30' 
                              : isMe 
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-gray-800 text-slate-200 rounded-bl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="w-full md:w-[360px] bg-[#1c2128] border-t md:border-t-0 md:border-l border-gray-800 p-4 flex flex-col gap-3">
                  <div className="flex gap-4 border-b border-gray-800 pb-2">
                    <button 
                      onClick={() => setIsInternal(false)}
                      className={`text-xs font-bold transition-colors ${!isInternal ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400'}`}
                    >
                      WhatsApp Externo
                    </button>
                    <button 
                      onClick={() => setIsInternal(true)}
                      className={`text-xs font-bold transition-colors ${isInternal ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : 'text-gray-400'}`}
                    >
                      Nota Interna
                    </button>
                  </div>

                  <textarea 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={isInternal ? "Escreva uma anotação privada..." : "Digite sua mensagem via WhatsApp..."}
                    className="flex-1 bg-[#0B1224] border border-gray-700 rounded-lg p-3 text-xs text-white outline-none focus:border-primary resize-none min-h-[140px]"
                  />

                  <button 
                    onClick={handleSendMsg}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Send size={14} /> Enviar Mensagem
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
