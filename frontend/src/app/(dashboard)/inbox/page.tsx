"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, 
  BrainCircuit, Lock, Image as ImageIcon, FileText, Mic, X, ArrowRightLeft, Network,
  RefreshCw, TrendingUp, Calendar, MessageSquare, CheckCircle2, Plus, Sparkles,
  BookUser, CalendarClock, PhoneCall, Zap, Eye, ShieldCheck, PhoneForwarded, UserCheck
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

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
  const { status: waStatus, refreshStatus: refreshWaStatus } = useWhatsApp();
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [taggingContactId, setTaggingContactId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');

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
                contactId: conv.contact.id,
                name: conv.contact.name,
                phone: conv.contact.phone,
                email: conv.contact.email,
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
            contactId: conv.contact.id,
            name: conv.contact.name,
            phone: conv.contact.phone,
            email: conv.contact.email,
            tags: conv.contact.tags || [],
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

  // Calcular total de contatos com mensagens não lidas
  const unreadCount = contacts.filter(c => c.unread > 0).length;

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
          <div className="bg-[#162038] border border-gray-700/60 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight">
                  Linha Principal
                </span>
                <span className="text-[10px] text-emerald-400 font-medium leading-tight">
                  Conectado
                </span>
              </div>
            </div>
            <button
              onClick={() => {
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
          
          {/* Abas Estilo Lero + Pílula de Filtro Rápido [Não lidas] */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex flex-1 gap-1 bg-[#1E293B] p-1 rounded-lg">
              <button 
                onClick={() => {
                  handleTabChange('waiting');
                }}
                className={`flex-1 text-[11px] py-1 rounded shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  activeTab === 'waiting' && !onlyUnread ? 'font-bold bg-[#0B1224] text-white' : 'font-semibold text-gray-400 hover:text-gray-200'
                }`}
              >
                Aguardando
              </button>
              <button 
                onClick={() => {
                  handleTabChange('mine');
                }}
                className={`flex-1 text-[11px] py-1 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  activeTab === 'mine' && !onlyUnread ? 'font-bold bg-[#0B1224] text-white shadow-sm' : 'font-semibold text-gray-400 hover:text-gray-200'
                }`}
              >
                Meus
                {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1 rounded-full">{unreadCount}</span>}
              </button>
              <button 
                onClick={() => {
                  handleTabChange('resolved');
                }}
                className={`flex-1 text-[11px] py-1 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  activeTab === 'resolved' && !onlyUnread ? 'font-bold bg-[#0B1224] text-white shadow-sm' : 'font-semibold text-gray-400 hover:text-gray-200'
                }`}
              >
                Resolvidos
              </button>
            </div>

            {/* Pílula de Filtro Rápido [Não lidas] */}
            <button
              onClick={() => setOnlyUnread(prev => !prev)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                onlyUnread
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-[#1E293B] border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
              title="Filtrar conversas com mensagens não lidas"
            >
              <span>Não lidas</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                onlyUnread ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
              }`}>
                {unreadCount}
              </span>
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shrink-0 relative text-xs">
                  {contact.name?.charAt(0) || 'C'}
                  {contact.status === 'resolved' || contact.status === 'closed' ? (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(16,185,129,0.8)]">
                      <Lock size={9} className="text-white" />
                    </div>
                  ) : contact.isAi ? (
                    <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(0,210,255,0.8)]">
                      <Bot size={9} className="text-background" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(34,197,94,0.8)]">
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold">
                  {activeContactData.name.charAt(0)}
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

                  return (
                    <div key={i} className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'self-end items-end' : ''}`}>
                      <div className={`p-3 text-sm border shadow-sm relative ${
                        msg.isInternal
                          ? 'bg-amber-500/10 text-amber-100 rounded-2xl rounded-tr-sm border-amber-500/30'
                          : isMe 
                            ? 'bg-primary/20 text-blue-100 rounded-2xl rounded-tr-sm border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)]' 
                            : 'bg-gray-800/80 text-text-primary rounded-2xl rounded-tl-sm border-gray-700/50'
                      }`}>
                        {msg.isInternal && (
                          <div className="flex items-center gap-1 text-amber-500 font-bold mb-1 border-b border-amber-500/20 pb-1">
                            <Lock size={12} /> <span className="text-[0.65rem] uppercase tracking-wider">Nota Interna (Visível apenas p/ Equipe)</span>
                          </div>
                        )}
                        {isAi && !msg.isInternal && (
                          <div className="absolute -top-3 -right-2 bg-[#0B1224] border border-accent/50 text-accent text-[0.55rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Bot size={10} /> IA VITOR
                          </div>
                        )}
                        
                        {/* Renderização de Mídia */}
                        {msg.mediaUrl && (
                          <div className="mb-2">
                            {msg.type === 'image' && <img src={msg.mediaUrl} alt="Anexo" className="rounded-lg max-h-48 object-cover" />}
                            {msg.type === 'audio' && <audio src={msg.mediaUrl} controls className="h-8 max-w-[200px]" />}
                            {msg.type === 'document' && (
                              <div className="flex items-center gap-2 p-2 bg-black/20 rounded border border-white/10">
                                <FileText size={16} /> <span className="text-xs truncate">{msg.content}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {msg.content}
                      </div>
                      <span className="text-[0.65rem] text-gray-500 mx-1">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                      </span>
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
                    {/* Abas Externa / Interna */}
                    <div className="flex gap-4 px-1">
                      <button 
                        onClick={() => setIsInternalMode(false)}
                        className={`text-[0.7rem] uppercase tracking-wider font-bold pb-1 transition-all ${!isInternalMode ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Mensagem Externa
                      </button>
                      <button 
                        onClick={() => setIsInternalMode(true)}
                        className={`text-[0.7rem] uppercase tracking-wider font-bold pb-1 transition-all ${isInternalMode ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300 flex items-center gap-1'}`}
                      >
                        <Lock size={10} className="inline mb-0.5"/> Nota Interna (Equipe)
                      </button>
                    </div>

                    <div className={`border rounded-xl p-1.5 flex items-end gap-2 transition-colors shadow-sm relative
                      ${isInternalMode 
                        ? 'bg-amber-500/10 border-amber-500/40 focus-within:border-amber-500' 
                        : 'bg-[#1E293B] border-gray-700 focus-within:border-gray-500'
                      }
                    `}>
                      
                      {/* Popover de Anexos */}
                      <div className="relative">
                        <button 
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
                            <button className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-left">
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
                      <button 
                        onClick={handleSendMessage} 
                        className={`p-3 rounded-lg transition-colors shadow-md flex items-center justify-center
                          ${isInternalMode 
                            ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' 
                            : 'bg-accent text-[#0B1224] hover:bg-accent/90'
                          }
                        `}
                      >
                        <Send size={18} className={!isInternalMode ? "ml-1" : ""} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. PAINEL DIREITO: Contexto do Lead */}
      <div className="w-[320px] flex-shrink-0 bg-[#0F172A] flex flex-col overflow-y-auto">
        <div className="p-6 flex flex-col items-center border-b border-gray-800">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black text-3xl shadow-[0_0_20px_rgba(0,210,255,0.2)] mb-4">
            {activeContactData ? activeContactData.name.charAt(0) : '?'}
          </div>
          <h2 className="text-lg font-bold text-white">{activeContactData ? activeContactData.name : 'Nenhum lead'}</h2>
          {activeContactData && <p className="text-xs text-text-secondary mt-1">Lead Registrado</p>}
        </div>

        {activeContactData && (
          <div className="p-6 flex flex-col gap-6">
            {/* Informações de Contato */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[0.7rem] uppercase tracking-widest font-bold text-gray-500">Contato</h3>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Phone size={14} className="text-accent" />
                <span>{activeContactData.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Mail size={14} className="text-accent" />
                <span>{activeContactData.email || 'Sem e-mail'}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[0.7rem] uppercase tracking-widest font-bold text-gray-500">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {activeContactData.tags?.length > 0 ? (
                  activeContactData.tags.map((tag: string) => (
                    <span key={tag} className="bg-gray-800 border border-gray-700 text-xs px-2 py-1 rounded-md text-gray-300 flex items-center gap-1 group">
                      <Tag size={10} /> {tag}
                      <button onClick={() => handleRemoveTag(activeContactData.contactId, tag)} className="ml-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Nenhuma tag.</span>
                )}
              </div>
              <div className="flex gap-2 mt-1">
                <input 
                  type="text" 
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTag(activeContactData.contactId);
                  }}
                  placeholder="Nova tag..." 
                  className="flex-1 bg-[#1E293B] border border-gray-700 rounded p-1.5 text-xs text-white outline-none focus:border-accent"
                />
                <button onClick={() => handleAddTag(activeContactData.contactId)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 rounded font-bold">
                  +
                </button>
              </div>
            </div>

            {/* CRM Status */}
            <div className="bg-[#0B1224]/80 border border-gray-800/60 rounded-xl p-4 mt-2">
              <h3 className="text-[0.7rem] uppercase tracking-widest font-bold text-gray-500 mb-2">Status da Conversa</h3>
              <div className={`w-full text-center py-2 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(0,0,0,0.15)] cursor-pointer transition-colors ${
                activeContactData.status === 'bot_active' 
                  ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30' 
                  : activeContactData.status === 'resolved'
                  ? 'bg-gray-800 text-gray-400 border border-gray-700'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              }`}>
                {activeContactData.status === 'bot_active' ? 'IA Atendendo' : activeContactData.status === 'resolved' ? 'Resolvido' : 'Atendimento Humano'}
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
                  {selectedQueueChat.name?.charAt(0) || 'C'}
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
                        {c.name?.charAt(0) || 'C'}
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