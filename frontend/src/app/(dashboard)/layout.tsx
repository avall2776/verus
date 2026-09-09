import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { SocketProvider } from "@/components/ui/SocketProvider";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SocketProvider>
      <div className="h-screen flex w-full overflow-hidden bg-background">
        {/* Sidebar Lateral (Navegação Principal) */}
        <Sidebar />

        {/* Área Principal (Conteúdo e Topbar) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <Topbar />
          
          {/* Container rolável do conteúdo de cada tela */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </SocketProvider>
  );
}
