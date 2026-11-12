"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { showLeadMessageToast, showTransferAlertToast, showLeadQualifiedToast } from '@/components/notifications/NotificationToast';
import { sanitizeAvatarUrl } from '@/lib/avatarUtils';

import { getStoredToken } from '@/lib/api';
import api from '@/lib/api';
import { clearAuthCookie } from '@/lib/authCookies';
import { 
  getSoundSettings, 
  isSoundChannelMuted, 
  getChannelVolumeMultiplier, 
  isVisualNotificationEnabled,
  SOUND_SETTINGS_EVENT,
  SoundSettings,
  DEFAULT_SOUND_SETTINGS
} from '@/lib/soundSettings';
import { canUserAccessWhatsApp, getStoredUserSync, getCachedUser } from '@/lib/userCache';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  hasGlobalUnread: boolean;
  clearGlobalUnread: () => void;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  playNotificationSound: (isHighPriority?: boolean, channel?: 'whatsapp' | 'instagram' | 'support' | 'system') => void;
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
  const soundSettingsRef = useRef<SoundSettings>(DEFAULT_SOUND_SETTINGS);
  const userDeptIdsRef = useRef<string[]>([]);

  // Sincroniza configurações de som em tempo real
  useEffect(() => {
    soundSettingsRef.current = getSoundSettings();

    const handleSoundSettingsChange = (e: any) => {
      if (e?.detail) {
        soundSettingsRef.current = { ...DEFAULT_SOUND_SETTINGS, ...e.detail };
      } else {
        soundSettingsRef.current = getSoundSettings();
      }
    };

    window.addEventListener(SOUND_SETTINGS_EVENT, handleSoundSettingsChange);
    window.addEventListener('storage', handleSoundSettingsChange);
    return () => {
      window.removeEventListener(SOUND_SETTINGS_EVENT, handleSoundSettingsChange);
      window.removeEventListener('storage', handleSoundSettingsChange);
    };
  }, []);

  // Sincroniza e mantém em memória os Setores/Regiões permitidos do operador logado
  useEffect(() => {
    const syncUserDepartments = async () => {
      if (typeof window === 'undefined') return;
      const token = getStoredToken();
      if (!token) {
        userDeptIdsRef.current = [];
        return;
      }

      const localUser = getStoredUserSync();
      if (Array.isArray(localUser?.departments) && localUser.departments.length > 0) {
        userDeptIdsRef.current = localUser.departments
          .map((d: any) => d.departmentId || d.department?.id || d.id)
          .filter(Boolean);
      }

      try {
        const freshUser = await getCachedUser(true);
        if (Array.isArray(freshUser?.departments) && freshUser.departments.length > 0) {
          userDeptIdsRef.current = freshUser.departments
            .map((d: any) => d.departmentId || d.department?.id || d.id)
            .filter(Boolean);
          return;
        }
      } catch {}

      try {
        const res = await api.get('/departments');
        if (Array.isArray(res.data)) {
          userDeptIdsRef.current = res.data.map((d: any) => d.id).filter(Boolean);
        }
      } catch {}
    };

    syncUserDepartments();
    window.addEventListener('user_updated', syncUserDepartments);
    window.addEventListener('tenant_switched', syncUserDepartments);
    return () => {
      window.removeEventListener('user_updated', syncUserDepartments);
      window.removeEventListener('tenant_switched', syncUserDepartments);
    };
  }, [pathname]);

  // Verifica se o operador logado pode receber alerta/som para uma conversa ou deal específico
  const shouldNotifyOperator = useCallback((payload: { departmentId?: string | null; department?: { id?: string } | null; assignedTo?: string | null; metadata?: any }) => {
    const currentUser = getStoredUserSync();
    if (!currentUser) return false;

    const currentUserId = currentUser.id;
    const roleUpper = String(currentUser.role || '').toUpperCase();
    const isMaster = Boolean(
      currentUser.isSuperAdmin ||
      roleUpper === 'ADMIN' ||
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'SUPERADMIN'
    );

    // Administradores e Super Admins recebem visão global
    if (isMaster) return true;

    const targetAssignedTo = payload?.assignedTo || null;
    const targetDeptId = payload?.departmentId || payload?.department?.id || payload?.metadata?.departmentId || null;

    // 1. Se está atribuído diretamente a MIM -> sempre notifica
    if (targetAssignedTo && currentUserId && targetAssignedTo === currentUserId) {
      return true;
    }

    // 2. Para operadores (AGENT), verifica se a conversa pertence a uma das suas Regiões / Setores permitidos
    const allowedDepts = userDeptIdsRef.current.length > 0
      ? userDeptIdsRef.current
      : Array.isArray(currentUser.departments)
      ? currentUser.departments.map((d: any) => d.departmentId || d.department?.id || d.id).filter(Boolean)
      : [];

    // Se o setor da mensagem está dentro dos setores permitidos deste atendente:
    if (targetDeptId && allowedDepts.includes(targetDeptId)) {
      // Se a mensagem está sem atendente (fila) OU atribuída a um usuário genérico/comercial,
      // ou se o atendente faz parte deste setor -> ele deve ser notificado!
      // Somente bloqueia se estiver atribuído explicitamente a OUTRO atendente físico individual que não seja 'Comercial' / 'Comercial Verto'
      return true;
    }

    return false;
  }, []);

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
    const token = getStoredToken();
    
    // Sem token = categoricamente deslogado
    if (!token) return true;

    // Rotas de login, autenticação ou públicas
    if (
      p.includes('/login') || 
      p.includes('/auth') || 
      p.includes('/register') || 
      p.includes('/forgot') || 
      p.includes('/reset-password')
    ) {
      return true;
    }

    return false;
  }, []);

  // Dispara áudio de notificação profissional respeitando rigorosamente preferências e silenciamento
  const playNotificationSound = useCallback((
    isHighPriority = false,
    channel: 'whatsapp' | 'instagram' | 'support' | 'system' = 'whatsapp'
  ) => {
    try {
      if (typeof window === 'undefined') return;
      if (isUnauthenticatedOrPublic()) return;

      // 1. Verificação em tempo real de Silenciamento Mestre ou por Canal
      const currentSettings = getSoundSettings();
      soundSettingsRef.current = currentSettings;

      if (currentSettings.masterMute) {
        // Silenciar Todos os Sons ativado: interrompe imediatamente qualquer áudio
        return;
      }

      if (isSoundChannelMuted(channel)) {
        // Canal específico (ex: whatsapp ou instagram) desativado pelo operador
        return;
      }

      const volumeMultiplier = getChannelVolumeMultiplier(channel);
      if (volumeMultiplier <= 0) return;

      // 2. Tenta reproduzir arquivo de áudio acústico de alta qualidade
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
      const baseVolume = isHighPriority ? 0.75 : 0.65;
      audio.volume = Math.max(0, Math.min(1, baseVolume * volumeMultiplier));
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback resiliente via Web Audio API caso o navegador bloqueie áudio externo
          playSynthesizedFallback(isHighPriority, volumeMultiplier);
        });
      }
    } catch (e) {
      const volumeMultiplier = getChannelVolumeMultiplier(channel);
      if (volumeMultiplier > 0 && !getSoundSettings().masterMute) {
        playSynthesizedFallback(isHighPriority, volumeMultiplier);
      }
    }
  }, [isUnauthenticatedOrPublic]);

  const playSynthesizedFallback = (isHighPriority = false, volumeMultiplier = 0.8) => {
    try {
      if (typeof window === 'undefined') return;
      const currentSettings = getSoundSettings();
      if (currentSettings.masterMute || volumeMultiplier <= 0) return;

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
        gain.gain.linearRampToValueAtTime(0.12 * volumeMultiplier, now + 0.02);
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
          gain.gain.linearRampToValueAtTime(0.15 * volumeMultiplier, st + 0.02);
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

  // Disparo de Desktop / Mobile OS Push Notifications via Service Worker
  const dispatchDesktopNotification = useCallback(async (
    title: string, 
    options: { 
      body: string; 
      tag?: string; 
      url?: string; 
      channel?: 'whatsapp' | 'instagram' | 'support' | 'system';
      icon?: string;
      badge?: string;
    }
  ) => {
    try {
      if (isUnauthenticatedOrPublic()) return;
      if (typeof window === 'undefined') return;

      // Se a permissão não foi concedida ainda, tenta solicitar
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {}
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const isMuted = getSoundSettings().masterMute || (options.channel ? isSoundChannelMuted(options.channel) : false);
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const defaultIcon = origin ? `${origin}/vallor/icon-192x192.png` : '/vallor/icon-192x192.png';
        const defaultBadge = origin ? `${origin}/vallor/badge-96x96.png` : '/vallor/badge-96x96.png';
        const iconUrl = options.icon ? (options.icon.startsWith('http') ? options.icon : `${origin}${options.icon.startsWith('/') ? '' : '/'}${options.icon}`) : defaultIcon;
        const badgeUrl = options.badge ? (options.badge.startsWith('http') ? options.badge : `${origin}${options.badge.startsWith('/') ? '' : '/'}${options.badge}`) : defaultBadge;
        const targetUrl = options.url 
          ? (options.url.startsWith('/vallor') ? options.url : `/vallor${options.url.startsWith('/') ? '' : '/'}${options.url}`) 
          : '/vallor/inbox';

        const notificationOptions = {
          body: options.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: options.tag || `vallor_${Date.now()}`,
          renotify: true,
          silent: isMuted,
          vibrate: isMuted ? undefined : [200, 100, 200],
          data: {
            url: targetUrl,
            dateOfArrival: Date.now()
          }
        };

        // PRIORIDADE 1: Service Worker (Obrigatório para Android / iOS PWA / Chrome Mobile)
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            if (registration && 'showNotification' in registration) {
              await (registration as any).showNotification(title, notificationOptions);
              return;
            }
          } catch (swErr) {
            console.warn('[Notification] ServiceWorker showNotification falhou, tentando fallback window.Notification:', swErr);
          }
        }

        // PRIORIDADE 2: Fallback padrão para Desktop tradicional
        try {
          const notif = new Notification(title, notificationOptions as any);
          notif.onclick = () => {
            window.focus();
            if (options.url) {
              router.push(options.url);
            }
            notif.close();
          };
        } catch (notifErr) {
          console.warn('[Notification] Fallback new Notification falhou:', notifErr);
        }
      }
    } catch (err) {
      console.warn('[Desktop/Mobile Notification] Erro ao disparar:', err);
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
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const directSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (isLocalhost ? 'http://localhost:3001' : undefined);

    const socketInstance = io(directSocketUrl || undefined, {
      autoConnect: true,
      transports: isVercelHost && !directSocketUrl ? ['polling'] : ['polling', 'websocket'],
      upgrade: !(isVercelHost && !directSocketUrl),
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
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
        try {
          const userStr = localStorage.getItem('versus_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.id) {
              socketInstance.emit('userPresence', { tenantId, userId: user.id });
            }
          }
        } catch (e) {}
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

    socketInstance.on('connect_error', (err: any) => {
      setIsConnected(false);
      const errMsg = String(err?.message || err?.description || '');
      console.warn('⚠️ [WebSockets] Falha de conexão/sessão:', errMsg);

      // Se a sessão expirou no backend (erro 400 'Session ID unknown') ou falha de transporte:
      // Força renovação da conexão sem o session id antigo
      if (errMsg.includes('400') || errMsg.includes('poll error') || errMsg.includes('Session ID') || (err as any)?.description === 400) {
        setTimeout(() => {
          if (socketInstance && !socketInstance.connected) {
            console.log('🔄 [WebSockets] Renovando handshake limpo...');
            try {
              (socketInstance.io as any).engine?.close();
            } catch (e) {}
            socketInstance.connect();
          }
        }, 1200);
      }
    });

    const handleForceReconnect = () => {
      console.log('🔄 [WebSockets] Reconexão forçada acionada.');
      if (socketInstance) {
        try {
          (socketInstance.io as any).engine?.close();
        } catch (e) {}
        socketInstance.disconnect();
        setTimeout(() => {
          socketInstance.connect();
        }, 300);
      }
    };
    window.addEventListener('reconnect_socket', handleForceReconnect);

    // Escuta global para Alerta de Handoff da IA (Lead Qualificado via Deal)
    socketInstance.on('dealUpdated', (deal) => {
      // Suprime absolutamente notificações em login, público, deslogado ou super-admin
      if (isUnauthenticatedOrPublic()) return;
      if (!canUserAccessWhatsApp()) return;
      if (!shouldNotifyOperator(deal || {})) return;

      showLeadQualifiedToast(
        {
          dealId: deal?.id,
          contactName: deal?.contact?.name || deal?.name || deal?.title || 'Lead Qualificado',
          contactPhone: deal?.contact?.phone || deal?.phone || null,
          product: deal?.value ? `R$ ${deal.value}` : (deal?.title || 'Oportunidade Comercial'),
          reason: deal?.notes || 'Lead qualificado pela IA e pronto para atendimento humano.',
        },
        router
      );
      playNotificationSound(true, 'system');
      triggerVibration(true);
      triggerTabBlink("🚨 [1] LEAD QUALIFICADO!");
      
      if (document.hidden || !document.hasFocus()) {
        dispatchDesktopNotification("🚨 Vallor · Lead Qualificado!", {
          body: "Um novo lead atingiu critérios de qualificação e aguarda contato humano.",
          tag: `deal_${deal?.id || 'alert'}`,
          url: "/crm",
          channel: 'system'
        });
      }
    });

    // Escuta direta de Transbordo Humano da IA (aiHandoffAlert)
    socketInstance.on('aiHandoffAlert', (data) => {
      if (isUnauthenticatedOrPublic()) return;
      if (!canUserAccessWhatsApp()) return;
      if (!shouldNotifyOperator(data || {})) return;

      showLeadQualifiedToast(
        {
          conversationId: data?.conversationId,
          contactName: data?.contactName || 'Lead Qualificado',
          contactPhone: data?.contactPhone || data?.phone,
          product: data?.product,
          reason: data?.reason || data?.summary,
          dealId: data?.dealId,
        },
        router
      );
      playNotificationSound(true, 'system');
      triggerVibration(true);
      triggerTabBlink("🚨 [1] TRANSBORDO IA!");

      if (document.hidden || !document.hasFocus()) {
        const deptName = data?.department?.name || 'Comercial';
        dispatchDesktopNotification(`Novo atendimento na fila · ${deptName}`, {
          body: `${data?.contactName || 'Lead Qualificado'} aguarda atendimento na fila do setor ${deptName}: ${data?.reason || data?.summary || "Transferido pela IA."}`,
          tag: `handoff_${data?.conversationId || 'alert'}`,
          url: data?.conversationId ? `/inbox?conversationId=${data.conversationId}` : "/inbox",
          channel: 'system'
        });
      }
    });

    // Escuta global para novas mensagens recebidas de Leads (INBOUND)
    socketInstance.on('newMessage', (msg) => {
      // 1. Suprime absolutamente notificações em login, público, deslogado ou super-admin
      if (isUnauthenticatedOrPublic()) return;

      // 2. ISOLAMENTO ESTRITO DE SEGURANÇA:
      // Se o operador logado NÃO possui permissão para WhatsApp / Atendimento, aborta na raiz!
      if (!canUserAccessWhatsApp()) return;

      // 3. ISOLAMENTO ESTRITO POR REGIÃO / SETOR / ATRIBUIÇÃO:
      // Cada operador recebe alerta e som SOMENTE das mensagens do seu próprio setor/região!
      if (!shouldNotifyOperator(msg || {})) return;

      if (msg.direction === 'INBOUND') {
        const convId = msg.conversationId || msg.contact?.conversationId || (msg.contactId ? `conv_${msg.contactId}` : null);
        const contactName = msg.contact?.name || msg.contactName || 'Lead Interessado';
        const contactAvatar = sanitizeAvatarUrl(msg.contact?.avatarUrl || msg.contact?.avatar);
        const contactPhone = msg.contact?.phone || null;
        const content = msg.content || msg.text || '';
        const msgType = msg.mediaType || msg.type || 'TEXT';

        // Determina o canal (WhatsApp vs Instagram)
        const isInstagram = 
          msg.channel === 'INSTAGRAM' || 
          msg.conversation?.channel === 'INSTAGRAM' || 
          msg.source === 'INSTAGRAM' || 
          msg.provider === 'INSTAGRAM';
        const channelType: 'whatsapp' | 'instagram' = isInstagram ? 'instagram' : 'whatsapp';

        // Verifica se a conversa já está aberta e focada na tela do atendente
        const isCurrentChatOpen = typeof window !== 'undefined' && 
          window.location.pathname.startsWith('/inbox') && 
          (window.location.search.includes(`chat=${convId}`) || window.location.search.includes(`conversationId=${convId}`));

        // -------------------------------------------------------------
        // 1. NOTIFICAÇÃO VISUAL NA TELA (Independente do som)
        // -------------------------------------------------------------
        // Se o operador não estiver com este chat aberto na tela e os popups visuais estiverem ativados:
        if (!isCurrentChatOpen && convId && isVisualNotificationEnabled('whatsapp')) {
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

        // -------------------------------------------------------------
        // 2. ALERTA SONORO ACÚSTICO (Independente do visual)
        // -------------------------------------------------------------
        // Toca SE E SOMENTE SE o som geral NÃO estiver silenciado e o canal de áudio estiver habilitado
        const currentSoundSettings = getSoundSettings();
        const isAudioSilenced = currentSoundSettings.masterMute || isSoundChannelMuted(channelType);

        if (!isAudioSilenced) {
          const now = Date.now();
          const soundKey = convId || contactPhone || 'global_inbound';
          const lastPlayed = lastSoundTriggeredRef.current[soundKey] || 0;

          if (now - lastPlayed > 3500) {
            playNotificationSound(false, channelType);
            triggerVibration(false);
            lastSoundTriggeredRef.current[soundKey] = now;
          }
        }

        // -------------------------------------------------------------
        // 3. NOTIFICAÇÃO DESKTOP / PUSH (Respeita modo foco e mobile)
        // -------------------------------------------------------------
        if (isVisualNotificationEnabled('whatsapp')) {
          if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus() || !isCurrentChatOpen)) {
            triggerTabBlink(`💬 [1] ${contactName}`);

            const isWaitingInQueue = msg.conversation?.status === 'waiting' || !msg.assignedTo;
            const deptName = msg.department?.name || msg.conversation?.department?.name || 'Atendimento';

            const notifTitle = isWaitingInQueue && (!msg.assignedTo || msg.isFirstMessage)
              ? `Novo atendimento na fila · ${deptName}`
              : contactName;

            const notifBody = isWaitingInQueue && (!msg.assignedTo || msg.isFirstMessage)
              ? `${contactName} aguarda atendimento na fila do setor ${deptName}`
              : (content.length > 80 ? `${content.substring(0, 80)}...` : content || 'Enviou uma nova mensagem');

            dispatchDesktopNotification(notifTitle, {
              body: notifBody,
              tag: `msg_${convId || 'general'}`,
              url: convId ? `/inbox?conversationId=${convId}` : '/inbox',
              channel: channelType
            });
          }
        }
      }
    });

    // Escuta global para mensagens da Equipe / Chat Interno
    socketInstance.on('newTeamMessage', (msg: any) => {
      if (isUnauthenticatedOrPublic()) return;

      const currentUser = getStoredUserSync();
      const currentUserId = currentUser?.id || '';

      // Não notifica mensagens enviadas pelo próprio usuário
      if (msg.senderId && currentUserId && msg.senderId === currentUserId) return;

      // Se for mensagem direta, só notifica se for direcionada ao usuário logado
      if (msg.receiverId && currentUserId && msg.receiverId !== currentUserId) return;

      const senderName = msg.sender?.name || 'Membro da Equipe';
      const body = msg.content || (msg.mediaUrl ? '📎 Arquivo compartilhado' : 'Nova mensagem interna');
      const isChatInternoOpen = typeof window !== 'undefined' && 
        window.location.pathname.startsWith('/chat-interno') && 
        (window.location.search.includes(msg.senderId) || (msg.channelId && window.location.search.includes(msg.channelId)));

      // Som e vibração
      playNotificationSound(false, 'system');
      triggerVibration();
      triggerTabBlink(`💬 Mensagem de ${senderName}`);

      // Notificação nativa desktop
      dispatchDesktopNotification(`💬 Chat Interno: ${senderName}`, {
        body,
        tag: `team_msg_${msg.id}`,
        url: msg.channelId ? `/chat-interno?channelId=${msg.channelId}` : `/chat-interno?userId=${msg.senderId}`,
        channel: 'system'
      });

      // Se o atendente não estiver com a conversa específica aberta, mostra Toast na tela
      if (!isChatInternoOpen) {
        toast((t) => (
          <div 
            onClick={() => {
              toast.dismiss(t.id);
              router.push(msg.channelId ? `/chat-interno?channelId=${msg.channelId}` : `/chat-interno?userId=${msg.senderId}`);
            }}
            className="flex items-center gap-3 cursor-pointer py-1"
          >
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{senderName}</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">Equipe</span>
              </p>
              <p className="text-xs text-slate-300 truncate">{body}</p>
            </div>
          </div>
        ), {
          duration: 6000,
          style: {
            background: '#0B1224',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#fff',
            borderRadius: '12px'
          }
        });
      }
    });

    // Escuta global de Encerramento Remoto de Sessão (SOC Security)
    socketInstance.on('session_terminated', (data: { sessionId?: string; userId?: string; all?: boolean; exceptUserId?: string; exceptToken?: string; reason?: string }) => {
      const currentToken = getStoredToken();
      if (data?.exceptToken && currentToken && (data.exceptToken === currentToken || data.exceptToken.includes(currentToken) || currentToken.includes(data.exceptToken))) {
        return; // Preserva a aba atual que disparou a derrubada
      }

      const currentUser = getStoredUserSync();
      if (!currentUser && !currentToken) return;

      if (data?.all || (data?.userId && currentUser && data.userId === currentUser.id)) {
        console.warn('🚨 [SOC Security] Sessão encerrada pela central de segurança.', data);
        clearAuthCookie();
        localStorage.removeItem('versus_auth_token');
        localStorage.removeItem('versus_token');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('versus_user');
        window.location.href = '/login?revoked=true';
      }
    });

    // Escuta global para Atendimentos Transferidos (Padrão Lero / Transfer Alert Inteligente)
    socketInstance.on('conversationTransferred', (data) => {
      // Suprime absolutamente notificações em rotas de autenticação ou públicas
      if (isUnauthenticatedOrPublic()) return;

      // Isolamento de segurança: se não tem permissão para WhatsApp, ignora transferências
      if (!canUserAccessWhatsApp()) return;

      const currentUser = getStoredUserSync();
      const currentUserId = currentUser?.id;
      const isSuperAdminOrAdmin = Boolean(
        currentUser?.isSuperAdmin || 
        String(currentUser?.role).toUpperCase() === 'ADMIN' || 
        String(currentUser?.role).toUpperCase() === 'SUPER_ADMIN'
      );

      // 1. Não notificar o próprio operador que realizou a transferência (evita eco desnecessário)
      if (data.transferredById && currentUserId && data.transferredById === currentUserId) {
        console.log('⚡ [WebSockets] Transferência originada pelo próprio operador logado. Alerta de eco suprimido.');
        return;
      }

      // 2. Análise de Destinatário: Atribuição Nominal vs Fila de Setor
      const isDirectToMe = Boolean(data.assignedTo && data.assignedTo === currentUserId);
      const isDirectToOther = Boolean(data.assignedTo && data.assignedTo !== currentUserId);

      // Departamentos aos quais o usuário logado pertence
      const userDeptIds: string[] = userDeptIdsRef.current.length > 0
        ? userDeptIdsRef.current
        : Array.isArray(currentUser?.departments)
        ? currentUser.departments.map((d: any) => d.departmentId || d.department?.id || d.id).filter(Boolean)
        : [];
      
      const targetDeptId = data.department?.id || data.departmentId;
      const isMyDepartment = Boolean(targetDeptId && userDeptIds.includes(targetDeptId));

      // 3. Matriz de Entrega Seletiva:
      // Se foi transferido diretamente para OUTRO atendente e eu NÃO sou admin/supervisor -> Ignora
      if (isDirectToOther && !isSuperAdminOrAdmin) {
        return;
      }

      // Se foi transferido para a fila de um setor e eu NÃO pertenço àquele setor e NÃO sou admin/supervisor -> Ignora
      if (!data.assignedTo && !isMyDepartment && !isSuperAdminOrAdmin) {
        return;
      }

      console.log('⚡ [WebSockets] Atendimento transferido direcionado recebido:', data);
      const convId = data.conversationId;
      const contactName = data.contact?.name || 'Lead';
      const contactPhone = data.contact?.phone || null;
      const departmentName = data.department?.name || 'Seu Setor';
      const transferredBy = data.transferredBy || 'Um colega de equipe';

      // 4. Popup visual na tela com o novo tema Índigo / Violeta Imperial
      if (convId && isVisualNotificationEnabled('transfers')) {
        showTransferAlertToast({
          conversationId: convId,
          contactName,
          contactPhone,
          departmentName,
          transferredBy,
          isDirectToMe,
        }, router);
      }

      // 5. Alerta sonoro de alta prioridade (respeita silenciamento)
      const currentSoundSettings = getSoundSettings();
      if (!currentSoundSettings.masterMute && !isSoundChannelMuted('support')) {
        playNotificationSound(true, 'support');
        triggerVibration(true);
      }

      // 6. Piscar o título da aba do navegador (elegante, sem emojis)
      const tabTitle = isDirectToMe 
        ? `[NOVO ATENDIMENTO] ${contactName}` 
        : `[TRANSFERÊNCIA] ${contactName}`;
      triggerTabBlink(tabTitle);

      // 7. Web Push Notification se em segundo plano e com visual ativo
      if (isVisualNotificationEnabled('transfers')) {
        if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
          const pushTitle = isDirectToMe 
            ? `Novo atendimento atribuído · ${departmentName || 'Atendimento'}` 
            : `Novo atendimento na fila · ${departmentName || 'Atendimento'}`;
          
          const pushBody = isDirectToMe
            ? `${contactName} foi atribuído diretamente a você por ${transferredBy}. Clique para assumir.`
            : `${contactName} aguarda atendimento na fila do setor ${departmentName || 'Atendimento'}. Clique para assumir.`;

          dispatchDesktopNotification(pushTitle, {
            body: pushBody,
            tag: `transfer_${convId || 'general'}`,
            url: convId ? `/inbox?conversationId=${convId}` : '/inbox',
            channel: 'support'
          });
        }
      }
    });

    setSocket(socketInstance);

    return () => {
      window.removeEventListener('tenant_switched', handleTenantSwitched);
      window.removeEventListener('reconnect_socket', handleForceReconnect);
      socketInstance.disconnect();
    };
  }, [router, playNotificationSound, triggerVibration, dispatchDesktopNotification, triggerTabBlink, isUnauthenticatedOrPublic, shouldNotifyOperator]);

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
      try {
        const userStr = localStorage.getItem('versus_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.id) {
            socket.emit('userPresence', { tenantId, userId: user.id });
          }
        }
      } catch (e) {}
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
