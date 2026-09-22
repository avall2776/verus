"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SettingsAiRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=ai");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      <span className="text-xs">Redirecionando para Inteligência Artificial (BYOK)...</span>
    </div>
  );
}
