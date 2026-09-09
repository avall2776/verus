"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart4, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  TerminalSquare 
} from "lucide-react";

const ADMIN_MENU = [
  { name: "Métricas Globais", icon: BarChart4, href: "/super-admin" },
  { name: "Gestão de Clientes", icon: Building2, href: "/super-admin/clientes" },
  { name: "Planos e Permissões", icon: ShieldCheck, href: "/super-admin/planos" },
];

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="h-screen flex w-full overflow-hidden bg-[#02040a]">
      {/* Sidebar do Super Admin */}
      <aside className="w-16 md:w-64 bg-[#0a0f1c] border-r border-indigo-900/50 flex flex-col justify-between h-full transition-all duration-300 relative z-20">
        
        {/* Logo Area */}
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-indigo-900/50 bg-[#060913]">
            <div className="flex items-center gap-2">
              <TerminalSquare size={24} className="text-indigo-400 hidden md:block" />
              <span className="font-black text-white hidden md:block text-xl tracking-wider">SUPER ADMIN</span>
              <span className="font-black text-indigo-400 md:hidden text-2xl">SA</span>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="p-4 flex flex-col gap-2 mt-2">
            <p className="hidden md:block text-[0.65rem] text-indigo-500/70 uppercase font-bold tracking-widest px-2 mb-2">Painel Mestre SaaS</p>
            
            {ADMIN_MENU.map((item) => {
              // Ajuste simples para active state
              const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname.startsWith(item.href));
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-indigo-600/10 text-indigo-400 shadow-[inset_4px_0_0_0_rgba(99,102,241,1)]' 
                      : 'text-gray-400 hover:bg-[#111827]/50 hover:text-white'
                    }`}
                >
                  <item.icon size={20} className={isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'group-hover:text-indigo-300 transition-colors'} />
                  <span className={`hidden md:block font-semibold text-[0.9rem] ${isActive ? 'text-white' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé - Dono */}
        <div className="p-4 border-t border-indigo-900/50 flex flex-col gap-2 bg-[#060913]">
          <Link href="/login" className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/20 hover:border-red-500/40 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
              👑
            </div>
            <div className="hidden md:flex flex-col overflow-hidden w-full">
              <span className="text-sm font-bold text-white truncate">Founder VERSUS</span>
              <span className="text-xs text-red-400 truncate font-semibold">Sair do Painel</span>
            </div>
            <LogOut size={16} className="text-red-400 hidden md:block shrink-0 transition-colors" />
          </Link>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar Simplificada para Admin */}
        <header className="h-16 border-b border-indigo-900/50 bg-[#0a0f1c]/50 backdrop-blur-md flex items-center justify-end px-4 md:px-8 sticky top-0 z-10 w-full">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#02040a] border border-indigo-900/50 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.1)]">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
            <span className="text-xs font-semibold text-indigo-400">Sistemas Operacionais</span>
          </div>
        </header>
        
        {/* Container rolável do conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
