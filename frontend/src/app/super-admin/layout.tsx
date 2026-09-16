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
  Edit2
} from "lucide-react";
import UserProfileModal from "@/components/modals/UserProfileModal";

const ADMIN_MENU = [
  { name: "Métricas Globais", icon: BarChart4, href: "/super-admin" },
  { name: "Empresas (Tenants)", icon: Building2, href: "/super-admin/companies" },
  { name: "Central de Atendimento", icon: Headphones, href: "/super-admin/support" },
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
      {/* Sidebar do Super Admin Monocromática */}
      <aside className="w-16 md:w-64 bg-[#0B1224] border-r border-slate-800 flex flex-col justify-between h-full transition-all duration-300 relative z-20 shrink-0">
        
        {/* Header da Sidebar */}
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-slate-800 bg-[#070D1B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Layers size={18} />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-black text-white text-sm tracking-wider uppercase">VERSUS MASTER</span>
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
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0)?.toUpperCase() || "SA"
                )}
              </div>
              <div className="hidden md:flex flex-col overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {currentUser?.name || "Super Admin"}
                  </span>
                  <Edit2 size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <span className="text-[10px] text-slate-400 truncate">{currentUser?.email || "admin@versus.com"}</span>
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
        <header className="h-14 border-b border-slate-800 bg-[#0B1224]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 w-full shrink-0">
          <div className="flex items-center gap-2">
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
