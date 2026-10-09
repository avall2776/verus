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
  X
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import UserProfileModal from "@/components/modals/UserProfileModal";
import SuperAdminSupportNotifier from "@/components/support/SuperAdminSupportNotifier";

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
    localStorage.removeItem("versus_user");
    router.push("/login");
  };

  return (
    <div className="h-screen flex w-full overflow-hidden bg-[#070D1B] text-slate-100 font-sans">
      {/* Sidebar do Super Admin Monocromática (Desktop) */}
      <aside className="hidden md:flex md:w-64 bg-[#0B1224] border-r border-slate-800 flex-col justify-between h-full transition-all duration-300 relative z-20 shrink-0">
        
        {/* Header da Sidebar */}
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-slate-800 bg-[#070D1B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Layers size={18} />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-black text-white text-sm tracking-wider uppercase">VALLOR MASTER</span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Super Admin Console</span>
              </div>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="p-3 flex flex-col gap-1.5 mt-2">
            <p className="hidden md:block text-[10px] text-slate-400 uppercase font-bold tracking-widest px-2 mb-1">
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
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                    }`}
                >
                  <item.icon size={18} className={isActive ? 'text-blue-400' : 'group-hover:text-slate-200 transition-colors'} />
                  <span className={`hidden md:block text-xs ${isActive ? 'text-white' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé do Super Admin */}
        <div className="p-3 border-t border-slate-800 flex flex-col gap-2 bg-[#070D1B]">
          <Link
            href="/dashboard"
            className="hidden md:flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs font-medium"
          >
            <span>Acessar CRM Operacional</span>
            <ArrowUpRight size={14} className="text-slate-400" />
          </Link>

          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-between p-2 rounded-lg bg-[#0B1224] border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all group"
            title="Editar Perfil (Nome, Foto e Dados)"
          >
            <div className="flex items-center gap-2 overflow-hidden" suppressHydrationWarning>
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm" suppressHydrationWarning>
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0)?.toUpperCase() || "SA"
                )}
              </div>
              <div className="hidden md:flex flex-col overflow-hidden" suppressHydrationWarning>
                <div className="flex items-center gap-1" suppressHydrationWarning>
                  <span className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors" suppressHydrationWarning>
                    {currentUser?.name || "Super Admin"}
                  </span>
                  <Edit2 size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <span className="text-[10px] text-slate-400 truncate" suppressHydrationWarning>{currentUser?.email || "admin@vallor.com"}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Sair da Conta"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar Corporativa */}
        <header className="h-14 border-b border-slate-800 bg-[#0B1224]/80 backdrop-blur-md flex items-center justify-between px-3 md:px-8 sticky top-0 z-10 w-full shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Abrir Menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Ambiente:</span>
            <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              SaaS Multi-Tenant Cloud
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#070D1B] border border-slate-800 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300">Infraestrutura Ativa</span>
            </div>
          </div>
        </header>
        
        {/* Container do Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#070D1B]">
          {children}
        </div>
      </main>

      {/* Mobile Drawer para Super Admin */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0B1224] border-r border-slate-800 flex flex-col justify-between h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-[#070D1B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                    <Layers size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-white text-sm tracking-wider uppercase">VALLOR MASTER</span>
                    <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Super Admin</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="p-3 flex flex-col gap-1.5 mt-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest px-2 mb-1">
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
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold' 
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                        }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-blue-400' : 'group-hover:text-slate-200 transition-colors'} />
                      <span className={`text-xs ${isActive ? 'text-white' : ''}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 border-t border-slate-800 flex flex-col gap-2 bg-[#070D1B]">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs font-medium"
              >
                <span>Acessar CRM Operacional</span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>

              <div 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0B1224] border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                    {currentUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      currentUser?.name?.charAt(0)?.toUpperCase() || "SA"
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-white truncate">
                      {currentUser?.name || "Super Admin"}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">{currentUser?.email || "admin@vallor.com"}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  title="Sair da Conta"
                  className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors shrink-0"
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
    </div>
  );
}
