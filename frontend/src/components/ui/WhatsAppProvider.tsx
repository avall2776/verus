"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

export interface WhatsAppInstance {
  id: string;
  tenantId: string;
  name: string;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  profileName?: string | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'qrcode';
  qrCode?: string | null;
  phoneNumberId?: string | null;
  isDefault: boolean;
  settings?: {
    antiBanEnabled: boolean;
    typingDelayMs: number;
    messageDelayMs: number;
  };
  lastConnectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  history?: {
    id: string;
    status: string;
    details?: string | null;
    timestamp: string;
  }[];
}

interface WhatsAppStatus {
  hasToken: boolean;
  status: 'connected' | 'disconnected';
  metaPhoneNumberId?: string | null;
  instanceName?: string;
  profilePicUrl?: string | null;
}

interface WhatsAppContextProps {
  status: WhatsAppStatus;
  instances: WhatsAppInstance[];
  activeInstance: WhatsAppInstance | null;
  setActiveInstance: (inst: WhatsAppInstance | null) => void;
  refreshStatus: () => Promise<void>;
  refreshInstances: () => Promise<void>;
  isLoading: boolean;
}

const WhatsAppContext = createContext<WhatsAppContextProps>({
  status: { hasToken: false, status: 'disconnected' },
  instances: [],
  activeInstance: null,
  setActiveInstance: () => {},
  refreshStatus: async () => {},
  refreshInstances: async () => {},
  isLoading: true,
});

export const useWhatsApp = () => useContext(WhatsAppContext);

export const WhatsAppProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<WhatsAppStatus>({ hasToken: false, status: 'disconnected' });
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [activeInstance, setActiveInstance] = useState<WhatsAppInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshInstances = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/instances');
      const data: WhatsAppInstance[] = res.data || [];
      setInstances(data);

      // Define instância ativa atual ou default
      setActiveInstance(prev => {
        if (prev) {
          const updated = data.find(i => i.id === prev.id);
          if (updated) return updated;
        }
        const defaultInst = data.find(i => i.isDefault) || data[0] || null;
        return defaultInst;
      });

      // Atualiza status legado
      const defaultInst = data.find(i => i.isDefault) || data[0];
      if (defaultInst) {
        setStatus({
          hasToken: !!defaultInst.phoneNumberId || (defaultInst as any).hasToken,
          status: defaultInst.status === 'connected' ? 'connected' : 'disconnected',
          metaPhoneNumberId: defaultInst.phoneNumberId,
          instanceName: defaultInst.name,
          profilePicUrl: defaultInst.profilePicUrl
        });
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp instances', error);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/config');
      setStatus({
        hasToken: res.data.hasToken,
        status: res.data.status === 'connected' ? 'connected' : 'disconnected',
        metaPhoneNumberId: res.data.metaPhoneNumberId,
        instanceName: res.data.instanceName,
        profilePicUrl: res.data.profilePicUrl
      });
      await refreshInstances();
    } catch (error) {
      console.error('Failed to fetch WhatsApp status', error);
      setStatus({ hasToken: false, status: 'disconnected' });
    } finally {
      setIsLoading(false);
    }
  }, [refreshInstances]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Limpa e recarrega conexões de forma reativa quando o Super Admin alternar de tenant
  useEffect(() => {
    const handleTenantSwitched = () => {
      setInstances([]);
      setActiveInstance(null);
      setStatus({ hasToken: false, status: 'disconnected' });
      refreshStatus();
    };

    window.addEventListener('tenant_switched', handleTenantSwitched);
    return () => window.removeEventListener('tenant_switched', handleTenantSwitched);
  }, [refreshStatus]);

  return (
    <WhatsAppContext.Provider value={{ 
      status, 
      instances, 
      activeInstance, 
      setActiveInstance, 
      refreshStatus, 
      refreshInstances, 
      isLoading 
    }}>
      {children}
    </WhatsAppContext.Provider>
  );
};
