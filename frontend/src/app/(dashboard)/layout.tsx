import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TrialBanner from "@/components/dashboard/TrialBanner";
import FloatingSupportWidget from "@/components/support/FloatingSupportWidget";
import PlanGuardWrapper from "@/components/guards/PlanGuardWrapper";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex w-full overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white print:block print:w-full">
      {/* Sidebar Lateral (Navegação Principal) */}
      <Sidebar />

      {/* Área Principal (Conteúdo e Topbar) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative print:block print:h-auto print:overflow-visible print:w-full print:p-0 print:m-0">
        <Topbar />
        <TrialBanner />
        
        {/* Container rolável do conteúdo de cada tela com proteção de plano e governança */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:block print:h-auto print:overflow-visible print:p-0 print:m-0">
          <PlanGuardWrapper>
            {children}
          </PlanGuardWrapper>
        </div>
      </main>
      <FloatingSupportWidget />
      <Toaster />
    </div>
  );
}
