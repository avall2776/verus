"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Kanban, LayoutDashboard, Activity, Menu } from "lucide-react";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useSocket } from "@/components/ui/SocketProvider";
import { useTheme } from "@/contexts/ThemeContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { openMenu } = useMobileMenu();
  const { hasGlobalUnread } = useSocket();
  const { isWhatsApp } = useTheme();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Monitora se o usuário está com uma conversa aberta no mobile
  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateChatState = () => {
      setIsMobileChatOpen(document.body.classList.contains("mobile-chat-open"));
    };

    updateChatState();

    const observer = new MutationObserver(updateChatState);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Se estiver com chat aberto no mobile, tela de login, pública ou relatório compartilhado, não exibe
  if (
    isMobileChatOpen ||
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
    <nav id="bottom-nav" className="bottom-nav-mobile [body.mobile-chat-open_&]:!hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070D1B]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 md:hidden flex items-center justify-around px-2 py-1.5 safe-area-pb shadow-[0_-10px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_25px_rgba(0,0,0,0.6)] transition-colors duration-200">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 relative rounded-xl ${
              isActive 
                ? (isWhatsApp ? "text-[#00A884] font-bold" : "text-blue-600 dark:text-blue-400 font-bold")
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Icon 
                size={20} 
                className={
                  isActive 
                    ? (isWhatsApp ? "text-[#00A884] scale-110 transition-transform" : "text-blue-600 dark:text-blue-400 scale-110 transition-transform") 
                    : "transition-transform"
                } 
              />
              {item.badge && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className={`text-[10px] mt-1 tracking-tight ${
              isActive 
                ? (isWhatsApp ? "text-[#E9EDEF] font-semibold" : "text-slate-900 dark:text-white font-semibold") 
                : "text-slate-500 dark:text-slate-400"
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Botão Menu Completo (Abre Drawer Lateral com todos os módulos) */}
      <button
        type="button"
        onClick={openMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Abrir Menu Completo"
      >
        <Menu size={20} />
        <span className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 tracking-tight">Menu</span>
      </button>
    </nav>
  );
}
