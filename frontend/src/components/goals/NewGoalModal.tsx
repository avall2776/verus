"use client";

import React, { useState } from "react";
import { X, Target, DollarSign, Users, Award, Calendar, Sparkles } from "lucide-react";
import { CommercialGoal, GoalCategory, GoalPeriod } from "@/types/commercial";
import toast from "react-hot-toast";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: CommercialGoal) => void;
}

export function NewGoalModal({ isOpen, onClose, onSave }: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("revenue");
  const [period, setPeriod] = useState<GoalPeriod>("monthly");
  const [targetValue, setTargetValue] = useState<number>(100000);
  const [currentValue, setCurrentValue] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o nome ou título da meta.");
      return;
    }
    if (targetValue <= 0) {
      toast.error("O valor alvo deve ser maior que zero.");
      return;
    }

    const newGoal: CommercialGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      category,
      period,
      targetValue,
      currentValue,
      unit: category === "revenue" ? "currency" : "count",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "2026-09-30",
      projectionRate: 102.5,
      status: currentValue >= targetValue ? "achieved" : "on_track"
    };

    onSave(newGoal);
    toast.success("Nova meta cadastrada com sucesso!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurar Nova Meta</h3>
              <p className="text-xs text-slate-400">Defina objetivos comerciais e acompanhe o ritmo da equipe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título da Meta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Faturamento Recorde Q3 ou Novos Clientes PME"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="revenue">Faturamento (R$)</option>
                <option value="new_clients">Novos Clientes</option>
                <option value="qualified_leads">Leads Qualificados</option>
                <option value="deals_closed">Contratos Fechados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral (Q3)</option>
                <option value="yearly">Anual (2026)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Alvo ({category === "revenue" ? "R$" : "Qtd"})
              </label>
              <input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Inicial / Atual
              </label>
              <input
                type="number"
                min={0}
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Criar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
