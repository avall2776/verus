"use client";

import { useState } from "react";
import { X, KeyRound, Copy, Check, Loader2, ShieldAlert, Eye, EyeOff, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface ResetAdminPasswordModalProps {
  isOpen: boolean;
  tenantId: string | null;
  tenantName: string;
  adminEmail: string;
  currentSavedPassword?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResetAdminPasswordModal({
  isOpen,
  tenantId,
  tenantName,
  adminEmail,
  currentSavedPassword,
  onClose,
  onSuccess,
}: ResetAdminPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultPassword, setResultPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tenantId) return null;

  const handleGenerateRandom = () => {
    const random = `Versus@${Math.floor(100000 + Math.random() * 900000)}`;
    setNewPassword(random);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(`/tenants/${tenantId}/reset-admin-password`, {
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      });

      setResultPassword(res.data.temporaryPassword);
      toast.success(res.data.message || "Senha redefinida com sucesso!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao redefinir senha do administrador.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultPassword) return;
    navigator.clipboard.writeText(resultPassword);
    setCopied(true);
    toast.success("Senha copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setNewPassword("");
    setResultPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Redefinir Senha do Admin</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{tenantName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {resultPassword ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
                  Senha Alterada com Sucesso!
                </span>
                <p className="text-xs text-slate-300">
                  A nova senha de acesso para o administrador <strong className="text-white font-mono">{adminEmail}</strong> é:
                </p>
                <div className="flex items-center justify-between bg-[#070D1B] border border-slate-800 p-2.5 rounded-lg">
                  <span className="font-mono text-sm font-bold text-emerald-400 select-all tracking-wider">
                    {resultPassword}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded transition-colors"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Guarde ou envie esta senha para o cliente. Ele poderá fazer login imediatamente com seu e-mail corporativo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Senha Atual Salva para Testes Imediatos */}
              {currentSavedPassword && (
                <div className="p-3 rounded-lg bg-[#070D1B] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Senha Atual Salva
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      Disponível para Teste
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-[#0B1224] p-2 rounded-lg border border-slate-800">
                    <span className="font-mono text-xs font-bold text-slate-100 tracking-wider">
                      {showCurrentPassword ? currentSavedPassword : "••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        title={showCurrentPassword ? "Ocultar senha" : "Ver senha salva"}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentSavedPassword);
                          toast.success("Senha copiada para a área de transferência!");
                        }}
                        title="Copiar senha atual"
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Você pode copiar a senha acima para efetuar testes imediatamente, sem precisar redefini-la.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Administrador Alvo:</span>
                  <span className="font-mono font-semibold text-white">{adminEmail || "Admin Principal"}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Nova Senha (Manual ou Automática):</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandom}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} /> Gerar Automática
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a senha que você desejar (ex: minhaSenha123)"
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <span>Esta ação sobrescreverá a senha anterior do administrador desta empresa imediatamente.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  <span>Redefinir Senha</span>
                </button>
              </div>
            </form>
          )}

          {resultPassword && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
