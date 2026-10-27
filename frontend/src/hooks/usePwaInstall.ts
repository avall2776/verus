"use client";

import { useState, useEffect, useCallback } from "react";

// Singleton global para não perder o evento beforeinstallprompt se disparado antes do hook montar
let globalDeferredPrompt: any = null;
let promptListenersInitialized = false;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detecção estrita de Mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || (window as any).opera || "";
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };

    // 2. Detecção de modo Standalone (App já instalado e aberto)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(Boolean(isStandaloneMode));
    };

    // 3. Detecção de iOS / Safari
    const checkIOS = () => {
      const userAgent = navigator.userAgent || "";
      const isApple = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(isApple);
    };

    checkMobile();
    checkStandalone();
    checkIOS();

    window.addEventListener("resize", checkMobile);

    // 4. Captura do evento nativo beforeinstallprompt do Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowGuideModal(false);
    };

    if (!promptListenersInitialized) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
      promptListenersInitialized = true;
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    // Se temos o prompt nativo do navegador (Chromium/Android)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
        }
        return;
      } catch (err) {
        console.error("Erro ao invocar prompt nativo:", err);
      }
    }

    // Se é iOS ou se o navegador não ofereceu o prompt nativo automaticamente,
    // exibimos o modal com instruções passo a passo interativas
    setShowGuideModal(true);
  }, [deferredPrompt]);

  // Exibição permitida: apenas em navegadores mobile e quando ainda NÃO está instalado
  const isEligible = isMobile && !isStandalone && !isInstalled;

  return {
    isEligible,
    isMobile,
    isStandalone,
    isIOS,
    isInstalled,
    showGuideModal,
    setShowGuideModal,
    triggerInstall,
    hasNativePrompt: Boolean(deferredPrompt),
  };
}
