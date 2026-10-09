"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { showLeadMessageToast, showTransferAlertToast } from '@/components/notifications/NotificationToast';
import { sanitizeAvatarUrl } from '@/lib/avatarUtils';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  hasGlobalUnread: boolean;
  clearGlobalUnread: () => void;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  playNotificationSound: (isHighPriority?: boolean) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  hasGlobalUnread: false,
  clearGlobalUnread: () => {},
  notificationPermission: 'default',
  requestNotificationPermission: async () => 'default',
  playNotificationSound: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasGlobalUnread, setHasGlobalUnread] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const pathname = usePathname();
  const router = useRouter();
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTriggeredRef = useRef<{ [key: string]: number }>({});

  const clearGlobalUnread = useCallback(() => {
    setHasGlobalUnread((prev) => (prev ? false : prev));
  }, []);

  // Inicializa estado de permissão do navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Solicita permissão de Desktop Notifications
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        return perm;
      } catch (err) {
        console.warn('[Notifications] Erro ao solicitar permissão:', err);
      }
    }
    return 'denied';
  }, []);

  // Solicita permissão suavemente na primeira interação do usuário caso esteja 'default'
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
          .then((perm) => setNotificationPermission(perm))
          .catch(() => {});
      }
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Helper de segurança estrita: NUNCA permitir dados ou notificações em rotas de login, públicas ou sessões sem token
  const isUnauthenticatedOrPublic = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const p = (window.location.pathname || '').toLowerCase();
    const token = localStorage.getItem('versus_token') || sessionStorage.getItem('versus_token');
    
    // Sem token = categoricamente deslogado
    if (!token) return true;

    // Rotas de login, autenticação ou Super Admin Console (que tem isolamento próprio)
    if (
      p.includes('/login') || 
      p.includes('/auth') || 
      p.includes('/register') || 
      p.includes('/forgot') || 
      p.includes('/reset-password') ||
      p.includes('/super-admin')
    ) {
      return true;
    }

    return false;
  }, []);

  // Dispara áudio de notificação profissional (Arquivos Acústicos Reais + Fallback Sintetizado)
  const playNotificationSound = useCallback((isHighPriority = false) => {
    try {
      if (typeof window === 'undefined') return;
      if (isUnauthenticatedOrPublic()) return;

      // 1. Tenta reproduzir arquivo de áudio acústico de alta qualidade
      const preset = localStorage.getItem('versus_sound_preset') || 'glass';
      let soundPath = '/vallor/sounds/notification.wav';

      if (isHighPriority) {
        soundPath = '/vallor/sounds/transfer.wav';
      } else if (preset === 'pop') {
        soundPath = '/vallor/sounds/notification-pop.wav';
      } else {
        soundPath = '/vallor/sounds/notification-glass.wav';
      }

      const audio = new Audio(soundPath);
      audio.volume = isHighPriority ? 0.75 : 0.65;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          // Fallback resiliente via Web Audio API caso o navegador bloqueie áudio externo
          playSynthesizedFallback(isHighPriority);
        });
      }
    } catch (e) {
      playSynthesizedFallback(isHighPriority);
    }
  }, [isUnauthenticatedOrPublic]);

  const playSynthesizedFallback = (isHighPriority = false) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      if (!isHighPriority) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.1); // E6
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        const notes = [698.46, 880.0, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const st = now + idx * 0.09;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, st);
          gain.gain.setValueAtTime(0.001, st);
          gain.gain.linearRampToValueAtTime(0.15, st + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(st);
          osc.stop(st + 0.3);
        });
      }
    } catch (err) {}
  };

  // Helper para verificar se a rota ativa é o Console Master Super Admin
  const isSuperAdminRoute = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const p = (window.location.pathname || '').toLowerCase();
    return p.startsWith('/super-admin') || p.includes('/super-admin');
  }, []);

  // Vibração Tátil (Mobile & dispositivos compatíveis)
  const triggerVibration = useCallback((isHighPriority = false) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (isUnauthenticatedOrPublic()) return;
        if (isHighPriority) {
          navigator.vibrate([120, 60, 120, 60, 200]);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (e) {}
  }, [isUnauthenticatedOrPublic]);

  // Disparo de Desktop / Web Push Notifications
  const dispatchDesktopNotification = useCallback((title: string, options: { body: string; tag?: string; url?: string }) => {
    try {
      if (isUnauthenticatedOrPublic()) return;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body: options.body,
          icon: '/vallor/favicon.ico',
          tag: options.tag || 'versus_notification',
        });

        notif.onclick = () => {
          window.focus();
          if (options.url) {
            router.push(options.url);
          }
          notif.close();
        };
      }
    } catch (err) {
      console.warn('[Desktop Notification] Erro ao disparar:', err);
    }
  }, [router, isUnauthenticatedOrPublic]);

  // Efeito de piscar a aba do navegador
  const triggerTabBlink = useCallback((titleText: string) => {
    if (isUnauthenticatedOrPublic()) return;
    let isBlinking = false;
    const originalTitle = "Vallor - Motor Omnichannel";
    const blinkInterval = setInterval(() => {
      document.title = isBlinking ? originalTitle : titleText;
      isBlinking = !isBlinking;
    }, 1000);

    const stopBlinking = () => {
      clearInterval(blinkInterval);
      document.title = originalTitle;
      window.removeEventListener('focus', stopBlinking);
      window.removeEventListener('mousemove', stopBlinking);
    };

    window.addEventListener('focus', stopBlinking);
    window.addEventListener('mousemove', stopBlinking);
  }, [isUnauthenticatedOrPublic]);

  useEffect(() => {
    // Conexão resiliente: detecta se está rodando na Vercel (onde WebSocket upgrade via rewrite falha)
    const isVercelHost = typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('avallmarketing.com.br'));
    const directSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;

    const socketInstance = io(directSocketUrl || undefined, {
      autoConnect: true,
      transports: isVercelHost && !directSocketUrl ? ['polling'] : ['polling', 'websocket'],
      upgrade: !(isVercelHost && !directSocketUrl),
      reconnectionAttempts: 10,
      reconnectionDelay: 2500,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('📡 [WebSockets] Conectado ao Servidor em Tempo Real!', socketInstance.id);
      
      // Isolamento estrito imediato se deslogado ou tela de login
      if (isUnauthenticatedOrPublic()) {
        console.log('🛡️ [WebSockets] Sessão deslogada/pública ou tela de login: isolando socket.');
        socketInstance.emit('leaveTenant');
        socketInstance.emit('joinTenant', 'unauthenticated_isolated');
        return;
      }

      let tenantId: string | null = null;
      try {
        const targetTenant = localStorage.getItem('versus_target_tenant_id');
        if (targetTenant) {
          tenantId = targetTenant;
        } else {
          const userStr = localStorage.getItem('versus_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.tenantId) tenantId = user.tenantId;
          }
          if (!tenantId) {
            const savedTenant = localStorage.getItem('tenantId');
            if (savedTenant) tenantId = savedTenant;
          }
        }
      } catch (e) {}

      if (tenantId) {
        socketInstance.emit('joinTenant', tenantId);
      } else {
        socketInstance.emit('leaveTenant');
        socketInstance.emit('joinTenant', 'unauthenticated_isolated');
      }
    });

    const handleTenantSwitched = () => {
      if (socketInstance && socketInstance.connected) {
        if (isUnauthenticatedOrPublic()) {
          socketInstance.emit('leaveTenant');
          socketInstance.emit('joinTenant', 'unauthenticated_isolated');
          return;
        }
        const target = localStorage.getItem('versus_target_tenant_id') || localStorage.getItem('tenantId');
        if (target) {
          socketInstance.emit('leaveTenant');
          socketInstance.emit('joinTenant', target);
          console.log('🔄 [WebSockets] Alternado para o tenant alvo:', target);
        }
      }
    };
    window.addEventListener('tenant_switched', handleTenantSwitched);

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('📡 [WebSockets] Desconectado.');
    });

    // Escuta global para Alerta de Handoff da IA (Lead Qualificado)
    socketInstance.on('dealUpdated', (deal) => {
      // Suprime absolutamente notificações em login, público, deslogado ou super-admin
      if (isUnauthenticatedOrPublic()) return;

      toast.error(`🚨 Lead Qualificado pela IA!\nUm novo lead precisa de atendimento humano.\nAcesse o Pipeline CRM.`, {
        duration: 8000,
        position: 'top-right',
        style: { background: '#0B1224', color: '#fff', border: '1px solid #ef4444' }
      });
      playNotificationSound(true);
      triggerVibration(true);
      triggerTabBlink("🚨 [1] LEAD QUALIFICADO!");
      
      if (document.hidden || !document.hasFocus()) {
        dispatchDesktopNotification("🚨 Vallor · Lead Qualificado!", {
          body: "Um novo lead atingiu critérios de qualificação e aguarda contato humano.",
          tag: `deal_${deal?.id || 'alert'}`,
          url: "/crm"
        });
      }
    });

    // Escuta global para novas mensagens recebidas de Leads (INBOUND)
    socketInstance.on('newMessage', (msg) => {
      // Suprime absolutamente notificações em login, público, deslogado ou super-admin
      if (isUnauthenticatedOrPublic()) return;

      if (msg.direction === 'INBOUND') {
        const convId = msg.conversationId || msg.contact?.conversationId || (msg.contactId ? `conv_${msg.contactId}` : null);
        const contactName = msg.contact?.name || msg.contactName || 'Lead Interessado';
        const contactAvatar = sanitizeAvatarUrl(msg.contact?.avatarUrl || msg.contact?.avatar);
        const contactPhone = msg.contact?.phone || null;
        const content = msg.content || msg.text || '';
        const msgType = msg.mediaType || msg.type || 'TEXT';

        // Verifica se a conversa já está aberta e focada na tela do atendente
        const isCurrentChatOpen = typeof window !== 'undefined' && 
          window.location.pathname.startsWith('/inbox') && 
          (window.location.search.includes(`chat=${convId}`) || window.location.search.includes(`conversationId=${convId}`));

        // Se o operador não estiver com este chat aberto na tela, dispara o Toast flutuante
        if (!isCurrentChatOpen && convId) {
          showLeadMessageToast({
            conversationId: convId,
            contactName,
            contactAvatar,
            contactPhone,
            messageContent: content,
            messageType: msgType
          }, router);
        }

        // Incrementa badge de não lido na barra lateral se fora do Inbox
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/inbox')) {
          setHasGlobalUnread(true);
        }

        // Debounce acústico inteligente: Toca o chime e vibra apenas 1 vez por contato a cada 3.5 segundos
        const now = Date.now();
        const soundKey = convId || contactPhone || 'global_inbound';
        const lastPlayed = lastSoundTriggeredRef.current[soundKey] || 0;

        if (now - lastPlayed > 3500) {
          playNotificationSound(false);
          triggerVibration(false);
          lastSoundTriggeredRef.current[soundKey] = now;
        }

        // Se aba em background / minimizada, dispara Web Push Notification e pisca a aba
        if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
          triggerTabBlink(`💬 [1] ${contactName}`);
          dispatchDesktopNotification(`Vallor · ${contactName}`, {
            body: content.length > 80 ? `${content.substring(0, 80)}...` : content || 'Enviou uma nova mensagem',
            tag: `msg_${convId || 'general'}`,
            url: convId ? `/inbox?conversationId=${convId}` : '/inbox'
          });
        }
      }
    });

    // Escuta global para Atendimentos Transferidos (Padrão Lero / Transfer Alert)
    socketInstance.on('conversationTransferred', (data) => {
      // Suprime absolutamente notificações em login, público, deslogado ou super-admin
      if (isUnauthenticatedOrPublic()) return;

      console.log('⚡ [WebSockets] Atendimento transferido recebido:', data);
      const convId = data.conversationId;
      const contactName = data.contact?.name || 'Lead';
      const contactPhone = data.contact?.phone || null;
      const departmentName = data.department?.name || 'Seu Setor';
      const transferredBy = data.transferredBy || 'Um colega de equipe';

      if (convId) {
        showTransferAlertToast({
          conversationId: convId,
          contactName,
          contactPhone,
          departmentName,
          transferredBy
        }, router);
      }

      // Alerta sonoro de alta prioridade e vibração
      playNotificationSound(true);
      triggerVibration(true);
      triggerTabBlink(`⚡ [TRANSFERÊNCIA] ${contactName}`);

      // Web Push Notification se em segundo plano
      if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
        dispatchDesktopNotification(`⚡ Vallor · Lead Transferido para Você!`, {
          body: `${contactName} foi transferido para ${departmentName} por ${transferredBy}. Clique para assumir.`,
          tag: `transfer_${convId || 'general'}`,
          url: convId ? `/inbox?conversationId=${convId}` : '/inbox'
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      window.removeEventListener('tenant_switched', handleTenantSwitched);
      socketInstance.disconnect();
    };
  }, [router, playNotificationSound, triggerVibration, dispatchDesktopNotification, triggerTabBlink, isUnauthenticatedOrPublic]);

  // Observa mudanças de rota do Next.js para alternar o isolamento do Super Admin vs Operacional vs Deslogado
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (isUnauthenticatedOrPublic()) {
      console.log('🛡️ [WebSockets] Rota deslogada/pública ativa: isolando socket de todas as salas operacionais.');
      socket.emit('leaveTenant');
      socket.emit('joinTenant', 'unauthenticated_isolated');
      return;
    }

    let tenantId: string | null = null;
    try {
      const targetTenant = localStorage.getItem('versus_target_tenant_id');
      if (targetTenant) {
        tenantId = targetTenant;
      } else {
        const userStr = localStorage.getItem('versus_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.tenantId) tenantId = user.tenantId;
        }
        if (!tenantId) {
          const savedTenant = localStorage.getItem('tenantId');
          if (savedTenant) tenantId = savedTenant;
        }
      }
    } catch (e) {}

    if (tenantId) {
      socket.emit('joinTenant', tenantId);
    } else {
      socket.emit('leaveTenant');
      socket.emit('joinTenant', 'unauthenticated_isolated');
    }
  }, [pathname, socket, isConnected, isUnauthenticatedOrPublic]);

  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    hasGlobalUnread,
    clearGlobalUnread,
    notificationPermission,
    requestNotificationPermission,
    playNotificationSound,
  }), [
    socket,
    isConnected,
    hasGlobalUnread,
    clearGlobalUnread,
    notificationPermission,
    requestNotificationPermission,
    playNotificationSound,
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );

};
