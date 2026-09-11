"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, CheckCircle, Clock, MessageSquare, UserPlus, 
  Users, LayoutGrid, List, ChevronDown, ChevronRight, 
  Search, RefreshCw, Phone, AlertCircle, MoreHorizontal, X, ArrowRightLeft
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

interface Department {
  id: string;
  name: string;
  color?: string;
}

export default function MonitorPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<MonitorConversation[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // Settings / State
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
  const [filterSla, setFilterSla] = useState('all'); // all, bot, unanswered, 15m, 30m, 1h, 24h
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // Popover State
  const [selectedCard, setSelectedCard] = useState<MonitorConversation | null>(null);
  const [transferDeptId, setTransferDeptId] = useState('');
  const [showTransferInline, setShowTransferInline] = useState(false);

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Sem telefone';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    } else if (clean.length === 12 && clean.startsWith('55')) {
      return `+55 (${clean.substring(2, 4)}) ${clean.substring(4, 8)}-${clean.substring(8)}`;
    } else if (clean.length === 11) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  const formatStartTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `Início às ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • WhatsApp`;
    } catch {
      return 'Início recente • WhatsApp';
    }
  };

  const fetchData = async () => {
    try {
      const [convRes, usersRes, deptRes] = await Promise.all([
        api.get('/monitor/active'),
        api.get('/team-chat/users'),
        api.get('/departments')
      ]);
      setConversations(convRes.data || []);
      setUsers(usersRes.data || []);
      setDepartments(deptRes.data || []);
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
      toast.success("Atendimento assumido com sucesso!");
      if (selectedCard?.id === id) {
        setSelectedCard(prev => prev ? { ...prev, status: 'human_takeover' } : null);
      }
      fetchData();
    } catch (error) {
      toast.error("Erro ao assumir atendimento.");
    }
  };

  const handleTransfer = async (conversationId: string, departmentId: string) => {
    if (!departmentId) return;
    try {
      await api.patch(`/conversations/${conversationId}/transfer`, { departmentId });
      toast.success("Atendimento transferido!");
      setSelectedCard(null);
      setShowTransferInline(false);
      setTransferDeptId('');
      fetchData();
    } catch (error) {
      toast.error("Erro ao transferir atendimento.");
    }
  };

  const getSLAInfo = (conv: MonitorConversation) => {
    const isBot = conv.status === 'waiting' && !conv.assignedTo;
    
    // Se a última mensagem for "fromMe", significa que o atendente/bot respondeu.
    // O SLA de espera conta desde a última mensagem do contato (fromMe === false)
    const isUnanswered = conv.lastMessage ? !conv.lastMessage.fromMe : true;
    
    const baseDate = (conv as any).lastMessageAt || conv.lastMessage?.createdAt || conv.updatedAt;
    const diffMs = now.getTime() - new Date(baseDate).getTime();
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {deptConvs.map(conv => {
                            const sla = getSLAInfo(conv);
                            
                            return (
                              <div 
                                key={conv.id} 
                                onClick={() => {
                                  setSelectedCard(conv);
                                  setShowTransferInline(false);
                                  setTransferDeptId('');
                                }}
                                className="relative bg-[#0b101b] hover:bg-[#111726] border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group min-h-[135px]"
                              >
                                {/* Topo do Card */}
                                <div>
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="text-slate-100 font-semibold text-sm truncate" title={conv.contact.name}>
                                        {conv.contact.name || 'Contato Sem Nome'}
                                      </h3>
                                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                        <Phone size={10} className="text-slate-500 shrink-0" />
                                        <span>{formatPhone(conv.contact.phone)}</span>
                                      </p>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border flex items-center gap-1 ${sla.colorClass}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${sla.dotClass} ${sla.isPulsing ? 'animate-ping' : ''}`} />
                                      <span>{sla.timeStr}</span>
                                    </div>
                                  </div>

                                  {/* Centro do Card: Atraso Crítico / Alerta */}
                                  {sla.isUnanswered && sla.diffMins >= 15 ? (
                                    <div className="mt-2.5 mb-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/25 flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
                                      <AlertCircle size={12} className="shrink-0 text-red-400 animate-pulse" />
                                      <span className="truncate">sem resposta há {sla.timeStr}</span>
                                    </div>
                                  ) : conv.lastMessage ? (
                                    <p className="text-[11px] text-slate-500 truncate mt-2 mb-1">
                                      <span className="text-slate-400 font-medium">{conv.lastMessage.fromMe ? 'Atendente: ' : 'Cliente: '}</span>
                                      {conv.lastMessage.content}
                                    </p>
                                  ) : (
                                    <div className="h-4 mt-2 mb-1" />
                                  )}
                                </div>

                                {/* Rodapé do Card */}
                                <div className="border-t border-slate-800/80 pt-2 mt-auto flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-[9px] uppercase shrink-0">
                                      {conv.assignee ? conv.assignee.name.substring(0, 2) : 'FL'}
                                    </div>
                                    <span className={`text-xs truncate max-w-[120px] font-medium ${conv.assignee ? 'text-slate-300' : 'text-amber-400/90'}`}>
                                      {conv.assignee ? conv.assignee.name : 'Aguardando na Fila'}
                                    </span>
                                  </div>

                                  <MoreHorizontal size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
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
                                  <tr 
                                    key={conv.id} 
                                    onClick={() => {
                                      setSelectedCard(conv);
                                      setShowTransferInline(false);
                                      setTransferDeptId('');
                                    }}
                                    className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                  >
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
                                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex justify-end gap-2">
                                        {conv.status === 'waiting' && !conv.assignedTo && (
                                          <button 
                                            onClick={() => handleTakeover(conv.id)}
                                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                          >
                                            Assumir
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => router.push(`/inbox?contactId=${conv.contact.id}`)}
                                          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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

      {/* CARD POPOVER DE DETALHES - PADRÃO LERO */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="bg-[#161b26] border border-slate-700 rounded-2xl p-5 shadow-2xl w-full max-w-sm text-slate-200 animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Card de Atendimento
                </span>
              </div>
              <button 
                onClick={() => setSelectedCard(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Detalhes do Contato */}
            <div className="py-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">NOME</span>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">
                  {selectedCard.contact.name || 'Contato Sem Nome'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">TELEFONE</span>
                <p className="text-sm text-slate-300 font-mono mt-0.5 flex items-center gap-1.5">
                  <Phone size={12} className="text-emerald-400" />
                  {formatPhone(selectedCard.contact.phone)}
                </p>
              </div>

              <div className="pt-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-400" />
                  {formatStartTime(selectedCard.updatedAt)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">OPERADOR</span>
                  <p className={`text-xs font-medium mt-0.5 truncate ${selectedCard.assignee ? 'text-slate-200' : 'text-amber-400'}`}>
                    {selectedCard.assignee ? selectedCard.assignee.name : 'Na Fila Geral'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SETOR</span>
                  <p className="text-xs font-medium text-slate-200 mt-0.5 truncate">
                    {selectedCard.department?.name || 'Sem Setor'}
                  </p>
                </div>
              </div>

              {/* SLA Status */}
              {(() => {
                const sla = getSLAInfo(selectedCard);
                return (
                  <div className={`mt-2 px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs font-medium ${sla.colorClass}`}>
                    <span className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${sla.dotClass}`} />
                      {sla.isUnanswered ? `Sem resposta há ${sla.timeStr}` : `Última interação há ${sla.timeStr}`}
                    </span>
                    <span className="text-[10px] font-bold uppercase">{sla.label}</span>
                  </div>
                );
              })()}

              {/* Seletor Inline de Transferência */}
              {showTransferInline && (
                <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2 animate-in fade-in duration-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Escolha o Setor de Destino:
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={transferDeptId} 
                      onChange={(e) => setTransferDeptId(e.target.value)}
                      className="flex-1 bg-[#161b26] border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione o setor...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => handleTransfer(selectedCard.id, transferDeptId)}
                      disabled={!transferDeptId}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Ações Rápidas */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  router.push(`/inbox?contactId=${selectedCard.contact.id}&conversationId=${selectedCard.id}`);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                title="Abrir no Inbox"
              >
                <MessageSquare size={13} />
                <span>Abrir Chat</span>
              </button>

              <button
                onClick={() => handleTakeover(selectedCard.id)}
                className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                title="Assumir Atendimento"
              >
                <UserPlus size={13} />
                <span>Assumir</span>
              </button>

              <button
                onClick={() => setShowTransferInline(prev => !prev)}
                className={`font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                  showTransferInline 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Transferir para outro setor"
              >
                <ArrowRightLeft size={13} />
                <span>Transferir</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
