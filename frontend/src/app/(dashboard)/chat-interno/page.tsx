"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, Hash, Plus, MessageSquare, Send, Paperclip, Smile, 
  Users, User as UserIcon, ShieldCheck, CheckCheck, Circle, 
  Filter, MoreVertical, X, Sparkles, Building2, PhoneCall, ArrowLeft,
  Trash2, AlertTriangle, Check, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSocket } from "@/components/ui/SocketProvider";

interface Department {
  id: string;
  name: string;
  color?: string;
}

interface TeamUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  isOnline: boolean;
  department?: string | null;
  departmentColor?: string | null;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount?: number;
}

interface TeamChannel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  department?: string;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender?: { id: string; name: string };
  } | null;
  unreadCount?: number;
}

interface TeamMessage {
  id: string;
  content: string;
  senderId: string;
  channelId?: string | null;
  receiverId?: string | null;
  createdAt: string;
  mediaUrl?: string | null;
  sender: { id: string; name: string; role?: string };
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Agora';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Ontem';
  return `${diffDays} dias`;
}

export default function ChatInternoPage() {
  const { socket } = useSocket();

  // Abas Principais (Colaboradores vs Equipes)
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>('users');
  
  // Dados Principais
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [channels, setChannels] = useState<TeamChannel[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [onlyOnline, setOnlyOnline] = useState(false);

  // Chat Ativo
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatType, setChatType] = useState<'user' | 'channel'>('user');
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Menu de Ações do Chat (Dropdown)
  const [showChatMenu, setShowChatMenu] = useState(false);

  // Modais de Exclusão
  const [messageToDelete, setMessageToDelete] = useState<TeamMessage | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const [channelToDelete, setChannelToDelete] = useState<TeamChannel | null>(null);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);

  // Modal Novo Chat / Canal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // Usuário Atual
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('USER');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('versus_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && u.id) setCurrentUserId(u.id);
        if (u && u.role) setCurrentUserRole(u.role);
      }
    } catch (e) {
      console.error("Erro ao carregar versus_user", e);
    }
  }, []);

  // Carregar usuários, canais e departamentos
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [uRes, cRes, dRes] = await Promise.allSettled([
        api.get('/team-chat/users'),
        api.get('/team-chat/channels'),
        api.get('/team-chat/departments')
      ]);

      if (uRes.status === 'fulfilled') {
        setUsers(uRes.value.data || []);
      }
      if (cRes.status === 'fulfilled') {
        setChannels(cRes.value.data || []);
      }
      if (dRes.status === 'fulfilled') {
        setDepartments(dRes.value.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do chat interno", error);
      toast.error("Erro ao carregar o chat interno.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fechar menu de opções ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setShowChatMenu(false);
    };
    if (showChatMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showChatMenu]);

  // Carregar histórico da conversa selecionada de forma instantânea e sem travamento
  const loadMessages = async (id: string, type: 'user' | 'channel') => {
    activeChatIdRef.current = id;
    setActiveChatId(id);
    setChatType(type);
    setShowChatMenu(false);
    setIsLoadingMessages(true);
    setMessages([]); // Reset imediato para evitar exibir mensagens da conversa anterior

    // Limpa unread count local
    if (type === 'user') {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, unreadCount: 0 } : u));
    } else {
      setChannels(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
    }

    try {
      const queryParam = type === 'channel' ? `channelId=${id}` : `receiverId=${id}`;
      const res = await api.get(`/team-chat/messages?${queryParam}`);
      
      // Valida se o usuário não trocou de chat antes da resposta da API
      if (activeChatIdRef.current === id) {
        setMessages(res.data || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Erro ao buscar histórico", error);
      toast.error("Erro ao buscar histórico de mensagens.");
    } finally {
      if (activeChatIdRef.current === id) {
        setIsLoadingMessages(false);
      }
      // Habilita foco imediato no input de digitação sem travamentos
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  // Envio de mensagem
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChatId || isSending) return;
    const textToSend = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      const payload = chatType === 'channel' 
        ? { channelId: activeChatId, content: textToSend } 
        : { receiverId: activeChatId, content: textToSend };

      const { data: newMsg } = await api.post('/team-chat/messages', payload);

      // Atualiza localmente se ainda estiver no mesmo chat
      if (activeChatIdRef.current === activeChatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Atualiza card na barra lateral
      if (chatType === 'user') {
        setUsers(prev => prev.map(u => u.id === activeChatId ? {
          ...u,
          lastMessage: { id: newMsg.id, content: newMsg.content, createdAt: newMsg.createdAt, senderId: newMsg.senderId }
        } : u));
      } else {
        setChannels(prev => prev.map(c => c.id === activeChatId ? {
          ...c,
          lastMessage: { id: newMsg.id, content: newMsg.content, createdAt: newMsg.createdAt, sender: newMsg.sender }
        } : c));
      }

      scrollToBottom();
    } catch (error: any) {
      console.error("Erro ao enviar mensagem", error);
      toast.error("Não foi possível enviar a mensagem.");
      setInputValue(textToSend); // Restaura texto em caso de falha
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  // Exclusão de Mensagem Individual
  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      setIsDeletingMessage(true);
      await api.delete(`/team-chat/messages/${messageToDelete.id}`);

      // Atualização otimista imediata no estado
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));

      // Se for a última mensagem exibida na barra lateral, atualiza o preview
      if (chatType === 'user') {
        setUsers(prev => prev.map(u => {
          if (u.id === activeChatId && u.lastMessage?.id === messageToDelete.id) {
            return { ...u, lastMessage: null };
          }
          return u;
        }));
      } else {
        setChannels(prev => prev.map(c => {
          if (c.id === activeChatId && c.lastMessage?.id === messageToDelete.id) {
            return { ...c, lastMessage: null };
          }
          return c;
        }));
      }

      toast.success("Mensagem excluída com sucesso.");
      setMessageToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir mensagem", error);
      toast.error(error?.response?.data?.message || "Erro ao excluir mensagem.");
    } finally {
      setIsDeletingMessage(false);
    }
  };

  // Limpeza de Histórico de Conversa
  const handleConfirmClearHistory = async () => {
    if (!activeChatId) return;
    try {
      setIsClearingHistory(true);
      const queryParam = chatType === 'channel' ? `channelId=${activeChatId}` : `receiverId=${activeChatId}`;
      await api.delete(`/team-chat/history?${queryParam}`);

      // Feedback visual imediato: zera o histórico na tela
      setMessages([]);

      // Zera o preview na lista lateral
      if (chatType === 'user') {
        setUsers(prev => prev.map(u => u.id === activeChatId ? { ...u, lastMessage: null } : u));
      } else {
        setChannels(prev => prev.map(c => c.id === activeChatId ? { ...c, lastMessage: null } : c));
      }

      toast.success("Histórico de mensagens limpo com sucesso.");
      setShowClearHistoryModal(false);
      setShowChatMenu(false);
    } catch (error: any) {
      console.error("Erro ao limpar histórico", error);
      toast.error(error?.response?.data?.message || "Erro ao limpar histórico.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Exclusão de Canal de Equipe
  const handleConfirmDeleteChannel = async () => {
    if (!channelToDelete) return;
    try {
      setIsDeletingChannel(true);
      await api.delete(`/team-chat/channels/${channelToDelete.id}`);

      // Remove da listagem local
      setChannels(prev => prev.filter(c => c.id !== channelToDelete.id));

      // Se o canal excluído estava aberto, fecha o painel
      if (activeChatId === channelToDelete.id) {
        setActiveChatId(null);
      }

      toast.success(`Canal #${channelToDelete.name} excluído com sucesso.`);
      setChannelToDelete(null);
      setShowChatMenu(false);
    } catch (error: any) {
      console.error("Erro ao excluir canal", error);
      toast.error(error?.response?.data?.message || "Erro ao excluir canal.");
    } finally {
      setIsDeletingChannel(false);
    }
  };

  // Criação de canal de equipe
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Informe o nome da equipe/canal.");
      return;
    }
    try {
      setIsCreatingChannel(true);
      const cleanName = newChannelName.trim().replace(/^#/, '');
      const { data: created } = await api.post('/team-chat/channels', {
        name: cleanName,
        description: newChannelDesc.trim() || undefined,
        isPrivate: newChannelPrivate
      });

      toast.success(`Canal #${cleanName} criado com sucesso!`);
      setChannels(prev => [...prev, created]);
      setShowNewChatModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelPrivate(false);

      // Abre o canal imediatamente
      loadMessages(created.id, 'channel');
    } catch (error: any) {
      console.error("Erro ao criar canal", error);
      toast.error("Erro ao criar canal interno.");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // WebSocket: sincronização em tempo real (mensagens novas, exclusões e limpezas)
  useEffect(() => {
    if (!socket) return;

    // 1. Mensagem Nova
    const onNewTeamMessage = (msg: TeamMessage) => {
      const isCurrentChannel = chatType === 'channel' && msg.channelId === activeChatId;
      const isCurrentUserChat = chatType === 'user' && (
        (msg.senderId === activeChatId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === activeChatId)
      );

      // Se a mensagem pertence à conversa aberta na tela
      if (isCurrentChannel || isCurrentUserChat) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }

      // Atualiza o preview do card na barra lateral
      if (msg.channelId) {
        setChannels(prev => prev.map(c => {
          if (c.id === msg.channelId) {
            return {
              ...c,
              lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt, sender: msg.sender },
              unreadCount: (!isCurrentChannel && msg.senderId !== currentUserId) ? (c.unreadCount || 0) + 1 : 0
            };
          }
          return c;
        }));
      } else {
        const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        setUsers(prev => prev.map(u => {
          if (u.id === otherUserId) {
            return {
              ...u,
              lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt, senderId: msg.senderId },
              unreadCount: (!isCurrentUserChat && msg.senderId !== currentUserId) ? (u.unreadCount || 0) + 1 : 0
            };
          }
          return u;
        }));
      }
    };

    // 2. Mensagem Excluída
    const onTeamMessageDeleted = (payload: { messageId: string; channelId?: string; senderId?: string; receiverId?: string }) => {
      setMessages(prev => prev.filter(m => m.id !== payload.messageId));
      // Limpa lastMessage da barra lateral se coincidir
      setUsers(prev => prev.map(u => u.lastMessage?.id === payload.messageId ? { ...u, lastMessage: null } : u));
      setChannels(prev => prev.map(c => c.lastMessage?.id === payload.messageId ? { ...c, lastMessage: null } : c));
    };

    // 3. Histórico Limpo
    const onTeamHistoryCleared = (payload: { channelId?: string; user1Id?: string; user2Id?: string }) => {
      if (payload.channelId) {
        if (chatType === 'channel' && activeChatId === payload.channelId) {
          setMessages([]);
        }
        setChannels(prev => prev.map(c => c.id === payload.channelId ? { ...c, lastMessage: null } : c));
      } else if (payload.user1Id && payload.user2Id) {
        const isMutual = (payload.user1Id === currentUserId && payload.user2Id === activeChatId) ||
                         (payload.user1Id === activeChatId && payload.user2Id === currentUserId);
        if (chatType === 'user' && isMutual) {
          setMessages([]);
        }
        const otherId = payload.user1Id === currentUserId ? payload.user2Id : payload.user1Id;
        setUsers(prev => prev.map(u => u.id === otherId ? { ...u, lastMessage: null } : u));
      }
    };

    // 4. Canal Excluído
    const onTeamChannelDeleted = (payload: { channelId: string }) => {
      setChannels(prev => prev.filter(c => c.id !== payload.channelId));
      if (activeChatId === payload.channelId) {
        setActiveChatId(null);
        toast.info("O canal foi excluído.");
      }
    };

    socket.on('newTeamMessage', onNewTeamMessage);
    socket.on('teamMessageDeleted', onTeamMessageDeleted);
    socket.on('teamHistoryCleared', onTeamHistoryCleared);
    socket.on('teamChannelDeleted', onTeamChannelDeleted);

    return () => {
      socket.off('newTeamMessage', onNewTeamMessage);
      socket.off('teamMessageDeleted', onTeamMessageDeleted);
      socket.off('teamHistoryCleared', onTeamHistoryCleared);
      socket.off('teamChannelDeleted', onTeamChannelDeleted);
    };
  }, [socket, activeChatId, chatType, currentUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  // Filtragem Dinâmica de Colaboradores
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.id === currentUserId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesRole = u.role?.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        const matchesMsg = u.lastMessage?.content?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRole && !matchesDept && !matchesMsg) return false;
      }

      if (selectedDepartment !== 'all') {
        if (u.department?.toLowerCase() !== selectedDepartment.toLowerCase()) return false;
      }

      if (onlyOnline && !u.isOnline) return false;

      return true;
    });
  }, [users, searchQuery, selectedDepartment, onlyOnline, currentUserId]);

  // Filtragem Dinâmica de Equipes / Canais
  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesDept = c.department?.toLowerCase().includes(q);
        const matchesMsg = c.lastMessage?.content?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesDept && !matchesMsg) return false;
      }
      return true;
    });
  }, [channels, searchQuery]);

  const activeUser = chatType === 'user' ? users.find(u => u.id === activeChatId) : null;
  const activeChannel = chatType === 'channel' ? channels.find(c => c.id === activeChatId) : null;
  const onlineUsersCount = users.filter(u => u.isOnline && u.id !== currentUserId).length;
  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

  return (
    <div className="flex h-full w-full bg-[#0B1224] overflow-hidden text-slate-100">
      
      {/* 1. BARRA LATERAL (LISTAGEM DE DIÁLOGOS PADRÃO VERSUS - 340px) */}
      <div className={`w-full md:w-[340px] flex-shrink-0 bg-[#0F172A] border-r border-slate-800 flex-col overflow-hidden z-10 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Topo: Título + Badge Online + Botão Novo Chat (+) */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-white tracking-tight">Chat Interno</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {onlineUsersCount} online
            </span>
          </div>

          {/* Botão de Ação Rápida (+) */}
          <button 
            onClick={() => setShowNewChatModal(true)}
            title={activeTab === 'users' ? "Iniciar Nova Conversa" : "Criar Novo Canal de Equipe"}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)] transition-all cursor-pointer flex items-center justify-center active:scale-95"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 1.1 ESTRUTURA DE ABAS SUPERIORES ([Colaboradores] | [Equipes]) */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex bg-[#1E293B] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#0B1224] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon size={14} />
              <span>Colaboradores</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                searchQuery.trim()
                  ? filteredUsers.length > 0 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-slate-800 text-slate-500'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {searchQuery.trim() ? filteredUsers.length : users.filter(u => u.id !== currentUserId).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'channels'
                  ? 'bg-[#0B1224] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hash size={14} />
              <span>Equipes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                searchQuery.trim()
                  ? filteredChannels.length > 0 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-slate-800 text-slate-500'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {searchQuery.trim() ? filteredChannels.length : channels.length}
              </span>
            </button>
          </div>
        </div>

        {/* 1.2 BARRA DE FILTROS E BUSCA */}
        <div className="p-4 pt-2 space-y-2.5 border-b border-slate-800/80">
          {/* Input de Busca Reativo */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              className="w-full bg-[#1E293B] border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-[#0B1224] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                title="Limpar busca (Esc)"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtro por Setor/Equipe + Filtro de Status Online */}
          {activeTab === 'users' && (
            <div className="flex items-center gap-1.5">
              {/* Dropdown de Setor */}
              <div className="relative flex-1">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full appearance-none bg-[#1E293B] border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-medium outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Todos os setores</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>

              {/* Botão de Toggle [Online] */}
              <button
                onClick={() => setOnlyOnline(prev => !prev)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  onlyOnline
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-[#1E293B] border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
                title="Filtrar colaboradores conectados"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${onlyOnline ? 'bg-white' : 'bg-emerald-400'}`}></span>
                <span>Online</span>
              </button>
            </div>
          )}
        </div>

        {/* 1.3 LISTAGEM E CARDS DE DIÁLOGO */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-800 flex items-center gap-3 animate-pulse bg-slate-800/20">
                <div className="w-10 h-10 rounded-full bg-slate-700/50 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 bg-slate-700/50 rounded"></div>
                  <div className="h-2 w-40 bg-slate-700/30 rounded"></div>
                </div>
              </div>
            ))
          ) : activeTab === 'users' ? (
            filteredUsers.length === 0 ? (
              searchQuery.trim() ? (
                /* Empty State de Busca Ativa em Colaboradores */
                <div className="py-10 px-4 flex flex-col items-center text-center animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-blue-400 mb-3 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Search size={22} className="opacity-90" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Nenhum colaborador encontrado</h4>
                  <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed mb-3">
                    Não encontramos colaboradores ou conversas para <span className="text-blue-300 font-semibold">"{searchQuery}"</span>.
                  </p>

                  {filteredChannels.length > 0 && (
                    <button
                      onClick={() => setActiveTab('channels')}
                      className="mb-3 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Hash size={12} />
                      <span>Ver {filteredChannels.length} canal(is) em Equipes</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-700 shadow-sm"
                  >
                    <X size={13} />
                    <span>Limpar busca</span>
                  </button>
                </div>
              ) : (
                /* Empty State Padrão sem Busca */
                <div className="text-center py-10 px-4 text-slate-500 text-xs flex flex-col items-center">
                  <Users size={32} className="mb-2 opacity-30 text-slate-400" />
                  <span className="font-medium">Nenhum colaborador encontrado com os filtros aplicados.</span>
                </div>
              )
            ) : (
              filteredUsers.map(u => {
                const isSelected = activeChatId === u.id;
                const lastTime = formatRelativeTime(u.lastMessage?.createdAt);
                const isFromMe = u.lastMessage?.senderId === currentUserId;

                return (
                  <div
                    key={u.id}
                    onClick={() => loadMessages(u.id, 'user')}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 relative group border ${
                      isSelected
                        ? 'bg-[#1E293B] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'border-transparent hover:bg-slate-800/50 hover:border-slate-800'
                    }`}
                  >
                    {/* Avatar com Dot de Status Online/Offline */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                        {u.name?.substring(0, 2).toUpperCase() || 'CO'}
                      </div>
                      <span 
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F172A] ${
                          u.isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-500'
                        }`} 
                        title={u.isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    {/* Informações do Colaborador */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-400' : 'text-slate-100'}`}>
                          {u.name}
                        </h3>
                        {lastTime && (
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                            {lastTime}
                          </span>
                        )}
                      </div>

                      {/* Tag do Setor + Cargo */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {u.department ? (
                          <span 
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                            style={{ 
                              backgroundColor: `${u.departmentColor || '#3b82f6'}15`,
                              borderColor: `${u.departmentColor || '#3b82f6'}30`,
                              color: u.departmentColor || '#60a5fa'
                            }}
                          >
                            {u.department}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium bg-slate-800 px-1.5 py-0.2 rounded">
                            {u.role || 'Geral'}
                          </span>
                        )}
                      </div>

                      {/* Trecho da Última Mensagem */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          {isFromMe && <CheckCheck size={12} className="text-blue-400 shrink-0" />}
                          <span>{u.lastMessage?.content || 'Clique para iniciar conversa'}</span>
                        </p>
                        {!!u.unreadCount && u.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                            {u.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* ABA EQUIPES / CANAIS */
            filteredChannels.length === 0 ? (
              searchQuery.trim() ? (
                /* Empty State de Busca Ativa em Canais */
                <div className="py-10 px-4 flex flex-col items-center text-center animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-blue-400 mb-3 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Search size={22} className="opacity-90" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Nenhum canal encontrado</h4>
                  <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed mb-3">
                    Não encontramos nenhum canal ou equipe para <span className="text-blue-300 font-semibold">"{searchQuery}"</span>.
                  </p>

                  {filteredUsers.length > 0 && (
                    <button
                      onClick={() => setActiveTab('users')}
                      className="mb-3 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserIcon size={12} />
                      <span>Ver {filteredUsers.length} colaborador(es)</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-700 shadow-sm"
                    >
                      <X size={13} />
                      <span>Limpar busca</span>
                    </button>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                    >
                      + Criar Canal
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty State Padrão sem Canais */
                <div className="text-center py-10 px-4 text-slate-500 text-xs flex flex-col items-center">
                  <Hash size={32} className="mb-2 opacity-30 text-slate-400" />
                  <span>Nenhum canal de equipe encontrado.</span>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                  >
                    Criar primeiro canal
                  </button>
                </div>
              )
            ) : (
              filteredChannels.map(c => {
                const isSelected = activeChatId === c.id;
                const lastTime = formatRelativeTime(c.lastMessage?.createdAt);

                return (
                  <div
                    key={c.id}
                    onClick={() => loadMessages(c.id, 'channel')}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 relative group border ${
                      isSelected
                        ? 'bg-[#1E293B] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'border-transparent hover:bg-slate-800/50 hover:border-slate-800'
                    }`}
                  >
                    {/* Ícone de Canal */}
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      {c.isPrivate ? <ShieldCheck size={18} /> : <Hash size={18} />}
                    </div>

                    {/* Informações da Equipe */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className={`text-xs font-bold truncate flex items-center gap-1 ${isSelected ? 'text-blue-400' : 'text-slate-100'}`}>
                          <span>#{c.name}</span>
                          {c.isPrivate && <span className="text-[9px] text-slate-400">(Privado)</span>}
                        </h3>
                        {lastTime && (
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                            {lastTime}
                          </span>
                        )}
                      </div>

                      {c.description && (
                        <p className="text-[10px] text-slate-400 truncate mb-1">{c.description}</p>
                      )}

                      {/* Trecho da Última Mensagem */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          {c.lastMessage?.sender && (
                            <strong className="text-slate-300 font-semibold">{c.lastMessage.sender.name}:</strong>
                          )}
                          <span>{c.lastMessage?.content || 'Canal de comunicação'}</span>
                        </p>
                        {!!c.unreadCount && c.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* 2. PAINEL CENTRAL: CHAT & DIÁLOGO */}
      {activeChatId ? (
        <div className="flex-1 flex flex-col bg-[#0B1224] overflow-hidden relative">
          
          {/* Header do Chat Ativo */}
          <div className="h-16 px-4 md:px-6 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Botão Voltar no Mobile */}
              <button
                onClick={() => setActiveChatId(null)}
                className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Voltar à lista"
              >
                <ArrowLeft size={18} />
              </button>

              {chatType === 'user' && activeUser ? (
                <>
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-white text-sm">
                      {activeUser.name?.substring(0, 2).toUpperCase() || 'CO'}
                    </div>
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F172A] ${
                        activeUser.isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-500'
                      }`} 
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white truncate">{activeUser.name}</h2>
                      {activeUser.department && (
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {activeUser.department}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeUser.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{activeUser.isOnline ? 'Disponível agora' : 'Desconectado'}</span>
                    </p>
                  </div>
                </>
              ) : activeChannel ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                    {activeChannel.isPrivate ? <ShieldCheck size={20} /> : <Hash size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                      <span>#{activeChannel.name}</span>
                      {activeChannel.isPrivate && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Privado
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400 truncate">
                      {activeChannel.description || 'Canal de comunicação corporativa da equipe'}
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            {/* Ações do Header (Atualizar + Menu de Opções) */}
            <div className="flex items-center gap-1 relative">
              <button 
                onClick={() => loadMessages(activeChatId, chatType)}
                title="Atualizar histórico"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={17} className={isLoadingMessages ? "animate-spin text-blue-400" : ""} />
              </button>

              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChatMenu(prev => !prev);
                  }}
                  title="Opções da conversa"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    showChatMenu ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <MoreVertical size={18} />
                </button>

                {/* Dropdown de Opções */}
                {showChatMenu && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Gerenciar Conversa
                    </div>

                    {/* Limpar Histórico de Mensagens */}
                    <button
                      onClick={() => {
                        setShowChatMenu(false);
                        setShowClearHistoryModal(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} className="text-rose-400" />
                      <span>Limpar Histórico</span>
                    </button>

                    {/* Excluir Canal (Apenas se for Canal e Usuário for Admin) */}
                    {chatType === 'channel' && activeChannel && isAdmin && (
                      <button
                        onClick={() => {
                          setShowChatMenu(false);
                          setChannelToDelete(activeChannel);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 border-t border-slate-800/80 transition-colors cursor-pointer"
                      >
                        <AlertTriangle size={14} className="text-rose-500" />
                        <span>Excluir Canal #{activeChannel.name}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
            {isLoadingMessages ? (
              <div className="space-y-4 py-6 animate-pulse">
                <div className="flex gap-3 max-w-[60%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-20 bg-slate-800 rounded"></div>
                    <div className="h-10 bg-slate-800/70 rounded-2xl"></div>
                  </div>
                </div>
                <div className="flex gap-3 max-w-[60%] ml-auto justify-end">
                  <div className="h-12 w-64 bg-slate-800/70 rounded-2xl"></div>
                </div>
                <div className="flex gap-3 max-w-[50%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
                  <div className="h-9 w-48 bg-slate-800/70 rounded-2xl"></div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 gap-2 py-16">
                <MessageSquare size={44} className="opacity-20" />
                <p className="text-sm font-medium text-slate-400">Nenhuma mensagem nesta conversa ainda.</p>
                <p className="text-xs text-slate-500">Envie uma mensagem abaixo para iniciar o diálogo interno.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const fromMe = msg.senderId === currentUserId;
                const canDelete = fromMe || isAdmin;
                const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={msg.id || idx} 
                    className={`flex gap-2.5 max-w-[85%] md:max-w-[70%] group ${fromMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {!fromMe && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-[11px] shrink-0 mt-0.5 shadow-sm">
                        {msg.sender?.name?.substring(0, 2).toUpperCase() || 'CO'}
                      </div>
                    )}

                    <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} relative min-w-[120px]`}>
                      {/* Remetente em Canais de Equipe */}
                      {!fromMe && chatType === 'channel' && (
                        <span className="text-[11px] font-bold text-blue-400 mb-1 px-1">
                          {msg.sender?.name}
                        </span>
                      )}

                      {/* Container do Balão + Ação de Excluir */}
                      <div className="relative group/msg flex items-center gap-1.5">
                        
                        {/* Botão de Excluir Mensagem Individual (visível no hover) */}
                        {canDelete && (
                          <button
                            onClick={() => setMessageToDelete(msg)}
                            title="Excluir esta mensagem"
                            className={`opacity-0 group-hover/msg:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer ${
                              fromMe ? 'order-first' : 'order-last'
                            }`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        {/* Balão de Mensagem */}
                        <div 
                          className={`px-4 py-2.5 text-sm relative break-words leading-relaxed shadow-sm ${
                            fromMe 
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs shadow-[0_2px_10px_rgba(37,99,235,0.2)]' 
                              : 'bg-[#1E293B] border border-slate-700/60 text-slate-100 rounded-2xl rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          
                          <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${fromMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            <span>{timeString}</span>
                            {fromMe && <CheckCheck size={13} className="text-blue-200" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer / Campo de Digitação */}
          <div className="p-3 md:p-4 border-t border-slate-800 bg-[#0F172A] shrink-0">
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-2 flex items-end gap-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-sm">
              <button 
                type="button"
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors shrink-0"
                title="Anexar arquivo"
              >
                <Paperclip size={18} />
              </button>

              <textarea 
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  chatType === 'user' 
                    ? `Enviar mensagem para ${activeUser?.name || 'colega'}...` 
                    : `Conversar no canal #${activeChannel?.name || 'equipe'}...`
                }
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none resize-none py-2 max-h-32 custom-scrollbar leading-relaxed"
              />

              <button 
                type="button"
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors shrink-0"
                title="Emojis"
              >
                <Smile size={18} />
              </button>

              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_12px_rgba(37,99,235,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer active:scale-95"
                title="Enviar mensagem (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Pressione <strong>Enter</strong> para enviar ou <strong>Shift + Enter</strong> para quebra de linha.
            </p>
          </div>
        </div>
      ) : (
        /* Estado Vazio Quando Nenhuma Conversa Está Selecionada */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-500 bg-[#0B1224] p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl mb-4">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">Comunicação Interna da Equipe</h2>
          <p className="max-w-md text-center text-xs text-slate-400 leading-relaxed mb-6">
            Converse diretamente com seus colegas de equipe ou colabore nos canais de departamentos em tempo real.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setActiveTab('users');
                if (filteredUsers.length > 0) {
                  loadMessages(filteredUsers[0].id, 'user');
                }
              }}
              className="px-4 py-2 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <Users size={14} className="text-blue-400" />
              <span>Ver Colaboradores</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('channels');
                setShowNewChatModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Criar Novo Canal</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EXCLUSÃO DE MENSAGEM INDIVIDUAL */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Excluir Mensagem?</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Esta ação removerá a mensagem definitivamente para todos os colaboradores da conversa.
              </p>
              
              <div className="p-3 bg-[#1E293B] rounded-xl border border-slate-800 mb-4 text-xs text-slate-300 italic line-clamp-3">
                "{messageToDelete.content}"
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeletingMessage}
                  onClick={() => setMessageToDelete(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingMessage}
                  onClick={handleConfirmDeleteMessage}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isDeletingMessage ? "Excluindo..." : "Sim, Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIMPAR HISTÓRICO DE CONVERSA */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {chatType === 'channel' ? `Limpar Histórico de #${activeChannel?.name}?` : `Limpar Conversa com ${activeUser?.name}?`}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                Todas as mensagens gravadas neste diálogo serão apagadas permanentemente. Esta ação não poderá ser desfeita.
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isClearingHistory}
                  onClick={() => setShowClearHistoryModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isClearingHistory}
                  onClick={handleConfirmClearHistory}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isClearingHistory ? "Limpando..." : "Limpar Tudo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCLUSÃO DE CANAL DE EQUIPE */}
      {channelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Excluir Canal #{channelToDelete.name}?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                O canal e todas as suas mensagens serão excluídos permanentemente do banco de dados para toda a equipe.
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeletingChannel}
                  onClick={() => setChannelToDelete(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingChannel}
                  onClick={handleConfirmDeleteChannel}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isDeletingChannel ? "Excluindo..." : "Excluir Canal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NOVA CONVERSA / NOVO CANAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-800 bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  {activeTab === 'users' ? <UserIcon size={16} /> : <Hash size={16} />}
                </div>
                <h3 className="text-base font-bold text-white">
                  {activeTab === 'users' ? 'Iniciar Conversa Direta' : 'Criar Canal de Equipe'}
                </h3>
              </div>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              {activeTab === 'users' ? (
                /* Modal de Seleção de Colaborador */
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Selecione um membro da sua equipe para abrir o chat individual:
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {users.filter(u => u.id !== currentUserId).map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setShowNewChatModal(false);
                          loadMessages(u.id, 'user');
                        }}
                        className="p-2.5 rounded-xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {u.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{u.name}</h4>
                            <p className="text-[10px] text-slate-400">{u.department || u.role || 'Colaborador'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                          Conversar
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Modal de Criação de Canal */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Canal</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">#</span>
                      <input 
                        type="text"
                        placeholder="ex: comercial-vendas, avisos-gerais"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Descrição (Opcional)</label>
                    <textarea 
                      rows={2}
                      placeholder="Qual é o propósito deste canal?"
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="p-3 bg-[#1E293B] border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>Canal Privado</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Somente membros convidados poderão visualizar</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={newChannelPrivate}
                      onChange={(e) => setNewChannelPrivate(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleCreateChannel}
                    disabled={isCreatingChannel || !newChannelName.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingChannel ? 'Criando Canal...' : 'Confirmar e Criar Canal'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
