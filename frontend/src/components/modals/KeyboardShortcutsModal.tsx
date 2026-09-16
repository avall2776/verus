"use client";

import React, { useState, useEffect } from "react";
import { Keyboard, Laptop, Apple, X, Search, Sparkles, Navigation, MessageSquare, Zap } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [os, setOs] = useState<"win" | "mac">("win");
  const [filter, setFilter] = useState("");

  // Detectar OS do usuário automaticamente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
      setOs(isMac ? "mac" : "win");
    }
  }, [isOpen]);

  // Listener para fechar com tecla ESC
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

  const modKey = os === "mac" ? "⌘" : "Ctrl";
  const altKey = os === "mac" ? "⌥" : "Alt";
  const shiftKey = os === "mac" ? "⇧" : "Shift";

  const shortcuts = [
    {
      category: "Navegação Rápida",
      icon: Navigation,
      items: [
        { desc: "Abrir Busca Global / Spotlight", keys: [modKey, "K"] },
        { desc: "Alternar Barra Lateral (Expandir/Recolher)", keys: [modKey, "B"] },
        { desc: "Ir para Funil Comercial (CRM)", keys: [altKey, "1"] },
        { desc: "Ir para Inbox de Mensagens", keys: [altKey, "2"] },
        { desc: "Ir para Inbox de E-mail", keys: [altKey, "3"] },
        { desc: "Ir para Metas Comerciais", keys: [altKey, "4"] },
        { desc: "Acessar Central de Suporte", keys: [altKey, "5"] },
      ],
    },
    {
      category: "Atendimento & Chat",
      icon: MessageSquare,
      items: [
        { desc: "Enviar Mensagem", keys: ["Enter"] },
        { desc: "Quebra de Linha no Texto", keys: [shiftKey, "Enter"] },
        { desc: "Inserir Resposta Rápida", keys: ["/"] },
        { desc: "Gravar / Enviar Áudio", keys: [modKey, shiftKey, "A"] },
        { desc: "Encerrar / Resolver Atendimento", keys: [modKey, shiftKey, "E"] },
        { desc: "Transferir Conversa / Chamado", keys: [modKey, shiftKey, "T"] },
      ],
    },
    {
      category: "Ações Globais & Modais",
      icon: Zap,
      items: [
        { desc: "Fechar Modal / Popover Ativo", keys: ["Esc"] },
        { desc: "Salvar Alterações no Formulário", keys: [modKey, "S"] },
        { desc: "Recarregar Lista / Sincronizar", keys: [modKey, "R"] },
        { desc: "Alternar Tema / Contraste", keys: [modKey, shiftKey, "L"] },
      ],
    },
  ];

  const filteredShortcuts = shortcuts.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.desc.toLowerCase().includes(filter.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(filter.toLowerCase()))
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0B1224] border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 text-white max-h-[85vh] overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Atalhos de Teclado</h3>
              <p className="text-[11px] text-slate-400">Acelere seu atendimento e navegação diária com teclas de atalho</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Filtro e Seletor de SO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Busca */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar atalho..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Toggle de SO */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070D1B] border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setOs("win")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                os === "win"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              Windows / Linux
            </button>
            <button
              type="button"
              onClick={() => setOs("mac")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                os === "mac"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              macOS
            </button>
          </div>
        </div>

        {/* Lista de Atalhos com Scroll */}
        <div className="overflow-y-auto space-y-5 pr-1 max-h-[50vh]">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Nenhum atalho encontrado para a busca &quot;{filter}&quot;.
            </div>
          ) : (
            filteredShortcuts.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.category} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    {group.category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#070D1B] border border-slate-800 hover:border-slate-700/80 transition-colors"
                      >
                        <span className="text-xs text-slate-300 font-medium">{item.desc}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, kIdx) => (
                            <kbd 
                              key={kIdx}
                              className="px-2 py-1 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700 text-[11px] font-mono shadow-sm"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Dica */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Dica: Você pode pressionar <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Esc</kbd> a qualquer momento para fechar.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
