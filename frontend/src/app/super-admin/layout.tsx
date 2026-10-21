"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  BarChart4, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  Headphones,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  Edit2,
  Users,
  Cpu,
  Bot,
  Menu,
  X,
  MonitorSmartphone
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import UserProfileModal from "@/components/modals/UserProfileModal";
import SuperAdminSupportNotifier from "@/components/support/SuperAdminSupportNotifier";
import DeviceSandboxModal from "@/components/super-admin/DeviceSandboxModal";
import ThemeToggle from "@/components/ui/ThemeToggle";

const ADMIN_MENU = [
  { name: "Métricas Globais", icon: BarChart4, href: "/super-admin" },
  { name: "Empresas (Tenants)", icon: Building2, href: "/super-admin/companies" },
  { name: "Agentes de IA", icon: Bot, href: "/super-admin/ai-agents" },
  { name: "Central de Atendimento", icon: Headphones, href: "/super-admin/support" },
  { name: "Equipe & Operadores", icon: Users, href: "/super-admin/operators" },
  { name: "Engenharia", icon: Cpu, href: "/super-admin/engineering" },
  { name: "Planos e Permissões", icon: ShieldCheck, href: "/super-admin/planos" },
];

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  // Listener para atalho global de teclado (Alt + S) e evento open_device_sandbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setIsSandboxOpen((prev) => !prev);
      }
    };
    const handleOpenSandbox = () => setIsSandboxOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open_device_sandbox", handleOpenSandbox);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open_device_sandbox", handleOpenSandbox);
    };
  }, []);

  // Busca contagem inicial de chamados pendentes
  const fetchPendingSupportCount = () => {
    api.get("/support/tickets")
      .then((res) => {
        const counts = res.data?.counts;
        const pending = (counts?.open || 0) + (counts?.waitingClient || 0);
        setUnreadSupportCount(pending);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPendingSupportCount();
  }, []);

  // Escuta novos chamados de suporte para atualizar badge em tempo real
  useEffect(() => {
    const handleNewTicket = () => {
      setUnreadSupportCount((prev) => prev + 1);
    };
    window.addEventListener("super_admin_new_support_ticket", handleNewTicket);
    return () => window.removeEventListener("super_admin_new_support_ticket", handleNewTicket);
  }, []);

  // Ao acessar a Central de Atendimento, zera o contador do badge
  useEffect(() => {
    if (pathname === "/super-admin/support") {
      setUnreadSupportCount(0);
    }
  }, [pathname]);

  // Isolamento estrito do Super Admin: limpa e descarta imediatamente quaisquer toasts ativos
  useEffect(() => {
    try {
      toast.dismiss();
    } catch (e) {}
  }, [pathname]);

  const loadUser = () => {
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUser();
    const handleUserUpdated = () => loadUser();
    window.addEventListener("user_updated", handleUserUpdated);
    return () => window.removeEventListener("user_updated", handleUserUpdated);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("versus_auth_token");
    localStorage.removeItem("versus_token");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("versus_user");
    localStorage.removeItem("versus_target_tenant_id");
    localStorage.removeItem("tenantId");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="h-screen flex w-full overflow-hidden bg-slate-50 dark:bg-[#070D1B] text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar do Super Admin Monocromática (Desktop) */}
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-[#0B1224] border-r border-slate-200 dark:border-slate-800 flex-col justify-between h-full transition-all duration-300 relative z-20 shrink-0">
        
        {/* Header da Sidebar */}
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                <Layers size={18} />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-black text-slate-900 dark:text-white text-sm tracking-wider uppercase">VALLOR MASTER</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase">Super Admin Console</span>
              </div>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="p-3 flex flex-col gap-1.5 mt-2">
            <p className="hidden md:block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest px-2 mb-1">
              Administração Global
            </p>
            
            {ADMIN_MENU.map((item) => {
              const isActive = 
                pathname === item.href || 
                (item.href === "/super-admin/planos" && pathname.startsWith("/super-admin/plans")) || 
                (item.href !== "/super-admin" && pathname.startsWith(item.href));
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  prefetch={true}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150 group relative
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`}
                >
                  <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors'} />
                  <span className={`hidden md:block text-xs ${isActive ? 'text-blue-950 dark:text-white font-bold' : ''}`}>
                    {item.name}
                  </span>
                  {item.href === "/super-admin/support" && unreadSupportCount > 0 && (
                    <span className="ml-auto hidden md:inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/50">
                      {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Botão de Auditoria e Simulador de Telas */}
            <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsSandboxOpen(true)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all font-semibold text-left cursor-pointer group"
                title="Auditar telas em Celular, Tablet e Desktop (Alt + S)"
              >
                <MonitorSmartphone size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="hidden md:block text-xs">Simulador de Telas</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Rodapé do Super Admin */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 bg-slate-50 dark:bg-[#070D1B]">
          <Link
            href="/dashboard"
            className="hidden md:flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs font-medium"
          >
            <span>Acessar CRM Operacional</span>
            <ArrowUpRight size={14} className="text-slate-400 dark:text-slate-500" />
          </Link>

          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all group"
            title="Editar Perfil (Nome, Foto e Dados)"
          >
            <div className="flex items-center gap-2 overflow-hidden" suppressHydrationWarning>
              <div className="w-8 h-8 rounded-full bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm" suppressHydrationWarning>
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0)?.toUpperCase() || "SA"
                )}
              </div>
              <div className="hidden md:flex flex-col overflow-hidden" suppressHydrationWarning>
                <div className="flex items-center gap-1" suppressHydrationWarning>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" suppressHydrationWarning>
                    {currentUser?.name || "Super Admin"}
                  </span>
                  <Edit2 size={10} className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate" suppressHydrationWarning>{currentUser?.email || "admin@vallor.com"}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Sair da Conta"
              className="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar Corporativa */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1224]/80 backdrop-blur-md flex items-center justify-between px-3 md:px-8 sticky top-0 z-10 w-full shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Abrir Menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Ambiente:</span>
            <span className="text-xs font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              SaaS Multi-Tenant Cloud
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Alternância de Tema no Topo do Super Admin */}
            <ThemeToggle variant="pill" className="hidden sm:flex" />
            <ThemeToggle variant="icon" className="sm:hidden" />

            {/* Botão de Simulador de Telas */}
            <button
              type="button"
              onClick={() => setIsSandboxOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Simulador de Viewports (Celular, Tablet e Desktop) - Alt + S"
            >
              <MonitorSmartphone size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Simulador de Telas</span>
            </button>

            {/* Badge de Status da Infra */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Infraestrutura Ativa</span>
            </div>
          </div>
        </header>
        
        {/* Container do Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-[#070D1B]">
          {children}
        </div>
      </main>

      {/* Mobile Drawer para Super Admin */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0B1224] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                    <Layers size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white text-sm tracking-wider uppercase">VALLOR MASTER</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase">Super Admin</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ThemeToggle variant="icon" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <nav className="p-3 flex flex-col gap-1.5 mt-2">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest px-2 mb-1">
                  Administração Global
                </p>
                {ADMIN_MENU.map((item) => {
                  const isActive = 
                    pathname === item.href || 
                    (item.href === "/super-admin/planos" && pathname.startsWith("/super-admin/plans")) || 
                    (item.href !== "/super-admin" && pathname.startsWith(item.href));
                  
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150 group relative
                        ${isActive 
                          ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-semibold' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors'} />
                      <span className={`text-xs ${isActive ? 'text-blue-950 dark:text-white font-bold' : ''}`}>
                        {item.name}
                      </span>
                      {item.href === "/super-admin/support" && unreadSupportCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/50">
                          {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Alternador de Tema no Mobile Drawer */}
                <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800/60">
                  <ThemeToggle variant="menu-item" />
                </div>

                {/* Botão de Auditoria e Simulador de Telas (Mobile Drawer) */}
                <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSandboxOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 transition-all font-semibold text-left cursor-pointer"
                  >
                    <MonitorSmartphone size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs">Simulador de Telas</span>
                  </button>
                </div>
              </nav>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 bg-slate-50 dark:bg-[#070D1B]">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs font-medium"
              >
                <span>Acessar CRM Operacional</span>
                <ArrowUpRight size={14} className="text-slate-400 dark:text-slate-500" />
              </Link>

              <div 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                    {currentUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name?.charAt(0)?.toUpperCase() || "SA"
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || "Super Admin"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || "admin@vallor.com"}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  title="Sair da Conta"
                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Modal de Edição de Perfil do Super Admin */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Notificador Flutuante em Tempo Real com Som de Suporte */}
      <SuperAdminSupportNotifier />

      {/* Modal Executiva do Simulador de Viewport (Montada sob demanda para Super Admin) */}
      <DeviceSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        initialPath="/vallor/inbox"
      />
    </div>
  );
}
