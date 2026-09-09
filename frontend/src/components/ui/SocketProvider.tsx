"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  hasGlobalUnread: boolean;
  clearGlobalUnread: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  hasGlobalUnread: false,
  clearGlobalUnread: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasGlobalUnread, setHasGlobalUnread] = useState(false);
  const pathname = usePathname();

  const clearGlobalUnread = () => setHasGlobalUnread(false);

  useEffect(() => {
    // Conecta ao Back-end (NestJS) na porta 3001
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('📡 [WebSockets] Conectado ao Servidor em Tempo Real!', socketInstance.id);
      
      // Simulação: Entrar na sala do Tenant 123
      socketInstance.emit('joinTenant', 'tenant_123');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('📡 [WebSockets] Desconectado.');
    });

    // Função utilitária de Alerta Extremo (Beep + Tab Blink)
    const triggerAlert = (titleText: string) => {
      // 2. Alerta Sonoro (Beep usando API do Navegador)
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = 880;
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch(e) { console.warn("Beep indisponível", e); }

      // 3. Piscar a Aba do Navegador
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
    };

    // Escuta global para Alerta de Handoff da IA
    socketInstance.on('dealUpdated', (deal) => {
      // 1. Toast Visual
      toast.error(`🚨 Lead Qualificado pela IA!\nUm novo lead precisa de atendimento humano.\nAcesse o Pipeline CRM.`, {
        duration: 8000,
        position: 'top-right',
        style: { background: '#0B1224', color: '#fff', border: '1px solid #ef4444' }
      });
      triggerAlert("🚨 [1] LEAD QUALIFICADO!");
    });

    // Escuta global para novas mensagens recebidas
    socketInstance.on('newMessage', (msg) => {
      if (msg.direction === 'INBOUND') {
        // Marca que há mensagem não lida globalmente apenas se não estiver na Caixa de Entrada
        if (!window.location.pathname.startsWith('/inbox')) {
          setHasGlobalUnread(true);
        }
        
        if (!document.hasFocus()) {
          triggerAlert("💬 [1] Nova Mensagem");
        }
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, hasGlobalUnread, clearGlobalUnread }}>
      {children}
    </SocketContext.Provider>
  );
};
