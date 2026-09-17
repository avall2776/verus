import { Menu } from "lucide-react";
import NotificationsPopover from "@/components/notifications/NotificationsPopover";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";

export default function Topbar() {
  return (
    <header className="h-16 border-b border-gray-800 bg-panel/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 w-full">
      {/* Mobile Menu Button & Busca Global Reativa */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button className="md:hidden text-text-secondary hover:text-white transition-colors">
          <Menu size={24} />
        </button>
        
        {/* Barra de Busca Global Interativa (Leads, Conversas, Equipe e Módulos) */}
        <div className="hidden md:block">
          <GlobalSearchBar />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Status Bot */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background border border-gray-800 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          <span className="text-xs font-semibold text-text-secondary">IA Vitor Online</span>
        </div>

        {/* Central de Notificações Global (Popover Interativo em Tempo Real) */}
        <NotificationsPopover />
      </div>
    </header>
  );
}
