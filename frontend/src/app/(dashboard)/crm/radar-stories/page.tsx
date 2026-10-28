"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Radio,
  Eye,
  Sparkles,
  TrendingUp,
  Users,
  Building2,
  MapPin,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  ArrowUpRight,
  Copy,
  Check,
  Activity,
  Layers,
  X,
  Send,
  Loader2,
  FileText,
  BadgeAlert,
  CheckCircle2,
  ShieldCheck,
  PlayCircle,
  Tractor,
  Sprout,
  Wrench,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  GraduationCap,
  Plus,
  Upload,
  HelpCircle,
  Flame,
  Target,
  Share2,
  Info,
  Download,
  Megaphone,
  Phone,
  Edit3,
  Camera,
  CheckSquare,
  Square,
  Trash2,
  Smartphone
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/components/ui/SocketProvider";

interface StoryViewer {
  id: string;
  contactId: string;
  conversationId?: string;
  name: string;
  companyOrFarm: string;
  phone: string;
  phoneFormatted?: string;
  email?: string;
  isLidOnly?: boolean;
  city: string;
  state: string;
  crmStatus: "active_client" | "inactive_client" | "open_deal" | "prospect" | "internal_team" | "non_commercial";
  crmStatusLabel: string;
  intentScore?: number;
  intentLabel?: string;
  totalPurchased: number;
  dealId?: string;
  dealTitle?: string;
  dealValue?: number;
  lastChatMessage?: string;
  lastChatDate?: string;
  chatMessages?: Array<{
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    content: string;
    createdAt: string;
    formattedDate: string;
  }>;
  aiInsight?: string;
  lastPurchaseDate?: string;
  daysInactive: number;
  assignedSeller: string;
  hasRealView: boolean;
  storyMedia: {
    id: string;
    title: string;
    category: string;
    viewedAt: string;
    exactDate: string;
    exactTime: string;
    viewsCountWeek: number;
    interestLevel: "Alta Frequência" | "Frequência Moderada" | "Visualização Recente" | "Aguardando Visualização";
    thumbnailUrl?: string;
  };
}

interface ActiveStoryPost {
  id: string;
  messageId: string;
  title: string;
  category: string;
  mediaUrl?: string;
  postedAt: string;
  postedAtRelative: string;
  postedAtDate: string;
  postedAtTime: string;
  viewsCount: number;
}

interface LightboxMedia {
  title: string;
  category: string;
  mediaUrl?: string;
  exactDate?: string;
  exactTime?: string;
  viewsCount?: number;
  contactName?: string;
}

interface RadarMetrics {
  kpis: {
    totalViewsToday: number;
    totalViewsWeek: number;
    producersTracked: number;
    inactiveReheated: number;
    hotOpportunities: number;
    conversionRatePercent: number;
  };
  chartData: Array<{
    date: string;
    Maquinarios: number;
    Insumos: number;
    Cotacoes: number;
    Pecas: number;
    total: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

export default function RadarStoriesPage() {
  const { theme } = useTheme();
  const { socket } = useSocket();

  // Estados principais
  const [metrics, setMetrics] = useState<RadarMetrics | null>(null);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [activePosts, setActivePosts] = useState<ActiveStoryPost[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [loadingViewers, setLoadingViewers] = useState<boolean>(true);
  const [loadingActivePosts, setLoadingActivePosts] = useState<boolean>(true);

  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilterTab, setActiveFilterTab] = useState<string>("all");

  // Seleção Múltipla para Tráfego Pago / Audiências Meta Ads
  const [selectedViewerIds, setSelectedViewerIds] = useState<Set<string>>(new Set());
  const [isExportingMeta, setIsExportingMeta] = useState<boolean>(false);

  // Modal de Tráfego Pago / Criar Campanha
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [campaignName, setCampaignName] = useState<string>("Remarketing Safra 26/27 - Visualizadores de Stories");
  const [campaignObjective, setCampaignObjective] = useState<string>("meta_ads_custom_audience");
  const [isCreatingCampaign, setIsCreatingCampaign] = useState<boolean>(false);

  // Modal de Alteração de Foto do Story
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [selectedPostForPhoto, setSelectedPostForPhoto] = useState<ActiveStoryPost | null>(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState<string>("");
  const [isSavingPhoto, setIsSavingPhoto] = useState<boolean>(false);

  // Modal de Ajuste de Horário do Story
  const [isTimeModalOpen, setIsTimeModalOpen] = useState<boolean>(false);
  const [selectedPostForTime, setSelectedPostForTime] = useState<ActiveStoryPost | null>(null);
  const [newPostingTime, setNewPostingTime] = useState<string>("09:25");
  const [isSavingTime, setIsSavingTime] = useState<boolean>(false);

  // Modal de Edição Rápida de Telefone
  const [isEditPhoneModalOpen, setIsEditPhoneModalOpen] = useState<boolean>(false);
  const [selectedViewerForPhone, setSelectedViewerForPhone] = useState<StoryViewer | null>(null);
  const [editPhoneNumber, setEditPhoneNumber] = useState<string>("");
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);

  // Modal Lightbox da Foto/Mídia do Story
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null);

  // Modal de Detalhes da Análise IA & CRM
  const [selectedViewerForDetails, setSelectedViewerForDetails] = useState<StoryViewer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Modal de Abordagem IA
  const [selectedViewer, setSelectedViewer] = useState<StoryViewer | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSendingDirectApproach, setIsSendingDirectApproach] = useState<boolean>(false);
  const [autoCreateDealOnSend, setAutoCreateDealOnSend] = useState<boolean>(true);
  const [convertingViewerId, setConvertingViewerId] = useState<string | null>(null);
  const [generatedApproach, setGeneratedApproach] = useState<{
    casualMessage: string;
    strategicReasoning: string;
    suggestedTiming: string;
    suggestedProduct: string;
  } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Modal de Teste de Reconhecimento Manual
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testPhone, setTestPhone] = useState<string>("");
  const [testName, setTestName] = useState<string>("");
  const [testPostTitle, setTestPostTitle] = useState<string>("Demonstração Técnica da Semeadeira Verto Max em Operação");
  const [testCategory, setTestCategory] = useState<string>("Maquinários");
  const [isSubmittingTest, setIsSubmittingTest] = useState<boolean>(false);

  // Modal de Tutorial Interativo para Gestores
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);

  // Modal de Publicação e Agendamento de Stories (Sem Blobs no Banco)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishTitle, setPublishTitle] = useState<string>("");
  const [publishCategory, setPublishCategory] = useState<string>("Maquinários");
  const [publishImageBase64, setPublishImageBase64] = useState<string>("");
  const [publishImagePreview, setPublishImagePreview] = useState<string>("");
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [publishScheduleDate, setPublishScheduleDate] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Compressão automática em Canvas (1080x1920 JPEG 0.82) para evitar PayloadTooLargeError (413) e garantir nitidez
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Falha ao ler imagem"));
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new window.Image();
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          try {
            const maxW = 1080;
            const maxH = 1920;
            let { width, height } = img;
            if (width > maxW || height > maxH) {
              const ratio = Math.min(maxW / width, maxH / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(rawDataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.84);
            resolve(compressed);
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem (JPEG, PNG ou WebP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB.");
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file);
      setPublishImageBase64(compressedBase64);
      setPublishImagePreview(compressedBase64);
    } catch {
      toast.error("Erro ao processar a imagem.");
    }
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTitle.trim()) {
      toast.error("Informe um título ou legenda para o Story.");
      return;
    }
    if (!publishImageBase64) {
      toast.error("Selecione uma imagem para o Story.");
      return;
    }
    try {
      setIsPublishing(true);
      await api.post("/crm/radar-stories/publish", {
        title: publishTitle.trim(),
        category: publishCategory,
        imageBase64: publishImageBase64,
        scheduledAt: publishMode === "schedule" && publishScheduleDate ? publishScheduleDate : undefined,
      });
      toast.success(
        publishMode === "schedule"
          ? "Story agendado com sucesso para o WhatsApp!"
          : "Story publicado com sucesso no WhatsApp!"
      );
      setIsPublishModalOpen(false);
      setPublishTitle("");
      setPublishImageBase64("");
      setPublishImagePreview("");
      fetchActivePosts();
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao publicar Story no WhatsApp.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper de ícone vetorial de categoria (Zero Emojis - Vetores de Alto Padrão)
  const getCategoryIcon = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("maq") || cat.includes("trator") || cat.includes("semead") || cat.includes("máquina")) {
      return <Tractor className="w-4 h-4 text-blue-500" />;
    }
    if (cat.includes("ins") || cat.includes("adubo") || cat.includes("semente") || cat.includes("defensivo")) {
      return <Sprout className="w-4 h-4 text-emerald-500" />;
    }
    if (cat.includes("cot") || cat.includes("safra") || cat.includes("grão") || cat.includes("soja") || cat.includes("milho")) {
      return <TrendingUp className="w-4 h-4 text-amber-500" />;
    }
    if (cat.includes("peça") || cat.includes("servi") || cat.includes("manuten") || cat.includes("oficina")) {
      return <Wrench className="w-4 h-4 text-purple-500" />;
    }
    return <Radio className="w-4 h-4 text-slate-400" />;
  };

  // Carregar dados de métricas
  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await api.get("/crm/radar-stories/metrics");
      setMetrics(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar métricas do Radar de Stories:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Carregar stories ativos das últimas 24h
  const fetchActivePosts = async () => {
    try {
      setLoadingActivePosts(true);
      const res = await api.get("/crm/radar-stories/active-posts");
      setActivePosts(res.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar active posts:", err);
    } finally {
      setLoadingActivePosts(false);
    }
  };

  // Carregar lista de visualizadores
  const fetchViewers = async () => {
    try {
      setLoadingViewers(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await api.get(`/crm/radar-stories/viewers?${params.toString()}`);
      setViewers(res.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar visualizadores do Radar de Stories:", err);
    } finally {
      setLoadingViewers(false);
    }
  };

  const [isSyncingWhatsApp, setIsSyncingWhatsApp] = useState<boolean>(false);

  const handleSyncWithWhatsApp = async () => {
    try {
      setIsSyncingWhatsApp(true);
      const res = await api.post("/crm/radar-stories/sync");
      await Promise.all([fetchMetrics(), fetchViewers(), fetchActivePosts()]);
      toast.success(res.data?.message || "Stories e visualizações sincronizados com o WhatsApp com sucesso!");
    } catch (err: any) {
      console.error("Erro ao sincronizar stories com WhatsApp:", err);
      await Promise.all([fetchMetrics(), fetchViewers(), fetchActivePosts()]);
      toast.info("Dados do Radar atualizados com a base em tempo real.");
    } finally {
      setIsSyncingWhatsApp(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchViewers();
    fetchActivePosts();
  }, []);

  useEffect(() => {
    fetchViewers();
  }, [selectedStatus, selectedCategory, searchQuery]);

  // Escuta WebSocket em tempo real para novos stories e visualizações
  useEffect(() => {
    if (!socket) return;

    const handleStoryView = (data: any) => {
      toast.info(
        `Visualização Detectada: ${data.contactName || data.phone} viu "${data.storyTitle}"`,
        { description: `Data & Horário gravados com precisão no sistema.` }
      );
      fetchMetrics();
      fetchViewers();
    };

    const handleStoryPosted = (data: any) => {
      toast.success(`Novo Story postado no WhatsApp: "${data.title}"`, {
        description: `Categoria identificada: ${data.category}. Monitoramento de visualizações ativado.`,
      });
      fetchMetrics();
      fetchViewers();
    };

    socket.on("radar:story-view", handleStoryView);
    socket.on("radar:story-posted", handleStoryPosted);

    return () => {
      socket.off("radar:story-view", handleStoryView);
      socket.off("radar:story-posted", handleStoryPosted);
    };
  }, [socket]);

  // Disparar geração de abordagem pela OpenAI
  const handleOpenAiModal = async (viewer: StoryViewer) => {
    setSelectedViewer(viewer);
    setIsAiModalOpen(true);
    setGeneratedApproach(null);
    setCopiedMessage(false);

    try {
      setIsGeneratingAi(true);
      const res = await api.post("/crm/radar-stories/approach", {
        contactId: viewer.contactId,
        producerName: viewer.name,
        companyOrFarm: viewer.companyOrFarm,
        city: viewer.city,
        state: viewer.state,
        crmStatus: viewer.crmStatusLabel,
        lastPurchaseInfo: viewer.totalPurchased > 0 ? `Comprou R$ ${viewer.totalPurchased.toLocaleString("pt-BR")} (Última compra há ${viewer.daysInactive} dias)` : "Sem compras confirmadas",
        statusTitle: viewer.storyMedia.title,
        statusCategory: viewer.storyMedia.category,
        viewsCountWeek: viewer.storyMedia.viewsCountWeek,
      });

      if (res.data?.success && res.data?.data) {
        setGeneratedApproach(res.data.data);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao conectar com a OpenAI. Verifique sua chave API.";
      toast.error(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedApproach?.casualMessage) return;
    navigator.clipboard.writeText(generatedApproach.casualMessage);
    setCopiedMessage(true);
    toast.success("Mensagem copiada para a área de transferência.");
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!selectedViewer || !generatedApproach?.casualMessage) return;
    const cleanPhone = (selectedViewer.phone || "").replace(/\D/g, "");
    const encoded = encodeURIComponent(generatedApproach.casualMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
  };

  // Disparo Direto da Abordagem pelo WhatsApp Conectado no Sistema (Sem sair do painel)
  const handleSendDirectApproach = async () => {
    if (!selectedViewer || !generatedApproach?.casualMessage?.trim()) return;
    try {
      setIsSendingDirectApproach(true);
      const res = await api.post("/crm/radar-stories/send-approach", {
        viewerId: selectedViewer.id,
        contactId: selectedViewer.contactId,
        phone: selectedViewer.phone,
        contactName: selectedViewer.name,
        message: generatedApproach.casualMessage.trim(),
        storyTitle: selectedViewer.storyMedia.title,
        createDeal: autoCreateDealOnSend,
      });
      toast.success(
        res.data?.message || "Abordagem enviada com sucesso pelo WhatsApp corporativo!"
      );
      setIsAiModalOpen(false);
      fetchViewers();
      fetchMetrics();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erro ao enviar abordagem diretamente. Tente pelo WhatsApp externo."
      );
    } finally {
      setIsSendingDirectApproach(false);
    }
  };

  // Converter visualizador de Story diretamente em Oportunidade / Negócio no Funil CRM
  const handleConvertViewerToDeal = async (viewer: StoryViewer) => {
    try {
      setConvertingViewerId(viewer.id);
      const res = await api.post("/crm/radar-stories/convert-to-deal", {
        viewerId: viewer.id,
        contactId: viewer.contactId,
        phone: viewer.phone,
        contactName: viewer.name,
        storyTitle: viewer.storyMedia.title,
        storyCategory: viewer.storyMedia.category,
      });
      toast.success(res.data?.message || `Oportunidade criada no Funil CRM para ${viewer.name}!`);
      fetchViewers();
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao converter contato em oportunidade no CRM.");
    } finally {
      setConvertingViewerId(null);
    }
  };

  // Seleção de visualizadores para tráfego pago e ações em massa
  const handleToggleSelect = (id: string) => {
    setSelectedViewerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedViewerIds.size === filteredViewers.length) {
      setSelectedViewerIds(new Set());
    } else {
      setSelectedViewerIds(new Set(filteredViewers.map((v) => v.id)));
    }
  };

  // Exportar público personalizado para o Meta Ads (Suporta SHA-256 Criptografado ou Planilha Aberta)
  const handleExportMetaAudience = async (mode: "sha256" | "plain" = "sha256") => {
    try {
      setIsExportingMeta(true);
      const viewerIds = selectedViewerIds.size > 0 ? Array.from(selectedViewerIds) : undefined;
      const res = await api.post("/crm/radar-stories/meta-audience/export", {
        viewerIds,
        mode,
      });
      const { csvContent, filename, totalContacts } = res.data;

      if (!csvContent) {
        toast.error("Nenhum contato qualificado com telefone real para exportação.");
        return;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        filename || (mode === "sha256" ? "meta_ads_sha256_stories_verto.csv" : "planilha_stories_verto.csv")
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        mode === "sha256"
          ? `Público com ${totalContacts} contatos exportado com Criptografia SHA-256 oficial do Meta Ads!`
          : `Planilha comercial com ${totalContacts} contatos exportada com sucesso!`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao exportar audiência Meta Ads.");
    } finally {
      setIsExportingMeta(false);
    }
  };

  // Criar campanha de tráfego pago / remarketing
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error("Informe o nome da campanha.");
      return;
    }
    const viewerIds = selectedViewerIds.size > 0 ? Array.from(selectedViewerIds) : filteredViewers.map((v) => v.id);
    try {
      setIsCreatingCampaign(true);
      const res = await api.post("/crm/radar-stories/campaigns/create", {
        campaignName: campaignName.trim(),
        objective: campaignObjective,
        viewerIds,
      });
      toast.success(res.data?.message || "Campanha gerada com sucesso!");
      setIsCampaignModalOpen(false);
      setSelectedViewerIds(new Set());
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao criar campanha.");
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Modal de Alteração de Foto do Story
  const handleOpenPhotoModal = (post: ActiveStoryPost) => {
    setSelectedPostForPhoto(post);
    setNewPhotoBase64(post.mediaUrl || "");
    setIsPhotoModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido (PNG, JPEG ou WebP).");
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file);
      setNewPhotoBase64(compressedBase64);
    } catch {
      toast.error("Erro ao processar a foto.");
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedPostForPhoto) return;
    if (!newPhotoBase64) {
      toast.error("Selecione uma imagem para o Story.");
      return;
    }
    try {
      setIsSavingPhoto(true);
      await api.patch(`/crm/radar-stories/posts/${selectedPostForPhoto.id}`, {
        mediaUrl: newPhotoBase64,
      });
      toast.success("Foto do Story atualizada com sucesso!");
      setIsPhotoModalOpen(false);
      fetchActivePosts();
      fetchViewers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar foto do Story.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Modal de Ajuste de Horário
  const handleOpenEditTimeModal = (post: ActiveStoryPost) => {
    setSelectedPostForTime(post);
    setNewPostingTime(post.postedAtTime?.slice(0, 5) || "09:25");
    setIsTimeModalOpen(true);
  };

  const handleSaveTime = async () => {
    if (!selectedPostForTime) return;
    try {
      setIsSavingTime(true);
      const [h, m] = newPostingTime.split(":").map(Number);
      const date = new Date();
      date.setUTCHours((h || 9) + 3, m || 25, 0, 0);

      await api.patch(`/crm/radar-stories/posts/${selectedPostForTime.id}`, {
        postedAt: date.toISOString(),
      });
      toast.success("Horário do Story ajustado com sucesso!");
      setIsTimeModalOpen(false);
      fetchActivePosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao ajustar horário.");
    } finally {
      setIsSavingTime(false);
    }
  };

  // Excluir post de Story da vitrine
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Deseja realmente excluir este Story da vitrine ativa?")) return;
    try {
      await api.delete(`/crm/radar-stories/posts/${postId}`);
      toast.success("Story excluído com sucesso da vitrine!");
      setActivePosts((prev) => prev.filter((p) => p.id !== postId && p.messageId !== postId));
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir Story.");
    }
  };

  // Atualizar classificação comercial de visualizador
  const handleUpdateViewerClassification = async (viewer: StoryViewer, newStatus: string) => {
    try {
      await api.patch(`/crm/radar-stories/viewers/${viewer.id}/classification`, {
        crmStatus: newStatus,
        contactId: viewer.contactId,
      });

      const labelMap: Record<string, string> = {
        active_client: "Cliente Comprador",
        open_deal: "Em Negociação",
        prospect: "Potencial Comprador",
        inactive_client: "Reativação de Carteira",
        internal_team: "Equipe Interna (Verto)",
        non_commercial: "Pessoal / Institucional",
      };

      setViewers((prev) =>
        prev.map((v) =>
          v.id === viewer.id
            ? {
                ...v,
                crmStatus: newStatus as any,
                crmStatusLabel: labelMap[newStatus] || v.crmStatusLabel,
              }
            : v
        )
      );

      toast.success(`Classificação de ${viewer.name} atualizada para "${labelMap[newStatus]}"!`);
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar classificação.");
    }
  };

  // Modal de Edição Rápida de Telefone
  const handleOpenEditPhoneModal = (viewer: StoryViewer) => {
    setSelectedViewerForPhone(viewer);
    const cleanDigits = (viewer.phone || "").replace(/\D/g, "");
    setEditPhoneNumber(!viewer.isLidOnly && cleanDigits.length <= 13 ? cleanDigits : "");
    setIsEditPhoneModalOpen(true);
  };

  const handleSavePhone = async () => {
    if (!selectedViewerForPhone) return;
    const clean = editPhoneNumber.replace(/\D/g, "");
    if (!clean || clean.length < 10) {
      toast.error("Informe um número de telefone com DDD válido.");
      return;
    }
    try {
      setIsSavingPhone(true);
      await api.patch(`/crm/radar-stories/viewers/${selectedViewerForPhone.id}/contact`, {
        phone: clean,
      });
      toast.success("Telefone atualizado com sucesso!");
      setIsEditPhoneModalOpen(false);
      fetchViewers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar telefone.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Filtragem combinada de visualizadores
  const filteredViewers = useMemo(() => {
    return viewers.filter((viewer) => {
      if (activeFilterTab !== "all" && viewer.crmStatus !== activeFilterTab) {
        return false;
      }
      if (selectedStatus !== "all" && viewer.crmStatus !== selectedStatus) {
        return false;
      }
      if (selectedCategory !== "all" && viewer.storyMedia.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = viewer.name.toLowerCase().includes(q);
        const matchesPhone = viewer.phone.toLowerCase().includes(q) || (viewer.phoneFormatted && viewer.phoneFormatted.toLowerCase().includes(q));
        const matchesCompany = viewer.companyOrFarm.toLowerCase().includes(q);
        const matchesCity = viewer.city.toLowerCase().includes(q);
        const matchesDeal = viewer.dealTitle ? viewer.dealTitle.toLowerCase().includes(q) : false;
        return matchesName || matchesPhone || matchesCompany || matchesCity || matchesDeal;
      }
      return true;
    });
  }, [viewers, activeFilterTab, selectedStatus, selectedCategory, searchQuery]);

  // Registrar teste de reconhecimento
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("Informe o telefone para o teste.");
      return;
    }

    try {
      setIsSubmittingTest(true);
      await api.post("/crm/radar-stories/record-view", {
        phone: testPhone,
        contactName: testName.trim() || undefined,
        storyTitle: testPostTitle,
        category: testCategory,
        viewedAt: new Date().toISOString(),
      });

      toast.success("Visualização registrada com sucesso!");
      setIsTestModalOpen(false);
      setTestPhone("");
      setTestName("");
      fetchMetrics();
      fetchViewers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao registrar visualização de teste.");
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ======================================================================= */}
      {/* 1. CABEÇALHO EXECUTIVO                                                  */}
      {/* ======================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500 shrink-0 mt-0.5 sm:mt-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                  Radar de Stories & Status
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  WhatsApp Conectado
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Rastreamento e inteligência comercial sobre visualizadores silenciosos de WhatsApp para o Agronegócio. Dados 100% auditáveis com rastreio de data, horário e post.
              </p>
            </div>
          </div>
        </div>

        {/* Ações do Topo: Grid limpo e responsivo no mobile */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 transition-colors shadow-sm cursor-pointer"
            title="Como Funciona o Radar de Stories"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Tutorial</span>
          </button>

          <button
            onClick={handleSyncWithWhatsApp}
            disabled={isSyncingWhatsApp || loadingMetrics || loadingViewers}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Sincronizar Stories e Visualizações ativamente com o WhatsApp"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWhatsApp ? "animate-spin text-blue-500" : ""} shrink-0`} />
            <span className="truncate">{isSyncingWhatsApp ? "Sincronizando..." : "Sincronizar"}</span>
          </button>

          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer col-span-2 sm:col-span-1"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Novo Story / Postar</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. KPIS EXECUTIVOS BASEADOS NO BANCO REAL                              */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Visualizações Hoje */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visualizações Confirmadas (Hoje)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.totalViewsToday || 0}
            </div>
            <div className="text-xs text-blue-500 font-semibold mt-0.5">
              {metrics?.kpis.totalViewsWeek || 0} visualizações nos últimos 7 dias
            </div>
          </div>
        </div>

        {/* Card 2: Contatos Rastreados no Tenant */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Base de Contatos na Linha
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {(metrics?.kpis.producersTracked || 0).toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-0.5">
              Contatos reais com WhatsApp no ecossistema
            </div>
          </div>
        </div>

        {/* Card 3: Inativos Reaquecidos */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interações de Status Recentes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.inactiveReheated || 0}
            </div>
            <div className="text-xs text-amber-500 font-semibold mt-0.5">
              Clientes que visualizaram status nesta semana
            </div>
          </div>
        </div>

        {/* Card 4: Oportunidades em Aberto no Funil */}
        <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Oportunidades no CRM
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.hotOpportunities || 0}
            </div>
            <div className="text-xs text-purple-400 font-semibold mt-0.5">
              Negócios ativos em negociação na carteira
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2.5 VITRINE DE STORIES ATIVOS (ÚLTIMAS 24H)                            */}
      {/* ======================================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vitrine de Stories Ativos (Últimas 24h)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {activePosts.length} no ar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status publicados no WhatsApp corporativo com contagem auditável de visualizadores silenciosos.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publicar Story</span>
          </button>
        </div>

        {loadingActivePosts ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Carregando stories ativos do WhatsApp...</span>
          </div>
        ) : activePosts.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nenhum Story ativo nas últimas 24h
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Poste agora diretamente pelo sistema ou pelo aplicativo do WhatsApp para rastrear visualizações.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Publicar Primeiro Story</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {activePosts.map((post) => (
              <div
                key={post.id}
                onClick={() =>
                  setLightboxMedia({
                    title: post.title,
                    category: post.category,
                    mediaUrl: post.mediaUrl,
                    exactDate: post.postedAtDate,
                    exactTime: post.postedAtTime,
                    viewsCount: post.viewsCount,
                  })
                }
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#070D1B] p-3 flex flex-col gap-2.5 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Topo do Card: Miniatura / Imagem em Formato Vertical de Story (9:16) */}
                <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner">
                  {/* Barra superior de status do Story (estilo WhatsApp) */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex gap-1 z-10 pointer-events-none">
                    <div className="h-0.5 flex-1 bg-white/80 rounded-full shadow-sm"></div>
                  </div>

                  {post.mediaUrl ? (
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 p-3 text-center">
                      {getCategoryIcon(post.category)}
                      <span className="text-[10px] font-semibold">{post.category}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Ver Story</span>
                    </span>
                  </div>
                  {/* Badge de Categoria */}
                  <div className="absolute top-4 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1 z-10">
                    {getCategoryIcon(post.category)}
                    <span>{post.category}</span>
                  </div>
                </div>

                {/* Dados do Story */}
                <div className="flex-1 flex flex-col justify-between gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{post.postedAtRelative}</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-blue-500">
                      <Eye className="w-3 h-3" />
                      <span>{post.viewsCount} visualizações</span>
                    </span>
                  </div>

                  {/* Botões de Ação: Alterar Foto, Ajustar Horário e Excluir */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPhotoModal(post);
                      }}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] font-semibold transition-all border border-slate-200/80 dark:border-slate-700/80 truncate cursor-pointer"
                      title="Substituir imagem ou foto do Story"
                    >
                      <Camera className="w-3 h-3 shrink-0" />
                      <span className="truncate">Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditTimeModal(post);
                      }}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition-all border border-slate-200/80 dark:border-slate-700/80 truncate cursor-pointer"
                      title="Editar o horário da postagem"
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">Horário</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      className="p-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] font-semibold transition-all border border-rose-200/80 dark:border-rose-900/50 cursor-pointer"
                      title="Excluir este Story da vitrine"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 3. GRÁFICO EXECUTIVO DE AUDIÊNCIA DE STORIES POR CATEGORIA              */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Fluxo de Visualizações de Status (Últimos 7 dias)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Segmentação diária baseada em eventos reais do WhatsApp conectado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold">
              <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                <span className="w-2 h-2 rounded-sm bg-blue-500"></span> Maquinários
              </span>
              <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <span className="w-2 h-2 rounded-sm bg-emerald-500"></span> Insumos
              </span>
              <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <span className="w-2 h-2 rounded-sm bg-amber-500"></span> Cotações
              </span>
            </div>
          </div>

          <div className="h-[210px] sm:h-[260px] w-full pt-2 sm:pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.chartData || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMaq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "light" ? "#FFFFFF" : "#070D1B",
                    borderColor: theme === "light" ? "#CBD5E1" : "#334155",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Area type="monotone" dataKey="Maquinarios" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorMaq)" name="Maquinários" />
                <Area type="monotone" dataKey="Insumos" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIns)" name="Insumos" />
                <Area type="monotone" dataKey="Cotacoes" stroke="#F59E0B" strokeWidth={2} fill="transparent" name="Cotações" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Categoria */}
        <div className="p-4 sm:p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Interesse por Segmento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribuição percentual de visualizações por categoria técnica.
            </p>

            <div className="space-y-3.5 sm:space-y-4 mt-4 sm:mt-6">
              {(metrics?.categoryDistribution || []).map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-600" : idx === 2 ? "bg-amber-500" : "bg-purple-500"
                      }`}
                      style={{ width: `${Math.max(cat.percentage, 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 mt-4 sm:mt-6 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-blue-500 block mb-0.5 sm:mb-1">Certeza e Rastreabilidade Total:</span>
            Cada visualizador é associado ao número do WhatsApp, data, hora exata e post no catálogo.
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. FEED DE PROSPECTOS E VISUALIZADORES SILENCIOSOS                      */}
      {/* ======================================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Contatos & Visualizadores Identificados</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contatos reais com cruzamento de post visualizado, data, horário exato e abordagem comercial com IA.
            </p>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, telefone, cidade..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate"
              >
                <option value="all">Status no CRM</option>
                <option value="active_client">Clientes Ativos</option>
                <option value="open_deal">Em Negociação</option>
                <option value="prospect">Potenciais Compradores</option>
                <option value="inactive_client">Reativação</option>
                <option value="internal_team">Equipe Interna</option>
                <option value="non_commercial">Pessoal / Institucional</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer truncate"
              >
                <option value="all">Categorias</option>
                <option value="Maquinários">Maquinários & Implementos</option>
                <option value="Insumos">Insumos & Defensivos</option>
                <option value="Cotações">Cotações de Safra</option>
                <option value="Peças & Serviços">Peças & Serviços</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>
        </div>

        {/* Abas de Filtragem Rápida por Classificação Comercial IA + Exportação Rápida Meta Ads */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Filtro IA:
            </span>
            {[
              { id: "all", label: "Todos", count: viewers.length },
              { id: "active_client", label: "Compradores", count: viewers.filter((v) => v.crmStatus === "active_client").length, color: "text-emerald-500" },
              { id: "open_deal", label: "Negociação", count: viewers.filter((v) => v.crmStatus === "open_deal").length, color: "text-amber-500" },
              { id: "prospect", label: "Potenciais", count: viewers.filter((v) => v.crmStatus === "prospect").length, color: "text-blue-500" },
              { id: "inactive_client", label: "Reativação", count: viewers.filter((v) => v.crmStatus === "inactive_client").length, color: "text-purple-400" },
              { id: "internal_team", label: "Equipe", count: viewers.filter((v) => v.crmStatus === "internal_team").length, color: "text-slate-400" },
              { id: "non_commercial", label: "Pessoal / Outros", count: viewers.filter((v) => v.crmStatus === "non_commercial").length, color: "text-rose-400" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeFilterTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeFilterTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Botões Diretos de Tráfego Pago / Meta Ads Criptografado (SHA-256) e Planilha */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleExportMetaAudience("sha256")}
              disabled={isExportingMeta}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Exportar lista com Hash Criptografado SHA-256 oficial para Públicos Personalizados do Meta Ads"
            >
              {isExportingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Meta Ads (SHA-256)</span>
            </button>

            <button
              onClick={() => handleExportMetaAudience("plain")}
              disabled={isExportingMeta}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Exportar planilha aberta com Nome, Telefone, Cidade e Valor para prospecção comercial"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Planilha CSV</span>
            </button>

            <button
              onClick={() => setIsCampaignModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-bold transition-colors cursor-pointer"
              title="Criar campanha de disparo no WhatsApp com Anti-Ban ou público de remarketing"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Campanha / Disparo</span>
            </button>
          </div>
        </div>

        {/* Barra de Ações em Lote para Tráfego Pago / Audiência Meta Ads */}
        {selectedViewerIds.size > 0 && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-violet-600/15 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedViewerIds.size} contato(s) selecionado(s) para Ação de Vendas & Tráfego
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exporte em Hash Criptografado SHA-256 para o Meta Ads, baixe a planilha ou dispare abordagem em lote.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportMetaAudience("sha256")}
                disabled={isExportingMeta}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isExportingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Exportar Meta Ads (SHA-256)</span>
              </button>

              <button
                onClick={() => handleExportMetaAudience("plain")}
                disabled={isExportingMeta}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Planilha Aberta (CSV)</span>
              </button>

              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Criar Campanha / Disparo</span>
              </button>

              <button
                onClick={() => setSelectedViewerIds(new Set())}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Tabela Executiva com Rastreabilidade de Data, Horário e Post (Desktop / Tablet) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                    title={selectedViewerIds.size === filteredViewers.length ? "Desmarcar todos" : "Selecionar todos"}
                  >
                    {filteredViewers.length > 0 && selectedViewerIds.size === filteredViewers.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Contato / Carteira</th>
                <th className="py-3 px-3">Telefone / WhatsApp</th>
                <th className="py-3 px-3">Post / Story Identificado</th>
                <th className="py-3 px-3">Data & Horário Exato</th>
                <th className="py-3 px-3">Classificação Comercial IA & CRM</th>
                <th className="py-3 px-3 text-right">Ação Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingViewers ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Carregando contatos reais e visualizações do sistema...</span>
                  </td>
                </tr>
              ) : filteredViewers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum contato encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredViewers.map((viewer) => {
                  const isSelected = selectedViewerIds.has(viewer.id);
                  return (
                    <tr
                      key={viewer.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? "bg-blue-500/5 dark:bg-blue-500/10" : ""
                      }`}
                    >
                      {/* Checkbox de Seleção */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(viewer.id)}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Contato / Carteira */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                          <span>{viewer.name}</span>
                          {viewer.hasRealView && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Visualização confirmada" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{viewer.companyOrFarm}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{viewer.city} - {viewer.state}</span>
                        </div>
                      </td>

                      {/* Telefone / WhatsApp Formatado com Botão de Edição */}
                      <td className="py-3 px-3 whitespace-nowrap min-w-[170px]">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {viewer.isLidOnly ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>WhatsApp Verificado</span>
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {viewer.phoneFormatted || `+${viewer.phone}`}
                            </span>
                          )}

                          <button
                            onClick={() => handleOpenEditPhoneModal(viewer)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                            title="Editar / Associar número de telefone deste contato"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              const cleanDigits = (viewer.phone || "").replace(/\D/g, "");
                              navigator.clipboard.writeText(cleanDigits);
                              toast.success("Número copiado!");
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Copiar número"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                          Resp: {viewer.assignedSeller}
                        </div>
                      </td>

                      {/* Post / Story Identificado com Miniatura e Lightbox */}
                      <td className="py-3 px-3 max-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() =>
                              setLightboxMedia({
                                title: viewer.storyMedia.title,
                                category: viewer.storyMedia.category,
                                mediaUrl: viewer.storyMedia.thumbnailUrl,
                                exactDate: viewer.storyMedia.exactDate,
                                exactTime: viewer.storyMedia.exactTime,
                                viewsCount: viewer.storyMedia.viewsCountWeek,
                                contactName: viewer.name,
                              })
                            }
                            className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group/thumb cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-500/50 transition-all"
                            title="Clique para visualizar a foto do Story"
                          >
                            {viewer.storyMedia.thumbnailUrl ? (
                              <img
                                src={viewer.storyMedia.thumbnailUrl}
                                alt={viewer.storyMedia.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800/80">
                                {getCategoryIcon(viewer.storyMedia.category)}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              onClick={() =>
                                setLightboxMedia({
                                  title: viewer.storyMedia.title,
                                  category: viewer.storyMedia.category,
                                  mediaUrl: viewer.storyMedia.thumbnailUrl,
                                  exactDate: viewer.storyMedia.exactDate,
                                  exactTime: viewer.storyMedia.exactTime,
                                  viewsCount: viewer.storyMedia.viewsCountWeek,
                                  contactName: viewer.name,
                                })
                              }
                              className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 hover:text-blue-500 cursor-pointer transition-colors"
                            >
                              {viewer.storyMedia.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {getCategoryIcon(viewer.storyMedia.category)}
                                <span>{viewer.storyMedia.category}</span>
                              </span>
                              {viewer.hasRealView && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Confirmada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Data & Horário Exato */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-200 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{viewer.storyMedia.exactTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{viewer.storyMedia.exactDate}</span>
                          <span className="text-slate-500 font-mono">({viewer.storyMedia.viewedAt})</span>
                        </div>
                      </td>

                      {/* Classificação Comercial IA & CRM (Com Seletor Interativo Manual) */}
                      <td className="py-3 px-3 min-w-[210px] max-w-[280px]">
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="relative inline-flex items-center">
                            <select
                              value={viewer.crmStatus}
                              onChange={(e) => handleUpdateViewerClassification(viewer, e.target.value)}
                              className={`appearance-none pl-7 pr-6 py-1 rounded-full text-[11px] font-bold border outline-none cursor-pointer transition-all shadow-sm ${
                                viewer.crmStatus === "active_client"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400 dark:bg-emerald-950/40"
                                  : viewer.crmStatus === "open_deal"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:border-amber-400 dark:bg-amber-950/40"
                                  : viewer.crmStatus === "internal_team"
                                  ? "bg-slate-500/15 text-slate-300 border-slate-500/30 hover:border-slate-400 dark:bg-slate-800/60"
                                  : viewer.crmStatus === "non_commercial"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:border-rose-400 dark:bg-rose-950/40"
                                  : viewer.crmStatus === "inactive_client"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-400 dark:bg-purple-950/40"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-400 dark:bg-blue-950/40"
                              }`}
                              title="Clique para alterar a classificação comercial deste contato"
                            >
                              <option value="active_client" className="bg-slate-900 text-emerald-400 font-semibold">Cliente Comprador</option>
                              <option value="open_deal" className="bg-slate-900 text-amber-400 font-semibold">Em Negociação</option>
                              <option value="prospect" className="bg-slate-900 text-blue-400 font-semibold">Potencial Comprador</option>
                              <option value="inactive_client" className="bg-slate-900 text-purple-400 font-semibold">Reativação de Carteira</option>
                              <option value="internal_team" className="bg-slate-900 text-slate-300 font-semibold">Equipe Interna (Verto)</option>
                              <option value="non_commercial" className="bg-slate-900 text-rose-400 font-semibold">Pessoal / Institucional</option>
                            </select>
                            <div className="absolute left-2 pointer-events-none">
                              {viewer.crmStatus === "active_client" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : viewer.crmStatus === "open_deal" ? (
                                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                              ) : viewer.crmStatus === "internal_team" ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              ) : viewer.crmStatus === "non_commercial" ? (
                                <BadgeAlert className="w-3.5 h-3.5 text-rose-400" />
                              ) : viewer.crmStatus === "inactive_client" ? (
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                              )}
                            </div>
                            <div className="absolute right-2 pointer-events-none text-slate-400">
                              <ChevronDown className="w-3 h-3" />
                            </div>
                          </div>

                          {/* Termômetro de Intenção IA & Contexto Real do Inbox */}
                          {viewer.intentLabel && viewer.crmStatus !== "internal_team" && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  viewer.crmStatus === "non_commercial"
                                    ? "bg-slate-500/10 text-slate-400 border-slate-500/25"
                                    : (viewer.intentScore || 0) >= 85
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                    : (viewer.intentScore || 0) >= 70
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                }`}
                              >
                                {viewer.crmStatus === "non_commercial" ? (
                                  <BadgeAlert className="w-3 h-3 shrink-0 text-slate-400" />
                                ) : (viewer.intentScore || 0) >= 80 ? (
                                  <Flame className="w-3 h-3 shrink-0" />
                                ) : (
                                  <Target className="w-3 h-3 shrink-0" />
                                )}
                                <span>{viewer.intentLabel} ({viewer.intentScore ?? 65}%)</span>
                              </span>
                            </div>
                          )}

                          {/* Detalhe de Compra ou Negociação */}
                          {viewer.totalPurchased > 0 ? (
                            <div className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Faturado: {formatCurrency(viewer.totalPurchased)}</span>
                            </div>
                          ) : viewer.dealTitle ? (
                            <div className="text-[11px] text-amber-400 font-semibold truncate max-w-[240px] flex items-center gap-1" title={viewer.dealTitle}>
                              <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">
                                {viewer.dealValue ? `${formatCurrency(viewer.dealValue)} • ` : ""}{viewer.dealTitle}
                              </span>
                            </div>
                          ) : viewer.lastChatMessage ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedViewerForDetails(viewer);
                                setIsDetailsModalOpen(true);
                              }}
                              className="text-[10.5px] text-slate-300 hover:text-blue-400 truncate max-w-[245px] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/50 hover:bg-blue-500/10 border border-slate-700/60 hover:border-blue-500/30 transition-colors cursor-pointer"
                              title={`Clique para ler as ${viewer.chatMessages?.length || 1} mensagens da conversa no sistema: "${viewer.lastChatMessage}"`}
                            >
                              <MessageSquare className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">Chat: &ldquo;{viewer.lastChatMessage}&rdquo;</span>
                            </button>
                          ) : null}

                          {/* Botão Executivo para Abrir Modal com todas as informações completas */}
                          <button
                            onClick={() => {
                              setSelectedViewerForDetails(viewer);
                              setIsDetailsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors pt-0.5 cursor-pointer group"
                          >
                            <Sparkles className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span>Ver Conversas & Análise IA</span>
                            <ChevronRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </td>

                      {/* Ação Comercial */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAiModal(viewer)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                            title="Gerar e disparar abordagem comercial pelo sistema com IA"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Abordar IA</span>
                          </button>
                          {viewer.crmStatus !== "internal_team" && viewer.crmStatus !== "non_commercial" && !viewer.dealId && (
                            <button
                              onClick={() => handleConvertViewerToDeal(viewer)}
                              disabled={convertingViewerId === viewer.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                              title="Converter este visualizador em uma Oportunidade ativa no Funil CRM com 1 clique"
                            >
                              {convertingViewerId === viewer.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              <span>Negócio</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedViewerForDetails(viewer);
                              setIsDetailsModalOpen(true);
                            }}
                            className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 text-slate-600 dark:text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
                            title="Ver Histórico de Conversas do Sistema & Contexto IA"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {viewer.chatMessages && viewer.chatMessages.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
                                {viewer.chatMessages.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================================= */}
        {/* LISTA EM CARDS DEDICADA PARA MOBILE (md:hidden)                         */}
        {/* ======================================================================= */}
        <div className="md:hidden">
          {/* Quick Select All bar on mobile */}
          <div className="flex items-center justify-between px-1 py-2 text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-3">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {filteredViewers.length > 0 && selectedViewerIds.size === filteredViewers.length ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="font-medium">Selecionar Todos ({filteredViewers.length})</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              {selectedViewerIds.size} selecionado(s)
            </span>
          </div>

          {loadingViewers ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              <span className="text-xs">Carregando contatos reais e visualizações...</span>
            </div>
          ) : filteredViewers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum contato encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredViewers.map((viewer) => {
                const isSelected = selectedViewerIds.has(viewer.id);
                return (
                  <div
                    key={viewer.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/40 dark:bg-blue-500/15"
                        : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    {/* Header do Card Mobile: Checkbox, Nome, Status CRM */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleSelect(viewer.id)}
                          className="p-0.5 mt-0.5 rounded text-slate-400 hover:text-blue-500 transition-colors cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{viewer.name}</span>
                            {viewer.hasRealView && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" title="Visualização confirmada" />
                            )}
                          </div>
                          {(viewer.companyOrFarm || viewer.city) && (
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {viewer.companyOrFarm && (
                                <span className="flex items-center gap-1 truncate max-w-[170px]">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{viewer.companyOrFarm}</span>
                                </span>
                              )}
                              {viewer.city && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{viewer.city}{viewer.state ? ` - ${viewer.state}` : ""}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badge Status CRM */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          viewer.crmStatus === "active_client"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                            : viewer.crmStatus === "open_deal"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                            : viewer.crmStatus === "internal_team"
                            ? "bg-slate-500/15 text-slate-300 border-slate-500/30"
                            : viewer.crmStatus === "inactive_client"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/25"
                        }`}
                      >
                        {viewer.crmStatus === "active_client" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : viewer.crmStatus === "open_deal" ? (
                          <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : viewer.crmStatus === "internal_team" ? (
                          <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                        ) : viewer.crmStatus === "inactive_client" ? (
                          <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                        )}
                        <span>{viewer.crmStatusLabel}</span>
                      </span>
                    </div>

                    {/* Linha Telefone / Responsável */}
                    <div className="flex items-center justify-between text-xs mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {viewer.isLidOnly ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp Verificado</span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {viewer.phoneFormatted || `+${viewer.phone}`}
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenEditPhoneModal(viewer)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Editar telefone"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => {
                            const cleanDigits = (viewer.phone || "").replace(/\D/g, "");
                            navigator.clipboard.writeText(cleanDigits);
                            toast.success("Número copiado!");
                          }}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title="Copiar número"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {viewer.assignedSeller && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          Resp: {viewer.assignedSeller}
                        </span>
                      )}
                    </div>

                    {/* Story Identificado Mini Box */}
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2.5">
                      <div
                        onClick={() =>
                          setLightboxMedia({
                            title: viewer.storyMedia.title,
                            category: viewer.storyMedia.category,
                            mediaUrl: viewer.storyMedia.thumbnailUrl,
                            exactDate: viewer.storyMedia.exactDate,
                            exactTime: viewer.storyMedia.exactTime,
                            viewsCount: viewer.storyMedia.viewsCountWeek,
                            contactName: viewer.name,
                          })
                        }
                        className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-sm group"
                      >
                        {viewer.storyMedia.thumbnailUrl ? (
                          <img
                            src={viewer.storyMedia.thumbnailUrl}
                            alt={viewer.storyMedia.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getCategoryIcon(viewer.storyMedia.category)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          onClick={() =>
                            setLightboxMedia({
                              title: viewer.storyMedia.title,
                              category: viewer.storyMedia.category,
                              mediaUrl: viewer.storyMedia.thumbnailUrl,
                              exactDate: viewer.storyMedia.exactDate,
                              exactTime: viewer.storyMedia.exactTime,
                              viewsCount: viewer.storyMedia.viewsCountWeek,
                              contactName: viewer.name,
                            })
                          }
                          className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-blue-400"
                        >
                          {viewer.storyMedia.title}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                            {getCategoryIcon(viewer.storyMedia.category)}
                            <span>{viewer.storyMedia.category}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{viewer.storyMedia.exactTime}</span>
                            <span>•</span>
                            <span>{viewer.storyMedia.exactDate}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detalhe Comercial / Faturado ou Negociação */}
                    <div className="mt-2 text-xs flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {viewer.intentLabel && viewer.crmStatus !== "internal_team" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Flame className="w-2.5 h-2.5 shrink-0" />
                            <span>{viewer.intentLabel}</span>
                          </span>
                        )}
                        {viewer.totalPurchased > 0 ? (
                          <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Faturado: {formatCurrency(viewer.totalPurchased)}</span>
                          </span>
                        ) : viewer.dealTitle ? (
                          <span className="text-[11px] text-amber-400 font-semibold truncate flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{viewer.dealValue ? `${formatCurrency(viewer.dealValue)} • ` : ""}{viewer.dealTitle}</span>
                          </span>
                        ) : null}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedViewerForDetails(viewer);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-[10.5px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 cursor-pointer ml-auto"
                      >
                        <span>Ver Análise IA</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Ações Mobile */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAiModal(viewer)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Abordar IA</span>
                      </button>

                      {viewer.crmStatus !== "internal_team" && !viewer.dealId && (
                        <button
                          onClick={() => handleConvertViewerToDeal(viewer)}
                          disabled={convertingViewerId === viewer.id}
                          className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {convertingViewerId === viewer.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>Negócio</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const cleanPhone = (viewer.phone || "").replace(/\D/g, "");
                          window.open(`https://wa.me/${cleanPhone}`, "_blank");
                        }}
                        className="flex items-center justify-center p-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 font-semibold text-xs transition-colors cursor-pointer"
                        title="Abrir WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. MODAL DE ABORDAGEM CASUAL GERADA POR OPENAI REAL + DISPARO DIRETO    */}
      {/* ======================================================================= */}
      {isAiModalOpen && selectedViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Abordagem Comercial Contextual (OpenAI + Histórico WhatsApp)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formulada com base no histórico real de conversas de {selectedViewer.name} sem mencionar visualização de status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Modal */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Contexto do Visualizador */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Produtor / Contato:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedViewer.name}</span>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {selectedViewer.phoneFormatted || `+${selectedViewer.phone}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Post Visualizado:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{selectedViewer.storyMedia.title}</span>
                  <span className="text-[11px] text-blue-500 block">
                    {selectedViewer.storyMedia.exactDate} às {selectedViewer.storyMedia.exactTime}
                  </span>
                </div>
              </div>

              {/* Estado de Carregamento da IA */}
              {isGeneratingAi && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <div className="text-xs font-semibold">
                    Analisando histórico real de WhatsApp, Funil CRM e invocando OpenAI...
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-sm text-center">
                    Criando gancho consultivo personalizado com base nas últimas mensagens trocadas com este cliente.
                  </div>
                </div>
              )}

              {/* Mensagem Editável e Raciocínio Estratégico */}
              {!isGeneratingAi && generatedApproach && (
                <div className="space-y-4">
                  {/* Mensagem Editável para Disparo Direto */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Mensagem Pronta para Disparo (Editável):</span>
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tom Consultivo & Contextual
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={generatedApproach.casualMessage}
                      onChange={(e) =>
                        setGeneratedApproach((prev) =>
                          prev ? { ...prev, casualMessage: e.target.value } : prev
                        )
                      }
                      className="w-full p-3.5 rounded-xl bg-slate-100 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Opção de Criar Oportunidade no CRM automaticamente no disparo */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreateDealOnSend}
                      onChange={(e) => setAutoCreateDealOnSend(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-amber-500 block">
                        Abrir / Reaquecer Oportunidade no Funil CRM automaticamente
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ao disparar a mensagem, o sistema registra o negócio no Funil Comercial vinculado a este Story.
                      </span>
                    </div>
                  </label>

                  {/* Raciocínio Estratégico */}
                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-blue-500 block">Diagnóstico & Contexto Identificado pela IA:</span>
                    <p className="text-[11px] leading-relaxed">{generatedApproach.strategicReasoning}</p>
                  </div>

                  {/* Sugestões de Momento e Produto */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Momento Ideal de Envio:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {generatedApproach.suggestedTiming}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Produto em Pauta:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] line-clamp-1">
                        {generatedApproach.suggestedProduct}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/30">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
              {generatedApproach && (
                <>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMessage ? "Copiado!" : "Copiar"}</span>
                  </button>
                  <button
                    onClick={handleOpenWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>WhatsApp Web</span>
                  </button>
                  <button
                    onClick={handleSendDirectApproach}
                    disabled={isSendingDirectApproach}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingDirectApproach ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Disparar Agora pelo Sistema</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 6. MODAL DE TESTE DE RECONHECIMENTO MANUAL                             */}
      {/* ======================================================================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Testar Reconhecimento de Visualização
                </h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTestSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simule a abertura de um status do WhatsApp conectado para auditar o registro exato de data, horário e título do post.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone do Contato (WhatsApp):
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Ex: 5511983354725 ou selecione da base"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Produtor / Cliente (Opcional):
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Ex: Oliver Fontana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título / Legenda do Post Visualizado:
                </label>
                <input
                  type="text"
                  value={testPostTitle}
                  onChange={(e) => setTestPostTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria Técnica:
                </label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="Maquinários">Maquinários & Implementos</option>
                  <option value="Insumos">Insumos & Defensivos</option>
                  <option value="Cotações">Cotações de Safra & Grãos</option>
                  <option value="Peças & Serviços">Peças & Serviços</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTest}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  <span>Registrar Visualização</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 7. MODAL LIGHTBOX DE FOTO DO STORY (DIMENSÃO 9:16 REAL DE STORY)       */}
      {/* ======================================================================= */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          {/* Botão de Fechar Externo */}
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50 backdrop-blur-md border border-white/10 shadow-lg"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Story Container em Proporção Vertical 9:16 Exata */}
          <div className="relative h-[88vh] max-h-[850px] w-auto aspect-[9/16] max-w-[95vw] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-black flex flex-col select-none">
            {/* Barra superior de status do Story (estilo WhatsApp) */}
            <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5 z-20 pointer-events-none">
              <div className="h-1 flex-1 bg-white/40 rounded-full overflow-hidden shadow-sm">
                <div className="h-full bg-white w-full"></div>
              </div>
            </div>

            {/* Header do Story: Autor, Data, Horário e Botão Fechar */}
            <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-2.5 rounded-2xl backdrop-blur-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/40 shrink-0">
                  <Radio className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block drop-shadow truncate">
                    {lightboxMedia.contactName ? lightboxMedia.contactName : "Status Comercial WhatsApp"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                    {lightboxMedia.exactDate && <span>{lightboxMedia.exactDate}</span>}
                    {lightboxMedia.exactTime && <span className="font-mono">às {lightboxMedia.exactTime}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLightboxMedia(null)}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mídia do Story em Dimensão 9:16 Real com preenchimento fiel e sem distorção */}
            <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
              {lightboxMedia.mediaUrl ? (
                <>
                  <img
                    src={lightboxMedia.mediaUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                  />
                  <img
                    src={lightboxMedia.mediaUrl}
                    alt={lightboxMedia.title}
                    className="relative z-10 w-full h-full object-contain"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-400 p-8 text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-300">
                    {getCategoryIcon(lightboxMedia.category)}
                  </div>
                  <span className="text-xs font-medium text-slate-300">
                    {lightboxMedia.category}
                  </span>
                  <span className="text-[10px] text-slate-500">Mídia em formato 9:16</span>
                </div>
              )}
            </div>

            {/* Overlay Inferior estilo WhatsApp Story com Categoria, Visualizações e Título */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-12 text-white z-20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                  {getCategoryIcon(lightboxMedia.category)}
                  <span>{lightboxMedia.category}</span>
                </span>
                {lightboxMedia.viewsCount !== undefined && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 drop-shadow">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{lightboxMedia.viewsCount} visualizações</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-medium leading-relaxed drop-shadow line-clamp-3">
                {lightboxMedia.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 8. MODAL DE TUTORIAL INTERATIVO PARA GESTORES                          */}
      {/* ======================================================================= */}
      {isTutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Guia Rápido: Radar de Stories & Status
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aprenda a transformar visualizadores silenciosos em vendas reais do Agronegócio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTutorialOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
              {[
                { step: 1, title: "1. Postagem", icon: <Upload className="w-3.5 h-3.5" /> },
                { step: 2, title: "2. Captura", icon: <Radio className="w-3.5 h-3.5" /> },
                { step: 3, title: "3. Cruzamento", icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { step: 4, title: "4. Abordagem", icon: <Sparkles className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => setTutorialStep(item.step)}
                  className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                    tutorialStep === item.step
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.title}</span>
                </button>
              ))}
            </div>

            {/* Step Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {tutorialStep === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Passo 1: Postagem Estratégica</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Você pode postar status diretamente pelo aplicativo WhatsApp do seu celular corporativo ou utilizar o botão <strong>Publicar Story</strong> no topo desta página.
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Segmentação por Categoria:</strong> Ao publicar fotos de maquinários, insumos ou cotações de grãos, o sistema categoriza automaticamente o interesse técnico.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Zero Sobrecarga:</strong> O sistema não armazena fotos pesadas no banco de dados. Os arquivos são transmitidos em streaming para o WhatsApp.</span>
                    </li>
                  </ul>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Passo 2: Captura Silenciosa e 100% Auditável</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Quando um produtor ou cliente abre o Story no WhatsApp, os webhooks do sistema registram silenciosamente a interação.
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Data, Minuto e Segundo:</strong> Registro com fuso de Brasília do momento exato em que o contato visualizou.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Totalmente Invisível:</strong> O cliente não sabe que o sistema está registrando. Para ele, foi uma visualização comum de WhatsApp.</span>
                    </li>
                  </ul>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Passo 3: Cruzamento Instantâneo com o CRM</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      O número do WhatsApp é imediatamente cruzado com a base de dados comercial do tenant (6.647 contatos reais).
                    </p>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Identificação da Posição no Funil:</strong> O sistema aponta se o contato é Cliente Ativo, Oportunidade em Espera ou Cotação em Aberto.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Histórico de Faturamento:</strong> Exibe quanto o produtor já comprou na carteira e qual vendedor é o responsável pela conta.</span>
                    </li>
                  </ul>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Passo 4: Abordagem Comercial com IA (Regra de Ouro)</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Ao clicar no botão <strong>Abordagem IA</strong>, a inteligência artificial gera uma mensagem casual para WhatsApp.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    <span className="font-bold block">Regra Crítica para Vendedores:</span>
                    <p className="text-[11px] leading-relaxed">
                      <strong>NUNCA</strong> inicie a conversa dizendo "Vi que você visualizou meu status". A IA cria um pretexto natural e sutil de coincidência (ex: novidade técnica do produto, cotação do dia ou oportunidade de safra).
                    </p>
                  </div>
                </div>
              )}

              {/* Box de Ação Interativa de Teste */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <PlayCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Deseja testar o rastreamento em tempo real com seu número?</span>
                </div>
                <button
                  onClick={() => {
                    setIsTutorialOpen(false);
                    setIsTestModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Testar Reconhecimento Agora
                </button>
              </div>
            </div>

            {/* Footer do Tutorial */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
              <button
                disabled={tutorialStep === 1}
                onClick={() => setTutorialStep((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                Voltar
              </button>
              {tutorialStep < 4 ? (
                <button
                  onClick={() => setTutorialStep((prev) => Math.min(prev + 1, 4))}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Próximo Passo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsTutorialOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Entendi Tudo! Fechar Guia
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 9. MODAL DE PUBLICAR / AGENDAR STORY (SEM BLOBS NO POSTGRESQL)          */}
      {/* ======================================================================= */}
      {/* ======================================================================= */}
      {/* 9. MODAL DE PUBLICAR / AGENDAR STORY (ESTÚDIO EM 2 COLUNAS 9:16)        */}
      {/* ======================================================================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#070D1B]/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500 shadow-sm">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Publicar Story no WhatsApp Corporativo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transmita novidades diretamente aos clientes e monitore quem visualizou em tempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishStory} className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* COLUNA ESQUERDA: Prévia no Celular em Dimensão 9:16 Real de Story */}
                <div className="md:col-span-5 flex flex-col items-center gap-3">
                  <div className="flex items-center justify-between w-full px-1 max-w-[290px]">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                      Dimensão do Story (9:16)
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      1080×1920
                    </span>
                  </div>

                  {/* Mockup do Smartphone com proporção exata 9:16 da tela */}
                  <div className="relative w-[270px] sm:w-[290px] p-2.5 bg-slate-950 rounded-[2.8rem] border-[3px] border-slate-700/80 shadow-2xl flex flex-col select-none group">
                    {/* Dynamic Island / Notch discreto no topo */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-full z-30 pointer-events-none flex items-center justify-center gap-1.5 border border-slate-800/80">
                      <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80"></div>
                    </div>

                    {/* Área de Tela do Celular em Proporção 9:16 Exata (1080x1920) */}
                    <div className="relative w-full aspect-[9/16] rounded-[2.2rem] overflow-hidden bg-slate-900 flex flex-col justify-between shadow-inner">
                      {/* Barra superior de status do Story */}
                      <div className="absolute top-0 inset-x-0 p-3 pt-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 flex flex-col gap-1.5 pointer-events-none">
                        <div className="w-full h-0.5 bg-white/40 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-white rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/40 shadow-sm">
                              V
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold leading-none drop-shadow">Verto Agrícola</span>
                              <span className="text-[9px] text-white/80 leading-tight">Agora</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mídia do Story */}
                      {publishImagePreview ? (
                        <>
                          <img
                            src={publishImagePreview}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
                          />
                          <img
                            src={publishImagePreview}
                            alt="Preview do Story"
                            className="relative z-10 w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPublishImageBase64("");
                              setPublishImagePreview("");
                            }}
                            className="absolute top-12 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors z-30 cursor-pointer shadow-lg"
                            title="Remover foto"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center cursor-pointer hover:bg-slate-800/60 transition-colors">
                          <div className="w-14 h-20 rounded-xl border-2 border-dashed border-blue-500/50 bg-blue-500/10 text-blue-400 flex flex-col items-center justify-center gap-1 shadow-inner">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] font-bold">9:16</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-200">
                            Clique para escolher a imagem
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Dimensão Vertical 9:16 (1080×1920)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Legenda digitada refletida em tempo real sobre o Story (estilo WhatsApp) */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3.5 pt-10 z-20 pointer-events-none">
                        {publishTitle.trim() ? (
                          <p className="text-xs text-white font-medium line-clamp-4 leading-snug drop-shadow-md break-words">
                            {publishTitle}
                          </p>
                        ) : (
                          <p className="text-[11px] text-white/50 italic line-clamp-2 leading-tight">
                            Sua legenda aparecerá aqui em tempo real...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botão de substituição abaixo da prévia */}
                  {publishImagePreview && (
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-500 hover:border-blue-500 text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>Substituir imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* COLUNA DIREITA: Formulário e Parâmetros */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  {/* Alerta de Transmissão Direta */}
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>Transmissão Direta:</strong> A imagem é enviada com alta fidelidade para o canal corporativo do WhatsApp (status@broadcast) sem salvar dados pesados no PostgreSQL.
                    </span>
                  </div>

                  {/* Upload seletor se ainda não houver imagem */}
                  {!publishImagePreview && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        1. Imagem do Story (Dimensão 9:16):
                      </label>
                      <label className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-blue-500/30 hover:border-blue-500/70 bg-blue-50/20 dark:bg-blue-950/20 cursor-pointer transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Escolher arquivo do computador
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            JPG, PNG ou WebP vertical (até 8MB)
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Título / Legenda do Story */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Título / Legenda do Story (Texto no WhatsApp):
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {publishTitle.length} caracteres
                      </span>
                    </div>
                    <textarea
                      value={publishTitle}
                      onChange={(e) => setPublishTitle(e.target.value)}
                      placeholder="Ex: Chegaram novas colheitadeiras 2026 com condições especiais de safra e entrega imediata!"
                      required
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1B] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 leading-relaxed transition-all resize-none font-medium"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Este texto será exibido como legenda da foto no status do WhatsApp e atualiza a prévia ao lado em tempo real.
                    </p>
                  </div>

                  {/* Categoria Técnica */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Categoria Técnica do Equipamento / Tema:
                    </label>
                    <select
                      value={publishCategory}
                      onChange={(e) => setPublishCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1B] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="Maquinários">Maquinários & Implementos</option>
                      <option value="Insumos">Insumos & Defensivos</option>
                      <option value="Cotações">Cotações de Safra & Grãos</option>
                      <option value="Peças & Serviços">Peças & Serviços</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

                  {/* Momento do Disparo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Momento do Disparo:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPublishMode("now")}
                        className={`py-2.5 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          publishMode === "now"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Postar Imediatamente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishMode("schedule")}
                        className={`py-2.5 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          publishMode === "schedule"
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Agendar Horário</span>
                      </button>
                    </div>

                    {publishMode === "schedule" && (
                      <div className="pt-2 animate-in fade-in duration-150">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Data e Horário para Publicação Automática:
                        </label>
                        <input
                          type="datetime-local"
                          value={publishScheduleDate}
                          onChange={(e) => setPublishScheduleDate(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Fixo do Modal */}
            <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#070D1B]/50 shrink-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Canal: WhatsApp Corporativo Verto</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePublishStory}
                  disabled={isPublishing || !publishImageBase64}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : publishMode === "schedule" ? (
                    <Calendar className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{publishMode === "schedule" ? "Confirmar Agendamento" : "Publicar no WhatsApp"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 10. MODAL DE ALTERAÇÃO / ATUALIZAÇÃO DA FOTO DO STORY                   */}
      {/* ======================================================================= */}
      {isPhotoModalOpen && selectedPostForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Alterar Foto do Story Ativo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defina a foto real exibida no WhatsApp corporativo para este post.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Post: <strong className="text-slate-800 dark:text-slate-200">{selectedPostForPhoto.title}</strong>
              </div>

              {/* Pré-visualização da Foto na Dimensão Vertical de Story (9:16) */}
              <div className="relative w-[260px] sm:w-[280px] aspect-[9/16] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-slate-700/80 shadow-2xl flex items-center justify-center">
                {/* Barra superior de status do Story */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex gap-1 z-20 pointer-events-none">
                  <div className="h-0.5 flex-1 bg-white/70 rounded-full shadow-sm"></div>
                </div>

                {newPhotoBase64 ? (
                  <>
                    <img
                      src={newPhotoBase64}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
                    />
                    <img
                      src={newPhotoBase64}
                      alt="Preview"
                      className="relative z-10 w-full h-full object-contain"
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center z-10">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                    <span className="text-xs text-slate-300 font-medium">Nenhuma foto selecionada</span>
                    <span className="text-[10px] text-slate-500 font-bold">Dimensão Vertical 9:16 (1080×1920)</span>
                  </div>
                )}
              </div>

              {/* Upload de arquivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecionar Imagem do Computador:
                </label>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Escolher arquivo JPG, PNG ou WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Ou colar URL / Base64 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ou Cole a URL da Imagem:
                </label>
                <input
                  type="text"
                  value={newPhotoBase64.startsWith("data:") ? "" : newPhotoBase64}
                  onChange={(e) => setNewPhotoBase64(e.target.value)}
                  placeholder="https://exemplo.com/foto-story.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={isSavingPhoto || !newPhotoBase64}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Salvar Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 11. MODAL DE AJUSTE DE HORÁRIO DE POSTAGEM DO STORY                     */}
      {/* ======================================================================= */}
      {isTimeModalOpen && selectedPostForTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-600/30 flex items-center justify-center text-emerald-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ajustar Horário do Story
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Horário oficial de Brasília (BRT)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTimeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Post: <strong className="text-slate-800 dark:text-slate-200">{selectedPostForTime.title}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Horário Exato da Postagem:
                </label>
                <input
                  type="time"
                  value={newPostingTime}
                  onChange={(e) => setNewPostingTime(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 text-center"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  Ex: 09:25 para representar a publicação realizada pela manhã.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsTimeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTime}
                disabled={isSavingTime || !newPostingTime}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingTime ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Salvar Horário</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 12. MODAL DE CRIAÇÃO DE CAMPANHA DE TRÁFEGO PAGO / META ADS             */}
      {/* ======================================================================= */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-500">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Campanha de Tráfego Pago / Remarketing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ative anúncios hiper-segmentados para produtores que viram seus Stories.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">
                    {selectedViewerIds.size > 0
                      ? `${selectedViewerIds.size} contato(s) selecionado(s)`
                      : `Todos os ${filteredViewers.length} contatos filtrados`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleExportMetaAudience("sha256")}
                    disabled={isExportingMeta}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Meta Ads (SHA-256)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportMetaAudience("plain")}
                    disabled={isExportingMeta}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Planilha CSV</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Campanha:
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  placeholder="Ex: Remarketing Safra 26/27 - Visualizadores de Maquinários"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Objetivo / Plataforma de Destino:
                </label>
                <select
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="whatsapp_mass_broadcast">Disparo Consultivo Direcionado no WhatsApp (Fila Anti-Ban 45s)</option>
                  <option value="meta_ads_custom_audience">Meta Ads (Instagram & Facebook) - Público Personalizado (SHA-256)</option>
                  <option value="meta_ads_lookalike">Meta Ads - Público Semelhante (Lookalike 1%)</option>
                  <option value="google_customer_match">Google Ads - Segmentação por Lista de Clientes</option>
                </select>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Criptografia SHA-256 Meta Ads & Disparo Anti-Ban:
                </span>
                <p>
                  No modo <strong>Meta Ads (SHA-256)</strong>, todos os dados (email, telefone E.164, nome, cidade, UF) são criptografados com hash hexadecimal SHA-256 de 64 caracteres + coluna de valor (LTV). No modo <strong>Disparo WhatsApp</strong>, as abordagens são agendadas na fila com intervalo Anti-Ban de 45s.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingCampaign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                  <span>Executar Campanha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 13. MODAL DE EDIÇÃO RÁPIDA DE TELEFONE DO CONTATO                      */}
      {/* ======================================================================= */}
      {isEditPhoneModalOpen && selectedViewerForPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Editar Telefone do Contato
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedViewerForPhone.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPhoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Número de Celular com DDD:
                </label>
                <input
                  type="text"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  placeholder="Ex: 5551999842499 ou 51999842499"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  O sistema formata automaticamente como (XX) 9XXXX-XXXX para a equipe comercial.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsEditPhoneModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={isSavingPhone}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Salvar Telefone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 14. MODAL DE DETALHES COMPLETOS DA ANÁLISE IA & NEGÓCIO                */}
      {/* ======================================================================= */}
      {isDetailsModalOpen && selectedViewerForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Análise Comercial & Inteligência de Engajamento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedViewerForDetails.name} • {selectedViewerForDetails.companyOrFarm}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Card Resumo do Contato */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contato / Produtor:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedViewerForDetails.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 block mt-0.5">{selectedViewerForDetails.companyOrFarm}</span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    {selectedViewerForDetails.city} - {selectedViewerForDetails.state}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {selectedViewerForDetails.phoneFormatted || `+${selectedViewerForDetails.phone}`}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 block mt-1">
                    Vendedor Responsável: <strong>{selectedViewerForDetails.assignedSeller}</strong>
                  </span>
                </div>
              </div>

              {/* Status no CRM & Dados Comerciais */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Classificação Comercial no CRM:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      selectedViewerForDetails.crmStatus === "active_client"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        : selectedViewerForDetails.crmStatus === "open_deal"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                        : selectedViewerForDetails.crmStatus === "internal_team"
                        ? "bg-slate-500/15 text-slate-300 border-slate-500/30"
                        : selectedViewerForDetails.crmStatus === "inactive_client"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/25"
                    }`}
                  >
                    {selectedViewerForDetails.crmStatus === "active_client" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : selectedViewerForDetails.crmStatus === "open_deal" ? (
                      <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : selectedViewerForDetails.crmStatus === "internal_team" ? (
                      <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : selectedViewerForDetails.crmStatus === "inactive_client" ? (
                      <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                    )}
                    <span>{selectedViewerForDetails.crmStatusLabel}</span>
                  </span>
                </div>

                {/* Negociação em Aberto */}
                {selectedViewerForDetails.dealTitle && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
                    <span className="text-[10px] font-bold text-amber-500 uppercase block">Oportunidade / Cotação no CRM:</span>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedViewerForDetails.dealTitle}</div>
                    {selectedViewerForDetails.dealValue ? (
                      <div className="font-mono font-bold text-amber-500 mt-0.5">
                        Valor Proposto: {formatCurrency(selectedViewerForDetails.dealValue)}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Faturamento Confirmado */}
                {selectedViewerForDetails.totalPurchased > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase block">Histórico de Compras:</span>
                      <span className="text-slate-600 dark:text-slate-300">Cliente fidelizado na base</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(selectedViewerForDetails.totalPurchased)}
                    </span>
                  </div>
                )}

                {/* Aviso para Equipe Interna */}
                {selectedViewerForDetails.crmStatus === "internal_team" && (
                  <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20 text-xs text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Perfil Interno / Verto Agrícola</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Este contato pertence ao ecossistema interno da Verto (colaborador, filial ou sócio). Ações comerciais de vendas ou remarketing são desnecessárias para este perfil.
                    </p>
                  </div>
                )}
              </div>

              {/* Story Visualizado */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Post Visualizado:</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedViewerForDetails.storyMedia.title}</div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{selectedViewerForDetails.storyMedia.exactDate}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    <span>{selectedViewerForDetails.storyMedia.exactTime} (Brasília)</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedViewerForDetails.storyMedia.category}
                  </span>
                </div>
              </div>

              {/* Histórico Completo da Conversa Real no Sistema */}
              {selectedViewerForDetails.chatMessages && selectedViewerForDetails.chatMessages.length > 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span>Conversas Geradas no Sistema ({selectedViewerForDetails.chatMessages.length} mensagens recentes):</span>
                    </span>
                    <a
                      href="/whatsapp"
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>Abrir no Inbox</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {selectedViewerForDetails.chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                          msg.direction === "INBOUND"
                            ? "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mr-6"
                            : "bg-blue-600/10 border-blue-500/25 text-blue-900 dark:text-blue-200 ml-6"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9.5px] font-bold mb-0.5 opacity-75">
                          <span>{msg.direction === "INBOUND" ? selectedViewerForDetails.name : "Equipe Verto (Sistema)"}</span>
                          <span className="font-mono">{msg.formattedDate}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedViewerForDetails.lastChatMessage ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-500" />
                      <span>Última Mensagem Real no Inbox WhatsApp:</span>
                    </span>
                    {selectedViewerForDetails.lastChatDate && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedViewerForDetails.lastChatDate}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 italic">
                    &ldquo;{selectedViewerForDetails.lastChatMessage}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Nenhuma conversa prévia registrada no Inbox do sistema para este número.</span>
                </div>
              )}

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="flex items-center justify-between text-blue-500 font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Análise Estratégica da IA:</span>
                  </div>
                  {selectedViewerForDetails.intentLabel && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {selectedViewerForDetails.intentLabel} ({selectedViewerForDetails.intentScore ?? 65}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedViewerForDetails.aiInsight || "Contato monitorado pelo Radar de Stories com registro ativo de visualização."}
                </p>
              </div>
            </div>

            {/* Rodapé / Ações */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedViewerForDetails.crmStatus !== "internal_team" && selectedViewerForDetails.crmStatus !== "non_commercial" && (
                  <>
                    {!selectedViewerForDetails.dealId && (
                      <button
                        type="button"
                        onClick={() => {
                          handleConvertViewerToDeal(selectedViewerForDetails);
                          setIsDetailsModalOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar Negócio no CRM</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleOpenAiModal(selectedViewerForDetails);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Gerar & Disparar Abordagem IA</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
