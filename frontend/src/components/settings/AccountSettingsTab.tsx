"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Shield, KeyRound, Camera, Save, Loader2, Sparkles, Sun, Moon, Check } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { getStoredUserSync, getCachedUser } from "@/lib/userCache";
import { isAvatarUrlValid } from "@/lib/avatarUtils";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
];

export default function AccountSettingsTab() {
  const { isWhatsApp, theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(() => getStoredUserSync());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const primaryBtnClass = isWhatsApp
    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20";
  const focusBorderClass = isWhatsApp ? "focus:border-emerald-500" : "focus:border-blue-600";

  useEffect(() => {
    getCachedUser().then((u) => {
      if (u) {
        setCurrentUser(u);
        setName(u.name || "");
        setEmail(u.email || "");
        setAvatarUrl(u.avatarUrl || "");
      }
    });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.patch(`/users/${currentUser.id}`, {
        name: cleanName,
        avatarUrl: avatarUrl.trim() || null,
      });

      const updated = {
        ...(currentUser || {}),
        name: cleanName,
        avatarUrl: avatarUrl.trim() || null,
      };

      setCurrentUser(updated);
      localStorage.setItem("versus_user", JSON.stringify(updated));
      window.dispatchEvent(new Event("user_updated"));
      toast.success(res.data?.message || "Perfil atualizado com sucesso!");
    } catch (err: any) {
      console.error("[PROFILE_SAVE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error("Informe a nova senha.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação da senha não confere.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch(`/users/${currentUser.id}`, {
        password: newPassword.trim(),
      });
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha alterada com sucesso!");
    } catch (err: any) {
      console.error("[PASSWORD_SAVE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao alterar senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        toast.success("Foto selecionada! Clique em salvar para confirmar.");
      }
    };
    reader.readAsDataURL(file);
  };

  const roleLabel = currentUser?.role === "ADMIN" ? "Administrador" : currentUser?.role === "SUPERVISOR" ? "Supervisor" : "Colaborador";

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      {/* Card 1: Perfil e Informações Pessoais */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg overflow-hidden border shadow-sm ${
              isWhatsApp ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-blue-500/10 text-blue-500 border-blue-500/30"
            }`}>
              {isAvatarUrlValid(avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name?.[0]?.toUpperCase() || <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{name || "Minha Conta"}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  roleLabel === "Administrador"
                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                    : roleLabel === "Supervisor"
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                }`}>
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{email || "Sem e-mail cadastrado"}</p>
            </div>
          </div>
        </div>

        {/* Formulário de Perfil */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className={`w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none ${focusBorderClass}`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail de Acesso
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full p-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Upload e Avatares */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Foto de Perfil
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs">
                <Camera className="w-3.5 h-3.5" />
                <span>Carregar Nova Imagem</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Ou escolha um avatar:</span>
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === url ? (isWhatsApp ? "border-emerald-500 scale-110" : "border-blue-500 scale-110") : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer ${primaryBtnClass}`}
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando Perfil...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados do Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Segurança e Redefinição de Senha */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Segurança & Senha de Acesso</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Atualize sua senha de autenticação na plataforma</p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none ${focusBorderClass}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className={`w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none ${focusBorderClass}`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer ${primaryBtnClass}`}
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Atualizando Senha...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Atualizar Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
