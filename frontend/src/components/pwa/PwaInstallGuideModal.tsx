"use client";

import React from "react";
import { X, Share, PlusSquare, MoreVertical, Smartphone, CheckCircle2, Download, ArrowDown } from "lucide-react";

interface PwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export default function PwaInstallGuideModal({
  isOpen,
  onClose,
  isIOS,
}: PwaInstallGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-[#0B1224] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-white relative animate-in slide-in-from-bottom duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-700/60 shadow-lg shrink-0 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vallor/icon-192x192.png" alt="Vallor" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {isIOS ? "Instalar no iPhone / iPad" : "Instalar Aplicativo Vallor"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adicione à tela inicial para abrir em 1 toque
            </p>
          </div>
        </div>

        {/* Conteúdo com Passo a Passo */}
        {isIOS ? (
          <div className="space-y-3.5 my-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Share size={16} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white block font-semibold mb-0.5">1. Toque em Compartilhar</strong>
                Na barra inferior do seu navegador Safari, toque no ícone com o quadrado e a seta para cima.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <PlusSquare size={16} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white block font-semibold mb-0.5">2. Adicionar à Tela de Início</strong>
                Role a lista de ações para baixo e selecione a opção <span className="text-cyan-400 font-semibold">&quot;Adicionar à Tela de Início&quot;</span>.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white block font-semibold mb-0.5">3. Toque em &quot;Adicionar&quot;</strong>
                No canto superior direito, confirme tocando em <span className="text-emerald-400 font-semibold">&quot;Adicionar&quot;</span>. Pronto! O app aparecerá junto com seus outros aplicativos.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 my-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <MoreVertical size={16} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white block font-semibold mb-0.5">1. Abra o Menu do Navegador</strong>
                Toque nos três pontinhos no canto superior direito do seu navegador (Chrome, Edge ou Samsung Internet).
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Download size={16} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white block font-semibold mb-0.5">2. Instalar Aplicativo</strong>
                Selecione <span className="text-cyan-400 font-semibold">&quot;Instalar aplicativo&quot;</span> ou <span className="text-cyan-400 font-semibold">&quot;Adicionar à tela inicial&quot;</span>.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white block font-semibold mb-0.5">3. Concluir Instalação</strong>
                Confirme no alerta para fixar o ícone oficial do Vallor na tela do seu smartphone.
              </div>
            </div>
          </div>
        )}

        {/* Rodapé com botão de ação */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 text-center"
          >
            Entendi, vou instalar
          </button>
        </div>
      </div>
    </div>
  );
}
