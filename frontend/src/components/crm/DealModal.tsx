"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, MessageSquare, ExternalLink, Calendar, CheckSquare, RefreshCw, 
  Trash2, Tag, User as UserIcon, Paperclip, Upload, FileText, Download, 
  RotateCcw, CheckCircle2, XCircle, Clock, Phone, Mail, ChevronRight, Plus, Send, 
  AlertCircle, Check, DollarSign, ArrowUpRight, PencilLine, Edit3,
  Building2, MapPin, Briefcase, UserCog, Video, Users, Bell, Globe, Link2, ChevronDown
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

// Formatador de datas seguro contra exceções de 'Invalid time value'
function safeFormatDate(dateVal?: any, formatStr = "dd/MM/yyyy HH:mm"): string {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    return format(d, formatStr, { locale: ptBR });
  } catch {
    return "-";
  }
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

  // Submodal de Atividades (Tarefa / Evento) - Padrão Lero
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityTab, setActivityTab] = useState<'task' | 'event'>('task');
  const taskAttachmentInputRef = useRef<HTMLInputElement>(null);

  // Estados de Nova Tarefa
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    allDay: false,
    category: "Ligação",
    priority: "Média",
    assignedTo: "",
    attachments: [] as { id: string; name: string; size: string }[]
  });

  // Estados de Novo Evento
  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    startTime: "10:00",
    endDate: new Date().toISOString().split('T')[0],
    endTime: "11:00",
    allDay: false,
    differentEndDay: false,
    calendarType: "company", // 'company' | 'private'
    locationType: "Google Meet", // 'presential' | 'Google Meet' | 'Microsoft Teams' | 'Jitsi' | 'none'
    locationDetails: "",
    internalParticipants: [] as string[],
    notifyReminder: true,
    sendEmailInvite: true
  });

  // Submodal de Perda
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [lossComment, setLossComment] = useState("");

  // Submodal Editar Contato
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editContactData, setEditContactData] = useState({
    name: "",
    phone: "",
    birthDate: "",
    email: "",
    role: "",
    document: "",
    type: "Lead",
    address: "",
    company: "",
    notes: "",
    campaign: "",
    source: ""
  });

  useEffect(() => {
    if (isOpen && deal) {
      setChatMode('none');
      setChatData(null);
      setTempName(deal.contact?.name || deal.title || "");
      setTempValue((deal.value ? Number(deal.value) : 0).toFixed(2).replace('.', ','));
      setTempNotes(deal.notes || "");

      // Carregar dados de edição do contato
      const c = deal.contact || deal.metadata?.contact || {};
      setEditContactData({
        name: c.name || deal.title || "",
        phone: c.phone || "",
        birthDate: c.birthDate || "",
        email: c.email || deal.metadata?.email || "",
        role: c.role || c.jobTitle || deal.metadata?.role || "Produtor Rural / Decisor",
        document: c.document || c.cpfCnpj || deal.metadata?.document || "",
        type: c.type || "Lead",
        address: c.address || deal.metadata?.city || "São Paulo - SP",
        company: c.company || deal.metadata?.company || "Versátil Agro & Grãos Ltda",
        notes: c.notes || deal.notes || "",
        campaign: c.campaign || deal.metadata?.formName || "Campanha Safra 2026",
        source: c.source || deal.contact?.source || deal.metadata?.source || "Meta Ads (Facebook/Instagram)"
      });

      // Carregar anexos existentes com proteção
      const existingAttachments = Array.isArray(deal.metadata?.attachments) 
        ? deal.metadata.attachments 
        : [
            { id: "att-1", name: "Proposta_Comercial_Safra2026.pdf", size: "1.8 MB", date: "Ontem às 16:40" },
            { id: "att-2", name: "Comprovante_Residencia_CNH.pdf", size: "840 KB", date: "11/09/2026" }
          ];
      setAttachments(existingAttachments);

      // Carregar Timeline (suporta deal.timeline ou deal.metadata.timeline) com proteção
      const existingTimeline = Array.isArray(deal.timeline) 
        ? deal.timeline 
        : (Array.isArray(deal.metadata?.timeline) ? deal.metadata.timeline : null);

      const initialTimeline = existingTimeline || [
        {
          id: "evt-1",
          type: "created",
          title: "Oportunidade Criada",
          stage: deal.status || "new",
          author: deal.assignedTo?.name || deal.assignee?.name || "Sistema (Meta Ads)",
          date: deal.createdAt || new Date().toISOString()
        }
      ];
      setTimelineEvents(initialTimeline);

      // Carregar Colaboradores
      api.get('/deals/users')
        .then(res => setUsers(res.data || []))
        .catch(() => {
          api.get('/users').then(res => setUsers(res.data || [])).catch(console.error);
        });
    }
  }, [isOpen, deal?.id]);

  if (!isOpen) return null;

  // Se o modal estiver aberto mas nenhum deal for fornecido ou estiver carregando, renderiza o Skeleton de segurança
  if (!deal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div className="bg-[#161b22] border border-gray-800 w-full max-w-5xl h-[650px] rounded-2xl flex flex-col shadow-2xl p-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-800"></div>
              <div className="space-y-2">
                <div className="w-48 h-5 bg-gray-800 rounded"></div>
                <div className="w-32 h-3 bg-gray-800 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-10 bg-gray-800 rounded-lg"></div>
              <div className="w-8 h-8 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
          {/* Body Skeleton */}
          <div className="flex-1 flex gap-6">
            <div className="flex-1 space-y-4">
              <div className="w-full h-36 bg-gray-800/60 rounded-xl"></div>
              <div className="w-full h-28 bg-gray-800/60 rounded-xl"></div>
              <div className="w-full h-36 bg-gray-800/60 rounded-xl"></div>
            </div>
            <div className="w-72 space-y-4">
              <div className="w-full h-12 bg-gray-800/60 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-800/60 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-800/60 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-800/60 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Obter estágio atual de forma segura
  const currentStage = PIPELINE_STAGES.find(s => s.id === (deal.status || "new")) || PIPELINE_STAGES[0];

  // Helper para moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // Atualizar Contato Rápido (Inline)
  const handleUpdateContact = async () => {
    if (!tempName.trim() || tempName.trim() === (deal.contact?.name || deal.title)) {
      setIsEditingName(false);
      return;
    }
    try {
      if (deal.contactId) {
        await api.patch(`/contacts/${deal.contactId}`, { name: tempName });
      }
      if (deal.contact) {
        deal.contact.name = tempName;
      }
      deal.title = tempName;
      await onUpdate(deal.id, { title: tempName });
      setIsEditingName(false);
      toast.success("Nome atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar nome");
    }
  };

  // Salvar Modal Completo de Editar Contato
  const handleSaveEditContact = async () => {
    if (!editContactData.name.trim()) {
      toast.error("O nome do contato é obrigatório.");
      return;
    }
    try {
      const updatedContact = {
        ...(deal.contact || {}),
        name: editContactData.name.trim(),
        phone: editContactData.phone.trim(),
        email: editContactData.email.trim(),
        birthDate: editContactData.birthDate,
        role: editContactData.role,
        document: editContactData.document,
        type: editContactData.type,
        address: editContactData.address,
        company: editContactData.company,
        notes: editContactData.notes,
        campaign: editContactData.campaign,
        source: editContactData.source
      };

      if (deal.contactId) {
        try {
          await api.patch(`/contacts/${deal.contactId}`, { 
            name: updatedContact.name,
            phone: updatedContact.phone,
            email: updatedContact.email,
            metadata: updatedContact
          });
        } catch (err) {
          // Fallback silencioso se o endpoint for restrito a determinados campos
        }
      }

      deal.contact = updatedContact;
      deal.title = updatedContact.name;
      if (updatedContact.notes) {
        deal.notes = updatedContact.notes;
        setTempNotes(updatedContact.notes);
      }
      setTempName(updatedContact.name);

      await onUpdate(deal.id, {
        title: updatedContact.name,
        notes: updatedContact.notes || deal.notes,
        contact: updatedContact,
        metadata: {
          ...(deal.metadata || {}),
          contact: updatedContact,
          city: updatedContact.address || deal.metadata?.city,
          formName: updatedContact.campaign || deal.metadata?.formName,
          company: updatedContact.company || deal.metadata?.company,
        }
      });

      const newEvt = {
        id: `evt-${Date.now()}`,
        type: "contact_updated",
        title: `Contato Atualizado: ${updatedContact.name}`,
        stage: deal.status || "new",
        author: "Atendente (Edição de Contato)",
        date: new Date().toISOString()
      };
      setTimelineEvents(prev => [newEvt, ...prev]);

      setShowEditContactModal(false);
      toast.success("Contato atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar alterações do contato");
    }
  };

  // Excluir ou Desvincular Contato
  const handleDeleteContact = async () => {
    if (confirm("Deseja realmente desvincular este contato desta oportunidade?")) {
      try {
        deal.contact = null;
        await onUpdate(deal.id, {
          contactId: null,
          metadata: {
            ...(deal.metadata || {}),
            contact: null
          }
        });
        setShowEditContactModal(false);
        toast.success("Contato desvinculado com sucesso.");
      } catch (error) {
        toast.error("Erro ao desvincular contato.");
      }
    }
  };

  // Atualizar Valor
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

  // Atualizar Anotações
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

  const handleMarkWon = async () => {
    await handleStageChange('won');
  };

  const handleConfirmLoss = async () => {
    try {
      const reasonText = lossReason === 'outro' ? (lossComment || 'Outro') : (lossReason || 'Perda confirmada');
      await onUpdate(deal.id, {
        status: 'lost',
        lossReason: reasonText,
        lossComment
      });
      deal.status = 'lost';
      const newEvt = {
        id: `evt-${Date.now()}`,
        type: "stage_change",
        title: `Marcado como Perdido (${reasonText})`,
        stage: 'lost',
        author: "Atendente",
        date: new Date().toISOString()
      };
      setTimelineEvents(prev => [newEvt, ...prev]);
      setShowLossModal(false);
      setLossReason("");
      setLossComment("");
      toast.success("Negociação marcada como perdida");
    } catch (err) {
      toast.error("Erro ao marcar como perdida");
    }
  };

  // Adicionar Nota à Timeline
  const handleAddTimelineNote = () => {
    if (!newTimelineNote.trim()) return;
    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "note",
      title: newTimelineNote,
      stage: deal.status || "new",
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

  // Upload de Anexo da Tarefa
  const handleTaskFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const newAtt = {
      id: `task-att-${Date.now()}`,
      name: file.name,
      size: sizeStr
    };

    setTaskFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAtt]
    }));
    toast.success(`Arquivo "${file.name}" adicionado à tarefa.`);
  };

  const handleRemoveTaskAttachment = (attId: string) => {
    setTaskFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== attId)
    }));
  };

  // Salvar Tarefa (com suporte a "Criar e adicionar outra")
  const handleSaveTask = (andAddAnother = false) => {
    if (!taskFormData.title.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }

    const assignedUserName = taskFormData.assignedTo 
      ? users.find(u => u.id === taskFormData.assignedTo)?.name || "Atendente" 
      : "Atendente";

    const whenStr = taskFormData.allDay
      ? `${taskFormData.date} (Dia inteiro)`
      : `${taskFormData.date} às ${taskFormData.time}`;

    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "task",
      title: `Tarefa: ${taskFormData.title}`,
      description: taskFormData.description || "",
      category: taskFormData.category,
      priority: taskFormData.priority,
      when: whenStr,
      stage: deal.status || "new",
      author: assignedUserName,
      attachmentsCount: taskFormData.attachments.length,
      date: new Date().toISOString()
    };

    const updatedTimeline = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedTimeline);
    onUpdate(deal.id, {
      metadata: {
        ...(deal.metadata || {}),
        timeline: updatedTimeline
      }
    });

    toast.success("Tarefa criada com sucesso!");

    if (andAddAnother) {
      setTaskFormData({
        title: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        allDay: false,
        category: "Ligação",
        priority: "Média",
        assignedTo: "",
        attachments: []
      });
    } else {
      setShowActivityModal(false);
    }
  };

  // Salvar Evento
  const handleSaveEvent = () => {
    if (!eventFormData.title.trim()) {
      toast.error("Informe o título do evento");
      return;
    }

    const whenStr = eventFormData.allDay 
      ? `${eventFormData.startDate} (Dia inteiro)`
      : `${eventFormData.startDate} às ${eventFormData.startTime}${eventFormData.differentEndDay ? ` até ${eventFormData.endDate} às ${eventFormData.endTime}` : ` até ${eventFormData.endTime}`}`;

    const locationLabel = eventFormData.locationType === 'presential'
      ? `Presencial: ${eventFormData.locationDetails || 'A definir'}`
      : eventFormData.locationType;

    const newEvt = {
      id: `evt-${Date.now()}`,
      type: "event",
      title: `Evento: ${eventFormData.title}`,
      description: eventFormData.description || "",
      location: locationLabel,
      calendar: eventFormData.calendarType === 'company' ? 'Agenda da Empresa' : 'Agenda Privada',
      when: whenStr,
      stage: deal.status || "new",
      author: "Atendente",
      date: new Date().toISOString()
    };

    const updatedTimeline = [newEvt, ...timelineEvents];
    setTimelineEvents(updatedTimeline);
    onUpdate(deal.id, {
      metadata: {
        ...(deal.metadata || {}),
        timeline: updatedTimeline
      }
    });

    toast.success("Evento agendado com sucesso!");
    setShowActivityModal(false);
  };

  // Chat Rápido
  const loadChat = async (mode: 'send' | 'view') => {
    setChatMode(mode);
    setIsLoadingChat(true);
    try {
      if (deal.contactId) {
        const { data } = await api.get(`/conversations/contact/${deal.contactId}`);
        setChatData(data);
      } else {
        toast.error("Contato não associado.");
      }
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
      } else if (deal.contactId) {
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

  // ID abreviado seguro
  const safeId = typeof deal.id === 'string' && deal.id.includes('-') 
    ? deal.id.split('-')[0].toUpperCase() 
    : (deal.id || "DEAL");

  // Iniciais seguras
  const contactName = deal.contact?.name || deal.title || "Lead";
  const contactInitials = contactName.length >= 2 
    ? contactName.substring(0, 2).toUpperCase() 
    : (contactName[0] || "L").toUpperCase();

  // Custom Fields (se existirem)
  const customFieldsEntries = deal.customFields && typeof deal.customFields === 'object' 
    ? Object.entries(deal.customFields) 
    : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#161b22] border border-gray-800 w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
        
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO DO DEALMODAL (Padrão Clean Executivo Lero)                    */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between px-6 lg:px-8 py-4.5 border-b border-gray-800/80 bg-[#161b22] shrink-0 gap-4">
          {/* Avatar + Lead + Telefone + Badge de Status */}
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-12 h-12 rounded-full border-2 ${currentStage.border} flex items-center justify-center ${currentStage.bg} ${currentStage.color} font-black text-lg shadow-md shrink-0`}>
              {contactInitials}
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                  #{safeId}
                </span>
                
                {isEditingName ? (
                  <input 
                    autoFocus
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onBlur={handleUpdateContact}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateContact()}
                    className="text-lg font-bold text-white bg-gray-800 border border-primary px-2 py-0.5 rounded-lg outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h2 
                      className="text-lg font-bold text-white hover:text-primary cursor-pointer transition-colors truncate"
                      onClick={() => setShowEditContactModal(true)}
                      title="Clique para editar contato"
                    >
                      {deal.contact?.name || deal.title || 'Lead Sem Nome'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowEditContactModal(true)}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800/60 opacity-60 group-hover:opacity-100 flex items-center gap-1"
                      title="Editar todas as informações do contato"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Valor do Negócio</span>
              <div className="flex items-center gap-1.5 bg-[#0d1117] px-3.5 py-1.5 rounded-xl border border-gray-800 shadow-inner group">
                {isEditingValue ? (
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold text-sm">R$</span>
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
                  <>
                    <span 
                      className="text-emerald-400 font-black font-mono text-xl cursor-pointer hover:text-emerald-300 transition-colors"
                      onClick={() => { setTempValue((deal.value ? Number(deal.value) : 0).toFixed(2).replace('.', ',')); setIsEditingValue(true); }}
                      title="Clique para editar o valor"
                    >
                      {formatCurrency(Number(deal.value || 0))}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setTempValue((deal.value ? Number(deal.value) : 0).toFixed(2).replace('.', ',')); setIsEditingValue(true); }}
                      className="text-gray-400 hover:text-emerald-400 transition-colors p-0.5 rounded opacity-60 group-hover:opacity-100"
                      title="Editar valor"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-800/80 rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-gray-700"
              title="Fechar (Esc)"
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
          <div className="flex-1 overflow-y-auto p-6 lg:p-7 space-y-5 custom-scrollbar border-r border-gray-800/60">
            
            {/* SEÇÃO 0: INFORMAÇÕES DO CONTATO (PADRÃO LERO) */}
            <div className="bg-[#161b22] border border-gray-800/60 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <UserIcon size={14} className="text-gray-400" /> Informações do Contato
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white bg-[#0d1117] hover:bg-[#21262d] border border-gray-800/80 px-2.5 py-1 rounded-lg transition-colors"
                  title="Editar informações completas do contato"
                >
                  <PencilLine size={13} className="text-gray-400" />
                  <span>Editar Contato</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">Nome Completo</span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {deal.contact?.name || deal.title || "Não informado"}
                  </span>
                </div>

                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">WhatsApp / Telefone</span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <span>🟢</span> {deal.contact?.phone || "Não informado"}
                  </span>
                </div>

                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">E-mail</span>
                  <span className="text-xs font-semibold text-gray-300 truncate block">
                    {deal.contact?.email || deal.metadata?.contact?.email || "contato@cliente.com.br"}
                  </span>
                </div>

                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">Cargo & Empresa</span>
                  <span className="text-xs font-semibold text-gray-300 truncate block">
                    {deal.contact?.role || deal.metadata?.contact?.role || "Decisor Comercial"} • {deal.contact?.company || deal.metadata?.contact?.company || "Empresa Agro"}
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: DESCRIÇÃO & RESPOSTAS DE FORMULÁRIO (META ADS / CRM) */}
            <div className="bg-[#161b22] border border-gray-800/60 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <ExternalLink size={14} className="text-gray-400" /> Respostas de Formulário & Metadados
                </h3>
                <span className="text-[10px] font-medium text-gray-400 bg-[#0d1117] border border-gray-800/80 px-2.5 py-0.5 rounded-md uppercase">
                  Origem: {deal.contact?.source || 'Meta Ads (Facebook/Instagram)'}
                </span>
              </div>

              {/* Grid Formatado de Respostas Meta Ads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">Formulário de Captação</span>
                  <span className="text-xs font-semibold text-white">
                    {deal.metadata?.formName || "Versátil Tractor - Campanha Safra 2026"}
                  </span>
                </div>
                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">Modelo de Interesse</span>
                  <span className="text-xs font-semibold text-gray-200">
                    {deal.metadata?.model || "Versátil Tractor 80cv Cabinada"}
                  </span>
                </div>
                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">Cidade / UF</span>
                  <span className="text-xs font-semibold text-gray-300">
                    {deal.metadata?.city || "São Paulo - SP"}
                  </span>
                </div>
                <div className="bg-[#0d1117] border border-gray-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-medium text-gray-400 uppercase block mb-0.5">E-mail Cadastrado</span>
                  <span className="text-xs font-semibold text-gray-300 truncate block">
                    {deal.contact?.email || 'contato@cliente.com.br'}
                  </span>
                </div>
              </div>

              {/* Campos Customizados (deal.customFields) */}
              {customFieldsEntries.length > 0 && (
                <div className="mb-4 pt-3 border-t border-gray-800/60">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Campos Personalizados
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {customFieldsEntries.map(([key, value]) => (
                      <div key={key} className="bg-[#0d1117] border border-gray-800/60 p-2.5 rounded-xl text-xs flex justify-between items-center">
                        <span className="text-gray-400 font-medium">{key}:</span>
                        <span className="text-white font-bold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anotações do Atendente / Histórico */}
              <div className="flex items-center justify-between mt-5 mb-2.5">
                <span className="text-xs font-bold text-gray-300">Anotações do Negócio</span>
                {!isEditingNotes && (
                  <button 
                    type="button"
                    onClick={() => { setTempNotes(deal.notes || ''); setIsEditingNotes(true); }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-medium transition-colors group"
                    title="Editar anotações"
                  >
                    <PencilLine className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                    <span>Editar Anotações</span>
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="flex flex-col gap-2.5">
                  <textarea 
                    value={tempNotes}
                    onChange={e => setTempNotes(e.target.value)}
                    className="w-full bg-[#0d1117] border border-gray-700/80 rounded-xl p-3.5 text-xs text-white resize-y min-h-[100px] outline-none focus:border-blue-700/60"
                    placeholder="Digite anotações ou observações comerciais..."
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleUpdateNotes} className="px-3.5 py-1.5 text-xs bg-[#161b22] hover:bg-[#21262d] text-white border border-gray-700 font-semibold rounded-lg transition-colors">Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0d1117] border border-gray-800/60 rounded-xl p-3.5 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {deal.notes || "Lead recebido pelo formulário nativo da Meta Ads solicitando contato comercial urgente com equipe de vendas."}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: ANEXOS (ÁREA DE UPLOAD E LISTAGEM DE ARQUIVOS) */}
            <div className="bg-[#161b22] border border-gray-800/60 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <Paperclip size={14} className="text-gray-400" /> Anexos da Oportunidade ({attachments.length})
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
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-200 bg-[#161b22] hover:bg-[#21262d] border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Upload size={13} className="text-gray-400" /> Anexar Arquivo
                </button>
              </div>

              {/* Lista de Arquivos Anexados */}
              <div className="space-y-2.5">
                {attachments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs italic border border-dashed border-gray-800/80 rounded-xl">
                    Nenhum arquivo anexado a esta oportunidade. Clique em "Anexar Arquivo" acima.
                  </div>
                ) : (
                  attachments.map(att => (
                    <div 
                      key={att.id}
                      className="flex items-center justify-between p-3 bg-[#0d1117] border border-gray-800/60 hover:border-gray-700/80 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 shrink-0">
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
                          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="Baixar arquivo"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 hover:bg-rose-950/40 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
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
            <div className="bg-[#161b22] border border-gray-800/60 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" /> Timeline do Card & Histórico
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
                  className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-700/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTimelineNote}
                  className="bg-[#161b22] hover:bg-[#21262d] text-gray-200 border border-gray-800 text-xs font-medium px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send size={13} className="text-gray-400" /> Registrar
                </button>
              </div>

              {/* Linha Cronológica */}
              <div className="relative pl-6 border-l-2 border-gray-800/80 space-y-4">
                {timelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#161b22] ${
                      evt.type === 'created' ? 'bg-blue-500/80' :
                      evt.type === 'reactivated' ? 'bg-blue-400/80' :
                      evt.type === 'task' ? 'bg-amber-400/80' :
                      evt.type === 'event' ? 'bg-purple-400/80' :
                      evt.type === 'stage_change' ? 'bg-emerald-500/80' : 'bg-gray-500'
                    }`}></div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-gray-200">{evt.title}</span>
                      <span className="text-[10px] text-gray-500">
                        {safeFormatDate(evt.date)}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-gray-800 text-[8px] flex items-center justify-center font-bold text-white">
                        {evt.author?.[0] || "S"}
                      </div>
                      <span>{evt.author || "Sistema"}</span>
                      {evt.stage && (
                        <span className="text-[10px] font-mono bg-gray-900 border border-gray-800 px-1.5 py-0.2 rounded text-gray-400">
                          {String(evt.stage).toUpperCase()}
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
          <div className="w-full lg:w-[350px] bg-[#13171f]/80 p-6 lg:p-7 flex flex-col gap-5 overflow-y-auto custom-scrollbar shrink-0 border-t lg:border-t-0 border-gray-800/60">
            
            {/* ETAPA ATUAL & RESPONSÁVEL */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Etapa do Funil
                </label>
                <select 
                  className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                  value={deal.status || "new"}
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
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Responsável pelo Negócio
                </label>
                <select 
                  className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
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

            <div className="h-px bg-gray-800/60 w-full"></div>

            {/* AÇÕES DE STATUS CRÍTICO (GANHO / PERDIDO NO PADRÃO LERO) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleMarkWon}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  deal.status === 'won'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 shadow-sm'
                    : 'bg-emerald-950/20 hover:bg-emerald-950/35 text-emerald-400 border-emerald-900/40'
                }`}
                title="Marcar como Fechado / Ganho"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>{deal.status === 'won' ? 'Ganho' : 'Marcar Ganho'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLossModal(true)}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  deal.status === 'lost'
                    ? 'bg-rose-950/40 text-rose-300 border-rose-700/60 shadow-sm'
                    : 'bg-rose-950/20 hover:bg-rose-950/35 text-rose-400/90 border-rose-900/30'
                }`}
                title="Marcar como Fechado / Perdido"
              >
                <XCircle size={14} className="text-rose-400/90" />
                <span>{deal.status === 'lost' ? 'Perdido' : 'Marcar Perdido'}</span>
              </button>
            </div>

            {/* REATIVAR NEGOCIAÇÃO (SE ESTIVER PERDIDO OU DESQUALIFICADO) */}
            {(deal.status === 'lost' || deal.status === 'disqualified') && (
              <button 
                type="button"
                onClick={handleReactivateDeal} 
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl text-xs font-medium text-blue-300 bg-blue-950/25 border border-blue-900/40 hover:bg-blue-900/35 transition-all"
              >
                <RotateCcw size={14} /> Reativar Negociação
              </button>
            )}

            {/* BOTÕES DE AÇÃO UNIFICADOS (MONOCROMÁTICOS COM HOVER EM AZUL ESCURO) */}
            <div className="flex flex-col gap-2">
              
              {/* 1. Ver Conversa no WhatsApp */}
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  if (deal.contactId) {
                    router.push(`/inbox?contactId=${deal.contactId}`);
                  } else {
                    router.push(`/inbox`);
                  }
                }} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-medium text-gray-200 bg-[#161b22] border border-gray-800 hover:bg-[#21262d] hover:border-gray-700 transition-colors"
              >
                <MessageSquare size={14} className="text-gray-400" />
                <span>Ver Conversa no WhatsApp</span>
              </button>

              {/* 2. Enviar Mensagem Rápida */}
              <button 
                type="button"
                onClick={() => loadChat('send')} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-medium text-gray-200 bg-[#161b22] border border-gray-800 hover:bg-[#21262d] hover:border-gray-700 transition-colors"
              >
                <Send size={14} className="text-gray-400" />
                <span>Enviar Mensagem Rápida</span>
              </button>

              {/* 3. Criar Tarefa */}
              <button 
                type="button"
                onClick={() => {
                  setActivityTab('task');
                  setShowActivityModal(true);
                }} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-medium text-gray-200 bg-[#161b22] border border-gray-800 hover:bg-[#21262d] hover:border-gray-700 transition-colors"
              >
                <CheckSquare size={14} className="text-gray-400" />
                <span>Criar Tarefa</span>
              </button>

              {/* 4. Criar Evento */}
              <button 
                type="button"
                onClick={() => {
                  setActivityTab('event');
                  setShowActivityModal(true);
                }} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-medium text-gray-200 bg-[#161b22] border border-gray-800 hover:bg-[#21262d] hover:border-gray-700 transition-colors"
              >
                <Calendar size={14} className="text-gray-400" />
                <span>Criar Evento</span>
              </button>

              {/* 5. Editar Contato */}
              <button 
                type="button"
                onClick={() => setShowEditContactModal(true)} 
                className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-xs font-medium text-gray-200 bg-[#161b22] border border-gray-800 hover:bg-[#21262d] hover:border-gray-700 transition-colors"
                title="Editar informações completas do contato"
              >
                <UserCog size={14} className="text-gray-400" />
                <span>Editar Contato</span>
              </button>
            </div>

            {/* Rodapé da Coluna Direita */}
            <div className="mt-auto pt-5 border-t border-gray-800/60 flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 text-center">
                Criado em: {safeFormatDate(deal.createdAt)}
              </span>

              <button 
                type="button"
                onClick={() => {
                  if (confirm("Deseja mover esta oportunidade para Desqualificados?")) {
                    handleStageChange('disqualified');
                  }
                }}
                className="flex items-center justify-center gap-1.5 w-full p-2 rounded-lg text-xs font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-colors"
              >
                <Trash2 size={13} /> Desqualificar / Excluir
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* SUBMODAL: EDITAR CONTATO (PADRÃO CORPORATIVO LERO)                        */}
        {/* ========================================================================= */}
        {showEditContactModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#161b22] border border-gray-800 w-full max-w-2xl rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
              
              {/* Topo do Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-[#161b22] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-gray-300">
                    <UserCog size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Editar Contato</h3>
                    <p className="text-[11px] text-gray-400">Atualize as informações cadastrais e comerciais do contato</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditContactModal(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corpo com Grid de 2 Colunas */}
              <div className="p-6 overflow-y-auto max-h-[72vh] custom-scrollbar space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* 1. Nome do Contato */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Nome do Contato <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editContactData.name}
                      onChange={e => setEditContactData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo do lead..."
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 2. Número WhatsApp */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Número WhatsApp <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={editContactData.phone}
                      onChange={e => setEditContactData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+55 (11) 99999-9999"
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 3. Data de Nascimento */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Data de Nascimento
                    </label>
                    <input 
                      type="date" 
                      value={editContactData.birthDate}
                      onChange={e => setEditContactData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 4. Email */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Email
                    </label>
                    <input 
                      type="email" 
                      value={editContactData.email}
                      onChange={e => setEditContactData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@cliente.com.br"
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 5. Cargo / Função */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Cargo / Função
                    </label>
                    <input 
                      type="text" 
                      value={editContactData.role}
                      onChange={e => setEditContactData(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="Ex: Produtor Rural, Diretor de Compras"
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 6. CPF / CNPJ */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      CPF / CNPJ
                    </label>
                    <input 
                      type="text" 
                      value={editContactData.document}
                      onChange={e => setEditContactData(prev => ({ ...prev, document: e.target.value }))}
                      placeholder="000.000.000-00 ou CNPJ"
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 7. Tipo de Contato */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Tipo de Contato
                    </label>
                    <select 
                      value={editContactData.type}
                      onChange={e => setEditContactData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                    >
                      <option value="Lead" className="bg-[#161b22]">Lead (Potencial Cliente)</option>
                      <option value="Cliente" className="bg-[#161b22]">Cliente Ativo</option>
                      <option value="Ex-Cliente" className="bg-[#161b22]">Ex-Cliente</option>
                      <option value="Fornecedor" className="bg-[#161b22]">Fornecedor</option>
                      <option value="Parceiro" className="bg-[#161b22]">Parceiro Comercial</option>
                      <option value="Outro" className="bg-[#161b22]">Outro</option>
                    </select>
                  </div>

                  {/* 8. Endereço Completo & CEP */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Endereço Completo & CEP
                    </label>
                    <input 
                      type="text" 
                      value={editContactData.address}
                      onChange={e => setEditContactData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Endereço, Cidade - UF, CEP..."
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                    />
                  </div>

                  {/* 9. Empresas (Atribuir Empresa) */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Empresas (Atribuir Empresa)
                    </label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3.5 top-3 text-gray-500" />
                      <input 
                        type="text" 
                        value={editContactData.company}
                        onChange={e => setEditContactData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Nome da empresa vinculada..."
                        className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 10. Rótulo de Campanha & Origem */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Rótulo de Campanha & Origem
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        value={editContactData.campaign}
                        onChange={e => setEditContactData(prev => ({ ...prev, campaign: e.target.value }))}
                        placeholder="Campanha"
                        className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                      />
                      <input 
                        type="text" 
                        value={editContactData.source}
                        onChange={e => setEditContactData(prev => ({ ...prev, source: e.target.value }))}
                        placeholder="Origem"
                        className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 11. Observação do Contato */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Observações do Contato
                    </label>
                    <textarea 
                      value={editContactData.notes}
                      onChange={e => setEditContactData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações importantes, detalhes comerciais ou histórico do contato..."
                      className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 resize-y min-h-[90px] leading-relaxed transition-colors"
                    />
                  </div>

                </div>
              </div>

              {/* Botões Inferiores */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/80 bg-[#161b22] shrink-0">
                <button
                  type="button"
                  onClick={handleDeleteContact}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 rounded-xl transition-all"
                  title="Desvincular contato desta oportunidade"
                >
                  <Trash2 size={13} />
                  <span>Excluir contato</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEditContactModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditContact}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
                  >
                    <Check size={14} />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMODAL DE CONFIRMAÇÃO DE PERDA (PADRÃO LERO)                            */}
        {/* ========================================================================= */}
        {showLossModal && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#161b22] border border-gray-800 w-full max-w-sm rounded-xl p-5 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <XCircle size={16} className="text-rose-400" /> Marcar como Perdido
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Selecione o motivo principal para a perda desta oportunidade:
              </p>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Motivo</label>
                  <select
                    value={lossReason}
                    onChange={e => setLossReason(e.target.value)}
                    className="w-full bg-[#0d1117] border border-gray-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-700/60"
                  >
                    <option value="">Selecione um motivo...</option>
                    <option value="preco">Preço / Orçamento alto</option>
                    <option value="concorrencia">Comprou do concorrente</option>
                    <option value="sem_interesse">Sem interesse / Desistiu</option>
                    <option value="sem_contato">Não atende / Incomunicável</option>
                    <option value="fora_perfil">Fora do perfil / Sem crédito</option>
                    <option value="outro">Outro motivo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Observação / Justificativa</label>
                  <textarea
                    value={lossComment}
                    onChange={e => setLossComment(e.target.value)}
                    placeholder="Detalhes adicionais sobre a perda..."
                    className="w-full bg-[#0d1117] border border-gray-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-700/60 resize-none h-20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLossModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmLoss}
                  disabled={!lossReason}
                  className="px-4 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirmar Perda
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMODAL UNIFICADO: NOVA TAREFA / NOVO EVENTO (PADRÃO LERO)              */}
        {/* ========================================================================= */}
        {showActivityModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#161b22] border border-gray-800 w-full max-w-xl rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
              
              {/* TOPO COM ABAS CÁPSULA (EVENTO / TAREFA) E BOTÃO FECHAR */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-800/80 bg-[#161b22] shrink-0">
                <div className="flex items-center p-1 bg-[#0d1117] border border-gray-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActivityTab('event')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activityTab === 'event'
                        ? 'bg-[#21262d] text-white shadow-sm border border-gray-700'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Calendar size={13} className={activityTab === 'event' ? 'text-blue-400' : 'text-gray-400'} />
                    <span>Evento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityTab('task')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activityTab === 'task'
                        ? 'bg-[#21262d] text-white shadow-sm border border-gray-700'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <CheckSquare size={13} className={activityTab === 'task' ? 'text-blue-400' : 'text-gray-400'} />
                    <span>Tarefa</span>
                  </button>
                </div>

                <button 
                  onClick={() => setShowActivityModal(false)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* FAIXA: VINCULADO A */}
              <div className="px-6 py-2.5 bg-[#0d1117]/60 border-b border-gray-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Vinculado a:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161b22] border border-gray-800 rounded-md text-gray-200 font-medium">
                    <UserIcon size={12} className="text-gray-400" />
                    <span className="truncate max-w-[280px]">
                      {deal.contact?.name || deal.title || "Contato / Negócio"}
                    </span>
                    <span className="text-gray-400 text-[11px]">#{deal.id?.slice(0, 7) || 'lead'}</span>
                  </div>
                </div>
                {deal.contact?.phone && (
                  <span className="text-gray-400 text-[11px] hidden sm:inline-block">
                    {deal.contact.phone}
                  </span>
                )}
              </div>

              {/* CORPO DO FORMULÁRIO */}
              <div className="p-6 overflow-y-auto max-h-[68vh] custom-scrollbar space-y-5">
                
                {/* 1. TÍTULO */}
                <div>
                  <input
                    type="text"
                    value={activityTab === 'task' ? taskFormData.title : eventFormData.title}
                    onChange={e => {
                      if (activityTab === 'task') {
                        setTaskFormData(prev => ({ ...prev, title: e.target.value }));
                      } else {
                        setEventFormData(prev => ({ ...prev, title: e.target.value }));
                      }
                    }}
                    placeholder={activityTab === 'task' ? "Adicione um título da tarefa..." : "Adicione um título do evento..."}
                    className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors"
                  />
                </div>

                {/* 2. DESCRIÇÃO */}
                <div>
                  <textarea
                    value={activityTab === 'task' ? taskFormData.description : eventFormData.description}
                    onChange={e => {
                      if (activityTab === 'task') {
                        setTaskFormData(prev => ({ ...prev, description: e.target.value }));
                      } else {
                        setEventFormData(prev => ({ ...prev, description: e.target.value }));
                      }
                    }}
                    placeholder="Adicione mais detalhes..."
                    className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60 transition-colors resize-none h-20"
                  />
                </div>

                {/* ========================================================= */}
                {/* ABA: TAREFA                                              */}
                {/* ========================================================= */}
                {activityTab === 'task' && (
                  <>
                    {/* SEÇÃO: QUANDO */}
                    <div className="space-y-2.5 pt-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        QUANDO
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <input
                            type="date"
                            value={taskFormData.date}
                            onChange={e => setTaskFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                          />
                        </div>

                        {!taskFormData.allDay ? (
                          <div>
                            <input
                              type="time"
                              value={taskFormData.time}
                              onChange={e => setTaskFormData(prev => ({ ...prev, time: e.target.value }))}
                              className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic px-2">
                            Disponível durante o dia inteiro
                          </div>
                        )}
                      </div>

                      <div className="pt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={taskFormData.allDay}
                            onChange={e => setTaskFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                            className="w-3.5 h-3.5 rounded bg-[#0d1117] border border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-300">Dia inteiro</span>
                        </label>
                      </div>
                    </div>

                    <div className="h-px bg-gray-800/60 w-full"></div>

                    {/* SEÇÃO: DETALHES DA TAREFA */}
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        DETALHES DA TAREFA
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Categoria */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 block mb-1">Categoria</label>
                          <select
                            value={taskFormData.category}
                            onChange={e => setTaskFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 cursor-pointer"
                          >
                            <option value="Ligação">Ligação</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Reunião">Reunião</option>
                            <option value="E-mail">E-mail</option>
                            <option value="Proposta">Proposta</option>
                            <option value="Visita Técnica">Visita Técnica</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>

                        {/* Prioridade */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 block mb-1">Prioridade</label>
                          <select
                            value={taskFormData.priority}
                            onChange={e => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 cursor-pointer"
                          >
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </select>
                        </div>

                        {/* Responsável */}
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 block mb-1">Responsável</label>
                          <select
                            value={taskFormData.assignedTo}
                            onChange={e => setTaskFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 cursor-pointer"
                          >
                            <option value="">Fila Geral (Todos)</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-800/60 w-full"></div>

                    {/* SEÇÃO: ANEXOS */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          ANEXOS
                        </label>
                        <span className="text-[11px] text-gray-500">
                          Total: {taskFormData.attachments.length} arquivo(s) (máx 25 MB)
                        </span>
                      </div>

                      <input
                        type="file"
                        ref={taskAttachmentInputRef}
                        onChange={handleTaskFileUpload}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => taskAttachmentInputRef.current?.click()}
                          className="px-3 py-2 bg-[#0d1117] hover:bg-[#21262d] border border-dashed border-gray-700 hover:border-gray-500 rounded-xl text-xs font-medium text-gray-300 transition-colors flex items-center gap-1.5"
                        >
                          <Upload size={13} className="text-gray-400" />
                          <span>Adicionar arquivo</span>
                        </button>

                        {taskFormData.attachments.map(att => (
                          <div
                            key={att.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0d1117] border border-gray-800 rounded-xl text-xs text-gray-300 group"
                          >
                            <Paperclip size={12} className="text-gray-400" />
                            <span className="max-w-[140px] truncate">{att.name}</span>
                            <span className="text-[10px] text-gray-500">({att.size})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTaskAttachment(att.id)}
                              className="text-gray-500 hover:text-rose-400 transition-colors ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ========================================================= */}
                {/* ABA: EVENTO                                              */}
                {/* ========================================================= */}
                {activityTab === 'event' && (
                  <>
                    {/* SEÇÃO: QUANDO */}
                    <div className="space-y-2.5 pt-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        QUANDO
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 block mb-1">Início</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={eventFormData.startDate}
                              onChange={e => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                              className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                            />
                            {!eventFormData.allDay && (
                              <input
                                type="time"
                                value={eventFormData.startTime}
                                onChange={e => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                className="w-24 bg-[#0d1117] border border-gray-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-medium text-gray-400 block mb-1">Término</label>
                          <div className="flex gap-2">
                            {eventFormData.differentEndDay ? (
                              <input
                                type="date"
                                value={eventFormData.endDate}
                                onChange={e => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 transition-colors cursor-pointer"
                              />
                            ) : null}
                            {!eventFormData.allDay && (
                              <input
                                type="time"
                                value={eventFormData.endTime}
                                onChange={e => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                className={`${eventFormData.differentEndDay ? 'w-24' : 'w-full'} bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 transition-colors cursor-pointer`}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={eventFormData.allDay}
                            onChange={e => setEventFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                            className="w-3.5 h-3.5 rounded bg-[#0d1117] border border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-300">Dia inteiro</span>
                        </label>

                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={eventFormData.differentEndDay}
                            onChange={e => setEventFormData(prev => ({ ...prev, differentEndDay: e.target.checked }))}
                            className="w-3.5 h-3.5 rounded bg-[#0d1117] border border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-300">Termina em outro dia</span>
                        </label>
                      </div>
                    </div>

                    <div className="h-px bg-gray-800/60 w-full"></div>

                    {/* SEÇÃO: AGENDA & ONDE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Agenda */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          AGENDA
                        </label>
                        <select
                          value={eventFormData.calendarType}
                          onChange={e => setEventFormData(prev => ({ ...prev, calendarType: e.target.value }))}
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 cursor-pointer"
                        >
                          <option value="company">Agenda da Empresa (Equipe)</option>
                          <option value="private">Agenda Privada (Apenas Eu)</option>
                        </select>
                      </div>

                      {/* Onde */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          ONDE
                        </label>
                        <select
                          value={eventFormData.locationType}
                          onChange={e => setEventFormData(prev => ({ ...prev, locationType: e.target.value }))}
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-700/60 cursor-pointer"
                        >
                          <option value="Google Meet">Google Meet</option>
                          <option value="Microsoft Teams">Microsoft Teams</option>
                          <option value="Jitsi">Jitsi Meet</option>
                          <option value="presential">Presencial</option>
                          <option value="none">Nenhum (A definir)</option>
                        </select>
                      </div>
                    </div>

                    {/* Se presencial, campo de endereço */}
                    {eventFormData.locationType === 'presential' && (
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 block mb-1">Local / Endereço Presencial</label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-2.5 text-gray-500" />
                          <input
                            type="text"
                            value={eventFormData.locationDetails}
                            onChange={e => setEventFormData(prev => ({ ...prev, locationDetails: e.target.value }))}
                            placeholder="Ex: Av. Paulista, 1000 - Sala 42"
                            className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-700/60"
                          />
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-gray-800/60 w-full"></div>

                    {/* SEÇÃO: PARTICIPANTES & NOTIFICAÇÕES */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        PARTICIPANTES & NOTIFICAÇÕES
                      </label>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-gray-800 rounded-xl text-xs text-gray-200">
                          <UserIcon size={13} className="text-gray-400" />
                          <span>{deal.contact?.name || deal.title || "Contato"} (Cliente)</span>
                        </div>

                        {users.slice(0, 4).map(u => {
                          const isSelected = eventFormData.internalParticipants.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setEventFormData(prev => ({
                                  ...prev,
                                  internalParticipants: isSelected
                                    ? prev.internalParticipants.filter(id => id !== u.id)
                                    : [...prev.internalParticipants, u.id]
                                }));
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors border ${
                                isSelected
                                  ? 'bg-[#21262d] text-white border-blue-600/60'
                                  : 'bg-[#0d1117] text-gray-400 border-gray-800 hover:text-gray-200'
                              }`}
                            >
                              <Users size={12} className={isSelected ? "text-blue-400" : "text-gray-500"} />
                              <span>{u.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={eventFormData.notifyReminder}
                            onChange={e => setEventFormData(prev => ({ ...prev, notifyReminder: e.target.checked }))}
                            className="w-3.5 h-3.5 rounded bg-[#0d1117] border border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-300 flex items-center gap-1.5">
                            <Bell size={12} className="text-gray-400" />
                            Notificar lembrete no sistema 15 minutos antes
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={eventFormData.sendEmailInvite}
                            onChange={e => setEventFormData(prev => ({ ...prev, sendEmailInvite: e.target.checked }))}
                            className="w-3.5 h-3.5 rounded bg-[#0d1117] border border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-300 flex items-center gap-1.5">
                            <Mail size={12} className="text-gray-400" />
                            Enviar convite por e-mail com link da reunião para participantes
                          </span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* RODAPÉ COM BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/80 bg-[#161b22] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2.5">
                  {activityTab === 'task' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveTask(true)}
                        className="px-4 py-2 bg-[#21262d] hover:bg-gray-700 text-gray-200 border border-gray-700 font-semibold text-xs rounded-xl transition-all shadow-sm"
                      >
                        Criar e adicionar outra
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveTask(false)}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
                      >
                        <Check size={14} />
                        <span>Criar tarefa</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveEvent}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
                    >
                      <Check size={14} />
                      <span>Criar evento</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INNER CHAT DRAWER (Mensagem Rápida)                                       */}
        {/* ========================================================================= */}
        {chatMode !== 'none' && (
          <div className="absolute inset-0 z-50 bg-[#161b22] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161b22] shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-gray-400" />
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
                <div className="flex-1 flex flex-col bg-[#0d1117] p-4 overflow-y-auto custom-scrollbar gap-3">
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
                              ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30' 
                              : isMe 
                                ? 'bg-[#1e293b] text-white border border-gray-700 rounded-br-none' 
                                : 'bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-bl-none'
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

                <div className="w-full md:w-[360px] bg-[#161b22] border-t md:border-t-0 md:border-l border-gray-800 p-4 flex flex-col gap-3">
                  <div className="flex gap-4 border-b border-gray-800 pb-2">
                    <button 
                      onClick={() => setIsInternal(false)}
                      className={`text-xs font-bold transition-colors ${!isInternal ? 'text-white border-b-2 border-primary pb-1' : 'text-gray-400'}`}
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
                    className="flex-1 bg-[#0d1117] border border-gray-800 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-700/60 resize-none min-h-[140px]"
                  />

                  <button 
                    onClick={handleSendMsg}
                    className="w-full bg-[#161b22] hover:bg-[#21262d] text-gray-200 border border-gray-700 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Send size={14} className="text-gray-400" /> Enviar Mensagem
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
