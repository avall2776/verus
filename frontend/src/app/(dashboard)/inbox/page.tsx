"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, BrainCircuit, Lock, Image as ImageIcon, FileText, Mic, X } from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function InboxPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'waiting' | 'active' | 'resolved'>('active');
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { socket, isConnected, clearGlobalUnread } = useSocket();

  const { data: initialContacts, isLoading, error: fetchErrorQuery } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/conversations');
      return data.map((conv: any) => {
        const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : 'Nova conversa';
        return {
          id: conv.id,
          contactId: conv.contact.id,
          name: conv.contact.name,
          phone: conv.contact.phone,
          email: conv.contact.email,
          lastMsg: lastMsg,
          time: new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: conv.status === 'bot_active',
          unread: 0,
          status: conv.status
        };
      });
    },
    retry: false,
    refetchOnWindowFocus: false, // Prevents overwriting local websocket state on focus
  });

  // 1. Sincronizar dados do React Query com o estado local
  useEffect(() => {
    clearGlobalUnread();
    if (initialContacts) {
      setContacts(prev => {
        // Only update if we don't have contacts yet to prevent overwriting websocket changes
        if (prev.length === 0) {
          return initialContacts;
        }
        return prev; // Very basic merge strategy to avoid losing unread state
      });
      if (initialContacts.length > 0) {
        setActiveChat(prev => prev ? prev : initialContacts[0].id);
      }
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
        setMessages((prev) => [...prev, data]);
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

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, activeChat]);

  // Derivar contato ativo
  const activeContactData = contacts.find(c => c.id === activeChat);

  const handleTakeover = async () => {
    if (!activeChat) return;
    try {
      await api.patch(`/conversations/${activeChat}/takeover`);
      // Atualiza o state local para refletir a mudança
      setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, isAi: false, status: 'human_takeover' } : c));
    } catch (error) {
      console.error("Erro ao assumir conversa", error);
    }
  };

  const handleRelease = async () => {
    if (!activeChat) return;
    try {
      await api.patch(`/conversations/${activeChat}/release`);
      setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, isAi: false, status: 'resolved' } : c));
    } catch (error) {
      console.error("Erro ao finalizar conversa", error);
    }
  };

  const handleSendMessage = async () => {
    if (!activeChat || (!inputText.trim() && !selectedFile)) return;
    
    const content = inputText;
    setInputText(""); // limpa o input
    setShowAttachments(false);
    setSelectedFile(null);
    
    // WIP: Lógica de upload p/ Supabase
    let mediaUrl = null;
    let type = 'text';
    if (selectedFile) {
      // Mocked URL. In production, upload to Supabase Storage 'versus-media' bucket
      mediaUrl = `https://storage.supabase.com/versus-media/${selectedFile.name}`;
      type = selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('audio/') ? 'audio' : 'document';
    }

    try {
      const payload = { 
        content: content || (selectedFile ? selectedFile.name : ''),
        isInternal: isInternalMode,
        type,
        mediaUrl
      };
      
      const { data } = await api.post(`/conversations/${activeChat}/messages`, payload);
      setMessages(prev => [...prev, data]);
      
      // Auto-assume a conversa se era robô, já que um humano mandou a mensagem
      if (!isInternalMode) {
        setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, isAi: false, status: 'human_takeover', lastMsg: content } : c));
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowAttachments(false);
    }
  };

  // Filter contacts based on active tab
  const filteredContacts = contacts.filter(c => {
    if (activeTab === 'waiting') return c.status === 'waiting' || c.status === 'open';
    if (activeTab === 'active') return c.status === 'bot_active' || c.status === 'human_takeover';
    if (activeTab === 'resolved') return c.status === 'resolved';
    return true;
  });

  // Calcular total de contatos com mensagens não lidas
  const unreadCount = contacts.filter(c => c.unread > 0).length;

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
              placeholder="Pesquisar..." 
              className="w-full bg-[#1E293B] border border-gray-700/50 rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent/50 focus:bg-[#0B1224] transition-all"
            />
          </div>
          
          {/* Abas Estilo Lero */}
          <div className="flex gap-1 bg-[#1E293B] p-1 rounded-lg mt-1">
            <button 
              onClick={() => setActiveTab('waiting')}
              className={`flex-1 text-xs py-1.5 rounded shadow-sm flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'waiting' ? 'font-bold bg-[#0B1224] text-white' : 'font-semibold text-gray-400 hover:text-gray-200'
              }`}
            >
              Aguardando
            </button>
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'active' ? 'font-bold bg-[#0B1224] text-white shadow-sm' : 'font-semibold text-gray-400 hover:text-gray-200'
              }`}
            >
              Ativos
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('resolved')}
              className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'resolved' ? 'font-bold bg-[#0B1224] text-white shadow-sm' : 'font-semibold text-gray-400 hover:text-gray-200'
              }`}
            >
              Fechados
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
                {contact.name.charAt(0)}
                {/* Indicador de quem está atendendo */}
                {contact.isAi ? (
                  <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-0.5 border-2 border-panel shadow-[0_0_5px_rgba(0,210,255,0.8)]">
                    <Bot size={10} className="text-background" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-panel shadow-[0_0_5px_rgba(34,197,94,0.8)]">
                    <User size={10} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`text-sm font-bold truncate ${activeChat === contact.id ? 'text-white' : 'text-gray-300'}`}>{contact.name}</h3>
                  <span className={`text-[0.65rem] ${contact.unread > 0 ? 'text-accent font-bold' : 'text-gray-500'}`}>{contact.time}</span>
                </div>
                <p className="text-xs text-text-secondary truncate pr-4">{contact.lastMsg}</p>
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

        {/* Chat Header */}
        <div className="h-16 px-4 border-b border-gray-800 flex items-center justify-between bg-[#0F172A] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold">
              {activeContactData ? activeContactData.name.charAt(0) : 'C'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{activeContactData ? activeContactData.name : 'Selecione um chat'}</h2>
              {activeContactData?.isAi && (
                <div className="flex items-center gap-1.5 text-xs text-accent">
                  <BrainCircuit size={12} className="animate-pulse" />
                  <span>IA Vitor conversando...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeContactData?.status === 'bot_active' ? (
              <button onClick={handleTakeover} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)]">
                Assumir Conversa
              </button>
            ) : activeContactData?.status === 'human_takeover' ? (
              <button onClick={handleRelease} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                Finalizar Atendimento
              </button>
            ) : (
              <span className="text-gray-500 text-xs font-bold px-4 py-2 bg-gray-800 rounded-lg">
                Resolvido
              </span>
            )}
            <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 z-10">
          
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Bot size={40} className="text-gray-700" />
              <p>Aguardando mensagens ao vivo...</p>
              <p className="text-xs">Rode o script de simulação no backend!</p>
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

        {/* Chat Input Area */}
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
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
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
                    <span key={tag} className="bg-gray-800 border border-gray-700 text-xs px-2 py-1 rounded-md text-gray-300 flex items-center gap-1">
                      <Tag size={10} /> {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Nenhuma tag.</span>
                )}
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

    </div>
  );
}