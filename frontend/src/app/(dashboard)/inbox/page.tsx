"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, 
  BrainCircuit, Lock, Image as ImageIcon, FileText, Mic, X, ArrowRightLeft, Network,
  RefreshCw, TrendingUp, Calendar, MessageSquare, CheckCircle2, Plus, Sparkles,
  BookUser, CalendarClock, PhoneCall, Zap, Eye, ShieldCheck, PhoneForwarded, UserCheck,
  Smile, Bold, Italic, Strikethrough, Code, ChevronDown, Trash2, Play, Pause,
  Volume2, CheckCheck, Copy, ExternalLink, Headphones
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

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

function InboxContent() {
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');
  const conversationIdParam = searchParams.get('conversationId') || searchParams.get('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Estados dos 4 Atalhos da Toolbar Superior
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showVoipDialer, setShowVoipDialer] = useState(false);
  const [voipNumber, setVoipNumber] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleMessage, setScheduleMessage] = useState('');

  const getContactInitials = (name?: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'C';
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
        const formattedContact = {
          id: conv.id,
          contactId: conv.contact?.id || '',
          name: conv.contact?.name || 'Contato Sem Nome',
          phone: conv.contact?.phone || '',
          email: conv.contact?.email || '',
          avatarUrl: conv.contact?.avatarUrl || null,
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

  const { data: initialContacts, isLoading, error: fetchErrorQuery, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', activeTab],
    queryFn: async () => {
      const { data } = await api.get(`/conversations?tab=${activeTab}`);
      return data.map((conv: any) => {
        const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
        return {
          id: conv.id,
          contactId: conv.contact?.id || '',
          name: conv.contact?.name || 'Contato Sem Nome',
          phone: conv.contact?.phone || '',
          email: conv.contact?.email || '',
          avatarUrl: conv.contact?.avatarUrl || null,
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
          textareaRef.current?.focus();
        }, 150);
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
      }
    };
    fetchMessages();
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
              // Mantém o estado de unread/hasNewMessage dos contatos anteriores
              const existing = prev.find(p => p.id === conv.id);
              return {
                id: conv.id,
                contactId: conv.contact?.id || '',
                name: conv.contact?.name || 'Contato Sem Nome',
                phone: conv.contact?.phone || '',
                email: conv.contact?.email || '',
                avatarUrl: conv.contact?.avatarUrl || null,
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
      api.get(`/conversations?tab=${activeTab}`).then((res) => {
        const mapped = res.data.map((conv: any) => {
          const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
          return {
            id: conv.id,
            contactId: conv.contact?.id || '',
            name: conv.contact?.name || 'Contato Sem Nome',
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

    socket.on('newMessage', handleNewMessage);
    socket.on('conversationUpdated', handleConversationUpdated);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('conversationUpdated', handleConversationUpdated);
    };
  }, [socket, activeChat, activeTab]);

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
    } catch (error) {
      console.error("Erro ao finalizar", error);
    }
  };

  const handleReopen = async () => {
    if (!activeChat) return;
    try {
      setIsReopening(true);
      await api.patch(`/conversations/${activeChat}/reopen`);
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
    setInputText(""); // limpa o input
    setShowAttachments(false);
    setSelectedFile(null);
    
    // Upload real p/ Supabase
    let mediaUrl = null;
    let type = 'text';
    if (selectedFile) {
      type = selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('audio/') ? 'audio' : 'document';
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
      const filePath = `chat/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('versus-media')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Erro no upload do Supabase:", uploadError);
        alert("Falha ao enviar arquivo. Verifique se o bucket 'versus-media' existe e é público.");
        return;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('versus-media')
        .getPublicUrl(filePath);
        
      mediaUrl = publicUrlData.publicUrl;
    }

    try {
      const payload: any = { 
        content: content || (selectedFile ? selectedFile.name : ''),
        isInternal: isInternalMode,
        type
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
      alert(`ERRO CRÍTICO AO ENVIAR: ${error.response?.data?.message || error.message || 'Erro Desconhecido'}`);
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

  // Filtro de busca e não lidas sobre os contatos da fila atual
  const filteredContacts = contacts.filter(c => {
    if (onlyUnread && !(c.unread > 0)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.lastMsg && c.lastMsg.toLowerCase().includes(q))
    );
  });

  // Calcular total de contatos com mensagens não lidas e contadores de abas
  const unreadCount = contacts.filter(c => (c.unread || 0) > 0).length;
  const waitingCount = contacts.filter(c => c.status === 'waiting' || c.status === 'bot_active').length;
  const mineCount = contacts.filter(c => c.status === 'open' || c.status === 'human_takeover' || c.status === 'in_progress').length;
  const resolvedCount = contacts.filter(c => c.status === 'resolved' || c.status === 'closed').length;

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

  const todayFinishedCount = 14;
  const dailyGoal = 18;
  const finishedVsAveragePercent = 18;
  const avgDaily = 12;
  const todayAvgTma = "6m 40s";
  const todayFirstResp = "1m 15s";

  return (
    <div className="flex h-full w-full bg-[#0B1224] overflow-hidden">
      
      {/* 1. PAINEL ESQUERDO: Lista de Conversas */}
      <div className="w-[340px] flex-shrink-0 bg-[#0F172A] border-r border-gray-800 flex flex-col overflow-hidden z-10">
        {/* Header Lista */}
        <div className="p-4 border-b border-gray-800 flex flex-col gap-3">
          {/* BOX DE INSTÂNCIA (PADRÃO LERO NO TOPO DA COLUNA LATERAL) */}
          <div className="bg-[#162038] border border-gray-700/60 rounded-xl p-2.5 flex items-center justify-between shadow-sm relative">
            {(() => {
              const effectiveStatus = activeInstance ? activeInstance.status : (waStatus?.status || 'disconnected');
              const isWaConnected = effectiveStatus === 'connected';
              const isWaConnecting = effectiveStatus === 'connecting' || effectiveStatus === 'qrcode';

              return (
                <div 
                  onClick={() => setShowInstanceDropdown(prev => !prev)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                  title="Alternar instância do WhatsApp"
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    {activeInstance?.profilePicUrl ? (
                      <img 
                        src={activeInstance.profilePicUrl} 
                        alt={activeInstance.name} 
                        className="w-7 h-7 rounded-full object-cover border border-gray-600"
                      />
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        isWaConnected ? 'bg-emerald-400' : isWaConnecting ? 'bg-amber-400' : 'bg-red-400'
                      }`}></div>
                    )}
                    {isWaConnected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-accent transition-colors flex items-center gap-1">
                      {activeInstance?.name || 'Linha Principal'}
                      <ChevronDown size={11} className={`text-gray-400 transition-transform ${showInstanceDropdown ? 'rotate-180' : ''}`} />
                    </span>
                    <span className={`text-[10px] font-medium leading-tight ${
                      isWaConnected ? 'text-emerald-400' : isWaConnecting ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {isWaConnected ? 'Conectado' : isWaConnecting ? 'Conectando...' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRefreshingConnection(true);
                  refreshWaStatus?.().finally(() => {
                    setTimeout(() => setIsRefreshingConnection(false), 600);
                  });
                  refetchConversations();
                }}
                title="Atualizar status da conexão"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={isRefreshingConnection ? "animate-spin text-blue-400" : ""} />
              </button>
            </div>

            {/* Dropdown de Instâncias */}
            {showInstanceDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0F172A] border border-gray-700/80 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between border-b border-gray-800/80 mb-1">
                  <span>Instâncias WhatsApp</span>
                  <span className="text-gray-500 font-normal">{instances?.length || 0} ativa(s)</span>
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {instances && instances.length > 0 ? (
                    instances.map((inst) => (
                      <div
                        key={inst.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInstance(inst);
                          setShowInstanceDropdown(false);
                        }}
                        className={`px-3 py-2 flex items-center justify-between hover:bg-gray-800/70 cursor-pointer transition-colors ${
                          activeInstance?.id === inst.id ? 'bg-primary/15 border-l-2 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            inst.status === 'connected' ? 'bg-emerald-400' : (inst.status === 'connecting' || inst.status === 'qrcode') ? 'bg-amber-400' : 'bg-gray-500'
                          }`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white truncate">{inst.name}</span>
                            <span className="text-[10px] text-gray-400 truncate">{inst.phoneNumber || 'Sem número'}</span>
                          </div>
                        </div>
                        {inst.isDefault && (
                          <span className="text-[9px] bg-blue-950/60 border border-blue-800/40 text-blue-300 px-1.5 py-0.2 rounded font-medium">
                            Padrão
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center">
                      Nenhuma instância cadastrada
                    </div>
                  )}
                </div>

                <div className="pt-1 mt-1 border-t border-gray-800/80 px-2">
                  <a
                    href="/settings/whatsapp"
                    className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 font-medium px-2 py-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <Plus size={13} />
                    <span>Gerenciar / Nova Instância</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Atendimentos</h2>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-white transition-colors"><Filter size={16} /></button>
              <button className="text-gray-400 hover:text-white transition-colors"><MoreVertical size={16} /></button>
            </div>
          </div>
          
          {/* Barra de Busca + 4 Botões de Atalho da Toolbar Superior */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar contatos..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E293B] border border-gray-700/50 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent/50 focus:bg-[#0B1224] transition-all"
              />
            </div>

            {/* 4 Atalhos: Agenda, Agendamento, Menu Rápido, Discador VoIP */}
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setShowContactsModal(true)}
                title="Agenda de Contatos"
                className="p-1.5 rounded-lg bg-[#1E293B] border border-gray-700/50 text-gray-400 hover:text-white hover:border-accent/50 hover:bg-[#0B1224] transition-all cursor-pointer"
              >
                <BookUser size={14} />
              </button>
              <button 
                onClick={() => setShowScheduleModal(true)}
                title="Agendamento de Mensagens"
                className="p-1.5 rounded-lg bg-[#1E293B] border border-gray-700/50 text-gray-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-[#0B1224] transition-all cursor-pointer"
              >
                <CalendarClock size={14} />
              </button>
              <button 
                onClick={() => setShowQuickReplies(prev => !prev)}
                title="Menu Rápido (Notas internas / Favoritas)"
                className="p-1.5 rounded-lg bg-[#1E293B] border border-gray-700/50 text-gray-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-[#0B1224] transition-all cursor-pointer"
              >
                <Zap size={14} />
              </button>
              <button 
                onClick={() => setShowVoipDialer(prev => !prev)}
                title="Discador VoIP Flutuante"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  showVoipDialer 
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                    : 'bg-[#1E293B] border-gray-700/50 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-[#0B1224]'
                }`}
              >
                <PhoneCall size={14} />
              </button>
            </div>
          </div>
          
          {/* 4 Abas Segmentadas com Badges de Pílula (Padrão Lero Pro) */}
          <div className="grid grid-cols-4 gap-1 bg-[#1E293B] p-1 rounded-xl border border-gray-700/60 mt-1 shadow-inner">
            <button 
              onClick={() => {
                setOnlyUnread(false);
                handleTabChange('waiting');
              }}
              className={`text-[10px] py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'waiting' && !onlyUnread 
                  ? 'font-bold bg-[#0B1224] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-gray-700/60' 
                  : 'font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
              title="Fila de Espera / IA"
            >
              <span className="truncate leading-none">Aguardando</span>
              {waitingCount > 0 ? (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  activeTab === 'waiting' && !onlyUnread ? 'bg-amber-400 text-slate-950' : 'bg-gray-800 text-amber-400 border border-amber-500/30'
                }`}>
                  {waitingCount}
                </span>
              ) : (
                <span className="text-[9px] text-gray-600 leading-none">0</span>
              )}
            </button>

            <button 
              onClick={() => {
                setOnlyUnread(false);
                handleTabChange('mine');
              }}
              className={`text-[10px] py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'mine' && !onlyUnread 
                  ? 'font-bold bg-[#0B1224] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-gray-700/60' 
                  : 'font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
              title="Atendimentos atribuídos a mim"
            >
              <span className="truncate leading-none">Meus</span>
              {mineCount > 0 ? (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  activeTab === 'mine' && !onlyUnread ? 'bg-blue-500 text-white' : 'bg-gray-800 text-blue-400 border border-blue-500/30'
                }`}>
                  {mineCount}
                </span>
              ) : (
                <span className="text-[9px] text-gray-600 leading-none">0</span>
              )}
            </button>

            <button 
              onClick={() => {
                setOnlyUnread(prev => !prev);
              }}
              className={`text-[10px] py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                onlyUnread 
                  ? 'font-bold bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]' 
                  : 'font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
              title="Mensagens não lidas"
            >
              <span className="truncate leading-none">Não lidas</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                onlyUnread ? 'bg-white text-rose-600' : (unreadCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-800 text-gray-500 border border-gray-700/60')
              }`}>
                {unreadCount}
              </span>
            </button>

            <button 
              onClick={() => {
                setOnlyUnread(false);
                handleTabChange('resolved');
              }}
              className={`text-[10px] py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'resolved' && !onlyUnread 
                  ? 'font-bold bg-[#0B1224] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-gray-700/60' 
                  : 'font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
              title="Atendimentos finalizados"
            >
              <span className="truncate leading-none">Resolvidos</span>
              {resolvedCount > 0 ? (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  activeTab === 'resolved' && !onlyUnread ? 'bg-emerald-400 text-slate-950' : 'bg-gray-800 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {resolvedCount}
                </span>
              ) : (
                <span className="text-[9px] text-gray-600 leading-none">0</span>
              )}
            </button>
          </div>
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {fetchError && (
            <div className="absolute top-0 left-0 w-full p-3 bg-red-500/20 border-b border-red-500/50 text-red-400 text-xs text-center z-10 font-bold backdrop-blur-md">
              ERRO F5: {fetchError}. O navegador bloqueou o carregamento!
            </div>
          )}
          
          {isLoading && contacts.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-[#162038] flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-800/80 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="h-3 w-20 bg-gray-800/80 rounded"></div>
                    <div className="h-2 w-8 bg-gray-800/50 rounded"></div>
                  </div>
                  <div className="h-2 w-32 bg-gray-800/50 rounded"></div>
                </div>
              </div>
            ))
          ) : filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center justify-center h-40">
              <span className="block mb-2">
                {onlyUnread ? 'Nenhum chat com mensagens não lidas' : 'Nenhum chat nesta fila'}
              </span>
            </div>
          ) : (
            filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => {
                const isQueueOrBot = contact.status === 'waiting' || contact.status === 'bot_active' || !contact.assignedTo;
                if (isQueueOrBot && activeTab !== 'mine') {
                  setSelectedQueueChat(contact);
                  setShowTakeoverModal(true);
                  return;
                }
                setIsPeeking(false);
                setActiveChat(contact.id);
                // Limpa a notificação de piscar quando o usuário clica
                setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, hasNewMessage: false, unread: 0 } : c));
              }}
              className={`p-3 border-b border-gray-800/40 cursor-pointer transition-all hover:bg-gray-800/60 flex flex-col gap-1.5 relative group
                ${activeChat === contact.id ? 'bg-[#1E293B] border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}
                ${contact.hasNewMessage ? 'bg-primary/5 animate-pulse' : ''}
              `}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shrink-0 relative text-xs overflow-hidden">
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
                  {contact.status === 'resolved' || contact.status === 'closed' ? (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(16,185,129,0.8)] z-10">
                      <Lock size={9} className="text-white" />
                    </div>
                  ) : contact.isAi ? (
                    <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(0,210,255,0.8)] z-10">
                      <Bot size={9} className="text-background" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(34,197,94,0.8)] z-10">
                      <User size={9} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`text-xs font-bold truncate ${activeChat === contact.id ? 'text-white' : 'text-gray-200'}`}>
                      {contact.name}
                    </h3>
                    <span className={`text-[0.65rem] shrink-0 ml-1 ${contact.unread > 0 ? 'text-accent font-bold' : 'text-gray-400'}`}>
                      {contact.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.7rem] text-gray-400 mb-1">
                    <Phone size={10} className="text-gray-500 shrink-0" />
                    <span className="truncate">{contact.phone || 'Sem telefone'}</span>
                    {(contact.status === 'resolved' || contact.status === 'closed') && (
                      <span className="ml-auto text-[0.65rem] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded shrink-0">
                        Encerrado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate pr-2">{contact.lastMsg}</p>
                </div>

                {contact.unread > 0 && (
                  <div className="w-4 h-4 bg-primary text-[0.6rem] text-white flex items-center justify-center rounded-full font-bold shrink-0 self-center">
                    {contact.unread}
                  </div>
                )}
              </div>

              {/* Linha de Tags e Botão sutil "+ Etiqueta" */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-800/40 mt-0.5">
                {contact.tags && contact.tags.length > 0 && contact.tags.map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40 px-1.5 py-0.2 rounded"
                  >
                    {t}
                  </span>
                ))}

                {/* Botão Sutil + Etiqueta */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaggingContactId(taggingContactId === contact.id ? null : contact.id);
                    }}
                    className="text-[10px] text-gray-400 hover:text-blue-400 bg-gray-800/80 hover:bg-gray-700/80 px-1.5 py-0.5 rounded border border-gray-700/60 transition-colors flex items-center gap-0.5 cursor-pointer"
                    title="Adicionar etiqueta ao contato"
                  >
                    <Plus size={10} />
                    <span>Etiqueta</span>
                  </button>

                  {/* Popover de Tags Rápidas */}
                  {taggingContactId === contact.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full left-0 mt-1 z-30 w-48 bg-[#162038] border border-gray-700 rounded-xl p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Adicionar Etiqueta
                      </div>
                      <div className="flex flex-col gap-1 mb-2">
                        {SUGGESTED_TAGS.map((stag) => (
                          <button
                            key={stag}
                            onClick={(e) => handleQuickAddTag(e, contact.id, stag)}
                            className="text-left text-xs px-2 py-1 rounded hover:bg-blue-600/20 hover:text-blue-300 text-gray-300 transition-colors"
                          >
                            + {stag}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 pt-1.5 border-t border-gray-700">
                        <input
                          type="text"
                          placeholder="Outra etiqueta..."
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleQuickAddTag(e as any, contact.id, customTagInput);
                            }
                          }}
                          className="w-full bg-[#0B1224] border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={(e) => handleQuickAddTag(e, contact.id, customTagInput)}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* 2. PAINEL CENTRAL: Janela de Chat */}
      <div className="flex-1 bg-background flex flex-col overflow-hidden relative border-r border-gray-800">
        
        {/* Pattern de Fundo Super Sutil via CSS puro */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

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

            {/* Centro: Card circular de produtividade com progresso e estatísticas */}
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto text-center">
              <div className="w-full bg-[#0F172A] border border-gray-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

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
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
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
                  <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <TrendingUp size={14} />
                    <span>+{finishedVsAveragePercent}% vs sua média diária ({avgDaily} atendimentos)</span>
                  </div>
                </div>

                {/* Badges de Apoio */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800/80 text-left text-xs">
                  <div className="bg-[#11192A] p-3 rounded-xl border border-gray-800/60">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">TMA Médio Hoje</span>
                    <span className="text-base font-bold text-white">{todayAvgTma}</span>
                  </div>
                  <div className="bg-[#11192A] p-3 rounded-xl border border-gray-800/60">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">1ª Resposta Média</span>
                    <span className="text-base font-bold text-white">{todayFirstResp}</span>
                  </div>
                </div>
              </div>

              {/* Texto Auxiliar no Rodapé */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 bg-[#0F172A]/80 px-5 py-2.5 rounded-xl border border-gray-800/60">
                <MessageSquare size={15} className="text-blue-400 shrink-0" />
                <span>Nada selecionado ainda. Escolha uma conversa para continuar.</span>
              </div>
            </div>

            <div />
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 border-b border-gray-800 flex items-center justify-between bg-[#0F172A] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold shrink-0 relative overflow-hidden">
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
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{activeContactData.name}</h2>
                  {activeContactData.isAi && (
                    <div className="flex items-center gap-1.5 text-xs text-accent">
                      <BrainCircuit size={12} className="animate-pulse" />
                      <span>IA Vitor conversando...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isResolved ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs font-semibold px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/40 rounded-lg flex items-center gap-1.5">
                      <Lock size={12} />
                      Finalizado
                    </span>
                    <button 
                      onClick={handleReopen} 
                      disabled={isReopening}
                      className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.25)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowRightLeft size={13} />
                      {isReopening ? 'Reabrindo...' : 'Reabrir Atendimento'}
                    </button>
                  </div>
                ) : (activeContactData.status === 'bot_active' || activeContactData.status === 'waiting' || activeContactData.status === 'open') ? (
                  <button onClick={() => handleTakeover()} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-1.5">
                    <UserCheck size={14} />
                    Assumir Conversa
                  </button>
                ) : activeContactData.status === 'human_takeover' ? (
                  <button onClick={handleRelease} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer">
                    Finalizar Atendimento
                  </button>
                ) : null}
                
                {(activeContactData.status === 'human_takeover' || activeContactData.status === 'open') && (
                  <button onClick={loadDepartmentsAndShowTransfer} title="Transferir" className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <ArrowRightLeft size={16} />
                  </button>
                )}
                
                <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Banner de Modo Espiar */}
            {isPeeking && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-amber-300 text-xs shrink-0 backdrop-blur-sm z-20">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-amber-400 animate-pulse shrink-0" />
                  <span><strong>Modo Espiar Ativo:</strong> Visualizando conversa em modo somente-leitura. A IA ou fila continuam ativas.</span>
                </div>
                <button 
                  onClick={() => handleTakeover(activeChat!)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer shrink-0 ml-3"
                >
                  <UserCheck size={13} />
                  Assumir atendimento
                </button>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 z-10">
              
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
                  <Bot size={40} className="text-gray-700" />
                  {isResolved ? (
                    <>
                      <p>Atendimento Finalizado</p>
                      <p className="text-xs">O cliente pode reabrir o ticket enviando uma nova mensagem.</p>
                    </>
                  ) : (
                    <>
                      <p>Aguardando mensagens ao vivo...</p>
                      <p className="text-xs">Rode o script de simulação no backend!</p>
                    </>
                  )}
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAi = msg.senderType === 'system';
                  const isMe = msg.direction === 'OUTBOUND';
                  const audioKey = msg.id || `audio-${i}`;

                  return (
                    <div key={i} className={`flex flex-col gap-1 max-w-[78%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`text-sm shadow-sm relative transition-all ${
                        msg.isInternal
                          ? 'bg-amber-500/10 text-amber-100 rounded-2xl rounded-tr-none border border-amber-500/40 p-3.5 shadow-[0_2px_12px_rgba(245,158,11,0.08)]'
                          : isMe 
                            ? 'bg-[#005c4b]/95 text-emerald-50 rounded-2xl rounded-tr-none border border-emerald-600/30 p-3.5 shadow-md' 
                            : 'bg-[#1E293B] text-gray-100 rounded-2xl rounded-tl-none border border-gray-700/60 p-3.5 shadow-sm'
                      }`}>
                        {/* Identificador de Nota Interna */}
                        {msg.isInternal && (
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-2 pb-1.5 border-b border-amber-500/20 text-[10px] uppercase tracking-wider">
                            <Lock size={11} />
                            <span>Nota Interna (Equipe)</span>
                          </div>
                        )}

                        {/* Pill de IA Vitor */}
                        {isAi && !msg.isInternal && (
                          <div className="inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 shadow-sm">
                            <Bot size={11} className="text-cyan-400 animate-pulse" />
                            <span>IA VITOR</span>
                          </div>
                        )}
                        
                        {/* Renderização de Mídia */}
                        {msg.mediaUrl && (
                          <div className="mb-2">
                            {msg.type === 'image' && (
                              <img 
                                src={msg.mediaUrl} 
                                alt="Anexo" 
                                className="rounded-xl max-h-56 object-cover border border-white/10 shadow-sm hover:scale-[1.01] transition-transform" 
                              />
                            )}

                            {/* Mini-player de Áudio Customizado */}
                            {msg.type === 'audio' && (
                              <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/10 my-1 w-64 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => togglePlayAudio(audioKey, msg.mediaUrl)}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                                    playingAudioId === audioKey
                                      ? 'bg-amber-400 text-black'
                                      : isMe ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-blue-500 text-white hover:bg-blue-400'
                                  }`}
                                >
                                  {playingAudioId === audioKey ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                                </button>
                                <div className="flex-1 flex flex-col gap-1 min-w-0">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
                                    <span className="flex items-center gap-1">
                                      <Volume2 size={12} className="text-accent" /> Mensagem de voz
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
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
                                            ? 'bg-emerald-400 animate-pulse'
                                            : 'bg-gray-500/60'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === 'document' && (
                              <div className="flex items-center gap-2.5 p-2.5 bg-black/25 rounded-xl border border-white/10 hover:bg-black/35 transition-colors">
                                <FileText size={18} className="text-accent shrink-0" />
                                <span className="text-xs truncate font-medium text-gray-200">{msg.content || 'Documento anexo'}</span>
                                <a 
                                  href={msg.mediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="ml-auto text-accent hover:text-white p-1"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Conteúdo de Texto */}
                        {msg.content && msg.type !== 'audio' && (
                          <div className="whitespace-pre-wrap leading-relaxed text-[0.92rem]">
                            {msg.content}
                          </div>
                        )}

                        {/* Horário e Checks de Leitura Alinhados no Rodapé da Bolha */}
                        <div className={`flex items-center justify-end gap-1.5 mt-1.5 -mb-0.5 text-[10px] font-medium ${
                          isMe ? 'text-emerald-200/80' : 'text-gray-400'
                        }`}>
                          <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && !msg.isInternal && (
                            <CheckCheck size={13} className="text-emerald-300 ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

            </div>

            {/* Chat Input Area ou Modo Leitura para Resolvidos */}
            {isResolved ? (
              <div className="p-4 border-t border-gray-800 bg-[#0F172A] z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">Atendimento Finalizado</h4>
                    <p className="text-xs text-gray-400">Este atendimento foi finalizado. Reabra o ticket para responder.</p>
                  </div>
                </div>
                <button
                  onClick={handleReopen}
                  disabled={isReopening}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  <ArrowRightLeft size={14} />
                  {isReopening ? 'Reabrindo...' : 'Reabrir Atendimento'}
                </button>
              </div>
            ) : (
              <div className="p-3 border-t border-gray-800 bg-[#0F172A] z-10 flex flex-col gap-2">
                
                {/* File Preview */}
                {selectedFile && (
                  <div className="bg-[#1E293B] border border-gray-700 rounded-lg p-2 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <FileText size={16} className="text-accent" />
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-400 p-1">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {isPeeking ? (
                  <div className="p-4 bg-[#0F172A] border border-amber-500/30 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2.5 text-xs text-amber-300">
                      <Lock size={15} className="text-amber-400 shrink-0" />
                      <span>Modo somente-leitura (Espiando). Envio bloqueado para não interferir no fluxo do bot ou fila.</span>
                    </div>
                    <button
                      onClick={() => handleTakeover(activeChat!)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer shrink-0 ml-3"
                    >
                      <UserCheck size={14} />
                      Atribuir atendimento para mim
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Toolbar de Formatação Rica WhatsApp & Ações */}
                    <div className="flex items-center justify-between px-1 pb-1.5 pt-0.5">
                      <div className="flex items-center gap-1">
                        {/* Seletor de Emojis */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(prev => !prev)}
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-gray-800/80 transition-colors cursor-pointer ${showEmojiPicker ? 'text-amber-400 bg-gray-800/80' : ''}`}
                            title="Inserir Emoji"
                          >
                            <Smile size={16} />
                          </button>

                          {showEmojiPicker && (
                            <div className="absolute bottom-9 left-0 w-72 bg-[#1E293B] border border-gray-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)] rounded-xl p-3 z-50 animate-in fade-in zoom-in-95">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-700/60 mb-2">
                                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Emojis Frequentes</span>
                                <button
                                  type="button"
                                  onClick={() => setShowEmojiPicker(false)}
                                  className="text-gray-400 hover:text-white p-0.5"
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
                                    className="w-7 h-7 flex items-center justify-center text-base hover:bg-gray-700/80 rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Divisor */}
                        <div className="w-[1px] h-3.5 bg-gray-700/80 mx-1" />

                        {/* Negrito *texto* */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('*')}
                          className="px-1.5 py-1 rounded text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer"
                          title="Negrito WhatsApp (*texto*)"
                        >
                          <Bold size={13} />
                        </button>

                        {/* Itálico _texto_ */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('_')}
                          className="px-1.5 py-1 rounded text-xs italic text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer"
                          title="Itálico WhatsApp (_texto_)"
                        >
                          <Italic size={13} />
                        </button>

                        {/* Tachado ~texto~ */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('~')}
                          className="px-1.5 py-1 rounded text-xs line-through text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer"
                          title="Tachado WhatsApp (~texto~)"
                        >
                          <Strikethrough size={13} />
                        </button>

                        {/* Código/Mono ```texto``` */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormatting('```')}
                          className="px-1.5 py-1 rounded text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer"
                          title="Monoespaçado WhatsApp (```texto```)"
                        >
                          <Code size={13} />
                        </button>

                        {/* Divisor */}
                        <div className="w-[1px] h-3.5 bg-gray-700/80 mx-1" />

                        {/* Respostas Rápidas / Macros */}
                        <button
                          type="button"
                          onClick={() => setShowQuickReplies(prev => !prev)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            showQuickReplies 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'text-gray-400 hover:text-amber-400 hover:bg-gray-800/80'
                          }`}
                          title="Respostas Rápidas (ou digite /)"
                        >
                          <Zap size={13} />
                          <span className="text-[10px]">Respostas</span>
                        </button>
                      </div>

                      {/* Modo Externo vs Interno */}
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setIsInternalMode(false)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${!isInternalMode ? 'bg-primary/20 text-blue-300 border border-primary/40' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                          WhatsApp
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsInternalMode(true)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${isInternalMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                          <Lock size={9} /> Nota Interna
                        </button>
                      </div>
                    </div>

                    <div className={`border rounded-xl p-1.5 flex items-end gap-2 transition-colors shadow-sm relative min-h-[52px]
                      ${isInternalMode 
                        ? 'bg-amber-500/10 border-amber-500/40 focus-within:border-amber-500' 
                        : isRecording
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-[#1E293B] border-gray-700 focus-within:border-gray-500'
                      }
                    `}>
                      {isRecording ? (
                        /* Painel de Gravação de Áudio Ativo */
                        <div className="flex-1 flex items-center justify-between px-3 py-2 animate-in fade-in duration-200">
                          <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                              <div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div>
                              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute"></div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-rose-300">Gravando áudio de voz...</span>
                              <span className="text-[12px] font-mono text-white font-bold">{formatTimer(recordingTime)}</span>
                            </div>
                            {/* Ondas Sonoras Dinâmicas */}
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
                              className="p-2 rounded-lg bg-gray-800/80 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Descartar gravação"
                            >
                              <Trash2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={stopAndSendAudio}
                              disabled={isSendingAudio}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Enviar áudio gravado"
                            >
                              <Send size={14} />
                              <span>{isSendingAudio ? "Enviando..." : "Enviar Áudio"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Popover de Anexos */}
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setShowAttachments(!showAttachments)}
                              className={`p-2 transition-colors rounded-lg ${isInternalMode ? 'text-amber-400 hover:bg-amber-500/20' : 'text-gray-400 hover:text-accent hover:bg-gray-800/80'}`}
                            >
                              <Paperclip size={22} />
                            </button>
                            
                            {showAttachments && (
                              <div className="absolute bottom-12 left-0 bg-[#1E293B] border border-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-xl p-2 flex flex-col gap-1 w-48 z-50 animate-in slide-in-from-bottom-2">
                                <label className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg cursor-pointer transition-colors">
                                  <ImageIcon size={16} className="text-blue-400" /> Foto / Vídeo
                                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                                </label>
                                <label className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg cursor-pointer transition-colors">
                                  <FileText size={16} className="text-purple-400" /> Documento
                                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} />
                                </label>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setShowAttachments(false);
                                    startRecording();
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-left w-full cursor-pointer"
                                >
                                  <Mic size={16} className="text-green-400" /> Gravar Áudio
                                </button>
                              </div>
                            )}
                          </div>

                          <textarea 
                            ref={textareaRef}
                            placeholder={isInternalMode ? "Digite uma anotação privada... Visível apenas para a equipe" : "Digite uma mensagem ou digite / para respostas rápidas..."} 
                            className={`flex-1 bg-transparent text-[0.95rem] resize-none outline-none py-2.5 max-h-32 
                              ${isInternalMode ? 'text-amber-100 placeholder:text-amber-500/50' : 'text-white placeholder:text-gray-500'}
                            `}
                            rows={1}
                            value={inputText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInputText(val);
                              
                              // UX de Resposta Rápida
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
                                // Se o popover estiver aberto, não envia ainda
                                if (!showQuickReplies) {
                                  handleSendMessage();
                                }
                              }
                            }}
                          />
                          
                          {/* Popover de Respostas Rápidas */}
                          {showQuickReplies && quickReplies.length > 0 && (
                            <div className="absolute bottom-14 left-12 w-[300px] bg-[#1E293B] border border-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2">
                              <div className="px-3 py-2 bg-gray-800/50 text-xs font-bold text-gray-400 border-b border-gray-700">Respostas Rápidas</div>
                              <div className="max-h-48 overflow-y-auto">
                                {quickReplies.filter(qr => qr.shortcut.toLowerCase().includes(quickReplyFilter)).map(qr => (
                                  <div 
                                    key={qr.id}
                                    onClick={() => {
                                      setInputText(qr.content);
                                      setShowQuickReplies(false);
                                    }}
                                    className="px-3 py-2 border-b border-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
                                  >
                                    <div className="text-accent text-xs font-bold mb-0.5">{qr.shortcut}</div>
                                    <div className="text-gray-300 text-xs line-clamp-1">{qr.content}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Botão Dinâmico: Microfone (se vazio) ou Enviar (se preenchido) */}
                          {(!inputText.trim() && !selectedFile) ? (
                            <button 
                              type="button"
                              onClick={startRecording}
                              title="Gravar mensagem de voz"
                              className="p-2.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center shrink-0 mb-0.5"
                            >
                              <Mic size={20} />
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={handleSendMessage} 
                              className={`p-3 rounded-lg transition-colors shadow-md flex items-center justify-center shrink-0
                                ${isInternalMode 
                                  ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' 
                                  : 'bg-accent text-[#0B1224] hover:bg-accent/90'
                                }
                              `}
                            >
                              <Send size={18} className={!isInternalMode ? "ml-1" : ""} />
                            </button>
                          )}
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

      {/* 3. PAINEL DIREITO: Contexto do Lead */}
      <div className="w-[320px] flex-shrink-0 bg-[#0F172A] flex flex-col overflow-y-auto border-l border-gray-800/80">
        <div className="p-5 flex flex-col items-center border-b border-gray-800 relative bg-gradient-to-b from-[#162038]/50 to-transparent">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black text-2xl shadow-[0_0_25px_rgba(0,210,255,0.25)] mb-3 overflow-hidden relative border-2 border-accent/40">
            {activeContactData?.avatarUrl ? (
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
            <span className={`avatar-initials ${activeContactData?.avatarUrl ? "hidden" : ""}`}>
              {getContactInitials(activeContactData?.name)}
            </span>
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F172A] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>

          <h2 className="text-base font-bold text-white text-center leading-snug">
            {activeContactData ? activeContactData.name : 'Nenhum lead selecionado'}
          </h2>
          {activeContactData && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-gray-400 font-medium">WhatsApp Cloud API</p>
            </div>
          )}

          {/* Atalhos Rápidos: Ligar VoIP, Ver no CRM, Copiar */}
          {activeContactData && (
            <div className="flex items-center gap-2 mt-4 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  if (activeContactData.phone) {
                    setVoipNumber(activeContactData.phone);
                    setShowVoipDialer(true);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-emerald-600/30 border border-gray-700/60 hover:border-emerald-500/50 text-gray-300 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Iniciar chamada VoIP"
              >
                <PhoneCall size={13} className="text-emerald-400" />
                <span>Ligar</span>
              </button>

              <a
                href="/crm"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-blue-600/30 border border-gray-700/60 hover:border-blue-500/50 text-gray-300 hover:text-blue-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Visualizar no CRM"
              >
                <TrendingUp size={13} className="text-blue-400" />
                <span>CRM</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyText(activeContactData.phone || activeContactData.name, 'lead-all')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-purple-600/30 border border-gray-700/60 hover:border-purple-500/50 text-gray-300 hover:text-purple-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Copiar dados do contato"
              >
                {copiedField === 'lead-all' ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} className="text-purple-400" />}
                <span>{copiedField === 'lead-all' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          )}
        </div>

        {activeContactData && (
          <div className="p-5 flex flex-col gap-5">
            {/* Informações de Contato */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center justify-between">
                <span>Informações de Contato</span>
                <span className="text-[9px] text-accent font-normal lowercase">id: {activeContactData.contactId?.substring(0, 8) || '---'}</span>
              </h3>

              {/* Telefone */}
              <div className="flex items-center justify-between p-2.5 bg-[#162038]/60 border border-gray-800/80 rounded-xl group hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2.5 text-xs text-gray-300 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                    <Phone size={13} />
                  </div>
                  <span className="truncate font-mono">{activeContactData.phone || 'Sem telefone'}</span>
                </div>
                {activeContactData.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeContactData.phone, 'phone')}
                    className="text-gray-500 hover:text-white p-1 transition-colors"
                    title="Copiar telefone"
                  >
                    {copiedField === 'phone' ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                )}
              </div>

              {/* E-mail */}
              <div className="flex items-center justify-between p-2.5 bg-[#162038]/60 border border-gray-800/80 rounded-xl group hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2.5 text-xs text-gray-300 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
                    <Mail size={13} />
                  </div>
                  <span className="truncate font-sans">{activeContactData.email || 'Sem e-mail'}</span>
                </div>
                {activeContactData.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeContactData.email, 'email')}
                    className="text-gray-500 hover:text-white p-1 transition-colors"
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
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5">
                  <Tag size={11} className="text-accent" />
                  <span>Etiquetas & Segmentos</span>
                </h3>
                <span className="text-[10px] text-gray-400 font-bold">{activeContactData.tags?.length || 0}</span>
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
                          className="ml-1 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remover etiqueta"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-500 italic">Nenhuma etiqueta atribuída</span>
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
                  className="flex-1 bg-[#1E293B] border border-gray-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent/60 transition-all placeholder:text-gray-500"
                />
                <button 
                  type="button"
                  onClick={() => handleAddTag(activeContactData.contactId)} 
                  className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-xs px-3 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Sugestões Rápidas de Etiquetas */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <span className="text-[9px] uppercase font-bold text-gray-500 mr-1">Rápidas:</span>
                {SUGGESTED_TAGS.map((stag) => (
                  <button
                    key={stag}
                    type="button"
                    onClick={(e) => handleQuickAddTag(e, activeContactData.contactId, stag)}
                    className="text-[10px] text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700/60 px-2 py-0.5 rounded-md border border-gray-700/50 transition-colors cursor-pointer"
                  >
                    +{stag}
                  </button>
                ))}
              </div>
            </div>

            {/* Atendimento & Status Operacional */}
            <div className="bg-[#11192A] border border-gray-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Status Operacional</h3>
              
              <div className={`w-full text-center py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 border ${
                activeContactData.status === 'bot_active' 
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : activeContactData.status === 'resolved' || activeContactData.status === 'closed'
                  ? 'bg-gray-800/80 text-gray-400 border-gray-700/60'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              }`}>
                {activeContactData.status === 'bot_active' ? (
                  <>
                    <Bot size={14} className="text-cyan-400 animate-pulse" />
                    <span>IA Vitor em Atendimento</span>
                  </>
                ) : activeContactData.status === 'resolved' || activeContactData.status === 'closed' ? (
                  <>
                    <Lock size={14} className="text-gray-400" />
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
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500">Última Interação</span>
                  <span className="text-gray-300 font-semibold">{activeContactData.time || 'Hoje'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500">Atribuído a</span>
                  <span className="text-gray-300 font-semibold">{currentUserName}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Nenhum contato encontrado.</p>
              ) : (
                contacts.slice(0, 30).map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => {
                      setIsPeeking(false);
                      setActiveChat(c.id);
                      setShowContactsModal(false);
                    }}
                    className="p-3 rounded-xl bg-[#1E293B]/60 hover:bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {getContactInitials(c.name)}
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO DE MENSAGENS */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarClock size={18} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Agendamento de Mensagem</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Destinatário</label>
                <div className="p-2.5 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white">
                  {activeContactData ? `${activeContactData.name} (${activeContactData.phone || 'Sem fone'})` : 'Selecione um chat na lista'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Data de Envio</label>
                  <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Horário</label>
                  <input 
                    type="time" 
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Mensagem Programada</label>
                <textarea 
                  rows={4}
                  value={scheduleMessage}
                  onChange={e => setScheduleMessage(e.target.value)}
                  placeholder="Olá! Conforme combinamos, estou enviando este lembrete..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button 
                onClick={() => {
                  if (!scheduleMessage.trim() || !scheduleDate) {
                    alert("Por favor, preencha a data e o conteúdo da mensagem.");
                    return;
                  }
                  alert("Mensagem agendada com sucesso!");
                  setShowScheduleModal(false);
                  setScheduleMessage('');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

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