"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { showLeadMessageToast, showTransferAlertToast } from '@/components/notifications/NotificationToast';

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

  const clearGlobalUnread = () => setHasGlobalUnread(false);

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

  // Dispara áudio de notificação profissional (Arquivos Acústicos Reais + Fallback Sintetizado)
  const playNotificationSound = useCallback((isHighPriority = false) => {
    try {
      if (typeof window === 'undefined') return;
      if (window.location.pathname.startsWith('/super-admin')) return;

      // 1. Tenta reproduzir arquivo de áudio acústico de alta qualidade
      const preset = localStorage.getItem('versus_sound_preset') || 'glass';
      let soundPath = '/sounds/notification.wav';

      if (isHighPriority) {
        soundPath = '/sounds/transfer.wav';
      } else if (preset === 'pop') {
        soundPath = '/sounds/notification-pop.wav';
      } else {
        soundPath = '/sounds/notification-glass.wav';
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
  }, []);

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
    return window.location.pathname.startsWith('/super-admin');
  }, []);

  // Vibração Tátil (Mobile & dispositivos compatíveis)
  const triggerVibration = useCallback((isHighPriority = false) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (isSuperAdminRoute()) return;
        if (isHighPriority) {
          navigator.vibrate([120, 60, 120, 60, 200]);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (e) {}
  }, [isSuperAdminRoute]);

  // Disparo de Desktop / Web Push Notifications
  const dispatchDesktopNotification = useCallback((title: string, options: { body: string; tag?: string; url?: string }) => {
    try {
      if (isSuperAdminRoute()) return;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body: options.body,
          icon: '/favicon.ico',
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
  }, [router, isSuperAdminRoute]);

  // Efeito de piscar a aba do navegador
  const triggerTabBlink = useCallback((titleText: string) => {
    if (isSuperAdminRoute()) return;
    let isBlinking = false;
    const originalTitle = "VERSUS - Motor Omnichannel";
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
  }, [isSuperAdminRoute]);

  useEffect(() => {
    // Conecta ao próprio domínio (Vercel), que fará o proxy para a VPS
    const socketInstance = io({
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('📡 [WebSockets] Conectado ao Servidor em Tempo Real!', socketInstance.id);
      
      let tenantId = 'tenant_123';
      try {
        const userStr = localStorage.getItem('versus_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.tenantId) tenantId = user.tenantId;
        }
        if (!tenantId || tenantId === 'tenant_123') {
          const savedTenant = localStorage.getItem('tenantId');
          if (savedTenant) tenantId = savedTenant;
        }
      } catch (e) {}

      socketInstance.emit('joinTenant', tenantId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('📡 [WebSockets] Desconectado.');
    });

    // Escuta global para Alerta de Handoff da IA (Lead Qualificado)
    socketInstance.on('dealUpdated', (deal) => {
      // Suprime notificações no console Master Super Admin (/super-admin)
      if (isSuperAdminRoute()) return;

      toast.error(`🚨 Lead Qualificado pela IA!\nUm novo lead precisa de atendimento humano.\nAcesse o Pipeline CRM.`, {
        duration: 8000,
        position: 'top-right',
        style: { background: '#0B1224', color: '#fff', border: '1px solid #ef4444' }
      });
      playNotificationSound(true);
      triggerVibration(true);
      triggerTabBlink("🚨 [1] LEAD QUALIFICADO!");
      
      if (document.hidden || !document.hasFocus()) {
        dispatchDesktopNotification("🚨 VERSUS · Lead Qualificado!", {
          body: "Um novo lead atingiu critérios de qualificação e aguarda contato humano.",
          tag: `deal_${deal?.id || 'alert'}`,
          url: "/crm"
        });
      }
    });

    // Escuta global para novas mensagens recebidas de Leads (INBOUND)
    socketInstance.on('newMessage', (msg) => {
      // Suprime notificações no console Master Super Admin (/super-admin)
      if (isSuperAdminRoute()) return;

      if (msg.direction === 'INBOUND') {
        const convId = msg.conversationId || msg.contact?.conversationId || (msg.contactId ? `conv_${msg.contactId}` : null);
        const contactName = msg.contact?.name || msg.contactName || 'Lead Interessado';
        const contactAvatar = msg.contact?.avatarUrl || msg.contact?.avatar || null;
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

        // Toca o Chime harmônico e vibra
        playNotificationSound(false);
        triggerVibration(false);

        // Se aba em background / minimizada, dispara Web Push Notification e pisca a aba
        if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
          triggerTabBlink(`💬 [1] ${contactName}`);
          dispatchDesktopNotification(`VERSUS · ${contactName}`, {
            body: content.length > 80 ? `${content.substring(0, 80)}...` : content || 'Enviou uma nova mensagem',
            tag: `msg_${convId || 'general'}`,
            url: convId ? `/inbox?conversationId=${convId}` : '/inbox'
          });
        }
      }
    });

    // Escuta global para Atendimentos Transferidos (Padrão Lero / Transfer Alert)
    socketInstance.on('conversationTransferred', (data) => {
      // Suprime notificações no console Master Super Admin (/super-admin)
      if (isSuperAdminRoute()) return;

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
        dispatchDesktopNotification(`⚡ VERSUS · Lead Transferido para Você!`, {
          body: `${contactName} foi transferido para ${departmentName} por ${transferredBy}. Clique para assumir.`,
          tag: `transfer_${convId || 'general'}`,
          url: convId ? `/inbox?conversationId=${convId}` : '/inbox'
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router, playNotificationSound, triggerVibration, dispatchDesktopNotification, triggerTabBlink]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      hasGlobalUnread, 
      clearGlobalUnread,
      notificationPermission,
      requestNotificationPermission,
      playNotificationSound
    }}>
      {children}
    </SocketContext.Provider>
  );
};
