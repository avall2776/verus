"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Layers, Video, Image as ImageIcon, Flame, Sparkles, Loader2 } from "lucide-react";
import api from "@/lib/api";
import ModalPortal from "@/components/ui/ModalPortal";
import { MarketingClientItem, MarketingCardItem } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: MarketingClientItem | null;
  onSelectCard?: (card: MarketingCardItem) => void;
}

export default function MarketingClientHistoryModal({
  isOpen,
  onClose,
  client,
  onSelectCard,
}: Props) {
  const [pieces, setPieces] = useState<MarketingCardItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client?.id) {
      fetchHistory();
    }
  }, [isOpen, client?.id]);

  const fetchHistory = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/agency/marketing/clients/${client.id}/pieces`);
      setPieces(res.data?.cards || []);
    } catch (err) {
      console.error("[FETCH_PIECES_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "REELS":
        return <Video className="w-3.5 h-3.5 text-cyan-400" />;
      case "CARROSSEL":
        return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      case "POST":
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case "CAMPANHA":
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0B1224] border border-slate-700 rounded-3xl shadow-2xl p-6 text-white space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
              style={{ backgroundColor: client.brandColor || "#00D2FF" }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Histórico de Peças: {client.name}</h3>
              <p className="text-xs text-slate-400">Total de {pieces.length} publicação(ões) registrada(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs">Carregando histórico...</span>
          </div>
        ) : pieces.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-2xl bg-slate-50 dark:bg-[#070D1B]/50">
            Nenhuma peça encontrada para este cliente ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl bg-slate-50 dark:bg-[#070D1B] overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar">
            {pieces.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  if (onSelectCard) {
                    onSelectCard(p);
                    onClose();
                  }
                }}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                    {getFormatIcon(p.format)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {p.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-300">{p.format}</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-mono">{p.status}</span>
                      {p.publishDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(p.publishDate).toLocaleDateString("pt-BR")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {p.assignedUser && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[120px]">
                    {p.assignedUser.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
