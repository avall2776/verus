"use client";

import React, { useState, useEffect } from "react";
import { X, Target, Calendar, DollarSign, Users, Sparkles, Loader2 } from "lucide-react";
import { CommercialGoal } from "@/types/commercial";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (goal: CommercialGoal) => void;
  onSuccess?: () => void;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function NewGoalModal({ isOpen, onClose, onSave, onSuccess }: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<"REVENUE" | "DEALS" | "LEADS">("REVENUE");
  const [periodPreset, setPeriodPreset] = useState<"current_month" | "next_month" | "quarter" | "custom">("current_month");
  const [targetValue, setTargetValue] = useState<number>(100000);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar datas conforme preset
  useEffect(() => {
    const now = new Date();
    if (periodPreset === "current_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setPeriodStart(start.toISOString().slice(0, 10));
      setPeriodEnd(end.toISOString().slice(0, 10));
    } else if (periodPreset === "next_month") {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      setPeriodStart(start.toISOString().slice(0, 10));
      setPeriodEnd(end.toISOString().slice(0, 10));
    } else if (periodPreset === "quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      setPeriodStart(start.toISOString().slice(0, 10));
      setPeriodEnd(end.toISOString().slice(0, 10));
    }
  }, [periodPreset]);

  // Carregar usuários
  useEffect(() => {
    if (isOpen) {
      api
        .get("/deals/users")
        .then((res) => {
          if (Array.isArray(res.data)) setUsers(res.data);
        })
        .catch(() => {
          api
            .get("/users")
            .then((res) => {
              if (Array.isArray(res.data)) setUsers(res.data);
            })
            .catch(() => {});
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o nome ou título da meta.");
      return;
    }
    if (targetValue <= 0) {
      toast.error("O valor alvo deve ser maior que zero.");
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error("Informe o período de vigência da meta.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/goals", {
        title: title.trim(),
        targetType,
        targetValue,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        userId: userId ? userId : undefined,
      });

      toast.success("Nova meta cadastrada com sucesso!");
      if (onSave) onSave(res.data);
      if (onSuccess) onSuccess();
      onClose();
      // Reset
      setTitle("");
      setTargetValue(100000);
      setUserId("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao criar meta comercial.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Título da Meta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Faturamento Mensal Q3 ou Vendas Enterprise"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Métrica
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="REVENUE">Receita (R$ Faturado)</option>
                <option value="DEALS">Contratos / Vendas Ganhas</option>
                <option value="LEADS">Leads Qualificados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Responsável
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Equipe Toda (Meta Global)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Valor Alvo {targetType === "REVENUE" ? "(R$)" : "(Quantidade)"}
            </label>
            <div className="relative">
              {targetType === "REVENUE" && (
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">
                  R$
                </span>
              )}
              <input
                type="number"
                min={1}
                step={targetType === "REVENUE" ? "100" : "1"}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className={`w-full ${
                  targetType === "REVENUE" ? "pl-10" : "pl-3.5"
                } pr-3.5 py-2.5 text-sm font-mono font-semibold rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Período de Vigência
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPeriodPreset("current_month")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    periodPreset === "current_month"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white bg-slate-800"
                  }`}
                >
                  Este Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("next_month")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    periodPreset === "next_month"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white bg-slate-800"
                  }`}
                >
                  Próximo Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("quarter")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    periodPreset === "quarter"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white bg-slate-800"
                  }`}
                >
                  Trimestre
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => {
                    setPeriodPreset("custom");
                    setPeriodStart(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodPreset("custom");
                    setPeriodEnd(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(0,85,255,0.25)] transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Criar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
