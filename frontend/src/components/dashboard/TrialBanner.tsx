"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Clock, AlertCircle, ArrowRight, X } from "lucide-react";
import api from "@/lib/api";

export default function TrialBanner() {
  const [data, setData] = useState<{
    daysLeft: number | null;
    isPlatformAllowed: boolean;
    hasCustomKey: boolean;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const cached = sessionStorage.getItem("versus_ai_status");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
              if (isMounted) setData(parsed.data);
              return;
            }
          } catch {}
        }

        const res = await api.get("/tenants/ai-status");
        if (isMounted && res.data) {
          const payload = {
            daysLeft: res.data.daysLeft,
            isPlatformAllowed: Boolean(res.data.isPlatformAllowed),
            hasCustomKey: Boolean(res.data.hasCustomKey),
          };
          setData(payload);
          sessionStorage.setItem("versus_ai_status", JSON.stringify({ data: payload, timestamp: Date.now() }));
        }
      } catch (err) {
        // Silencioso em caso de erro no background
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  if (dismissed || !data) return null;

  // Se o Super Admin liberou o uso da chave master ou se o tenant já tem chave própria, não exibe banner
  if (data.isPlatformAllowed || data.hasCustomKey) {
    return null;
  }

  const days = data.daysLeft ?? 0;

  // Só exibe se faltar 2 dias ou menos, ou se já tiver expirado (0 dias)
  if (days > 2) {
    return null;
  }

  const isExpired = days === 0;

  return (
    <div
      className={`w-full px-4 py-2.5 border-b text-xs flex items-center justify-between gap-4 transition-all ${
        isExpired
          ? "bg-rose-950/80 border-rose-800/80 text-rose-200"
          : "bg-amber-950/80 border-amber-800/80 text-amber-200"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isExpired ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        )}
        <p className="truncate">
          {isExpired ? (
            <span>
              <strong>Período de degustação da IA encerrado.</strong> O robô foi pausado amigavelmente e o atendimento segue com a equipe humana.
            </span>
          ) : (
            <span>
              <strong>Atenção:</strong> Seu período de degustação da IA expira em{" "}
              <strong>{days} {days === 1 ? "dia" : "dias"}</strong>. Conecte sua chave própria da OpenAI para evitar pausas.
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/settings?tab=ai"
          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            isExpired
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              : "bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
          }`}
        >
          <span>Conectar Chave</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
