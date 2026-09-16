"use client";

import React, { useState, useEffect } from "react";
import { X, Target, Calendar, DollarSign, Users, Save, Trash2, Loader2 } from "lucide-react";
import { CommercialGoal } from "@/types/commercial";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: CommercialGoal | null;
  onSuccess: () => void;
  onDelete?: (id: string) => void;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function EditGoalModal({
  isOpen,
  onClose,
  goal,
  onSuccess,
  onDelete,
}: EditGoalModalProps) {
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState("REVENUE");
  const [targetValue, setTargetValue] = useState<number>(100000);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Carregar lista de usuários da equipe
      api
        .get("/deals/users")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setUsers(res.data);
          }
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

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || "");
      setTargetType(goal.targetType || "REVENUE");
      setTargetValue(Number(goal.targetValue || 0));
      setPeriodStart(
        goal.periodStart
          ? goal.periodStart.slice(0, 10)
          : goal.startDate || new Date().toISOString().slice(0, 10)
      );
      setPeriodEnd(
        goal.periodEnd
          ? goal.periodEnd.slice(0, 10)
          : goal.endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
      );
      setUserId(goal.userId || goal.user?.id || "");
    }
  }, [goal]);

  if (!isOpen || !goal) return null;

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

    setLoading(true);
    try {
      await api.put(`/goals/${goal.id}`, {
        title: title.trim(),
        targetType,
        targetValue,
        periodStart,
        periodEnd,
        userId: userId ? userId : null,
      });

      toast.success("Meta atualizada com sucesso!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao atualizar meta.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a meta "${goal.title}"?`)) return;

    setDeleting(true);
    try {
      await api.delete(`/goals/${goal.id}`);
      toast.success("Meta excluída com sucesso.");
      if (onDelete) onDelete(goal.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao excluir meta.";
      toast.error(msg);
    } finally {
      setDeleting(false);
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
              <h3 className="text-base font-bold text-white">Editar Meta Comercial</h3>
              <p className="text-xs text-slate-400">Ajuste valores alvos, prazos e consultores</p>
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
              placeholder="Ex: Faturamento Mensal Q3"
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
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="REVENUE">Receita (R$ Faturado)</option>
                <option value="DEALS">Contratos / Vendas Fechadas</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data Inicial
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Data Final
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Excluir Meta
            </button>

            <div className="flex items-center gap-2">
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
                  <Save className="w-4 h-4" />
                )}
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
