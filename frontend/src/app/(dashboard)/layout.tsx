"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SupportModeBanner from "@/components/dashboard/SupportModeBanner";
import TrialBanner from "@/components/dashboard/TrialBanner";
import FloatingSupportWidget from "@/components/support/FloatingSupportWidget";
import PlanGuardWrapper from "@/components/guards/PlanGuardWrapper";
import AuthGuard from "@/components/guards/AuthGuard";
import BottomNav from "@/components/navigation/BottomNav";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isFullBleedPage = Boolean(
    pathname === "/inbox" || 
    pathname.startsWith("/inbox/") || 
    pathname === "/chat-interno" || 
    pathname.startsWith("/chat-interno/") || 
    pathname === "/team-chat" || 
    pathname.startsWith("/team-chat/")
  );

  return (
    <AuthGuard>
      <div className="h-screen flex w-full overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white print:block print:w-full">
        {/* Sidebar Lateral (Navegação Principal: desktop fixo, mobile drawer) */}
        <Suspense fallback={<aside className="w-16 md:w-64 h-full bg-[#050814] shrink-0" />}>
          <Sidebar />
        </Suspense>

        {/* Área Principal (Conteúdo e Topbar) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative print:block print:h-auto print:overflow-visible print:w-full print:p-0 print:m-0 min-w-0">
          {!isFullBleedPage && <Topbar />}
          <SupportModeBanner />
          <TrialBanner />
          
          {/* Container do conteúdo de cada tela com proteção de plano e governança */}
          <div className={
            isFullBleedPage 
              ? "flex-1 overflow-hidden h-full w-full p-0 m-0 pb-0 md:pb-0"
              : "flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 md:p-8 pb-28 md:pb-8 print:block print:h-auto print:overflow-visible print:p-0 print:m-0"
          }>
            <PlanGuardWrapper>
              {children}
            </PlanGuardWrapper>
          </div>

          {/* Barra de Navegação Inferior Mobile (Estilo App) */}
          <BottomNav />
        </main>
        <FloatingSupportWidget />
        <Toaster position="bottom-left" />
      </div>
    </AuthGuard>
  );
}
