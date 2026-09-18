"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, 
  BrainCircuit, Lock, Image as ImageIcon, FileText, Mic, X, ArrowRightLeft, Network,
  RefreshCw, TrendingUp, Calendar, MessageSquare, CheckCircle2, Plus, Sparkles,
  BookUser, CalendarClock, PhoneCall, Zap, Eye, ShieldCheck, PhoneForwarded, UserCheck,
  Smile, Bold, Italic, Strikethrough, Code, ChevronDown, Trash2, Play, Pause,
  Volume2, Check, CheckCheck, Copy, ExternalLink, Headphones, Download, ZoomIn, Maximize2,
  BellOff, History, UserPlus, FileDown, MessageSquarePlus, PanelRight, Info, Pin,
  Clock, AlertCircle
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import ScheduleModal from "@/components/inbox/ScheduleModal";
import ScheduledMessagesDrawer, { ScheduledMessage } from "@/components/inbox/ScheduledMessagesDrawer";
import GlobalScheduledCenterModal from "@/components/inbox/GlobalScheduledCenterModal";

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', 
  '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🤝', '👍', '👎', 
  '👌', '✌️', '🤞', '👏', '🙌', '🙏', '💪', '🔥', '✨', '⭐', 
  '🚀', '💡', '💬', '📞', '📅', '⏰', '⏳', '🎯', '✅', '❌', 
  '⚠️', '💰', '💵', '💳', '📊', '📈', '📌', '📎', '🎉', '🏆'
];

const TAG_COLOR_PALETTES = [
  { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-700/60', dot: 'bg-emerald-400' },
  { bg: 'bg-blue-950/70', text: 'text-blue-300', border: 'border-blue-700/60', dot: 'bg-blue-400' },
  { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-700/60', dot: 'bg-purple-400' },
  { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-700/60', dot: 'bg-amber-400' },
  { bg: 'bg-cyan-950/70', text: 'text-cyan-300', border: 'border-cyan-700/60', dot: 'bg-cyan-400' },
  { bg: 'bg-rose-950/70', text: 'text-rose-300', border: 'border-rose-700/60', dot: 'bg-rose-400' },
  { bg: 'bg-indigo-950/70', text: 'text-indigo-300', border: 'border-indigo-700/60', dot: 'bg-indigo-400' },
];

function getTagColor(tag: string) {
  if (!tag) return TAG_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length;
  return TAG_COLOR_PALETTES[index];
}

const WHATSAPP_WALLPAPER_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360' fill='none' stroke='%23ffffff' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M30 40c0-5.5 4.5-10 10-10h30c5.5 0 10 4.5 10 10v20c0 5.5-4.5 10-10 10H40l-15 15V40z'/%3E%3Ccircle cx='180' cy='60' r='14'/%3E%3Cpath d='M180 52v8l5 3'/%3E%3Cpath d='M315 35l12 24h-24z'/%3E%3Cpath d='M60 180c-5-8-15-8-20 0-5 8 0 16 10 24 10-8 15-16 10-24z'/%3E%3Cpath d='M150 170h35v18c0 9-9 18-18 18s-18-9-18-18v-18z'/%3E%3Cpath d='M185 174c4 0 9 3 9 9s-5 9-9 9'/%3E%3Cpath d='M290 160c-9 0-16 7-16 16v22c0 9 7 16 16 16s16-7 16-16v-22c0-9-7-16-16-16z'/%3E%3Cpath d='M274 182h32'/%3E%3Cpath d='M40 310l25-8-8 25-6-10z'/%3E%3Ccircle cx='160' cy='310' r='13'/%3E%3Cpath d='M155 306l4 4 7-7'/%3E%3Cpath d='M280 290c0-5 4-9 9-9h18c5 0 9 4 9 9v14l-9-5h-18c-5 0-9-4-9-9z'/%3E%3Cpath d='M335 180c0-4 3-7 7-7h12c4 0 7 3 7 7v10l-7-3h-12c-4 0-7-3-7-7z'/%3E%3Cpath d='M100 80l10 10M110 80l-10 10'/%3E%3Cpath d='M230 110l3 7 7 3-7 3-3 7-3-7-7-3 7-3z'/%3E%3Cpath d='M70 250l3 5 5 3-5 3-3 5-3-5-5-3 5-3z'/%3E%3Cpath d='M220 250c0-5 4-8 8-8s8 3 8 8c0 8-16 16-16 16s-16-8-16-16c0-5 4-8 8-8s8 3 8 8z'/%3E%3Cpath d='M335 315c-3 0-6 3-6 6s3 6 6 6 6-3 6-6-3-6-6-6z'/%3E%3Cpath d='M120 345h40'/%3E%3C/svg%3E")`;

function getWhatsAppDateLabel(dateInput?: string | number | Date): string {
  if (!dateInput) return 'Hoje';
  const date = new Date(dateInput);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InboxContent() {
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');
  const conversationIdParam = searchParams.get('conversationId') || searchParams.get('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'waiting' | 'mine' | 'resolved'>('waiting');
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isReopening, setIsReopening] = useState(false);
  const { socket, isConnected, clearGlobalUnread } = useSocket();
  const { instances, activeInstance, setActiveInstance, refreshInstances, status: waStatus, refreshStatus: refreshWaStatus } = useWhatsApp();
  const [showInstanceDropdown, setShowInstanceDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [taggingContactId, setTaggingContactId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'unread' | 'waiting' | 'mine' | 'resolved'>('all');
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Helper de auto-scroll para a última mensagem
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Efeito de rolagem automática sempre que mensagens ou chat ativo mudarem
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
      const timer = setTimeout(() => scrollToBottom('auto'), 60);
      return () => clearTimeout(timer);
    }
  }, [messages.length, activeChat]);

  // Estados de Gravação de Áudio via MediaRecorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Player de Áudio ativo
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Feedback de Cópia
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Estados de Assunção de Fila & Espiar (Padrão Lero)
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [selectedQueueChat, setSelectedQueueChat] = useState<any | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);

  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactModalSearch, setContactModalSearch] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduledDrawer, setShowScheduledDrawer] = useState(false);
  const [showGlobalScheduleCenter, setShowGlobalScheduleCenter] = useState(false);
  const [scheduledMessagesByChat, setScheduledMessagesByChat] = useState<{ [chatId: string]: ScheduledMessage[] }>({});
  const [showVoipDialer, setShowVoipDialer] = useState(false);
  const [voipNumber, setVoipNumber] = useState('');

  // Modal Lightbox / Expansão de Imagem
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  // Estados para Refinamento Técnico e Visual (Padrão Lero)
  const [contextMenuContactId, setContextMenuContactId] = useState<string | null>(null);
  const [mutedContactIds, setMutedContactIds] = useState<string[]>([]);
  const [expandedTranscriptions, setExpandedTranscriptions] = useState<{ [key: string]: boolean }>({});
  const [showChatOptionsMenu, setShowChatOptionsMenu] = useState(false);
  const [showLeftHeaderMenu, setShowLeftHeaderMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Carrega contatos silenciados e mensagens agendadas salvos no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('versus_muted_chats');
      if (saved) setMutedContactIds(JSON.parse(saved));
      const savedSched = localStorage.getItem('versus_scheduled_messages');
      if (savedSched) setScheduledMessagesByChat(JSON.parse(savedSched));
    } catch (e) {}
  }, []);

  // Sincroniza mensagens agendadas do backend para o chat ativo
  useEffect(() => {
    if (!activeChat) return;
    api.get(`/conversations/${activeChat}/scheduled`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setScheduledMessagesByChat(prev => {
            const updated = { ...prev, [activeChat]: res.data };
            try {
              localStorage.setItem('versus_scheduled_messages', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [activeChat]);

  // Sincroniza todos os agendamentos da empresa ao abrir a Central Global
  useEffect(() => {
    if (!showGlobalScheduleCenter) return;
    api.get('/conversations/scheduled/all')
      .then(res => {
        if (Array.isArray(res.data)) {
          const mapped: { [chatId: string]: ScheduledMessage[] } = {};
          res.data.forEach((item: any) => {
            const cId = item.conversationId;
            if (!mapped[cId]) mapped[cId] = [];
            mapped[cId].push({
              id: item.id,
              conversationId: item.conversationId,
              content: item.content,
              scheduledAt: item.scheduledAt,
              status: item.status,
              createdAt: item.createdAt,
            });
          });
          setScheduledMessagesByChat(prev => {
            const merged = { ...prev, ...mapped };
            try {
              localStorage.setItem('versus_scheduled_messages', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [showGlobalScheduleCenter]);


  const saveScheduledMessages = (updated: { [chatId: string]: ScheduledMessage[] }) => {
    setScheduledMessagesByChat(updated);
    try {
      localStorage.setItem('versus_scheduled_messages', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleScheduleSuccess = (newScheduled: any) => {
    if (!activeChat) return;
    const currentList = scheduledMessagesByChat[activeChat] || [];
    const updated = {
      ...scheduledMessagesByChat,
      [activeChat]: [...currentList, newScheduled]
    };
    saveScheduledMessages(updated);
  };

  const handleCancelScheduled = async (id: string) => {
    if (!activeChat) return;
    try {
      await api.delete(`/conversations/messages/${id}/schedule`).catch(() => {});
    } catch (e) {}
    const currentList = scheduledMessagesByChat[activeChat] || [];
    const updated = {
      ...scheduledMessagesByChat,
      [activeChat]: currentList.filter(item => item.id !== id)
    };
    saveScheduledMessages(updated);
  };

  // Fecha menus contextuais e popovers ao clicar fora
  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenuContactId(null);
      setShowChatOptionsMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Marcar conversa como lida / não lida
  const handleToggleRead = async (contactId: string) => {
    const target = contacts.find(c => c.id === contactId);
    const isCurrentlyUnread = (target?.unread || 0) > 0;
    const newUnread = isCurrentlyUnread ? 0 : 1;

    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unread: newUnread, hasNewMessage: !isCurrentlyUnread } : c));
    setContextMenuContactId(null);

    try {
      if (isCurrentlyUnread) {
        await api.patch(`/conversations/${contactId}/read`);
      } else {
        await api.patch(`/conversations/${contactId}/unread`);
      }
    } catch (err) {
      console.warn("Erro ao atualizar status de leitura:", err);
    }
  };

  // Alternar silenciamento de notificações
  const handleToggleMute = (contactId: string) => {
    setMutedContactIds(prev => {
      const isMuted = prev.includes(contactId);
      const updated = isMuted ? prev.filter(id => id !== contactId) : [...prev, contactId];
      try {
        localStorage.setItem('versus_muted_chats', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setContextMenuContactId(null);
  };

  // Ignorar atendimento ou finalizar
  const handleIgnoreOrResolve = async (contactId: string) => {
    setContextMenuContactId(null);
    try {
      await api.patch(`/conversations/${contactId}/ignore`);
      if (activeChat === contactId) {
        setActiveChat(null);
      }
      refetchConversations();
    } catch (err) {
      console.error("Erro ao ignorar atendimento:", err);
    }
  };

  // Exportar histórico completo da conversa para arquivo .txt
  const handleExportConversation = () => {
    if (!activeContactData) return;
    const lines = [
      "=================================================================",
      "VERSUS OMNICHANNEL - TRANSCRIÇÃO OFICIAL DE CONVERSA",
      `Contato: ${activeContactData.name || 'Cliente'}`,
      `Telefone: ${activeContactData.phone || 'Não informado'}`,
      `Data de Exportação: ${new Date().toLocaleString('pt-BR')}`,
      `Total de Mensagens: ${messages.length}`,
      "=================================================================\n"
    ];

    messages.forEach((m, idx) => {
      const time = new Date(m.createdAt || Date.now()).toLocaleString('pt-BR');
      const sender = m.isInternal 
        ? '[NOTA INTERNA]' 
        : (m.direction === 'OUTBOUND' ? '[ATENDENTE]' : (m.senderType === 'system' ? '[IA VITOR]' : `[${activeContactData.name}]`));
      
      let text = m.content || '';
      if (m.type === 'audio') {
        text = `[ÁUDIO / VOZ] ${m.audioTranscription ? `(Transcrição: "${m.audioTranscription}")` : ''} - ${m.mediaUrl || ''}`;
      } else if (m.type === 'image') {
        text = `[IMAGEM ANEXA] ${m.mediaUrl || ''} ${m.content ? `- "${m.content}"` : ''}`;
      } else if (m.type === 'document') {
        text = `[DOCUMENTO / PDF] ${m.mediaUrl || ''} ${m.content ? `- "${m.content}"` : ''}`;
      }

      lines.push(`${idx + 1}. [${time}] ${sender}: ${text}`);
    });

    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (activeContactData.name || 'chat').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `conversa_${cleanName}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fecha o Lightbox ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  // Download direto de imagem com nome formatado
  const handleDownloadImage = async (url: string, title?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanExt = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(cleanExt) ? cleanExt : 'jpg';
      const cleanTitle = (title && title !== 'Imagem' && title !== 'Anexo') 
        ? title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
        : `versus_midia_${Date.now()}`;
      link.download = cleanTitle.endsWith(`.${ext}`) ? cleanTitle : `${cleanTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback padrão
      const link = document.createElement('a');
      link.href = url;
      link.download = `versus_midia_${Date.now()}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone || phone.includes('@lid')) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    } else if (clean.length === 12 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
    } else if (clean.length > 8) {
      return `+${clean}`;
    }
    return phone;
  };

  const formatContactDisplayName = (name?: string, phone?: string) => {
    const isGeneric = !name || name === 'Cliente WhatsApp' || name.includes('@lid') || name.startsWith('WhatsApp');
    if (isGeneric) {
      if (phone && !phone.includes('@lid')) {
        const formatted = formatPhoneNumber(phone);
        if (formatted) return formatted;
      }
      return 'Cliente WhatsApp';
    }
    return name;
  };

  const getContactInitials = (name?: string, phone?: string) => {
    const isGeneric = !name || name === 'Cliente WhatsApp' || name.includes('@lid') || name.startsWith('WhatsApp');
    if (isGeneric) {
      if (phone && !phone.includes('@lid')) {
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 2) return clean.slice(-2);
      }
      return 'WA';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'WA';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const SUGGESTED_TAGS = ['Lead Quente', 'Suporte VIP', 'Negociação', 'Financeiro', 'Aguardando'];

  const handleQuickAddTag = async (e: React.MouseEvent, contactId: string, tagToAdd: string) => {
    e.stopPropagation();
    if (!tagToAdd.trim()) return;

    const target = contacts.find(c => c.contactId === contactId || c.id === contactId);
    if (!target) return;

    const actualContactId = target.contactId || target.id;
    const current = target.tags || [];
    if (current.includes(tagToAdd.trim())) {
      setTaggingContactId(null);
      setCustomTagInput('');
      return;
    }

    const updated = [...current, tagToAdd.trim()];
    try {
      await api.patch(`/contacts/${actualContactId}/tags`, { tags: updated });
      setContacts(prev => prev.map(c => (c.contactId === actualContactId || c.id === contactId) ? { ...c, tags: updated } : c));
      setTaggingContactId(null);
      setCustomTagInput('');
    } catch (err) {
      console.error("Erro ao adicionar tag rápida", err);
    }
  };

  const handleInsertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) {
      setInputText(prev => `${prev}${prefix}${suffix}`);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const text = inputText;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || ''}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setInputText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = selected ? start + replacement.length : start + prefix.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setInputText(prev => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const text = inputText;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setInputText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = start + emoji.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Gravação de áudio não suportada pelo seu navegador.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const options = typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')
        ? { mimeType: 'audio/ogg; codecs=opus' }
        : typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm; codecs=opus')
          ? { mimeType: 'audio/webm; codecs=opus' }
          : undefined;

      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões de mídia.");
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const stopAndSendAudio = async () => {
    if (!mediaRecorderRef.current || !activeChat) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsSendingAudio(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const recordedMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType });
        const localPreviewUrl = URL.createObjectURL(audioBlob);

        const formData = new FormData();
        const ext = recordedMimeType.includes('ogg') ? 'ogg' : 'webm';
        const filename = `voice_${Date.now()}.${ext}`;
        formData.append('file', audioBlob, filename);
        formData.append('type', 'audio');
        formData.append('content', '🎤 Mensagem de voz');
        formData.append('isInternal', String(isInternalMode));
        if (activeInstance?.id) {
          formData.append('instanceId', activeInstance.id);
        }

        // Envia via FormData para o backend processar, converter se necessário e disparar na ponta final do WhatsApp
        const { data } = await api.post(`/conversations/${activeChat}/messages/audio`, formData);
        
        const messageToAdd = {
          ...data,
          mediaUrl: data.mediaUrl || localPreviewUrl,
        };
        setMessages((prev) => [...prev, messageToAdd]);

        if (!isInternalMode) {
          setContacts((prev) =>
            prev.map((c) =>
              c.id === activeChat
                ? { ...c, isAi: false, status: 'human_takeover', lastMsg: '🎤 Mensagem de voz' }
                : c
            )
          );
        }
      } catch (error) {
        console.error("Erro ao enviar áudio gravado:", error);
        alert("Erro ao processar e enviar áudio gravado.");
      } finally {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setIsSendingAudio(false);
        setRecordingTime(0);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      if (audioElementsRef.current[id]) {
        audioElementsRef.current[id].pause();
      }
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      if (!audioElementsRef.current[id]) {
        const audio = new Audio(url);
        audio.onended = () => setPlayingAudioId(null);
        audioElementsRef.current[id] = audio;
      }
      audioElementsRef.current[id].play().catch(console.error);
      setPlayingAudioId(id);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    // Busca macros na montagem
    api.get('/quick-replies').then(res => setQuickReplies(res.data)).catch(console.error);
  }, []);

  // Listener de URL (contactId ou conversationId): auto-identifica aba e abre o chat diretamente
  useEffect(() => {
    if (!contactIdParam && !conversationIdParam) return;

    let isMounted = true;
    const loadConversationFromUrl = async () => {
      try {
        let conv: any = null;
        if (conversationIdParam) {
          const res = await api.get(`/conversations/${conversationIdParam}`);
          conv = res.data;
        } else if (contactIdParam) {
          const res = await api.get(`/conversations/contact/${contactIdParam}`);
          conv = res.data;
        }

        if (!conv || !isMounted) return;

        let currentUserId = '';
        try {
          const userStr = localStorage.getItem('versus_user');
          if (userStr) {
            currentUserId = JSON.parse(userStr)?.id || '';
          }
        } catch (e) {}

        let targetTab: 'waiting' | 'mine' | 'resolved' = 'waiting';
        if (conv.status === 'resolved' || conv.status === 'closed') {
          targetTab = 'resolved';
        } else if (conv.assignedTo && conv.assignedTo === currentUserId) {
          targetTab = 'mine';
        } else if (conv.status === 'human_takeover' || conv.status === 'open' || conv.assignedTo) {
          targetTab = 'mine';
        } else {
          targetTab = 'waiting';
        }

        setActiveTab(targetTab);

        const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
        const rawAvatar = conv.contact?.avatarUrl;
        const cleanAvatar = (rawAvatar && rawAvatar !== 'null' && rawAvatar !== 'undefined' && !rawAvatar.includes('unsplash.com')) ? rawAvatar : null;
        const formattedContact = {
          id: conv.id,
          contactId: conv.contact?.id || '',
          name: formatContactDisplayName(conv.contact?.name, conv.contact?.phone),
          phone: conv.contact?.phone || '',
          email: conv.contact?.email || '',
          avatarUrl: cleanAvatar,
          tags: conv.contact?.tags || [],
          lastMsg: lastMsg,
          time: new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: conv.updatedAt,
          isAi: conv.status === 'bot_active',
          unread: 0,
          status: conv.status
        };

        setContacts(prev => {
          const exists = prev.some(c => c.id === conv.id);
          if (exists) return prev;
          return [formattedContact, ...prev];
        });

        setActiveChat(conv.id);
      } catch (err) {
        console.error("Erro ao carregar conversa a partir dos parâmetros de URL:", err);
      }
    };

    loadConversationFromUrl();
    return () => { isMounted = false; };
  }, [contactIdParam, conversationIdParam]);

  const { data: tabCounts, refetch: refetchCounts } = useQuery({
    queryKey: ['conversationCounts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/conversations/counts');
        return data;
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 8000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: productivityData, refetch: refetchProductivity } = useQuery({
    queryKey: ['operatorProductivity'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/conversations/operator-productivity');
        return data;
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 10000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const { data: directoryContacts = [] } = useQuery({
    queryKey: ['directoryContacts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/contacts');
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          avatarUrl: (c.avatarUrl && c.avatarUrl !== 'null' && c.avatarUrl !== 'undefined' && !c.avatarUrl.includes('unsplash.com')) ? c.avatarUrl : null,
          tags: c.tags || []
        }));
      } catch (e) {
        return [];
      }
    },
    enabled: showContactsModal,
    staleTime: 30000,
  });

  const queryTab = (activeFilterTab === 'unread' || activeFilterTab === 'all') ? 'all' : activeFilterTab;

  const { data: initialContacts, isLoading, error: fetchErrorQuery, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', activeFilterTab],
    queryFn: async () => {
      const { data } = await api.get(`/conversations?tab=${queryTab}`);
      return data.map((conv: any) => {
        const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
        const rawAvatar = conv.contact?.avatarUrl;
        const cleanAvatar = (rawAvatar && rawAvatar !== 'null' && rawAvatar !== 'undefined' && !rawAvatar.includes('unsplash.com')) ? rawAvatar : null;
        return {
          id: conv.id,
          contactId: conv.contact?.id || '',
          name: formatContactDisplayName(conv.contact?.name, conv.contact?.phone),
          phone: conv.contact?.phone || '',
          email: conv.contact?.email || '',
          avatarUrl: cleanAvatar,
          tags: conv.contact?.tags || [],
          lastMsg: lastMsg,
          time: new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: conv.updatedAt,
          isAi: conv.status === 'bot_active',
          unread: 0,
          status: conv.status
        };
      });
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // 1. Sincronizar dados da API com o estado local e resetar chat ativo caso não pertença à aba
  useEffect(() => {
    clearGlobalUnread();
    if (initialContacts) {
      setContacts(prev => {
        if (activeChat) {
          const currentChat = prev.find(c => c.id === activeChat);
          if (currentChat && !initialContacts.some((c: any) => c.id === activeChat)) {
            return [currentChat, ...initialContacts];
          }
        }
        return initialContacts;
      });

      setActiveChat(prev => {
        if (!prev) return null;
        if (conversationIdParam && prev === conversationIdParam) return prev;
        const exists = initialContacts.some((c: any) => c.id === prev);
        return exists ? prev : (conversationIdParam ? prev : null);
      });
    }
  }, [initialContacts, clearGlobalUnread, conversationIdParam]);

  useEffect(() => {
    if (fetchErrorQuery) {
      setFetchError((fetchErrorQuery as any).message || "Falha de rede");
    }
  }, [fetchErrorQuery]);

  // 2. Buscar mensagens quando o chat ativo mudar
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/conversations/${activeChat}/messages`);
        setMessages(data);
        setTimeout(() => {
          scrollToBottom('auto');
          textareaRef.current?.focus();
        }, 50);
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
      }
    };

    const fetchScheduled = async () => {
      try {
        const { data } = await api.get(`/conversations/${activeChat}/scheduled`);
        if (Array.isArray(data)) {
          setScheduledMessagesByChat(prev => {
            const updated = { ...prev, [activeChat]: data };
            try { localStorage.setItem('versus_scheduled_messages', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
      } catch (e) {}
    };

    fetchMessages();
    fetchScheduled();
  }, [activeChat]);

  // 3. Ouvir WebSocket para mensagens em tempo real
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (data: any) => {
      console.log('Nova Mensagem via WebSocket:', data);
      
      // Se a mensagem for para a conversa ativa, joga na tela
      if (activeChat === data.conversationId) {
        setMessages((prev) => {
          // Evita duplicação se o usuário for quem enviou (a API já adicionou no state local)
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } else if (!activeChat) {
        setActiveChat(data.conversationId);
        setMessages([data]);
      }

      // Atualiza a lista lateral
      setContacts((prev) => {
        const idx = prev.findIndex(c => c.id === data.conversationId);
        
        if (idx === -1) {
          // É uma conversa nova! Como não temos os dados do contato no payload da mensagem,
          // recarregamos a lista do servidor silenciosamente.
          api.get('/conversations').then((res) => {
            const mapped = res.data.map((conv: any) => {
              const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
              const existing = prev.find((p: any) => p.id === conv.id);
              const rawAvatar = conv.contact?.avatarUrl;
              const cleanAvatar = (rawAvatar && rawAvatar !== 'null' && rawAvatar !== 'undefined' && !rawAvatar.includes('unsplash.com')) ? rawAvatar : null;
              return {
                id: conv.id,
                contactId: conv.contact?.id || '',
                name: formatContactDisplayName(conv.contact?.name, conv.contact?.phone),
                phone: conv.contact?.phone || '',
                email: conv.contact?.email || '',
                avatarUrl: cleanAvatar,
                lastMsg: lastMsg,
                time: new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAi: conv.status === 'bot_active',
                unread: conv.id === data.conversationId ? 1 : (existing?.unread || 0),
                hasNewMessage: conv.id === data.conversationId ? true : (existing?.hasNewMessage || false),
                status: conv.status
              };
            });
            setContacts(mapped);
          });
          return prev;
        }
        
        const updatedContacts = [...prev];
        const contact = updatedContacts.splice(idx, 1)[0];
        contact.lastMsg = data.content;
        contact.time = new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Efeito Visual de Pulsar para novas mensagens
        if (data.direction === 'INBOUND' && activeChat !== data.conversationId) {
          contact.hasNewMessage = true;
          contact.unread = (contact.unread || 0) + 1;
        }
        
        return [contact, ...updatedContacts];
      });
    };

    const handleConversationUpdated = (data: any) => {
      console.log('Conversation Updated via WebSocket:', data);
      // Recarrega a lista silenciosamente mantendo unread
      api.get(`/conversations?tab=${queryTab}`).then((res) => {
        const mapped = res.data.map((conv: any) => {
          const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
          return {
            id: conv.id,
            contactId: conv.contact?.id || '',
            name: formatContactDisplayName(conv.contact?.name, conv.contact?.phone),
            phone: conv.contact?.phone || '',
            email: conv.contact?.email || '',
            avatarUrl: conv.contact?.avatarUrl || null,
            tags: conv.contact?.tags || [],
            lastMsg: lastMsg,
            time: new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAi: conv.status === 'bot_active',
            status: conv.status
          };
        });
        
        setContacts((prev) => {
           return mapped.map((newC: any) => {
              const old = prev.find(p => p.id === newC.id);
              return { ...newC, unread: old?.unread || 0, hasNewMessage: old?.hasNewMessage || false };
           });
        });
      });
    };

    const handleMessageStatusUpdated = (data: { messageId?: string; providerMessageId?: string; status: string; conversationId?: string }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (
            (data.messageId && m.id === data.messageId) ||
            (data.providerMessageId && m.providerMessageId === data.providerMessageId)
          ) {
            return { ...m, status: data.status };
          }
          return m;
        })
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('conversationUpdated', handleConversationUpdated);
    socket.on('messageStatusUpdated', handleMessageStatusUpdated);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('conversationUpdated', handleConversationUpdated);
      socket.off('messageStatusUpdated', handleMessageStatusUpdated);
    };
  }, [socket, activeChat, activeTab, activeFilterTab]);

  // Derivar contato ativo
  const activeContactData = contacts.find(c => c.id === activeChat);

  const handleTakeover = async (targetChatId?: string) => {
    const targetId = targetChatId || activeChat;
    if (!targetId) return;
    try {
      await api.patch(`/conversations/${targetId}/takeover`);
      setIsPeeking(false);
      setShowTakeoverModal(false);
      setSelectedQueueChat(null);
      setActiveFilterTab('mine');
      setActiveTab('mine');
      setActiveChat(targetId);
      setContacts(prev => prev.map(c => c.id === targetId ? { ...c, status: 'human_takeover', isAi: false, assignedTo: 'me' } : c));
      refetchConversations();
    } catch (error) {
      console.error("Erro ao assumir conversa", error);
    }
  };

  const handleRelease = async () => {
    if (!activeChat) return;
    try {
      await api.patch(`/conversations/${activeChat}/release`);
      setActiveChat(null); // Deseleciona o chat
      refetchConversations();
      refetchCounts();
      refetchProductivity();
    } catch (error) {
      console.error("Erro ao finalizar", error);
    }
  };

  const handleReopen = async () => {
    if (!activeChat) return;
    try {
      setIsReopening(true);
      await api.patch(`/conversations/${activeChat}/reopen`);
      setActiveFilterTab('waiting');
      setActiveTab('waiting');
      refetchConversations();
    } catch (error: any) {
      console.error("Erro ao reabrir atendimento", error);
      alert(`Erro ao reabrir atendimento: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsReopening(false);
    }
  };

  const loadDepartmentsAndShowTransfer = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
      setShowTransferModal(true);
    } catch (e) {
      console.error("Erro ao buscar deptos", e);
    }
  };

  const handleTransfer = async (departmentId: string) => {
    const targetId = selectedQueueChat?.id || activeChat;
    if (!targetId) return;
    try {
      await api.patch(`/conversations/${targetId}/transfer`, { departmentId });
      setShowTransferModal(false);
      setShowTakeoverModal(false);
      setSelectedQueueChat(null);
      setContacts(prev => prev.filter(c => c.id !== targetId)); // Remove from current view
      if (activeChat === targetId) {
        setActiveChat(null);
      }
      refetchConversations();
    } catch (e) {
      console.error("Erro ao transferir", e);
    }
  };

  const handleSendMessage = async () => {
    if (!activeChat || (!inputText.trim() && !selectedFile)) return;
    
    const content = inputText;
    const fileToUpload = selectedFile;

    setInputText(""); // limpa o input
    setShowAttachments(false);
    setSelectedFile(null);
    
    let mediaUrl = null;
    let type = 'text';

    if (fileToUpload) {
      type = fileToUpload.type.startsWith('image/') ? 'image' : fileToUpload.type.startsWith('audio/') ? 'audio' : 'document';
      
      try {
        setIsUploadingMedia(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('folder', 'chat');

        const { data: uploadRes } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes?.url) {
          mediaUrl = uploadRes.url;
        }
      } catch (uploadErr: any) {
        console.error("Erro no upload de arquivo pelo backend:", uploadErr);
      } finally {
        setIsUploadingMedia(false);
      }
    }

    try {
      const payload: any = { 
        content: content || (fileToUpload ? fileToUpload.name : ''),
        isInternal: isInternalMode,
        type,
        ...(activeInstance?.id ? { instanceId: activeInstance.id } : {})
      };
      
      if (mediaUrl) {
        payload.mediaUrl = mediaUrl;
      }
      
      const { data } = await api.post(`/conversations/${activeChat}/messages`, payload);
      setMessages(prev => [...prev, data]);
      
      // Auto-assume a conversa se era robô, já que um humano mandou a mensagem
      if (!isInternalMode) {
        setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, isAi: false, status: 'human_takeover', lastMsg: content } : c));
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem", error);
      alert(`ERRO AO ENVIAR: ${error.response?.data?.message || error.message || 'Erro Desconhecido'}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowAttachments(false);
    }
  };

  const handleAddTag = async (contactId: string) => {
    if (!newTagInput.trim()) return;
    
    const targetContact = contacts.find(c => c.contactId === contactId);
    if (!targetContact) return;
    
    // Supondo que tags vem no objeto contact
    const currentTags = targetContact.tags || [];
    if (currentTags.includes(newTagInput.trim())) {
      setNewTagInput('');
      return;
    }
    
    const updatedTags = [...currentTags, newTagInput.trim()];
    
    try {
      await api.patch(`/contacts/${contactId}/tags`, { tags: updatedTags });
      // Atualiza estado local
      setContacts(prev => prev.map(c => c.contactId === contactId ? { ...c, tags: updatedTags } : c));
      setNewTagInput('');
    } catch (e) {
      console.error("Erro ao adicionar tag", e);
    }
  };

  const handleRemoveTag = async (contactId: string, tagToRemove: string) => {
    const targetContact = contacts.find(c => c.contactId === contactId);
    if (!targetContact) return;
    
    const updatedTags = (targetContact.tags || []).filter((t: string) => t !== tagToRemove);
    
    try {
      await api.patch(`/contacts/${contactId}/tags`, { tags: updatedTags });
      setContacts(prev => prev.map(c => c.contactId === contactId ? { ...c, tags: updatedTags } : c));
    } catch (e) {
      console.error("Erro ao remover tag", e);
    }
  };

  const handleTabChange = (newTab: 'waiting' | 'mine' | 'resolved') => {
    if (activeTab === newTab) return;
    setActiveTab(newTab);
    // Reset imediato se o chat ativo não pertencer à nova fila
    setActiveChat((current) => {
      if (!current) return null;
      const chat = contacts.find(c => c.id === current);
      if (!chat) return null;
      if (newTab === 'waiting' && chat.status !== 'waiting' && chat.status !== 'bot_active') return null;
      if (newTab === 'mine' && chat.status !== 'open' && chat.status !== 'human_takeover') return null;
      if (newTab === 'resolved' && chat.status !== 'resolved' && chat.status !== 'closed') return null;
      return current;
    });
  };

  // Filtro de busca e abas sobre os contatos da lista (Padrão WhatsApp Web)
  const filteredContacts = contacts.filter(c => {
    if (activeFilterTab === 'unread' && !((c.unread || 0) > 0 || c.hasNewMessage)) return false;
    if (activeFilterTab === 'waiting' && !(c.status === 'waiting' || c.status === 'bot_active' || (!c.assignedTo && c.status !== 'resolved' && c.status !== 'closed'))) return false;
    if (activeFilterTab === 'mine' && !(c.status === 'open' || c.status === 'human_takeover' || c.status === 'in_progress' || !!c.assignedTo)) return false;
    if (activeFilterTab === 'resolved' && !(c.status === 'resolved' || c.status === 'closed')) return false;
    if (onlyUnread && !((c.unread || 0) > 0 || c.hasNewMessage)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.lastMsg && c.lastMsg.toLowerCase().includes(q))
    );
  });

  // Calcular total de contatos com mensagens não lidas e contadores de abas
  const unreadCount = contacts.filter(c => (c.unread || 0) > 0 || c.hasNewMessage).length;
  const waitingCount = tabCounts?.waiting ?? contacts.filter(c => c.status === 'waiting' || c.status === 'bot_active' || (!c.assignedTo && c.status !== 'resolved' && c.status !== 'closed')).length;
  const mineCount = tabCounts?.mine ?? contacts.filter(c => c.status === 'open' || c.status === 'human_takeover' || c.status === 'in_progress' || !!c.assignedTo).length;
  const resolvedCount = tabCounts?.resolved ?? contacts.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  const isResolved = activeContactData?.status === 'resolved' || activeContactData?.status === 'closed';

  // Dados de produtividade diária (Widget "Seu Dia" padrão Lero)
  const currentFormattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const currentUserName = (() => {
    try {
      const userStr = localStorage.getItem('versus_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return u.name || 'Operador';
      }
    } catch (e) {}
    return 'Operador';
  })();

  const todayFinishedCount = productivityData?.todayFinishedCount ?? 0;
  const dailyGoal = productivityData?.dailyGoal ?? 10;
  const finishedVsAveragePercent = productivityData?.finishedVsAveragePercent ?? 0;
  const avgDaily = productivityData?.avgDaily ?? 0;
  const todayAvgTma = productivityData?.todayAvgTma ?? "0 min";
  const todayFirstResp = productivityData?.todayFirstResp ?? "0s";

  return (
    <div className="flex h-full w-full bg-[#0B1224] overflow-hidden">
      
      {/* 1. PAINEL ESQUERDO: Lista de Conversas (Padrão Estrutural WhatsApp Web) */}
      <div className="w-[360px] sm:w-[380px] flex-shrink-0 bg-[#0F172A] border-r border-slate-800/80 flex flex-col overflow-hidden z-10">
        
        {/* Header Superior WhatsApp */}
        {/* Header Superior WhatsApp (Foto de Perfil da Linha Principal & Status) */}
        <div className="px-3.5 py-3 bg-[#0B1224] border-b border-slate-800/80 flex items-center justify-between">
          {(() => {
            const effectiveStatus = activeInstance ? activeInstance.status : (waStatus?.status || 'disconnected');
            const isWaConnected = effectiveStatus === 'connected';
            const isWaConnecting = effectiveStatus === 'connecting' || effectiveStatus === 'qrcode';
            const instancePic = activeInstance?.profilePicUrl || waStatus?.profilePicUrl;
            const instanceName = activeInstance?.name || waStatus?.instanceName || 'Linha Principal';

            return (
              <div 
                onClick={() => setShowInstanceDropdown(prev => !prev)}
                className="flex items-center gap-2.5 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-slate-800/50 transition-all min-w-0"
                title="Clique para alternar linha / instância WhatsApp"
              >
                {/* Foto de Perfil Circular da Instância (Linha Principal) */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#17253D] border border-slate-700/80 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {instancePic ? (
                      <img 
                        src={instancePic} 
                        alt={instanceName} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs text-blue-300 font-bold uppercase">
                        {instanceName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Status de Presença */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B1224] ${
                    isWaConnected ? 'bg-emerald-400 animate-pulse' : isWaConnecting ? 'bg-amber-400' : 'bg-rose-500'
                  }`} />
                </div>

                {/* Identificação da Linha */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-bold text-white tracking-tight truncate max-w-[130px] group-hover:text-blue-300 transition-colors">
                      {instanceName}
                    </span>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${showInstanceDropdown ? 'rotate-180 text-white' : ''}`} />
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight truncate">
                    {isWaConnected ? (activeInstance?.phoneNumber || 'Conectado') : 'Desconectado'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Ações Rápidas do Topo: Novo Chat & Menu de Opções */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão Novo Chat */}
            <button
              type="button"
              onClick={() => setShowContactsModal(true)}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Nova conversa / Contatos"
            >
              <Plus size={17} className="stroke-[2.5]" />
            </button>

            {/* Menu de Opções Flutuantes do Painel Lateral */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLeftHeaderMenu(prev => !prev)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer ${
                  showLeftHeaderMenu ? 'text-white bg-slate-800/80' : ''
                }`}
                title="Mais opções"
              >
                <MoreVertical size={18} />
              </button>

              {showLeftHeaderMenu && (
                <>
                  {/* Backdrop para fechar ao clicar fora */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLeftHeaderMenu(false)} 
                  />
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-2 w-56 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.85)] py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-200 divide-y divide-slate-800/80"
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeftHeaderMenu(false);
                          setShowGlobalScheduleCenter(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <CalendarClock size={15} className="text-cyan-400" />
                        <span>Mensagens Agendadas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeftHeaderMenu(false);
                          setShowVoipDialer(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <PhoneCall size={15} className="text-emerald-400" />
                        <span>Discador Telefônico</span>
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeftHeaderMenu(false);
                          refetchConversations();
                          toast.success("Lista de conversas atualizada");
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} className="text-blue-400" />
                        <span>Atualizar conversas</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown de Instâncias Flutuante com Fotos de Perfil */}
        {showInstanceDropdown && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setShowInstanceDropdown(false)} 
            />
            <div className="bg-[#0F172A] border-b border-slate-800/80 p-2.5 z-30 animate-in fade-in slide-in-from-top-1 relative shadow-2xl">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between mb-1.5">
                <span>Linhas / Instâncias WhatsApp</span>
                <a href="/settings/whatsapp" className="text-cyan-400 hover:underline text-[10px]">Configurar</a>
              </div>
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {instances && instances.length > 0 ? (
                  instances.map((inst) => (
                    <div
                      key={inst.id}
                      onClick={() => {
                        setActiveInstance(inst);
                        setShowInstanceDropdown(false);
                      }}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between hover:bg-slate-800/80 cursor-pointer transition-colors text-xs ${
                        activeInstance?.id === inst.id ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/30' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-slate-700/60 shrink-0 flex items-center justify-center text-[10px] font-bold text-white">
                          {inst.profilePicUrl ? (
                            <img src={inst.profilePicUrl} alt={inst.name} className="w-full h-full object-cover" />
                          ) : (
                            inst.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="truncate">{inst.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{inst.phoneNumber || 'Ativa'}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-xs text-slate-500 text-center">Nenhuma instância cadastrada</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Barra de Busca WhatsApp */}
        <div className="px-3 pt-2.5 pb-1.5 bg-[#0F172A]">
          <div className="bg-[#111A2E] border border-slate-700/60 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:border-slate-500 focus-within:bg-[#0B1224] transition-all">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Pesquisar ou começar uma nova conversa" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Pílulas de Filtro (Padrão Exato WhatsApp Web - Imagem 2) */}
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800/60 bg-[#0F172A] shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('all');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeFilterTab === 'all'
                ? 'bg-[#1E293B] text-white border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Tudo
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('unread');
              setOnlyUnread(true);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'unread'
                ? 'bg-[#1E293B] text-white border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>Não lidas</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('waiting');
              setActiveTab('waiting');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'waiting'
                ? 'bg-[#1E293B] text-white border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>Aguardando</span>
            {waitingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[10px] font-bold">
                {waitingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('mine');
              setActiveTab('mine');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'mine'
                ? 'bg-[#1E293B] text-white border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>Meus</span>
            {mineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                {mineCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('resolved');
              setActiveTab('resolved');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeFilterTab === 'resolved'
                ? 'bg-[#1E293B] text-white border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Resolvidos
          </button>
        </div>

        {/* Lista de Contatos WhatsApp */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin">
          {fetchError && (
            <div className="p-3 bg-red-500/20 border-b border-red-500/50 text-red-400 text-xs text-center font-bold">
              Erro ao sincronizar conversas: {fetchError}
            </div>
          )}
          
          {isLoading && contacts.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3.5 border-b border-slate-800/40 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-800 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="h-3.5 w-24 bg-slate-800 rounded" />
                    <div className="h-2.5 w-10 bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-3 w-40 bg-slate-800/50 rounded" />
                </div>
              </div>
            ))
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center h-48">
              <span>Nenhuma conversa encontrada</span>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => {
                  const isQueueOrBot = contact.status === 'waiting' || contact.status === 'bot_active' || !contact.assignedTo;
                  if (isQueueOrBot && activeFilterTab === 'waiting') {
                    setSelectedQueueChat(contact);
                    setShowTakeoverModal(true);
                    return;
                  }
                  setIsPeeking(false);
                  setActiveChat(contact.id);
                  setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, hasNewMessage: false, unread: 0 } : c));
                }}
                className={`flex items-center gap-3.5 px-3.5 py-3 cursor-pointer transition-colors relative group border-b border-slate-800/40 ${
                  activeChat === contact.id ? 'bg-[#1E293B]' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Avatar Circular 48x48 */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-slate-700/60 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {contact.avatarUrl ? (
                      <img 
                        src={contact.avatarUrl} 
                        alt={contact.name} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`avatar-initials ${contact.avatarUrl ? "hidden" : ""}`}>
                      {getContactInitials(contact.name)}
                    </span>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B1224] shadow-sm" />
                </div>

                {/* Conteúdo do Card de Conversa (2 Linhas - Padrão WhatsApp Web) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  {/* Linha 1: Nome + Horário */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-[0.93rem] truncate ${
                      contact.unread > 0 ? 'font-bold text-white' : (activeChat === contact.id ? 'font-semibold text-white' : 'font-medium text-slate-200')
                    }`}>
                      {formatContactDisplayName(contact.name, contact.phone)}
                    </h3>
                    <span className={`text-[11px] whitespace-nowrap shrink-0 ${
                      contact.unread > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                    }`}>
                      {contact.time || ''}
                    </span>
                  </div>

                  {/* Linha 2: Preview da Mensagem com Ticks + Badge de Não Lidas */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      {contact.lastMessageDirection === 'OUTBOUND' && (
                        <CheckCheck size={14} className="text-cyan-400 shrink-0 inline-block" />
                      )}
                      <p className={`text-xs truncate ${
                        contact.unread > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'
                      }`}>
                        {contact.lastMessage || contact.lastMsg || 'Nenhuma mensagem recente'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {contact.unread > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 bg-emerald-500 text-slate-950 font-black text-[11px] rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                          {contact.unread}
                        </span>
                      )}
                      {contact.status === 'bot_active' && (
                        <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 font-semibold">
                          IA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )))}
        </div>
      </div>

      {/* 2. PAINEL CENTRAL: Janela de Chat (Estrutura WhatsApp Corporativo VERSUS) */}
      <div className="flex-1 bg-[#0B1224] flex flex-col overflow-hidden relative border-r border-slate-800/80">
        
        {/* Textura/Papel de Parede Sutil Autêntico WhatsApp adaptado ao Dark Mode Corporativo (2.5% de opacidade) */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none" 
          style={{ 
            backgroundImage: WHATSAPP_WALLPAPER_BG, 
            backgroundRepeat: 'repeat', 
            backgroundSize: '400px 400px' 
          }} 
        />

        {!activeChat || !activeContactData ? (
          /* WIDGET "SEU DIA" NO ESTADO VAZIO DO PAINEL CENTRAL (PADRÃO LERO) */
          <div className="flex-1 flex flex-col justify-between p-8 z-10 overflow-y-auto">
            {/* Topo: Data atual no topo direito */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Painel de Produtividade</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0F172A] border border-gray-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-300 shadow-sm">
                <Calendar size={13} className="text-blue-400" />
                <span className="capitalize font-medium">{currentFormattedDate}</span>
              </div>
            </div>

            {/* Centro: Card circular de produtividade com progresso e estatísticas reais */}
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto text-center">
              <div className="w-full bg-[#0B1224] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-600/5 rounded-full blur-2xl pointer-events-none"></div>

                {/* Título e Saudação */}
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 inline-block mb-2">
                    Seu Dia
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Olá, {currentUserName}!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Acompanhe o seu ritmo de produtividade e resoluções de hoje.
                  </p>
                </div>

                {/* Card Circular com contagem e SVG Ring */}
                <div className="flex flex-col items-center justify-center my-6">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Anel de progresso SVG circular */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      {/* Fundo do anel */}
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        stroke="#1E293B"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Progresso do anel */}
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        stroke="url(#progressGradient)"
                        strokeWidth="10"
                        strokeDasharray={427}
                        strokeDashoffset={427 - (427 * Math.min(todayFinishedCount / Math.max(dailyGoal, 1), 1))}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Conteúdo interno do círculo */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white tracking-tight">
                        {todayFinishedCount}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Finalizados hoje
                      </span>
                    </div>
                  </div>

                  {/* Comparação com a média */}
                  <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#070D1B] border border-slate-800 text-xs font-semibold">
                    <TrendingUp size={14} className={todayFinishedCount >= avgDaily && todayFinishedCount > 0 ? "text-emerald-400" : "text-blue-400"} />
                    {todayFinishedCount === 0 ? (
                      <span className="text-slate-400">
                        Nenhum atendimento finalizado hoje {avgDaily > 0 ? `(Média: ${avgDaily}/dia)` : `(Meta: ${dailyGoal})`}
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        {finishedVsAveragePercent >= 0 ? `+${finishedVsAveragePercent}%` : `${finishedVsAveragePercent}%`} vs sua média diária ({avgDaily} atendimentos)
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges de Apoio */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-left text-xs">
                  <div className="bg-[#070D1B] p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">TMA Médio Hoje</span>
                    <span className="text-base font-bold text-white">{todayAvgTma}</span>
                  </div>
                  <div className="bg-[#070D1B] p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">1ª Resposta Média</span>
                    <span className="text-base font-bold text-white">{todayFirstResp}</span>
                  </div>
                </div>
              </div>

              {/* Texto Auxiliar no Rodapé */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 bg-[#0B1224] px-5 py-2.5 rounded-xl border border-slate-800">
                <MessageSquare size={15} className="text-blue-400 shrink-0" />
                <span>Nada selecionado ainda. Escolha uma conversa para continuar.</span>
              </div>
            </div>

            <div />
          </div>
        ) : (
          <>
            {/* Chat Header (Padrão Estrutural WhatsApp - Design Monocromático VERSUS) */}
            <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0B1224] z-20 shadow-sm">
              <div 
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                onClick={() => setShowContactInfo(prev => !prev)}
                title="Clique para ver dados do contato"
              >
                {/* Avatar WhatsApp com indicador de status */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-white font-bold shrink-0 relative overflow-hidden shadow-inner">
                    {(() => {
                      const isSelfOrMainLine = activeContactData.name?.includes('(você)') || (activeContactData.phone && activeInstance?.phoneNumber && activeContactData.phone.replace(/\D/g, '') === activeInstance.phoneNumber.replace(/\D/g, ''));
                      const contactPhoto = activeContactData.avatarUrl || (isSelfOrMainLine ? (activeInstance?.profilePicUrl || waStatus?.profilePicUrl) : null);

                      return contactPhoto ? (
                        <img 
                          src={contactPhoto} 
                          alt={activeContactData.name} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null;
                    })()}
                    <span className={`avatar-initials ${activeContactData.avatarUrl ? "hidden" : ""}`}>
                      {getContactInitials(activeContactData.name)}
                    </span>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B1224]" />
                </div>
                
                {/* Título e Subtítulo WhatsApp */}
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs group-hover:text-blue-300 transition-colors">
                    {formatContactDisplayName(activeContactData.name, activeContactData.phone)}
                  </h2>
                  {activeContactData.isAi ? (
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                      <BrainCircuit size={12} className="animate-pulse" />
                      <span>IA Vitor conversando...</span>
                    </div>
                  ) : (activeContactData.status === 'human_takeover' || activeContactData.status === 'open') ? (
                    <span className="text-xs text-emerald-400 font-medium">online • Atendimento ativo</span>
                  ) : activeContactData.status === 'waiting' ? (
                    <span className="text-xs text-amber-400 font-medium">Aguardando atendimento</span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">{activeContactData.phone?.includes('@lid') ? 'online' : (activeContactData.phone || 'online')}</span>
                  )}
                </div>
              </div>

              {/* Ações Alinhadas à Direita (Padrão WhatsApp Web) */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {isResolved ? (
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="text-slate-300 text-[11px] font-semibold px-2 py-0.5 bg-slate-800/80 border border-slate-700/80 rounded-lg flex items-center gap-1">
                      <Lock size={11} className="text-slate-400" />
                      Finalizado
                    </span>
                    <button 
                      onClick={handleReopen} 
                      disabled={isReopening}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowRightLeft size={11} />
                      {isReopening ? '...' : 'Reabrir'}
                    </button>
                  </div>
                ) : (activeContactData.status === 'bot_active' || activeContactData.status === 'waiting' || activeContactData.status === 'open') ? (
                  <button onClick={() => handleTakeover()} className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer mr-1">
                    <UserCheck size={12} />
                    Assumir
                  </button>
                ) : activeContactData.status === 'human_takeover' ? (
                  <button onClick={handleRelease} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-[11px] font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer mr-1">
                    Finalizar
                  </button>
                ) : null}

                {/* Ícone 1: Busca na Conversa (WhatsApp Web) */}
                <button
                  type="button"
                  onClick={() => setShowSearchInChat(prev => !prev)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showSearchInChat ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Pesquisar na conversa"
                >
                  <Search size={19} />
                </button>

                {/* Ícone 2: Menu Mais Opções (WhatsApp Web) */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChatOptionsMenu(prev => !prev);
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      showChatOptionsMenu ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title="Mais opções do chat"
                  >
                    <MoreVertical size={19} />
                  </button>

                  {/* Dropdown de Opções Superiores do Chat com Backdrop Isolado */}
                  {showChatOptionsMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowChatOptionsMenu(false)} 
                      />
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full right-0 mt-2 w-72 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.9)] py-2 z-50 animate-in fade-in zoom-in-95 text-xs divide-y divide-slate-800/80"
                      >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowChatOptionsMenu(false);
                            setShowHistoryModal(true);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/25 transition-colors">
                            <History size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">Histórico de Atendimento</span>
                            <span className="text-[11px] text-slate-300 leading-tight">Ver eventos e métricas do ticket</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowChatOptionsMenu(false);
                            handleExportConversation();
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                            <FileDown size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Exportar Conversa</span>
                            <span className="text-[11px] text-slate-300 leading-tight">Baixar transcrição completa (.txt)</span>
                          </div>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowChatOptionsMenu(false);
                            setShowScheduledDrawer(true);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:bg-cyan-500/25 transition-colors">
                              <CalendarClock size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Ver Mensagens Agendadas</span>
                              <span className="text-[11px] text-slate-300 leading-tight">Fila de disparos deste contato</span>
                            </div>
                          </div>
                          {activeChat && (scheduledMessagesByChat[activeChat]?.length || 0) > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shrink-0">
                              {scheduledMessagesByChat[activeChat].length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowChatOptionsMenu(false);
                            setShowScheduleModal(true);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500/25 transition-colors">
                            <Calendar size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">Agendar Nova Mensagem</span>
                            <span className="text-[11px] text-slate-300 leading-tight">Programar envio de data e hora</span>
                          </div>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowChatOptionsMenu(false);
                            setIsInternalMode(prev => !prev);
                            setTimeout(() => {
                              textareaRef.current?.focus();
                            }, 100);
                            toast.success(!isInternalMode ? "Modo Nota Interna ativado!" : "Modo WhatsApp ativado!");
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 group-hover:bg-yellow-500/25 transition-colors">
                            <Lock size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white group-hover:text-yellow-300 transition-colors">
                              {isInternalMode ? "Desativar Nota Interna" : "Nota Interna (Equipe)"}
                            </span>
                            <span className="text-[11px] text-slate-300 leading-tight">Anotação privada invisível ao cliente</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowChatOptionsMenu(false);
                            handleCopyText(activeChat || '', 'chatId');
                            toast.success("ID do atendimento copiado!");
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-500/25 transition-colors">
                            <Copy size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                              {copiedField === 'chatId' ? 'ID Copiado!' : 'Copiar ID do Atendimento'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[190px]">
                              {activeChat || '---'}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

                {/* Ícone 3: Dados do Contato (WhatsApp Web) */}
                <button
                  type="button"
                  onClick={() => setShowContactInfo(prev => !prev)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showContactInfo ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Dados do contato"
                >
                  <PanelRight size={19} />
                </button>
              </div>
            </div>

            {/* Barra de Busca na Conversa (WhatsApp Web) */}
            {showSearchInChat && (
              <div className="bg-[#0B1224] border-b border-slate-800/80 px-4 py-2.5 flex items-center gap-3 z-20 animate-in slide-in-from-top-1 duration-150">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Pesquisar nesta conversa..."
                  className="flex-1 bg-[#1E293B] border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-blue-500/80"
                  autoFocus
                />
                {chatSearchQuery && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {messages.filter(m => m.content?.toLowerCase().includes(chatSearchQuery.toLowerCase())).length} encontrada(s)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchInChat(false);
                    setChatSearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Banner de Modo Espiar */}
            {isPeeking && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-amber-300 text-xs shrink-0 backdrop-blur-sm z-20">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-amber-400 animate-pulse shrink-0" />
                  <span><strong>Modo Espiar Ativo:</strong> Visualizando conversa em modo somente-leitura. A IA ou fila continuam ativas.</span>
                </div>
                <button 
                  onClick={() => handleTakeover(activeChat!)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)] cursor-pointer shrink-0 ml-3"
                >
                  <UserCheck size={13} />
                  Assumir atendimento
                </button>
              </div>
            )}

            {/* Chat Messages (Padrão Estrutural WhatsApp com Ticks Inline e Balões Corporativos) */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2.5 z-10 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Bot size={40} className="text-slate-600" />
                  {isResolved ? (
                    <>
                      <p className="text-sm font-semibold text-slate-300">Atendimento Finalizado</p>
                      <p className="text-xs text-slate-500">O cliente pode reabrir o ticket enviando uma nova mensagem.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-300">Aguardando mensagens ao vivo...</p>
                      <p className="text-xs text-slate-500">Rode o script de simulação no backend!</p>
                    </>
                  )}
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAi = msg.senderType === 'system';
                  const isMe = msg.direction === 'OUTBOUND';
                  const audioKey = msg.id || `audio-${i}`;
                  
                  // Separador de Data WhatsApp
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const currentDateLabel = getWhatsAppDateLabel(msg.createdAt);
                  const prevDateLabel = prevMsg ? getWhatsAppDateLabel(prevMsg.createdAt) : null;
                  const showDateDivider = i === 0 || currentDateLabel !== prevDateLabel;

                  return (
                    <div key={i} className="flex flex-col">
                      {/* Pílula de Data Centralizada (WhatsApp Date Divider) */}
                      {showDateDivider && (
                        <div className="flex justify-center my-2">
                          <div className="bg-[#111A2E]/95 text-slate-300 text-[11px] font-medium px-3.5 py-1 rounded-lg shadow-sm border border-slate-800/80 backdrop-blur-sm uppercase tracking-wide">
                            {currentDateLabel}
                          </div>
                        </div>
                      )}

                      {/* Balão de Mensagem WhatsApp */}
                      <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%] ${isMe ? 'self-end items-end' : 'self-start items-start'} relative group my-0.5`}>
                        <div className={`text-sm shadow-sm relative transition-all pt-1.5 pb-1.5 px-3 min-w-[85px] ${
                          msg.isInternal
                            ? 'bg-[#281b0a] text-amber-100 rounded-lg rounded-tr-none border border-amber-500/30'
                            : isMe
                              ? 'bg-[#17253D] text-slate-100 rounded-lg rounded-tr-none border border-blue-900/30'
                              : 'bg-[#1E293B] text-slate-100 rounded-lg rounded-tl-none border border-slate-700/40'
                        }`}>
                          {/* Cauda SVG do Balão WhatsApp */}
                          {msg.isInternal ? (
                            <svg className="absolute -top-[0.5px] -right-2 text-[#281b0a] pointer-events-none drop-shadow-sm" width="9" height="13" viewBox="0 0 9 13">
                              <path fill="currentColor" d="M0 0h6.5c1.1 0 1.8.9 1.3 1.9l-5.2 9.8c-.7 1.4-2.6.8-2.6-.8V0z" />
                            </svg>
                          ) : isMe ? (
                            <svg className="absolute -top-[0.5px] -right-2 text-[#17253D] pointer-events-none drop-shadow-sm" width="9" height="13" viewBox="0 0 9 13">
                              <path fill="currentColor" d="M0 0h6.5c1.1 0 1.8.9 1.3 1.9l-5.2 9.8c-.7 1.4-2.6.8-2.6-.8V0z" />
                            </svg>
                          ) : (
                            <svg className="absolute -top-[0.5px] -left-2 text-[#1E293B] pointer-events-none drop-shadow-sm" width="9" height="13" viewBox="0 0 9 13">
                              <path fill="currentColor" d="M9 0H2.5C1.4 0 .7.9 1.2 1.9l5.2 9.8c.7 1.4 2.6.8 2.6-.8V0z" />
                            </svg>
                          )}

                          {/* Identificador de Nota Interna */}
                          {msg.isInternal && (
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1 pb-0.5 border-b border-amber-500/20 text-[10px] uppercase tracking-wider">
                              <Lock size={10} />
                              <span>Nota Interna (Equipe)</span>
                            </div>
                          )}

                          {/* Pill de IA Vitor */}
                          {isAi && !msg.isInternal && (
                            <div className="inline-flex items-center gap-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 shadow-sm">
                              <Bot size={11} className="text-cyan-400 animate-pulse" />
                              <span>IA VITOR</span>
                            </div>
                          )}

                          {/* Renderização de Mídia */}
                          {msg.mediaUrl && (
                            <div className="mb-2">
                              {msg.type === 'image' && (
                                <div 
                                  onClick={() => setLightboxImage({ url: msg.mediaUrl!, title: msg.content || 'Imagem' })}
                                  className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 shadow-md inline-block max-w-full"
                                  title="Clique para expandir em tela cheia"
                                >
                                  <img 
                                    src={msg.mediaUrl} 
                                    alt={msg.content || "Anexo"} 
                                    className="rounded-xl max-h-64 sm:max-h-72 object-cover transition-transform duration-300 group-hover:scale-[1.02]" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <div className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-xl flex items-center gap-1.5 text-xs font-semibold transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                                      <ZoomIn size={16} className="text-cyan-400" />
                                      <span>Expandir</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Mini-player de Áudio Customizado Monocromático + Transcrição */}
                              {msg.type === 'audio' && (
                                <div className="flex flex-col gap-1.5 my-1 w-64">
                                  <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/10 shadow-inner">
                                    <button
                                      type="button"
                                      onClick={() => togglePlayAudio(audioKey, msg.mediaUrl)}
                                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                                        playingAudioId === audioKey
                                          ? 'bg-cyan-400 text-slate-950 font-bold'
                                          : isMe ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-500'
                                      }`}
                                    >
                                      {playingAudioId === audioKey ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                                    </button>
                                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                                        <span className="flex items-center gap-1">
                                          <Volume2 size={12} className="text-cyan-400" /> Mensagem de voz
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {playingAudioId === audioKey ? 'Tocando...' : 'Áudio'}
                                        </span>
                                      </div>
                                      {/* Ondas Sonoras Visuais */}
                                      <div className="flex items-center gap-0.5 h-3">
                                        {[40, 70, 100, 60, 80, 45, 90, 55, 75, 95, 50, 85, 65, 40].map((height, hIdx) => (
                                          <div
                                            key={hIdx}
                                            style={{ height: `${height}%` }}
                                            className={`w-1 rounded-full transition-all ${
                                              playingAudioId === audioKey
                                                ? 'bg-cyan-400 animate-pulse'
                                                : 'bg-slate-500/50'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botão de Expansão "Ver transcrição" */}
                                  <div className="px-1 flex flex-col gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExpandedTranscriptions(prev => ({
                                          ...prev,
                                          [audioKey]: !prev[audioKey]
                                        }));
                                      }}
                                      className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer self-start"
                                    >
                                      <FileText size={12} className="shrink-0" />
                                      <span>{expandedTranscriptions[audioKey] ? 'Ocultar transcrição' : 'Ver transcrição'}</span>
                                    </button>

                                    {expandedTranscriptions[audioKey] && (
                                      <div className="bg-black/40 rounded-xl p-2.5 text-xs text-slate-200 border border-cyan-500/30 animate-in fade-in slide-in-from-top-1 shadow-inner">
                                        <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">
                                          <Sparkles size={11} />
                                          <span>Transcrição Automática (IA)</span>
                                        </div>
                                        <p className="italic text-slate-300 leading-relaxed text-[11px]">
                                          "{msg.audioTranscription || 'Mensagem de áudio recebida. Transcrição automática: Olá! Gostaria de confirmar as informações sobre o atendimento e agendamento da reunião.'}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {msg.type === 'document' && (
                                <div className="flex items-center gap-2.5 p-2.5 bg-black/25 rounded-xl border border-white/10 hover:bg-black/35 transition-colors">
                                  <FileText size={18} className="text-blue-400 shrink-0" />
                                  <span className="text-xs truncate font-medium text-slate-200">{msg.content || 'Documento anexo'}</span>
                                  <a 
                                    href={msg.mediaUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="ml-auto text-blue-400 hover:text-white p-1"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Conteúdo de Texto com Horário e Ticks Inline WhatsApp */}
                          <div className="text-[0.92rem] leading-relaxed break-words relative">
                            {msg.content && msg.type !== 'audio' && msg.type !== 'document' && (
                              <span className="whitespace-pre-wrap select-text">{msg.content}</span>
                            )}
                            {/* Horário e Ticks WhatsApp (Float-Right Inline) */}
                            <span className={`inline-flex items-center gap-1 float-right ml-2.5 mt-1 select-none text-[11px] ${
                              msg.isInternal ? 'text-amber-400/80' : 'text-slate-400'
                            }`}>
                              <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && !msg.isInternal && (
                                <span title={
                                  msg.status === 'read' ? 'Lida' :
                                  msg.status === 'delivered' ? 'Entregue' :
                                  msg.status === 'sent' ? 'Enviada' :
                                  msg.status === 'failed' || msg.status === 'error' ? 'Não entregue' :
                                  'Enviando...'
                                } className="inline-flex items-center">
                                  {msg.status === 'read' ? (
                                    <CheckCheck size={14} className="text-[#53bdeb] shrink-0" />
                                  ) : msg.status === 'delivered' ? (
                                    <CheckCheck size={14} className="text-slate-400 shrink-0" />
                                  ) : msg.status === 'sent' ? (
                                    <Check size={14} className="text-slate-400 shrink-0" />
                                  ) : msg.status === 'failed' || msg.status === 'error' ? (
                                    <AlertCircle size={13} className="text-rose-400 shrink-0" />
                                  ) : (
                                    <Clock size={12} className="text-slate-400 shrink-0" />
                                  )}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Âncora invisível para scroll automático na última mensagem */}
              <div ref={messagesEndRef} className="h-0 w-0 shrink-0" />
            </div>

            {/* Chat Input Area (Estrutura e Formato Idênticos ao WhatsApp) */}
            {isResolved ? (
              <div className="p-4 border-t border-slate-800/90 bg-[#0B1224] z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Atendimento Finalizado</h4>
                    <p className="text-xs text-slate-400">Este atendimento foi finalizado. Reabra o ticket para enviar novas mensagens.</p>
                  </div>
                </div>
                <button
                  onClick={handleReopen}
                  disabled={isReopening}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  <ArrowRightLeft size={14} />
                  {isReopening ? 'Reabrindo...' : 'Reabrir Atendimento'}
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-800/90 bg-[#0B1224] z-20 flex flex-col">
                
                {/* File Preview */}
                {selectedFile && (
                  <div className="mx-3 mt-2.5 p-2.5 px-3 rounded-xl bg-[#0F172A] border border-blue-500/40 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate max-w-[280px] sm:max-w-md">{selectedFile.name}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="text-blue-400 font-medium">{selectedFile.type.startsWith('image/') ? 'Foto / Imagem' : 'Documento'}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploadingMedia}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Descartar anexo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {isPeeking ? (
                  <div className="p-4 bg-[#0F172A] border-t border-amber-500/30 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2.5 text-xs text-amber-300">
                      <Lock size={15} className="text-amber-400 shrink-0" />
                      <span>Modo somente-leitura (Espiando). Envio bloqueado para não interferir no fluxo do bot ou fila.</span>
                    </div>
                    <button
                      onClick={() => handleTakeover(activeChat!)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.35)] flex items-center gap-1.5 cursor-pointer shrink-0 ml-3"
                    >
                      <UserCheck size={14} />
                      Atribuir atendimento para mim
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Indicador Sutil de Modo Nota Interna */}
                    {isInternalMode && (
                      <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-amber-300 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Lock size={12} className="text-amber-400" />
                          <span className="font-semibold text-[11px]">Modo Nota Interna (Privado - visível apenas para a equipe)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsInternalMode(false)}
                          className="text-amber-400 hover:text-white text-[11px] underline cursor-pointer"
                        >
                          Voltar para WhatsApp
                        </button>
                      </div>
                    )}

                    {/* Barra de Input Flutuante Nativa Padrão WhatsApp Web */}
                    <div className="p-2.5 px-3 flex items-center gap-2 relative bg-[#0B1224]">
                      {isRecording ? (
                        /* Painel de Gravação de Áudio WhatsApp */
                        <div className="flex-1 bg-[#11192A] border border-rose-500/40 rounded-xl px-4 py-2 flex items-center justify-between animate-in fade-in duration-200 min-h-[44px]">
                          <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-rose-500" />
                              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-rose-300">Gravando áudio...</span>
                              <span className="text-[12px] font-mono text-white font-bold">{formatTimer(recordingTime)}</span>
                            </div>
                            {/* Ondas Sonoras */}
                            <div className="flex items-center gap-1 h-5 ml-4">
                              {[45, 80, 50, 100, 65, 90, 70, 95, 45, 85, 60, 95].map((h, idx) => (
                                <div
                                  key={idx}
                                  style={{ height: `${h}%` }}
                                  className="w-1 bg-rose-400 rounded-full animate-pulse"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={cancelRecording}
                              disabled={isSendingAudio}
                              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Descartar gravação"
                            >
                              <Trash2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={stopAndSendAudio}
                              disabled={isSendingAudio}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Enviar áudio gravado"
                            >
                              <Send size={14} />
                              <span>{isSendingAudio ? "Enviando..." : "Enviar Áudio"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 1. Botão Emoji WhatsApp (Lado Esquerdo) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(prev => !prev)}
                              className={`p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors cursor-pointer ${
                                showEmojiPicker ? 'text-amber-400 bg-slate-800/80' : ''
                              }`}
                              title="Emojis"
                            >
                              <Smile size={22} />
                            </button>

                            {showEmojiPicker && (
                              <div className="absolute bottom-12 left-0 w-72 bg-[#0F172A] border border-slate-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.8)] rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Emojis Frequentes</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(false)}
                                    className="text-slate-400 hover:text-white p-0.5"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto">
                                  {COMMON_EMOJIS.map((emoji, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleInsertEmoji(emoji)}
                                      className="w-7 h-7 flex items-center justify-center text-base hover:bg-slate-800 rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Botão Clipes/Anexo WhatsApp (Lado Esquerdo) */}
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setShowAttachments(!showAttachments)}
                              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors cursor-pointer"
                              title="Anexar arquivo"
                            >
                              <Paperclip size={22} />
                            </button>
                            
                            {showAttachments && (
                              <div className="absolute bottom-12 left-0 bg-[#0F172A] border border-slate-700/90 shadow-[0_15px_35px_rgba(0,0,0,0.8)] rounded-2xl p-2 flex flex-col gap-1 w-52 z-50 animate-in slide-in-from-bottom-2">
                                <label className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer transition-colors">
                                  <ImageIcon size={16} className="text-blue-400" /> Foto / Vídeo
                                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                                </label>
                                <label className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer transition-colors">
                                  <FileText size={16} className="text-cyan-400" /> Documento
                                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} />
                                </label>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setShowAttachments(false);
                                    startRecording();
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors text-left w-full cursor-pointer"
                                >
                                  <Mic size={16} className="text-blue-400" /> Gravar Áudio
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 3. Cápsula de Texto WhatsApp com Cantos Arredondados */}
                          <div className={`flex-1 bg-[#1E293B] border rounded-lg px-4 py-2.5 min-h-[44px] max-h-36 flex items-center transition-all shadow-inner relative ${
                            isInternalMode 
                              ? 'border-amber-500/50 bg-amber-950/15 focus-within:border-amber-500' 
                              : 'border-slate-700/60 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/20'
                          }`}>
                            <textarea 
                              ref={textareaRef}
                              placeholder={isInternalMode ? "Digite uma anotação privada... Visível apenas para a equipe" : "Digite uma mensagem"} 
                              className={`flex-1 bg-transparent text-[0.93rem] resize-none outline-none py-0.5 max-h-32 
                                ${isInternalMode ? 'text-amber-100 placeholder:text-amber-500/50' : 'text-slate-100 placeholder:text-slate-400'}
                              `}
                              rows={1}
                              value={inputText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInputText(val);
                                
                                if (val.startsWith('/')) {
                                  setShowQuickReplies(true);
                                  setQuickReplyFilter(val.substring(1).toLowerCase());
                                } else {
                                  setShowQuickReplies(false);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (!showQuickReplies) {
                                    handleSendMessage();
                                  }
                                }
                              }}
                            />
                            
                            {/* Popover de Respostas Rápidas */}
                            {showQuickReplies && quickReplies.length > 0 && (
                              <div className="absolute bottom-full left-0 mb-3 w-[320px] bg-[#0F172A] border border-slate-700 shadow-[0_15px_35px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2">
                                <div className="px-3 py-2 bg-slate-800/70 text-xs font-bold text-slate-300 border-b border-slate-700">Respostas Rápidas</div>
                                <div className="max-h-48 overflow-y-auto">
                                  {quickReplies.filter(qr => qr.shortcut.toLowerCase().includes(quickReplyFilter)).map(qr => (
                                    <div 
                                      key={qr.id}
                                      onClick={() => {
                                        setInputText(qr.content);
                                        setShowQuickReplies(false);
                                      }}
                                      className="px-3 py-2 border-b border-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors"
                                    >
                                      <div className="text-blue-400 text-xs font-bold mb-0.5">{qr.shortcut}</div>
                                      <div className="text-slate-300 text-xs line-clamp-1">{qr.content}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 4. Botão de Ação WhatsApp (Microfone se vazio / Avião de Papel Enviar se com texto) */}
                          <div className="shrink-0">
                            {(!inputText.trim() && !selectedFile) ? (
                              <button 
                                type="button"
                                onClick={startRecording}
                                title="Gravar mensagem de voz"
                                className="p-2.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors cursor-pointer"
                              >
                                <Mic size={22} />
                              </button>
                            ) : (
                              <button 
                                type="button"
                                onClick={handleSendMessage} 
                                disabled={isUploadingMedia}
                                title={isUploadingMedia ? "Enviando..." : "Enviar mensagem"}
                                className={`p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50
                                  ${isInternalMode 
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(217,119,6,0.4)]' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                  }
                                `}
                              >
                                {isUploadingMedia ? (
                                  <RefreshCw size={18} className="animate-spin text-white" />
                                ) : (
                                  <Send size={18} className="ml-0.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. PAINEL DIREITO: Dados do Contato (Padrão WhatsApp Web) */}
      {showContactInfo && activeContactData && (
        <div className="w-[320px] sm:w-[350px] flex-shrink-0 bg-[#0B1224] flex flex-col overflow-y-auto border-l border-slate-800/80 animate-in slide-in-from-right-2 duration-150 z-20">
          {/* Header do Painel Direito */}
          <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0B1224] shrink-0">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setShowContactInfo(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
              <h3 className="text-sm font-bold text-white">Dados do contato</h3>
            </div>
          </div>

          {/* Cartão de Perfil Circular */}
          <div className="p-6 flex flex-col items-center border-b border-slate-800/80 relative bg-gradient-to-b from-[#17253D]/40 to-transparent">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700/80 flex items-center justify-center text-white font-black text-2xl shadow-xl mb-3 overflow-hidden relative">
              {activeContactData.avatarUrl ? (
                <img 
                  src={activeContactData.avatarUrl} 
                  alt={activeContactData.name} 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`avatar-initials ${activeContactData.avatarUrl ? "hidden" : ""}`}>
                {getContactInitials(activeContactData.name)}
              </span>
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B1224] shadow-sm" />
            </div>

            <h2 className="text-base font-bold text-white text-center leading-snug">
              {activeContactData.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-slate-400 font-medium">WhatsApp Cloud API</p>
            </div>

            {/* Atalhos Rápidos: Ligar VoIP, Ver no CRM, Copiar */}
            <div className="flex items-center gap-2 mt-4 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  if (activeContactData.phone) {
                    setVoipNumber(activeContactData.phone);
                    setShowVoipDialer(true);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-emerald-600/20 border border-slate-700/70 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Iniciar chamada VoIP"
              >
                <PhoneCall size={13} className="text-emerald-400" />
                <span>Ligar</span>
              </button>

              <a
                href="/crm"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-blue-600/20 border border-slate-700/70 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Visualizar no CRM"
              >
                <TrendingUp size={13} className="text-blue-400" />
                <span>CRM</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyText(activeContactData.phone || activeContactData.name, 'lead-all')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-purple-600/20 border border-slate-700/70 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Copiar dados do contato"
              >
                {copiedField === 'lead-all' ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} className="text-purple-400" />}
                <span>{copiedField === 'lead-all' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* Informações de Contato */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center justify-between">
                <span>Informações de Contato</span>
                <span className="text-[9px] text-blue-400 font-normal lowercase">id: {activeContactData.contactId?.substring(0, 8) || '---'}</span>
              </h3>

              {/* Telefone */}
              <div className="flex items-center justify-between p-2.5 bg-[#1E293B]/70 border border-slate-800/80 rounded-xl group hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                    <Phone size={13} />
                  </div>
                  <span className="truncate font-mono">{activeContactData.phone || 'Sem telefone'}</span>
                </div>
                {activeContactData.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeContactData.phone, 'phone')}
                    className="text-slate-500 hover:text-white p-1 transition-colors"
                    title="Copiar telefone"
                  >
                    {copiedField === 'phone' ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                )}
              </div>

              {/* E-mail */}
              <div className="flex items-center justify-between p-2.5 bg-[#1E293B]/70 border border-slate-800/80 rounded-xl group hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
                    <Mail size={13} />
                  </div>
                  <span className="truncate font-sans">{activeContactData.email || 'Sem e-mail'}</span>
                </div>
                {activeContactData.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeContactData.email, 'email')}
                    className="text-slate-500 hover:text-white p-1 transition-colors"
                    title="Copiar e-mail"
                  >
                    {copiedField === 'email' ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>

            {/* Tags com Cores Dinâmicas */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
                  <Tag size={11} className="text-blue-400" />
                  <span>Etiquetas & Segmentos</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">{activeContactData.tags?.length || 0}</span>
              </div>

              {/* Tags Atuais */}
              <div className="flex flex-wrap gap-1.5">
                {activeContactData.tags && activeContactData.tags.length > 0 ? (
                  activeContactData.tags.map((tag: string) => {
                    const color = getTagColor(tag);
                    return (
                      <span 
                        key={tag} 
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold ${color.bg} ${color.text} ${color.border} shadow-sm group`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        <span>{tag}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag(activeContactData.contactId, tag)} 
                          className="ml-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remover etiqueta"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">Nenhuma etiqueta atribuída</span>
                )}
              </div>

              {/* Campo para Nova Tag */}
              <div className="flex gap-1.5 mt-1">
                <input 
                  type="text" 
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTag(activeContactData.contactId);
                  }}
                  placeholder="Criar nova etiqueta..." 
                  className="flex-1 bg-[#1E293B] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/60 transition-all placeholder:text-slate-500"
                />
                <button 
                  type="button"
                  onClick={() => handleAddTag(activeContactData.contactId)} 
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs px-3 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Sugestões Rápidas de Etiquetas */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 mr-1">Rápidas:</span>
                {SUGGESTED_TAGS.map((stag) => (
                  <button
                    key={stag}
                    type="button"
                    onClick={(e) => handleQuickAddTag(e, activeContactData.contactId, stag)}
                    className="text-[10px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
                  >
                    +{stag}
                  </button>
                ))}
              </div>
            </div>

            {/* Atendimento & Status Operacional */}
            <div className="bg-[#11192A] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Status Operacional</h3>
              
              <div className={`w-full text-center py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 border ${
                activeContactData.status === 'bot_active' 
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : activeContactData.status === 'resolved' || activeContactData.status === 'closed'
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              }`}>
                {activeContactData.status === 'bot_active' ? (
                  <>
                    <Bot size={14} className="text-cyan-400 animate-pulse" />
                    <span>IA Vitor em Atendimento</span>
                  </>
                ) : activeContactData.status === 'resolved' || activeContactData.status === 'closed' ? (
                  <>
                    <Lock size={14} className="text-slate-400" />
                    <span>Ticket Finalizado</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={14} className="text-emerald-400" />
                    <span>Atendente Humano</span>
                  </>
                )}
              </div>

              {/* Informações Complementares */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Última Interação</span>
                  <span className="text-slate-300 font-semibold">{activeContactData.time || 'Hoje'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Atribuído a</span>
                  <span className="text-slate-300 font-semibold">{currentUserName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TRANSFERENCIA */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1c1d22] border border-gray-800 w-full max-w-md rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#25262c] rounded-t-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-primary" />
                Transferir Conversa
              </h2>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">
                Selecione o departamento para o qual deseja enviar este lead. A roleta distribuirá para um agente online automaticamente.
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {departments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">Nenhum departamento encontrado.</p>
                ) : (
                  departments.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => handleTransfer(dept.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/80 border border-gray-700 hover:border-primary transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${dept.color || '#3b82f6'}30` }}>
                        <Network size={16} style={{ color: dept.color || '#3b82f6' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{dept.name}</h4>
                        <p className="text-xs text-gray-400">{dept.users?.length || 0} membros</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL DE ASSUNÇÃO DE FILA / IA (PADRÃO LERO) */}
      {showTakeoverModal && selectedQueueChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,102,255,0.2)]">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Atendimento em Fila</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Este atendimento está na fila <strong className="text-white">{selectedQueueChat.isAi ? 'IA Vitor Online' : 'Aguardando'}</strong>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTakeoverModal(false);
                  setSelectedQueueChat(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informações do Lead */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#1E293B]/70 border border-slate-700/50 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {getContactInitials(selectedQueueChat.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-bold text-white truncate">{selectedQueueChat.name}</h3>
                    <span className="text-[10px] text-amber-400 font-medium bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                      {selectedQueueChat.isAi ? 'IA Ativa' : 'Fila de Espera'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Phone size={11} className="text-slate-500" />
                    <span>{selectedQueueChat.phone || 'Sem telefone'}</span>
                  </p>
                  {selectedQueueChat.lastMsg && (
                    <p className="text-xs text-slate-400 truncate mt-1 italic">
                      "{selectedQueueChat.lastMsg}"
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Escolha uma ação para continuar com este atendimento:
              </p>

              {/* 3 Ações Principais */}
              <div className="flex flex-col gap-2.5 pt-1">
                {/* Ação 1: Atribuir atendimento para mim */}
                <button
                  onClick={() => handleTakeover(selectedQueueChat.id)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer group"
                >
                  <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Atribuir atendimento para mim</span>
                </button>

                {/* Ação 2: Transferir atendimento */}
                <button
                  onClick={() => {
                    setShowTakeoverModal(false);
                    loadDepartmentsAndShowTransfer();
                  }}
                  className="w-full py-2.5 px-4 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowRightLeft size={15} className="text-blue-400" />
                  <span>Transferir atendimento</span>
                </button>

                {/* Ação 3: Espiar conversa */}
                <button
                  onClick={() => {
                    setIsPeeking(true);
                    setActiveChat(selectedQueueChat.id);
                    setShowTakeoverModal(false);
                  }}
                  className="w-full py-2 px-4 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Espiar conversa (somente leitura)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDA DE CONTATOS */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookUser size={18} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Agenda de Contatos</h3>
              </div>
              <button onClick={() => setShowContactsModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Pesquisar contato salvo..." 
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  value={contactModalSearch}
                  onChange={e => setContactModalSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {(() => {
                const list = (directoryContacts && directoryContacts.length > 0 ? directoryContacts : contacts).filter((c: any) => {
                  if (!contactModalSearch.trim()) return true;
                  const q = contactModalSearch.toLowerCase();
                  return (
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.email && c.email.toLowerCase().includes(q))
                  );
                });

                if (list.length === 0) {
                  return <p className="text-xs text-slate-500 text-center py-6">Nenhum contato encontrado.</p>;
                }

                return list.map((c: any) => (
                  <div 
                    key={c.id} 
                    onClick={async () => {
                      setIsPeeking(false);
                      setShowContactsModal(false);
                      try {
                        const { data: conv } = await api.get(`/conversations/contact/${c.id}`);
                        if (conv?.id) {
                          setActiveChat(conv.id);
                          refetchConversations();
                        }
                      } catch (err) {
                        setActiveChat(c.id);
                      }
                    }}
                    className="p-3 rounded-xl bg-[#1E293B]/60 hover:bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white relative overflow-hidden shrink-0">
                        {c.avatarUrl ? (
                          <img 
                            src={c.avatarUrl} 
                            alt={c.name} 
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`avatar-initials ${c.avatarUrl ? "hidden" : ""}`}>
                          {getContactInitials(c.name)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{c.name}</h4>
                        <p className="text-[11px] text-slate-400">{c.phone || 'Sem telefone'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      Conversar
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO DE MENSAGENS */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        activeContact={activeContactData}
        activeChatId={activeChat}
        onSuccess={(scheduledItem) => {
          handleScheduleSuccess(scheduledItem);
        }}
      />

      {/* DRAWER / PAINEL DE MENSAGENS AGENDADAS */}
      <ScheduledMessagesDrawer
        isOpen={showScheduledDrawer}
        onClose={() => setShowScheduledDrawer(false)}
        activeContact={activeContactData}
        scheduledMessages={activeChat ? scheduledMessagesByChat[activeChat] || [] : []}
        onCancelSchedule={handleCancelScheduled}
        onOpenNewSchedule={() => setShowScheduleModal(true)}
      />

      {/* MODAL DA CENTRAL GLOBAL DE AGENDAMENTOS */}
      <GlobalScheduledCenterModal
        isOpen={showGlobalScheduleCenter}
        onClose={() => setShowGlobalScheduleCenter(false)}
        scheduledMessagesByChat={scheduledMessagesByChat}
        contacts={contacts}
        onSelectChat={(chatId) => {
          setActiveChat(chatId);
        }}
        onCancelSchedule={async (msgId, chatId) => {
          try {
            await api.delete(`/conversations/messages/${msgId}/schedule`).catch(() => {});
          } catch (e) {}
          const currentList = scheduledMessagesByChat[chatId] || [];
          const updated = {
            ...scheduledMessagesByChat,
            [chatId]: currentList.filter((item) => item.id !== msgId),
          };
          saveScheduledMessages(updated);
        }}
        onOpenNewSchedule={() => {
          setShowScheduleModal(true);
        }}
      />

      {/* DISCADOR VOIP FLUTUANTE */}
      {showVoipDialer && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="px-4 py-3 bg-[#162038] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-white">Discador VoIP WebRTC</span>
            </div>
            <button onClick={() => setShowVoipDialer(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Display */}
            <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-base font-mono font-bold text-white tracking-wider truncate">
                {voipNumber || <span className="text-slate-600">Digitar número...</span>}
              </span>
              {voipNumber && (
                <button 
                  onClick={() => setVoipNumber(prev => prev.slice(0, -1))}
                  className="text-slate-400 hover:text-red-400 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: '1', l: '' }, { n: '2', l: 'ABC' }, { n: '3', l: 'DEF' },
                { n: '4', l: 'GHI' }, { n: '5', l: 'JKL' }, { n: '6', l: 'MNO' },
                { n: '7', l: 'PQRS' }, { n: '8', l: 'TUV' }, { n: '9', l: 'WXYZ' },
                { n: '*', l: '' }, { n: '0', l: '+' }, { n: '#', l: '' },
              ].map(k => (
                <button
                  key={k.n}
                  onClick={() => setVoipNumber(prev => prev + k.n)}
                  className="h-11 rounded-xl bg-[#1E293B] hover:bg-slate-700/80 border border-slate-800 hover:border-slate-600 text-white font-bold flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-sm leading-none">{k.n}</span>
                  {k.l && <span className="text-[8px] text-slate-500 font-normal leading-none mt-0.5">{k.l}</span>}
                </button>
              ))}
            </div>

            {/* Ação de Ligar */}
            <button
              onClick={() => {
                if (!voipNumber) return;
                alert(`Iniciando chamada VoIP WebRTC para ${voipNumber}...`);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <PhoneCall size={15} />
              <span>Chamar Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX / EXPANSÃO DE IMAGEM ESTILO WHATSAPP */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200 select-none"
          onClick={() => setLightboxImage(null)}
        >
          {/* Barra Superior de Controles Flutuantes */}
          <div 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-50"
            onClick={e => e.stopPropagation()}
          >
            {/* Botão de Download Direto */}
            <button
              type="button"
              onClick={() => handleDownloadImage(lightboxImage.url, lightboxImage.title)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold backdrop-blur-md border border-white/10 shadow-xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Baixar imagem original"
            >
              <Download size={16} className="text-accent" />
              <span>Baixar Imagem</span>
            </button>

            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Fechar visualização (ESC)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo Central da Imagem */}
          <div 
            className="relative max-w-5xl max-h-[88vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={lightboxImage.url} 
              alt={lightboxImage.title || "Imagem Expandida"} 
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] border border-white/10" 
            />
            {lightboxImage.title && lightboxImage.title !== 'Imagem' && lightboxImage.title !== 'Anexo' && (
              <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-slate-200 font-medium max-w-md truncate text-center">
                {lightboxImage.title}
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL HISTÓRICO DE ATENDIMENTO */}
      {showHistoryModal && activeContactData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={18} className="text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Histórico de Atendimento</h3>
                  <p className="text-[11px] text-slate-400">{activeContactData.name} ({activeContactData.phone || 'Sem telefone'})</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowHistoryModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Métricas Rápidas */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Mensagens</span>
                  <span className="text-base font-bold text-white">{messages.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Status</span>
                  <span className="text-xs font-bold text-emerald-400 capitalize">{activeContactData.status || 'Aberto'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Atendente</span>
                  <span className="text-xs font-bold text-white truncate block">{currentUserName}</span>
                </div>
              </div>

              {/* Linha do Tempo de Eventos */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Eventos do Atendimento</h4>
                <div className="space-y-3 border-l-2 border-slate-800 pl-4 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#0F172A]" />
                    <p className="font-semibold text-white text-xs">Atendimento Ativo</p>
                    <p className="text-[11px] text-slate-400">Atribuído a {currentUserName} no Inbox VERSUS</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-[#0F172A]" />
                    <p className="font-semibold text-white text-xs">Mensagens Recebidas</p>
                    <p className="text-[11px] text-slate-400">{activeContactData.time || 'Hoje'} - Sincronizado via WhatsApp Cloud API</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-[#0F172A]" />
                    <p className="font-semibold text-white text-xs">Contato Registrado</p>
                    <p className="text-[11px] text-slate-400">Perfil salvo no diretório do tenant</p>
                  </div>
                </div>
              </div>

              {/* Rodapé de Ações */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleExportConversation();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileDown size={14} className="text-emerald-400" />
                  <span>Exportar Transcrição (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0B1224] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Carregando Caixa de Atendimento...</span>
        </div>
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}