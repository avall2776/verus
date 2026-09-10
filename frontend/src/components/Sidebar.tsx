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
    <aside className="w-16 bg-[#0B1224] border-r border-gray-800 flex flex-col justify-between h-full transition-all duration-300 relative z-20 shrink-0">
      
      {/* Logo Area */}
      <div>
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <span className="font-black text-white text-2xl tracking-tighter">V<span className="text-accent">.</span></span>
        </div>

        {/* Navegação Principal */}
        <nav className="p-3 flex flex-col gap-3 mt-2 items-center">
          
          {MAIN_MENU.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const isInbox = item.href === '/inbox';
            const shouldBlink = isInbox && hasGlobalUnread && !isActive;
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                prefetch={true}
                title={item.name}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary/20 text-accent shadow-[inset_2px_0_0_0_rgba(0,210,255,1)]' 
                    : 'text-text-secondary hover:bg-gray-800/50 hover:text-white'
                  }
                  ${shouldBlink ? 'bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,210,255,0.4)] animate-pulse text-white' : ''}
                `}
              >
                <item.icon size={22} className={isActive || shouldBlink ? 'text-accent drop-shadow-[0_0_8px_rgba(0,210,255,0.6)]' : 'group-hover:text-accent transition-colors'} />
                
                {/* Tooltip on Hover */}
                <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-gray-700">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Configurações & Perfil */}
      <div className="p-3 border-t border-gray-800 flex flex-col gap-3 items-center">
        <Link 
          href="/settings" 
          prefetch={true}
          title="Configurações"
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group relative
            ${pathname.startsWith('/settings') 
              ? 'bg-primary/20 text-accent shadow-[inset_2px_0_0_0_rgba(0,210,255,1)]' 
              : 'text-text-secondary hover:bg-gray-800/50 hover:text-white'
            }`}
        >
          <Settings size={22} className={pathname.startsWith('/settings') ? 'text-accent' : 'group-hover:text-accent transition-colors'} />
          <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-gray-700">
            Configurações
          </div>
        </Link>
        
        {/* User Card Slim */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0 cursor-pointer shadow-md hover:shadow-accent/50 transition-shadow relative group">
          A
          <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-gray-700 flex flex-col">
            <span className="font-bold">Admin VERSUS</span>
            <span className="text-[10px] text-gray-400">Sair da conta</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
