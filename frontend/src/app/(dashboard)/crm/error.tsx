"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CrmErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CRM Runtime Error:", error);
  }, [error]);

  const handleHardReset = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("crm_columns");
        localStorage.removeItem("crm_columns_widths");
        localStorage.removeItem("crm_funnel_name");
        sessionStorage.clear();
        window.location.reload();
      }
    } catch {
      reset();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center max-w-md mx-auto my-12 bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
        <AlertTriangle size={36} />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Não foi possível carregar o CRM
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Ocorreu uma instabilidade na renderização desta tela. Clique abaixo para restabelecer os dados e recarregar.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={() => reset()}
          className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-[#070D1B] hover:bg-slate-200 dark:hover:bg-[#161f36] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Tentar Novamente</span>
        </button>
        <button
          onClick={handleHardReset}
          className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Limpar e Recarregar</span>
        </button>
      </div>

      {process.env.NODE_ENV !== "production" && error?.message && (
        <pre className="mt-4 p-2 bg-slate-100 dark:bg-[#070D1B] rounded text-[10px] text-red-500 text-left w-full overflow-x-auto max-h-32">
          {error.message}
        </pre>
      )}
    </div>
  );
}

