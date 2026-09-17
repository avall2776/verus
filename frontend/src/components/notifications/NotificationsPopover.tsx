"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, BellOff, CheckCheck, MessageSquare, LifeBuoy, 
  Target, Sparkles, Check, ChevronRight, ExternalLink,
  ShieldCheck, AlertCircle, RefreshCw, X
} from "lucide-react";
import api from "@/lib/api";
import { useSocket } from "@/components/ui/SocketProvider";
import toast from "react-hot-toast";

export interface NotificationItem {
  id: string;
  type: 'CHAT' | 'SUPPORT' | 'GOAL' | 'SYSTEM';
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  metadata?: any;
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
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  return `${diffDays}d`;
}

export default function NotificationsPopover() {
  const router = useRouter();
  const { socket } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CHAT' | 'SUPPORT' | 'GOAL' | 'SYSTEM'>('ALL');

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Busca notificações no backend
  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (error) {
      console.warn('[Notifications] Falha ao buscar notificações:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Carregamento inicial e Polling de 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Integração em Tempo Real via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewTeamMessage = (msg: any) => {
      try {
        const userStr = localStorage.getItem('versus_user');
        const currentUserId = userStr ? JSON.parse(userStr)?.id : null;

        // Se a mensagem foi enviada por outro colaborador
        if (msg.senderId !== currentUserId) {
          const newItem: NotificationItem = {
            id: `chat_${msg.id}`,
            type: 'CHAT',
            title: msg.channel?.name 
              ? `#${msg.channel.name}: ${msg.sender?.name || 'Colega'}`
              : `Mensagem de ${msg.sender?.name || 'Colega'}`,
            description: msg.content?.length > 80 ? `${msg.content.substring(0, 80)}...` : msg.content,
            createdAt: new Date().toISOString(),
            isRead: false,
            link: '/chat-interno',
            priority: 'NORMAL'
          };

          setNotifications(prev => [newItem, ...prev.filter(n => n.id !== newItem.id)]);
          setUnreadCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('Erro ao processar newTeamMessage no socket', err);
      }
    };

    socket.on('newTeamMessage', handleNewTeamMessage);

    return () => {
      socket.off('newTeamMessage', handleNewTeamMessage);
    };
  }, [socket]);

  // Fechar ao clicar fora ou apertar Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Ação: Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    try {
      setIsMarkingAll(true);
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Todas as notificações foram marcadas como lidas.');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas', error);
      toast.error('Não foi possível marcar como lidas.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Ação: Marcar item individual como lido
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida', error);
    }
  };

  // Ação: Clicar em notificação para navegar
  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  // Filtros aplicados
  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'ALL') return true;
    return item.type === activeFilter;
  });

  // Contadores por tipo
  const counts = {
    ALL: notifications.length,
    CHAT: notifications.filter(n => n.type === 'CHAT').length,
    SUPPORT: notifications.filter(n => n.type === 'SUPPORT').length,
    GOAL: notifications.filter(n => n.type === 'GOAL').length,
    SYSTEM: notifications.filter(n => n.type === 'SYSTEM').length,
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'CHAT':
        return <MessageSquare size={15} className="text-blue-400" />;
      case 'SUPPORT':
        return <LifeBuoy size={15} className="text-purple-400" />;
      case 'GOAL':
        return <Target size={15} className="text-emerald-400" />;
      case 'SYSTEM':
      default:
        return <Sparkles size={15} className="text-amber-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Botão Gatilho do Sino no Header */}
      <button
        ref={triggerRef}
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen) fetchNotifications();
        }}
        title="Central de Notificações"
        className={`relative p-2 rounded-full transition-all cursor-pointer ${
          isOpen 
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Bell size={20} />

        {/* Badge Numérico de Não Lidas */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Interativo */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl shadow-black/90 z-50 overflow-hidden flex flex-col text-slate-100 animate-fadeIn"
        >
          {/* Header do Popover */}
          <div className="p-4 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-[#0B1224]/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Notificações</h3>
              {unreadCount > 0 ? (
                <span className="text-[11px] font-semibold bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.2 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.2 rounded-full">
                  Em dia
                </span>
              )}
            </div>

            {/* Ação: Marcar todas como lidas */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                title="Marcar todas as notificações como lidas"
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer hover:underline disabled:opacity-50"
              >
                <CheckCheck size={14} />
                <span>Marcar lidas</span>
              </button>
            )}
          </div>

          {/* Abas / Filtros de Categorias */}
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-800/60 bg-[#0F172A] flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {[
              { key: 'ALL', label: 'Todas', count: counts.ALL },
              { key: 'CHAT', label: 'Chat', count: counts.CHAT },
              { key: 'SUPPORT', label: 'Suporte', count: counts.SUPPORT },
              { key: 'GOAL', label: 'Metas', count: counts.GOAL },
              { key: 'SYSTEM', label: 'Sistema', count: counts.SYSTEM },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === tab.key
                    ? 'bg-[#1E293B] text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === tab.key ? 'bg-slate-800 text-blue-400' : 'bg-slate-800/80 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/50">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin text-blue-500" />
                <span className="text-xs">Carregando avisos...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
                  <BellOff size={22} className="opacity-70" />
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">
                  {activeFilter === 'ALL' ? 'Nenhuma notificação recente' : 'Nenhuma notificação nesta categoria'}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
                  Você está 100% atualizado com os chamados, metas e mensagens da equipe.
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => {
                const relativeTime = formatRelativeTime(item.createdAt);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer group relative ${
                      !item.isRead 
                        ? 'bg-blue-950/15 hover:bg-blue-950/30' 
                        : 'hover:bg-slate-800/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Ícone Temático */}
                    <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/70 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-sm">
                      {getIcon(item.type)}
                    </div>

                    {/* Conteúdo da Notificação */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-white' : 'text-slate-300'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-1">
                          {relativeTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-1.5">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-blue-400/90 group-hover:text-blue-300 flex items-center gap-0.5">
                          <span>Ver detalhes</span>
                          <ChevronRight size={11} />
                        </span>

                        {/* Botão de Marcar Individual como Lida */}
                        {!item.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            title="Marcar como lida"
                            className="text-slate-500 hover:text-emerald-400 p-1 rounded-md transition-colors"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ponto indicador de não lida */}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé do Popover */}
          <div className="p-2.5 border-t border-slate-800/80 bg-[#0B1224]/80 text-center flex items-center justify-between px-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sincronização em tempo real
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/chat-interno');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              Abrir chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
