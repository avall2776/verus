"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStoredToken } from "@/lib/api";
import { setAuthCookie, clearAuthCookie, getAuthCookie } from "@/lib/authCookies";
import { getStoredUserSync } from "@/lib/userCache";

export default function SecurityShieldProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Sincronização proativa no boot: se o usuário já tem token no localStorage,
    // sincroniza instantaneamente com o Cookie para que todas as abas e requisições SSR
    // passem limpas pelo Middleware sem necessidade de novo login.
    const token = getStoredToken();
    const user = getStoredUserSync();

    if (token) {
      setAuthCookie(token, user?.role);
    } else {
      // Se não há token, limpa qualquer resquício de cookie
      clearAuthCookie();
    }

    // 2. Escuta eventos entre abas (StorageEvent)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "versus_auth_token") {
        if (!e.newValue) {
          clearAuthCookie();
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/blocked") &&
            !currentPath.includes("/c/") &&
            !currentPath.includes("/p/") &&
            !currentPath.includes("/relatorio")
          ) {
            window.location.replace("/vallor/login");
          }
        } else {
          setAuthCookie(e.newValue);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [pathname]);

  return <>{children}</>;
}
