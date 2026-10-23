"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Target, Calendar, DollarSign, Users, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { CommercialGoal } from "@/types/commercial";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";

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

function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return 0;

  if (cleaned.includes(".") && cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(",", ".")) || 0;
  }
  const parts = cleaned.split(".");
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (last.length === 3) {
      return parseFloat(parts.join("")) || 0;
    }
  }
  return parseFloat(cleaned) || 0;
}

function numberToExtensoBRL(value: number): string {
  if (value <= 0) return "zero reais";
  const num = Math.floor(value);

  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converterGrupo(n: number): string {
    if (n === 100) return "cem";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const partes: string[] = [];
    if (c > 0) partes.push(centenas[c]);
    if (d === 1) {
      partes.push(especiais[u]);
    } else {
      if (d > 1) partes.push(dezenas[d]);
      if (u > 0) partes.push(unidades[u]);
    }
    return partes.join(" e ");
  }

  const milhoes = Math.floor(num / 1_000_000);
  const milhares = Math.floor((num % 1_000_000) / 1000);
  const resto = num % 1000;

  const blocos: string[] = [];

  if (milhoes > 0) {
    if (milhoes === 1) blocos.push("um milhão");
    else blocos.push(`${converterGrupo(milhoes)} milhões`);
  }

  if (milhares > 0) {
    if (milhares === 1) blocos.push("mil");
    else blocos.push(`${converterGrupo(milhares)} mil`);
  }

  if (resto > 0) {
    blocos.push(converterGrupo(resto));
  }

  const resultado = blocos.join(" e ");
  const moeda = (num === 1) ? "real" : (milhoes > 0 && milhares === 0 && resto === 0) ? "de reais" : "reais";
  return `${resultado} ${moeda}`;
}

export function NewGoalModal({ isOpen, onClose, onSave, onSuccess }: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<"REVENUE" | "DEALS" | "LEADS">("REVENUE");
  const [periodPreset, setPeriodPreset] = useState<"current_month" | "next_month" | "quarter" | "custom">("current_month");
  const [rawValue, setRawValue] = useState<string>("100.000,00");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  const numericTargetValue = useMemo(() => parseCurrencyInput(rawValue), [rawValue]);

  const handleTargetTypeChange = (newType: "REVENUE" | "DEALS" | "LEADS") => {
    setTargetType(newType);
    if (newType === "REVENUE") {
      setRawValue("100.000,00");
    } else if (newType === "DEALS") {
      setRawValue("10");
    } else if (newType === "LEADS") {
      setRawValue("50");
    }
  };

  const handleBlurValue = () => {
    if (targetType === "REVENUE") {
      const val = parseCurrencyInput(rawValue);
      if (val > 0) {
        setRawValue(val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    }
  };

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
    const finalTargetValue = parseCurrencyInput(rawValue);
    if (finalTargetValue <= 0) {
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
        targetValue: finalTargetValue,
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
      setRawValue("100.000,00");
      setUserId("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao criar meta comercial.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 shadow-2xl text-slate-900 dark:text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Configurar Nova Meta</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Defina objetivos comerciais e acompanhe o ritmo da equipe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Título da Meta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Faturamento Mensal Q3 ou Vendas Enterprise"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de Métrica
              </label>
              <select
                value={targetType}
                onChange={(e) => handleTargetTypeChange(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="REVENUE">Receita (R$ Faturado)</option>
                <option value="DEALS">Contratos / Vendas Ganhas</option>
                <option value="LEADS">Leads Qualificados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Responsável
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Valor Alvo {targetType === "REVENUE" ? "(R$)" : "(Quantidade)"}
            </label>
            <div className="relative">
              {targetType === "REVENUE" && (
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">
                  R$
                </span>
              )}
              <input
                type="text"
                inputMode="decimal"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                onBlur={handleBlurValue}
                placeholder={targetType === "REVENUE" ? "100.000,00" : "10"}
                className={`w-full ${
                  targetType === "REVENUE" ? "pl-10" : "pl-3.5"
                } pr-3.5 py-2.5 text-sm font-mono font-semibold rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all`}
                required
              />
            </div>
            {/* Live helper com feedback de moeda e extenso */}
            <div className="mt-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-1.5 text-xs shadow-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Total interpretado:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {targetType === "REVENUE"
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(numericTargetValue)
                    : `${numericTargetValue.toLocaleString("pt-BR")} ${
                        targetType === "DEALS" ? "contratos" : "leads"
                      }`}
                </span>
              </div>
              {targetType === "REVENUE" && numericTargetValue > 0 && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  ({numberToExtensoBRL(numericTargetValue)})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Período de Vigência
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPeriodPreset("current_month")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    periodPreset === "current_month"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Este Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("next_month")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    periodPreset === "next_month"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Próximo Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodPreset("quarter")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    periodPreset === "quarter"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
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
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
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
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
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
    </ModalPortal>
  );
}
