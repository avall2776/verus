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
  User
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import api from "@/lib/api";
import toast from "react-hot-toast";

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
      { name: "WhatsApp", icon: WhatsAppIcon, href: "/inbox", showBadge: true },
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
    title: "SISTEMA / ADMINISTRAÇÃO",
    items: [
      { name: "Visão Geral", icon: LayoutDashboard, href: "/dashboard" },
      { name: "Base de Contatos", icon: Users, href: "/contacts" },
      { name: "Agentes de IA", icon: Bot, href: "/agent" },
      { name: "Automações & Regras", icon: Zap, href: "/settings/automations" },
      { name: "Usuários & Acessos", icon: Users, href: "/settings/users" },
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

  // Usuário e Edição de Perfil
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const loadUser = () => {
    try {
      const stored = localStorage.getItem('versus_user');
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        setEditName(u.name || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUser();
    const handleUserUpdated = () => loadUser();
    window.addEventListener('user_updated', handleUserUpdated);
    return () => window.removeEventListener('user_updated', handleUserUpdated);
  }, []);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      toast.error("O nome não pode ficar vazio");
      return;
    }

    setIsSavingName(true);
    try {
      try {
        await api.patch('/users/profile', { name: editName.trim() });
      } catch {
        if (currentUser?.id) {
          await api.patch(`/users/${currentUser.id}`, { name: editName.trim() });
        }
      }

      const updated = { ...currentUser, name: editName.trim() };
      localStorage.setItem('versus_user', JSON.stringify(updated));
      setCurrentUser(updated);
      window.dispatchEvent(new Event('user_updated'));

      toast.success("Nome de perfil atualizado!");
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar o nome");
    } finally {
      setIsSavingName(false);
    }
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
                          ? 'text-blue-400 bg-blue-600/15 border-l-2 border-blue-500 font-medium' 
                          : 'text-gray-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }
                        ${shouldBlink ? 'bg-primary/20 shadow-[0_0_15px_rgba(0,210,255,0.2)] animate-pulse text-white' : ''}
                      `}
                    >
                      <item.icon size={isExpanded ? 18 : 20} className={isActive ? 'text-blue-400' : 'text-gray-400'} />
                      
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

          {/* User Profile com Edição Interativa */}
          <div 
            onClick={() => setIsEditProfileOpen(true)}
            title="Clique para editar seu nome de perfil"
            className={`flex items-center gap-2.5 px-2 py-2 mt-1 rounded-lg hover:bg-gray-800/60 cursor-pointer transition-colors group relative ${!isExpanded && 'justify-center'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent border border-primary/30 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {currentUser?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                    {currentUser?.name || "Usuário Atual"}
                  </span>
                  <Edit2 size={11} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <span className="text-[10px] text-gray-400 truncate">
                  {currentUser?.role === 'ADMIN' ? 'Administrador' : 'Operador'} • <span className="text-primary/90 font-medium">Editar</span>
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
                className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-gray-800 transition-colors shrink-0"
                title="Sair da conta"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
        
      </div>

      {/* Modal de Edição de Perfil */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-[#161b22] border border-gray-800 w-full max-w-sm rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <User size={15} />
                </div>
                <h3 className="text-sm font-bold text-white">Editar Perfil do Usuário</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Nome do Operador / Usuário
                </label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Seu nome completo..."
                  autoFocus
                  className="w-full bg-[#0d1117] border border-gray-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="text-[11px] text-gray-500 bg-[#0d1117] p-2.5 rounded-lg border border-gray-800/60">
                <p>O nome é exibido no Chat Interno, nas conversas de atendimento e nos cards do CRM atribuídos a você.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingName ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
