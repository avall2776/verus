"use client";

import React, { useState, useEffect } from "react";
import { User, Camera, Mail, Shield, Check, X, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUserUpdated?: (updated: any) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
];

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}: UserProfileModalProps) {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customUrlInput, setCustomUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setAvatarUrl(currentUser.avatarUrl || "");
    }
  }, [currentUser, isOpen]);

  // Listener tecla ESC
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("O nome do operador não pode ficar vazio.");
      return;
    }

    setIsSaving(true);
    try {
      let serverUpdated = false;
      let resData: any = null;
      try {
        const res = await api.patch("/users/profile", {
          name: cleanName,
          avatarUrl: avatarUrl.trim() || null,
        });
        resData = res.data;
        serverUpdated = true;
      } catch (err1) {
        if (currentUser?.id) {
          try {
            const res2 = await api.patch(`/users/${currentUser.id}`, {
              name: cleanName,
              avatarUrl: avatarUrl.trim() || null,
            });
            resData = res2.data;
            serverUpdated = true;
          } catch (err2) {
            console.warn("Fallback de atualização de perfil falhou", err2);
          }
        }
      }

      const updated = {
        ...(currentUser || {}),
        ...(resData || {}),
        name: cleanName,
        avatarUrl: avatarUrl.trim() || null,
      };

      localStorage.setItem("versus_user", JSON.stringify(updated));
      window.dispatchEvent(new Event("user_updated"));
      if (onUserUpdated) onUserUpdated(updated);

      if (serverUpdated) {
        toast.success("Perfil e foto atualizados com sucesso!");
      } else {
        toast.success("Perfil atualizado localmente!");
      }
      onClose();
    } catch (error) {
      console.error(error);
      // Fallback local
      const updated = {
        ...(currentUser || {}),
        name: cleanName,
        avatarUrl: avatarUrl.trim() || null,
      };
      localStorage.setItem("versus_user", JSON.stringify(updated));
      window.dispatchEvent(new Event("user_updated"));
      if (onUserUpdated) onUserUpdated(updated);
      toast.success("Perfil atualizado!");
      onClose();
    } finally {
      setIsSaving(false);
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
        toast.success("Foto selecionada!");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0B1224] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 text-white"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Meu Perfil do Sistema</h3>
              <p className="text-[11px] text-slate-400">Edite seu nome de operador e foto de exibição</p>
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

        <form onSubmit={handleSave} className="space-y-4">
          {/* Seletor e Preview de Foto de Perfil */}
          <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-[#070D1B] border border-slate-800">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 border-2 border-blue-500/40 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-md">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={avatarUrl} 
                    alt="Foto de Perfil" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  name?.[0]?.toUpperCase() || "U"
                )}
              </div>

              <label 
                htmlFor="avatar-upload-input"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white cursor-pointer hover:bg-blue-500 transition-colors shadow-md border-2 border-[#0B1224]"
                title="Carregar foto do computador"
              >
                <Camera className="w-3.5 h-3.5" />
                <input 
                  id="avatar-upload-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label 
                htmlFor="avatar-upload-input"
                className="text-[11px] font-semibold text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3 h-3" /> Fazer Upload
              </label>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setCustomUrlInput(!customUrlInput)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <ImageIcon className="w-3 h-3" /> Inserir Link URL
              </button>
              {avatarUrl && (
                <>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="text-[11px] font-semibold text-rose-400 hover:underline"
                  >
                    Remover
                  </button>
                </>
              )}
            </div>

            {customUrlInput && (
              <input 
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#0B1224] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
            )}

            {/* Presets Rápidos */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-400">Sugestões:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatarUrl(url)}
                    className="w-6 h-6 rounded-full border border-slate-700 hover:border-blue-500 overflow-hidden transition-all shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nome do Operador */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Nome Completo do Operador *
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Albuquerque"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* E-mail e Cargo (Informativo) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                E-mail de Acesso
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#070D1B] border border-slate-800 text-xs text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{currentUser?.email || "usuario@versus.com.br"}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Nível de Acesso
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#070D1B] border border-slate-800 text-xs text-slate-300">
                <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{currentUser?.role === "ADMIN" ? "Administrador" : "Operador"}</span>
              </div>
            </div>
          </div>

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
