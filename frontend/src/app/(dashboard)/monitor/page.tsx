"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, CheckCircle, Clock, Filter, MessageSquare, UserPlus, Users } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSocket } from "@/components/ui/SocketProvider";

interface MonitorConversation {
  id: string;
  status: string;
  updatedAt: string;
  departmentId: string | null;
  assignedTo: string | null;
  contact: { id: string; name: string; phone: string; source: string };
  department?: { id: string; name: string; color: string } | null;
  assignee?: { id: string; name: string } | null;
  lastMessage?: { content: string; createdAt: string; fromMe: boolean } | null;
}

export default function MonitorPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<MonitorConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'active'>('all');
  
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/monitor/active');
      setConversations(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar monitoramento.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Atualiza o relógio a cada segundo para recalcular o tempo nos cards
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const onUpdate = () => fetchConversations();
    
    socket.on('newMessage', onUpdate);
    socket.on('conversationUpdated', onUpdate);

    return () => {
      socket.off('newMessage', onUpdate);
      socket.off('conversationUpdated', onUpdate);
    };
  }, [socket]);

  const handleTakeover = async (id: string) => {
    try {
      await api.patch(`/conversations/${id}/takeover`);
      toast.success("Atendimento assumido!");
      fetchConversations();
    } catch (error) {
      toast.error("Erro ao assumir atendimento.");
    }
  };

  const getWaitInfo = (updatedAt: string) => {
    const diffMs = now.getTime() - new Date(updatedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    let colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"; // < 5 min
    let dotClass = "bg-emerald-500";
    let isPulsing = false;
    
    if (diffMins >= 15) {
      colorClass = "bg-red-500/10 text-red-400 border-red-500/20"; // > 15 min
      dotClass = "bg-red-500";
      isPulsing = true;
    } else if (diffMins >= 5) {
      colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"; // 5 a 15 min
      dotClass = "bg-yellow-500";
    }

    let timeStr = `${diffMins} min`;
    if (diffHours > 0) {
      const m = diffMins % 60;
      timeStr = `${diffHours}h ${m}m`;
    }

    return { timeStr, colorClass, dotClass, isPulsing, diffMins };
  };

  const filteredConversations = conversations.filter(c => {
    if (filterStatus === 'waiting' && c.status !== 'waiting') return false;
    if (filterStatus === 'active' && !['open', 'human_takeover'].includes(c.status)) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050A15]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-gray-800 bg-[#0B1224] shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Activity className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Monitor Ao Vivo</h1>
            <p className="text-sm text-gray-400">Torre de controle de atendimentos em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#050A15] p-1 rounded-lg border border-gray-800 flex items-center">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterStatus('waiting')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterStatus === 'waiting' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Na Fila
            </button>
            <button 
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filterStatus === 'active' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Em Atendimento
            </button>
          </div>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors border border-gray-700">
            <Filter size={16} />
            Filtros Avançados
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-20">Carregando monitor...</div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CheckCircle size={48} className="mb-4 text-emerald-500/50" />
            <p className="text-lg">Nenhum atendimento na fila ou em andamento.</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="text-lg">Nenhum atendimento ativo no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredConversations.map(conv => {
              const waitInfo = getWaitInfo(conv.updatedAt);
              
              return (
                <div key={conv.id} className="bg-[#0B1224] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors flex flex-col">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-800/50 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{conv.contact.name}</h3>
                      <p className="text-xs text-gray-500">{conv.contact.phone}</p>
                    </div>
                    
                    {/* SLA Badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-bold ${waitInfo.colorClass}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${waitInfo.dotClass} ${waitInfo.isPulsing ? 'animate-ping opacity-75' : ''}`}></div>
                      <Clock size={12} />
                      {waitInfo.timeStr}
                    </div>
                  </div>

                  {/* Context Info */}
                  <div className="px-4 py-3 bg-[#050A15]/50 flex-1 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Setor:</span>
                      <span className="text-white font-medium bg-gray-800 px-2 py-0.5 rounded truncate max-w-[120px]">
                        {conv.department?.name || 'Triagem (Sem Setor)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Responsável:</span>
                      <span className={`font-medium ${conv.assignee ? 'text-blue-400' : 'text-yellow-500'}`}>
                        {conv.assignee ? conv.assignee.name : 'Aguardando na Fila'}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <div className="mt-3 pt-3 border-t border-gray-800/50">
                        <p className="text-xs text-gray-400 line-clamp-2 italic">
                          "{conv.lastMessage.content}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {conv.status === 'waiting' && !conv.assignedTo ? (
                      <button 
                        onClick={() => handleTakeover(conv.id)}
                        className="flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <UserPlus size={14} />
                        Assumir
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 bg-gray-800/50 text-gray-500 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed">
                        <Users size={14} />
                        Em Curso
                      </div>
                    )}
                    
                    <button 
                      onClick={() => router.push(`/inbox?contactId=${conv.contact.id}`)}
                      className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <MessageSquare size={14} />
                      Abrir Inbox
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
