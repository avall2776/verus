"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Kanban, 
  Bot, 
  Users, 
  Settings, 
  LogOut,
  Activity,
  BarChart,
  MessagesSquare,
  PieChart,
  Smartphone,
  Zap,
  ChevronDown,
  ChevronRight,
  Menu
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";

const NAV_GROUPS = [
  {
    title: "OPERAÇÃO / ATENDIMENTO",
    items: [
      { name: "Monitor em Tempo Real", icon: Activity, href: "/monitor" },
      { name: "Caixa de Atendimento", icon: MessageSquare, href: "/inbox", showBadge: true },
      { name: "Métricas de Atendimento", icon: BarChart, href: "/dashboard/atendimento" },
      { name: "Conexões WhatsApp", icon: Smartphone, href: "/settings/whatsapp" },
    ]
  },
  {
    title: "CHAT DA EQUIPE",
    items: [
      { name: "Chat Interno", icon: MessagesSquare, href: "/team-chat" },
    ]
  },
  {
    title: "FUNIL COMERCIAL (CRM)",
    items: [
      { name: "Oportunidades", icon: Kanban, href: "/crm" },
      { name: "Métricas de Vendas", icon: PieChart, href: "/dashboard/crm" },
    ]
  },
  {
    title: "SISTEMA / ADMINISTRAÇÃO",
    items: [
      { name: "Visão Geral", icon: LayoutDashboard, href: "/dashboard" },
      { name: "Base de Contatos", icon: Users, href: "/contacts" },
      { name: "Agentes de IA", icon: Bot, href: "/agent" },
      { name: "Automações & Regras", icon: Zap, href: "/settings/automations" },
      { name: "Usuários & Acessos", icon: Users, href: "/settings/users" },
      { name: "Configurações Gerais", icon: Settings, href: "/settings" },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasGlobalUnread } = useSocket();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_expanded');
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
    
    // Auto-expand all groups by default
    const initialGroups: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => initialGroups[g.title] = true);
    setExpandedGroups(initialGroups);
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar_expanded', String(newState));
  };

  const toggleGroup = (title: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      localStorage.setItem('sidebar_expanded', 'true');
    }
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside 
      className={`bg-[#0B1224] border-r border-gray-800 flex flex-col justify-between h-full transition-[width] duration-200 ease-in-out relative z-20 shrink-0 ${isExpanded ? 'w-[260px]' : 'w-[64px]'}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Header / Tenant Selector */}
        <div className="h-16 flex items-center justify-between border-b border-gray-800 px-4 shrink-0">
          {isExpanded ? (
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-1.5 rounded-lg transition-colors w-full">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shrink-0">
                V
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate leading-tight">VERSUS INC.</span>
                <span className="text-[10px] text-gray-400 truncate">Plano Enterprise</span>
              </div>
              <ChevronDown size={14} className="text-gray-500 ml-auto" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white shrink-0 mx-auto">
              V
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
          <button 
            onClick={toggleSidebar}
            className={`flex items-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors mb-2 ${isExpanded ? 'justify-end' : 'justify-center'}`}
            title={isExpanded ? "Recolher Menu" : "Expandir Menu"}
          >
            <Menu size={18} />
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              {/* Group Header */}
              <div 
                className={`flex items-center justify-between px-2 py-1 mb-1 cursor-pointer group ${!isExpanded && 'hidden'}`}
                onClick={() => toggleGroup(group.title)}
              >
                <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase group-hover:text-gray-300 transition-colors">
                  {group.title}
                </span>
                {expandedGroups[group.title] ? (
                  <ChevronDown size={12} className="text-gray-600 group-hover:text-gray-400" />
                ) : (
                  <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-400" />
                )}
              </div>

              {/* Group Items */}
              <div className={`flex flex-col gap-1 ${!isExpanded ? 'items-center' : ''} ${(!expandedGroups[group.title] && isExpanded) ? 'hidden' : ''}`}>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const isInbox = item.href === '/inbox';
                  const shouldBlink = isInbox && hasGlobalUnread && !isActive;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!isExpanded ? item.name : undefined}
                      className={`
                        flex items-center gap-3 rounded-lg transition-all duration-200 relative
                        ${isExpanded ? 'px-3 py-2' : 'w-10 h-10 justify-center'}
                        ${isActive 
                          ? 'bg-slate-800 text-emerald-400 font-semibold border-l-2 border-emerald-500' 
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                        }
                        ${shouldBlink ? 'bg-primary/20 shadow-[0_0_15px_rgba(0,210,255,0.2)] animate-pulse text-white' : ''}
                      `}
                    >
                      <item.icon size={isExpanded ? 18 : 20} className={isActive ? 'text-emerald-400' : 'text-gray-400'} />
                      
                      {isExpanded && (
                        <span className="text-sm truncate">{item.name}</span>
                      )}

                      {!isExpanded && (
                        <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-gray-700">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-3 shrink-0 flex flex-col gap-2">
          {/* WA Status */}
          <div className={`flex items-center gap-3 px-2 py-1.5 rounded-lg bg-gray-900/50 border border-gray-800 ${!isExpanded && 'justify-center'}`}>
            <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-white truncate">WhatsApp Conectado</span>
                <span className="text-[10px] text-gray-500 truncate">+55 11 99999-9999</span>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className={`flex items-center gap-3 px-2 py-2 mt-1 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors ${!isExpanded && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              U
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-xs font-bold text-white truncate">Usuário Atual</span>
                <span className="text-[10px] text-gray-500 truncate">Sair da conta</span>
              </div>
            )}
            {isExpanded && (
              <LogOut size={14} className="text-gray-500 hover:text-red-400 shrink-0" />
            )}
          </div>
        </div>
        
      </div>
    </aside>
  );
}
