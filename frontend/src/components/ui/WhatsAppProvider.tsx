"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface WhatsAppStatus {
  hasToken: boolean;
  status: 'connected' | 'disconnected';
  metaPhoneNumberId?: string | null;
}

interface WhatsAppContextProps {
  status: WhatsAppStatus;
  refreshStatus: () => Promise<void>;
  isLoading: boolean;
}

const WhatsAppContext = createContext<WhatsAppContextProps>({
  status: { hasToken: false, status: 'disconnected' },
  refreshStatus: async () => {},
  isLoading: true,
});

export const useWhatsApp = () => useContext(WhatsAppContext);

export const WhatsAppProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<WhatsAppStatus>({ hasToken: false, status: 'disconnected' });
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await axios.get('http://localhost:3001/whatsapp/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({
        hasToken: res.data.hasToken,
        status: res.data.status,
        metaPhoneNumberId: res.data.metaPhoneNumberId,
      });
    } catch (error) {
      console.error('Failed to fetch WhatsApp status', error);
      setStatus({ hasToken: false, status: 'disconnected' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <WhatsAppContext.Provider value={{ status, refreshStatus, isLoading }}>
      {children}
    </WhatsAppContext.Provider>
  );
};
