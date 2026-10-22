"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building,
  Loader2,
  Trash2,
  Palette,
  DollarSign,
  User,
  Phone,
  Mail,
  FileText,
  Layers,
  FolderArchive,
  Save,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { MarketingClientItem, TeamMember } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: MarketingClientItem | null;
  teamMembers: TeamMember[];
  onSaved: () => void;
}

const PRESET_COLORS = [
  "#00D2FF",
  "#0055FF",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
];

export default function MarketingClientModal({
  isOpen,
  onClose,
  client,
  teamMembers,
  onSaved,
}: Props) {
  const isEditing = Boolean(client?.id);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "contato" | "escopo" | "briefing">("dados");

  // 1. Dados Cadastrais Corporativos
  const [name, setName] = useState("");
  const [corporateName, setCorporateName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [brandColor, setBrandColor] = useState("#00D2FF");

  // 2. Contato & Atendimento
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");

  // 3. Escopo & Contrato
  const [planTier, setPlanTier] = useState("Standard");
  const [status, setStatus] = useState<string>("FECHADO");
  const [contractValue, setContractValue] = useState<number>(0);
  const [adBudget, setAdBudget] = useState<number>(0);
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(12);

  // Metas de Entregas Mensais
  const [postsTarget, setPostsTarget] = useState(12);
  const [reelsTarget, setReelsTarget] = useState(4);
  const [storiesTarget, setStoriesTarget] = useState(20);
  const [campaignsTarget, setCampaignsTarget] = useState(2);

  // 4. Briefing & Materiais
  const [briefing, setBriefing] = useState("");
  const [scope, setScope] = useState("");
  const [brandGuidelines, setBrandGuidelines] = useState("");
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [aiGuidelines, setAiGuidelines] = useState("");

  useEffect(() => {
    if (client) {
      const del = client.monthlyDeliverables || {};
      setName(client.name || "");
      setCorporateName(del.corporateName || "");
      setCnpj(del.cnpj || "");
      setSegment(del.segment || "");
      setCity(del.city || "");
      setState(del.state || "");
      setAddress(del.address || "");
      setBrandColor(client.brandColor || "#00D2FF");

      setContactName(client.contactName || "");
      setContactRole(del.contactRole || "");
      setContactPhone(client.contactPhone || "");
      setContactEmail(client.contactEmail || "");
      setAssignedUserId(client.assignedUserId || "");

      setPlanTier(client.planTier || "Standard");
      setStatus(client.status || "FECHADO");
      setContractValue(Number(del.contractValue) || 0);
      setAdBudget(Number(client.adBudget) || 0);
      setContractDurationMonths(del.contractDurationMonths ?? 12);

      setPostsTarget(del.posts ?? 12);
      setReelsTarget(del.reels ?? 4);
      setStoriesTarget(del.stories ?? 20);
      setCampaignsTarget(del.campaigns ?? 2);

      setBriefing(del.briefing || "");
      setScope(del.scope || "");
      setBrandGuidelines(del.brandGuidelines || "");
      setMaterialsUrl(del.materialsUrl || "");
      setAiGuidelines(del.aiGuidelines || "");
    } else {
      setName("");
      setCorporateName("");
      setCnpj("");
      setSegment("");
      setCity("");
      setState("");
      setAddress("");
      setBrandColor("#00D2FF");

      setContactName("");
      setContactRole("");
      setContactPhone("");
      setContactEmail("");
      setAssignedUserId("");

      setPlanTier("Standard");
      setStatus("FECHADO");
      setContractValue(0);
      setAdBudget(0);
      setContractDurationMonths(12);

      setPostsTarget(12);
      setReelsTarget(4);
      setStoriesTarget(20);
      setCampaignsTarget(2);

      setBriefing("");
      setScope("");
      setBrandGuidelines("");
      setMaterialsUrl("");
      setAiGuidelines("");
    }
  }, [client]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome da marca/cliente é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      const existingDel = client?.monthlyDeliverables || {};
      const payload: any = {
        name: name.trim(),
        brandColor,
        planTier,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim().toLowerCase() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        assignedUserId: assignedUserId || undefined,
        adBudget: Number(adBudget) || 0,
        status,
        monthlyDeliverables: {
          ...existingDel,
          posts: Number(postsTarget) || 0,
          reels: Number(reelsTarget) || 0,
          stories: Number(storiesTarget) || 0,
          campaigns: Number(campaignsTarget) || 0,
          corporateName: corporateName.trim() || undefined,
          cnpj: cnpj.trim() || undefined,
          segment: segment.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          address: address.trim() || undefined,
          contactRole: contactRole.trim() || undefined,
          contractValue: Number(contractValue) || 0,
          contractDurationMonths: Number(contractDurationMonths) || 12,
          briefing: briefing.trim() || undefined,
          scope: scope.trim() || undefined,
          brandGuidelines: brandGuidelines.trim() || undefined,
          materialsUrl: materialsUrl.trim() || undefined,
          aiGuidelines: aiGuidelines.trim() || undefined,
        },
      };

      if (isEditing) {
        await api.patch(`/agency/marketing/clients/${client!.id}`, payload);
        toast.success("Ficha do cliente atualizada com sucesso!");
      } else {
        await api.post("/agency/marketing/clients", payload);
        toast.success("Cliente de marketing cadastrado com sucesso!");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[SAVE_CLIENT_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!client?.id) return;
    if (!confirm(`Tem certeza que deseja remover o cliente "${client.name}"? Todos os cards e vínculos operacionais serão afetados.`)) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/agency/marketing/clients/${client.id}`);
      toast.success("Cliente removido com sucesso!");
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[DELETE_CLIENT_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao remover cliente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Building className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {isEditing ? `Editar: ${client?.name || ""}` : "Novo Cadastro de Cliente & Escopo"}
              </h3>
              <p className="text-xs text-slate-400">
                Padrão corporativo completo de dados, CNPJ, briefing e entregas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas do Formulário */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 text-xs font-semibold overflow-x-auto custom-scrollbar">
          {(
            [
              { id: "dados", label: "Dados Cadastrais" },
              { id: "contato", label: "Contatos & Atendimento" },
              { id: "escopo", label: "Escopo & Contrato" },
              { id: "briefing", label: "Briefing & Materiais" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-cyan-400 font-bold border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Formulário com rolagem */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          
          {/* ABA 1: DADOS CADASTRAIS */}
          {activeTab === "dados" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome Fantasia / Marca *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Agrosul"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Razão Social</label>
                <input
                  type="text"
                  value={corporateName}
                  onChange={(e) => setCorporateName(e.target.value)}
                  placeholder="Ex: Agrosul Comércio de Defensivos Agrícolas LTDA"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nicho / Ramo de Atuação</label>
                <input
                  type="text"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  placeholder="Ex: Loja de defensivos agrícolas, adubos e fertilizantes"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Campo Belo do Sul"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Estado (UF)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SC"
                    maxLength={2}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Endereço Completo</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Principal, 123 - Centro"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                  <span>Cor de Identificação da Marca</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-800 bg-transparent cursor-pointer p-0.5 shrink-0"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-24 p-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white font-mono uppercase"
                  />
                  <div className="flex items-center gap-1.5 ml-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBrandColor(c)}
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          brandColor.toUpperCase() === c.toUpperCase()
                            ? "border-white scale-110 shadow-sm"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONTATOS & ATENDIMENTO */}
          {activeTab === "contato" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nome do Contato Principal</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cargo / Função</label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="Ex: Diretor Comercial / Sócio"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(49) 99999-9999"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">E-mail Principal</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contato@agrosul.com.br"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-300">Responsável Interno da Agência</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
                >
                  <option value="">Nenhum operador atribuído</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ABA 3: ESCOPO & CONTRATO */}
          {activeTab === "escopo" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Pacote / Plano Contratado</label>
                  <input
                    type="text"
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value)}
                    placeholder="Ex: Standard, Performance Pro, Enterprise"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Status Operacional</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="FECHADO">Fechado</option>
                    <option value="ACTIVE">Ativo / Em Produção</option>
                    <option value="PAUSED">Pausado</option>
                    <option value="CHURNED">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Mensalidade (Fee Agência R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Verba Mensal de Tráfego (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adBudget}
                    onChange={(e) => setAdBudget(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Vigência (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    value={contractDurationMonths}
                    onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white font-mono outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Metas Mensais de Entrega */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                  SLA / Entregas Acordadas no Mês
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Posts / Carrosséis</label>
                    <input
                      type="number"
                      min="0"
                      value={postsTarget}
                      onChange={(e) => setPostsTarget(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Reels / Vídeos</label>
                    <input
                      type="number"
                      min="0"
                      value={reelsTarget}
                      onChange={(e) => setReelsTarget(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Stories Mensais</label>
                    <input
                      type="number"
                      min="0"
                      value={storiesTarget}
                      onChange={(e) => setStoriesTarget(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Campanhas Ads</label>
                    <input
                      type="number"
                      min="0"
                      value={campaignsTarget}
                      onChange={(e) => setCampaignsTarget(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-lg bg-white dark:bg-[#0B1224] border border-slate-700 text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: BRIEFING & MATERIAIS */}
          {activeTab === "briefing" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Briefing do Cliente (História, Público, Proposta de Valor)</label>
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  placeholder="Descreva o modelo de negócio, persona, objetivos de vendas, principais produtos ou serviços..."
                  rows={4}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Escopo Detalhado (O que está e não está incluso)</label>
                <textarea
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Ex: Gestão de Instagram e Facebook, criação de 12 posts mensais, edição de 4 reels com gravação externa por conta do cliente..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Link da Pasta de Materiais (Google Drive, Figma, Canva)</label>
                <input
                  type="url"
                  value={materialsUrl}
                  onChange={(e) => setMaterialsUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tom de Voz & Diretrizes de Marca</label>
                <input
                  type="text"
                  value={brandGuidelines}
                  onChange={(e) => setBrandGuidelines(e.target.value)}
                  placeholder="Ex: Tom formal e consultivo, cores sóbrias, linguagem focada em produtividade rural"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Rodapé com Botões de Ação */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || submitting}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Excluir Cliente</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Save className="w-4 h-4" strokeWidth={1.75} />
                )}
                <span>{isEditing ? "Salvar Alterações" : "Cadastrar Cliente"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
