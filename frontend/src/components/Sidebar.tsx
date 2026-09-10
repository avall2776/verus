"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Kanban, 
  Bot, 
  Users, 
  Plug, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";

const MAIN_MENU = [
  { name: "Visão Geral", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Caixa de Entrada", icon: MessageSquare, href: "/inbox" },
  { name: "Pipeline CRM", icon: Kanban, href: "/crm" },
  { name: "Agente IA (Vitor)", icon: Bot, href: "/agent" },
  { name: "Base de Leads", icon: Users, href: "/contacts" },
  { name: "Integrações", icon: Plug, href: "/integrations" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasGlobalUnread } = useSocket();

  return (
    <aside className="w-16 md:w-64 bg-panel border-r border-gray-800 flex flex-col justify-between h-full transition-all duration-300 relative z-20">
      
      {/* Logo Area */}
      <div>
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-800">
          <span className="font-black text-white hidden md:block text-[1.35rem] tracking-widest uppercase">Logotipo</span>
          <span className="font-black text-white md:hidden text-2xl">L</span>
        </div>

        {/* Navegação Principal */}
        <nav className="p-4 flex flex-col gap-2 mt-2">
          <p className="hidden md:block text-[0.65rem] text-gray-500 uppercase font-bold tracking-widest px-2 mb-2">Menu Principal</p>
          
          {MAIN_MENU.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const isInbox = item.href === '/inbox';
            const shouldBlink = isInbox && hasGlobalUnread && !isActive;
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                prefetch={true}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary/10 text-accent shadow-[inset_4px_0_0_0_rgba(0,210,255,1)]' 
                    : 'text-text-secondary hover:bg-gray-800/50 hover:text-white'
                  }
                  ${shouldBlink ? 'bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,210,255,0.4)] animate-pulse text-white' : ''}
                `}
              >
                <item.icon size={20} className={isActive || shouldBlink ? 'text-accent drop-shadow-[0_0_8px_rgba(0,210,255,0.6)]' : 'group-hover:text-accent transition-colors'} />
                <span className={`hidden md:block font-semibold text-[0.9rem] ${isActive || shouldBlink ? 'text-white' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Configurações & Perfil */}
      <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
        <Link 
          href="/settings" 
          prefetch={true}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
            ${pathname.startsWith('/settings') 
              ? 'bg-primary/10 text-accent shadow-[inset_4px_0_0_0_rgba(0,210,255,1)]' 
              : 'text-text-secondary hover:bg-gray-800/50 hover:text-white'
            }`}
        >
          <Settings size={20} className={pathname.startsWith('/settings') ? 'text-accent' : 'group-hover:text-accent transition-colors'} />
          <span className="hidden md:block font-semibold text-[0.9rem]">Configurações</span>
        </Link>
        
        {/* User Card */}
        <div className="mt-2 flex items-center gap-3 p-3 bg-[#0B1224] border border-gray-800/60 rounded-xl cursor-pointer hover:border-accent/40 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
            A
          </div>
          <div className="hidden md:flex flex-col overflow-hidden w-full">
            <span className="text-sm font-bold text-white truncate">Admin VERSUS</span>
            <span className="text-xs text-text-secondary truncate">Plano Enterprise</span>
          </div>
          <LogOut size={16} className="text-gray-500 group-hover:text-red-400 hidden md:block shrink-0 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
