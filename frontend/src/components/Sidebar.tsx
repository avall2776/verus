"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Menu,
  Edit2,
  Check,
  X,
  User,
  FileText,
  ScrollText,
  TrendingUp,
  Target,
  Mail,
  Sparkles,
  LifeBuoy,
  Volume2,
  Keyboard,
  ShieldCheck
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import api from "@/lib/api";
import toast from "react-hot-toast";
import SoundAlertsModal from "@/components/modals/SoundAlertsModal";
import KeyboardShortcutsModal from "@/components/modals/KeyboardShortcutsModal";
import UserProfileModal from "@/components/modals/UserProfileModal";

function WhatsAppIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  );
}

const NAV_GROUPS = [
  {
    title: "OPERAÇÃO / ATENDIMENTO",
    items: [
      { name: "Monitor em Tempo Real", icon: Activity, href: "/monitor" },
      { name: "WhatsApp", icon: WhatsAppIcon, href: "/inbox" },
      { name: "Métricas de Atendimento", icon: BarChart, href: "/dashboard/atendimento" },
    ]
  },
  {
    title: "CHAT DA EQUIPE",
    items: [
      { name: "Chat Interno", icon: MessagesSquare, href: "/chat-interno" },
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
    title: "MAIS RECURSOS / EXPANSÃO",
    items: [
      { name: "Propostas Comerciais", icon: FileText, href: "/proposals" },
      { name: "Contratos", icon: ScrollText, href: "/contracts" },
      { name: "Automações de Vendas", icon: Zap, href: "/settings?tab=automations" },
      { name: "Analytics Avançado", icon: TrendingUp, href: "/dashboard/analytics" },
      { name: "Metas Comerciais", icon: Target, href: "/dashboard/goals" },
      { name: "Inbox de E-mail", icon: Mail, href: "/email-inbox" },
      { name: "Central de Suporte", icon: LifeBuoy, href: "/support" },
    ]
  },
  {
    title: "SISTEMA / ADMINISTRAÇÃO",
    items: [
      { name: "Visão Geral", icon: LayoutDashboard, href: "/dashboard" },
      { name: "Base de Contatos", icon: Users, href: "/contacts" },
      { name: "Agentes de IA", icon: Bot, href: "/agent" },
      { name: "Automações & Regras", icon: Zap, href: "/settings?tab=automations" },
      { name: "Usuários & Acessos", icon: Users, href: "/settings?tab=users" },
      { name: "Conexões WhatsApp", icon: Smartphone, href: "/settings/whatsapp" },
      { name: "Configurações Gerais", icon: Settings, href: "/settings" },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasGlobalUnread } = useSocket();
  const { status: waStatus } = useWhatsApp();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Usuário e Modais Estilo Lero
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);

  const loadUser = async () => {
    try {
      const stored = localStorage.getItem('versus_user');
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
      }
      const res = await api.get('/users/me');
      if (res.data) {
        setCurrentUser(res.data);
        localStorage.setItem('versus_user', JSON.stringify(res.data));
      }
    } catch (e) {
      // Ignora erro se sessão ainda não carregada
    }
  };

  useEffect(() => {
    loadUser();
    const handleUserUpdated = () => loadUser();
    window.addEventListener('user_updated', handleUserUpdated);
    return () => window.removeEventListener('user_updated', handleUserUpdated);
  }, []);

  const handleMouseEnterUser = () => {
    if (menuTimeout) clearTimeout(menuTimeout);
    setIsUserMenuOpen(true);
  };

  const handleMouseLeaveUser = () => {
    const t = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 260);
    setMenuTimeout(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('versus_token');
    localStorage.removeItem('versus_user');
    router.push('/login');
  };

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_expanded');
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
    
    // Todas as categorias iniciam totalmente recolhidas/minimizadas por padrão
    const initialGroups: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => {
      initialGroups[g.title] = false;
    });
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

  const checkItemPermission = (href: string, user: any): boolean => {
    if (!user) return true;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isSuperAdmin) {
      return true;
    }

    const perms = user.permissions || {
      inbox: true,
      crm: true,
      chat: true,
      automations: false,
      settings: false,
      support: true,
    };

    const base = href.split('?')[0];

    // Visão Geral sempre liberada
    if (base === '/dashboard') return true;

    // Atendimento & WhatsApp
    if (base === '/inbox' || base === '/monitor' || base === '/dashboard/atendimento' || base === '/email-inbox') {
      return perms.inbox !== false;
    }

    // CRM / Comercial
    if (
      base === '/crm' ||
      base === '/contacts' ||
      base === '/dashboard/crm' ||
      base === '/proposals' ||
      base === '/contracts' ||
      base === '/dashboard/goals' ||
      base === '/dashboard/analytics'
    ) {
      return perms.crm !== false;
    }

    // Chat da Equipe
    if (base === '/chat-interno') {
      return perms.chat !== false;
    }

    // Automações & Agentes IA
    if (href.includes('tab=automations') || base === '/agent') {
      return perms.automations === true;
    }

    // Central de Suporte
    if (base === '/support') {
      return perms.support !== false;
    }

    // Configurações Gerais
    if (base === '/settings' || href.includes('tab=users') || base === '/settings/whatsapp') {
      return perms.settings === true;
    }

    return true;
  };

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => checkItemPermission(item.href, currentUser)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside 
      className={`bg-[#0B1224] border-r border-gray-800 flex flex-col justify-between h-full transition-[width] duration-200 ease-in-out relative z-20 shrink-0 ${isExpanded ? 'w-[260px]' : 'w-[64px]'}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Header / Tenant Selector */}
        <div className="h-16 flex items-center justify-between border-b border-gray-800 px-4 shrink-0">
          {isExpanded ? (
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-1.5 rounded-lg transition-colors w-full">
              <div className="w-8 h-8 rounded-xl bg-blue-600 border border-blue-500/30 flex items-center justify-center font-black text-white shrink-0 shadow-sm">
                V
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate leading-tight">VERSUS INC.</span>
                <span className="text-[10px] text-gray-400 truncate">Plano Enterprise</span>
              </div>
              <ChevronDown size={14} className="text-gray-500 ml-auto" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-600 border border-blue-500/30 flex items-center justify-center font-black text-white shrink-0 mx-auto shadow-sm">
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

          {visibleGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {/* Group Header */}
              <div 
                className={`flex items-center justify-between px-2 py-1 mb-1 cursor-pointer group ${!isExpanded && 'hidden'}`}
                onClick={() => toggleGroup(group.title)}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase group-hover:text-gray-300 transition-colors truncate">
                    {group.title}
                  </span>
                </div>
                {expandedGroups[group.title] ? (
                  <ChevronDown size={12} className="text-gray-600 group-hover:text-gray-400 shrink-0 ml-1" />
                ) : (
                  <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-400 shrink-0 ml-1" />
                )}
              </div>

              {/* Group Items */}
              <div className={`flex flex-col gap-1 ${!isExpanded ? 'items-center' : ''} ${(!expandedGroups[group.title] && isExpanded) ? 'hidden' : ''}`}>
                {group.items.map((item) => {
                  const itemBase = item.href.split('?')[0];
                  const isActive = item.href.includes('?')
                    ? pathname === itemBase
                    : pathname === item.href || (item.href !== '/dashboard' && item.href !== '/settings' && pathname.startsWith(item.href));
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
                          ? 'text-blue-400 bg-blue-600/15 border-l-2 border-blue-500 font-medium' 
                          : 'text-gray-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }
                        ${shouldBlink ? 'bg-primary/20 shadow-[0_0_15px_rgba(0,210,255,0.2)] animate-pulse text-white' : ''}
                      `}
                    >
                      <item.icon size={isExpanded ? 18 : 20} className={isActive ? 'text-blue-400' : 'text-gray-400'} />
                      
                      {isExpanded && (
                        <span className="text-sm truncate flex-1">{item.name}</span>
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
              {waStatus.status === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              )}
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-white truncate">
                  {waStatus.status === 'connected' ? 'WhatsApp Conectado' : 'Desconectado'}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {waStatus.metaPhoneNumberId ? `ID: ${waStatus.metaPhoneNumberId}` : 'Sem Instância'}
                </span>
              </div>
            )}
          </div>

          {/* User Profile Container com Hover Popover Estilo Lero */}
          <div 
            onMouseEnter={handleMouseEnterUser}
            onMouseLeave={handleMouseLeaveUser}
            className="relative"
          >
            {/* Popover Flyout Menu (Abre no Hover) */}
            {isUserMenuOpen && (
              <div 
                onMouseEnter={handleMouseEnterUser}
                onMouseLeave={handleMouseLeaveUser}
                className={`absolute bottom-full mb-2.5 rounded-2xl bg-[#0B1224] border border-slate-800 shadow-2xl p-2 z-[90] flex flex-col gap-1 text-white animate-in fade-in-50 slide-in-from-bottom-2 ${
                  isExpanded ? "left-0 w-64" : "left-full ml-2 w-64"
                }`}
              >
                {/* Header do Usuário no Popover */}
                <div className="p-2.5 border-b border-slate-800/80 mb-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                    {currentUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-white truncate">{currentUser?.name || "Operador"}</span>
                    <span className="text-[10px] text-slate-400 truncate">{currentUser?.email || "operador@versus.com.br"}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-blue-600/15 text-blue-400 border border-blue-500/30 shrink-0">
                    {currentUser?.role === 'ADMIN' ? 'Admin' : 'Operador'}
                  </span>
                </div>

                {/* Opção 1: Meu Perfil & Foto */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                >
                  <User size={15} className="text-blue-400" />
                  <span>Meu Perfil & Foto</span>
                </button>

                {/* Opção 2: Alertas Sonoros */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsSoundModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                >
                  <Volume2 size={15} className="text-blue-400" />
                  <span>Alertas Sonoros</span>
                </button>

                {/* Opção 3: Atalhos de Teclado */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsKeyboardModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                >
                  <Keyboard size={15} className="text-blue-400" />
                  <span>Atalhos de Teclado</span>
                </button>

                {/* Opção 4: Central de Suporte */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/support");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                >
                  <LifeBuoy size={15} className="text-blue-400" />
                  <span>Central de Suporte</span>
                </button>

                {/* Opção Super Admin (se aplicável) */}
                {(currentUser?.isSuperAdmin || currentUser?.role === 'SUPER_ADMIN') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/super-admin/companies");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors text-left font-semibold"
                  >
                    <ShieldCheck size={15} />
                    <span>Console Super Admin</span>
                  </button>
                )}

                <div className="h-px bg-slate-800/80 my-1" />

                {/* Opção 5: Sair */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut size={15} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}

            {/* Barra de Perfil no Rodapé (Gatilho) */}
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              title="Passe o mouse para abrir o menu do operador"
              className={`flex items-center gap-2.5 px-2 py-2 mt-1 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors group relative ${!isExpanded && 'justify-center'}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden">
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {currentUser?.name || "Usuário Atual"}
                    </span>
                    <Edit2 size={11} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">
                    {currentUser?.role === 'ADMIN' ? 'Administrador' : 'Operador'} • <span className="text-blue-400 font-medium">Menu</span>
                  </span>
                </div>
              )}
              {isExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors shrink-0"
                  title="Sair da conta"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        
      </div>

      {/* Modais Estilo Lero */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      <SoundAlertsModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
      />
    </aside>
  );
}
