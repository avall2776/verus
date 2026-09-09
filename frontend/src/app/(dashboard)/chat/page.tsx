"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { Bot, User as UserIcon, Send, Hand, RotateCcw, MessageSquare } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'bot_active', 'human_takeover'
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/conversations${filter !== 'all' ? `?status=${filter}` : ''}`);
      setConversations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/conversations/${id}/messages`);
      setMessages(res.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Polling leve
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      const interval = setInterval(() => fetchMessages(activeConversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  const handleTakeover = async () => {
    if (!activeConversation) return;
    await api.patch(`/conversations/${activeConversation.id}/takeover`);
    setActiveConversation({ ...activeConversation, status: 'human_takeover' });
    fetchConversations();
  };

  const handleRelease = async () => {
    if (!activeConversation) return;
    await api.patch(`/conversations/${activeConversation.id}/release`);
    setActiveConversation({ ...activeConversation, status: 'bot_active' });
    fetchConversations();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const oldText = inputText;
    setInputText("");
    
    // Otimista
    setMessages([...messages, { id: Date.now(), content: oldText, direction: 'OUTBOUND', senderType: 'user', createdAt: new Date() }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      await api.post(`/conversations/${activeConversation.id}/messages`, { content: oldText });
      if (activeConversation.status === 'bot_active') {
        setActiveConversation({ ...activeConversation, status: 'human_takeover' });
      }
      fetchMessages(activeConversation.id);
      fetchConversations();
    } catch (e) {
      console.error("Falha ao enviar mensagem", e);
    }
  };

  return (
    <div className="flex h-full w-full bg-background text-text-primary">
      {/* Sidebar de Conversas */}
      <div className="w-80 border-r border-gray-800 bg-panel flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-bold text-lg">Inbox</h2>
          <select 
            className="bg-background border border-gray-700 text-sm rounded-md p-1 outline-none text-text-secondary"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="bot_active">Com IA</option>
            <option value="human_takeover">Transbordo</option>
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              onClick={() => setActiveConversation(conv)}
              className={cn(
                "p-4 border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30 transition-colors",
                activeConversation?.id === conv.id && "bg-gray-800/50 border-l-4 border-l-primary"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-text-primary truncate">
                  {conv.contact?.name || conv.contact?.phone}
                </span>
                <span className="text-xs text-text-secondary">
                  {format(new Date(conv.lastMessageAt), 'HH:mm')}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-text-secondary truncate">{conv.contact?.phone}</span>
                {conv.status === 'bot_active' ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                    <Bot size={12} /> IA Ativa
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    <UserIcon size={12} /> Humano
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel Central (Mensagens) */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="h-16 border-b border-gray-800 bg-panel px-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-primary font-bold">
                  {(activeConversation.contact?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold">{activeConversation.contact?.name || activeConversation.contact?.phone}</h3>
                  <span className="text-xs text-text-secondary">{activeConversation.contact?.phone}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {activeConversation.status === 'bot_active' ? (
                  <button 
                    onClick={handleTakeover}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-md shadow-primary/20"
                  >
                    <Hand size={16} /> Assumir Conversa
                  </button>
                ) : (
                  <button 
                    onClick={handleRelease}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-gray-700"
                  >
                    <RotateCcw size={16} /> Devolver p/ IA
                  </button>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {messages.map((msg: any) => {
                const isInbound = msg.direction === 'INBOUND';
                const isSystem = msg.senderType === 'system';
                
                return (
                  <div key={msg.id} className={cn("flex w-full", isInbound ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[70%] rounded-2xl p-3 shadow-sm",
                      isInbound 
                        ? "bg-panel text-text-primary rounded-tl-sm border border-gray-800" 
                        : isSystem
                          ? "bg-brand-gradient text-white rounded-tr-sm"
                          : "bg-gray-700 text-white rounded-tr-sm"
                    )}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] opacity-70">
                          {format(new Date(msg.createdAt), 'HH:mm')} 
                          {!isInbound && (isSystem ? ' • Robô' : ' • Você')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-panel border-t border-gray-800">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={activeConversation.status === 'bot_active' ? "Digite para assumir o controle automaticamente..." : "Digite sua mensagem..."}
                  className="flex-1 bg-background border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="bg-primary text-white w-12 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary flex-col gap-4">
            <MessageSquare size={48} className="opacity-20" />
            <p>Selecione uma conversa para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
