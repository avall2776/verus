"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export interface WorkspaceItem {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  themeColor?: string | null;
  isDefault: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMetrics {
  total: number;
  max: number;
  available: number;
  isLimitReached: boolean;
  planName: string;
}

interface WorkspaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceSelected?: (workspace: WorkspaceItem) => void;
  activeWorkspaceId?: string;
}

const PRESET_THEME_COLORS = [
  { name: "Azul VERSUS (Padrão)", color: "#2563EB" },
  { name: "Slate Corporativo", color: "#475569" },
  { name: "Índigo Executivo", color: "#4F46E5" },
  { name: "Ciano Enterprise", color: "#0891B2" },
  { name: "Esmeralda Operações", color: "#059669" },
  { name: "Púrpura Estratégico", color: "#7C3AED" },
];

export default function WorkspaceManagerModal({
  isOpen,
  onClose,
  onWorkspaceSelected,
  activeWorkspaceId,
}: WorkspaceManagerModalProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [metrics, setMetrics] = useState<WorkspaceMetrics>({
    total: 1,
    max: 1,
    available: 0,
    isLimitReached: true,
    planName: "Padrão",
  });
  const [loading, setLoading] = useState(true);

  // Form State (Criação / Edição)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formThemeColor, setFormThemeColor] = useState("#2563EB");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
      setIsEditing(false);
      setEditingId(null);
    }
  }, [isOpen]);

  // Listener ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditing, onClose]);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workspaces");
      if (res.data) {
        setWorkspaces(res.data.workspaces || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err: any) {
      console.error("[WORKSPACES_FETCH_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao carregar workspaces.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (metrics.isLimitReached) {
      toast.error(
        `Limite do plano atingido (${metrics.total}/${metrics.max}). Faça upgrade do seu plano para criar novas unidades.`
      );
      return;
    }
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormLogoUrl("");
    setFormThemeColor("#2563EB");
    setIsEditing(true);
  };

  const handleOpenEdit = (ws: WorkspaceItem) => {
    setEditingId(ws.id);
    setFormName(ws.name);
    setFormDescription(ws.description || "");
    setFormLogoUrl(ws.logoUrl || "");
    setFormThemeColor(ws.themeColor || "#2563EB");
    setIsEditing(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo (PNG, SVG, JPG, WEBP)
    if (!file.type.match(/^image\/(png|jpeg|jpg|svg\+xml|webp)$/)) {
      toast.error("Formato de arquivo inválido. Utilize PNG, SVG, JPG ou WEBP.");
      return;
    }

    // Limite de 3MB
    if (file.size > 3 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setFormLogoUrl(result);
      toast.success("Logo carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      toast.error("O nome do workspace é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: cleanName,
        description: formDescription.trim() || undefined,
        logoUrl: formLogoUrl && formLogoUrl.trim() ? formLogoUrl.trim() : null,
        themeColor: formThemeColor || "#2563EB",
      };

      let updatedWs: WorkspaceItem | null = null;
      if (editingId) {
        // Atualização
        const res = await api.patch(`/workspaces/${editingId}`, payload);
        updatedWs = res.data?.workspace || null;
        toast.success(res.data?.message || "Workspace atualizado com sucesso!");
      } else {
        // Criação
        const res = await api.post("/workspaces", payload);
        updatedWs = res.data?.workspace || null;
        toast.success(res.data?.message || "Workspace criado com sucesso!");
      }

      // Revalidação imediata do state no modal
      if (updatedWs) {
        setWorkspaces((prev) => {
          const exists = prev.some((w) => w.id === updatedWs!.id);
          if (exists) {
            return prev.map((w) => (w.id === updatedWs!.id ? updatedWs! : w));
          }
          return [updatedWs!, ...prev];
        });

        // Se o workspace atualizado for o ativo, sincroniza no localStorage e no callback
        const activeStr = typeof window !== 'undefined' ? localStorage.getItem("versus_active_workspace") : null;
        if (activeStr) {
          try {
            const activeObj = JSON.parse(activeStr);
            if (activeObj.id === updatedWs.id) {
              localStorage.setItem("versus_active_workspace", JSON.stringify(updatedWs));
              if (onWorkspaceSelected) {
                onWorkspaceSelected(updatedWs);
              }
            }
          } catch (e) {}
        }
      }

      setIsEditing(false);
      setEditingId(null);
      setFormLogoUrl("");
      setFormName("");
      setFormDescription("");

      // Revalida lista do backend em segundo plano
      await fetchWorkspaces();

      // Notificar recarregamento de workspace para todo o sistema (Sidebar, Topbar, etc.)
      window.dispatchEvent(new Event("workspace_updated"));
      window.dispatchEvent(new Event("workspace_switched"));
    } catch (err: any) {
      console.error("[WORKSPACE_SAVE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar workspace.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ws: WorkspaceItem) => {
    if (ws.isDefault) {
      toast.error("Não é permitido remover o Workspace principal da empresa.");
      return;
    }

    if (workspaces.length <= 1) {
      toast.error("A empresa deve possuir no mínimo um workspace ativo.");
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover o workspace "${ws.name}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/workspaces/${ws.id}`);
      toast.success(res.data?.message || "Workspace removido com sucesso!");
      await fetchWorkspaces();
      window.dispatchEvent(new Event("workspace_updated"));
    } catch (err: any) {
      console.error("[WORKSPACE_DELETE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao remover workspace.");
    }
  };

  const handleSelectWorkspace = (ws: WorkspaceItem) => {
    localStorage.setItem("versus_active_workspace", JSON.stringify(ws));
    if (onWorkspaceSelected) {
      onWorkspaceSelected(ws);
    }
    toast.success(`Workspace "${ws.name}" ativado com sucesso!`);
    window.dispatchEvent(new Event("workspace_switched"));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0B1224] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Gerenciador de Workspaces & Unidades</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-300 border border-blue-500/20 font-mono">
                  Plano {metrics.planName}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alterne entre filiais, personalize a identidade visual de cada unidade e gerencie o isolamento operacional.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Uso e Métricas */}
        <div className="px-6 py-3.5 bg-[#070D1B] border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-300">
              Workspaces utilizados:{" "}
              <strong className="text-white font-bold">{metrics.total}</strong> de{" "}
              <strong className="text-white font-bold">{metrics.max}</strong>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.isLimitReached ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{
                  width: `${Math.min(100, (metrics.total / Math.max(1, metrics.max)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={handleOpenCreate}
              disabled={metrics.isLimitReached}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                metrics.isLimitReached
                  ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Novo Workspace</span>
            </button>
          )}
        </div>

        {/* Alerta de Limite Atingido */}
        {metrics.isLimitReached && !isEditing && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-0.5">
              <p className="font-bold text-white">Capacidade do plano atingida ({metrics.total}/{metrics.max})</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                O seu plano <strong>{metrics.planName}</strong> atingiu a cota de workspaces. Para adicionar novas filiais ou unidades isoladas, solicite o upgrade do seu plano corporativo.
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-semibold">Carregando workspaces...</p>
            </div>
          ) : isEditing ? (
            /* ================= FORMULÁRIO DE CRIAÇÃO / EDIÇÃO ================= */
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {editingId ? "Editar Informações do Workspace" : "Cadastrar Nova Unidade / Workspace"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Voltar para lista
                </button>
              </div>

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nome do Workspace / Filial *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Filial Matriz, Unidade Sul, Atendimento SP"
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Descrição Operacional (Opcional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva a finalidade desta unidade, localização ou setor específico..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Upload de Logo / Emblema */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300">
                  Logotipo / Identidade da Unidade (PNG, SVG, JPG)
                </label>

                <div className="flex items-center gap-4">
                  {/* Pré-visualização */}
                  <div
                    className="w-14 h-14 rounded-xl border border-slate-700 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden relative shadow-inner"
                    style={{ backgroundColor: formThemeColor || "#2563EB" }}
                  >
                    {formLogoUrl ? (
                      <img
                        src={formLogoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{formName.charAt(0).toUpperCase() || "W"}</span>
                    )}
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#070D1B] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>Selecionar Arquivo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {formLogoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormLogoUrl("");
                          toast.success("Logo removido do preview. Clique em Salvar para persistir.");
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Logo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cor do Tema Corporativo */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Cor de Destaque / Tema da Unidade
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormThemeColor("#2563EB")}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>

                {/* Paleta Pré-definida */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_THEME_COLORS.map((preset) => {
                    const isSelected = formThemeColor.toLowerCase() === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setFormThemeColor(preset.color)}
                        title={preset.name}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-slate-800 border-blue-500 shadow-md"
                            : "bg-[#070D1B] border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[10px] text-slate-300 truncate w-full text-center">
                          {preset.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#070D1B] border border-slate-700 text-xs">
                    <input
                      type="color"
                      value={formThemeColor}
                      onChange={(e) => setFormThemeColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="font-mono text-slate-300 uppercase">{formThemeColor}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Clique no seletor para escolher qualquer tonalidade hexadecimal customizada.
                  </span>
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= LISTA DE WORKSPACES ================= */
            <div className="space-y-3">
              {workspaces.map((ws) => {
                const isActive = activeWorkspaceId ? ws.id === activeWorkspaceId : ws.isDefault;

                return (
                  <div
                    key={ws.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isActive
                        ? "bg-[#070D1B] border-blue-500/50 shadow-lg shadow-blue-500/5"
                        : "bg-[#070D1B]/50 border-slate-800/80 hover:bg-[#070D1B] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar do Workspace */}
                      <div
                        className="w-11 h-11 rounded-xl border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden relative shadow-inner"
                        style={{ backgroundColor: ws.themeColor || "#2563EB" }}
                      >
                        {ws.logoUrl ? (
                          <img
                            src={ws.logoUrl}
                            alt={ws.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{ws.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-bold text-white truncate">{ws.name}</h3>

                          {ws.isDefault && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/10 text-blue-300 border border-blue-500/30">
                              Principal
                            </span>
                          )}

                          {isActive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Em Uso</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {ws.description || "Unidade operacional VERSUS."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleSelectWorkspace(ws)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                        >
                          <span>Ativar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(ws)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Editar Workspace"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {!ws.isDefault && workspaces.length > 1 && (
                        <button
                          onClick={() => handleDelete(ws)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Remover Workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-[#070D1B]/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Dados isolados por Tenant & Workspace</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
