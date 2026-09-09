"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, BrainCircuit } from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import api from "@/lib/api";

export default function InboxPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { socket, isConnected, clearGlobalUnread } = useSocket();

  // 1. Carga inicial: Buscar lista de conversas
  useEffect(() => {
    // Ao abrir a Caixa de Entrada, limpamos a notificação piscante global da Sidebar
    clearGlobalUnread();
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/conversations');
        // Mapear para o formato do frontend
        const mappedContacts = data.map((conv: any) => {
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
        setContacts(mappedContacts);
        
        // Auto-selecionar a primeira conversa se nenhuma estiver ativa
        if (mappedContacts.length > 0) {
          setActiveChat(prev => prev ? prev : mappedContacts[0].id);
        }
      } catch (error: any) {
        console.error("Erro ao buscar conversas:", error);
        setFetchError(error.message || "Falha de rede (CORS ou Servidor Desligado)");
      }
    };
    fetchConversations();
  }, []);

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

  const handleSendMessage = async () => {
    if (!activeChat || !inputText.trim()) return;
    const content = inputText;
    setInputText(""); // limpa o input
    try {
      const { data } = await api.post(`/conversations/${activeChat}/messages`, { content });
      // Inserimos a mensagem disparada localmente
      setMessages(prev => [...prev, data]);
      
      // Auto-assume a conversa se era robô, já que um humano mandou a mensagem
      setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, isAi: false, status: 'human_takeover', lastMsg: content } : c));
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
    }
  };

  // Calcular total de contatos com mensagens não lidas
  const unreadCount = contacts.filter(c => c.unread > 0).length;

  return (
    <div className="flex h-full w-full gap-4 pb-4 overflow-hidden">
      
      {/* 1. PAINEL ESQUERDO: Lista de Conversas */}
      <div className="w-80 flex-shrink-0 bg-panel/40 border border-gray-800/60 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Header Lista */}
        <div className="p-4 border-b border-gray-800/60 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Mensagens 
            {unreadCount > 0 && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                {unreadCount} {unreadCount === 1 ? 'Nova' : 'Novas'}
              </span>
            )}
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar nas conversas..." 
              className="w-full bg-background border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 text-xs font-semibold bg-primary/20 text-primary py-1.5 rounded-md hover:bg-primary/30 transition-colors">Todos</button>
            <button className="flex-1 text-xs font-semibold bg-gray-800 text-text-secondary py-1.5 rounded-md hover:bg-gray-700 transition-colors">Aguardando</button>
          </div>
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {fetchError && (
            <div className="absolute top-0 left-0 w-full p-3 bg-red-500/20 border-b border-red-500/50 text-red-400 text-xs text-center z-10 font-bold backdrop-blur-md">
              ERRO F5: {fetchError}. O navegador bloqueou o carregamento!
            </div>
          )}
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => {
                setActiveChat(contact.id);
                // Limpa a notificação de piscar quando o usuário clica
                setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, hasNewMessage: false, unread: 0 } : c));
              }}
              className={`p-4 border-b border-gray-800/40 cursor-pointer transition-all hover:bg-gray-800/30 flex items-start gap-3 relative
                ${activeChat === contact.id ? 'bg-gray-800/50 shadow-[inset_3px_0_0_0_rgba(0,210,255,1)]' : ''}
                ${contact.hasNewMessage ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(0,210,255,0.3)] animate-pulse' : ''}
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
          ))}
        </div>
      </div>

      {/* 2. PAINEL CENTRAL: Janela de Chat */}
      <div className="flex-1 bg-panel/30 border border-gray-800/60 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md relative">
        {/* Glow de Fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background/0 to-background/0 pointer-events-none" />

        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-gray-800/60 flex items-center justify-between bg-panel/50 backdrop-blur-xl z-10">
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
            <button onClick={handleTakeover} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,85,255,0.3)]">
              Assumir Conversa
            </button>
            <button className="text-gray-400 hover:text-white transition-colors"><MoreVertical size={20} /></button>
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
                    isMe 
                      ? 'bg-primary/20 text-blue-100 rounded-2xl rounded-tr-sm border-primary/30 shadow-[0_0_15px_rgba(0,85,255,0.1)]' 
                      : 'bg-gray-800/80 text-text-primary rounded-2xl rounded-tl-sm border-gray-700/50'
                  }`}>
                    {isAi && (
                      <div className="absolute -top-3 -right-2 bg-[#0B1224] border border-accent/50 text-accent text-[0.55rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Bot size={10} /> IA VITOR
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

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-800/60 bg-panel/50 backdrop-blur-xl z-10">
          <div className="bg-background border border-gray-800/80 rounded-xl p-2 flex items-end gap-2 focus-within:border-primary/50 transition-colors">
            <button className="p-2 text-gray-400 hover:text-accent transition-colors rounded-lg hover:bg-gray-800/50">
              <Paperclip size={20} />
            </button>
            <textarea 
              placeholder="Digite uma mensagem interna ou assuma a conversa..." 
              className="flex-1 bg-transparent text-sm text-white resize-none outline-none py-2 max-h-32 placeholder:text-gray-600"
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
            <button onClick={handleSendMessage} className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(0,85,255,0.4)] transition-all">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PAINEL DIREITO: Contexto do Lead */}
      <div className="w-72 flex-shrink-0 bg-panel/40 border border-gray-800/60 rounded-2xl flex flex-col overflow-y-auto backdrop-blur-xl">
        <div className="p-6 flex flex-col items-center border-b border-gray-800/60">
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
                <span className="bg-gray-800 border border-gray-700 text-xs px-2 py-1 rounded-md text-gray-300 flex items-center gap-1">
                  <Tag size={10} /> B2B
                </span>
              </div>
            </div>

            {/* CRM Status */}
            <div className="bg-[#0B1224]/80 border border-gray-800/60 rounded-xl p-4 mt-2">
              <h3 className="text-[0.7rem] uppercase tracking-widest font-bold text-gray-500 mb-2">Status da Conversa</h3>
              <div className={`w-full text-center py-2 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(0,0,0,0.15)] cursor-pointer transition-colors ${
                activeContactData.status === 'bot_active' 
                  ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30' 
                  : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              }`}>
                {activeContactData.status === 'bot_active' ? 'IA Atendendo' : 'Atendimento Humano'}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}