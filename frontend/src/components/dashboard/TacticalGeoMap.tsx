"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  Compass,
  Maximize2,
  Minimize2,
  Layers,
  Radio,
  RotateCcw,
  Search,
  MapPin,
  X,
  ArrowUpRight,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Eye,
  ArrowLeft,
  Phone,
  Shield,
  MessageSquare,
  Loader2,
  CheckCheck,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

export interface GeoCityDeal {
  id: string;
  title: string;
  clientName: string;
  contactId?: string | null;
  conversationId?: string | null;
  contactPhone?: string | null;
  value: number;
  status: string;
  statusCategory?: "won" | "in_attendance" | "lost";
  stageLabel: string;
  source: string;
  sellerName: string;
  sellerId?: string | null;
  updatedAt: string;
  isLive?: boolean;
}

export interface GeoCityPoint {
  id: string;
  cityName: string;
  state: string;
  region: "Sul" | "Sudeste" | "Centro-Oeste" | "Nordeste" | "Norte" | "Paraguai";
  lat: number;
  lng: number;
  status: "closed" | "in_attendance" | "lost" | "unexplored";
  salesCount: number;
  salesVolume: number;
  inAttendanceCount: number;
  lostCount: number;
  lostVolume: number;
  totalDeals: number;
  isLiveNow: boolean;
  assignedSellers: string[];
  trafficSource: {
    paid: number;
    organic: number;
  };
  recentDeals: GeoCityDeal[];
}

export interface GeoMapResponse {
  summary: {
    totalSalesCount: number;
    totalRevenue: number;
    totalInAttendance: number;
    totalLostCount: number;
    totalLostVolume: number;
    totalCitiesMapped: number;
    closedCitiesCount: number;
    inAttendanceCitiesCount: number;
    lostCitiesCount: number;
    unexploredCitiesCount: number;
    dominancePercentage: number;
    inAttendancePercentage: number;
    lostPercentage: number;
    unexploredPercentage: number;
    activeLiveAttendances: number;
    conversionRate: number;
    topRegion: string;
    tenantName?: string;
    tenantNiche?: string;
  };
  regions: Array<{
    name: string;
    salesCount: number;
    salesVolume: number;
    inAttendanceCount: number;
    percentage: number;
    assignedSellers: string[];
  }>;
  sellers: Array<{
    id: string;
    name: string;
    region: string;
    salesCount: number;
    salesVolume: number;
    activeDeals: number;
  }>;
  points: GeoCityPoint[];
}

interface TacticalGeoMapProps {
  onViewChange?: (view: "map" | "welcome" | "metrics") => void;
  currentView?: string;
}

// Estilo Base Híbrido Padrão VERSUS / API Leads:
// Unifica ESRI Dark Gray, ESRI Light Gray (Clean) e ESRI World Imagery (Satélite)
// permitindo troca instantânea de camada via map.setLayoutProperty sem recarregar o WebGL
const UNIFIED_ESRI_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "esri-dark-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: "© Esri, HERE, Garmin"
    },
    "esri-dark-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 16
    },
    "esri-light-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: "© Esri, HERE, Garmin"
    },
    "esri-light-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 16
    },
    "esri-satellite-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri, Maxar, Earthstar Geographics"
    },
    "esri-satellite-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "esri-dark-base-layer",
      type: "raster",
      source: "esri-dark-base",
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: "visible" }
    },
    {
      id: "esri-light-base-layer",
      type: "raster",
      source: "esri-light-base",
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: "none" }
    },
    {
      id: "esri-satellite-base-layer",
      type: "raster",
      source: "esri-satellite-base",
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: "none" }
    },
    {
      id: "esri-dark-labels-layer",
      type: "raster",
      source: "esri-dark-labels",
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: "visible" }
    },
    {
      id: "esri-light-labels-layer",
      type: "raster",
      source: "esri-light-labels",
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: "none" }
    },
    {
      id: "esri-satellite-labels-layer",
      type: "raster",
      source: "esri-satellite-labels",
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: "none" }
    }
  ]
};

const BRAZIL_CENTER: [number, number] = [-51.9253, -14.235];
const BRAZIL_DEFAULT_ZOOM = 4.2;

export default function TacticalGeoMap({ onViewChange, currentView = "map" }: TacticalGeoMapProps) {
  const router = useRouter();
  const { theme, isClean, isWhatsApp, isDark } = useTheme();

  const mapStageRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const controlsScrollRef = useRef<HTMLDivElement>(null);

  // Dados do Servidor
  const [geoData, setGeoData] = useState<GeoMapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modo de Camada: Vetor Tático vs Satélite HD
  const [mapMode, setMapMode] = useState<"vector" | "satellite">("vector");

  // Posição Móvel / Arrastável da Legenda Espacial (Como solicitado pelo usuário)
  const [legendPosition, setLegendPosition] = useState<{ x: number; y: number }>({ x: 14, y: 14 });
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 14,
    initY: 14
  });

  const handleLegendDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDraggingLegend(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: legendPosition.x,
      initY: legendPosition.y
    };
  };

  useEffect(() => {
    if (!isDraggingLegend) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      
      const stageRect = mapStageRef.current?.getBoundingClientRect();
      const maxX = stageRect ? stageRect.width - 270 : window.innerWidth - 300;
      const maxY = stageRect ? stageRect.height - 80 : window.innerHeight - 100;
      
      const newX = Math.max(8, Math.min(maxX, dragStartRef.current.initX + dx));
      const newY = Math.max(8, Math.min(maxY, dragStartRef.current.initY + dy));
      
      setLegendPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingLegend(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLegend]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Estados da Legenda Flutuante Oficial (Status aberto por padrão, demais retráteis)
  const [isLegendMinimized, setIsLegendMinimized] = useState<boolean>(false);
  const [expandedAccordions, setExpandedAccordions] = useState({
    status: true,
    traffic: false,
    sectors: false
  });

  // Filtros Estratégicos
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedSeller, setSelectedSeller] = useState<string>("all");
  const [selectedTraffic, setSelectedTraffic] = useState<"all" | "paid" | "organic">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Polo / Cidade Selecionado para a Gaveta Lateral
  const [selectedPoint, setSelectedPoint] = useState<GeoCityPoint | null>(null);

  // Malhas Geográficas Reais dos Municípios (IBGE) e Contorno dos Estados Brasileiros
  const [municipalitiesGeoJson, setMunicipalitiesGeoJson] = useState<any>(null);
  const [brStatesGeoJson, setBrStatesGeoJson] = useState<any>(null);

  // Opção de Marcar / Desmarcar Polígonos de Delimitação Territorial
  const [showTerritoryZones, setShowTerritoryZones] = useState<boolean>(true);

  // Modal do Relatório Estratégico com IA (Comercial Verto)
  const [isAiReportOpen, setIsAiReportOpen] = useState<boolean>(false);
  const [aiReportData, setAiReportData] = useState<any>(null);
  const [loadingAiReport, setLoadingAiReport] = useState<boolean>(false);

  // Filtro de Negócios dentro do Modal da Cidade (Todos, Vendas, Em Atendimento, Perdidos)
  const [dealModalFilter, setDealModalFilter] = useState<"all" | "won" | "in_attendance" | "lost">("all");
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Buscar Análise Estratégica da IA da Comercial Verto
  const fetchAiReport = async () => {
    setIsAiReportOpen(true);
    if (aiReportData) return;
    try {
      setLoadingAiReport(true);
      const res = await api.get("/metrics/geo-map/ai-strategy");
      setAiReportData(res.data);
    } catch (err) {
      console.error("Erro ao carregar relatório estratégico de IA:", err);
    } finally {
      setLoadingAiReport(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Espiar Atendimento do Vendedor Ao Vivo (Sala de Guerra Geotática)
  const [spyingDeal, setSpyingDeal] = useState<GeoCityDeal | null>(null);
  const [spyMessages, setSpyMessages] = useState<any[]>([]);
  const [loadingSpyMessages, setLoadingSpyMessages] = useState<boolean>(false);

  const handleSpyDeal = async (deal: GeoCityDeal) => {
    setSpyingDeal(deal);
    setLoadingSpyMessages(true);
    try {
      let messages: any[] = [];
      if (deal.conversationId) {
        const res = await api.get(`/conversations/${deal.conversationId}/messages`);
        messages = Array.isArray(res.data) ? res.data : [];
      } else if (deal.contactId) {
        const res = await api.get(`/conversations/contact/${deal.contactId}`);
        messages = Array.isArray(res.data?.messages) ? res.data.messages : [];
      }
      setSpyMessages(messages);
    } catch (err) {
      console.warn("Nenhuma mensagem encontrada para o atendimento selecionado:", err);
      setSpyMessages([]);
    } finally {
      setLoadingSpyMessages(false);
    }
  };

  const toggleAccordion = (key: "status" | "traffic" | "sectors") => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Scroll Horizontal Inteligente da Barra de Ferramentas
  const scrollControls = (direction: "left" | "right") => {
    if (controlsScrollRef.current) {
      controlsScrollRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth"
      });
    }
  };

  // Carregar Dados da API Vallor
  const fetchGeoData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/metrics/geo-map");
      setGeoData(res.data);
    } catch (err) {
      console.error("Erro ao carregar dados geográficos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoData();

    // Carrega a malha oficial dos municípios (IBGE) para demarcação territorial real
    fetch("/geo/ibge-municipalities.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMunicipalitiesGeoJson(data);
      })
      .catch((err) => console.warn("Aviso ao carregar malha municipal:", err));

    // Carrega o contorno dos estados do Brasil para contexto geográfico
    fetch("/geo/br-states.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBrStatesGeoJson(data);
      })
      .catch((err) => console.warn("Aviso ao carregar malha de estados:", err));
  }, []);

  // 1. Inicialização do Mapa MapLibre GL JS
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      setTimeout(() => mapRef.current?.resize(), 100);
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: UNIFIED_ESRI_STYLE,
      center: BRAZIL_CENTER,
      zoom: BRAZIL_DEFAULT_ZOOM,
      minZoom: 3,
      pitch: 0,
      bearing: 0,
      attributionControl: false
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      "bottom-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Alternância Dinâmica das Camadas de Acordo com Tema (Clean/Dark/WhatsApp) e Modo (Satélite/Vetor)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const isSat = mapMode === "satellite";
    const isLight = theme === "light";

    try {
      // Satélite Real HD
      map.setLayoutProperty("esri-satellite-base-layer", "visibility", isSat ? "visible" : "none");
      map.setLayoutProperty("esri-satellite-labels-layer", "visibility", isSat ? "visible" : "none");

      // Vetorial Claro (Tema Clean)
      map.setLayoutProperty("esri-light-base-layer", "visibility", !isSat && isLight ? "visible" : "none");
      map.setLayoutProperty("esri-light-labels-layer", "visibility", !isSat && isLight ? "visible" : "none");

      // Vetorial Escuro (Temas Dark e WhatsApp)
      map.setLayoutProperty("esri-dark-base-layer", "visibility", !isSat && !isLight ? "visible" : "none");
      map.setLayoutProperty("esri-dark-labels-layer", "visibility", !isSat && !isLight ? "visible" : "none");
    } catch (err) {
      console.warn("Camadas ESRI em transição:", err);
    }
  }, [mapMode, theme]);

  // 3. Alternância Instantânea entre Modo Vetorial e Satélite HD
  const toggleBaseMapMode = () => {
    setMapMode((prev) => (prev === "vector" ? "satellite" : "vector"));
  };

  // 4. Centralizar Visão Geral do Brasil (Visão Plana 100% Perpendicular)
  const handleResetCenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: BRAZIL_CENTER,
      zoom: BRAZIL_DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      duration: 1200
    });
  };

  // 6. Modo Tela Cheia Nativo (Fullscreen API do Navegador)
  const toggleFullscreen = () => {
    const container = mapStageRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFull = !!document.fullscreenElement;
      setIsFullscreen(isNowFull);
      if (mapRef.current) {
        mapRef.current.resize();
        setTimeout(() => mapRef.current?.resize(), 60);
        setTimeout(() => mapRef.current?.resize(), 200);
        setTimeout(() => mapRef.current?.resize(), 450);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 7. Filtro de Pontos
  const filteredPoints = useMemo(() => {
    if (!geoData?.points) return [];

    return geoData.points.filter((pt) => {
      if (selectedStatus !== "all" && pt.status !== selectedStatus) return false;
      if (selectedRegion !== "all" && pt.region !== selectedRegion) return false;
      if (selectedSeller !== "all") {
        const matchesSeller = pt.assignedSellers.some((s) =>
          s.toLowerCase().includes(selectedSeller.toLowerCase())
        );
        if (!matchesSeller) return false;
      }
      if (selectedTraffic === "paid" && pt.trafficSource.paid === 0) return false;
      if (selectedTraffic === "organic" && pt.trafficSource.organic === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName =
          pt.cityName.toLowerCase().includes(q) || pt.state.toLowerCase().includes(q);
        if (!matchesName) return false;
      }
      return true;
    });
  }, [geoData, selectedStatus, selectedRegion, selectedSeller, selectedTraffic, searchQuery]);

  // Contagens para os Badges e Percentuais de Dominância Territorial
  const closedCount = useMemo(
    () => geoData?.points.filter((p) => p.status === "closed").length || 0,
    [geoData]
  );
  const inAttendanceCount = useMemo(
    () => geoData?.points.filter((p) => p.status === "in_attendance").length || 0,
    [geoData]
  );
  const lostCount = useMemo(
    () => geoData?.points.filter((p) => p.status === "lost").length || 0,
    [geoData]
  );
  const unexploredCount = useMemo(
    () => geoData?.points.filter((p) => p.status === "unexplored").length || 0,
    [geoData]
  );
  const liveCount = useMemo(
    () => geoData?.points.filter((p) => p.isLiveNow).length || 0,
    [geoData]
  );

  const dominancePercentage = useMemo(() => {
    if (geoData?.summary?.dominancePercentage !== undefined) {
      return geoData.summary.dominancePercentage;
    }
    const total = geoData?.points.length || 0;
    return total > 0 ? Math.round((closedCount / total) * 100) : 0;
  }, [geoData, closedCount]);

  const inAttendancePercentage = useMemo(() => {
    if (geoData?.summary?.inAttendancePercentage !== undefined) {
      return geoData.summary.inAttendancePercentage;
    }
    const total = geoData?.points.length || 0;
    return total > 0 ? Math.round((inAttendanceCount / total) * 100) : 0;
  }, [geoData, inAttendanceCount]);

  const lostPercentage = useMemo(() => {
    if (geoData?.summary?.lostPercentage !== undefined) {
      return geoData.summary.lostPercentage;
    }
    const total = geoData?.points.length || 0;
    return total > 0 ? Math.round((lostCount / total) * 100) : 0;
  }, [geoData, lostCount]);

  const unexploredPercentage = useMemo(() => {
    if (geoData?.summary?.unexploredPercentage !== undefined) {
      return geoData.summary.unexploredPercentage;
    }
    return Math.max(0, 100 - dominancePercentage - inAttendancePercentage - lostPercentage);
  }, [geoData, dominancePercentage, inAttendancePercentage, lostPercentage]);

  // 8. Renderização dos Marcadores Táticos no WebGL (Visualização 100% Sincronizada com CRM Verto)
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const isLightMode = theme === "light";

    filteredPoints.forEach((point) => {
      const el = document.createElement("div");
      el.className =
        "group relative cursor-pointer select-none transition-transform duration-300 hover:scale-125 z-10 hover:z-50";

      let glowColor = "rgba(100, 116, 139, 0.4)";
      let pinColor = isLightMode ? "#64748B" : "#94A3B8"; // Mercado Aberto

      if (point.status === "closed") {
        glowColor = "rgba(16, 185, 129, 0.7)";
        pinColor = "#10B981"; // Negócio Fechado (Verde)
      } else if (point.status === "in_attendance") {
        glowColor = "rgba(234, 179, 8, 0.7)";
        pinColor = "#F59E0B"; // Em Atendimento (Amarelo)
      } else if (point.status === "lost") {
        glowColor = "rgba(239, 68, 68, 0.7)";
        pinColor = "#EF4444"; // Perdido / Repescagem (Vermelho)
      }

      const pinBg = isLightMode ? "#FFFFFF" : "#0B1224";
      const hasDeals = (point.totalDeals || point.recentDeals?.length || 0) > 0;

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${
            point.isLiveNow
              ? `<span class="absolute -top-1 w-8 h-8 rounded-full ${
                  theme === "whatsapp" ? "bg-emerald-400/50" : "bg-cyan-400/40"
                } animate-ping pointer-events-none"></span>`
              : ""
          }
          <!-- Cabeça do Marcador -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-2" 
               style="background-color: ${pinBg}; border-color: ${pinColor}; box-shadow: 0 0 16px ${glowColor}">
            <div class="w-3.5 h-3.5 rounded-full" style="background-color: ${pinColor}"></div>
          </div>
          <!-- Ponta Afunilada -->
          <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] -mt-[1px]"
               style="border-t-color: ${pinColor}"></div>
          
          <!-- Badge Numérico Multistatus (Total & Segmentação CRM) -->
          ${
            hasDeals
              ? `<div class="absolute -top-3 -right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black border shadow-xl ${
                  isLightMode ? "bg-white text-slate-800 border-slate-300" : "bg-[#0B1224] text-white border-slate-700"
                }">
                  ${point.salesCount > 0 ? `<span class="text-emerald-500 font-extrabold flex items-center">●${point.salesCount}</span>` : ""}
                  ${point.inAttendanceCount > 0 ? `<span class="text-amber-500 font-extrabold flex items-center">●${point.inAttendanceCount}</span>` : ""}
                  ${point.lostCount > 0 ? `<span class="text-rose-500 font-extrabold flex items-center">●${point.lostCount}</span>` : ""}
                </div>`
              : ""
          }

          <!-- Micro-Tooltip Hover Tático -->
          <div class="pointer-events-none absolute bottom-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            isLightMode
              ? "bg-white/95 text-slate-800 border-slate-300"
              : "bg-[#0B1224]/95 text-white border-slate-700/80"
          } border rounded-xl px-3 py-1.5 text-xs whitespace-nowrap shadow-2xl backdrop-blur-md flex flex-col items-center">
            <span class="font-extrabold text-[12px]">${point.cityName} - ${point.state}</span>
            ${
              hasDeals
                ? `
                  <div class="flex items-center gap-2 mt-1 text-[10px] font-bold">
                    ${point.salesCount > 0 ? `<span class="text-emerald-400">🟢 ${point.salesCount} vendas</span>` : ""}
                    ${point.inAttendanceCount > 0 ? `<span class="text-amber-400">🟡 ${point.inAttendanceCount} atend.</span>` : ""}
                    ${point.lostCount > 0 ? `<span class="text-rose-400">🔴 ${point.lostCount} perdidos</span>` : ""}
                  </div>
                  <span class="text-[9px] text-slate-300 mt-0.5">
                    Total: <b>${point.totalDeals || point.recentDeals?.length} negociações</b> ${point.salesVolume > 0 ? `• R$ ${(point.salesVolume / 1000).toFixed(0)}k` : ""}
                  </span>
                `
                : `<span class="text-[10px] text-slate-400">Mercado em Aberto (Névoa Agro)</span>`
            }
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPoint(point);
        setSpyingDeal(null);
        setDealModalFilter("all");

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [point.lng, point.lat],
            zoom: 7.5,
            pitch: 0,
            duration: 1200
          });
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });
  }, [filteredPoints, theme]);

  // Função Auxiliar para Criação de Polígonos Georreferenciados de Território (Geometria Circular Suave)
  const createTerritoryCircle = (
    centerLng: number,
    centerLat: number,
    radiusKm: number,
    points: number = 32
  ): [number, number][] => {
    const coords: [number, number][] = [];
    const kmPerLatDegree = 110.574;
    const kmPerLngDegree = 111.320 * Math.cos((centerLat * Math.PI) / 180);

    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const rad = (angle * Math.PI) / 180;
      const dx = radiusKm * Math.sin(rad);
      const dy = radiusKm * Math.cos(rad);

      const pointLng = centerLng + dx / kmPerLngDegree;
      const pointLat = centerLat + dy / kmPerLatDegree;
      coords.push([pointLng, pointLat]);
    }
    coords.push(coords[0]);
    return coords;
  };

  // 9. Cálculo Dinâmico da Delimitação Territorial Municipal Real (IBGE)
  // Verde: Vendas Concluídas (ex: Pelotas/RS e Passo Fundo/RS com perímetro municipal 100% verde)
  // Amarelo: Em Atendimento Ativo (polos em negociação)
  // Vermelho: Negócios Perdidos / Ação de Repescagem
  // Cinza: Mercado em Aberto (Névoa de Guerra / Território a Conquistar)
  const territoryGeoJson = useMemo(() => {
    const normalize = (str: string) =>
      (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const pointByCityState = new Map<string, GeoCityPoint>();
    const matchedPointIds = new Set<string>();

    filteredPoints.forEach((pt) => {
      const key = `${normalize(pt.cityName)}|${pt.state.toUpperCase().trim()}`;
      pointByCityState.set(key, pt);
    });

    const features: any[] = [];

    // Se a malha oficial do IBGE estiver carregada, utilizamos os polígonos reais dos municípios
    if (municipalitiesGeoJson?.features) {
      municipalitiesGeoJson.features.forEach((feat: any) => {
        const featCity = feat.properties?.cityName || "";
        const featState = (feat.properties?.state || "").toUpperCase().trim();
        const key = `${normalize(featCity)}|${featState}`;
        const pt = pointByCityState.get(key);

        let color = "#334155";
        let borderColor = "#475569";
        let opacity = 0.22;
        let status = "unexplored";
        let salesCount = 0;
        let inAttendanceCount = 0;
        let lostCount = 0;
        let id = `ibge-${feat.properties?.ibgeId || featCity}`;

        if (pt) {
          matchedPointIds.add(pt.id);
          id = pt.id;
          status = pt.status;
          salesCount = pt.salesCount || 0;
          inAttendanceCount = pt.inAttendanceCount || 0;
          lostCount = pt.lostCount || 0;

          if (pt.status === "closed") {
            // Território Dominado (Vendas Concluídas - ex: Pelotas/RS com município 100% verde)
            color = "#10B981";
            borderColor = "#047857";
            opacity = 0.58;
          } else if (pt.status === "in_attendance") {
            // Território em Atendimento Ativo
            color = "#F59E0B";
            borderColor = "#B45309";
            opacity = 0.46;
          } else if (pt.status === "lost") {
            // Território com Oportunidades Perdidas
            color = "#EF4444";
            borderColor = "#B91C1C";
            opacity = 0.44;
          } else {
            // Mercado em Aberto
            color = "#475569";
            borderColor = "#64748B";
            opacity = 0.26;
          }
        } else {
          // Se houver um filtro de status ativo (ex: apenas "closed"), oculta os outros
          if (selectedStatus !== "all") {
            return;
          }
          color = "#1E293B";
          borderColor = "#334155";
          opacity = 0.18;
        }

        features.push({
          type: "Feature",
          properties: {
            id,
            cityName: pt ? pt.cityName : featCity,
            state: pt ? pt.state : featState,
            status,
            color,
            borderColor,
            opacity,
            salesCount,
            inAttendanceCount,
            lostCount
          },
          geometry: feat.geometry
        });
      });
    }

    // Para pontos que não tenham correspondência direta no IBGE (ex: Santa Rita PY ou pequenos polos)
    filteredPoints.forEach((pt) => {
      if (!matchedPointIds.has(pt.id)) {
        let color = "#475569";
        let borderColor = "#64748B";
        let opacity = 0.25;
        let radiusKm = 28;

        if (pt.status === "closed") {
          color = "#10B981";
          borderColor = "#047857";
          opacity = 0.58;
          radiusKm = 45;
        } else if (pt.status === "in_attendance") {
          color = "#F59E0B";
          borderColor = "#B45309";
          opacity = 0.46;
          radiusKm = 36;
        } else if (pt.status === "lost") {
          color = "#EF4444";
          borderColor = "#B91C1C";
          opacity = 0.44;
          radiusKm = 32;
        }

        features.push({
          type: "Feature",
          properties: {
            id: pt.id,
            cityName: pt.cityName,
            state: pt.state,
            status: pt.status,
            color,
            borderColor,
            opacity,
            salesCount: pt.salesCount,
            inAttendanceCount: pt.inAttendanceCount,
            lostCount: pt.lostCount
          },
          geometry: {
            type: "Polygon",
            coordinates: [createTerritoryCircle(pt.lng, pt.lat, radiusKm)]
          }
        });
      }
    });

    return {
      type: "FeatureCollection",
      features
    };
  }, [filteredPoints, municipalitiesGeoJson, selectedStatus]);

  // 10. Atualização das Camadas de Área Territorial no MapLibre GL
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const setupTerritoryLayers = () => {
      // 1. Camada de Fundo dos Estados Brasileiros
      if (brStatesGeoJson) {
        const existingStates = map.getSource("brazil-states-base") as maplibregl.GeoJSONSource | undefined;
        if (existingStates) {
          existingStates.setData(brStatesGeoJson);
        } else if (map.isStyleLoaded()) {
          map.addSource("brazil-states-base", {
            type: "geojson",
            data: brStatesGeoJson
          });

          map.addLayer(
            {
              id: "brazil-states-fill",
              type: "fill",
              source: "brazil-states-base",
              layout: {
                visibility: showTerritoryZones ? "visible" : "none"
              },
              paint: {
                "fill-color": "#0B1224",
                "fill-opacity": 0.35
              }
            },
            map.getLayer("tactical-territory-fill") ? "tactical-territory-fill" : undefined
          );

          map.addLayer(
            {
              id: "brazil-states-line",
              type: "line",
              source: "brazil-states-base",
              layout: {
                visibility: showTerritoryZones ? "visible" : "none"
              },
              paint: {
                "line-color": "#1E293B",
                "line-width": 1,
                "line-opacity": 0.6
              }
            },
            map.getLayer("tactical-territory-line") ? "tactical-territory-line" : undefined
          );
        }
      }

      // 2. Camada dos Polígonos Municipais
      const existingSource = map.getSource("tactical-territory-zones") as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(territoryGeoJson);
        return;
      }

      if (!map.isStyleLoaded()) return;

      map.addSource("tactical-territory-zones", {
        type: "geojson",
        data: territoryGeoJson
      });

      // Camada de Preenchimento da Delimitação Territorial
      map.addLayer({
        id: "tactical-territory-fill",
        type: "fill",
        source: "tactical-territory-zones",
        layout: {
          visibility: showTerritoryZones ? "visible" : "none"
        },
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["get", "opacity"]
        }
      });

      // Linha de Limite Territorial
      map.addLayer({
        id: "tactical-territory-line",
        type: "line",
        source: "tactical-territory-zones",
        layout: {
          visibility: showTerritoryZones ? "visible" : "none"
        },
        paint: {
          "line-color": ["get", "borderColor"],
          "line-width": [
            "case",
            ["==", ["get", "status"], "closed"],
            2.5,
            ["==", ["get", "status"], "unexplored"],
            1,
            2
          ],
          "line-opacity": 0.85
        }
      });

      // Interatividade ao Clicar na Área Territorial
      map.on("click", "tactical-territory-fill", (e) => {
        if (e.features && e.features[0]) {
          const featProps = e.features[0].properties;
          const featId = featProps?.id;
          let target = filteredPoints.find((p) => p.id === featId);
          if (!target && featProps?.cityName) {
            const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            target = filteredPoints.find((p) => norm(p.cityName) === norm(featProps.cityName));
          }
          if (target) {
            setSelectedPoint(target);
            setSpyingDeal(null);
            setDealModalFilter("all");
            map.flyTo({
              center: [target.lng, target.lat],
              zoom: 8,
              pitch: 0,
              duration: 1200
            });
          }
        }
      });

      map.on("mouseenter", "tactical-territory-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "tactical-territory-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    };

    if (map.isStyleLoaded()) {
      setupTerritoryLayers();
    } else {
      map.once("load", setupTerritoryLayers);
    }
  }, [territoryGeoJson, filteredPoints, brStatesGeoJson]);

  // Alternância Dinâmica de Visibilidade dos Polígonos de Delimitação Territorial
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    try {
      ["tactical-territory-fill", "tactical-territory-line", "brazil-states-fill", "brazil-states-line"].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", showTerritoryZones ? "visible" : "none");
        }
      });
    } catch (err) {
      console.warn("Transição de camada territorial:", err);
    }
  }, [showTerritoryZones]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div
      ref={mapStageRef}
      className={`map-stage-container w-full h-full relative ${
        isFullscreen ? "fullscreen-active" : ""
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR UNIFICADA DE CONTROLES DO MAPA COM SCROLL INTELIGENTE   */}
      {/* ========================================================================= */}
      <div className="map-stage-header">
        {/* Seta Lateral Esquerda (Scroll Inteligente) */}
        <button
          type="button"
          className="btn-map-nav-arrow left"
          onClick={() => scrollControls("left")}
          title="Rolar ferramentas para esquerda"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={controlsScrollRef}
          className="map-stage-controls"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          {/* Badge Sala de Guerra Geotática */}
          <div className="flex items-center gap-2 mr-2 flex-shrink-0">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                theme === "whatsapp"
                  ? "bg-[#25D366] shadow-[0_0_8px_#25D366]"
                  : theme === "light"
                  ? "bg-blue-600 shadow-[0_0_8px_#2563EB]"
                  : "bg-cyan-400 shadow-[0_0_8px_#00D2FF]"
              }`}
            ></div>
            <span
              className={`text-[11px] font-bold tracking-wider uppercase ${
                theme === "light" ? "text-slate-800" : "text-white"
              }`}
            >
              SALA DE GUERRA GEOTÁTICA • {geoData?.summary.tenantName?.toUpperCase() || "DOMINÂNCIA DO AGRO"}
            </span>
          </div>

          {/* Divisor */}
          <div className="h-4 w-[1px] bg-slate-700/60 mx-1 flex-shrink-0" />

          {/* Alternador de Base: Satélite / Vetor */}
          <button
            type="button"
            className={`btn-map-control btn-map-mode-toggle ${
              mapMode === "satellite" ? "active" : ""
            }`}
            onClick={toggleBaseMapMode}
            title="Alternar entre Satélite Real de Alta Resolução e Mapa Vetorial Tático"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {mapMode === "satellite"
                ? "Satélite Real (HD)"
                : theme === "light"
                ? "Tático Clean"
                : "Tático Dark"}
            </span>
          </button>

          {/* Botão de Ligar / Desligar Demarcação Territorial Municipal */}
          <button
            type="button"
            className={`btn-map-control ${showTerritoryZones ? "active" : ""}`}
            onClick={() => setShowTerritoryZones(!showTerritoryZones)}
            title="Ativar ou desativar os polígonos de delimitação territorial dos municípios"
          >
            <Shield className={`w-3.5 h-3.5 ${showTerritoryZones ? "text-emerald-400" : "text-slate-400"}`} />
            <span>{showTerritoryZones ? "Demarcação Territorial (Ativa)" : "Demarcação Territorial (Oculta)"}</span>
          </button>

          {/* Botão de Relatório Estratégico com Análise por IA */}
          <button
            type="button"
            className="btn-map-control btn-outline-cyan font-bold"
            onClick={fetchAiReport}
            title="Abrir Análise Estratégica com Inteligência Artificial"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
            <span>Relatório de IA</span>
          </button>

          {/* Centralizar Brasil */}
          <button
            type="button"
            className="btn-map-control"
            onClick={handleResetCenter}
            title="Centralizar e enquadrar todo o território brasileiro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Centralizar Brasil</span>
          </button>

          {/* Divisor */}
          <div className="h-4 w-[1px] bg-slate-700/60 mx-1 flex-shrink-0" />

          {/* Filtros Rápidos de Status Comercial */}
          <button
            type="button"
            className={`btn-map-control ${selectedStatus === "all" ? "active" : ""}`}
            onClick={() => setSelectedStatus("all")}
            title="Exibir todos os polos"
          >
            <span>Todos ({geoData?.points.length || 0})</span>
          </button>

          <button
            type="button"
            className={`btn-map-control ${selectedStatus === "closed" ? "active" : ""}`}
            onClick={() => setSelectedStatus(selectedStatus === "closed" ? "all" : "closed")}
            title="Filtrar Territórios Dominados (Vendas Concluídas)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]"></span>
            <span>Fechados ({closedCount})</span>
          </button>

          <button
            type="button"
            className={`btn-map-control ${selectedStatus === "in_attendance" ? "active" : ""}`}
            onClick={() =>
              setSelectedStatus(selectedStatus === "in_attendance" ? "all" : "in_attendance")
            }
            title="Filtrar Em Atendimento Ativo"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B]"></span>
            <span>Atendimento ({inAttendanceCount})</span>
          </button>

          <button
            type="button"
            className={`btn-map-control ${selectedStatus === "lost" ? "active" : ""}`}
            onClick={() =>
              setSelectedStatus(selectedStatus === "lost" ? "all" : "lost")
            }
            title="Filtrar Negócios Perdidos / Ação de Repescagem"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#EF4444]"></span>
            <span>Perdidos ({lostCount})</span>
          </button>

          <button
            type="button"
            className={`btn-map-control ${selectedStatus === "unexplored" ? "active" : ""}`}
            onClick={() =>
              setSelectedStatus(selectedStatus === "unexplored" ? "all" : "unexplored")
            }
            title="Filtrar Mercado em Aberto (Névoa Agro)"
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Em Aberto ({unexploredCount})</span>
          </button>

          {/* Filtro de Origem */}
          <button
            type="button"
            className={`btn-map-control ${selectedTraffic === "paid" ? "active" : ""}`}
            onClick={() => setSelectedTraffic(selectedTraffic === "paid" ? "all" : "paid")}
            title="Filtrar Leads de Tráfego Pago (Meta Ads)"
          >
            <span>Meta Ads</span>
          </button>

          <button
            type="button"
            className={`btn-map-control ${selectedTraffic === "organic" ? "active" : ""}`}
            onClick={() => setSelectedTraffic(selectedTraffic === "organic" ? "all" : "organic")}
            title="Filtrar Leads Orgânicos"
          >
            <span>Orgânico</span>
          </button>

          {/* Botão Tela Cheia (Nativo com Fullscreen API) */}
          <button
            type="button"
            className={`btn-map-control ${isFullscreen ? "active" : ""}`}
            onClick={toggleFullscreen}
            title="Alternar Modo Tela Cheia (ou pressione ESC)"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}</span>
          </button>

          {/* Badge Total no Canto Direito */}
          <div className="map-count-badge ml-auto">
            {filteredPoints.length} Polos • R${" "}
            {((geoData?.summary.totalRevenue || 0) / 1000).toLocaleString("pt-BR", {
              maximumFractionDigits: 0
            })}
            k
          </div>
        </div>

        {/* Seta Lateral Direita (Scroll Inteligente) */}
        <button
          type="button"
          className="btn-map-nav-arrow right"
          onClick={() => scrollControls("right")}
          title="Rolar ferramentas para direita"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. VIEWPORT DO MAPA (CANVAS WEBGL + LEGENDA FLUTUANTE)                    */}
      {/* ========================================================================= */}
      <div className="map-stage-viewport">
        {/* Container WebGL MapLibre */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* ======================================================================= */}
        {/* 3. LEGENDA FLUTUANTE OFICIAL (ESTRUTURA COMPACTA COM SCROLL INTERNO)    */}
        {/* ======================================================================= */}
        <div
          className={`map-floating-legend ${isLegendMinimized ? "minimized" : ""} ${
            isDraggingLegend ? "is-dragging" : ""
          }`}
          style={{
            left: `${legendPosition.x}px`,
            top: `${legendPosition.y}px`
          }}
        >
          <div
            className="legend-header cursor-grab active:cursor-grabbing select-none group"
            onMouseDown={handleLegendDragStart}
            title="Arraste para posicionar a Legenda Espacial onde preferir na tela"
          >
            <div className="legend-header-left flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 opacity-70 group-hover:opacity-100" />
              <span>LEGENDA ESPACIAL</span>
              <span
                className="legend-help-trigger"
                onMouseDown={(e) => e.stopPropagation()}
                title="Explicação dos status"
              >
                ?
                <div className="legend-help-tooltip">
                  <div className="help-title">Guia da Legenda Espacial:</div>
                  <div className="help-item">
                    <b>Negócio Fechado:</b> Ponto verde. Clientes com contratos ativos, vendas ganhas
                    e faturamento confirmado no CRM Vallor.
                  </div>
                  <div className="help-item">
                    <b>Em Atendimento:</b> Ponto âmbar. Leads em negociação ativa, proposta enviada ou
                    visita comercial agendada.
                  </div>
                  <div className="help-item">
                    <b>Mercado em Aberto:</b> Ponto cinza grafite. Municípios de alto potencial
                    estratégico sem clientes cadastrados.
                  </div>
                  <div className="help-item">
                    <b>Radar em Tempo Real:</b> Anel pulsante. Interações via WhatsApp ou canais de
                    atendimento nos últimos 15 minutos.
                  </div>
                  <div className="help-item">
                    <b>Origem do Lead:</b> Segmentação entre Tráfego Pago (Meta Ads / Instagram) e
                    Orgânico / Indicação.
                  </div>
                  <div className="help-item">
                    <b>Setorização:</b> Divisão geográfica dos atendimentos e vendedores designados por
                    região.
                  </div>
                </div>
              </span>
            </div>
            <button
              type="button"
              className="btn-legend-minimize"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsLegendMinimized(!isLegendMinimized)}
              title={isLegendMinimized ? "Expandir Legenda" : "Minimizar Legenda"}
            >
              <span>{isLegendMinimized ? "+" : "_"}</span>
            </button>
          </div>

          <div className="legend-content custom-scrollbar">
            {/* 0. PAINEL EXECUTIVO DE DOMINÂNCIA TERRITORIAL & IA (MULTI-TENANT AGRO) */}
            <div className="p-3 mb-2 rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400/50 shadow-[0_0_6px_#10B981]" />
                  Dominância Comercial do Agro
                </span>
                <span className="text-[9px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  Agro
                </span>
              </div>

              {/* Barra de Progresso Multissegmentada de Território */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex my-2 border border-slate-700/50">
                <div style={{ width: `${dominancePercentage}%` }} className="bg-emerald-500 h-full transition-all" title={`Dominado com Vendas: ${dominancePercentage}%`} />
                <div style={{ width: `${inAttendancePercentage}%` }} className="bg-amber-400 h-full transition-all" title={`Em Atendimento Ativo: ${inAttendancePercentage}%`} />
                <div style={{ width: `${lostPercentage}%` }} className="bg-rose-500 h-full transition-all" title={`Perdidos / Repescagem: ${lostPercentage}%`} />
                <div style={{ width: `${unexploredPercentage}%` }} className="bg-slate-600 h-full transition-all" title={`Mercado em Aberto: ${unexploredPercentage}%`} />
              </div>

              {/* Grid de Percentuais com Botões Clicáveis e Filtros Ativos */}
              <div className="grid grid-cols-4 gap-1.5 text-center my-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === "closed" ? "all" : "closed")}
                  title="Filtrar polos com vendas fechadas (Dominado)"
                  className={`rounded-lg p-1.5 transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    selectedStatus === "closed"
                      ? "bg-emerald-950 border-emerald-400 ring-2 ring-emerald-400/70 shadow-md shadow-emerald-950"
                      : "bg-emerald-950/30 border-emerald-800/40 hover:bg-emerald-950/60"
                  }`}
                >
                  <div className="text-[8px] text-emerald-400 font-bold uppercase">Dominado</div>
                  <div className="text-xs font-black text-emerald-300">{dominancePercentage}%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === "in_attendance" ? "all" : "in_attendance")}
                  title="Filtrar polos em atendimento ativo"
                  className={`rounded-lg p-1.5 transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    selectedStatus === "in_attendance"
                      ? "bg-amber-950 border-amber-400 ring-2 ring-amber-400/70 shadow-md shadow-amber-950"
                      : "bg-amber-950/30 border-amber-800/40 hover:bg-amber-950/60"
                  }`}
                >
                  <div className="text-[8px] text-amber-400 font-bold uppercase">Atendimento</div>
                  <div className="text-xs font-black text-amber-300">{inAttendancePercentage}%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === "lost" ? "all" : "lost")}
                  title="Filtrar polos de oportunidades perdidas (Repescagem)"
                  className={`rounded-lg p-1.5 transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    selectedStatus === "lost"
                      ? "bg-rose-950 border-rose-400 ring-2 ring-rose-400/70 shadow-md shadow-rose-950"
                      : "bg-rose-950/30 border-rose-800/40 hover:bg-rose-950/60"
                  }`}
                >
                  <div className="text-[8px] text-rose-400 font-bold uppercase">Perdas</div>
                  <div className="text-xs font-black text-rose-300">{lostPercentage}%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === "unexplored" ? "all" : "unexplored")}
                  title="Filtrar mercado em aberto (Névoa de Guerra)"
                  className={`rounded-lg p-1.5 transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    selectedStatus === "unexplored"
                      ? "bg-slate-800 border-slate-300 ring-2 ring-slate-400/70 shadow-md"
                      : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                  }`}
                >
                  <div className="text-[8px] text-slate-400 font-bold uppercase">Névoa</div>
                  <div className="text-xs font-black text-slate-200">{unexploredPercentage}%</div>
                </button>
              </div>

              {/* Botão de Leitura Estratégica com IA */}
              <button
                type="button"
                onClick={fetchAiReport}
                className="w-full mt-1.5 py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-600/40 flex items-center justify-center gap-1.5 transition-all shadow-sm group"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow group-hover:scale-110 transition-transform" />
                <span>Relatório Estratégico & IA</span>
                <ArrowUpRight className="w-3 h-3 opacity-80" />
              </button>
            </div>

            {/* Accordion 1: Status Comercial (Pins) */}
            <div className="legend-accordion-group">
              <div
                className={`legend-accordion-header ${expandedAccordions.status ? "active" : ""}`}
                onClick={() => toggleAccordion("status")}
              >
                <div className="legend-header-title">
                  <span className="legend-header-icon">
                    <MapPin
                      className={`w-3.5 h-3.5 ${
                        theme === "whatsapp"
                          ? "text-[#25D366]"
                          : theme === "light"
                          ? "text-blue-600"
                          : "text-cyan-400"
                      }`}
                    />
                  </span>
                  <span>Dominância & Status de Área</span>
                </div>
                <span className="legend-accordion-arrow">
                  {expandedAccordions.status ? "▾" : "▸"}
                </span>
              </div>
              {expandedAccordions.status && (
                <div className="legend-accordion-body">
                  {/* Negócio Fechado */}
                  <div
                    className={`leg-item leg-item-tooltip-wrap cursor-pointer ${
                      selectedStatus === "closed" ? "bg-emerald-500/15" : ""
                    }`}
                    onClick={() =>
                      setSelectedStatus(selectedStatus === "closed" ? "all" : "closed")
                    }
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0"></span>
                    <span className="text-[11px] leading-tight flex-1">
                      <strong className="text-emerald-500">Território Dominado (Vendas)</strong>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500">{closedCount}</span>
                    <div className="spatial-legend-tooltip">
                      <div className="spatial-tooltip-title text-emerald-500">
                        <span className="spatial-tooltip-dot bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                        <span>Área Dominada & Vendas Concluídas</span>
                      </div>
                      <div className="spatial-tooltip-body">
                        Polos com vendas confirmadas. A área ao redor fica verde no mapa (ex: Pelotas e Passo Fundo cobrindo municípios agro vizinhos).
                      </div>
                    </div>
                  </div>

                  {/* Em Atendimento */}
                  <div
                    className={`leg-item leg-item-tooltip-wrap cursor-pointer ${
                      selectedStatus === "in_attendance" ? "bg-amber-500/15" : ""
                    }`}
                    onClick={() =>
                      setSelectedStatus(
                        selectedStatus === "in_attendance" ? "all" : "in_attendance"
                      )
                    }
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] flex-shrink-0"></span>
                    <span className="text-[11px] leading-tight flex-1">
                      <strong className="text-amber-500">Em Atendimento Ativo</strong>
                    </span>
                    <span className="text-[10px] font-bold text-amber-500">
                      {inAttendanceCount}
                    </span>
                    <div className="spatial-legend-tooltip">
                      <div className="spatial-tooltip-title text-amber-500">
                        <span className="spatial-tooltip-dot bg-amber-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]"></span>
                        <span>Área em Atendimento / Negociação</span>
                      </div>
                      <div className="spatial-tooltip-body">
                        Cidades com propostas em aberto ou leads em atendimento. Toda a área ao redor fica amarela no mapa (ex: Chapecó).
                      </div>
                    </div>
                  </div>

                  {/* Oportunidades Perdidas */}
                  <div
                    className={`leg-item leg-item-tooltip-wrap cursor-pointer ${
                      selectedStatus === "lost" ? "bg-rose-500/15" : ""
                    }`}
                    onClick={() =>
                      setSelectedStatus(
                        selectedStatus === "lost" ? "all" : "lost"
                      )
                    }
                  >
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] flex-shrink-0"></span>
                    <span className="text-[11px] leading-tight flex-1">
                      <strong className="text-rose-400">Negócios Perdidos (Repescagem)</strong>
                    </span>
                    <span className="text-[10px] font-bold text-rose-400">
                      {lostCount}
                    </span>
                    <div className="spatial-legend-tooltip">
                      <div className="spatial-tooltip-title text-rose-400">
                        <span className="spatial-tooltip-dot bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                        <span>Área com Perdas Registradas</span>
                      </div>
                      <div className="spatial-tooltip-body">
                        Polos com oportunidades perdidas no CRM. Permite ações comerciais de repescagem com condições especiais pós-safra.
                      </div>
                    </div>
                  </div>

                  {/* Mercado em Aberto */}
                  <div
                    className={`leg-item leg-item-tooltip-wrap cursor-pointer ${
                      selectedStatus === "unexplored" ? "bg-slate-700/30" : ""
                    }`}
                    onClick={() =>
                      setSelectedStatus(selectedStatus === "unexplored" ? "all" : "unexplored")
                    }
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-500 flex-shrink-0"></span>
                    <span className="text-[11px] leading-tight flex-1">
                      <strong className={theme === "light" ? "text-slate-600" : "text-slate-400"}>
                        Mercado em Aberto (Névoa)
                      </strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        theme === "light" ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {unexploredCount}
                    </span>
                    <div className="spatial-legend-tooltip">
                      <div
                        className={`spatial-tooltip-title ${
                          theme === "light" ? "text-slate-800" : "text-slate-300"
                        }`}
                      >
                        <span className="spatial-tooltip-dot bg-slate-500"></span>
                        <span>Mercado em Aberto / Névoa de Guerra</span>
                      </div>
                      <div className="spatial-tooltip-body">
                        Polos estratégicos do agronegócio em cinza ainda não loteados, aguardando prospecção e campanhas de Meta Ads.
                      </div>
                    </div>
                  </div>

                  {/* Radar em Tempo Real */}
                  <div className="leg-item leg-item-tooltip-wrap">
                    <span className="relative flex h-3 w-3 flex-shrink-0">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                          theme === "whatsapp" ? "bg-emerald-400" : "bg-cyan-400"
                        } opacity-75`}
                      ></span>
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 ${
                          theme === "whatsapp" ? "bg-[#25D366]" : "bg-cyan-500"
                        }`}
                      ></span>
                    </span>
                    <span className="text-[11px] leading-tight flex-1">
                      <strong
                        className={theme === "whatsapp" ? "text-[#25D366]" : "text-cyan-400"}
                      >
                        Radar em Tempo Real
                      </strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        theme === "whatsapp" ? "text-[#25D366]" : "text-cyan-400"
                      }`}
                    >
                      {liveCount} ao vivo
                    </span>
                    <div className="spatial-legend-tooltip">
                      <div
                        className={`spatial-tooltip-title ${
                          theme === "whatsapp" ? "text-[#25D366]" : "text-cyan-400"
                        }`}
                      >
                        <span
                          className={`spatial-tooltip-dot ${
                            theme === "whatsapp"
                              ? "bg-[#25D366] shadow-[0_0_6px_#25D366]"
                              : "bg-cyan-400 shadow-[0_0_6px_#00D2FF]"
                          }`}
                        ></span>
                        <span>Radar Operacional Ao Vivo</span>
                      </div>
                      <div className="spatial-tooltip-body">
                        Clientes ou leads interagindo no WhatsApp ou canais omnichannel nos últimos
                        15 minutos.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Canais de Origem */}
            <div className="legend-accordion-group">
              <div
                className={`legend-accordion-header ${expandedAccordions.traffic ? "active" : ""}`}
                onClick={() => toggleAccordion("traffic")}
              >
                <div className="legend-header-title">
                  <span className="legend-header-icon">
                    <Radio
                      className={`w-3.5 h-3.5 ${
                        theme === "whatsapp"
                          ? "text-[#00A884]"
                          : theme === "light"
                          ? "text-blue-600"
                          : "text-blue-400"
                      }`}
                    />
                  </span>
                  <span>Canais de Origem</span>
                </div>
                <span className="legend-accordion-arrow">
                  {expandedAccordions.traffic ? "▾" : "▸"}
                </span>
              </div>
              {expandedAccordions.traffic && (
                <div className="legend-accordion-body">
                  <div
                    className={`grid grid-cols-3 gap-1 p-0.5 rounded border ${
                      theme === "light"
                        ? "bg-slate-100 border-slate-300"
                        : theme === "whatsapp"
                        ? "bg-[#202C33] border-[#2A3942]"
                        : "bg-slate-900/60 border-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTraffic("all")}
                      className={`py-1 text-[10px] font-semibold rounded transition-colors ${
                        selectedTraffic === "all"
                          ? theme === "whatsapp"
                            ? "bg-[#00A884] text-white shadow-sm"
                            : "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTraffic("paid")}
                      className={`py-1 text-[10px] font-semibold rounded transition-colors ${
                        selectedTraffic === "paid"
                          ? theme === "whatsapp"
                            ? "bg-[#00A884] text-white shadow-sm"
                            : "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Meta Ads
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTraffic("organic")}
                      className={`py-1 text-[10px] font-semibold rounded transition-colors ${
                        selectedTraffic === "organic"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Orgânico
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Setorização & Vendedores */}
            <div className="legend-accordion-group">
              <div
                className={`legend-accordion-header ${expandedAccordions.sectors ? "active" : ""}`}
                onClick={() => toggleAccordion("sectors")}
              >
                <div className="legend-header-title">
                  <span className="legend-header-icon">
                    <Briefcase
                      className={`w-3.5 h-3.5 ${
                        theme === "whatsapp"
                          ? "text-[#00A884]"
                          : theme === "light"
                          ? "text-indigo-600"
                          : "text-indigo-400"
                      }`}
                    />
                  </span>
                  <span>Setorização Regional & Vendedor</span>
                </div>
                <span className="legend-accordion-arrow">
                  {expandedAccordions.sectors ? "▾" : "▸"}
                </span>
              </div>
              {expandedAccordions.sectors && (
                <div className="legend-accordion-body space-y-2">
                  {/* Região */}
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[9px] uppercase font-bold ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Região Comercial:
                    </span>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className={`w-full px-2 py-1 text-[11px] rounded border focus:outline-none ${
                        theme === "light"
                          ? "bg-white border-slate-300 text-slate-800 focus:border-blue-500"
                          : theme === "whatsapp"
                          ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] focus:border-[#00A884]"
                          : "bg-slate-900/90 border-white/10 text-slate-200 focus:border-cyan-400"
                      }`}
                    >
                      <option value="all">Todas as Regiões (Nacional)</option>
                      <option value="Sul">Região Sul (RS, SC, PR)</option>
                      <option value="Centro-Oeste">Centro-Oeste (MT, MS, GO, DF)</option>
                      <option value="Sudeste">Sudeste (SP, MG, RJ, ES)</option>
                      <option value="Nordeste">Nordeste (BA, PE, CE, etc.)</option>
                      <option value="Norte">Norte (TO, RO, PA, etc.)</option>
                    </select>
                  </div>

                  {/* Vendedor */}
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[9px] uppercase font-bold ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Vendedor do Setor:
                    </span>
                    <select
                      value={selectedSeller}
                      onChange={(e) => setSelectedSeller(e.target.value)}
                      className={`w-full px-2 py-1 text-[11px] rounded border focus:outline-none ${
                        theme === "light"
                          ? "bg-white border-slate-300 text-slate-800 focus:border-blue-500"
                          : theme === "whatsapp"
                          ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] focus:border-[#00A884]"
                          : "bg-slate-900/90 border-white/10 text-slate-200 focus:border-cyan-400"
                      }`}
                    >
                      <option value="all">Todos os Atendentes</option>
                      {geoData?.sellers.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.region})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Localizar Cidade */}
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[9px] uppercase font-bold ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Buscar Cidade:
                    </span>
                    <div className="relative">
                      <Search
                        className={`w-3 h-3 absolute left-2 top-2 pointer-events-none ${
                          theme === "light" ? "text-slate-400" : "text-slate-500"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Ex: Passo Fundo, Goiânia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-7 pr-2 py-1 text-[11px] rounded border focus:outline-none ${
                          theme === "light"
                            ? "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500"
                            : theme === "whatsapp"
                            ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] placeholder-slate-500 focus:border-[#00A884]"
                            : "bg-slate-900/90 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Botão Limpar Filtros quando ativo */}
                  {(selectedStatus !== "all" ||
                    selectedRegion !== "all" ||
                    selectedSeller !== "all" ||
                    selectedTraffic !== "all" ||
                    searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus("all");
                        setSelectedRegion("all");
                        setSelectedSeller("all");
                        setSelectedTraffic("all");
                        setSearchQuery("");
                      }}
                      className="w-full py-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-colors"
                    >
                      Limpar Todos os Filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. GAVETA LATERAL EXECUTIVA TOTALMENTE ROLÁVEL (SEM TEXTO CORTADO)      */}
        {/* ======================================================================= */}
        {selectedPoint && (
          <aside
            className={`absolute top-0 right-0 bottom-0 w-[440px] max-w-full z-40 flex flex-col shadow-[-16px_0_45px_rgba(0,0,0,0.65)] transition-all duration-300 animate-in fade-in slide-in-from-right-8 ${
              theme === "light"
                ? "bg-white/95 border-l border-slate-200/90 text-slate-800"
                : theme === "whatsapp"
                ? "bg-[#111B21]/95 border-l border-[#202C33]/90 text-[#E9EDEF]"
                : "bg-[#0B1224]/95 border-l border-slate-800/90 text-slate-200"
            }`}
            style={{
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {spyingDeal ? (
              /* ======================================================================= */
              /* SUB-VIEW ESPIAR ATENDIMENTO DO VENDEDOR (100% REAL E SIGILOSO)         */
              /* ======================================================================= */
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                {/* Topo do Espião: Voltar e Fechar */}
                <div
                  className={`p-4 border-b flex items-center justify-between flex-shrink-0 backdrop-blur-md ${
                    theme === "light"
                      ? "border-slate-200 bg-white/95"
                      : theme === "whatsapp"
                      ? "border-[#202C33] bg-[#111B21]/95"
                      : "border-slate-800 bg-[#070D1B]/95"
                  }`}
                >
                  <button
                    onClick={() => setSpyingDeal(null)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      theme === "light"
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-500" />
                    <span>Voltar aos Clientes de {selectedPoint.cityName}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPoint(null);
                      setSpyingDeal(null);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      theme === "light"
                        ? "text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                        : theme === "whatsapp"
                        ? "text-slate-400 hover:text-white hover:bg-[#202C33]"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Header Executivo da Conversa Espionada */}
                <div
                  className={`p-4 border-b space-y-2.5 flex-shrink-0 ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200"
                      : theme === "whatsapp"
                      ? "bg-[#111B21] border-[#202C33]"
                      : "bg-[#0b1325] border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Radar Espião de Atendimento
                    </span>
                    <span className="text-xs font-extrabold text-emerald-500">
                      {formatCurrency(spyingDeal.value)}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`text-sm font-bold leading-tight ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}
                    >
                      <span className="text-emerald-500 font-extrabold">{spyingDeal.sellerName}</span> está atendendo{" "}
                      <span className="underline decoration-emerald-500/40">{spyingDeal.clientName}</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {spyingDeal.contactPhone || "WhatsApp Oficial"}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 truncate max-w-[200px]">{spyingDeal.title}</span>
                    </div>
                  </div>

                  {/* Alerta de Sigilo Operacional */}
                  <div
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                      theme === "light"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Visualização Sigilosa:</strong> Você está acompanhando as mensagens em tempo real. O vendedor e o cliente não sabem que você está espiando.
                    </div>
                  </div>
                </div>

                {/* Fluxo de Mensagens em Formato WhatsApp */}
                <div
                  className={`flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 ${
                    theme === "light"
                      ? "bg-[#EFEAE2]"
                      : theme === "whatsapp"
                      ? "bg-[#0B141A]"
                      : "bg-[#070D1B]"
                  }`}
                >
                  {loadingSpyMessages ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-3">
                      <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                      <span className="text-xs text-slate-400 font-medium">Sincronizando mensagens reais...</span>
                    </div>
                  ) : spyMessages.length > 0 ? (
                    spyMessages.map((msg) => {
                      const isOut = msg.fromMe || msg.direction === "OUTBOUND" || msg.senderType === "agent";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOut ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`text-[10px] font-semibold mb-0.5 px-1.5 ${
                              theme === "light" ? "text-slate-600" : "text-slate-400"
                            }`}
                          >
                            {isOut ? spyingDeal.sellerName : spyingDeal.clientName}
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                              isOut
                                ? theme === "light"
                                  ? "bg-[#D9FDD3] text-slate-800 rounded-tr-none border border-emerald-200"
                                  : "bg-[#005C4B] text-white rounded-tr-none"
                                : theme === "light"
                                ? "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                : "bg-[#202C33] text-[#E9EDEF] rounded-tl-none border border-slate-700/50"
                            }`}
                          >
                            {msg.type === "audio" || msg.mediaUrl?.includes(".mp3") || msg.mediaUrl?.includes(".ogg") ? (
                              <div className="space-y-1.5">
                                <audio controls className="w-full h-8" src={msg.mediaUrl} />
                                {msg.audioTranscription && (
                                  <p className="text-[11px] italic opacity-80 border-t border-current/10 pt-1 mt-1">
                                    "{msg.audioTranscription}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                            )}

                            <div
                              className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                                isOut
                                  ? theme === "light"
                                    ? "text-emerald-700"
                                    : "text-emerald-200/80"
                                  : "text-slate-400"
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isOut && <CheckCheck className="w-3 h-3 text-cyan-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-400">
                      Nenhuma mensagem registrada no banco para esta conversa.
                    </div>
                  )}
                </div>

                {/* Rodapé Fixo do Espião: Intervir no Chat ou Abrir no CRM */}
                <div
                  className={`p-4 border-t flex flex-col gap-2 flex-shrink-0 backdrop-blur-md ${
                    theme === "light"
                      ? "border-slate-200 bg-white/95"
                      : theme === "whatsapp"
                      ? "border-[#202C33] bg-[#111B21]/95"
                      : "border-slate-800 bg-[#070D1B]/95"
                  }`}
                >
                  <button
                    onClick={() => router.push(spyingDeal.conversationId ? `/chat?conversationId=${spyingDeal.conversationId}` : `/chat`)}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#00A884] hover:bg-[#02906F] text-white shadow-lg shadow-[#00A884]/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Intervir no Atendimento (Abrir no Inbox)</span>
                  </button>

                  <button
                    onClick={() => router.push(`/crm`)}
                    className={`w-full py-2 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all border ${
                      theme === "light"
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                    }`}
                  >
                    <span>Ver Oportunidade no Funil CRM</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* ======================================================================= */
              /* VISÃO GERAL DO POLO E LISTAGEM INDIVIDUALIZADA DOS CLIENTES             */
              /* ======================================================================= */
              <div className="flex flex-col h-full">
                {/* Topo da Gaveta: Cidade, Estado e Botão Fechar (Efeito Vidro Fosco) */}
                <div
                  className={`p-4 border-b flex items-start justify-between flex-shrink-0 backdrop-blur-md ${
                    theme === "light"
                      ? "border-slate-200 bg-white/95"
                      : theme === "whatsapp"
                      ? "border-[#202C33] bg-[#111B21]/95"
                      : "border-slate-800 bg-[#070D1B]/95"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={`w-4 h-4 ${
                          theme === "whatsapp"
                            ? "text-[#00A884]"
                            : theme === "light"
                            ? "text-blue-600"
                            : "text-cyan-400"
                        }`}
                      />
                      <h2
                        className={`text-base font-bold tracking-wide ${
                          theme === "light" ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {selectedPoint.cityName} - {selectedPoint.state}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-semibold ${
                          theme === "light" ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Região {selectedPoint.region}
                      </span>
                      {selectedPoint.isLiveNow && (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            theme === "whatsapp" ? "text-[#25D366]" : "text-cyan-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full animate-ping ${
                              theme === "whatsapp" ? "bg-[#25D366]" : "bg-cyan-400"
                            }`}
                          ></span>
                          Ao Vivo Agora
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPoint(null);
                      setSpyingDeal(null);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      theme === "light"
                        ? "text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                        : theme === "whatsapp"
                        ? "text-slate-400 hover:text-white hover:bg-[#202C33]"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Corpo Rolável Completo (Sem cortes de altura) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  {/* Badge de Status Comercial */}
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${
                        selectedPoint.status === "closed"
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : selectedPoint.status === "in_attendance"
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                          : theme === "light"
                          ? "bg-slate-100 text-slate-600 border-slate-300"
                          : "bg-slate-800/80 text-slate-300 border-slate-700"
                      }`}
                    >
                      {selectedPoint.status === "closed"
                        ? "Polo com Vendas Concluídas (Dominado)"
                        : selectedPoint.status === "in_attendance"
                        ? "Leads em Atendimento Ativo (Área Amarela)"
                        : "Mercado em Aberto (Névoa de Guerra)"}
                    </span>
                  </div>

                  {/* Cards de Métricas Operacionais da Praça (Vendas, Atendimentos e Perdidos) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`p-3 rounded-xl border backdrop-blur-md ${
                        theme === "light"
                          ? "bg-emerald-50/80 border-emerald-200"
                          : theme === "whatsapp"
                          ? "bg-[#202C33]/95 border-[#2A3942]"
                          : "bg-emerald-950/20 border-emerald-800/40"
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-emerald-500">
                        Vendas (Ganho)
                      </div>
                      <div
                        className={`text-lg font-black mt-0.5 ${
                          theme === "light" ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {selectedPoint.salesCount}
                      </div>
                      <div className="text-[10px] text-emerald-500 font-semibold truncate">
                        {formatCurrency(selectedPoint.salesVolume)}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border backdrop-blur-md ${
                        theme === "light"
                          ? "bg-amber-50/80 border-amber-200"
                          : theme === "whatsapp"
                          ? "bg-[#202C33]/95 border-[#2A3942]"
                          : "bg-amber-950/20 border-amber-800/40"
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-amber-500">
                        Em Atendimento
                      </div>
                      <div className="text-lg font-black text-amber-500 mt-0.5">
                        {selectedPoint.inAttendanceCount}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium truncate">
                        Follow-up Ativo
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border backdrop-blur-md ${
                        theme === "light"
                          ? "bg-rose-50/80 border-rose-200"
                          : theme === "whatsapp"
                          ? "bg-[#202C33]/95 border-[#2A3942]"
                          : "bg-rose-950/20 border-rose-800/40"
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-rose-400">
                        Perdidos
                      </div>
                      <div className="text-lg font-black text-rose-500 mt-0.5">
                        {selectedPoint.lostCount || 0}
                      </div>
                      <div className="text-[10px] text-rose-400/90 font-medium truncate">
                        Repescagem
                      </div>
                    </div>
                  </div>

                  {/* Origem dos Clientes: Tráfego Pago vs Orgânico */}
                  <div
                    className={`p-3.5 rounded-xl border backdrop-blur-md ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200"
                        : theme === "whatsapp"
                        ? "bg-[#202C33]/95 border-[#2A3942]"
                        : "bg-[#0e1628]/95 border-slate-700/70"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold mb-2 flex items-center justify-between">
                      <span className={theme === "light" ? "text-slate-500" : "text-slate-400"}>
                        Distribuição de Origem
                      </span>
                      <span
                        className={`font-semibold ${
                          theme === "light" ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {selectedPoint.trafficSource.paid + selectedPoint.trafficSource.organic} leads
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-700/30 overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${
                            selectedPoint.trafficSource.paid + selectedPoint.trafficSource.organic > 0
                              ? (selectedPoint.trafficSource.paid /
                                  (selectedPoint.trafficSource.paid +
                                    selectedPoint.trafficSource.organic)) *
                                100
                              : 50
                          }%`
                        }}
                        title="Meta Ads / Tráfego Pago"
                      ></div>
                      <div
                        className="bg-emerald-500 h-full flex-1"
                        title="Orgânico / Indicação"
                      ></div>
                    </div>
                    <div
                      className={`flex items-center justify-between text-xs mt-2.5 ${
                        theme === "light" ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        Meta Ads ({selectedPoint.trafficSource.paid})
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Orgânico ({selectedPoint.trafficSource.organic})
                      </span>
                    </div>
                  </div>

                  {/* Equipe Responsável */}
                  <div
                    className={`py-2 border-b ${
                      theme === "light"
                        ? "border-slate-200"
                        : theme === "whatsapp"
                        ? "border-[#202C33]"
                        : "border-slate-800/80"
                    }`}
                  >
                    <div
                      className={`text-[10px] uppercase font-bold mb-1.5 ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Equipe Responsável
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPoint.assignedSellers.map((seller, idx) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                            theme === "light"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : theme === "whatsapp"
                              ? "bg-[#202C33] text-[#D1D7DB] border-[#2A3942]"
                              : "bg-slate-800/80 text-slate-200 border-slate-700/60"
                          }`}
                        >
                          <Users
                            className={`w-3.5 h-3.5 ${
                              theme === "whatsapp" ? "text-[#00A884]" : "text-blue-400"
                            }`}
                          />
                          {seller}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* NEGÓCIOS NA PRAÇA - CARDS INDIVIDUALIZADOS COM RECURSO DE ESPIAR */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          theme === "light" ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Clientes & Negócios no CRM ({selectedPoint.recentDeals.length})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Clique para espiar conversa
                      </span>
                    </div>

                    {/* Filtros Rápidos de Status no Modal */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setDealModalFilter("all")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                          dealModalFilter === "all"
                            ? "bg-slate-700 text-white shadow"
                            : "bg-slate-800/50 text-slate-400 hover:text-white"
                        }`}
                      >
                        Todos ({selectedPoint.recentDeals.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDealModalFilter("won")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                          dealModalFilter === "won"
                            ? "bg-emerald-600 text-white shadow"
                            : "bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40"
                        }`}
                      >
                        Vendas ({selectedPoint.salesCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDealModalFilter("in_attendance")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                          dealModalFilter === "in_attendance"
                            ? "bg-amber-600 text-white shadow"
                            : "bg-amber-950/30 text-amber-400 hover:bg-amber-900/40"
                        }`}
                      >
                        Atendimento ({selectedPoint.inAttendanceCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDealModalFilter("lost")}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                          dealModalFilter === "lost"
                            ? "bg-rose-600 text-white shadow"
                            : "bg-rose-950/30 text-rose-400 hover:bg-rose-900/40"
                        }`}
                      >
                        Perdidos ({selectedPoint.lostCount || 0})
                      </button>
                    </div>

                    {selectedPoint.recentDeals.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedPoint.recentDeals
                          .filter((deal) => {
                            const isWon =
                              deal.status === "won" ||
                              deal.statusCategory === "won" ||
                              deal.stageLabel.toLowerCase().includes("vendido") ||
                              deal.stageLabel.toLowerCase().includes("fechado");
                            const isLost =
                              deal.status === "lost" ||
                              deal.statusCategory === "lost" ||
                              deal.stageLabel.toLowerCase().includes("perdido");
                            const isInAttendance = !isWon && !isLost;

                            if (dealModalFilter === "won") return isWon;
                            if (dealModalFilter === "in_attendance") return isInAttendance;
                            if (dealModalFilter === "lost") return isLost;
                            return true;
                          })
                          .map((deal) => {
                            const isWon =
                              deal.status === "won" ||
                              deal.statusCategory === "won" ||
                              deal.stageLabel.toLowerCase().includes("vendido") ||
                              deal.stageLabel.toLowerCase().includes("fechado");
                            const isLost =
                              deal.status === "lost" ||
                              deal.statusCategory === "lost" ||
                              deal.stageLabel.toLowerCase().includes("perdido");

                            return (
                              <div
                                key={deal.id}
                                onClick={() => handleSpyDeal(deal)}
                                className={`p-3.5 rounded-xl border transition-all backdrop-blur-md cursor-pointer group hover:scale-[1.01] ${
                                  isLost
                                    ? "bg-rose-950/20 hover:bg-rose-950/35 border-rose-800/40 text-rose-200"
                                    : isWon
                                    ? "bg-emerald-950/20 hover:bg-emerald-950/35 border-emerald-800/40 text-emerald-200"
                                    : theme === "light"
                                    ? "bg-white hover:bg-amber-50/50 hover:border-amber-300 border-slate-200 text-slate-800 shadow-sm"
                                    : theme === "whatsapp"
                                    ? "bg-[#202C33]/95 hover:bg-[#202C33] hover:border-[#00A884]/60 border-[#2A3942] text-[#E9EDEF]"
                                    : "bg-[#0e1628]/95 hover:bg-[#131f37] hover:border-amber-500/50 border-slate-700/70 text-slate-200"
                                }`}
                              >
                                {/* Linha 1: Nome do Cliente e Valor */}
                                <div className="flex items-start justify-between gap-2">
                                  <div
                                    className={`font-bold text-sm leading-snug break-words transition-colors ${
                                      isLost
                                        ? "text-rose-200 group-hover:text-rose-300"
                                        : isWon
                                        ? "text-emerald-200 group-hover:text-emerald-300"
                                        : theme === "light"
                                        ? "text-slate-900 group-hover:text-amber-600"
                                        : "text-white group-hover:text-amber-400"
                                    }`}
                                  >
                                    {deal.clientName}
                                  </div>
                                  <div
                                    className={`text-sm font-extrabold shrink-0 ${
                                      isLost
                                        ? "text-rose-400"
                                        : isWon
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                    }`}
                                  >
                                    {formatCurrency(deal.value)}
                                  </div>
                                </div>

                                {/* Linha 2: Vendedor Real atendendo este Cliente */}
                                <div className="text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                                  <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span className="text-slate-400">Atendente:</span>
                                  <span
                                    className={`font-bold ${
                                      isLost
                                        ? "text-rose-300"
                                        : isWon
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                    }`}
                                  >
                                    {deal.sellerName}
                                  </span>
                                </div>

                                {/* Linha 3: Proposta / Título */}
                                <div
                                  className={`text-xs mt-1 break-words ${
                                    theme === "light" ? "text-slate-600" : "text-slate-400"
                                  }`}
                                >
                                  {deal.title}
                                </div>

                                {/* Linha 4: Badges de Estágio, Vendedor e Origem */}
                                <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-700/20">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isWon
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        : isLost
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                    }`}
                                  >
                                    {isWon ? "Fechado / Vendido" : isLost ? "Perdido (Repescagem)" : "Em Atendimento"}
                                  </span>

                                  {deal.isLive && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                      Ao Vivo Agora
                                    </span>
                                  )}

                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded ml-auto font-medium ${
                                      deal.source === "paid"
                                        ? "bg-blue-500/15 text-blue-400"
                                        : "bg-emerald-500/15 text-emerald-400"
                                    }`}
                                  >
                                    {deal.source === "paid" ? "Meta Ads" : "Orgânico"}
                                  </span>
                                </div>

                                {/* Linha 5: Botão de Chamada para Ação */}
                                <div
                                  className={`mt-2.5 pt-2 border-t flex items-center justify-between text-xs font-bold transition-colors ${
                                    isLost
                                      ? "border-rose-900/40 text-rose-300 group-hover:text-rose-200"
                                      : isWon
                                      ? "border-emerald-900/40 text-emerald-400 group-hover:text-emerald-300"
                                      : "border-slate-700/40 text-amber-400 group-hover:text-amber-300"
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>
                                      {isLost
                                        ? "Espiar Objeções / Repescagem"
                                        : "Espiar Atendimento do Vendedor"}
                                    </span>
                                  </span>
                                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div
                        className={`py-6 text-center text-xs rounded-xl border border-dashed ${
                          theme === "light"
                            ? "text-slate-400 border-slate-200 bg-slate-50"
                            : "text-slate-500 border-slate-800 bg-slate-900/30"
                        }`}
                      >
                        Nenhum contrato ativo cadastrado para este polo.
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé Fixo com Botão CRM */}
                <div
                  className={`p-4 border-t flex-shrink-0 backdrop-blur-md ${
                    theme === "light"
                      ? "border-slate-200 bg-white/95"
                      : theme === "whatsapp"
                      ? "border-[#202C33] bg-[#111B21]/95"
                      : "border-slate-800 bg-[#070D1B]/95"
                  }`}
                >
                  <button
                    onClick={() => router.push(`/crm`)}
                    className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                      theme === "whatsapp"
                        ? "bg-[#00A884] hover:bg-[#02906F] text-white shadow-[#00A884]/25"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25"
                    }`}
                  >
                    <span>Abrir Negociações no Funil CRM</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ========================================================================= */}
        {/* 5. MODAL EXECUTIVO: RELATÓRIO DE DOMINÂNCIA & IA DA COMERCIAL VERTO (AGRO) */}
        {/* ========================================================================= */}
        {isAiReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#0B1224] text-white shadow-2xl overflow-hidden">
              {/* Header do Relatório */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#0B1224] to-[#0A1A2F]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black tracking-wide">
                        Relatório Estratégico de Inteligência Artificial
                      </h2>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Setor Agro
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Geomarketing e Estratégia de Expansão Territorial • Inteligência Comercial
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiReportData(null);
                      fetchAiReport();
                    }}
                    title="Recalcular Análise com IA"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-700/50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAiReport ? "animate-spin text-emerald-400" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAiReportOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-700/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Corpo do Relatório com Scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                {loadingAiReport ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                      <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white">
                        Analisando Malha Geográfica da Comercial Verto...
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Processando dados de Pelotas, Passo Fundo, taxa de fechamento e polos de grãos no Brasil.
                      </p>
                    </div>
                  </div>
                ) : aiReportData ? (
                  <>
                    {/* Linha de KPIs de Dominância */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl border border-emerald-800/50 bg-emerald-950/20 backdrop-blur-md">
                        <div className="text-[10px] uppercase font-bold text-emerald-400">
                          Territórios Dominados
                        </div>
                        <div className="text-xl font-black text-emerald-300 mt-0.5">
                          {aiReportData.metrics.dominancePercentage}%
                        </div>
                        <div className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
                          {aiReportData.metrics.closedCities} polos • {aiReportData.metrics.wonCount} vendas
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-amber-800/50 bg-amber-950/20 backdrop-blur-md">
                        <div className="text-[10px] uppercase font-bold text-amber-400">
                          Em Disputa Ativa
                        </div>
                        <div className="text-xl font-black text-amber-300 mt-0.5">
                          {aiReportData.metrics.inAttendancePercentage}%
                        </div>
                        <div className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                          {aiReportData.metrics.inAttendanceCities} polos • {aiReportData.metrics.inAttendanceCount} leads
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-rose-800/50 bg-rose-950/20 backdrop-blur-md">
                        <div className="text-[10px] uppercase font-bold text-rose-400">
                          Perdas / Repescagem
                        </div>
                        <div className="text-xl font-black text-rose-300 mt-0.5">
                          {aiReportData.metrics.lostPercentage}%
                        </div>
                        <div className="text-[11px] text-rose-400/90 font-medium mt-0.5">
                          {aiReportData.metrics.lostCities} polos • {aiReportData.metrics.lostCount} perdas
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-md">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Faturamento Fechado
                        </div>
                        <div className="text-xl font-black text-white mt-0.5">
                          {formatCurrency(aiReportData.metrics.totalRevenue)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {aiReportData.metrics.unexploredCities} polos a conquistar
                        </div>
                      </div>
                    </div>

                    {/* Resumo Executivo */}
                    <div className="p-4 rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                          Diagnóstico Executivo Territorial
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {aiReportData.executiveSummary}
                      </p>
                    </div>

                    {/* Grade de Estratégias */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card 1: Avanço Comercial */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {aiReportData.commercialStrategy.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {aiReportData.commercialStrategy.description}
                        </p>
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-bold uppercase text-emerald-400">
                            Ações Táticas Recomendadas:
                          </div>
                          {aiReportData.commercialStrategy.actionItems.map((item: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        {aiReportData.commercialStrategy.priorityCities?.length > 0 && (
                          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Praças Alvo:</span>
                            {aiReportData.commercialStrategy.priorityCities.map((c: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card 2: Marketing & Meta Ads */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {aiReportData.marketingStrategy.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {aiReportData.marketingStrategy.description}
                        </p>
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-bold uppercase text-cyan-400">
                            Distribuição Recomendada de Orçamento:
                          </div>
                          {aiReportData.marketingStrategy.suggestedBudgetDistribution?.map((dist: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-200">{dist.region}</span>
                                <span className="font-extrabold text-cyan-400">{dist.percentage}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                  style={{ width: `${dist.percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-[10px] text-slate-400">{dist.focus}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card 3: Plano de Repescagem */}
                      <div className="p-4 rounded-xl border border-rose-900/40 bg-gradient-to-br from-rose-950/20 to-slate-900/80 space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              {aiReportData.lostRecoveryPlan.title}
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            Foco: Pelotas & Polos de Perdas
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {aiReportData.lostRecoveryPlan.diagnosis}
                        </p>

                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Script Sugerido para WhatsApp (Abordagem Consultiva):
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(aiReportData.lostRecoveryPlan.reengagementScript)}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-all"
                            >
                              {copiedScript ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar Mensagem</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs italic text-slate-300 leading-relaxed font-sans border-l-2 border-emerald-500 pl-2.5">
                            "{aiReportData.lostRecoveryPlan.reengagementScript}"
                          </p>
                        </div>
                      </div>

                      {/* Card 4: Tabela de Expansão dos Polos Agro */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 md:col-span-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Polos Agro Prioritários para Expansão Territorial
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {aiReportData.expansionHubs?.map((hub: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5 hover:border-emerald-500/40 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-white">
                                  {hub.city} - {hub.state}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  {hub.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                {hub.potentialReason}
                              </p>
                              <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                                <span>🎯 Ação:</span>
                                <span>{hub.tacticalAction}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Não foi possível carregar os dados estratégicos. Tente novamente em instantes.
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Inteligência Geoanalítica Integrada ao CRM Vallor
                </span>
                <button
                  type="button"
                  onClick={() => setIsAiReportOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700"
                >
                  Fechar Relatório
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
