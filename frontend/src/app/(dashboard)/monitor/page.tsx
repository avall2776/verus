"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, CheckCircle, Clock, MessageSquare, UserPlus, 
  Users, LayoutGrid, List, ChevronDown, ChevronRight, 
  Search, RefreshCw, Phone
} from "lucide-react";
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

interface TeamUser {
  id: string;
  name: string;
  isOnline: boolean;
  role: string;
}

export default function MonitorPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<MonitorConversation[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // Settings / State
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
  const [filterSla, setFilterSla] = useState('all'); // all, bot, unanswered, 15m, 30m, 1h, 24h
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const fetchData = async () => {
    try {
      const [convRes, usersRes] = await Promise.all([
        api.get('/monitor/active'),
        api.get('/team-chat/users') // Reaproveitando do TeamChat
      ]);
      setConversations(convRes.data || []);
      setUsers(usersRes.data || []);
      setRefreshCountdown(30);
    } catch (error) {
      toast.error("Erro ao carregar dados da torre de controle.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Relógio e Countdown
    const interval = setInterval(() => {
      setNow(new Date());
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchData(); // Fallback Refresh
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => fetchData(); // Atualiza dados em tempo real se o socket receber eventos
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
      fetchData();
    } catch (error) {
      toast.error("Erro ao assumir atendimento.");
    }
  };

  const getSLAInfo = (conv: MonitorConversation) => {
    const isBot = conv.status === 'waiting' && !conv.assignedTo;
    
    // Se a última mensagem for "fromMe", significa que o atendente/bot respondeu.
    // O SLA de espera conta desde a última mensagem do contato (fromMe === false)
    const isUnanswered = conv.lastMessage ? !conv.lastMessage.fromMe : true;
    
    const diffMs = now.getTime() - new Date(conv.updatedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    let dotClass = "bg-emerald-500";
    let isPulsing = false;
    let label = "Normal";

    if (diffHours >= 24) {
      colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/30";
      dotClass = "bg-purple-500";
      label = "> 24h em Atendimento";
    } else if (diffMins >= 60 && isUnanswered) {
      colorClass = "bg-red-500/10 text-red-400 border-red-500/30";
      dotClass = "bg-red-500";
      isPulsing = true;
      label = "Crítico (> 1h)";
    } else if (diffMins >= 30 && isUnanswered) {
      colorClass = "bg-orange-500/10 text-orange-400 border-orange-500/30";
      dotClass = "bg-orange-500";
      label = "Urgente (> 30m)";
    } else if (diffMins >= 15 && isUnanswered) {
      colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      dotClass = "bg-yellow-500";
      label = "Atenção (> 15m)";
    }

    let timeStr = `${diffMins} min`;
    if (diffHours > 0) {
      const m = diffMins % 60;
      timeStr = `${diffHours}h ${m}m`;
    }

    return { timeStr, colorClass, dotClass, isPulsing, diffMins, diffHours, isUnanswered, isBot, label };
  };

  const toggleDept = (deptName: string) => {
    setExpandedDepts(prev => ({ ...prev, [deptName]: prev[deptName] === false ? true : false }));
  };

  // Filtragem
  const filteredConversations = conversations.filter(conv => {
    const sla = getSLAInfo(conv);
    
    // Filtro Assinante
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'none' && conv.assignedTo) return false;
      if (filterAssignee !== 'none' && conv.assignedTo !== filterAssignee) return false;
    }

    // Filtro SLA
    if (filterSla !== 'all') {
      if (filterSla === 'bot' && !sla.isBot) return false;
      if (filterSla === 'unanswered' && !sla.isUnanswered) return false;
      if (filterSla === '15m' && (!sla.isUnanswered || sla.diffMins < 15)) return false;
      if (filterSla === '30m' && (!sla.isUnanswered || sla.diffMins < 30)) return false;
      if (filterSla === '1h' && (!sla.isUnanswered || sla.diffMins < 60)) return false;
      if (filterSla === '24h' && sla.diffHours < 24) return false;
    }

    return true;
  });

  // Agrupamento por Departamento
  const groupedDepts = filteredConversations.reduce((acc, conv) => {
    const deptName = conv.department?.name || 'Fila de Triagem (Sem Setor)';
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(conv);
    return acc;
  }, {} as Record<string, MonitorConversation[]>);

  // Auxiliares p/ select de Atendentes
  const getAssigneeCount = (userId: string) => conversations.filter(c => c.assignedTo === userId).length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050A15]">
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-gray-800 bg-[#0B1224] shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            Monitor: {filteredConversations.length} atendimentos ativos
            <div className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full font-medium border border-blue-500/20">
              <RefreshCw size={10} className={refreshCountdown < 3 ? 'animate-spin' : ''} />
              atualiza em {refreshCountdown}s
            </div>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Visão em tempo real organizada por setor com SLAs automáticos.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* SLA Filter */}
          <select 
            value={filterSla}
            onChange={(e) => setFilterSla(e.target.value)}
            className="bg-[#050A15] border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Interações</option>
            <option value="bot">Aguardando Chatbot / Fila Inicial</option>
            <option value="unanswered">Clientes Sem Resposta</option>
            <option value="15m">Sem Resposta &gt; 15 min</option>
            <option value="30m">Sem Resposta &gt; 30 min</option>
            <option value="1h">Sem Resposta &gt; 1h</option>
            <option value="24h">Em atendimento &gt; 24h</option>
          </select>

          {/* Assignee Filter */}
          <select 
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-[#050A15] border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Operadores</option>
            <option value="none">Na Fila (Sem Operador)</option>
            <optgroup label="Colaboradores">
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.isOnline ? '🟢' : '⚫'} ({getAssigneeCount(u.id)})
                </option>
              ))}
            </optgroup>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-[#050A15] rounded-lg border border-gray-700 p-1">
            <button 
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${layoutMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              title="Modo Confortável (Grid)"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setLayoutMode('table')}
              className={`p-1.5 rounded-md transition-colors ${layoutMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              title="Modo Compacto (Tabela)"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#050A15] custom-scrollbar">
        {isLoading && conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-20 flex flex-col items-center gap-3">
            <Activity className="animate-pulse opacity-50 text-blue-500" size={32} />
            Carregando torre de controle...
          </div>
        ) : Object.keys(groupedDepts).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CheckCircle size={48} className="mb-4 text-emerald-500/50" />
            <p className="text-lg">Excelente! Nenhum atendimento acumulado.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDepts).map(([deptName, deptConvs]) => {
              const isCollapsed = expandedDepts[deptName] === false;
              
              return (
                <div key={deptName} className="flex flex-col bg-[#0B1224] rounded-xl border border-gray-800 overflow-hidden shadow-sm">
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleDept(deptName)}
                    className="flex items-center justify-between p-4 bg-gray-900/30 hover:bg-gray-800/40 cursor-pointer border-b border-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? <ChevronRight size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-400" />}
                      <h2 className="text-base font-bold text-white uppercase tracking-wider">{deptName}</h2>
                      <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                        {deptConvs.length}
                      </span>
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {!isCollapsed && (
                    <div className="p-4">
                      {layoutMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {deptConvs.map(conv => {
                            const sla = getSLAInfo(conv);
                            
                            return (
                              <div key={conv.id} className="bg-[#050A15] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors flex flex-col group">
                                <div className="p-4 flex flex-col gap-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 overflow-hidden pr-2">
                                      <h3 className="text-sm font-bold text-white truncate" title={conv.contact.name}>{conv.contact.name}</h3>
                                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Phone size={10} /> {conv.contact.phone || 'Sem número'}
                                      </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-bold shrink-0 ${sla.colorClass}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${sla.dotClass} ${sla.isPulsing ? 'animate-ping opacity-75' : ''}`}></div>
                                      <Clock size={12} />
                                      {sla.timeStr}
                                    </div>
                                  </div>
                                  
                                  {conv.lastMessage && (
                                    <div className="bg-[#0B1224] rounded-lg p-2.5 border border-gray-800 mt-2">
                                      <p className="text-xs text-gray-400 line-clamp-2">
                                        <span className="font-semibold text-gray-500 mr-1">{conv.lastMessage.fromMe ? 'Atendente:' : 'Contato:'}</span>
                                        "{conv.lastMessage.content}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Card Footer */}
                                <div className="mt-auto border-t border-gray-800/80 bg-[#0B1224]/50 p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-[10px] uppercase">
                                      {conv.assignee ? conv.assignee.name.substring(0,2) : 'FL'}
                                    </div>
                                    <span className={`text-xs font-medium truncate max-w-[100px] ${conv.assignee ? 'text-blue-400' : 'text-yellow-500'}`}>
                                      {conv.assignee ? conv.assignee.name : 'Na Fila'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {conv.status === 'waiting' && !conv.assignedTo && (
                                      <button 
                                        onClick={() => handleTakeover(conv.id)}
                                        title="Assumir Chat"
                                        className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                                      >
                                        <UserPlus size={14} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => router.push(`/inbox?contactId=${conv.contact.id}`)}
                                      title="Abrir no Inbox"
                                      className="p-1.5 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                    >
                                      <MessageSquare size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* TABLE MODE */
                        <div className="overflow-x-auto rounded-lg border border-gray-800">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-3 font-semibold">Contato</th>
                                <th className="p-3 font-semibold">Status SLA</th>
                                <th className="p-3 font-semibold">Atendente</th>
                                <th className="p-3 font-semibold text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm">
                              {deptConvs.map(conv => {
                                const sla = getSLAInfo(conv);
                                return (
                                  <tr key={conv.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="p-3">
                                      <div className="font-bold text-gray-200">{conv.contact.name}</div>
                                      <div className="text-xs text-gray-500">{conv.contact.phone}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-bold ${sla.colorClass}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${sla.dotClass} ${sla.isPulsing ? 'animate-ping' : ''}`}></div>
                                        {sla.timeStr} - {sla.label}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <span className={`font-medium ${conv.assignee ? 'text-blue-400' : 'text-yellow-500'}`}>
                                        {conv.assignee ? conv.assignee.name : 'Aguardando na Fila'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex justify-end gap-2">
                                        {conv.status === 'waiting' && !conv.assignedTo && (
                                          <button 
                                            onClick={() => handleTakeover(conv.id)}
                                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                          >
                                            Assumir
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => router.push(`/inbox?contactId=${conv.contact.id}`)}
                                          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                        >
                                          Abrir
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER: ONLINE USERS & SLA LEGEND */}
      <div className="border-t border-gray-800 bg-[#0B1224] shrink-0 p-4 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Online Users List */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={12} /> Colaboradores ({users.filter(u => u.isOnline).length} Online)
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {users.length === 0 ? (
                <div className="text-xs text-gray-500 italic">Nenhum colaborador carregado.</div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="flex items-center gap-2 bg-[#050A15] border border-gray-800 px-3 py-1.5 rounded-lg shrink-0">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-[10px] uppercase">
                        {u.name.substring(0,2)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#050A15] ${u.isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold leading-tight ${u.isOnline ? 'text-gray-200' : 'text-gray-500'}`}>{u.name}</span>
                      <span className="text-[9px] text-gray-600">{getAssigneeCount(u.id)} chats ativos</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SLA Legend */}
          <div className="flex flex-col gap-2 lg:border-l lg:border-gray-800 lg:pl-6 shrink-0 pt-2 lg:pt-0">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Legenda de SLA</h4>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Dentro da Meta
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                &gt; 15 min
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                &gt; 30 min
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                &gt; 1 hora
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                &gt; 24h
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
