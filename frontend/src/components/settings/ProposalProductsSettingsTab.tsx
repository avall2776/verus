"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Folder,
  DollarSign,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";
import { useTheme } from "@/contexts/ThemeContext";
import { extractGoogleDriveId, isGoogleDriveUrl, getDriveThumbnailUrl } from "@/lib/googleDriveHelper";
import { ProposalProduct } from "@/types/commercial";

export default function ProposalProductsSettingsTab() {
  const { isWhatsApp, isClean } = useTheme();

  const primaryBtnClass = isWhatsApp
    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20";
  const focusBorderClass = isWhatsApp
    ? "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
    : "focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const accentTextClass = isWhatsApp ? "text-emerald-500 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400";

  // Estados da Pasta do Drive
  const [driveFolder, setDriveFolder] = useState("");
  const [loadingDriveConfig, setLoadingDriveConfig] = useState(true);
  const [savingDriveConfig, setSavingDriveConfig] = useState(false);

  // Estados dos Produtos
  const [products, setProducts] = useState<ProposalProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de Criação / Edição de Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProposalProduct | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    driveUrl: "",
    folderName: "Geral",
    unit: "un",
  });

  // Carregar dados iniciais
  useEffect(() => {
    fetchDriveConfig();
    fetchProducts();
  }, []);

  const fetchDriveConfig = async () => {
    setLoadingDriveConfig(true);
    try {
      const { data } = await api.get("/proposals/drive-config");
      setDriveFolder(data.driveFolder || "");
    } catch (err: any) {
      console.error("[PROPOSAL_DRIVE_CONFIG_ERROR]", err);
    } finally {
      setLoadingDriveConfig(false);
    }
  };

  const handleSaveDriveFolder = async () => {
    setSavingDriveConfig(true);
    try {
      const { data } = await api.patch("/proposals/drive-config", {
        driveFolder: driveFolder.trim(),
      });
      setDriveFolder(data.driveFolder || "");
      toast.success("Pasta do Google Drive vinculada com sucesso!");
    } catch (err: any) {
      console.error("[PROPOSAL_DRIVE_SAVE_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar pasta do Drive.");
    } finally {
      setSavingDriveConfig(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get("/proposals/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("[PROPOSAL_PRODUCTS_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao carregar catálogo de produtos.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Pastas únicas para filtro
  const availableFolders = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.folderName && p.folderName.trim()) {
        set.add(p.folderName.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.folderName || "").toLowerCase().includes(search.toLowerCase());

      const matchesFolder =
        selectedFolder === "ALL" || (p.folderName || "Geral") === selectedFolder;

      return matchesSearch && matchesFolder;
    });
  }, [products, search, selectedFolder]);

  const handleOpenModal = (product: ProposalProduct | null = null) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: Number(product.price || 0),
        driveUrl: product.driveUrl || "",
        folderName: product.folderName || "Geral",
        unit: product.unit || "un",
      });
    } else {
      setEditingProduct(null);
      setForm({
        name: "",
        description: "",
        price: 0,
        driveUrl: "",
        folderName: selectedFolder !== "ALL" ? selectedFolder : "Geral",
        unit: "un",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("O nome do produto ou serviço é obrigatório.");
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        const { data } = await api.patch(`/proposals/products/${editingProduct.id}`, form);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data : p)));
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { data } = await api.post("/proposals/products", form);
        setProducts((prev) => [data, ...prev]);
        toast.success("Produto cadastrado no catálogo com sucesso!");
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("[SAVE_PRODUCT_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar produto.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o produto "${name}" do catálogo?`)) {
      return;
    }

    try {
      await api.delete(`/proposals/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Produto removido com sucesso.");
    } catch (err: any) {
      console.error("[DELETE_PRODUCT_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao remover produto.");
    }
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Thumbnail do produto no modal
  const modalDriveThumb = useMemo(() => {
    if (!form.driveUrl) return null;
    return getDriveThumbnailUrl(form.driveUrl, 600);
  }, [form.driveUrl]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className={`w-5 h-5 ${accentTextClass}`} />
            Catálogo de Produtos & Fotos no Google Drive (Propostas)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure suas pastas e fotos do Google Drive. Ao criar propostas comerciais, os itens e fotos são puxados direto da nuvem sem pesar no banco de dados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${primaryBtnClass}`}
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto / Foto</span>
        </button>
      </div>

      {/* CARD 1: CONFIGURAÇÃO DA PASTA DO GOOGLE DRIVE */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Pasta Principal do Google Drive (Repositório de Produtos)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Cole o link da pasta do Google Drive onde você organiza as fotos e catálogos dos seus produtos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Drive (Zero Peso no BD)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Folder className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={driveFolder}
              onChange={(e) => setDriveFolder(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/1nl4xIEeTROI-RXmFL9rHyyRTUhjuhSIq"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleSaveDriveFolder}
              disabled={savingDriveConfig}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${primaryBtnClass}`}
            >
              {savingDriveConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Pasta</span>
            </button>

            {driveFolder && (
              <a
                href={driveFolder}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Abrir pasta no Google Drive"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="hidden sm:inline">Abrir no Drive</span>
              </a>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-500/5 border border-blue-200/80 dark:border-blue-500/20 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong>Como funciona:</strong> Ao cadastrar produtos abaixo, você cola o link de compartilhamento da foto do Google Drive. O sistema extrai a miniatura instantaneamente e a exibe em alta resolução nos orçamentos, PDFs e na página pública de aceite, sem armazenar arquivos pesados no servidor.
          </p>
        </div>
      </div>

      {/* CARD 2: CATÁLOGO DE PRODUTOS & FOTOS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, pasta ou descrição..."
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
            />
          </div>

          {/* Pastas / Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedFolder("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                selectedFolder === "ALL"
                  ? isWhatsApp
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Todas as Pastas ({products.length})
            </button>
            {availableFolders.map((f) => {
              const count = products.filter((p) => p.folderName === f).length;
              const isSelected = selectedFolder === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFolder(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                    isSelected
                      ? isWhatsApp
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>{f}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listagem de Produtos */}
        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <p className="text-xs font-semibold">Carregando catálogo de produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {search || selectedFolder !== "ALL" ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-0.5">
                {search || selectedFolder !== "ALL"
                  ? "Tente ajustar o termo de pesquisa ou selecionar outra pasta do catálogo."
                  : "Cadastre seus produtos com foto do Google Drive para que apareçam automaticamente na criação de propostas."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${primaryBtnClass}`}
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const driveThumb = getDriveThumbnailUrl(product.driveUrl, 400);

              return (
                <div
                  key={product.id}
                  className="group relative p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Imagem do Produto do Drive */}
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {driveThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={driveThumb}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                          {product.folderName || "Geral"}
                        </span>
                        {product.driveUrl && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            <Cloud className="w-2.5 h-2.5" /> Drive
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1" title={product.name}>
                        {product.name}
                      </h4>

                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {Number(product.price || 0) > 0 ? (
                          `R$ ${Number(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 font-sans font-normal text-[11px]">A orçar na proposta</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {product.description && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modelo:</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20 truncate">
                        {product.description}
                      </span>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1">
                      {product.driveUrl && (
                        <a
                          href={product.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Abrir foto original no Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {product.driveUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(product.driveUrl || "", product.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Copiar link do Drive"
                        >
                          {copiedId === product.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(product)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remover produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div
              className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingProduct ? "Editar Produto / Serviço" : "Cadastrar Produto para Propostas"}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Vincule fotos do Google Drive diretamente ao nome do produto orçado.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Produto ou Serviço *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Semeadora Adubadora Verto 2026, Consultoria de Automação..."
                      className={`w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Pasta / Categoria no Drive
                      </label>
                      <input
                        type="text"
                        value={form.folderName}
                        onChange={(e) => setForm({ ...form, folderName: e.target.value })}
                        placeholder="Ex: Semeadoras, Peças, Serviços..."
                        className={`w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Preço Unitário Sugerido (R$)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
                      />
                    </div>
                  </div>

                  {/* Link da Foto no Google Drive */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-blue-500" /> Link de Compartilhamento da Foto no Google Drive
                      </span>
                      {extractGoogleDriveId(form.driveUrl) && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ID: {extractGoogleDriveId(form.driveUrl)?.slice(0, 10)}...
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={form.driveUrl}
                      onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
                      placeholder="https://drive.google.com/file/d/1demo-foto-produto/view?usp=sharing"
                      className={`w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      No Google Drive, clique com botão direito na foto &gt; Compartilhar &gt; Qualquer pessoa com o link &gt; Copiar link.
                    </p>
                  </div>

                  {/* Preview Visual em Tempo Real da Foto */}
                  {modalDriveThumb && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-in fade-in">
                      <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={modalDriveThumb}
                          alt="Preview do produto"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Foto detectada e conectada com sucesso!
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Essa foto será exibida automaticamente ao selecionar este item na criação da proposta.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Modelo / Variação / Descrição (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Ex: Verto, Case, Stara, 12 Linhas... (Será vinculado automaticamente ao nome na proposta)"
                      className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${focusBorderClass}`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      O modelo cadastrado aqui aparecerá destacado no catálogo e será preenchido na proposta comercial.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${primaryBtnClass}`}
                  >
                    {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
