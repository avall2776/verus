"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Hash, Plus, MessageSquare, Send, Paperclip, Smile, Image as ImageIcon, CheckCircle2, ChevronDown, User as UserIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSocket } from "@/components/ui/SocketProvider";

interface TeamUser {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
}

interface TeamChannel {
  id: string;
  name: string;
  isPrivate: boolean;
}

interface TeamMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string };
}

export default function TeamChatPage() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>('users');
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [channels, setChannels] = useState<TeamChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat State
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatType, setChatType] = useState<'user' | 'channel'>('user');
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsersAndChannels();
  }, []);

  const fetchUsersAndChannels = async () => {
    try {
      setIsLoading(true);
      const [uRes, cRes] = await Promise.all([
        api.get('/team-chat/users'),
        api.get('/team-chat/channels')
      ]);
      setUsers(uRes.data);
      setChannels(cRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados do chat");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (id: string, type: 'user' | 'channel') => {
    setActiveChatId(id);
    setChatType(type);
    try {
      const queryParam = type === 'channel' ? `channelId=${id}` : `receiverId=${id}`;
      const res = await api.get(`/team-chat/messages?${queryParam}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      toast.error("Erro ao carregar histórico");
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeChatId) return;
    try {
      const payload = chatType === 'channel' 
        ? { channelId: activeChatId, content: inputValue } 
        : { receiverId: activeChatId, content: inputValue };

      await api.post('/team-chat/messages', payload);
      setInputValue('');
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const onNewMessage = (msg: TeamMessage & { receiverId?: string, channelId?: string }) => {
      const isCurrentChannel = chatType === 'channel' && msg.channelId === activeChatId;
      const isCurrentUser = chatType === 'user' && (msg.senderId === activeChatId || msg.receiverId === activeChatId);
      
      if (isCurrentChannel || isCurrentUser) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    };
    
    socket.on('newTeamMessage', onNewMessage);
    return () => { socket.off('newTeamMessage', onNewMessage); };
  }, [socket, activeChatId, chatType]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeUser = chatType === 'user' ? users.find(u => u.id === activeChatId) : null;
  const activeChannel = chatType === 'channel' ? channels.find(c => c.id === activeChatId) : null;

  if (isLoading) {
    return <div className="flex-1 bg-[#050A15] p-6 text-center text-gray-500 pt-20 h-screen flex items-center justify-center">Carregando chat da equipe...</div>;
  }

  if (channels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050A15] p-6 text-gray-500 h-screen">
        <MessageSquare size={48} className="mb-4 opacity-50" />
        <p>Nenhum canal interno disponível.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#050A15]">
      {/* SIDEBAR */}
      <div className="w-[320px] bg-[#0B1224] border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white mb-4">Chat Interno</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar colegas ou equipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050A15] border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex text-sm font-semibold border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Colaboradores
          </button>
          <button 
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'channels' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Equipes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {activeTab === 'users' && filteredUsers.map(user => (
            <div 
              key={user.id} 
              onClick={() => loadMessages(user.id, 'user')}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeChatId === user.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-gray-800/50 border border-transparent'}`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white uppercase">
                  {user.name.substring(0,2)}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B1224] ${user.isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className={`text-sm font-bold truncate ${activeChatId === user.id ? 'text-blue-400' : 'text-gray-200'}`}>{user.name}</h4>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
          ))}

          {activeTab === 'channels' && (
            <>
              <button className="w-full flex items-center gap-2 text-blue-400 p-3 hover:bg-gray-800/50 rounded-lg transition-colors text-sm font-semibold mb-2">
                <Plus size={16} />
                Criar Nova Equipe
              </button>
              {filteredChannels.map(channel => (
                <div 
                  key={channel.id} 
                  onClick={() => loadMessages(channel.id, 'channel')}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeChatId === channel.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-gray-800/50 border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400">
                    {channel.isPrivate ? <ShieldCheck size={18} /> : <Hash size={18} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`text-sm font-bold truncate ${activeChatId === channel.id ? 'text-blue-400' : 'text-gray-200'}`}>{channel.name}</h4>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      {activeChatId ? (
        <div className="flex-1 flex flex-col bg-[#050A15]">
          {/* Header */}
          <div className="h-16 border-b border-gray-800 bg-[#0B1224] px-6 flex items-center gap-4 shrink-0">
            {chatType === 'user' && activeUser ? (
              <>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white uppercase">
                    {activeUser.name.substring(0,2)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B1224] ${activeUser.isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                </div>
                <div>
                  <h3 className="text-white font-bold">{activeUser.name}</h3>
                  <p className="text-xs text-emerald-500 font-medium">{activeUser.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </>
            ) : activeChannel ? (
              <>
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-blue-400">
                  {activeChannel.isPrivate ? <ShieldCheck size={20} /> : <Hash size={20} />}
                </div>
                <div>
                  <h3 className="text-white font-bold">{activeChannel.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">Canal de Comunicação</p>
                </div>
              </>
            ) : null}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => {
              const fromMe = false;
              return (
                <div key={msg.id || idx} className={`flex gap-3 ${fromMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0 mt-1">
                    {msg.sender.name.substring(0,2)}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${fromMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-300">{msg.sender.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${fromMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#0B1224] border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-4 border-t border-gray-800 bg-[#0B1224] shrink-0">
            <div className="bg-[#050A15] border border-gray-700 rounded-xl p-2 flex items-center gap-2 focus-within:border-blue-500 transition-colors">
              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <Paperclip size={20} />
              </button>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escreva sua mensagem..."
                className="flex-1 bg-transparent text-white focus:outline-none px-2"
              />
              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <Smile size={20} />
              </button>
              <button 
                onClick={sendMessage}
                disabled={!inputValue.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#050A15]">
          <MessageSquare size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2">Comunicação Interna</h2>
          <p className="max-w-sm text-center">Selecione um colega ou canal no menu lateral para iniciar uma conversa.</p>
        </div>
      )}
    </div>
  );
}
