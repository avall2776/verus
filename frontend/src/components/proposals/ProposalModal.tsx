"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, Plus, Trash2, FileText, DollarSign, Calendar, User, 
  Building2, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2, 
  Edit3, Upload, Image as ImageIcon, MapPin, Package, Cloud,
  ExternalLink, Search, Folder, Check
} from "lucide-react";
import { Proposal, ProposalItem, CompanyIssuer, ProposalStatus, ProposalProduct } from "@/types/commercial";
import api from "@/lib/api";
import { extractGoogleDriveId, getDriveThumbnailUrl } from "@/lib/googleDriveHelper";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Proposal) => any | Promise<any>;
  proposalToEdit?: Proposal | null;
}

export function ProposalModal({ isOpen, onClose, onSave, proposalToEdit }: ProposalModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Catálogo de Produtos e Fotos do Google Drive
  const [catalogProducts, setCatalogProducts] = useState<ProposalProduct[]>([]);
  const [activeSuggestionItemId, setActiveSuggestionItemId] = useState<string | null>(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogPickerSearch, setCatalogPickerSearch] = useState("");
  const [catalogPickerFolder, setCatalogPickerFolder] = useState("ALL");
  const [photoModalItemId, setPhotoModalItemId] = useState<string | null>(null);
  const [photoModalUrl, setPhotoModalUrl] = useState("");

  // Código da proposta
  const [code, setCode] = useState(() => `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Dados do emitente (Sua Empresa / Tenant) - 100% limpos por padrão
  const [issuerName, setIssuerName] = useState("");
  const [issuerDocument, setIssuerDocument] = useState("");
  const [issuerPhone, setIssuerPhone] = useState("");
  const [issuerEmail, setIssuerEmail] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerLogoUrl, setIssuerLogoUrl] = useState<string>("");

  // Dados do cliente - 100% limpos por padrão
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState("50% Entrada + 50% na Entrega");
  const [notes, setNotes] = useState("");

  // Itens dinâmicos do orçamento - nasce zerado com 1 item em branco
  const [items, setItems] = useState<ProposalItem[]>([
    {
      id: "item-1",
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      total: 0
    }
  ]);

  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar produtos cadastrados do catálogo ao abrir
  useEffect(() => {
    if (isOpen) {
      api.get("/proposals/products")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setCatalogProducts(res.data);
          }
        })
        .catch((err) => {
          console.error("[PROPOSAL_PRODUCTS_LOAD_ERROR]", err);
        });
    }
  }, [isOpen]);

  // Sincronizar estado caso haja proposta em edição ou resetar 100% limpo para nova proposta
  useEffect(() => {
    if (proposalToEdit && isOpen) {
      setCode(proposalToEdit.code);
      setTitle(proposalToEdit.title || "");
      setClientName(proposalToEdit.clientName || "");
      setClientCompany(proposalToEdit.clientCompany || "");
      setClientEmail(proposalToEdit.clientEmail || "");
      setClientPhone(proposalToEdit.clientPhone || "");
      setSellerName(proposalToEdit.sellerName || "");
      setValidUntil(proposalToEdit.validUntil || "");
      setPaymentMethod(proposalToEdit.paymentMethod || "50% Entrada + 50% na Entrega");
      setNotes(proposalToEdit.notes || "");
      setItems(proposalToEdit.items && proposalToEdit.items.length > 0 ? proposalToEdit.items : [
        {
          id: `item-${Date.now()}`,
          name: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          total: 0
        }
      ]);
      setGlobalDiscount(proposalToEdit.discountTotal || 0);

      // Carregar emitente da proposta se houver
      const loadedLogo = proposalToEdit.logoUrl || proposalToEdit.issuer?.logoUrl || "";
      if (proposalToEdit.issuer) {
        setIssuerName(proposalToEdit.issuer.name || "");
        setIssuerDocument(proposalToEdit.issuer.document || "");
        setIssuerPhone(proposalToEdit.issuer.phone || "");
        setIssuerEmail(proposalToEdit.issuer.email || "");
        setIssuerAddress(proposalToEdit.issuer.address || "");
        setIssuerLogoUrl(loadedLogo);
      } else {
        setIssuerLogoUrl(loadedLogo);
      }
    } else if (!proposalToEdit && isOpen) {
      // NOVA PROPOSTA: Nasce 100% limpa e zerada, mas pode reaproveitar dados do emitente da empresa
      let cachedIssuer: Partial<CompanyIssuer> | null = null;
      try {
        const raw = localStorage.getItem("versus_proposal_issuer_cache");
        if (raw) cachedIssuer = JSON.parse(raw);
      } catch (e) {}

      setCode(`PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setTitle("");
      setClientName("");
      setClientCompany("");
      setClientEmail("");
      setClientPhone("");
      setSellerName("");
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidUntil(d.toISOString().split("T")[0]);
      setPaymentMethod("50% Entrada + 50% na Entrega");
      setNotes("");
      setIssuerName(cachedIssuer?.name || "");
      setIssuerDocument(cachedIssuer?.document || "");
      setIssuerPhone(cachedIssuer?.phone || "");
      setIssuerEmail(cachedIssuer?.email || "");
      setIssuerAddress(cachedIssuer?.address || "");
      setIssuerLogoUrl(cachedIssuer?.logoUrl || "");
      setItems([
        {
          id: `item-${Date.now()}`,
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          total: 0
        }
      ]);
      setGlobalDiscount(0);
    }
  }, [proposalToEdit, isOpen]);

  // Função para comprimir e otimizar logotipos corporativos em Canvas mantendo nitidez e peso levíssimo (< 80KB)
  const optimizeLogoImage = (dataUrl: string, maxWidth = 550, maxHeight = 240): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image/") || dataUrl.includes("image/svg+xml")) {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxWidth && height <= maxHeight && dataUrl.length < 100000) {
          return resolve(dataUrl);
        }
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = dataUrl.startsWith("data:image/png");
        const format = isPng ? "image/png" : "image/jpeg";
        const optimized = canvas.toDataURL(format, 0.9);
        resolve(optimized);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  if (!isOpen) return null;

  // Upload do Logotipo da Empresa Emitente com Otimização Automática
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const raw = event.target?.result as string;
      if (!raw) return;

      if (file.type === "image/svg+xml") {
        setIssuerLogoUrl(raw);
        toast.success("Logotipo vetorial carregado com sucesso!");
        return;
      }

      try {
        const optimized = await optimizeLogoImage(raw, 550, 240);
        setIssuerLogoUrl(optimized);
        toast.success("Logotipo da empresa carregado e otimizado!");
      } catch (err) {
        setIssuerLogoUrl(raw);
        toast.success("Logotipo da empresa carregado com sucesso!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setIssuerLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast("Logotipo removido.");
  };

  // Atualizar campo de um item dinâmico
  const updateItem = (id: string, field: keyof ProposalItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const disc = Number(updated.discountPercent) || 0;
        const calculated = (qty * price) * (1 - disc / 100);
        updated.total = Math.max(0, calculated);
        return updated;
      })
    );
  };

  // Adicionar novo item dinâmico
  const addItem = () => {
    const newItem: ProposalItem = {
      id: `item-${Date.now()}`,
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      total: 0
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remover item
  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("A proposta precisa ter pelo menos um item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Abrir modal de foto do Drive para um item específico
  const openPhotoModal = (itemId: string, currentUrl?: string) => {
    setPhotoModalItemId(itemId);
    setPhotoModalUrl(currentUrl || "");
  };

  const closePhotoModal = () => {
    setPhotoModalItemId(null);
    setPhotoModalUrl("");
  };

  const savePhotoModal = () => {
    if (!photoModalItemId) return;
    const cleanUrl = photoModalUrl.trim();
    updateItem(photoModalItemId, "imageUrl", cleanUrl || undefined);
    if (cleanUrl) {
      toast.success("Foto do Google Drive vinculada ao item!");
    } else {
      toast("Foto removida do item.");
    }
    closePhotoModal();
  };

  // Selecionar produto do catálogo para preencher um item existente
  const selectCatalogProductForItem = (itemId: string, product: ProposalProduct) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const qty = Number(item.quantity) || 1;
        const price = Number(product.price) || item.unitPrice || 0;
        const disc = Number(item.discountPercent) || 0;
        const total = (qty * price) * (1 - disc / 100);
        return {
          ...item,
          name: product.name,
          description: product.description || item.description || "",
          unitPrice: price,
          imageUrl: product.driveUrl || undefined,
          total: Math.max(0, total),
        };
      })
    );
    setActiveSuggestionItemId(null);
    toast.success(`"${product.name}" vinculado com foto do Drive!`);
  };

  // Adicionar produto do catálogo como um novo item
  const addCatalogProductAsNewItem = (product: ProposalProduct) => {
    const qty = 1;
    const price = Number(product.price) || 0;
    const newItem: ProposalItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: product.name,
      description: product.description || "",
      imageUrl: product.driveUrl || undefined,
      quantity: qty,
      unitPrice: price,
      discountPercent: 0,
      total: price,
    };

    setItems((prev) => {
      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].unitPrice) {
        return [newItem];
      }
      return [...prev, newItem];
    });

    toast.success(`"${product.name}" adicionado à proposta!`);
  };

  // Totais calculados automaticamente
  const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const finalTotal = Math.max(0, subtotal - Number(globalDiscount || 0));

  const handleSaveProposal = async (status: ProposalStatus) => {
    // 1. Validação do Cliente
    if (!clientName.trim()) {
      toast.error("Por favor, preencha o nome do cliente / decisor.");
      return;
    }
    if (!clientEmail.trim() && !clientPhone.trim()) {
      toast.error("Informe pelo menos um meio de contato (e-mail ou telefone).");
      return;
    }

    // 2. Validação dos Itens
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item ao orçamento.");
      return;
    }

    const invalidItem = items.find((item) => !item.name.trim() && !item.description?.trim());
    if (invalidItem) {
      toast.error("Preencha o nome ou descrição de todos os itens do orçamento.");
      return;
    }

    setIsSubmitting(true);

    let processedLogo = issuerLogoUrl;
    if (processedLogo && processedLogo.startsWith("data:image/") && processedLogo.length > 120000) {
      try {
        processedLogo = await optimizeLogoImage(processedLogo, 550, 240);
      } catch (e) {
        // Fallback silencioso
      }
    }

    const issuerData: CompanyIssuer = {
      name: issuerName.trim() || "Empresa Emitente",
      document: issuerDocument.trim(),
      phone: issuerPhone.trim(),
      email: issuerEmail.trim(),
      address: issuerAddress.trim(),
      logoUrl: processedLogo
    };

    // Cache local dos dados do emitente para conveniência
    try {
      localStorage.setItem("versus_proposal_issuer_cache", JSON.stringify(issuerData));
    } catch (e) {
      // Silencioso
    }

    // Garantir título preenchido para satisfazer a API NestJS (@IsNotEmpty)
    const safeTitle = title.trim() || `Proposta Comercial - ${clientName.trim()}`;

    const updatedOrNewProposal: Proposal = {
      id: proposalToEdit ? proposalToEdit.id : `prop-${Date.now()}`,
      code: proposalToEdit ? proposalToEdit.code : code,
      title: safeTitle,
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim() || undefined,
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      sellerName: sellerName.trim() || "Equipe Comercial",
      status: proposalToEdit ? proposalToEdit.status : status,
      items,
      subtotal,
      discountTotal: Number(globalDiscount || 0),
      total: finalTotal,
      paymentMethod,
      validUntil,
      createdAt: proposalToEdit ? proposalToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes.trim(),
      publicLink: proposalToEdit?.publicLink || `${typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app")}/p/${(proposalToEdit?.code || code).toLowerCase()}`,
      logoUrl: processedLogo || undefined,
      issuer: issuerData
    };

    try {
      console.log("[PROPOSALS_MODAL] Submetendo proposta para salvamento:", {
        status,
        code: updatedOrNewProposal.code,
        title: safeTitle,
        clientName: updatedOrNewProposal.clientName,
        total: finalTotal,
        itemsCount: items.length
      });

      await Promise.resolve(onSave(updatedOrNewProposal));

      toast.success(
        proposalToEdit 
          ? "Proposta comercial atualizada com sucesso no banco!"
          : status === "sent" 
          ? "Proposta gerada e salva com sucesso no banco!" 
          : "Proposta salva como rascunho com sucesso no banco!"
      );
      onClose();
    } catch (err: any) {
      console.error("[PROPOSALS_MODAL] Falha capturada na requisição de salvamento:", err);
      // Não fecha o modal, permitindo que o usuário ajuste e tente novamente sem perder nada
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 shadow-2xl text-slate-900 dark:text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              {proposalToEdit ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                  {proposalToEdit ? "Editar Proposta Comercial" : "Novo Orçamento / Proposta Comercial"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  {code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {proposalToEdit 
                  ? "Modifique itens, valores e dados da sua empresa nesta proposta"
                  : "Construa orçamentos profissionais com o logotipo e dados da sua empresa"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Seção 0: Dados da Empresa Emitente & Logotipo (Sua Marca) */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Dados da Empresa Emitente & Logotipo (Sua Marca no PDF)
              </h3>
              <span className="text-[11px] text-blue-600 dark:text-blue-400/80 font-semibold">
                Estampado no cabeçalho do documento
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Box de Upload do Logotipo */}
              <div className="md:col-span-4 p-4 rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center text-center shadow-sm">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {issuerLogoUrl ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <div className="h-20 max-w-full flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={issuerLogoUrl}
                        alt="Logotipo da empresa"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        Trocar Logo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 px-2 flex flex-col items-center space-y-2 w-full">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">Logotipo da Empresa</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">PNG, JPG ou SVG (máx. 2MB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Fazer Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Campos Textuais do Emitente */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia / Razão Social
                  </label>
                  <input
                    type="text"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    placeholder="Ex: Clínica Sorriso & Estética"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    value={issuerDocument}
                    onChange={(e) => setIssuerDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone Comercial / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={issuerPhone}
                    onChange={(e) => setIssuerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    value={issuerEmail}
                    onChange={(e) => setIssuerEmail(e.target.value)}
                    placeholder="comercial@suaempresa.com.br"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={issuerAddress}
                    onChange={(e) => setIssuerAddress(e.target.value)}
                    placeholder="Rua, Número, Sala/Andar, Bairro, Cidade - UF"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 1: Dados do Cliente & Proposta */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Dados do Cliente & Proposta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Proposta
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Proposta de Consultoria e Automação"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Cliente / Decisor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Empresa / Razão Social do Cliente
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Ex: Nexus Logística & Distribuição"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp / Celular Comercial
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail do Cliente
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="carlos@nexuslog.com.br"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Validade da Proposta
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Itens do Orçamento */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Itens & Serviços Orçados
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Vincule fotos diretamente do Google Drive ou escolha produtos cadastrados no catálogo
                </p>
              </div>

              <div className="flex items-center gap-2">
                {catalogProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCatalogPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-sm"
                    title="Escolher itens salvos do catálogo do Google Drive"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Catálogo / Drive ({catalogProducts.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Item
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center shadow-sm"
                >
                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Item / Serviço #{index + 1}
                      </label>
                      {item.imageUrl && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Cloud className="w-3 h-3" /> Foto do Drive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Slot da Foto do Google Drive */}
                      <div className="relative shrink-0">
                        {item.imageUrl ? (
                          <div className="relative w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getDriveThumbnailUrl(item.imageUrl, 200) || item.imageUrl}
                              alt={item.name || "Foto"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => openPhotoModal(item.id, item.imageUrl)}
                                className="p-1 text-white hover:text-blue-300"
                                title="Alterar foto do Drive"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, "imageUrl", undefined)}
                                className="p-1 text-white hover:text-rose-400"
                                title="Remover foto"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPhotoModal(item.id)}
                            className="w-9 h-9 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-500 flex flex-col items-center justify-center transition-colors bg-slate-50 dark:bg-slate-900/50 cursor-pointer"
                            title="Vincular foto do Google Drive ou catálogo"
                          >
                            <Cloud className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                        )}
                      </div>

                      {/* Input com Autocomplete inteligente do Catálogo */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            updateItem(item.id, "name", e.target.value);
                            setActiveSuggestionItemId(item.id);
                          }}
                          onFocus={() => setActiveSuggestionItemId(item.id)}
                          placeholder="Nome do produto ou serviço"
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />

                        {/* Dropdown de sugestão do Catálogo */}
                        {activeSuggestionItemId === item.id && catalogProducts.length > 0 && (
                          (() => {
                            const query = (item.name || "").toLowerCase().trim();
                            const matches = catalogProducts.filter((p) =>
                              !query || p.name.toLowerCase().includes(query) || (p.folderName && p.folderName.toLowerCase().includes(query))
                            ).slice(0, 5);

                            if (matches.length === 0) return null;

                            return (
                              <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden py-1 max-h-56 overflow-y-auto">
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3 text-blue-500" /> Catálogo de Produtos
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveSuggestionItemId(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {matches.map((product) => {
                                  const thumb = getDriveThumbnailUrl(product.driveUrl, 120);
                                  return (
                                    <div
                                      key={product.id}
                                      onClick={() => selectCatalogProductForItem(item.id, product)}
                                      className="px-2.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer flex items-center gap-2.5 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                    >
                                      <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                        {thumb ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {product.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                          <span>{product.folderName || "Geral"}</span>
                                          {product.driveUrl && <span className="text-emerald-500 font-semibold">• Foto Drive</span>}
                                        </div>
                                      </div>
                                      {Number(product.price || 0) > 0 && (
                                        <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                          R$ {Number(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Preço Unit. (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Desc. (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPercent || 0}
                      onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-2 pt-4 md:pt-0">
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Subtotal</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                        R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totais & Desconto Geral */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Desconto Global (R$):
                </label>
                <input
                  type="number"
                  min={0}
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-3 py-1.5 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-6 self-end md:self-auto">
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subtotal Bruto:</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-400 font-bold">
                    Valor Total da Proposta
                  </span>
                  <p className="text-xl font-black text-blue-900 dark:text-white font-mono">
                    R$ {finalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Condição de Pagamento e Observações */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Condição de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="50% Entrada + 50% na Entrega">50% Entrada + 50% na Entrega</option>
                <option value="À Vista com 5% de Desconto">À Vista com 5% de Desconto</option>
                <option value="3x no Boleto Faturado (30/60/90 dias)">3x no Boleto Faturado (30/60/90 dias)</option>
                <option value="Recorrência Mensal (SaaS/Serviço)">Recorrência Mensal (SaaS/Serviço)</option>
                <option value="Cartão de Crédito em até 12x">Cartão de Crédito em até 12x</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vendedor / Consultor Responsável
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Ex: Consultor Comercial"
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Termos Comerciais, Escopo & Garantia
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais de SLA, garantia ou escopo do projeto..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Descartar
          </button>

          <div className="flex items-center gap-3">
            {!proposalToEdit && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveProposal("draft")}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-sm"
              >
                Salvar como Rascunho
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveProposal(proposalToEdit?.status || "sent")}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {proposalToEdit ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  {isSubmitting ? "Salvando Alterações..." : "Salvar Alterações"}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? "Gerando Proposta..." : "Gerar Proposta & Link de Aceite"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* SUB-MODAL 1: VINCULAR FOTO DO GOOGLE DRIVE AO ITEM */}
    {photoModalItemId && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div 
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 shadow-2xl p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vincular Foto do Google Drive
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Armazenamento 100% no Google Drive (sem pesar o banco de dados)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closePhotoModal}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link de Compartilhamento da Foto no Google Drive
              </label>
              <input
                type="text"
                value={photoModalUrl}
                onChange={(e) => setPhotoModalUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/1.../view?usp=sharing"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Copie o link de compartilhamento da imagem no seu Drive e cole aqui.
              </p>
            </div>

            {/* Preview Instantâneo */}
            {photoModalUrl && getDriveThumbnailUrl(photoModalUrl) && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDriveThumbnailUrl(photoModalUrl, 300) || photoModalUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Miniatura carregada com sucesso!
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    A foto será exibida no layout da proposta, PDF e aceite do cliente.
                  </p>
                </div>
              </div>
            )}

            {/* Ou selecionar dos produtos cadastrados no catálogo */}
            {catalogProducts.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Ou selecione a foto de um produto já cadastrado:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                  {catalogProducts.filter((p) => Boolean(p.driveUrl)).map((prod) => {
                    const thumb = getDriveThumbnailUrl(prod.driveUrl, 120);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setPhotoModalUrl(prod.driveUrl || "");
                        }}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded bg-white dark:bg-slate-800 overflow-hidden shrink-0">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{prod.folderName || "Geral"}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {photoModalUrl ? (
              <button
                type="button"
                onClick={() => {
                  setPhotoModalUrl("");
                  savePhotoModal();
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
              >
                Remover Foto
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closePhotoModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={savePhotoModal}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                Salvar Foto
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* SUB-MODAL 2: ESCOLHER ITENS DO CATÁLOGO / DRIVE */}
    {isCatalogPickerOpen && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div
          className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Catálogo de Produtos & Fotos do Drive
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clique em um produto para adicioná-lo automaticamente com preço e foto
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCatalogPickerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={catalogPickerSearch}
                onChange={(e) => setCatalogPickerSearch(e.target.value)}
                placeholder="Pesquisar por nome ou especificação..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {catalogProducts
              .filter((p) => {
                const q = catalogPickerSearch.toLowerCase().trim();
                return (
                  !q ||
                  p.name.toLowerCase().includes(q) ||
                  (p.description && p.description.toLowerCase().includes(q)) ||
                  (p.folderName && p.folderName.toLowerCase().includes(q))
                );
              })
              .map((prod) => {
                const thumb = getDriveThumbnailUrl(prod.driveUrl, 160);
                return (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            {prod.folderName || "Geral"}
                          </span>
                          {prod.driveUrl && (
                            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <Cloud className="w-2.5 h-2.5" /> Drive
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {prod.name}
                        </h5>
                        {prod.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{prod.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {Number(prod.price || 0) > 0 && (
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          R$ {Number(prod.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          addCatalogProductAsNewItem(prod);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Total de itens no catálogo: {catalogProducts.length}
            </span>
            <button
              type="button"
              onClick={() => setIsCatalogPickerOpen(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    )}
    </ModalPortal>
  );
}
