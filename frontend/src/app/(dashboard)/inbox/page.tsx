"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, BrainCircuit, Lock, Image as ImageIcon, FileText, Mic, X, ArrowRightLeft, Network } from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export default function InboxPage() {
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

  useEffect(() => {
    // Busca macros na montagem
    api.get('/quick-replies').then(res => setQuickReplies(res.data)).catch(console.error);
  }, []);

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
      setContacts(initialContacts);
      setActiveChat(prev => {
        if (!prev) return null;
        const exists = initialContacts.some((c: any) => c.id === prev);
        return exists ? prev : null;
      });
    }
  }, [initialContacts, clearGlobalUnread]);

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

  const handleTakeover = async () => {
    if (!activeChat) return;
    try {
      await api.patch(`/conversations/${activeChat}/takeover`);
      // O state local será atualizado pelo listener do socket (conversationUpdated)
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
    if (!activeChat) return;
    try {
      await api.patch(`/conversations/${activeChat}/transfer`, { departmentId });
      setShowTransferModal(false);
      setContacts(prev => prev.filter(c => c.id !== activeChat)); // Remove from current view
      setActiveChat(null);
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

  // Filtro de busca sobre os contatos da fila atual
  const filteredContacts = contacts.filter(c => {
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

  return (
    <div className="flex h-full w-full bg-[#0B1224] overflow-hidden">
      
      {/* 1. PAINEL ESQUERDO: Lista de Conversas */}
      <div className="w-[340px] flex-shrink-0 bg-[#0F172A] border-r border-gray-800 flex flex-col overflow-hidden z-10">
        {/* Header Lista */}
        <div className="p-4 border-b border-gray-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Atendimentos</h2>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-white transition-colors"><Filter size={18} /></button>
              <button className="text-gray-400 hover:text-white transition-colors"><MoreVertical size={18} /></button>
            </div>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou telefone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1E293B] border border-gray-700/50 rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50 focus:bg-[#0B1224] transition-all"
            />
          </div>
          
          {/* Abas Estilo Lero */}
          <div className="flex gap-1 bg-[#1E293B] p-1 rounded-lg mt-1">
            <button 
              onClick={() => handleTabChange('waiting')}
              className={`flex-1 text-xs py-1.5 rounded shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'waiting' ? 'font-bold bg-[#0B1224] text-white' : 'font-semibold text-gray-400 hover:text-gray-200'
              }`}
            >
              Aguardando
            </button>
            <button 
              onClick={() => handleTabChange('mine')}
              className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'mine' ? 'font-bold bg-[#0B1224] text-white shadow-sm' : 'font-semibold text-gray-400 hover:text-gray-200'
              }`}
            >
              Meus
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>}
            </button>
            <button 
              onClick={() => handleTabChange('resolved')}
              className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'resolved' ? 'font-bold bg-[#0B1224] text-white shadow-sm' : 'font-semibold text-gray-400 hover:text-gray-200'
              }`}
            >
              Resolvidos
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
              <span className="block mb-2">Nenhum chat nesta fila</span>
            </div>
          ) : (
            filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => {
                setActiveChat(contact.id);
                // Limpa a notificação de piscar quando o usuário clica
                setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, hasNewMessage: false, unread: 0 } : c));
              }}
              className={`p-3 border-b border-gray-800/40 cursor-pointer transition-all hover:bg-gray-800/60 flex items-start gap-3 relative group
                ${activeChat === contact.id ? 'bg-[#1E293B] border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}
                ${contact.hasNewMessage ? 'bg-primary/5 animate-pulse' : ''}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shrink-0 relative">
                {contact.name?.charAt(0) || 'C'}
                {contact.status === 'resolved' || contact.status === 'closed' ? (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(16,185,129,0.8)]">
                    <Lock size={10} className="text-white" />
                  </div>
                ) : contact.isAi ? (
                  <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(0,210,255,0.8)]">
                    <Bot size={10} className="text-background" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-[#0F172A] shadow-[0_0_5px_rgba(34,197,94,0.8)]">
                    <User size={10} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className={`text-sm font-bold truncate ${activeChat === contact.id ? 'text-white' : 'text-gray-200'}`}>
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
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 bg-primary text-[0.6rem] text-white flex items-center justify-center rounded-full font-bold">
                  {contact.unread}
                </div>
              )}
            </div>
          )))}
        </div>
      </div>

      {/* 2. PAINEL CENTRAL: Janela de Chat */}
      <div className="flex-1 bg-background flex flex-col overflow-hidden relative border-r border-gray-800">
        
        {/* Pattern de Fundo Super Sutil via CSS puro */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {!activeChat || !activeContactData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 z-10 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/40 border border-gray-700/50 flex items-center justify-center text-gray-500 mb-2">
              <Bot size={32} />
            </div>
            <p className="text-sm font-semibold text-gray-300">Nenhum atendimento selecionado</p>
            <p className="text-xs text-gray-500 max-w-xs">
              Selecione uma conversa na lista lateral para visualizar as mensagens e interagir com o cliente.
            </p>
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
                  <button onClick={handleTakeover} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)] cursor-pointer">
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
    </div>
  );
}