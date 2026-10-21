"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getCachedUser } from "@/lib/userCache";

export function useMarketingAuth() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const user = await getCachedUser();
        setCurrentUser(user);

        if (!user) {
          router.replace("/login");
          return;
        }

        const isSuperAdmin = Boolean(
          user.isSuperAdmin === true ||
          user.role === "SUPER_ADMIN" ||
          user.role === "SUPERADMIN"
        );

        const isAdmin = user.role === "ADMIN";
        const hasMarketingPerm = Boolean(
          user.canAccessMarketing === true ||
          (user.permissions as any)?.marketing === true
        );

        if (isSuperAdmin || isAdmin || hasMarketingPerm) {
          setIsAuthorized(true);
          setAuthChecked(true);
        } else {
          toast.error("Acesso restrito: Você não possui permissão para acessar o módulo de Marketing e Agência.");
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("[AUTH_VERIFY_ERROR]", err);
        router.replace("/dashboard");
      }
    };

    verifyAccess();
  }, [router]);

  return { currentUser, authChecked, isAuthorized };
}
