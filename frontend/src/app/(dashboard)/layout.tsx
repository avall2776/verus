import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SupportModeBanner from "@/components/dashboard/SupportModeBanner";
import TrialBanner from "@/components/dashboard/TrialBanner";
import FloatingSupportWidget from "@/components/support/FloatingSupportWidget";
import PlanGuardWrapper from "@/components/guards/PlanGuardWrapper";
import BottomNav from "@/components/navigation/BottomNav";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex w-full overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white print:block print:w-full">
      {/* Sidebar Lateral (Navegação Principal: desktop fixo, mobile drawer) */}
      <Sidebar />

      {/* Área Principal (Conteúdo e Topbar) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative print:block print:h-auto print:overflow-visible print:w-full print:p-0 print:m-0 min-w-0">
        <Topbar />
        <SupportModeBanner />
        <TrialBanner />
        
        {/* Container rolável do conteúdo de cada tela com proteção de plano e governança */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 md:p-8 pb-20 md:pb-8 print:block print:h-auto print:overflow-visible print:p-0 print:m-0">
          <PlanGuardWrapper>
            {children}
          </PlanGuardWrapper>
        </div>

        {/* Barra de Navegação Inferior Mobile (Estilo App) */}
        <BottomNav />
      </main>
      <FloatingSupportWidget />
      <Toaster />
    </div>
  );
}
