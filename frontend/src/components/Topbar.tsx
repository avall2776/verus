import { Menu } from "lucide-react";
import NotificationsPopover from "@/components/notifications/NotificationsPopover";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";

export default function Topbar() {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0B1224]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 w-full shrink-0 print:hidden">
      {/* Mobile Menu Button & Busca Global Reativa */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button 
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          title="Menu de navegação"
        >
          <Menu size={22} />
        </button>
        
        {/* Barra de Busca Global Interativa (Leads, Conversas, Equipe e Módulos) */}
        <div className="w-full">
          <GlobalSearchBar />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Central de Notificações Global (Popover Interativo em Tempo Real) */}
        <NotificationsPopover />
      </div>
    </header>
  );
}
