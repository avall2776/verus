"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Video,
  Layers,
  Image as ImageIcon,
  Flame,
  Sparkles,
  User,
  Plus,
} from "lucide-react";
import { MarketingCardItem, MarketingClientItem, TeamMember } from "./types";

interface Props {
  cards: MarketingCardItem[];
  clients: MarketingClientItem[];
  teamMembers: TeamMember[];
  onOpenCardModal: (card?: MarketingCardItem) => void;
}

export default function MarketingScheduleTab({
  cards,
  clients,
  teamMembers,
  onOpenCardModal,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState("ALL");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Cálculo da grade do mês
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Ajuste para Segunda-feira ser o primeiro dia (0 = Domingo -> 6)
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filtro de cards
  const filteredCards = cards.filter((c) => {
    if (selectedClient !== "ALL" && c.marketingClientId !== selectedClient) return false;
    if (selectedUser !== "ALL" && c.assignedUserId !== selectedUser) return false;
    return true;
  });

  // Mapeia cards por dia do mês corrente
  const cardsByDay: Record<number, MarketingCardItem[]> = {};
  filteredCards.forEach((c) => {
    const refDateStr = c.publishDate || c.dueDate;
    if (!refDateStr) return;
    const d = new Date(refDateStr);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!cardsByDay[day]) cardsByDay[day] = [];
      cardsByDay[day].push(c);
    }
  });

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "REELS":
        return <Video className="w-2.5 h-2.5 text-cyan-400" />;
      case "CARROSSEL":
        return <Layers className="w-2.5 h-2.5 text-blue-400" />;
      case "POST":
        return <ImageIcon className="w-2.5 h-2.5 text-emerald-400" />;
      case "CAMPANHA":
        return <Flame className="w-2.5 h-2.5 text-rose-400" />;
      default:
        return <Sparkles className="w-2.5 h-2.5 text-amber-400" />;
    }
  };

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-4">
      {/* Barra Superior do Calendário */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1224]/80 backdrop-blur-md border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white capitalize leading-tight">
              {monthName}
            </h3>
            <p className="text-xs text-slate-400">
              Cronograma de publicações e entregas da agência
            </p>
          </div>
        </div>

        {/* Controles de Navegação e Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navegador de Mês */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#070D1B] p-1 rounded-xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro por Cliente */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filtro por Responsável */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">Toda a Equipe</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Botão Nova Demanda */}
          <button
            onClick={() => onOpenCardModal()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Peça</span>
          </button>
        </div>
      </div>

      {/* Grade do Calendário Mensal */}
      <div className="rounded-2xl bg-white dark:bg-[#0B1224]/90 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2.5">
          {weekDays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 bg-slate-50 dark:bg-[#070D1B]/50">
          {/* Células Vazias antes do primeiro dia */}
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] p-2 bg-white dark:bg-[#0B1224]/30 opacity-40" />
          ))}

          {/* Dias do Mês */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = isCurrentMonthToday && today.getDate() === dayNum;
            const dayCards = cardsByDay[dayNum] || [];

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  isToday
                    ? "bg-cyan-950/20 border-cyan-500/30"
                    : "hover:bg-slate-800/30"
                }`}
              >
                {/* Número do Dia */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? "bg-cyan-500 text-[#050814] shadow-md shadow-cyan-500/40"
                        : "text-slate-300"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayCards.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dayCards.length} {dayCards.length === 1 ? "peça" : "peças"}
                    </span>
                  )}
                </div>

                {/* Lista de Peças Programadas */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar flex-1">
                  {dayCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => onOpenCardModal(card)}
                      className="p-1 px-1.5 rounded-lg bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-[10px] text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 truncate group"
                      title={`${card.marketingClient?.name || "Cliente"} - ${card.title}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: card.marketingClient?.brandColor || "#00D2FF" }}
                      />
                      <span className="shrink-0">{getFormatIcon(card.format)}</span>
                      <span className="truncate group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
