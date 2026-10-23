"use client";

import { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  RefreshCw,
  ExternalLink,
  X,
  MessageSquare,
  Kanban,
  BarChart3,
  QrCode,
  Headphones,
  ShieldCheck,
  ChevronDown,
  Loader2,
  ZoomIn,
  ZoomOut,
  type LucideIcon
} from "lucide-react";
import ModalPortal from "@/components/ui/ModalPortal";

interface DeviceSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPath?: string;
}

type DeviceType = "mobile" | "tablet" | "desktop";
type OrientationType = "portrait" | "landscape";

interface QuickRoute {
  label: string;
  path: string;
  icon: LucideIcon;
}

const QUICK_ROUTES: QuickRoute[] = [
  { label: "WhatsApp Inbox", path: "/vallor/inbox", icon: MessageSquare },
  { label: "CRM Pipeline", path: "/vallor/crm", icon: Kanban },
  { label: "Analytics & SLAs", path: "/vallor/dashboard/analytics", icon: BarChart3 },
  { label: "Conexões WhatsApp", path: "/vallor/settings/whatsapp", icon: QrCode },
  { label: "Suporte & Sofia IA", path: "/vallor/support", icon: Headphones },
];

export default function DeviceSandboxModal({
  isOpen,
  onClose,
  initialPath = "/vallor/inbox"
}: DeviceSandboxModalProps) {
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [orientation, setOrientation] = useState<OrientationType>("portrait");
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [inputUrl, setInputUrl] = useState(initialPath);
  const [scale, setScale] = useState<number>(0.9);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoutesDropdown, setShowRoutesDropdown] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sincroniza caminho inicial se modal abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentPath(initialPath);
      setInputUrl(initialPath);
      setIsLoading(true);
    }
  }, [isOpen, initialPath]);

  // Fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizeUrl = (raw: string): string => {
    let p = raw.trim();
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    if (!p.startsWith("/")) p = `/${p}`;
    if (!p.startsWith("/vallor")) p = `/vallor${p}`;
    return p;
  };

  const handleNavigate = (path: string) => {
    const normalized = normalizeUrl(path);
    setCurrentPath(normalized);
    setInputUrl(normalized);
    setIsLoading(true);
    setShowRoutesDropdown(false);
  };

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.location.reload();
      } catch {
        iframeRef.current.src = currentPath;
      }
    }
  };

  const handleOpenExternal = () => {
    window.open(currentPath, "_blank");
  };

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  // Cálculo de dimensões exatas de viewport
  let viewportWidth = 390;
  let viewportHeight = 844;

  if (device === "mobile") {
    viewportWidth = orientation === "portrait" ? 390 : 844;
    viewportHeight = orientation === "portrait" ? 844 : 390;
  } else if (device === "tablet") {
    viewportWidth = orientation === "portrait" ? 768 : 1024;
    viewportHeight = orientation === "portrait" ? 1024 : 768;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] bg-slate-100/95 dark:bg-slate-100 dark:bg-[#050814]/95 backdrop-blur-xl flex flex-col select-none text-slate-200 animate-in fade-in duration-200">
      {/* Barra de Ferramentas Superior Executiva (Monocromática e Escura) */}
      <header className="h-14 border-b border-slate-800 bg-white dark:bg-[#0B1224] px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Identificação de Acesso Master */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <ShieldCheck size={18} />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-xs font-semibold text-white tracking-wide uppercase">
              Auditoria de Viewport & Dispositivos
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Super Admin Master Console
            </p>
          </div>
        </div>

        {/* Seletores de Dispositivo & Controles Centrais */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Seletor de Dispositivo */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                setDevice("mobile");
                setScale(0.9);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                device === "mobile"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="Simular Smartphone (390 x 844 px)"
            >
              <Smartphone size={14} />
              <span className="hidden md:inline">Celular</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDevice("tablet");
                setScale(0.75);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                device === "tablet"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="Simular Tablet (768 x 1024 px)"
            >
              <Tablet size={14} />
              <span className="hidden md:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDevice("desktop");
                setScale(1);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                device === "desktop"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="Visualização Completa de Desktop (Widescreen)"
            >
              <Monitor size={14} />
              <span className="hidden md:inline">Desktop</span>
            </button>
          </div>

          {/* Alternar Orientação (Retrato / Paisagem) se Mobile ou Tablet */}
          {device !== "desktop" && (
            <button
              type="button"
              onClick={toggleOrientation}
              className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${
                orientation === "landscape"
                  ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
              title={`Alternar orientação (${orientation === "portrait" ? "Ativar Paisagem" : "Ativar Retrato"})`}
            >
              <RotateCw size={14} className={orientation === "landscape" ? "rotate-90 transition-transform" : "transition-transform"} />
              <span className="hidden lg:inline text-[11px] capitalize">{orientation}</span>
            </button>
          )}

          {/* Controles de Escala / Zoom para Telas Menores */}
          {device !== "desktop" && (
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))))}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Diminuir Zoom"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[11px] px-1.5 font-mono text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.2, Number((s + 0.1).toFixed(2))))}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Aumentar Zoom"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Ações de Janela & Fechar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReload}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Recarregar tela atual do simulador"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-400" : ""} />
          </button>
          <button
            type="button"
            onClick={handleOpenExternal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Abrir rota atual em nova aba"
          >
            <ExternalLink size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-colors"
            title="Fechar simulador (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Sub-Barra de Navegação de Rota (URL Bar & Atalhos) */}
      <div className="h-11 border-b border-slate-800/80 bg-white/90 dark:bg-[#0B1224]/90 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-xl relative">
          {/* Seletor de Rotas Rápidas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoutesDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors shrink-0"
            >
              <span>Atalhos</span>
              <ChevronDown size={12} className={showRoutesDropdown ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {showRoutesDropdown && (
              <div className="absolute left-0 top-8 z-30 w-56 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-800 shadow-2xl p-1.5 animate-in fade-in zoom-in-95">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
                  Telas do Sistema
                </div>
                {QUICK_ROUTES.map((route) => {
                  const Icon = route.icon;
                  const isActive = currentPath === route.path;
                  return (
                    <button
                      key={route.path}
                      type="button"
                      onClick={() => handleNavigate(route.path)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        isActive
                          ? "bg-blue-600/20 text-blue-400 font-medium"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-blue-400" : "text-slate-400"} />
                      <span>{route.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campo de URL / Rota Ativa */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigate(inputUrl);
            }}
            className="flex-1 flex items-center"
          >
            <div className="w-full flex items-center bg-slate-900/90 border border-slate-800 rounded-md px-2.5 py-1 text-xs">
              <span className="text-slate-500 font-mono select-none mr-1.5">versus:</span>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="/vallor/inbox"
                className="w-full bg-transparent border-none text-slate-200 font-mono text-xs focus:outline-none focus:ring-0"
              />
            </div>
          </form>
        </div>

        {/* Indicador de Resolução e Breakpoint Ativo */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
          <span className="text-slate-500">Viewport:</span>
          <span className="text-blue-400 font-medium">
            {device === "desktop" ? "100% (Widescreen)" : `${viewportWidth} × ${viewportHeight} px`}
          </span>
          {device === "mobile" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Mobile Nativo
            </span>
          )}
          {device === "tablet" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Tablet / md:
            </span>
          )}
        </div>
      </div>

      {/* Área Central de Visualização & Moldura do Dispositivo */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-slate-100/70 dark:bg-slate-100 dark:bg-[#050814]/70">
        {device === "desktop" ? (
          /* MODO DESKTOP: Ocupa toda a área interna de forma limpa */
          <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800/90 bg-white dark:bg-[#0B1224] shadow-2xl relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#0B1224]/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs shadow-xl">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  <span>Carregando interface...</span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentPath}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-none"
              title="VERSUS Desktop View"
            />
          </div>
        ) : (
          /* MODO DISPOSITIVO MÓVEL / TABLET COM MOLDURA REALISTA DE ALTO PADRÃO */
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out, width 0.2s ease, height 0.2s ease"
            }}
            className="relative shrink-0"
          >
            {/* Moldura do Aparelho */}
            <div
              className={`bg-slate-100 dark:bg-slate-950 border-[6px] border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.1)] relative flex flex-col ${
                device === "mobile"
                  ? orientation === "portrait"
                    ? "rounded-[52px] p-3 pb-4"
                    : "rounded-[44px] p-3"
                  : "rounded-[34px] p-3.5"
              }`}
              style={{
                width: viewportWidth + (device === "mobile" ? 24 : 28),
                height: viewportHeight + (device === "mobile" ? 38 : 34)
              }}
            >
              {/* Notch / Dynamic Island / Câmera Superior no Mobile */}
              {device === "mobile" && orientation === "portrait" && (
                <div className="w-full flex justify-center py-1 shrink-0 z-20 pointer-events-none">
                  <div className="w-28 h-4 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                  </div>
                </div>
              )}

              {/* Indicador de Câmera Superior no Tablet */}
              {device === "tablet" && orientation === "portrait" && (
                <div className="w-full flex justify-center py-0.5 shrink-0 z-20 pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
              )}

              {/* Contêiner de Tela com Iframe */}
              <div
                className={`flex-1 overflow-hidden relative bg-black ${
                  device === "mobile"
                    ? orientation === "portrait"
                      ? "rounded-[40px]"
                      : "rounded-[32px]"
                    : "rounded-[22px]"
                }`}
                style={{
                  width: viewportWidth,
                  height: viewportHeight
                }}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-[#0B1224]/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs shadow-xl">
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                      <span>Renderizando viewport...</span>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={currentPath}
                  onLoad={() => setIsLoading(false)}
                  style={{
                    width: viewportWidth,
                    height: viewportHeight
                  }}
                  className="border-none block"
                  title="VERSUS Device Viewport"
                />
              </div>

              {/* Home Indicator Bar no rodapé do Mobile */}
              {device === "mobile" && orientation === "portrait" && (
                <div className="w-full flex justify-center pt-2 shrink-0 pointer-events-none">
                  <div className="w-32 h-1 rounded-full bg-slate-700/60" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      </div>
    </ModalPortal>
  );
}
