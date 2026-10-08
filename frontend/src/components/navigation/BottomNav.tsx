"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Kanban, LayoutDashboard, Activity, Menu } from "lucide-react";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useSocket } from "@/components/ui/SocketProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { openMenu } = useMobileMenu();
  const { hasGlobalUnread } = useSocket();

  // Se estiver na tela de login, pública ou relatório compartilhado, não exibe
  if (
    pathname.includes("/login") ||
    pathname.includes("/blocked") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/c/")
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Conversas",
      href: "/inbox",
      icon: MessageSquare,
      badge: hasGlobalUnread,
    },
    {
      label: "CRM",
      href: "/crm",
      icon: Kanban,
    },
    {
      label: "Início",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Monitor",
      href: "/monitor",
      icon: Activity,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070D1B]/95 backdrop-blur-xl border-t border-slate-800/80 md:hidden flex items-center justify-around px-2 py-1.5 safe-area-pb shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 relative rounded-xl ${
              isActive ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Icon size={20} className={isActive ? "text-blue-400 scale-110 transition-transform" : "transition-transform"} />
              {item.badge && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className={`text-[10px] mt-1 tracking-tight ${isActive ? "text-white" : "text-slate-400"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Botão Menu Completo (Abre Drawer Lateral com todos os módulos) */}
      <button
        type="button"
        onClick={openMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Abrir Menu Completo"
      >
        <Menu size={20} />
        <span className="text-[10px] mt-1 text-slate-400 tracking-tight">Menu</span>
      </button>
    </nav>
  );
}
