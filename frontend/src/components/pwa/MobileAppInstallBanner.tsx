"use client";

import React from "react";
import { Download, Smartphone, Sparkles } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import PwaInstallGuideModal from "./PwaInstallGuideModal";

interface MobileAppInstallBannerProps {
  isWhatsApp?: boolean;
}

export default function MobileAppInstallBanner({ isWhatsApp }: MobileAppInstallBannerProps) {
  const { isEligible, isIOS, showGuideModal, setShowGuideModal, triggerInstall } = usePwaInstall();

  // Se não estiver em dispositivo mobile no navegador ou se já estiver instalado, não renderiza nada
  if (!isEligible) return null;

  return (
    <>
      {/* Banner Card Mobile exclusivo (md:hidden garante que NUNCA apareça no Desktop) */}
      <div className="md:hidden w-full mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div
          className={`p-4 rounded-2xl border transition-all relative overflow-hidden shadow-lg ${
            isWhatsApp
              ? "bg-gradient-to-r from-[#111b21] via-[#15232c] to-[#111b21] border-emerald-500/30 shadow-emerald-950/20"
              : "bg-gradient-to-r from-slate-900/95 via-blue-950/40 to-slate-900/95 border-blue-500/30 shadow-blue-950/20"
          }`}
        >
          {/* Brilho volumétrico sutil */}
          <div
            className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
              isWhatsApp ? "bg-emerald-500/10" : "bg-blue-600/15"
            }`}
          />

          <div className="flex items-start gap-3.5 relative z-10">
            {/* Ícone estilizado do App */}
            <div
              className={`w-11 h-11 rounded-xl p-0.5 shrink-0 shadow-md ${
                isWhatsApp
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/20"
                  : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-blue-500/20"
              }`}
            >
              <div className="w-full h-full bg-[#0B1224] rounded-[10px] flex items-center justify-center">
                <Smartphone
                  className={`w-5 h-5 animate-pulse ${
                    isWhatsApp ? "text-emerald-400" : "text-blue-400"
                  }`}
                />
              </div>
            </div>

            {/* Textos explicativos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isWhatsApp
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-blue-500/15 border-blue-500/30 text-blue-300"
                  }`}
                >
                  Versão Mobile
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Sparkles size={11} className="text-amber-400" />
                  Acesso Rápido
                </span>
              </div>

              <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                Baixar Aplicativo Vallor
              </h4>
              <p className="text-[11px] text-slate-300 dark:text-slate-400 mt-1 leading-relaxed">
                Acesse direto da tela inicial do seu celular, com máxima velocidade e sem precisar abrir o navegador.
              </p>

              {/* Botão de Ação Imediata */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={triggerInstall}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                    isWhatsApp
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/30"
                  }`}
                >
                  <Download size={14} className="animate-bounce" />
                  <span>Baixar Aplicativo no Celular</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Guiado para iOS Safari ou quando o navegador exigir menu manual */}
      <PwaInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}

export function MobileInstallQuickButton({ isWhatsApp }: MobileAppInstallBannerProps) {
  const { isEligible, isIOS, showGuideModal, setShowGuideModal, triggerInstall } = usePwaInstall();

  if (!isEligible) return null;

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className={`md:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md group cursor-pointer border ${
          isWhatsApp
            ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 shadow-emerald-950/30"
            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-blue-400/30 shadow-blue-950/30"
        }`}
        title="Baixar e instalar o aplicativo Vallor no seu celular"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Baixar Aplicativo</span>
      </button>

      <PwaInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}

export function MobileDrawerInstallButton({ isWhatsApp }: MobileAppInstallBannerProps) {
  const { isEligible, isIOS, showGuideModal, setShowGuideModal, triggerInstall } = usePwaInstall();

  if (!isEligible) return null;

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer mb-2 ${
          isWhatsApp
            ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
            : "bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border-blue-500/30"
        }`}
        title="Baixar Aplicativo Vallor no celular"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone size={16} className={isWhatsApp ? "text-emerald-400" : "text-blue-400"} />
          <span className="truncate">Baixar Aplicativo no Celular</span>
        </div>
        <Download size={14} className="animate-bounce shrink-0" />
      </button>

      <PwaInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}


