"use client";

import { useState } from "react";
import { Menu, PhoneCall } from "lucide-react";
import NotificationsPopover from "@/components/notifications/NotificationsPopover";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import SoftphoneModal from "@/components/voip/SoftphoneModal";

export default function Topbar() {
  const [isSoftphoneOpen, setIsSoftphoneOpen] = useState(false);

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
      <div className="flex items-center gap-2.5 shrink-0 ml-4">
        {/* Botão de Acesso Rápido ao Softphone / PABX VoIP */}
        <button
          onClick={() => setIsSoftphoneOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070D1B] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer group"
          title="Abrir VERSUS Softphone / PABX"
        >
          <PhoneCall size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Softphone</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Central de Notificações Global (Popover Interativo em Tempo Real) */}
        <NotificationsPopover />

        {/* Modal do Softphone Global */}
        <SoftphoneModal
          isOpen={isSoftphoneOpen}
          onClose={() => setIsSoftphoneOpen(false)}
        />
      </div>
    </header>
  );
}
