"use client";

import React from "react";
import { Download, Smartphone } from "lucide-react";
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
      <div className="md:hidden w-full mt-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
        <div
          className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden shadow-md ${
            isWhatsApp
              ? "bg-[#111b21]/95 border-emerald-500/25 shadow-emerald-950/20"
              : "bg-gradient-to-r from-slate-900/95 via-blue-950/30 to-slate-900/95 border-blue-500/25 shadow-blue-950/20"
          }`}
        >
          <div className="flex items-center gap-3 relative z-10">
            {/* Ícone oficial do App */}
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-700/60 bg-white p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vallor/icon-192x192.png"
                alt="Vallor App"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Textos explicativos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  Instalar App Vallor
                </h4>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    isWhatsApp
                      ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300"
                      : "bg-blue-500/15 border-blue-500/25 text-blue-300"
                  }`}
                >
                  Mobile
                </span>
              </div>
              <p className="text-[11px] text-slate-300 dark:text-slate-400 leading-snug line-clamp-1">
                Acesse direto da tela inicial com máxima velocidade
              </p>
            </div>

            {/* Botão de Ação Imediata Compacto */}
            <button
              type="button"
              onClick={triggerInstall}
              className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.97] flex items-center gap-1.5 cursor-pointer ${
                isWhatsApp
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
              }`}
            >
              <Download size={13} />
              <span>Instalar</span>
            </button>
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


