"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ShieldAlert, Lock, EyeOff, ShieldCheck } from "lucide-react";

interface StoredUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

export default function SecurityShieldProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);

  // Carrega e sincroniza o usuário autenticado do localStorage
  const refreshUser = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    window.addEventListener("storage", refreshUser);
    window.addEventListener("focus", refreshUser);
    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("focus", refreshUser);
    };
  }, [refreshUser]);

  // Avaliação do perfil Super Admin (Privilégio de Bypass total)
  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    const roleStr = String(currentUser.role || "").toUpperCase();
    return Boolean(
      currentUser.isSuperAdmin === true ||
      roleStr === "SUPER_ADMIN" ||
      roleStr === "SUPERADMIN"
    );
  }, [currentUser]);

  // 1. Desativação de Botão Direito, Arrastar de Imagens e Atalhos de Inspeção
  useEffect(() => {
    if (isSuperAdmin) return; // Super Admin opera sem restrições

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "IMG" ||
        target?.tagName === "SVG" ||
        target?.tagName === "CANVAS" ||
        target?.tagName === "A"
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (isCtrlOrCmd && e.shiftKey) {
        const keyUpper = e.key.toUpperCase();
        if (keyUpper === "I" || keyUpper === "J" || keyUpper === "C") {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U (Ver Código-Fonte) e Ctrl+S (Salvar Página)
      if (isCtrlOrCmd) {
        const keyUpper = e.key.toUpperCase();
        if (keyUpper === "U" || keyUpper === "S") {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isSuperAdmin]);

  // 2. Proteção por Perda de Foco (Blur & Visibility Change)
  useEffect(() => {
    if (isSuperAdmin) {
      setIsWindowBlurred(false);
      return;
    }

    const handleBlur = () => {
      // Pequeno debounce para evitar falso-positivo em popups internos
      setTimeout(() => {
        if (!document.hasFocus() || document.visibilityState === "hidden") {
          setIsWindowBlurred(true);
        }
      }, 150);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSuperAdmin]);

  // 3. Detecção de DevTools Abertas (Heurística de Viewport Delta)
  useEffect(() => {
    if (isSuperAdmin) {
      setIsDevToolsDetected(false);
      return;
    }

    const checkDevTools = () => {
      if (typeof window === "undefined") return;

      const widthDelta = window.outerWidth - window.innerWidth > 160;
      const heightDelta = window.outerHeight - window.innerHeight > 160;

      if (widthDelta || heightDelta) {
        setIsDevToolsDetected(true);
      } else {
        setIsDevToolsDetected(false);
      }
    };

    const interval = setInterval(checkDevTools, 1500);
    window.addEventListener("resize", checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkDevTools);
    };
  }, [isSuperAdmin]);

  // 4. Marca d'Água Dinâmica Antivazamento (Visual Digital Fingerprint)
  const watermarkText = useMemo(() => {
    if (!currentUser) return null;
    const name = currentUser.name || "VERSUS Operador";
    const email = currentUser.email || "";
    const idShort = currentUser.id ? currentUser.id.slice(0, 8) : "CORP";
    return `${name} • ${email} • ID: ${idShort} • VERSUS SECURITY`;
  }, [currentUser]);

  // Gera a matriz de repetição da marca d'água
  const watermarkGrid = useMemo(() => {
    if (!watermarkText || isSuperAdmin) return null;
    const rows = Array.from({ length: 18 });
    return (
      <div 
        className="fixed inset-0 pointer-events-none select-none z-[9990] overflow-hidden flex flex-col justify-around opacity-[0.04] sm:opacity-[0.055] transition-opacity duration-500"
        aria-hidden="true"
      >
        {rows.map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex whitespace-nowrap text-[12px] sm:text-[13px] font-semibold tracking-widest text-slate-400 transform -rotate-12 translate-x-[-10%]"
            style={{ marginLeft: `${(rIdx % 2) * -120}px` }}
          >
            {Array.from({ length: 12 }).map((__, cIdx) => (
              <span key={cIdx} className="mx-12">
                {watermarkText}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }, [watermarkText, isSuperAdmin]);

  return (
    <>
      {/* Marca d'Água Dinâmica Antivazamento */}
      {watermarkGrid}

      {/* Escudo de Privacidade por Perda de Foco (Blur Screen) */}
      {isWindowBlurred && !isSuperAdmin && currentUser && (
        <div 
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-[99998] backdrop-blur-2xl bg-[#050814]/90 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer animate-in fade-in duration-200"
        >
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#0B1224]/90 border border-slate-800/80 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <EyeOff size={28} />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
                VERSUS Enterprise Shield
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
                Proteção de Privacidade Ativa
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              O conteúdo confidencial desta sessão foi ocultado enquanto esta janela estiver fora de foco ou em segundo plano.
            </p>

            <button
              onClick={() => setIsWindowBlurred(false)}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold uppercase tracking-wider border border-slate-700 transition-all"
            >
              Clique para Retomar a Visualização
            </button>
          </div>
        </div>
      )}

      {/* Alerta de Inspeção de Código / DevTools Ativas */}
      {isDevToolsDetected && !isSuperAdmin && (
        <div className="fixed inset-0 z-[99999] backdrop-blur-3xl bg-black/95 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-lg w-full p-8 rounded-2xl bg-[#0F172A] border border-red-500/40 shadow-2xl shadow-red-950/50 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert size={32} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Ferramenta de Inspeção Detectada
              </h2>
              <p className="text-xs text-red-400 mt-1 uppercase tracking-widest font-mono">
                Ambiente Corporativo Protegido
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              As diretrizes de conformidade do VERSUS restringem a utilização de ferramentas de desenvolvedor ou engenharia reversa nesta sessão.
            </p>

            <div className="w-full bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-400">
              Feche as ferramentas de desenvolvedor (F12) para desbloquear a interface.
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Normal da Aplicação */}
      {children}
    </>
  );
}
