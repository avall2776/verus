"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { SocketProvider } from "@/components/ui/SocketProvider";
import { WhatsAppProvider } from "@/components/ui/WhatsAppProvider";
import SecurityShieldProvider from "@/components/security/SecurityShieldProvider";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

function ThemeAwareToaster() {
  const { theme } = useTheme();
  const toasterTheme = theme === "whatsapp" ? "dark" : theme;
  return <Toaster position="bottom-left" theme={toasterTheme} richColors />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos de dados frescos
            gcTime: 15 * 60 * 1000, // 15 minutos em memória cache
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <WhatsAppProvider>
            <SecurityShieldProvider>
              <MobileMenuProvider>
                {children}
                {mounted && <ThemeAwareToaster />}
              </MobileMenuProvider>
            </SecurityShieldProvider>
          </WhatsAppProvider>
        </SocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

