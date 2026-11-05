"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api";
import { getStoredUserSync } from "@/lib/userCache";
import { clearAuthCookie, setAuthCookie, getAuthCookie } from "@/lib/authCookies";
import { ShieldCheck, Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AuthGuard({ children, requireSuperAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(() => {
    // Verificação síncrona imediata no momento da montagem (0ms de atraso)
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("versus_auth_token") ||
        localStorage.getItem("versus_token") ||
        getAuthCookie();
      if (!token) return false;
      return null; // Confirma no useEffect sem renderizar tela protegida prematuramente
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = () => {
      const token = getStoredToken();
      const user = getStoredUserSync();

      if (!token) {
        if (isMounted) setIsAuthorized(false);
        clearAuthCookie();
        window.location.replace("/vallor/login");
        return;
      }

      // Garante que o cookie de sessão esteja sincronizado com o token do cliente para o Middleware do Next.js
      setAuthCookie(token, user?.role);

      if (requireSuperAdmin) {
        const isSuper = Boolean(
          user?.isSuperAdmin ||
          user?.role === "SUPER_ADMIN" ||
          user?.role === "SUPERADMIN"
        );
        if (!isSuper) {
          if (isMounted) setIsAuthorized(false);
          router.replace("/dashboard");
          return;
        }
      }

      if (isMounted) {
        setIsAuthorized(true);
      }
    };

    checkAuthentication();

    // Sincronização em tempo real entre abas: se outra aba deslogar, desloga esta imediatamente
    const handleStorageChange = (e: StorageEvent) => {
      if (
        (e.key === "versus_auth_token" || e.key === "versus_token" || e.key === "versus_user") &&
        !e.newValue
      ) {
        if (isMounted) setIsAuthorized(false);
        clearAuthCookie();
        window.location.replace("/vallor/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [requireSuperAdmin, router]);

  // Se o usuário ainda não foi aprovado ou está deslogado, bloqueia 100% da renderização protegida
  if (isAuthorized !== true) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#050814] flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-150">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_35px_rgba(37,99,235,0.45)]">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Validando credenciais corporativas...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

