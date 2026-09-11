"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { SocketProvider } from "@/components/ui/SocketProvider";
import { WhatsAppProvider } from "@/components/ui/WhatsAppProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 segundos
            gcTime: 10 * 60 * 1000, // 10 minutos (cacheTime)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <WhatsAppProvider>
          {children}
          <Toaster position="top-right" theme="dark" />
        </WhatsAppProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}
