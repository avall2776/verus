"use client";

import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, Filter, MoreVertical, Send, Paperclip, Bot, User, Phone, Mail, Tag, 
  BrainCircuit, Lock, Image as ImageIcon, FileText, Mic, X, ArrowRightLeft, Network,
  RefreshCw, TrendingUp, Calendar, MessageSquare, CheckCircle2, Plus, Sparkles,
  BookUser, CalendarClock, PhoneCall, Zap, Eye, ShieldCheck, PhoneForwarded, UserCheck,
  Smile, Bold, Italic, Strikethrough, Code, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Play, Pause,
  Volume2, Check, CheckCheck, Copy, ExternalLink, Headphones, Download, ZoomIn, Maximize2,
  BellOff, History, UserPlus, FileDown, MessageSquarePlus, PanelRight, Info, Pin,
  Clock, AlertCircle, Workflow, Pencil, ShoppingBag, MapPin, Video, ArrowLeft, Reply, Users, Star, Menu,
  Archive, PinOff, Heart, Bell, LogOut, Forward
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useQuery } from "@tanstack/react-query";
import api, { getEffectiveTenantContext } from "@/lib/api";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import ScheduleModal from "@/components/inbox/ScheduleModal";
import ScheduledMessagesDrawer, { ScheduledMessage } from "@/components/inbox/ScheduledMessagesDrawer";
import GlobalScheduledCenterModal from "@/components/inbox/GlobalScheduledCenterModal";
import VersusAudioPlayer from "@/components/chat/VersusAudioPlayer";
import { sanitizeAvatarUrl, isAvatarUrlValid } from "@/lib/avatarUtils";
import { useTheme } from "@/contexts/ThemeContext";
import { extractGoogleDriveId, isGoogleDriveUrl, getDriveThumbnailUrl } from "@/lib/googleDriveHelper";

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', 
  '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🤝', '👍', '👎', 
  '👌', '✌️', '🤞', '👏', '🙌', '🙏', '💪', '🔥', '✨', '⭐', 
  '🚀', '💡', '💬', '📞', '📅', '⏰', '⏳', '🎯', '✅', '❌', 
  '⚠️', '💰', '💵', '💳', '📊', '📈', '📌', '📎', '🎉', '🏆'
];

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const TAG_COLOR_PALETTES = [
  { bg: 'bg-emerald-50 dark:bg-emerald-950/70', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700/60', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  { bg: 'bg-blue-50 dark:bg-blue-950/70', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700/60', dot: 'bg-blue-500 dark:bg-blue-400' },
  { bg: 'bg-purple-50 dark:bg-purple-950/70', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700/60', dot: 'bg-purple-500 dark:bg-purple-400' },
  { bg: 'bg-amber-50 dark:bg-amber-950/70', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700/60', dot: 'bg-amber-500 dark:bg-amber-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/70', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-700/60', dot: 'bg-cyan-500 dark:bg-cyan-400' },
  { bg: 'bg-rose-50 dark:bg-rose-950/70', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700/60', dot: 'bg-rose-500 dark:bg-rose-400' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/70', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700/60', dot: 'bg-indigo-500 dark:bg-indigo-400' },
];

function getTagColor(tag: string) {
  if (!tag) return TAG_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length;
  return TAG_COLOR_PALETTES[index];
}

const DEFAULT_CRM_STAGES = [
  { id: "seed", title: "Leads Seed", color: "text-gray-400", bgLight: "bg-gray-500/15", dotColor: "bg-gray-400", borderLight: "border-gray-500/40" },
  { id: "new", title: "Novo Contato", color: "text-blue-400", bgLight: "bg-blue-500/15", dotColor: "bg-blue-400", borderLight: "border-blue-500/40" },
  { id: "qualified", title: "Em Qualificação", color: "text-purple-400", bgLight: "bg-purple-500/15", dotColor: "bg-purple-400", borderLight: "border-purple-500/40" },
  { id: "follow-up", title: "Follow-up", color: "text-yellow-400", bgLight: "bg-yellow-500/15", dotColor: "bg-yellow-400", borderLight: "border-yellow-500/40" },
  { id: "proposal", title: "Proposta Enviada", color: "text-emerald-400", bgLight: "bg-emerald-500/15", dotColor: "bg-emerald-400", borderLight: "border-emerald-500/40" },
  { id: "negotiation", title: "Negociação", color: "text-orange-400", bgLight: "bg-orange-500/15", dotColor: "bg-orange-400", borderLight: "border-orange-500/40" },
  { id: "won", title: "Fechado/Ganho", color: "text-green-400", bgLight: "bg-green-500/15", dotColor: "bg-green-400", borderLight: "border-green-500/40" },
  { id: "lost", title: "Fechado/Perdido", color: "text-rose-500", bgLight: "bg-rose-500/15", dotColor: "bg-rose-500", borderLight: "border-rose-500/40" },
  { id: "disqualified", title: "Desqualificados", color: "text-slate-500", bgLight: "bg-slate-500/15", dotColor: "bg-slate-500", borderLight: "border-slate-500/40" }
];

const WHATSAPP_WALLPAPER_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360' fill='none' stroke='%23ffffff' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M30 40c0-5.5 4.5-10 10-10h30c5.5 0 10 4.5 10 10v20c0 5.5-4.5 10-10 10H40l-15 15V40z'/%3E%3Ccircle cx='180' cy='60' r='14'/%3E%3Cpath d='M180 52v8l5 3'/%3E%3Cpath d='M315 35l12 24h-24z'/%3E%3Cpath d='M60 180c-5-8-15-8-20 0-5 8 0 16 10 24 10-8 15-16 10-24z'/%3E%3Cpath d='M150 170h35v18c0 9-9 18-18 18s-18-9-18-18v-18z'/%3E%3Cpath d='M185 174c4 0 9 3 9 9s-5 9-9 9'/%3E%3Cpath d='M290 160c-9 0-16 7-16 16v22c0 9 7 16 16 16s16-7 16-16v-22c0-9-7-16-16-16z'/%3E%3Cpath d='M274 182h32'/%3E%3Cpath d='M40 310l25-8-8 25-6-10z'/%3E%3Ccircle cx='160' cy='310' r='13'/%3E%3Cpath d='M155 306l4 4 7-7'/%3E%3Cpath d='M280 290c0-5 4-9 9-9h18c5 0 9 4 9 9v14l-9-5h-18c-5 0-9-4-9-9z'/%3E%3Cpath d='M335 180c0-4 3-7 7-7h12c4 0 7 3 7 7v10l-7-3h-12c-4 0-7-3-7-7z'/%3E%3Cpath d='M100 80l10 10M110 80l-10 10'/%3E%3Cpath d='M230 110l3 7 7 3-7 3-3 7-3-7-7-3 7-3z'/%3E%3Cpath d='M70 250l3 5 5 3-5 3-3 5-3-5-5-3 5-3z'/%3E%3Cpath d='M220 250c0-5 4-8 8-8s8 3 8 8c0 8-16 16-16 16s-16-8-16-16c0-5 4-8 8-8s8 3 8 8z'/%3E%3Cpath d='M335 315c-3 0-6 3-6 6s3 6 6 6 6-3 6-6-3-6-6-6z'/%3E%3Cpath d='M120 345h40'/%3E%3C/svg%3E")`;

function getWhatsAppDateLabel(dateInput?: string | number | Date): string {
  if (!dateInput) return 'Hoje';
  const date = new Date(dateInput);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InboxContent() {
  const { isWhatsApp, theme } = useTheme();
  const { toggleMenu } = useMobileMenu();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');
  const conversationIdParam = searchParams.get('conversationId') || searchParams.get('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesCacheRef = useRef<{ [chatId: string]: any[] }>({});

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [urlLoadedContact, setUrlLoadedContact] = useState<any | null>(null);
  const [contacts, setContacts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('versus_inbox_contacts_cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'waiting' | 'mine' | 'resolved'>('waiting');
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');
  const [quickReplyIndex, setQuickReplyIndex] = useState(0);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const fileInputDocRef = useRef<HTMLInputElement>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [isReopening, setIsReopening] = useState(false);
  const [aiAgentName, setAiAgentName] = useState<string>('Sofia');
  const { socket, isConnected, clearGlobalUnread } = useSocket();

  // Redimensionamento lateral do painel esquerdo (Estilo Lero / Vallor)
  const DEFAULT_SIDEBAR_WIDTH = 380;
  const MIN_SIDEBAR_WIDTH = 280;
  const MAX_SIDEBAR_WIDTH = 750;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('versus_inbox_sidebar_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [showResizeTooltip, setShowResizeTooltip] = useState(false);
  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);

    const startX = e.clientX;
    const startWidth = sidebarWidthRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizingSidebar(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem('versus_inbox_sidebar_width', sidebarWidthRef.current.toString());
      } catch (err) {}
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleDoubleClickResize = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    try {
      localStorage.setItem('versus_inbox_sidebar_width', DEFAULT_SIDEBAR_WIDTH.toString());
    } catch (e) {}
  };

  // Carrega dinamicamente departamentos e nome da IA configurado para este Tenant
  useEffect(() => {
    api.get('/departments').then((res) => {
      if (Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    }).catch(() => {});

    api.get('/agent/config').then((res) => {
      if (res.data?.aiName && typeof res.data.aiName === 'string' && res.data.aiName.trim().length > 0) {
        setAiAgentName(res.data.aiName.trim());
      }
    }).catch(() => {});
  }, []);
  const { instances, activeInstance, setActiveInstance, refreshInstances, status: waStatus, refreshStatus: refreshWaStatus } = useWhatsApp();
  const [showInstanceDropdown, setShowInstanceDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [taggingContactId, setTaggingContactId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'unread' | 'waiting' | 'mine' | 'resolved'>('all');

  const currentUser = useMemo(() => {
    try {
      const userStr = localStorage.getItem('versus_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {}
    return null;
  }, []);

  const currentUserId = currentUser?.id || '';
  const currentUserRole = currentUser?.role || 'AGENT';
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<string | null>(null);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [isForwardingMessage, setIsForwardingMessage] = useState(false);
  const [forwardingTargetId, setForwardingTargetId] = useState<string | null>(null);

  const scrollToMessage = (msgId?: string) => {
    if (!msgId) return;
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-500/10', 'transition-all', 'duration-300');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-500/10');
      }, 1800);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeChat) return;
    setActiveReactionPickerMessageId(null);
    try {
      const { data } = await api.post(`/conversations/${activeChat}/messages/${messageId}/reaction`, { reaction: emoji });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m));
    } catch (err: any) {
      console.error('Erro ao reagir à mensagem:', err);
      toast.error('Não foi possível registrar a reação.');
    }
  };

  // Helper de auto-scroll para a última mensagem
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Efeito de rolagem automática sempre que mensagens ou chat ativo mudarem
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
      const timer = setTimeout(() => scrollToBottom('auto'), 60);
      return () => clearTimeout(timer);
    }
  }, [messages.length, activeChat]);

  // Controla classe no body para esconder BottomNav e otimizar tela quando o chat estiver ativo no mobile
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (activeChat) {
        document.body.classList.add('mobile-chat-open');
      } else {
        document.body.classList.remove('mobile-chat-open');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('mobile-chat-open');
      }
    };
  }, [activeChat]);

  // Estados de Gravação de Áudio via MediaRecorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Player de Áudio ativo
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Feedback de Cópia
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Estados de Assunção de Fila & Espiar (Padrão Lero)
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [selectedQueueChat, setSelectedQueueChat] = useState<any | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);

  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactModalSearch, setContactModalSearch] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduledDrawer, setShowScheduledDrawer] = useState(false);
  const [showGlobalScheduleCenter, setShowGlobalScheduleCenter] = useState(false);
  const [scheduledMessagesByChat, setScheduledMessagesByChat] = useState<{ [chatId: string]: ScheduledMessage[] }>({});
  const [showVoipDialer, setShowVoipDialer] = useState(false);
  const [voipNumber, setVoipNumber] = useState('');

  // Modal Lightbox / Expansão de Imagem
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  // Estados para Context Menu do WhatsApp Web no Inbox
  const [chatContextMenu, setChatContextMenu] = useState<{ contactId: string; x: number; y: number } | null>(null);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const [pinnedContactIds, setPinnedContactIds] = useState<string[]>([]);
  const [favoriteContactIds, setFavoriteContactIds] = useState<string[]>([]);
  const [archivedContactIds, setArchivedContactIds] = useState<string[]>([]);

  // Estados para Refinamento Técnico e Visual (Padrão Lero)
  const [contextMenuContactId, setContextMenuContactId] = useState<string | null>(null);
  const [mutedContactIds, setMutedContactIds] = useState<string[]>([]);
  const [expandedTranscriptions, setExpandedTranscriptions] = useState<{ [key: string]: boolean }>({});
  const [transcribingMessageIds, setTranscribingMessageIds] = useState<{ [key: string]: boolean }>({});
  const [expandedImageAnalyses, setExpandedImageAnalyses] = useState<{ [key: string]: boolean }>({});
  const [analyzingImageIds, setAnalyzingImageIds] = useState<{ [key: string]: boolean }>({});
  const [showChatOptionsMenu, setShowChatOptionsMenu] = useState(false);
  const [showCrmSubmenu, setShowCrmSubmenu] = useState(false);
  const [showLeftHeaderMenu, setShowLeftHeaderMenu] = useState(false);
  const [showDeleteConvModal, setShowDeleteConvModal] = useState(false);
  const [isDeletingConv, setIsDeletingConv] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Estados para Envio de Modelo / Reabertura 24h Meta
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState('hello_world');

  // Estados para Ação Manual no Funil do CRM
  const [crmStages, setCrmStages] = useState(DEFAULT_CRM_STAGES);
  const [currentDeal, setCurrentDeal] = useState<any | null>(null);
  const [currentDealStage, setCurrentDealStage] = useState<string | null>(null);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);
  const [isMovingStage, setIsMovingStage] = useState(false);

  // Estados para edição inline do número de telefone e nome no Drawer
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editingPhoneValue, setEditingPhoneValue] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Estados para Integração com Radar de Stories (Visualizadores Recentes + Stories Ativos da Linha Principal)
  const [recentStoryViewers, setRecentStoryViewers] = useState<Set<string>>(new Set());
  const recentStorySuffixSet = useMemo(() => {
    const set = new Set<string>();
    recentStoryViewers.forEach((p) => {
      const clean = p.replace(/\D/g, '');
      if (clean.length >= 8) {
        set.add(clean.slice(-8));
      }
      set.add(clean);
    });
    return set;
  }, [recentStoryViewers]);
  const [activeLineStories, setActiveLineStories] = useState<any[]>([]);
  const [storyViewersList, setStoryViewersList] = useState<any[]>([]);
  const [storyViewerModal, setStoryViewerModal] = useState<{
    isOpen: boolean;
    currentIndex: number;
    showViewersDrawer: boolean;
    highlightedViewerName?: string;
    highlightedViewerTime?: string;
  }>({
    isOpen: false,
    currentIndex: 0,
    showViewersDrawer: false,
  });
  const [contactLatestStory, setContactLatestStory] = useState<{
    id: string;
    statusMessageId: string;
    title: string;
    category: string;
    mediaUrl?: string;
    viewedAt: string;
    exactDate: string;
    exactTime: string;
    relative: string;
  } | null>(null);

  const fetchRecentStoryViewers = useCallback(async () => {
    try {
      const [phonesRes, postsRes, viewersRes] = await Promise.all([
        api.get('/crm/radar-stories/recent-viewers-phones').catch(() => ({ data: null })),
        api.get('/crm/radar-stories/active-posts').catch(() => ({ data: null })),
        api.get('/crm/radar-stories/viewers').catch(() => ({ data: null })),
      ]);
      if (phonesRes.data?.phones && Array.isArray(phonesRes.data.phones)) {
        setRecentStoryViewers(new Set(phonesRes.data.phones.map((p: string) => p.replace(/\D/g, ''))));
      }
      if (Array.isArray(postsRes.data)) {
        setActiveLineStories(postsRes.data);
      }
      if (Array.isArray(viewersRes.data)) {
        setStoryViewersList(viewersRes.data);
      }
    } catch (err) {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchRecentStoryViewers();
    const interval = setInterval(fetchRecentStoryViewers, 30000);
    return () => clearInterval(interval);
  }, [fetchRecentStoryViewers]);

  useEffect(() => {
    if (!socket) return;
    const handleView = (data: any) => {
      if (data?.phone) {
        const clean = data.phone.replace(/\D/g, '');
        setRecentStoryViewers((prev) => new Set([...Array.from(prev), clean]));
      }
      fetchRecentStoryViewers();
    };
    const handlePosted = () => {
      fetchRecentStoryViewers();
    };
    socket.on('story_view_detected', handleView);
    socket.on('radar:story-view', handleView);
    socket.on('radar:story-posted', handlePosted);
    return () => {
      socket.off('story_view_detected', handleView);
      socket.off('radar:story-view', handleView);
      socket.off('radar:story-posted', handlePosted);
    };
  }, [socket, fetchRecentStoryViewers]);

  // Carrega contatos silenciados e mensagens agendadas salvos no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('versus_muted_chats');
      if (saved) setMutedContactIds(JSON.parse(saved));
      const savedPinned = localStorage.getItem('versus_pinned_chats');
      if (savedPinned) setPinnedContactIds(JSON.parse(savedPinned));
      const savedFavs = localStorage.getItem('versus_favorite_chats');
      if (savedFavs) setFavoriteContactIds(JSON.parse(savedFavs));
      const savedArchived = localStorage.getItem('versus_archived_chats');
      if (savedArchived) setArchivedContactIds(JSON.parse(savedArchived));
      const savedSched = localStorage.getItem('versus_scheduled_messages');
      if (savedSched) setScheduledMessagesByChat(JSON.parse(savedSched));

      const savedCols = localStorage.getItem('crm_columns');
      if (savedCols) {
        const parsed = JSON.parse(savedCols);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((col: any) => ({
            id: col.id,
            title: col.title,
            color: col.color || 'text-cyan-400',
            bgLight: col.bgLight || 'bg-cyan-500/15',
            dotColor: col.color ? col.color.replace('text-', 'bg-') : 'bg-cyan-400',
            borderLight: col.borderLight || 'border-cyan-500/40'
          }));
          setCrmStages(mapped);
        }
      }
    } catch (e) {}
  }, []);

  // Sincroniza mensagens agendadas do backend para o chat ativo
  useEffect(() => {
    if (!activeChat) return;
    api.get(`/conversations/${activeChat}/scheduled`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setScheduledMessagesByChat(prev => {
            const updated = { ...prev, [activeChat]: res.data };
            try {
              localStorage.setItem('versus_scheduled_messages', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [activeChat]);

  // Sincroniza todos os agendamentos da empresa ao abrir a Central Global
  useEffect(() => {
    if (!showGlobalScheduleCenter) return;
    api.get('/conversations/scheduled/all')
      .then(res => {
        if (Array.isArray(res.data)) {
          const mapped: { [chatId: string]: ScheduledMessage[] } = {};
          res.data.forEach((item: any) => {
            const cId = item.conversationId;
            if (!mapped[cId]) mapped[cId] = [];
            mapped[cId].push({
              id: item.id,
              conversationId: item.conversationId,
              content: item.content,
              scheduledAt: item.scheduledAt,
              status: item.status,
              createdAt: item.createdAt,
            });
          });
          setScheduledMessagesByChat(prev => {
            const merged = { ...prev, ...mapped };
            try {
              localStorage.setItem('versus_scheduled_messages', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [showGlobalScheduleCenter]);


  const saveScheduledMessages = (updated: { [chatId: string]: ScheduledMessage[] }) => {
    setScheduledMessagesByChat(updated);
    try {
      localStorage.setItem('versus_scheduled_messages', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleScheduleSuccess = (newScheduled: any) => {
    if (!activeChat) return;
    const currentList = scheduledMessagesByChat[activeChat] || [];
    const updated = {
      ...scheduledMessagesByChat,
      [activeChat]: [...currentList, newScheduled]
    };
    saveScheduledMessages(updated);
  };

  const handleCancelScheduled = async (id: string) => {
    if (!activeChat) return;
    try {
      await api.delete(`/conversations/messages/${id}/schedule`).catch(() => {});
    } catch (e) {}
    const currentList = scheduledMessagesByChat[activeChat] || [];
    const updated = {
      ...scheduledMessagesByChat,
      [activeChat]: currentList.filter(item => item.id !== id)
    };
    saveScheduledMessages(updated);
  };

  // Fecha menus contextuais e popovers ao clicar fora ou rolar
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('#chat-context-menu')) return;
      setContextMenuContactId(null);
      setChatContextMenu(null);
      setShowMuteSubmenu(false);
      setShowChatOptionsMenu(false);
    };
    const handleWindowBlurOrScroll = () => {
      setChatContextMenu(null);
      setShowMuteSubmenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleWindowBlurOrScroll);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleWindowBlurOrScroll);
    };
  }, []);

  // Marcar conversa como lida / não lida
  const handleToggleRead = async (contactId: string) => {
    const target = contacts.find(c => c.id === contactId);
    const isCurrentlyUnread = (target?.unread || 0) > 0;
    const newUnread = isCurrentlyUnread ? 0 : 1;

    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unread: newUnread, hasNewMessage: !isCurrentlyUnread } : c));
    setContextMenuContactId(null);
    setChatContextMenu(null);

    try {
      if (isCurrentlyUnread) {
        await api.patch(`/conversations/${contactId}/read`);
      } else {
        await api.patch(`/conversations/${contactId}/unread`);
      }
    } catch (err) {
      console.warn("Erro ao atualizar status de leitura:", err);
    }
  };

  // Alternar fixação da conversa no topo (WhatsApp Web)
  const handleTogglePin = (contactId: string) => {
    setPinnedContactIds(prev => {
      const isPinned = prev.includes(contactId);
      const updated = isPinned ? prev.filter(id => id !== contactId) : [...prev, contactId];
      try {
        localStorage.setItem('versus_pinned_chats', JSON.stringify(updated));
      } catch (e) {}
      toast.success(isPinned ? "Conversa desafixada" : "Conversa fixada no topo");
      return updated;
    });
    setChatContextMenu(null);
  };

  // Alternar favorito do contato
  const handleToggleFavorite = (contactId: string) => {
    setFavoriteContactIds(prev => {
      const isFav = prev.includes(contactId);
      const updated = isFav ? prev.filter(id => id !== contactId) : [...prev, contactId];
      try {
        localStorage.setItem('versus_favorite_chats', JSON.stringify(updated));
      } catch (e) {}
      toast.success(isFav ? "Removido dos Favoritos" : "Adicionado aos Favoritos");
      return updated;
    });
    setChatContextMenu(null);
  };

  // Alternar arquivamento da conversa
  const handleToggleArchive = (contactId: string) => {
    setArchivedContactIds(prev => {
      const isArchived = prev.includes(contactId);
      const updated = isArchived ? prev.filter(id => id !== contactId) : [...prev, contactId];
      try {
        localStorage.setItem('versus_archived_chats', JSON.stringify(updated));
      } catch (e) {}
      toast.success(isArchived ? "Conversa desarquivada" : "Conversa arquivada");
      return updated;
    });
    setChatContextMenu(null);
  };

  // Silenciar notificações com duração
  const handleMuteDuration = (contactId: string, durationLabel: string) => {
    setMutedContactIds(prev => {
      const updated = prev.includes(contactId) ? prev : [...prev, contactId];
      try {
        localStorage.setItem('versus_muted_chats', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    toast.success(`Notificações silenciadas (${durationLabel})`);
    setChatContextMenu(null);
    setShowMuteSubmenu(false);
  };

  // Reativar notificações
  const handleUnmute = (contactId: string) => {
    setMutedContactIds(prev => {
      const updated = prev.filter(id => id !== contactId);
      try {
        localStorage.setItem('versus_muted_chats', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    toast.success("Notificações reativadas");
    setChatContextMenu(null);
    setShowMuteSubmenu(false);
  };

  // Alternar silenciamento de notificações simples
  const handleToggleMute = (contactId: string) => {
    setMutedContactIds(prev => {
      const isMuted = prev.includes(contactId);
      const updated = isMuted ? prev.filter(id => id !== contactId) : [...prev, contactId];
      try {
        localStorage.setItem('versus_muted_chats', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setContextMenuContactId(null);
    setChatContextMenu(null);
  };

  // Limpar conversa
  const handleClearConversation = async (contactId: string) => {
    setChatContextMenu(null);
    if (!window.confirm("Deseja realmente limpar as mensagens desta conversa?")) return;
    try {
      await api.delete(`/conversations/${contactId}/messages`);
      if (activeChat === contactId) {
        setMessages([]);
      }
      refetchConversations();
      toast.success("Conversa limpa com sucesso!");
    } catch (err) {
      console.error("Erro ao limpar conversa:", err);
      toast.error("Não foi possível limpar a conversa.");
    }
  };

  // Finalizar atendimento via menu de contexto
  const handleResolveFromMenu = async (contactId: string) => {
    setChatContextMenu(null);
    try {
      await api.patch(`/conversations/${contactId}/status`, { status: 'resolved' });
      if (activeChat === contactId) {
        setActiveChat(null);
      }
      refetchConversations();
      toast.success("Atendimento finalizado com sucesso!");
    } catch (err) {
      console.error("Erro ao finalizar atendimento:", err);
      toast.error("Erro ao finalizar conversa.");
    }
  };

  // Ignorar atendimento ou finalizar
  const handleIgnoreOrResolve = async (contactId: string) => {
    setContextMenuContactId(null);
    try {
      await api.patch(`/conversations/${contactId}/ignore`);
      if (activeChat === contactId) {
        setActiveChat(null);
      }
      refetchConversations();
    } catch (err) {
      console.error("Erro ao ignorar atendimento:", err);
    }
  };

  // Exportar histórico completo da conversa para arquivo .txt
  const handleExportConversation = () => {
    if (!activeContactData) return;
    const lines = [
      "=================================================================",
      "VALLOR OMNICHANNEL - TRANSCRIÇÃO OFICIAL DE CONVERSA",
      `Contato: ${activeContactData.name || 'Cliente'}`,
      `Telefone: ${activeContactData.phone || 'Não informado'}`,
      `Data de Exportação: ${new Date().toLocaleString('pt-BR')}`,
      `Total de Mensagens: ${messages.length}`,
      "=================================================================\n"
    ];

    messages.forEach((m, idx) => {
      const time = new Date(m.createdAt || Date.now()).toLocaleString('pt-BR');
      const sender = m.isInternal 
        ? '[NOTA INTERNA]' 
        : (m.direction === 'OUTBOUND' ? '[ATENDENTE]' : (m.senderType === 'system' ? `[IA ${aiAgentName.toUpperCase()}]` : `[${activeContactData.name}]`));
      
      let text = m.content || '';
      if (m.type === 'audio') {
        text = `[ÁUDIO / VOZ] ${m.audioTranscription ? `(Transcrição: "${m.audioTranscription}")` : ''} - ${m.mediaUrl || ''}`;
      } else if (m.type === 'image') {
        text = `[IMAGEM ANEXA] ${m.mediaUrl || ''} ${m.content ? `- "${m.content}"` : ''}`;
      } else if (m.type === 'document') {
        text = `[DOCUMENTO / PDF] ${m.mediaUrl || ''} ${m.content ? `- "${m.content}"` : ''}`;
      }

      lines.push(`${idx + 1}. [${time}] ${sender}: ${text}`);
    });

    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (activeContactData.name || 'chat').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `conversa_${cleanName}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fecha o Lightbox ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  // Download direto de imagem com nome formatado
  const handleDownloadImage = async (url: string, title?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanExt = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(cleanExt) ? cleanExt : 'jpg';
      const cleanTitle = (title && title !== 'Imagem' && title !== 'Anexo') 
        ? title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
        : `vallor_midia_${Date.now()}`;
      link.download = cleanTitle.endsWith(`.${ext}`) ? cleanTitle : `${cleanTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback padrão
      const link = document.createElement('a');
      link.href = url;
      link.download = `vallor_midia_${Date.now()}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getMediaUrl = (url?: string | null, type?: string) => {
    if (!url) return '';
    // Links criptografados temporários do CDN interno do WhatsApp (.enc ou mmg.whatsapp.net com token expirado)
    // não podem ser acessados diretamente pelo navegador pois retornam 403 Forbidden e são binários criptografados
    if (url.includes('mmg.whatsapp.net') && (url.includes('.enc') || url.includes('/v/t62.') || url.includes('oe='))) {
      return '';
    }

    // Suporte a arquivos e mídias do Google Drive
    if (isGoogleDriveUrl(url)) {
      const driveId = extractGoogleDriveId(url);
      if (driveId) {
        if (type === 'image') {
          // CDN direta de imagem do Google para exibição instantânea na tag <img>
          return `https://lh3.googleusercontent.com/d/${driveId}`;
        }
        if (type === 'video') {
          // Streaming proxy com headers corretos de vídeo reproduzível em HTML5
          return `/api-backend/media/drive-stream/${driveId}?name=video.mp4`;
        }
        if (type === 'document') {
          return `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
        }
        return `https://lh3.googleusercontent.com/d/${driveId}`;
      }
    }

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('/api-backend/')) {
      return url;
    }
    if (url.startsWith('/media/')) {
      return `/api-backend${url}`;
    }
    const cleanFilename = url.replace(/^.*[\\\/]/, '');
    if (type === 'audio' || /\.(ogg|opus|mp3|m4a|wav|webm)($|\?)/i.test(cleanFilename)) {
      return `/api-backend/media/audio/${cleanFilename}`;
    }
    return `/api-backend/media/file/${cleanFilename}`;
  };

  const getAudioSrc = (url?: string | null) => getMediaUrl(url, 'audio');

  const getLoggedInUserName = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem('versus_user');
      if (stored) {
        const u = JSON.parse(stored);
        return (u.name || '').trim();
      }
    } catch (e) {}
    return '';
  };

  const isLidPhoneNumber = (rawPhone?: string) => {
    if (!rawPhone) return false;
    const cleanJid = rawPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
    const clean = cleanJid.replace(/\D/g, '');
    return cleanJid.includes('@lid') || (clean.length > 13 && !clean.startsWith('55'));
  };

  const formatPhoneNumber = (rawPhone?: string) => {
    if (!rawPhone) return '';
    const cleanJid = rawPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');
    const clean = cleanJid.replace(/\D/g, '');

    // Se for um LID do WhatsApp (identificador técnico de 14 ou 15 dígitos, ou contiver @lid)
    if (cleanJid.includes('@lid') || (clean.length > 13 && !clean.startsWith('55'))) {
      return 'WhatsApp Contato';
    }

    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    } else if (clean.length === 12 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
    } else if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    } else if (clean.length >= 8 && clean.length <= 13) {
      return clean.startsWith('55') ? `+${clean}` : clean;
    }

    return 'WhatsApp Contato';
  };

  const formatDisplayPhoneNumber = (rawPhone?: string) => {
    if (!rawPhone) return 'Sem telefone';
    return formatPhoneNumber(rawPhone);
  };

  const getContactDisplayName = (name?: string | null, phone?: string | null, overrideOperatorName?: string | null) => {
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();

    // Se o contato tiver um nome salvo/real, SEMPRE exibir o nome do contato!
    const isPureDigits = /^\d+$/.test(cleanName);
    const isGenericOrMasked = 
      !cleanName ||
      cleanName === '.' ||
      cleanName === '-' ||
      cleanName === 'Cliente WhatsApp' ||
      cleanName.includes('@lid') ||
      cleanName.includes('@s.whatsapp.net') ||
      cleanName.startsWith('WhatsApp') ||
      cleanName.toLowerCase() === 'sem nome' ||
      cleanName.toLowerCase() === 'cliente' ||
      (isPureDigits && cleanName.length >= 10);

    if (isGenericOrMasked) {
      if (cleanPhone && !cleanPhone.includes('@lid')) {
        const formatted = formatPhoneNumber(cleanPhone);
        if (formatted) return formatted;
      }
      return cleanName && !isPureDigits && cleanName !== '.' && cleanName !== '-' ? cleanName : 'Cliente WhatsApp';
    }

    return cleanName;
  };

  const formatContactDisplayName = (name?: string | null, phone?: string | null) => {
    return getContactDisplayName(name, phone, getLoggedInUserName());
  };

  const formatCardTimestamp = (rawDate?: string | Date | null) => {
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return '';
      
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();
      if (isYesterday) {
        return 'Ontem';
      }

      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 7 && diffDays > 0) {
        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        return weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '');
      }

      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return '';
    }
  };

  const getContactInitials = (name?: string | null, phone?: string | null) => {
    const displayName = getContactDisplayName(name, phone, getLoggedInUserName());
    if (!displayName || displayName === 'Cliente WhatsApp') {
      if (phone && !phone.includes('@lid')) {
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 2) return clean.slice(-2);
      }
      return 'WA';
    }
    const cleanDigits = displayName.replace(/\D/g, '');
    if (displayName.startsWith('+') || cleanDigits.length >= 8) {
      return cleanDigits.length >= 2 ? cleanDigits.slice(-2) : 'WA';
    }
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'WA';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const SUGGESTED_TAGS = ['Lead Quente', 'Suporte VIP', 'Negociação', 'Financeiro', 'Aguardando'];

  const handleQuickAddTag = async (e: React.MouseEvent, contactId: string, tagToAdd: string) => {
    e.stopPropagation();
    if (!tagToAdd.trim()) return;

    const target = contacts.find(c => c.contactId === contactId || c.id === contactId);
    if (!target) return;

    const actualContactId = target.contactId || target.id;
    const current = target.tags || [];
    if (current.includes(tagToAdd.trim())) {
      setTaggingContactId(null);
      setCustomTagInput('');
      return;
    }

    const updated = [...current, tagToAdd.trim()];
    try {
      await api.patch(`/contacts/${actualContactId}/tags`, { tags: updated });
      setContacts(prev => prev.map(c => (c.contactId === actualContactId || c.id === contactId) ? { ...c, tags: updated } : c));
      setTaggingContactId(null);
      setCustomTagInput('');
    } catch (err) {
      console.error("Erro ao adicionar tag rápida", err);
    }
  };

  const handleInsertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) {
      setInputText(prev => `${prev}${prefix}${suffix}`);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const text = inputText;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || ''}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setInputText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = selected ? start + replacement.length : start + prefix.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setInputText(prev => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const text = inputText;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setInputText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = start + emoji.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Gravação de áudio não suportada pelo seu navegador.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const options = typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')
        ? { mimeType: 'audio/ogg; codecs=opus' }
        : typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm; codecs=opus')
          ? { mimeType: 'audio/webm; codecs=opus' }
          : undefined;

      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões de mídia.");
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const stopAndSendAudio = async () => {
    if (!mediaRecorderRef.current || !activeChat) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsSendingAudio(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const recordedMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType });
        const localPreviewUrl = URL.createObjectURL(audioBlob);

        const formData = new FormData();
        const ext = recordedMimeType.includes('ogg') ? 'ogg' : 'webm';
        const filename = `voice_${Date.now()}.${ext}`;
        formData.append('file', audioBlob, filename);
        formData.append('type', 'audio');
        formData.append('content', '🎤 Mensagem de voz');
        formData.append('isInternal', String(isInternalMode));
        if (activeInstance?.id) {
          formData.append('instanceId', activeInstance.id);
        }

        // Envia via FormData para o backend processar, converter se necessário e disparar na ponta final do WhatsApp
        const { data } = await api.post(`/conversations/${activeChat}/messages/audio`, formData);
        
        const messageToAdd = {
          ...data,
          mediaUrl: data.mediaUrl || localPreviewUrl,
        };
        setMessages((prev) => [...prev, messageToAdd]);

        if (!isInternalMode) {
          setContacts((prev) =>
            prev.map((c) =>
              c.id === activeChat
                ? { ...c, lastMsg: '🎤 Mensagem de voz' }
                : c
            )
          );
        }
      } catch (error) {
        console.error("Erro ao enviar áudio gravado:", error);
        alert("Erro ao processar e enviar áudio gravado.");
      } finally {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setIsSendingAudio(false);
        setRecordingTime(0);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayAudio = (id: string, url: string) => {
    if (!url) return;
    let safeUrl = url;
    if (safeUrl.startsWith('/media/')) {
      safeUrl = `/api-backend${safeUrl}`;
    }
    if (playingAudioId === id) {
      if (audioElementsRef.current[id]) {
        audioElementsRef.current[id].pause();
      }
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      if (!audioElementsRef.current[id]) {
        const audio = new Audio(safeUrl);
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = (e) => {
          console.error("Erro ao carregar/reproduzir áudio:", e);
          setPlayingAudioId(null);
          toast.error("Não foi possível carregar a mensagem de áudio.");
        };
        audioElementsRef.current[id] = audio;
      }
      audioElementsRef.current[id].play().catch(err => {
        console.error("Erro no play() do áudio:", err);
        setPlayingAudioId(null);
      });
      setPlayingAudioId(id);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChat) return;
    if (!confirm("Deseja apagar esta mensagem? Esta ação removerá a mensagem do histórico.")) {
      return;
    }

    try {
      await api.delete(`/conversations/${activeChat}/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Mensagem apagada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao apagar mensagem:", err);
      toast.error(err.response?.data?.message || "Erro ao apagar mensagem.");
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeChat) return;
    try {
      setIsDeletingConv(true);
      await api.delete(`/conversations/${activeChat}`);
      const chatToDelete = activeChat;
      setMessages([]);
      setContacts(prev => prev.filter(c => c.id !== chatToDelete));
      delete messagesCacheRef.current[chatToDelete];
      setActiveChat(null);
      setShowDeleteConvModal(false);
      setShowChatOptionsMenu(false);
      toast.success("Conversa apagada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao apagar conversa:", err);
      toast.error(err.response?.data?.message || "Erro ao apagar conversa.");
    } finally {
      setIsDeletingConv(false);
    }
  };

  const loadQuickReplies = useCallback(async () => {
    try {
      const res = await api.get('/quick-replies');
      if (Array.isArray(res.data)) {
        setQuickReplies(res.data);
      }
    } catch (err) {
      console.error("Erro ao carregar respostas rápidas:", err);
    }
  }, []);

  useEffect(() => {
    loadQuickReplies();
  }, [loadQuickReplies, activeChat]);

  // Lista unificada de Respostas Rápidas e Catálogo de Mídias via Google Drive disparados por "/"
  const slashItems = useMemo(() => {
    const items: Array<{
      id: string;
      category: 'reply' | 'catalog' | 'action';
      shortcut: string;
      title: string;
      description: string;
      iconType: 'zap' | 'image' | 'file' | 'audio' | 'catalog';
      content?: string;
      type?: 'text' | 'document' | 'image' | 'video';
      mediaUrl?: string | null;
      fileName?: string | null;
      mediaFiles?: Array<{ url: string; driveId?: string; type: string; fileName: string }>;
      isMedia?: boolean;
      imageCount?: number;
      videoCount?: number;
      docCount?: number;
      action?: () => void;
    }> = [];

    // 1. Respostas Rápidas e Catálogo vindos do banco de dados (por tenant)
    if (Array.isArray(quickReplies) && quickReplies.length > 0) {
      quickReplies.forEach(qr => {
        const sc = qr.shortcut.startsWith('/') ? qr.shortcut : `/${qr.shortcut}`;
        let mediaFiles: Array<{ url: string; driveId?: string; type: string; fileName: string }> = [];

        if (Array.isArray(qr.mediaFiles) && qr.mediaFiles.length > 0) {
          mediaFiles = qr.mediaFiles;
        } else if (qr.mediaUrl) {
          const trimmed = qr.mediaUrl.trim();
          if (trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) mediaFiles = parsed;
            } catch {}
          }
          if (mediaFiles.length === 0 && qr.type !== 'text') {
            mediaFiles = [{
              url: qr.mediaUrl,
              driveId: qr.mediaDriveId || undefined,
              type: qr.type || 'image',
              fileName: qr.fileName || 'arquivo'
            }];
          }
        }

        const isMedia = mediaFiles.length > 0 || Boolean(qr.type && qr.type !== 'text' && qr.mediaUrl);
        const imageCount = qr.imageCount !== undefined ? qr.imageCount : mediaFiles.filter(m => m.type === 'image').length;
        const videoCount = qr.videoCount !== undefined ? qr.videoCount : mediaFiles.filter(m => m.type === 'video').length;
        const docCount = qr.docCount !== undefined ? qr.docCount : mediaFiles.filter(m => m.type === 'document').length;
        const type = (qr.type || 'text') as 'text' | 'document' | 'image' | 'video';

        let iconType: 'zap' | 'image' | 'file' | 'audio' | 'catalog' = 'zap';
        if (type === 'document' || docCount > 0) iconType = 'file';
        else if (type === 'video' || videoCount > 0) iconType = 'catalog';
        else if (type === 'image' || imageCount > 0) iconType = 'image';

        items.push({
          id: `qr-${qr.id}`,
          category: isMedia ? 'catalog' : 'reply',
          shortcut: sc,
          title: qr.title || sc,
          description: qr.content || qr.fileName || '',
          iconType,
          content: qr.content,
          type,
          mediaUrl: qr.mediaUrl,
          fileName: qr.fileName,
          mediaFiles,
          isMedia,
          imageCount,
          videoCount,
          docCount,
        });
      });
    }

    // Atalho garantido para Catálogo se o banco não tiver
    const hasCatalogo = items.some(i => i.shortcut.toLowerCase().includes('cat'));
    if (!hasCatalogo) {
      items.push({
        id: 'action-catalogo',
        category: 'reply',
        shortcut: '/catalogo',
        title: 'Catálogo Verto Oficial',
        description: 'Apresentação comercial e catálogo técnico completo Verto Soluções Agrícolas',
        iconType: 'catalog',
        content: 'Confira nosso catálogo oficial com todas as soluções completas!',
        type: 'text'
      });
    }

    // 2. Ações Rápidas de Mídia e Utilitários (Foto, Documento, Áudio)
    items.push(
      {
        id: 'action-foto',
        category: 'action',
        shortcut: '/foto',
        title: 'Anexar Imagem / Foto',
        description: 'Anexar imagem, foto ou vídeo da galeria local',
        iconType: 'image',
        action: () => fileInputImageRef.current?.click()
      },
      {
        id: 'action-arquivo',
        category: 'action',
        shortcut: '/arquivo',
        title: 'Anexar Documento',
        description: 'Anexar arquivo PDF, planilha ou proposta comercial',
        iconType: 'file',
        action: () => fileInputDocRef.current?.click()
      },
      {
        id: 'action-audio',
        category: 'action',
        shortcut: '/audio',
        title: 'Gravar Áudio de Voz',
        description: 'Iniciar gravação de voz com transcrição automática',
        iconType: 'audio',
        action: () => startRecording()
      }
    );

    return items;
  }, [quickReplies]);

  const filteredSlashItems = useMemo(() => {
    const q = quickReplyFilter.toLowerCase().trim();
    if (!q) return slashItems;
    return slashItems.filter(item => 
      item.shortcut.toLowerCase().replace('/', '').includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.fileName && item.fileName.toLowerCase().includes(q))
    );
  }, [slashItems, quickReplyFilter]);

  const handleSendMediaSlashItem = async (item: typeof slashItems[0]) => {
    if (!activeChat) {
      toast.error('Selecione uma conversa para enviar o material.');
      return;
    }

    setInputText('');
    setShowQuickReplies(false);

    const mediaList = (item.mediaFiles && item.mediaFiles.length > 0)
      ? item.mediaFiles
      : (item.mediaUrl ? [{ url: item.mediaUrl, type: item.type || 'document', fileName: item.fileName || 'arquivo' }] : []);

    if (mediaList.length === 0) return;

    const countLabel = mediaList.length > 1 ? ` (${mediaList.length} mídias)` : '';
    const toastId = toast.loading(`Enviando ${item.title || 'material'}${countLabel} via WhatsApp...`);

    try {
      for (let i = 0; i < mediaList.length; i++) {
        const m = mediaList[i];
        const mType = (m.type || item.type || 'image') as string;
        const isFirst = i === 0;

        // Legenda no primeiro envio para acompanhar o pacote
        const content = isFirst ? (item.content || item.title || item.shortcut || '') : '';
        const filename = m.fileName || (mType === 'document' ? 'catalogo.pdf' : mType === 'video' ? 'video.mp4' : 'imagem.jpg');

        const payload: any = {
          content: content || undefined,
          isInternal: isInternalMode,
          type: mType,
          mediaUrl: m.url,
          filename,
          ...(replyingToMessage && isFirst ? { quotedMessageId: replyingToMessage.id } : {}),
          ...(activeInstance?.id ? { instanceId: activeInstance.id } : {})
        };

        const { data } = await api.post(`/conversations/${activeChat}/messages`, payload);
        setMessages(prev => [...prev, data]);

        if (mediaList.length > 1 && i < mediaList.length - 1) {
          // Pequeno intervalo entre envios de lote para integridade do Baileys
          await new Promise(r => setTimeout(r, 450));
        }
      }

      setReplyingToMessage(null);
      toast.success(`${item.title || 'Material'} enviado com sucesso via WhatsApp!`, { id: toastId });

      if (!isInternalMode) {
        setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, lastMsg: `[${item.type?.toUpperCase() || 'CATÁLOGO'}] ${item.title || item.shortcut}` } : c));
      }

      if (isResolved) {
        api.patch(`/conversations/${activeChat}/reopen`).then(() => refetchConversations()).catch(() => {});
      }
    } catch (err: any) {
      console.error('Erro ao enviar material via atalho:', err);
      toast.error(err.response?.data?.message || 'Falha ao enviar arquivo via WhatsApp.', { id: toastId });
    }
  };

  const handleSelectSlashItem = (item: typeof slashItems[0]) => {
    setShowQuickReplies(false);
    setQuickReplyIndex(0);

    if (item.action) {
      setInputText('');
      item.action();
    } else if (item.isMedia) {
      handleSendMediaSlashItem(item);
    } else if (item.content) {
      setInputText(item.content);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(item.content!.length, item.content!.length);
        }
      }, 50);
    }
  };

  // Listener de URL (contactId ou conversationId): auto-identifica aba e abre o chat diretamente
  useEffect(() => {
    if (!contactIdParam && !conversationIdParam) return;

    let isMounted = true;
    const loadConversationFromUrl = async () => {
      try {
        let conv: any = null;
        if (conversationIdParam) {
          const res = await api.get(`/conversations/${conversationIdParam}`);
          conv = res.data;
        } else if (contactIdParam) {
          const res = await api.get(`/conversations/contact/${contactIdParam}`);
          conv = res.data;
        }

        if (!conv || !isMounted) return;

        let currentUserId = '';
        try {
          const userStr = localStorage.getItem('versus_user');
          if (userStr) {
            currentUserId = JSON.parse(userStr)?.id || '';
          }
        } catch (e) {}

        let targetTab: 'waiting' | 'mine' | 'resolved' = 'waiting';
        if (conv.status === 'resolved' || conv.status === 'closed') {
          targetTab = 'resolved';
        } else if (conv.assignedTo && conv.assignedTo === currentUserId) {
          targetTab = 'mine';
        } else if (conv.status === 'human_takeover' || conv.status === 'open' || conv.assignedTo) {
          targetTab = 'mine';
        } else {
          targetTab = 'waiting';
        }

        // Garante que o filtro de abas e setores não oculte o contato vindo do CRM
        setActiveFilterTab('all');
        setActiveTab(targetTab);
        setSelectedDepartmentFilter('all');
        setOnlyUnread(false);
        setSearchQuery('');

        const lastMessageObj = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
        const lastMsg = lastMessageObj ? lastMessageObj.content : 'Nova conversa';
        const rawAvatar = conv.contact?.avatarUrl;
        const cleanAvatar = sanitizeAvatarUrl(rawAvatar);
        const formattedContact = {
          id: conv.id,
          contactId: conv.contact?.id || '',
          name: formatContactDisplayName(conv.contact?.name, conv.contact?.phone),
          phone: conv.contact?.phone || '',
          email: conv.contact?.email || '',
          avatarUrl: cleanAvatar,
          tags: conv.contact?.tags || [],
          lastMsg: lastMsg,
          lastMessage: lastMsg,
          lastMessageType: lastMessageObj?.type || 'text',
          lastMessageDirection: lastMessageObj?.direction || null,
          time: lastMessageObj ? formatCardTimestamp(lastMessageObj.createdAt) : '',
          updatedAt: conv.updatedAt,
          isPinned: !!(conv.contact?.phone?.includes('556699844152') || (conv.contact?.name && conv.contact.name.toLowerCase().includes('trojan'))),
          lastMessageDate: lastMessageObj?.createdAt || conv.createdAt,
          isAi: conv.status === 'bot_active',
          unread: 0,
          status: conv.status,
          assignedTo: conv.assignedTo,
          assignedUser: conv.assignedUser,
          departmentId: conv.departmentId,
          department: conv.department
        };

        setContacts(prev => {
          const existingIndex = prev.findIndex(c => c.id === conv.id || (conv.contact?.id && c.contactId === conv.contact.id));
          if (existingIndex >= 0) {
            const copy = [...prev];
            copy[existingIndex] = { ...copy[existingIndex], ...formattedContact };
            return copy;
          }
          return [formattedContact, ...prev];
        });

        setUrlLoadedContact(formattedContact);
        setActiveChat(conv.id);
      } catch (err) {
        console.error("Erro ao carregar conversa a partir dos parâmetros de URL:", err);
      }
    };

    loadConversationFromUrl();
    return () => { isMounted = false; };
  }, [contactIdParam, conversationIdParam]);

  const { tenantId: effectiveTenantId } = getEffectiveTenantContext();
  const tenantKey = effectiveTenantId || 'default_tenant';

  const { data: tabCounts, refetch: refetchCounts } = useQuery({
    queryKey: ['conversationCounts', tenantKey, selectedDepartmentFilter],
    queryFn: async () => {
      try {
        const deptParam = selectedDepartmentFilter && selectedDepartmentFilter !== 'all' ? `?departmentId=${selectedDepartmentFilter}` : '';
        const { data } = await api.get(`/conversations/counts${deptParam}`);
        return data;
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: productivityData, refetch: refetchProductivity } = useQuery({
    queryKey: ['operatorProductivity', tenantKey],
    queryFn: async () => {
      try {
        const { data } = await api.get('/conversations/operator-productivity');
        return data;
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const { data: directoryContacts = [] } = useQuery({
    queryKey: ['directoryContacts', tenantKey],
    queryFn: async () => {
      try {
        const { data } = await api.get('/contacts');
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          state: c.state,
          city: c.city,
          departmentId: c.departmentId,
          department: c.department,
          avatarUrl: sanitizeAvatarUrl(c.avatarUrl),
          tags: c.tags || []
        }));
      } catch (e) {
        return [];
      }
    },
    enabled: showContactsModal,
    staleTime: 30000,
  });

  // Resolve de forma inteligente a Região/Setor e sua cor oficial cadastrada para qualquer cliente
  const resolveContactDepartment = useCallback((contact: any): { id?: string; name: string; color: string } | null => {
    if (!contact) return null;

    // 1. Busca direta na lista viva de departamentos pelo ID (reflete edições de cor e novas regiões na hora)
    const targetDeptId = contact.departmentId || contact.department?.id;
    if (targetDeptId && departments.length > 0) {
      const liveById = departments.find((d: any) => d.id === targetDeptId);
      if (liveById && liveById.color) {
        return { id: liveById.id, name: liveById.name, color: liveById.color };
      }
    }

    // 2. Se já vier com objeto department e cor definida no próprio registro
    if (contact.department?.color) {
      if (departments.length > 0 && contact.department.name) {
        const liveByName = departments.find(
          (d: any) => d.name?.trim().toUpperCase() === contact.department.name?.trim().toUpperCase()
        );
        if (liveByName?.color) {
          return { id: liveByName.id, name: liveByName.name, color: liveByName.color };
        }
      }
      return {
        id: contact.department.id,
        name: contact.department.name || 'Setor',
        color: contact.department.color,
      };
    }

    // 3. Se tiver nome de departamento mas sem cor, busca na lista viva de departamentos
    if (contact.department?.name && departments.length > 0) {
      const liveByName = departments.find(
        (d: any) => d.name?.trim().toUpperCase() === contact.department.name?.trim().toUpperCase()
      );
      if (liveByName?.color) {
        return { id: liveByName.id, name: liveByName.name, color: liveByName.color };
      }
    }

    // 4. Se for um item da Agenda de Contatos (directoryContacts), verifica se há conversa ativa correspondente
    const matchingConv = contacts.find(
      (c: any) =>
        (contact.id && (c.contactId === contact.id || c.id === contact.id)) ||
        (contact.phone && c.phone && c.phone === contact.phone)
    );
    if (matchingConv?.department?.color) {
      return {
        id: matchingConv.department.id,
        name: matchingConv.department.name || 'Setor',
        color: matchingConv.department.color,
      };
    }
    if (matchingConv?.departmentId && departments.length > 0) {
      const fromConvDept = departments.find((d: any) => d.id === matchingConv.departmentId);
      if (fromConvDept?.color) {
        return { id: fromConvDept.id, name: fromConvDept.name, color: fromConvDept.color };
      }
    }

    // 5. Inferência inteligente por UF ou DDD do telefone usando os departamentos reais cadastrados
    if (departments.length > 0 && (contact.phone || contact.state)) {
      const dddToUf: Record<string, string> = {
        '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
        '47': 'SC', '48': 'SC', '49': 'SC',
        '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
        '67': 'MS', '65': 'MT', '66': 'MT',
        '91': 'PA', '93': 'PA', '94': 'PA', '69': 'RO', '95': 'RR', '68': 'AC', '92': 'AM', '97': 'AM', '96': 'AP',
        '62': 'GO', '64': 'GO', '61': 'DF',
        '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
        '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
        '21': 'RJ', '22': 'RJ', '24': 'RJ', '27': 'ES', '28': 'ES',
        '63': 'TO', '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
        '98': 'MA', '99': 'MA', '86': 'PI', '89': 'PI',
        '85': 'CE', '88': 'CE', '84': 'RN', '83': 'PB', '79': 'SE', '81': 'PE', '87': 'PE', '82': 'AL'
      };
      const ufToRegion: Record<string, number> = {
        'RS': 1, 'SC': 1, 'PR': 1,
        'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
        'GO': 3, 'MG': 3, 'SP': 3, 'DF': 3, 'RJ': 3, 'ES': 3,
        'TO': 4, 'BA': 4,
        'MA': 5, 'PI': 5,
        'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
      };

      let uf = contact.state ? String(contact.state).trim().toUpperCase() : '';
      if (!uf && contact.phone && !String(contact.phone).includes('@lid')) {
        const clean = String(contact.phone).replace(/\D/g, '');
        let ddd = '';
        if (clean.startsWith('55') && clean.length >= 12) ddd = clean.substring(2, 4);
        else if (clean.length === 10 || clean.length === 11) ddd = clean.substring(0, 2);
        if (ddd && dddToUf[ddd]) uf = dddToUf[ddd];
        else if (clean.startsWith('595')) uf = 'RS';
      }

      if (uf) {
        const byUfToken = departments.find((d: any) =>
          new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(String(d.name || '').toUpperCase())
        );
        if (byUfToken?.color) {
          return { id: byUfToken.id, name: byUfToken.name, color: byUfToken.color };
        }
        const regNum = ufToRegion[uf];
        if (regNum) {
          const byRegNum = departments.find((d: any) => {
            const upper = String(d.name || '').toUpperCase();
            return upper.includes(`REGIÃO ${regNum}`) || upper.includes(`REGIAO ${regNum}`);
          });
          if (byRegNum?.color) {
            return { id: byRegNum.id, name: byRegNum.name, color: byRegNum.color };
          }
        }
      }
    }

    return null;
  }, [departments, contacts]);

  const queryTab = (activeFilterTab === 'unread' || activeFilterTab === 'all') ? 'all' : activeFilterTab;

  const { data: initialContacts, isLoading, error: fetchErrorQuery, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', tenantKey, activeFilterTab, selectedDepartmentFilter, searchQuery.trim()],
    queryFn: async () => {
      const deptQuery = selectedDepartmentFilter && selectedDepartmentFilter !== 'all' ? `&departmentId=${selectedDepartmentFilter}` : '';
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '';
      const { data } = await api.get(`/conversations?tab=${queryTab}${deptQuery}${searchParam}`);
      return data.map((conv: any) => {
        const lastMessageObj = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
        const lastMsg = lastMessageObj ? lastMessageObj.content : 'Nova conversa';
        const rawAvatar = conv.contact?.avatarUrl;
        const cleanAvatar = sanitizeAvatarUrl(rawAvatar);
        return {
          id: conv.id,
          contactId: conv.contact?.id || '',
          name: formatContactDisplayName(conv.contact?.name, conv.contact?.phone),
          phone: conv.contact?.phone || '',
          email: conv.contact?.email || '',
          avatarUrl: cleanAvatar,
          tags: conv.contact?.tags || [],
          lastMsg: lastMsg,
          lastMessage: lastMsg,
          lastMessageType: lastMessageObj?.type || 'text',
          lastMessageDirection: lastMessageObj?.direction || null,
          time: lastMessageObj ? formatCardTimestamp(lastMessageObj.createdAt) : '',
          updatedAt: conv.updatedAt,
          isPinned: !!(conv.contact?.phone?.includes('556699844152') || (conv.contact?.name && conv.contact.name.toLowerCase().includes('trojan'))),
          lastMessageDate: lastMessageObj?.createdAt || conv.createdAt,
          isAi: conv.status === 'bot_active',
          unread: 0,
          status: conv.status,
          assignedTo: conv.assignedTo,
          assignedUser: conv.assignedUser,
          departmentId: conv.departmentId,
          department: conv.department
        };
      });
    },
    staleTime: 4000,
    refetchInterval: isConnected ? 30000 : 5000, // Sincronização em tempo real quando socket desconectado (fallback Vercel)
    retry: false,
    refetchOnWindowFocus: false, // Otimização de performance: evita requisição pesada ao alternar janelas
  });

  // Limpa o indicador global de não lidas ao entrar na tela de Atendimento
  useEffect(() => {
    clearGlobalUnread();
  }, [clearGlobalUnread]);

  // 1. Sincronizar dados da API com o estado local e resetar chat ativo caso não pertença à aba
  useEffect(() => {
    if (initialContacts) {
      setContacts(prev => {
        const contactToKeep = (activeChat ? prev.find(c => c.id === activeChat) : null) || urlLoadedContact;
        if (contactToKeep && !initialContacts.some((c: any) => c.id === contactToKeep.id)) {
          return [contactToKeep, ...initialContacts];
        }
        return initialContacts;
      });

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('versus_inbox_contacts_cache', JSON.stringify(initialContacts.slice(0, 50)));
        } catch {}
      }

      setActiveChat(prev => {
        if (!prev) return null;
        if (conversationIdParam && prev === conversationIdParam) return prev;
        const exists = initialContacts.some((c: any) => c.id === prev);
        return exists ? prev : (conversationIdParam || contactIdParam ? prev : null);
      });
    }
  }, [initialContacts, conversationIdParam, contactIdParam, activeChat, urlLoadedContact]);


  useEffect(() => {
    if (fetchErrorQuery) {
      setFetchError((fetchErrorQuery as any).message || "Falha de rede");
    }
  }, [fetchErrorQuery]);

  // Sincronização e Hidratação Retroativa de Mensagens Offline (24h)
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const lastSyncTimestampRef = useRef<number>(0);

  const handleSyncOfflineMessages = useCallback(async (showToast = false, force = false) => {
    const now = Date.now();
    // Previne requisições desnecessárias repetidas a cada troca de aba (cooldown de 5 minutos, a menos que forçado pelo usuário)
    if (!force) {
      if (now - lastSyncTimestampRef.current < 5 * 60 * 1000) return;
      try {
        const storedLastSync = sessionStorage.getItem('versus_last_inbox_sync');
        if (storedLastSync && now - Number(storedLastSync) < 5 * 60 * 1000) return;
      } catch {}
    }

    lastSyncTimestampRef.current = now;
    try {
      sessionStorage.setItem('versus_last_inbox_sync', String(now));
    } catch {}

    setIsSyncingOffline(true);
    try {
      const res = await api.post(`/chat/sync${force ? '?force=true' : ''}`);
      const { syncedCount = 0, updatedCount = 0 } = res.data || {};
      if (syncedCount > 0 || updatedCount > 0) {
        refetchConversations();
        refetchCounts();
        if (showToast) {
          toast.success(`Sincronização concluída: ${syncedCount} novas mensagens e ${updatedCount} atualizadas.`);
        }
      } else if (showToast) {
        toast.success("Mensagens e contatos já estão 100% atualizados!");
      }
    } catch (err) {
      console.warn("Falha silenciosa na sincronização retroativa:", err);
      if (showToast) {
        toast.error("Falha ao sincronizar mensagens da Evolution API.");
      }
    } finally {
      setIsSyncingOffline(false);
    }
  }, [refetchConversations, refetchCounts]);

  // Disparo obrigatório automático ao abrir o Inbox (hidratação offline 24h com cooldown)
  useEffect(() => {
    handleSyncOfflineMessages(false, false);
  }, [handleSyncOfflineMessages]);

  // 2. Buscar mensagens quando o chat ativo mudar
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      // 1. Render instantâneo da conversa da memória (0ms percebido)
      if (messagesCacheRef.current[activeChat] && messagesCacheRef.current[activeChat].length > 0) {
        setMessages(messagesCacheRef.current[activeChat]);
        setTimeout(() => {
          scrollToBottom('auto');
        }, 10);
      }

      try {
        const { data } = await api.get(`/conversations/${activeChat}/messages`);
        if (Array.isArray(data)) {
          messagesCacheRef.current[activeChat] = data;
          setMessages(prev => {
            const hasChanged = prev.length !== data.length || 
              (prev.length > 0 && data.length > 0 && prev[prev.length - 1].id !== data[data.length - 1].id);
            if (hasChanged) {
              setTimeout(() => {
                scrollToBottom(prev.length === 0 ? 'auto' : 'smooth');
              }, 50);
              return data;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
      }
    };

    const fetchScheduled = async () => {
      try {
        const { data } = await api.get(`/conversations/${activeChat}/scheduled`);
        if (Array.isArray(data)) {
          setScheduledMessagesByChat(prev => {
            const updated = { ...prev, [activeChat]: data };
            try { localStorage.setItem('versus_scheduled_messages', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
        }
      } catch (e) {}
    };

    fetchMessages();
    fetchScheduled();

    // Sincronização inteligente: 3s quando WebSocket desconectado (fallback Vercel), 30s quando conectado
    const pollInterval = isConnected ? 30000 : 3000;
    const backgroundChatInterval = setInterval(() => {
      fetchMessages();
    }, pollInterval);

    return () => clearInterval(backgroundChatInterval);
  }, [activeChat, isConnected]);

  // 3. Ouvir WebSocket para mensagens em tempo real
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (data: any) => {
      console.log('Nova Mensagem via WebSocket:', data);

      // Mantém o cache local em memória sincronizado em tempo real
      if (data.conversationId) {
        if (!messagesCacheRef.current[data.conversationId]) {
          messagesCacheRef.current[data.conversationId] = [];
        }
        if (!messagesCacheRef.current[data.conversationId].some((m: any) => m.id === data.id)) {
          messagesCacheRef.current[data.conversationId].push(data);
        }
      }
      
      // Se a mensagem for para a conversa ativa, joga na tela
      if (activeChat === data.conversationId) {
        setMessages((prev) => {
          // Evita duplicação se o usuário for quem enviou (a API já adicionou no state local)
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }

      // Atualiza os contadores das abas em tempo real
      refetchCounts();

      // Atualiza a lista lateral
      setContacts((prev) => {
        const idx = prev.findIndex(c => c.id === data.conversationId);
        
        if (idx === -1) {
          // Sincroniza via React Query respeitando a aba e filtros atuais
          refetchConversations();
          return prev;
        }
        
        const updatedContacts = [...prev];
        const contact = updatedContacts.splice(idx, 1)[0];
        contact.lastMsg = data.content;
        contact.time = formatCardTimestamp(data.createdAt || Date.now());
        
        if (data.departmentId) {
          contact.departmentId = data.departmentId;
        }
        if (data.department) {
          contact.department = data.department;
        }

        if (data.contact) {
          const sanitizedNewAvatar = sanitizeAvatarUrl(data.contact.avatarUrl);
          if (sanitizedNewAvatar && (!contact.avatarUrl || contact.avatarUrl !== sanitizedNewAvatar)) {
            contact.avatarUrl = sanitizedNewAvatar;
          }
          if (data.contact.name && data.contact.name !== 'Cliente WhatsApp' && !data.contact.name.includes('@lid')) {
            contact.name = data.contact.name;
          }
        }

        // Efeito Visual de Pulsar para novas mensagens
        if (data.direction === 'INBOUND' && activeChat !== data.conversationId) {
          contact.hasNewMessage = true;
          contact.unread = (contact.unread || 0) + 1;
        }
        
        return [contact, ...updatedContacts];
      });
    };

    const handleConversationUpdated = (data: any) => {
      console.log('Conversation Updated via WebSocket:', data);
      if (!data) return;

      setContacts((prev) =>
        prev.map((c) => {
          const isTarget = c.id === data.id || 
            (data.contactId && c.contactId === data.contactId) || 
            (data.contact && (c.contactId === data.contact.id || c.id === data.contact.id || (data.contact.phone && c.phone === data.contact.phone)));

          if (isTarget) {
            const rawAvatar = data.contact?.avatarUrl || c.avatarUrl;
            const cleanAvatar = sanitizeAvatarUrl(rawAvatar);
            const newName = (data.contact?.name && data.contact.name !== 'Cliente WhatsApp' && !data.contact.name.includes('@lid')) ? data.contact.name : c.name;
            const newStatus = data.status !== undefined ? data.status : c.status;
            return {
              ...c,
              name: newName,
              avatarUrl: cleanAvatar,
              phone: data.contact?.phone || c.phone,
              status: newStatus,
              isAi: newStatus === 'bot_active',
              assignedTo: data.assignedTo !== undefined ? data.assignedTo : c.assignedTo,
              assignedUser: data.assignedUser !== undefined ? data.assignedUser : c.assignedUser,
              departmentId: data.departmentId !== undefined ? data.departmentId : c.departmentId,
              department: data.department !== undefined ? data.department : c.department,
            };
          }
          return c;
        })
      );

      // Revalida a lista e os contadores de forma consistente
      refetchConversations();
      refetchCounts();
    };

    const handleConversationTransferred = (transferData: any) => {
      console.log('Conversation Transferred via WebSocket:', transferData);
      if (transferData?.conversationId) {
        setContacts((prev) =>
          prev.map((c) => {
            if (c.id === transferData.conversationId) {
              return {
                ...c,
                departmentId: transferData.department?.id || transferData.departmentId || c.departmentId,
                department: transferData.department !== undefined ? transferData.department : c.department,
                assignedTo: transferData.assignedTo !== undefined ? transferData.assignedTo : c.assignedTo,
                assignedUser: transferData.assignedUser !== undefined ? transferData.assignedUser : c.assignedUser,
                status: transferData.assignedTo ? 'open' : 'waiting',
                isAi: false,
              };
            }
            return c;
          })
        );
      }
      refetchConversations();
      refetchCounts();
    };

    const handleContactUpdated = (contactData: any) => {
      console.log('Contact Updated via WebSocket:', contactData);
      if (!contactData) return;
      setContacts((prev) =>
        prev.map((c) => {
          if (c.contactId === contactData.id || c.id === contactData.id || (contactData.phone && c.phone === contactData.phone)) {
            const rawAvatar = contactData.avatarUrl;
            const cleanAvatar = sanitizeAvatarUrl(rawAvatar) || sanitizeAvatarUrl(c.avatarUrl);
            const newName = (contactData.name && contactData.name !== 'Cliente WhatsApp' && !contactData.name.includes('@lid')) ? contactData.name : c.name;
            return {
              ...c,
              name: newName,
              avatarUrl: cleanAvatar,
              phone: contactData.phone || c.phone,
            };
          }
          return c;
        })
      );
    };

    const handleMessageStatusUpdated = (data: { messageId?: string; providerMessageId?: string; status: string; conversationId?: string }) => {
      if (data.status === 'no_whatsapp') {
        toast.error('⚠️ Contato sem WhatsApp ativo ou número inválido!');
      }
      setMessages((prev) =>
        prev.map((m) => {
          if (
            (data.messageId && m.id === data.messageId) ||
            (data.providerMessageId && m.providerMessageId === data.providerMessageId)
          ) {
            return { ...m, status: data.status };
          }
          return m;
        })
      );
      if (data.conversationId && messagesCacheRef.current[data.conversationId]) {
        messagesCacheRef.current[data.conversationId] = messagesCacheRef.current[data.conversationId].map((m) => {
          if (
            (data.messageId && m.id === data.messageId) ||
            (data.providerMessageId && m.providerMessageId === data.providerMessageId)
          ) {
            return { ...m, status: data.status };
          }
          return m;
        });
      }
    };

    const handleMessageDeleted = (data: { conversationId: string; messageId: string }) => {
      console.log('Message Deleted via WebSocket:', data);
      if (data.conversationId === activeChat) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    const handleConversationDeleted = (data: { conversationId: string }) => {
      console.log('Conversation Deleted via WebSocket:', data);
      setContacts((prev) => prev.filter((c) => c.id !== data.conversationId));
      delete messagesCacheRef.current[data.conversationId];
      if (data.conversationId === activeChat) {
        setActiveChat(null);
        setMessages([]);
      }
    };

    const handleMessageTranscribed = (payload: { messageId: string; conversationId: string; audioTranscription: string }) => {
      if (activeChat === payload.conversationId || !activeChat) {
        setMessages(prev =>
          prev.map(m =>
            m.id === payload.messageId
              ? { ...m, audioTranscription: payload.audioTranscription }
              : m
          )
        );
        setExpandedTranscriptions(prev => ({
          ...prev,
          [payload.messageId]: true,
        }));
      }
    };

    const handleMessageReactionUpdated = (payload: { messageId: string; conversationId: string; reactions: any }) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === payload.messageId
            ? { ...m, reactions: payload.reactions }
            : m
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('conversationUpdated', handleConversationUpdated);
    socket.on('conversationTransferred', handleConversationTransferred);
    socket.on('contactUpdated', handleContactUpdated);
    socket.on('messageStatusUpdated', handleMessageStatusUpdated);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('conversationDeleted', handleConversationDeleted);
    socket.on('messageTranscribed', handleMessageTranscribed);
    socket.on('messageReactionUpdated', handleMessageReactionUpdated);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('conversationUpdated', handleConversationUpdated);
      socket.off('conversationTransferred', handleConversationTransferred);
      socket.off('contactUpdated', handleContactUpdated);
      socket.off('messageStatusUpdated', handleMessageStatusUpdated);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('conversationDeleted', handleConversationDeleted);
      socket.off('messageTranscribed', handleMessageTranscribed);
      socket.off('messageReactionUpdated', handleMessageReactionUpdated);
    };
  }, [socket, activeChat, activeTab, activeFilterTab, selectedDepartmentFilter, refetchConversations, refetchCounts]);

  // Transcrição de áudio sob demanda (on-demand) com Whisper
  const handleTranscribeAudio = async (messageId: string) => {
    if (!messageId || transcribingMessageIds[messageId]) return;
    setTranscribingMessageIds(prev => ({ ...prev, [messageId]: true }));
    try {
      const res = await api.post(`/conversations/messages/${messageId}/transcribe`);
      const transcription = res.data?.audioTranscription;
      if (transcription) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, audioTranscription: transcription } : m
          )
        );
        setExpandedTranscriptions(prev => ({ ...prev, [messageId]: true }));
        toast.success('Áudio transcrito com sucesso!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao transcrever áudio.';
      toast.error(msg);
    } finally {
      setTranscribingMessageIds(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Análise visual de imagem sob demanda com IA (GPT-4o Vision)
  const handleAnalyzeImage = async (messageId: string) => {
    if (!messageId || analyzingImageIds[messageId]) return;
    setAnalyzingImageIds(prev => ({ ...prev, [messageId]: true }));
    try {
      const res = await api.post(`/conversations/messages/${messageId}/analyze-image`);
      const newContent = res.data?.content;
      if (newContent) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, content: newContent } : m
          )
        );
        setExpandedImageAnalyses(prev => ({ ...prev, [messageId]: true }));
        toast.success('Imagem analisada com sucesso!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao analisar imagem com IA.';
      toast.error(msg);
    } finally {
      setAnalyzingImageIds(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Derivar contato ativo (com fallback robusto para contatos carregados via URL/CRM)
  const activeContactData = useMemo(() => {
    if (!activeChat) return null;
    const found = contacts.find(c => c.id === activeChat || (c.contactId && urlLoadedContact?.contactId && c.contactId === urlLoadedContact.contactId));
    if (found) return found;
    if (urlLoadedContact && (urlLoadedContact.id === activeChat || urlLoadedContact.contactId === activeChat)) {
      return urlLoadedContact;
    }
    return null;
  }, [activeChat, contacts, urlLoadedContact]);

  // Busca o estágio atual e os dados do deal no CRM para o contato selecionado
  useEffect(() => {
    if (!activeContactData?.contactId) {
      setCurrentDeal(null);
      setCurrentDealStage(null);
      return;
    }
    api.get(`/deals/contact/${activeContactData.contactId}`)
      .then(res => {
        if (res.data) {
          setCurrentDeal(res.data);
          setCurrentDealStage(res.data.status || null);
        } else {
          setCurrentDeal(null);
          setCurrentDealStage(null);
        }
      })
      .catch(() => {
        setCurrentDeal(null);
        setCurrentDealStage(null);
      });
  }, [activeContactData?.contactId]);

  // Busca o status/story mais recente visualizado pelo contato selecionado (últimas 24h)
  useEffect(() => {
    const phone = activeContactData?.phone?.replace(/\D/g, '');
    if (!phone) {
      setContactLatestStory(null);
      return;
    }
    api.get(`/crm/radar-stories/contact-latest-view?phone=${phone}&contactId=${activeContactData?.contactId || activeContactData?.id || ''}`)
      .then((res) => {
        setContactLatestStory(res.data || null);
      })
      .catch(() => {
        setContactLatestStory(null);
      });
  }, [activeContactData?.phone, activeContactData?.contactId, activeContactData?.id, showContactInfo]);

  const handleMoveContactToStage = async (stageId: string, stageTitle: string) => {
    if (!activeContactData?.contactId) {
      toast.error('Nenhum contato selecionado.');
      return;
    }
    setIsMovingStage(true);
    try {
      await api.post('/deals/move-contact', {
        contactId: activeContactData.contactId,
        stageId,
        title: activeContactData.name || 'Nova Oportunidade',
      });
      setCurrentDealStage(stageId);
      setShowCrmDropdown(false);
      toast.success(`Lead movido para ${stageTitle}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao mover lead no CRM.');
    } finally {
      setIsMovingStage(false);
    }
  };

  const handleSaveContactPhone = async () => {
    if (!activeContactData?.contactId) return;
    setIsSavingPhone(true);
    try {
      const clean = editingPhoneValue.trim();
      await api.patch(`/contacts/${activeContactData.contactId}`, { phone: clean });
      setContacts(prev => prev.map(c => {
        if (c.contactId === activeContactData.contactId || c.id === activeChat) {
          return { ...c, phone: clean };
        }
        return c;
      }));
      setIsEditingPhone(false);
      toast.success('Número de telefone atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar telefone: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveContactName = async () => {
    if (!activeContactData?.contactId) return;
    setIsSavingName(true);
    try {
      const clean = editingNameValue.trim();
      if (!clean) {
        toast.error('O nome do contato não pode ser vazio.');
        return;
      }
      await api.patch(`/contacts/${activeContactData.contactId}`, { name: clean });
      setContacts(prev => prev.map(c => {
        if (c.contactId === activeContactData.contactId || c.id === activeChat) {
          return { ...c, name: clean };
        }
        return c;
      }));
      setIsEditingName(false);
      toast.success('Nome do contato atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar nome: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingName(false);
    }
  };

  const currentStageObj = crmStages.find(s => s.id === currentDealStage);

  const handleTakeover = async (targetChatId?: string) => {
    const targetId = targetChatId || activeChat;
    if (!targetId) return;
    try {
      await api.patch(`/conversations/${targetId}/takeover`);
      setIsPeeking(false);
      setShowTakeoverModal(false);
      setSelectedQueueChat(null);
      setActiveFilterTab('mine');
      setActiveTab('mine');
      setActiveChat(targetId);
      setContacts(prev => prev.map(c => c.id === targetId ? { ...c, status: 'human_takeover', isAi: false, assignedTo: 'me' } : c));
      refetchConversations();
    } catch (error) {
      console.error("Erro ao assumir conversa", error);
    }
  };

  const handleRelease = async () => {
    if (!activeChat) return;
    try {
      await api.patch(`/conversations/${activeChat}/release`);
      setActiveChat(null); // Deseleciona o chat
      refetchConversations();
      refetchCounts();
      refetchProductivity();
    } catch (error) {
      console.error("Erro ao finalizar", error);
    }
  };

  const [isReturningToBot, setIsReturningToBot] = useState(false);
  const handleReturnToBot = async () => {
    if (!activeChat || isReturningToBot) return;
    try {
      setIsReturningToBot(true);
      await api.patch(`/conversations/${activeChat}/return-to-bot`);
      toast.success("Atendimento devolvido com sucesso para a IA!");
      refetchConversations();
      refetchCounts();
    } catch (error: any) {
      console.error("Erro ao devolver para IA", error);
      toast.error(error.response?.data?.message || "Erro ao devolver para IA");
    } finally {
      setIsReturningToBot(false);
    }
  };

  const handleReopen = async () => {
    if (!activeChat) return;
    try {
      setIsReopening(true);
      await api.patch(`/conversations/${activeChat}/reopen`);
      setActiveFilterTab('waiting');
      setActiveTab('waiting');
      refetchConversations();
    } catch (error: any) {
      console.error("Erro ao reabrir atendimento", error);
      alert(`Erro ao reabrir atendimento: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsReopening(false);
    }
  };


  const handleSendReopenTemplate = async (templateName: string = 'hello_world') => {
    if (!activeChat || isSendingTemplate) return;
    setIsSendingTemplate(true);
    try {
      const res = await api.post(`/conversations/${activeChat}/template`, { templateName });
      toast.success('Modelo HSM enviado com sucesso!');
      setShowTemplateModal(false);
      if (res.data?.message) {
        setMessages(prev => [...prev, res.data.message]);
        if (messagesCacheRef.current[activeChat]) {
          messagesCacheRef.current[activeChat] = [...messagesCacheRef.current[activeChat], res.data.message];
        }
      }
    } catch (err: any) {
      console.error('Erro ao enviar modelo HSM:', err);
      toast.error(err.response?.data?.message || 'Falha ao enviar modelo HSM.');
    } finally {
      setIsSendingTemplate(false);
    }
  };

  const loadDepartmentsAndShowTransfer = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
      setShowTransferModal(true);
    } catch (e) {
      console.error("Erro ao buscar deptos", e);
    }
  };

  const handleTransfer = async (departmentId: string, userId?: string) => {
    const targetId = selectedQueueChat?.id || activeChat;
    if (!targetId) return;
    try {
      await api.patch(`/conversations/${targetId}/transfer`, { departmentId, userId });
      setShowTransferModal(false);
      setShowTakeoverModal(false);
      setSelectedQueueChat(null);
      toast.success(userId ? 'Conversa atribuída ao atendente!' : 'Conversa transferida para o setor com sucesso!');
      refetchConversations();
      refetchCounts();
    } catch (e: any) {
      console.error("Erro ao transferir", e);
      toast.error(e.response?.data?.message || "Erro ao transferir conversa.");
    }
  };

  const handleSendMessage = async () => {
    if (!activeChat || (!inputText.trim() && !selectedFile)) return;
    
    const content = inputText;
    const fileToUpload = selectedFile;

    setInputText(""); // limpa o input
    setShowAttachments(false);
    setSelectedFile(null);
    
    let mediaUrl = null;
    let type = 'text';

    if (fileToUpload) {
      type = fileToUpload.type.startsWith('image/') ? 'image' : fileToUpload.type.startsWith('audio/') ? 'audio' : 'document';
      
      try {
        setIsUploadingMedia(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('folder', 'chat');

        const { data: uploadRes } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes?.url) {
          mediaUrl = uploadRes.url;
        }
      } catch (uploadErr: any) {
        console.error("Erro no upload de arquivo pelo backend:", uploadErr);
      } finally {
        setIsUploadingMedia(false);
      }
    }

    try {
      const payload: any = { 
        content: content || (fileToUpload ? fileToUpload.name : ''),
        isInternal: isInternalMode,
        type,
        ...(activeInstance?.id ? { instanceId: activeInstance.id } : {})
      };
      
      if (mediaUrl) {
        payload.mediaUrl = mediaUrl;
      }

      if (replyingToMessage) {
        payload.quotedMessageId = replyingToMessage.id;
        setReplyingToMessage(null);
      }
      
      const { data } = await api.post(`/conversations/${activeChat}/messages`, payload);
      setMessages(prev => [...prev, data]);
      if (data?.status === 'no_whatsapp') {
        toast.error('⚠️ Contato sem WhatsApp ativo ou número inválido!');
      }
      
      // Auto-assume a conversa se era robô, já que um humano mandou a mensagem
      if (!isInternalMode) {
        setContacts(prev => prev.map(c => c.id === activeChat ? { ...c, lastMsg: content } : c));
      }

      // Se o atendimento estava finalizado, reabre automaticamente no backend
      if (isResolved) {
        api.patch(`/conversations/${activeChat}/reopen`).then(() => {
          refetchConversations();
        }).catch(err => {
          console.error("Erro ao auto-reabrir conversa finalizada", err);
        });
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem", error);
      alert(`ERRO AO ENVIAR: ${error.response?.data?.message || error.message || 'Erro Desconhecido'}`);
    }
  };

  const handleForwardMessageToContact = async (targetContact: any) => {
    if (!forwardingMessage || isForwardingMessage) return;
    setIsForwardingMessage(true);
    setForwardingTargetId(targetContact.id);
    const toastId = toast.loading("Encaminhando mensagem...");

    try {
      const isVoiceOrAudio = forwardingMessage.type === 'audio' || forwardingMessage.type === 'voice';
      const payload: any = {
        content: forwardingMessage.content || (isVoiceOrAudio ? '🎤 Mensagem de voz' : ''),
        type: isVoiceOrAudio ? 'audio' : (forwardingMessage.type || 'text'),
        ...(forwardingMessage.mediaUrl ? { mediaUrl: forwardingMessage.mediaUrl } : {}),
        isInternal: false,
        ...(activeInstance?.id ? { instanceId: activeInstance.id } : {})
      };

      let targetConvId = targetContact.conversationId || targetContact.id;
      let sentData: any = null;

      // Se o targetContact não é uma conversa direta e é um contato de agenda:
      if (!targetContact.isConversation && !targetContact.contactId && targetContact.phone) {
        try {
          const { data } = await api.post(`/conversations/contact/${targetContact.id}/messages`, payload);
          sentData = data;
        } catch (contactErr) {
          // Se falhou por contactId, tenta resolver a conversa
          const { data: conv } = await api.get(`/conversations/contact/${targetContact.id}`);
          if (conv?.id) {
            targetConvId = conv.id;
            const { data } = await api.post(`/conversations/${targetConvId}/messages`, payload);
            sentData = data;
          } else {
            throw contactErr;
          }
        }
      } else {
        const { data } = await api.post(`/conversations/${targetConvId}/messages`, payload);
        sentData = data;
      }

      toast.success(
        isVoiceOrAudio 
          ? `Áudio encaminhado para ${formatContactDisplayName(targetContact.name, targetContact.phone)}!`
          : `Mensagem encaminhada para ${formatContactDisplayName(targetContact.name, targetContact.phone)}!`,
        { id: toastId }
      );

      // Se encaminhou para a conversa que está aberta agora, insere no chat local
      if (sentData && (targetConvId === activeChat || targetContact.id === activeChat)) {
        setMessages((prev) => [...prev, sentData]);
      }

      setForwardingMessage(null);
      setForwardSearchQuery('');
      refetchConversations();
    } catch (err: any) {
      console.error("Erro ao encaminhar:", err);
      toast.error(`Erro ao encaminhar: ${err.response?.data?.message || err.message || 'Erro de conexão'}`, { id: toastId });
    } finally {
      setIsForwardingMessage(false);
      setForwardingTargetId(null);
    }
  };

  const handleRetryFailedMessage = async (failedMsg: any) => {
    if (!activeChat || !failedMsg) return;
    try {
      const payload: any = {
        content: failedMsg.content,
        isInternal: false,
        type: failedMsg.type || 'text',
        ...(failedMsg.mediaUrl ? { mediaUrl: failedMsg.mediaUrl } : {}),
        ...(activeInstance?.id ? { instanceId: activeInstance.id } : {})
      };
      setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
      await api.delete(`/conversations/${activeChat}/messages/${failedMsg.id}`).catch(() => {});
      const { data } = await api.post(`/conversations/${activeChat}/messages`, payload);
      setMessages(prev => [...prev, data]);
      if (data?.status === 'no_whatsapp') {
        toast.error('⚠️ Contato sem WhatsApp ativo ou número inválido!');
      }
      toast.success("Mensagem reenviada!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao reenviar mensagem.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowAttachments(false);
    }
  };

  const handleAddTag = async (contactId: string) => {
    if (!newTagInput.trim()) return;
    
    const targetContact = contacts.find(c => c.contactId === contactId);
    if (!targetContact) return;
    
    // Supondo que tags vem no objeto contact
    const currentTags = targetContact.tags || [];
    if (currentTags.includes(newTagInput.trim())) {
      setNewTagInput('');
      return;
    }
    
    const updatedTags = [...currentTags, newTagInput.trim()];
    
    try {
      await api.patch(`/contacts/${contactId}/tags`, { tags: updatedTags });
      // Atualiza estado local
      setContacts(prev => prev.map(c => c.contactId === contactId ? { ...c, tags: updatedTags } : c));
      setNewTagInput('');
    } catch (e) {
      console.error("Erro ao adicionar tag", e);
    }
  };

  const handleRemoveTag = async (contactId: string, tagToRemove: string) => {
    const targetContact = contacts.find(c => c.contactId === contactId);
    if (!targetContact) return;
    
    const updatedTags = (targetContact.tags || []).filter((t: string) => t !== tagToRemove);
    
    try {
      await api.patch(`/contacts/${contactId}/tags`, { tags: updatedTags });
      setContacts(prev => prev.map(c => c.contactId === contactId ? { ...c, tags: updatedTags } : c));
    } catch (e) {
      console.error("Erro ao remover tag", e);
    }
  };

  const handleTabChange = (newTab: 'waiting' | 'mine' | 'resolved') => {
    if (activeTab === newTab) return;
    setActiveTab(newTab);
    // Reset imediato se o chat ativo não pertencer à nova fila
    setActiveChat((current) => {
      if (!current) return null;
      const chat = contacts.find(c => c.id === current);
      if (!chat) return null;
      if (newTab === 'waiting' && chat.status !== 'waiting' && chat.status !== 'bot_active') return null;
      if (newTab === 'mine' && chat.status !== 'open' && chat.status !== 'human_takeover' && chat.status !== 'in_progress') return null;
      if (newTab === 'resolved' && chat.status !== 'resolved' && chat.status !== 'closed') return null;
      return current;
    });
  };

  // Base de contatos garantindo que contato carregado via URL permaneça mesmo se não estiver no top 500
  const baseContacts = useMemo(() => {
    if (urlLoadedContact && !contacts.some(c => c.id === urlLoadedContact.id || (c.contactId && c.contactId === urlLoadedContact.contactId))) {
      return [urlLoadedContact, ...contacts];
    }
    return contacts;
  }, [contacts, urlLoadedContact]);

  // Filtro de busca e abas sobre os contatos da lista (Padrão WhatsApp Web - Otimizado com useMemo)
  const filteredContacts = useMemo(() => {
    const isMaster = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

    const filtered = baseContacts.filter(c => {
      // Regra de Ouro: se esta conversa é a atualmente aberta (activeChat), NUNCA oculta da lista
      if (activeChat && (c.id === activeChat || (urlLoadedContact && c.id === urlLoadedContact.id))) return true;

      // Quando estiver pesquisando, ignora filtros de aba para exibir o resultado global encontrado
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const phoneDigits = searchQuery.replace(/\D/g, "");
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && (c.phone.toLowerCase().includes(q) || (phoneDigits.length >= 4 && c.phone.replace(/\D/g, "").includes(phoneDigits)))) ||
          (c.lastMsg && c.lastMsg.toLowerCase().includes(q))
        );
      }

      // Oculta conversas arquivadas da listagem principal (a menos que esteja pesquisando)
      if (archivedContactIds.includes(c.id)) {
        return false;
      }

      if (activeFilterTab === 'unread' && !((c.unread || 0) > 0 || c.hasNewMessage)) return false;
      if (activeFilterTab === 'waiting' && !(c.status === 'waiting' || c.status === 'bot_active' || (!c.assignedTo && c.status !== 'resolved' && c.status !== 'closed'))) return false;
      if (activeFilterTab === 'mine') {
        const isAssignedToMe = currentUserId ? c.assignedTo === currentUserId : true;
        if (!isMaster) {
          if (!isAssignedToMe) return false;
        } else {
          if (!(isAssignedToMe || c.status === 'open' || c.status === 'human_takeover' || c.status === 'in_progress' || !!c.assignedTo)) return false;
        }
      }
      if (activeFilterTab === 'resolved' && !(c.status === 'resolved' || c.status === 'closed')) return false;
      if (onlyUnread && !((c.unread || 0) > 0 || c.hasNewMessage)) return false;
      if (selectedDepartmentFilter && selectedDepartmentFilter !== 'all') {
        if (c.departmentId !== selectedDepartmentFilter) return false;
      }

      return true;
    });

    // Ordenação com conversas fixadas no topo (Padrão WhatsApp Web)
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedContactIds.includes(a.id) || !!a.isPinned;
      const bPinned = pinnedContactIds.includes(b.id) || !!b.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [baseContacts, activeChat, urlLoadedContact, activeFilterTab, onlyUnread, selectedDepartmentFilter, searchQuery, currentUserId, currentUserRole, archivedContactIds, pinnedContactIds]);

  // Paginação progressiva virtualizada da lista (limite inicial de 40 para garantir 60 FPS)
  const [displayLimit, setDisplayLimit] = useState(40);

  useEffect(() => {
    setDisplayLimit(40);
  }, [activeFilterTab, selectedDepartmentFilter, searchQuery]);

  const visibleContacts = useMemo(() => {
    const list = filteredContacts.slice(0, displayLimit);
    if (activeChat && !list.some(c => c.id === activeChat)) {
      const activeItem = filteredContacts.find(c => c.id === activeChat);
      if (activeItem) return [activeItem, ...list];
    }
    return list;
  }, [filteredContacts, displayLimit, activeChat]);

  // Calcular total de contatos com mensagens não lidas e contadores de abas
  const unreadCount = contacts.filter(c => (c.unread || 0) > 0 || c.hasNewMessage).length;
  const waitingCount = tabCounts?.waiting ?? contacts.filter(c => c.status === 'waiting' || c.status === 'bot_active' || (!c.assignedTo && c.status !== 'resolved' && c.status !== 'closed')).length;
  const mineCount = tabCounts?.mine ?? contacts.filter(c => {
    const isMaster = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';
    const isAssignedToMe = currentUserId ? c.assignedTo === currentUserId : true;
    if (!isMaster) return isAssignedToMe;
    return isAssignedToMe || c.status === 'open' || c.status === 'human_takeover' || c.status === 'in_progress' || !!c.assignedTo;
  }).length;
  const resolvedCount = tabCounts?.resolved ?? contacts.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  const isResolved = activeContactData?.status === 'resolved' || activeContactData?.status === 'closed';

  // Dados de produtividade diária (Widget "Seu Dia" padrão Lero)
  const currentFormattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const currentUserName = (() => {
    try {
      const userStr = localStorage.getItem('versus_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return u.name || 'Operador';
      }
    } catch (e) {}
    return 'Operador';
  })();

  const todayFinishedCount = productivityData?.todayFinishedCount ?? 0;
  const dailyGoal = productivityData?.dailyGoal ?? 10;
  const finishedVsAveragePercent = productivityData?.finishedVsAveragePercent ?? 0;
  const avgDaily = productivityData?.avgDaily ?? 0;
  const todayAvgTma = productivityData?.todayAvgTma ?? "0 min";
  const todayFirstResp = productivityData?.todayFirstResp ?? "0s";

  return (
    <div className={`vallor-inbox-root flex h-full w-full ${isWhatsApp ? 'bg-[#0B141A]' : 'bg-[#E2E8F0] dark:bg-[#050814]'} text-slate-900 dark:text-slate-100 overflow-hidden`}>
      
      {/* 1. PAINEL ESQUERDO: Lista de Conversas (Transição por Camada de Cor sem Bordas Duras) */}
      <div 
        style={{
          width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${sidebarWidth}px` : undefined,
          minWidth: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${MIN_SIDEBAR_WIDTH}px` : undefined,
          maxWidth: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${MAX_SIDEBAR_WIDTH}px` : undefined,
        }}
        className={`vallor-inbox-col ${activeChat ? 'hidden md:flex' : 'flex'} w-full flex-shrink-0 ${isWhatsApp ? 'bg-[#18262E]' : 'bg-[#EDF2F7] dark:bg-[#121F3B]'} flex-col overflow-hidden z-10 relative`}
      >
        
        {/* Header Superior WhatsApp (Foto de Perfil da Linha Principal & Status - Sem borda inferior desalinhada) */}
        <div className="h-16 px-3.5 bg-transparent flex items-center justify-between shrink-0">
          {(() => {
            const effectiveStatus = activeInstance ? activeInstance.status : (waStatus?.status || 'disconnected');
            const isWaConnected = effectiveStatus === 'connected';
            const isWaConnecting = effectiveStatus === 'connecting' || effectiveStatus === 'qrcode';
            const instancePic = activeInstance?.profilePicUrl || waStatus?.profilePicUrl;
            const instanceName = activeInstance?.name || waStatus?.instanceName || 'Linha Principal';
            const hasActiveStories = activeLineStories.length > 0;
            const totalActiveViews = activeLineStories.reduce((acc, s) => acc + (Number(s.viewsCount) || 0), 0);

            return (
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {/* Botão de Menu para Mobile (quando Topbar está oculta para tela cheia) */}
                <button
                  type="button"
                  onClick={toggleMenu}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Abrir menu de navegação"
                >
                  <Menu size={18} />
                </button>

                {/* Foto de Perfil Circular da Instância (Linha Principal) - Clicar abre o Story igual no WhatsApp */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasActiveStories) {
                      setStoryViewerModal({
                        isOpen: true,
                        currentIndex: 0,
                        showViewersDrawer: false,
                      });
                    } else {
                      setShowInstanceDropdown(prev => !prev);
                    }
                  }}
                  className="relative shrink-0 cursor-pointer group/lineAvatar"
                  title={
                    hasActiveStories
                      ? `Clique para visualizar ${activeLineStories.length === 1 ? 'o Story ativo' : `os ${activeLineStories.length} Stories ativos`} da ${instanceName}`
                      : 'Clique para alternar linha / instância WhatsApp'
                  }
                >
                  <div
                    className={`p-[2.5px] rounded-full transition-all ${
                      hasActiveStories
                        ? 'bg-gradient-to-tr from-[#00A884] via-emerald-400 to-cyan-400 shadow-[0_0_14px_rgba(0,168,132,0.5)] group-hover/lineAvatar:scale-105'
                        : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-[#17253D] border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-700 dark:text-white font-bold text-xs shadow-md">
                      {isAvatarUrlValid(instancePic) ? (
                        <img 
                          src={instancePic!} 
                          alt={instanceName} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">
                          {instanceName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status de Presença */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isWhatsApp ? 'border-[#18262E]' : 'border-[#EDF2F7] dark:border-[#121F3B]'} ${
                    isWaConnected ? 'bg-emerald-400 animate-pulse' : isWaConnecting ? 'bg-amber-400' : 'bg-rose-500'
                  }`} />

                  {/* Badge de Story Ativo na Linha Principal */}
                  {hasActiveStories && (
                    <div
                      className={`absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-[#00A884] border-2 ${isWhatsApp ? 'border-[#18262E]' : 'border-[#EDF2F7] dark:border-[#121F3B]'} flex items-center justify-center text-white text-[9px] font-black shadow-sm`}
                      title={`${activeLineStories.length} Story ativo • ${totalActiveViews} visualizações`}
                    >
                      <Eye size={9} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Identificação da Linha (Clicar no nome alterna a instância) */}
                <div
                  onClick={() => setShowInstanceDropdown(prev => !prev)}
                  className="flex flex-col min-w-0 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                  title="Clique para alternar linha / instância WhatsApp"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[130px] group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      {instanceName}
                    </span>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${showInstanceDropdown ? 'rotate-180 text-blue-600 dark:text-white' : ''}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                      {isWaConnected ? (activeInstance?.phoneNumber || 'Conectado') : 'Desconectado'}
                    </span>
                    {hasActiveStories && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryViewerModal({
                            isOpen: true,
                            currentIndex: 0,
                            showViewersDrawer: false,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer shrink-0"
                        title="Clique para abrir o Story ativo da Linha Principal"
                      >
                        <Eye size={9} />
                        <span>Ver Story</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ações Rápidas do Topo: Novo Chat, Sincronização & Menu de Opções */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão Sincronização Offline 24h */}
            <button
              type="button"
              onClick={() => handleSyncOfflineMessages(true, true)}
              disabled={isSyncingOffline}
              className="vallor-inbox-pill-idle w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 dark:bg-[#1B2C52] dark:hover:bg-[#233866] dark:text-slate-200 dark:hover:text-white dark:border-[#263C6E] flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Sincronizar mensagens offline (últimas 24h)"
            >
              <RefreshCw size={14} className={isSyncingOffline ? "animate-spin text-blue-500 dark:text-blue-400" : ""} />
            </button>

            {/* Botão Novo Chat */}
            <button
              type="button"
              onClick={() => setShowContactsModal(true)}
              className={`w-8 h-8 rounded-xl ${isWhatsApp ? 'bg-[#00A884] hover:bg-[#02906F]' : 'bg-blue-600 hover:bg-blue-500'} text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95`}
              title="Nova conversa / Contatos"
            >
              <Plus size={17} className="stroke-[2.5]" />
            </button>

            {/* Menu de Opções Flutuantes do Painel Lateral */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLeftHeaderMenu(prev => !prev)}
                className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer relative ${
                  showLeftHeaderMenu ? 'text-blue-600 bg-slate-100 dark:text-white dark:bg-slate-800/80' : ''
                }`}
                title={
                  selectedDepartmentFilter !== 'all' 
                    ? `Mais opções (Filtro ativo: ${departments.find(d => d.id === selectedDepartmentFilter)?.name || 'Setor'})` 
                    : "Mais opções"
                }
              >
                <MoreVertical size={18} />
                {selectedDepartmentFilter !== 'all' && (
                  <span 
                    className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#202C33]"
                    style={{ backgroundColor: departments.find(d => d.id === selectedDepartmentFilter)?.color || '#3b82f6' }}
                  />
                )}
              </button>

              {showLeftHeaderMenu && (
                <>
                  {/* Backdrop para fechar ao clicar fora */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLeftHeaderMenu(false)} 
                  />
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-xl dark:shadow-[0_20px_45px_rgba(0,0,0,0.85)] py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800/80"
                  >
                    {/* Filtro de Setores / Departamentos */}
                    {departments.length > 0 && (
                      <div className="py-1">
                        <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Network size={12} className="text-blue-500" />
                            Filtrar por Setor
                          </span>
                          {selectedDepartmentFilter !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDepartmentFilter('all');
                              }}
                              className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline normal-case font-semibold cursor-pointer"
                            >
                              Limpar
                            </button>
                          )}
                        </div>

                        {/* Opção Todos os Setores */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDepartmentFilter('all');
                            setShowLeftHeaderMenu(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer ${
                            selectedDepartmentFilter === 'all'
                              ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-900/20'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            <span className="truncate">Todos os setores</span>
                          </div>
                          {selectedDepartmentFilter === 'all' && <Check size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />}
                        </button>

                        {/* Lista dos Departamentos */}
                        <div className="max-h-52 overflow-y-auto custom-scrollbar">
                          {departments.map((dept) => {
                            const isSelected = selectedDepartmentFilter === dept.id;
                            const color = dept.color || '#3b82f6';
                            return (
                              <button
                                key={dept.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDepartmentFilter(dept.id);
                                  setShowLeftHeaderMenu(false);
                                }}
                                className={`w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-900/20'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="truncate">{dept.name}</span>
                                </div>
                                {isSelected && <Check size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeftHeaderMenu(false);
                          setShowGlobalScheduleCenter(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <CalendarClock size={15} className="text-cyan-600 dark:text-cyan-400" />
                        <span>Mensagens Agendadas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeftHeaderMenu(false);
                          setShowVoipDialer(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <PhoneCall size={15} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Discador Telefônico</span>
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeftHeaderMenu(false);
                          handleSyncOfflineMessages(true, true);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} className={`text-blue-600 dark:text-blue-400 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                        <span>Sincronizar mensagens offline (24h)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown de Instâncias Flutuante com Fotos de Perfil */}
        {showInstanceDropdown && (
          <>
            <div 
              className="fixed inset-0 z-20" 
              onClick={() => setShowInstanceDropdown(false)} 
            />
            <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800/80 p-2.5 z-30 animate-in fade-in slide-in-from-top-1 relative shadow-xl dark:shadow-2xl">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between mb-1.5">
                <span>Linhas / Instâncias WhatsApp</span>
                <Link href="/settings/whatsapp" className="text-blue-600 dark:text-cyan-400 hover:underline text-[10px]">Configurar</Link>
              </div>
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {instances && instances.length > 0 ? (
                  instances.map((inst) => (
                    <div
                      key={inst.id}
                      onClick={() => {
                        setActiveInstance(inst);
                        setShowInstanceDropdown(false);
                      }}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs ${
                        activeInstance?.id === inst.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-white font-semibold border border-blue-200 dark:border-blue-500/30' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-white">
                          {isAvatarUrlValid(inst.profilePicUrl) ? (
                            <img 
                              src={inst.profilePicUrl!} 
                              alt={inst.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            inst.name.substring(0, 2).toUpperCase()
                          )}

                        </div>
                        <span className="truncate">{inst.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-2">{inst.phoneNumber || 'Ativa'}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-xs text-slate-500 text-center">Nenhuma instância cadastrada</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Barra de Busca WhatsApp (Contraste interno recuado sobre a coluna do Inbox) */}
        <div className="px-3 pt-1 pb-2 bg-transparent">
          <div className={`vallor-inbox-search-box ${isWhatsApp ? 'bg-[#111B21] border-[#253640] focus-within:border-[#00A884] focus-within:bg-[#111B21]' : 'bg-white dark:bg-[#0B1224] border-slate-200/90 dark:border-[#1F3158] focus-within:border-blue-500 dark:focus-within:border-cyan-500/60 focus-within:bg-white dark:focus-within:bg-[#0B1224] shadow-xs'} border rounded-xl px-3 py-2 flex items-center gap-2 transition-all`}>
            <Search size={15} className={`${isWhatsApp ? 'text-[#8696A0]' : 'text-slate-400'} shrink-0`} />
            <input 
              type="text" 
              placeholder="Pesquisar ou começar uma nova conversa" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`vallor-inbox-search-input w-full bg-transparent text-xs ${isWhatsApp ? 'text-[#E9EDEF] placeholder:text-[#8696A0]' : 'text-slate-800 dark:text-slate-100 placeholder:text-slate-400'} outline-none`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`${isWhatsApp ? 'text-[#8696A0] hover:text-[#E9EDEF]' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Pílulas de Filtro (Sem borda divisória dura) */}
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-transparent shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('all');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeFilterTab === 'all'
                ? (isWhatsApp ? 'bg-[#103629] text-[#00A884] border border-[#00A884] font-semibold' : 'bg-blue-600 text-white font-medium shadow-sm')
                : (isWhatsApp ? 'vallor-inbox-pill-idle bg-[#22333D] text-[#E9EDEF] hover:bg-[#2A3E4A] border border-[#2B3F4B]' : 'vallor-inbox-pill-idle bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 dark:bg-[#1B2C52] dark:text-slate-200 dark:hover:bg-[#243968] dark:border-[#263C6E]')
            }`}
          >
            Tudo
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('unread');
              setOnlyUnread(true);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'unread'
                ? (isWhatsApp ? 'bg-[#103629] text-[#00A884] border border-[#00A884] font-semibold' : 'bg-blue-600 text-white font-medium shadow-sm')
                : (isWhatsApp ? 'vallor-inbox-pill-idle bg-[#22333D] text-[#E9EDEF] hover:bg-[#2A3E4A] border border-[#2B3F4B]' : 'vallor-inbox-pill-idle bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 dark:bg-[#1B2C52] dark:text-slate-200 dark:hover:bg-[#243968] dark:border-[#263C6E]')
            }`}
          >
            <span>Não lidas</span>
            {unreadCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeFilterTab === 'unread' ? (isWhatsApp ? 'bg-[#00A884] text-[#111B21]' : 'bg-white text-blue-600') : 'bg-emerald-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('waiting');
              setActiveTab('waiting');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'waiting'
                ? (isWhatsApp ? 'bg-[#103629] text-[#00A884] border border-[#00A884] font-semibold' : 'bg-blue-600 text-white font-medium shadow-sm')
                : (isWhatsApp ? 'vallor-inbox-pill-idle bg-[#22333D] text-[#E9EDEF] hover:bg-[#2A3E4A] border border-[#2B3F4B]' : 'vallor-inbox-pill-idle bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 dark:bg-[#1B2C52] dark:text-slate-200 dark:hover:bg-[#243968] dark:border-[#263C6E]')
            }`}
          >
            <span>Aguardando</span>
            {waitingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilterTab === 'waiting'
                  ? (isWhatsApp ? 'bg-[#00A884]/20 text-[#00A884]' : 'bg-white/20 text-white')
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/30'
              }`}>
                {waitingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('mine');
              setActiveTab('mine');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'mine'
                ? (isWhatsApp ? 'bg-[#103629] text-[#00A884] border border-[#00A884] font-semibold' : 'bg-blue-600 text-white font-medium shadow-sm')
                : (isWhatsApp ? 'vallor-inbox-pill-idle bg-[#22333D] text-[#E9EDEF] hover:bg-[#2A3E4A] border border-[#2B3F4B]' : 'vallor-inbox-pill-idle bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 dark:bg-[#1B2C52] dark:text-slate-200 dark:hover:bg-[#243968] dark:border-[#263C6E]')
            }`}
          >
            <span>Meus</span>
            {mineCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilterTab === 'mine'
                  ? (isWhatsApp ? 'bg-[#00A884]/20 text-[#00A884]' : 'bg-white/20 text-white')
                  : isWhatsApp
                    ? 'bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30'
                    : 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
              }`}>
                {mineCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilterTab('resolved');
              setActiveTab('resolved');
              setOnlyUnread(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeFilterTab === 'resolved'
                ? (isWhatsApp ? 'bg-[#103629] text-[#00A884] border border-[#00A884] font-semibold' : 'bg-blue-600 text-white font-medium shadow-sm')
                : (isWhatsApp ? 'vallor-inbox-pill-idle bg-[#22333D] text-[#E9EDEF] hover:bg-[#2A3E4A] border border-[#2B3F4B]' : 'vallor-inbox-pill-idle bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 dark:bg-[#1B2C52] dark:text-slate-200 dark:hover:bg-[#243968] dark:border-[#263C6E]')
            }`}
          >
            Resolvidos
          </button>
        </div>

        {/* Indicador de Filtro de Setor Ativo (quando selecionado pelo menu de 3 pontinhos) */}
        {selectedDepartmentFilter !== 'all' && (
          <div className={`px-3 py-1.5 border-b flex items-center justify-between text-xs shrink-0 ${
            isWhatsApp ? 'bg-[#182229] border-[#222D34]' : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30'
          }`}>
            <span className="text-[11px] font-medium flex items-center gap-1.5 text-blue-600 dark:text-blue-400 truncate">
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: departments.find(d => d.id === selectedDepartmentFilter)?.color || '#3b82f6' }}
              />
              <span className="truncate">Setor: {departments.find(d => d.id === selectedDepartmentFilter)?.name || 'Selecionado'}</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedDepartmentFilter('all')}
              className="text-[10px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Remover filtro de setor"
            >
              <X size={12} />
              <span>Limpar</span>
            </button>
          </div>
        )}

        {/* Lista de Contatos WhatsApp */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin pb-24 md:pb-2"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
              if (displayLimit < filteredContacts.length) {
                setDisplayLimit(prev => Math.min(prev + 40, filteredContacts.length));
              }
            }
          }}
        >
          {fetchError && (
            <div className="p-3 bg-red-500/20 border-b border-red-500/50 text-red-400 text-xs text-center font-bold">
              Erro ao sincronizar conversas: {fetchError}
            </div>
          )}
          
          {isLoading && contacts.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3.5 border-b border-slate-100 dark:border-slate-800/40 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-10 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-3 w-40 bg-slate-200/50 dark:bg-slate-800/50 rounded" />
                </div>
              </div>
            ))
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center h-48">
              <span>Nenhuma conversa encontrada</span>
            </div>
          ) : (
            visibleContacts.map((contact) => {
              const cleanContactPhone = (contact.phone || '').replace(/\D/g, '');
              const last8 = cleanContactPhone.slice(-8);
              const hasRecentStory = Boolean(
                cleanContactPhone && (
                  recentStoryViewers.has(cleanContactPhone) ||
                  (last8.length === 8 && recentStorySuffixSet.has(last8))
                )
              );
              const resolvedDept = resolveContactDepartment(contact);
              const regionColor = resolvedDept?.color || null;

              return (
              <div
                key={contact.id}
                onClick={() => {
                  const isQueueOrBot = contact.status === 'waiting' || contact.status === 'bot_active' || !contact.assignedTo;
                  if (isQueueOrBot && activeFilterTab === 'waiting') {
                    setSelectedQueueChat(contact);
                    setShowTakeoverModal(true);
                    return;
                  }
                  setIsPeeking(false);
                  setActiveChat(contact.id);
                  setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, hasNewMessage: false, unread: 0 } : c));
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const menuWidth = 224;
                  const menuHeight = 310;
                  let x = e.clientX;
                  if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                  }
                  let y = e.clientY;
                  if (y + menuHeight > window.innerHeight) {
                    y = window.innerHeight - menuHeight - 10;
                  }
                  setChatContextMenu({
                    contactId: contact.id,
                    x: Math.max(10, x),
                    y: Math.max(10, y),
                  });
                  setShowMuteSubmenu(false);
                }}
                className={`vallor-inbox-chat-row flex items-center gap-3.5 px-3.5 py-3 cursor-pointer transition-colors relative group border-b ${
                  isWhatsApp ? 'border-[#21313B]' : 'border-slate-200/60 dark:border-white/[0.05]'
                } ${
                  activeChat === contact.id
                    ? (isWhatsApp ? 'vallor-inbox-chat-active bg-[#243640] border-l-4 border-[#00A884]' : 'vallor-inbox-chat-active bg-white dark:bg-[#1B2D54] border-l-4 border-blue-600 dark:border-cyan-400 shadow-xs')
                    : (isWhatsApp ? 'hover:bg-[#1E2E37]' : 'hover:bg-white/70 dark:hover:bg-[#172647]')
                }`}
              >
                {/* Avatar Circular 48x48 com Anel Inteligente de Região/Setor e Story Ring */}
                <div
                  onClick={(e) => {
                    if (hasRecentStory && activeLineStories.length > 0) {
                      e.stopPropagation();
                      const suffix = cleanContactPhone.slice(-8);
                      const viewerRecord = storyViewersList.find((v: any) => {
                        const vp = String(v.rawPhone || v.phone || '').replace(/\D/g, '');
                        return vp && suffix && (vp.endsWith(suffix) || suffix.endsWith(vp.slice(-8)));
                      });
                      let targetIdx = 0;
                      if (viewerRecord) {
                        const matchedIdx = activeLineStories.findIndex(
                          (s: any) =>
                            (viewerRecord.statusMessageId && s.messageId === viewerRecord.statusMessageId) ||
                            (viewerRecord.storyWatched && s.title === viewerRecord.storyWatched)
                        );
                        if (matchedIdx >= 0) targetIdx = matchedIdx;
                      }
                      setStoryViewerModal({
                        isOpen: true,
                        currentIndex: targetIdx,
                        showViewersDrawer: false,
                        highlightedViewerName: formatContactDisplayName(contact.name, contact.phone),
                        highlightedViewerTime: viewerRecord?.viewedAtExactTime || undefined,
                      });
                    }
                  }}
                  className="relative shrink-0"
                  title={
                    hasRecentStory
                      ? `Clique para ver o Story visualizado${resolvedDept?.name ? ` • Região/Setor: ${resolvedDept.name}` : ''}`
                      : resolvedDept?.name
                      ? `Setor / Região: ${resolvedDept.name}`
                      : undefined
                  }
                >
                  <div
                    className={`p-[2.5px] rounded-full transition-all ${
                      hasRecentStory && !regionColor
                        ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse hover:scale-105'
                        : hasRecentStory
                        ? 'hover:scale-105'
                        : ''
                    }`}
                    style={
                      regionColor
                        ? {
                            backgroundColor: regionColor,
                            boxShadow: `0 0 0 1px ${regionColor}45, 0 2px 8px ${regionColor}35`,
                          }
                        : undefined
                    }
                  >
                    <div className={`w-12 h-12 rounded-full overflow-hidden ${isWhatsApp ? 'bg-[#202C33] border-[#222D34]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'} border flex items-center justify-center text-slate-700 dark:text-white font-bold text-sm shadow-inner`}>
                      {isAvatarUrlValid(contact.avatarUrl) ? (
                        <img 
                          src={contact.avatarUrl!} 
                          alt={contact.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}

                      <span className={`avatar-initials ${contact.avatarUrl ? "hidden" : ""}`}>
                        {getContactInitials(contact.name, contact.phone)}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 ${isWhatsApp ? 'border-[#18262E]' : 'border-[#EDF2F7] dark:border-[#121F3B]'} shadow-sm`} />

                  {/* Badge de Story Recente (Zero Emojis - Ícone Vetorial Eye) */}
                  {hasRecentStory && (
                    <div 
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border-2 ${isWhatsApp ? 'border-[#18262E]' : 'border-[#EDF2F7] dark:border-[#121F3B]'} flex items-center justify-center text-white shadow-sm`}
                      title="Visualizou Status nas últimas 24h (Clique para ver o Story)"
                    >
                      <Eye size={9} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Conteúdo do Card de Conversa (3 Linhas - Padrão Lero / WhatsApp Corporativo VERSUS) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  {/* Linha 1: Nome + Tag + Horário + Badge de Não Lidas */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <h3 className={`text-[0.91rem] truncate ${
                        contact.unread > 0 
                          ? 'font-bold text-slate-900 dark:text-white' 
                          : (activeChat === contact.id 
                              ? (isWhatsApp ? 'font-bold text-[#E9EDEF]' : 'font-bold text-blue-700 dark:text-white') 
                              : 'font-semibold text-slate-900 dark:text-slate-200'
                            )
                      }`}>
                        {formatContactDisplayName(contact.name, contact.phone)}
                      </h3>

                      {/* Tag do Contato no Estilo Lero */}
                      {contact.tags && contact.tags.length > 0 && (() => {
                        const firstTag = contact.tags[0];
                        const tagTheme = getTagColor(firstTag);
                        return (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${tagTheme.bg} ${tagTheme.text} ${tagTheme.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tagTheme.dot} shrink-0`} />
                            <span className="truncate max-w-[85px]">{firstTag}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(contact.isPinned || pinnedContactIds.includes(contact.id)) && (
                        <span title="Conversa Fixada">
                          <Pin size={11} className="text-emerald-500 fill-emerald-500 -rotate-45 shrink-0" />
                        </span>
                      )}
                      <span className={`text-[11px] whitespace-nowrap shrink-0 ${
                        contact.unread > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {contact.time || ''}
                      </span>
                      {contact.unread > 0 && (
                        <span className="min-w-[1.15rem] h-4.5 px-1 bg-emerald-500 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Linha 2: Preview da Mensagem com Ticks / Ícone de Áudio */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      {contact.lastMessageDirection === 'OUTBOUND' && (
                        <CheckCheck size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0 inline-block" />
                      )}
                      {(contact.lastMessageType === 'audio' || contact.lastMsg?.includes('[Áudio]') || contact.lastMsg?.includes('[AUDIO]') || contact.lastMessage?.includes('[Áudio]') || contact.lastMessage?.includes('[AUDIO]')) ? (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs truncate">
                          <Mic size={13} className="text-slate-400 dark:text-slate-500 shrink-0 inline-block" />
                          <span className="truncate">Mensagem de voz</span>
                        </div>
                      ) : (
                        <p className={`text-xs truncate ${
                          contact.unread > 0 ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {contact.lastMessage || contact.lastMsg || 'Nenhuma mensagem recente'}
                        </p>
                      )}
                    </div>

                    {/* Ícones de Notificações, Favorito e Botão de Ações do Chat (Estilo WhatsApp Web) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {mutedContactIds.includes(contact.id) && (
                        <span title="Silenciado">
                          <BellOff size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        </span>
                      )}
                      {favoriteContactIds.includes(contact.id) && (
                        <span title="Favorito">
                          <Heart size={13} className="text-rose-500 fill-rose-500 shrink-0" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuWidth = 224;
                          const menuHeight = 310;
                          let x = rect.right - menuWidth;
                          if (x < 10) x = rect.left;
                          let y = rect.bottom + 4;
                          if (y + menuHeight > window.innerHeight) {
                            y = rect.top - menuHeight;
                          }
                          setChatContextMenu({
                            contactId: contact.id,
                            x: Math.max(10, x),
                            y: Math.max(10, y),
                          });
                          setShowMuteSubmenu(false);
                        }}
                        className={`p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
                          chatContextMenu?.contactId === contact.id ? 'opacity-100' : ''
                        } ${
                          isWhatsApp 
                            ? 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942]' 
                            : theme === 'light'
                            ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Mais opções da conversa"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Linha 3: Identificação do Atendente + Setor/Região e Badge de Status (Padrão Lero) */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5 mt-0.5 border-t border-slate-100/80 dark:border-slate-800/40">
                    {/* Lado Esquerdo: Bolinha de Status + Ícone de Usuário + Nome do Atendente • Setor */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                      {/* Bolinha indicadora de status */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        (contact.status === 'open' || contact.status === 'human_takeover')
                          ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                          : contact.status === 'bot_active'
                          ? 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                          : contact.status === 'waiting'
                          ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                          : 'bg-slate-400'
                      }`} />

                      {/* Ícone de Usuário */}
                      <User size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />

                      {/* Atendente • Setor / Região */}
                      {(() => {
                        const operatorName = contact.assignedUser?.name
                          || (contact.status === 'bot_active' ? `IA ${aiAgentName || 'Sofia'}` : (contact.assignedTo ? 'Atendente' : 'Comercial'));
                        
                        const departmentName = resolvedDept?.name
                          || contact.department?.name 
                          || (contact.status === 'bot_active' ? 'IA' : 'Comercial');

                        return (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[105px]">
                              {operatorName}
                            </span>
                            <span className="text-slate-400 dark:text-slate-600">•</span>
                            <span
                              className="text-slate-500 dark:text-slate-400 truncate max-w-[95px]"
                              style={regionColor ? { color: regionColor, fontWeight: 600 } : undefined}
                            >
                              {departmentName}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Lado Direito: Badge Pill de Status (ex: Em atendimento) */}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border shrink-0 whitespace-nowrap leading-none ${
                      (contact.status === 'open' || contact.status === 'human_takeover')
                        ? 'border-emerald-300/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : contact.status === 'bot_active'
                        ? 'border-cyan-300/80 bg-cyan-50/80 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-950/40 dark:text-cyan-300'
                        : contact.status === 'waiting'
                        ? 'border-amber-300/80 bg-amber-50/80 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                    }`}>
                      {contact.status === 'bot_active' 
                        ? 'IA Ativa' 
                        : contact.status === 'waiting' 
                        ? 'Aguardando' 
                        : (contact.status === 'resolved' || contact.status === 'closed') 
                        ? 'Finalizado' 
                        : 'Em atendimento'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {filteredContacts.length > visibleContacts.length && (
          <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            Carregando mais conversas ({visibleContacts.length} de {filteredContacts.length})...
          </div>
        )}
        </div>
      </div>

      {/* Separador Redimensionável Lateral (Invisível em repouso para manter transição limpa de cor, acende ao passar o mouse) */}
      <div 
        onMouseDown={handleMouseDownResize}
        onDoubleClick={handleDoubleClickResize}
        onMouseEnter={() => setShowResizeTooltip(true)}
        onMouseLeave={() => setShowResizeTooltip(false)}
        className={`hidden md:flex relative w-1 hover:w-1.5 z-30 cursor-col-resize items-center justify-center transition-all group shrink-0 select-none ${
          isResizingSidebar 
            ? 'bg-blue-500 w-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
            : isWhatsApp 
              ? 'hover:bg-[#00A884]/80 bg-transparent' 
              : 'hover:bg-blue-500/70 bg-transparent'
        }`}
        title="Arraste para redimensionar (duplo clique para o padrão)"
      >
        {/* Tooltip flutuante idêntico ao do print */}
        {(showResizeTooltip || isResizingSidebar) && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-black/90 text-white text-[11px] font-medium shadow-2xl border border-slate-700/80 z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
            Arraste para redimensionar (duplo clique para o padrão)
          </div>
        )}
      </div>

      {/* 2. PAINEL CENTRAL: Janela de Chat (3ª Camada de Cor Profunda sem Borda Divisória) */}
      <div className={`vallor-chat-main-col ${!activeChat ? 'hidden md:flex' : 'flex'} flex-1 w-full h-full max-h-full ${isWhatsApp ? 'bg-[#0B141A]' : 'bg-[#E2E8F0] dark:bg-[#050814]'} flex-col overflow-hidden relative`}>
        
        {/* Textura/Papel de Parede Sutil Autêntico WhatsApp adaptado ao Dark Mode Corporativo */}
        <div 
          className={`absolute inset-0 ${isWhatsApp ? 'opacity-[0.06] brightness-75' : 'opacity-[0.035] dark:opacity-[0.025] invert dark:invert-0'} pointer-events-none`} 
          style={{ 
            backgroundImage: WHATSAPP_WALLPAPER_BG, 
            backgroundRepeat: 'repeat', 
            backgroundSize: '400px 400px' 
          }} 
        />

        {!activeChat || !activeContactData ? (
          /* WIDGET "SEU DIA" NO ESTADO VAZIO DO PAINEL CENTRAL (PADRÃO LERO) */
          <div className="flex-1 flex flex-col justify-between p-8 z-10 overflow-y-auto">
            {/* Topo: Data atual no topo direito */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Painel de Produtividade</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-gray-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 shadow-sm">
                <Calendar size={13} className="text-blue-500 dark:text-blue-400" />
                <span className="capitalize font-medium">{currentFormattedDate}</span>
              </div>
            </div>

            {/* Centro: Card circular de produtividade com progresso e estatísticas reais */}
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto text-center">
              <div className="w-full bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-600/5 rounded-full blur-2xl pointer-events-none"></div>

                {/* Título e Saudação */}
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/20 inline-block mb-2">
                    Seu Dia
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Olá, {currentUserName}!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Acompanhe o seu ritmo de produtividade e resoluções de hoje.
                  </p>
                </div>

                {/* Card Circular com contagem e SVG Ring */}
                <div className="flex flex-col items-center justify-center my-6">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Anel de progresso SVG circular */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      {/* Fundo do anel */}
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Progresso do anel */}
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        stroke="url(#progressGradient)"
                        strokeWidth="10"
                        strokeDasharray={427}
                        strokeDashoffset={427 - (427 * Math.min(todayFinishedCount / Math.max(dailyGoal, 1), 1))}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Conteúdo interno do círculo */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {todayFinishedCount}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                        Finalizados hoje
                      </span>
                    </div>
                  </div>

                  {/* Comparação com a média */}
                  <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <TrendingUp size={14} className={todayFinishedCount >= avgDaily && todayFinishedCount > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"} />
                    {todayFinishedCount === 0 ? (
                      <span className="text-slate-500 dark:text-slate-400">
                        Nenhum atendimento finalizado hoje {avgDaily > 0 ? `(Média: ${avgDaily}/dia)` : `(Meta: ${dailyGoal})`}
                      </span>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300">
                        {finishedVsAveragePercent >= 0 ? `+${finishedVsAveragePercent}%` : `${finishedVsAveragePercent}%`} vs sua média diária ({avgDaily} atendimentos)
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges de Apoio */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-left text-xs">
                  <div className="bg-slate-50 dark:bg-[#070D1B] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">TMA Médio Hoje</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{todayAvgTma}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#070D1B] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">1ª Resposta Média</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{todayFirstResp}</span>
                  </div>
                </div>
              </div>

              {/* Texto Auxiliar no Rodapé */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0B1224] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <MessageSquare size={15} className="text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Nada selecionado ainda. Escolha uma conversa para continuar.</span>
              </div>
            </div>

            <div />
          </div>
        ) : (
          <>
            {/* Chat Header (Padrão Estrutural WhatsApp - Design Monocromático VERSUS) */}
            <div className={`h-16 px-2.5 sm:px-4 border-b ${isWhatsApp ? 'bg-[#202C33] border-[#222D34]' : 'bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80'} flex items-center justify-between z-30 shadow-sm shrink-0 w-full text-slate-900 dark:text-white`}>
              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                {/* Botão Voltar para Lista no Mobile (WhatsApp style) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChat(null);
                  }}
                  className={`md:hidden p-1.5 -ml-0.5 ${isWhatsApp ? 'text-[#8696A0] hover:text-white hover:bg-[#2A3942]' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'} rounded-lg transition-colors shrink-0 cursor-pointer`}
                  title="Voltar para conversas"
                >
                  <ArrowLeft size={20} />
                </button>

                <div 
                  className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
                  onClick={() => setShowContactInfo(prev => !prev)}
                  title="Clique para ver dados do contato"
                >
                  {/* Avatar WhatsApp com indicador de status e anel da cor da região (respeita proporção e dimensão exata) */}
                  {(() => {
                    const activeDept = resolveContactDepartment(activeContactData);
                    return (
                      <div 
                        className="relative shrink-0 flex items-center justify-center my-auto"
                        title={activeDept?.name ? `Setor / Região: ${activeDept.name}` : undefined}
                      >
                        <div 
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2.5px] transition-all flex items-center justify-center shrink-0 aspect-square"
                          style={{
                            backgroundColor: activeDept?.color ? activeDept.color : 'transparent',
                            boxShadow: activeDept?.color ? `0 0 0 1px ${activeDept.color}45, 0 2px 8px ${activeDept.color}35` : undefined,
                          }}
                        >
                          <div className={`w-full h-full rounded-full ${isWhatsApp ? 'bg-[#2A3942]' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'} border flex items-center justify-center text-slate-700 dark:text-white font-bold shrink-0 relative overflow-hidden shadow-inner text-xs sm:text-sm aspect-square`}>
                            {(() => {
                              const isSelfOrMainLine = activeContactData.name?.includes('(você)') || (activeContactData.phone && activeInstance?.phoneNumber && activeContactData.phone.replace(/\D/g, '') === activeInstance.phoneNumber.replace(/\D/g, ''));
                              const rawContactPhoto = activeContactData.avatarUrl || (isSelfOrMainLine ? (activeInstance?.profilePicUrl || waStatus?.profilePicUrl) : null);
                              const contactPhoto = sanitizeAvatarUrl(rawContactPhoto);

                              return contactPhoto ? (
                                <img 
                                  src={contactPhoto} 
                                  alt={activeContactData.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover rounded-full block aspect-square"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                                    if (fallback) fallback.classList.remove('hidden');
                                  }}
                                />
                              ) : null;
                            })()}
                            <span className={`avatar-initials ${activeContactData.avatarUrl ? "hidden" : ""} text-xs sm:text-sm font-bold`}>
                              {getContactInitials(activeContactData.name, activeContactData.phone)}
                            </span>
                          </div>
                        </div>
                        {/* Status Indicator */}
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 ${isWhatsApp ? 'border-[#202C33]' : 'border-white dark:border-[#0B1224]'}`} />
                      </div>
                    );
                  })()}
                  
                  {/* Título e Subtítulo Limpos e Elegantes (sem sobreposição de leitura) */}
                  <div className="min-w-0 flex-1 overflow-hidden pr-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate whitespace-nowrap group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors leading-tight">
                        {formatContactDisplayName(activeContactData.name, activeContactData.phone)}
                      </h2>
                      {/* Tag do Contato no Estilo Lero */}
                      {activeContactData.tags && activeContactData.tags.length > 0 && (() => {
                        const firstTag = activeContactData.tags[0];
                        const tagTheme = getTagColor(firstTag);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${tagTheme.bg} ${tagTheme.text} ${tagTheme.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tagTheme.dot} shrink-0`} />
                            <span className="truncate max-w-[100px]">{firstTag}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {activeContactData.assignedUser ? (
                      <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium truncate whitespace-nowrap block leading-tight mt-0.5">
                        Atendente: <strong className="text-slate-900 dark:text-white font-semibold">{activeContactData.assignedUser.name}</strong>
                      </span>
                    ) : activeContactData.isAi || activeContactData.status === 'bot_active' ? (
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-cyan-600 dark:text-cyan-400 font-medium truncate whitespace-nowrap leading-tight mt-0.5">
                        <BrainCircuit size={11} className="animate-pulse shrink-0" />
                        <span className="truncate">IA {aiAgentName} conversando...</span>
                      </div>
                    ) : activeContactData.status === 'open' || activeContactData.status === 'human_takeover' ? (
                      <span className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate whitespace-nowrap block leading-tight mt-0.5">online • Atendimento ativo</span>
                    ) : activeContactData.status === 'waiting' ? (
                      <span className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium truncate whitespace-nowrap block leading-tight mt-0.5">Aguardando atendimento</span>
                    ) : (
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate whitespace-nowrap block leading-tight mt-0.5">
                        {activeContactData.phone?.includes('@lid') 
                          ? 'online • WhatsApp' 
                          : activeContactData.phone && activeContactData.name && activeContactData.name !== activeContactData.phone
                            ? `${formatDisplayPhoneNumber(activeContactData.phone)} • online` 
                            : 'online'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações Alinhadas à Direita (Estilo Executivo Clean / Lero) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1.5">
                {isResolved ? (
                  <div className="hidden md:flex items-center gap-1.5 mr-1 shrink-0">
                    <span className={`inline-flex ${isWhatsApp ? 'text-[#8696A0] bg-[#202C33] border-[#222D34]' : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'} text-[11px] font-semibold px-2 py-0.5 border rounded-lg items-center gap-1`}>
                      <Lock size={11} className="text-slate-400" />
                      Finalizado
                    </span>
                    <button 
                      onClick={handleReopen} 
                      disabled={isReopening}
                      className={`${isWhatsApp ? 'bg-[#00A884] hover:bg-[#02906F]' : 'bg-blue-600 hover:bg-blue-500'} text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm`}
                      title="Reabrir atendimento"
                    >
                      <ArrowRightLeft size={11} />
                      <span>{isReopening ? '...' : 'Reabrir'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    {/* Botão Assumir (Apenas se aguardando ou sem atendente) */}
                    {(activeContactData.status === 'waiting' || (!activeContactData.assignedUser && !activeContactData.isAi)) && (
                      <button 
                        onClick={() => handleTakeover()} 
                        className={`text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm active:scale-95 ${
                          activeContactData.status === 'human_takeover'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                            : isWhatsApp
                              ? 'bg-[#00A884] hover:bg-[#02906F]'
                              : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                        title="Assumir o atendimento"
                      >
                        <UserCheck size={13} />
                        <span>Assumir</span>
                      </button>
                    )}

                    {/* Botão Transferir */}
                    <button 
                      type="button"
                      onClick={() => loadDepartmentsAndShowTransfer()} 
                      className={`text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                        isWhatsApp
                          ? 'bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] border-[#2A3942]'
                          : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-[#1E293B]/80 dark:hover:bg-[#1E293B] dark:text-slate-200 dark:border-slate-700/80'
                      }`}
                      title="Transferir para outro atendente ou setor"
                    >
                      <ArrowRightLeft size={13} className={isWhatsApp ? "text-[#8696A0]" : "text-blue-500 dark:text-blue-400"} />
                      <span>Transferir</span>
                    </button>

                    {/* Botão Finalizar (Verde Emerald idêntico ao Lero) */}
                    <button 
                      onClick={handleRelease} 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm active:scale-95"
                      title="Finalizar atendimento"
                    >
                      <CheckCircle2 size={13} />
                      <span>Finalizar</span>
                    </button>
                  </div>
                )}

                {/* Ícone 3 Pontinhos (Menu Mais Opções Organizado Estilo Lero) */}
                <div className="relative shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChatOptionsMenu(prev => !prev);
                    }}
                    className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                      showChatOptionsMenu 
                        ? 'bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-white' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                    }`}
                    title="Mais opções do chat"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown de Opções Superiores do Chat com Backdrop Isolado */}
                  {showChatOptionsMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => {
                          setShowChatOptionsMenu(false);
                          setShowCrmSubmenu(false);
                        }} 
                      />
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute top-full right-0 mt-2 w-72 sm:w-80 border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs backdrop-blur-xl ${
                          isWhatsApp
                            ? 'bg-[#233138] border-[#2A3942] text-[#E9EDEF]'
                            : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {/* Seção 1: NESTA CONVERSA */}
                        <div className="px-2 py-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Nesta Conversa
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          {/* Pesquisar mensagens */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setShowSearchInChat(true);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Search size={15} className="text-slate-400 shrink-0" />
                              <span className="font-medium text-xs">Pesquisar mensagens</span>
                            </div>
                          </button>

                          {/* Mensagens agendadas */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setShowScheduledDrawer(true);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CalendarClock size={15} className="text-cyan-500 shrink-0" />
                              <span className="font-medium text-xs">Mensagens agendadas</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 min-w-[18px] text-center">
                              {activeChat && scheduledMessagesByChat[activeChat]?.length ? scheduledMessagesByChat[activeChat].length : 0}
                            </span>
                          </button>

                          {/* Notas internas */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setIsInternalMode(prev => !prev);
                              setTimeout(() => {
                                textareaRef.current?.focus();
                              }, 100);
                              toast.success(!isInternalMode ? "Modo Nota Interna ativado!" : "Modo WhatsApp ativado!");
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText size={15} className="text-yellow-500 shrink-0" />
                              <span className="font-medium text-xs">Notas internas</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 min-w-[18px] text-center">
                              {messages.filter(m => m.isInternal).length}
                            </span>
                          </button>

                          {/* Mídia, links e docs */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setShowContactInfo(true);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ImageIcon size={15} className="text-blue-500 shrink-0" />
                              <span className="font-medium text-xs">Mídia, links e docs</span>
                            </div>
                          </button>

                          {/* Mensagens favoritas */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              toast("Nenhuma mensagem favoritada nesta conversa.");
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Star size={15} className="text-amber-400 shrink-0" />
                              <span className="font-medium text-xs">Mensagens favoritas</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 min-w-[18px] text-center">
                              0
                            </span>
                          </button>

                          {/* Devolver IA (se disponível) */}
                          {(activeContactData.status === 'human_takeover' || activeContactData.status === 'open' || activeContactData.status === 'in_progress') && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowChatOptionsMenu(false);
                                handleReturnToBot();
                              }}
                              disabled={isReturningToBot}
                              className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                                isWhatsApp
                                  ? 'hover:bg-[#182229] text-purple-300'
                                  : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Bot size={15} className="text-purple-400 shrink-0" />
                                <span className="font-medium text-xs">{isReturningToBot ? 'Devolvendo...' : 'Devolver para a IA'}</span>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Divisor */}
                        <div className="my-1.5 border-t border-slate-100 dark:border-slate-800/80" />

                        {/* Seção 2: HISTÓRICO E MAIS */}
                        <div className="px-2 py-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Histórico e Mais
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          {/* Histórico de atendimentos */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setShowHistoryModal(true);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <History size={15} className="text-slate-400 shrink-0" />
                              <span className="font-medium text-xs">Histórico de atendimentos</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 min-w-[18px] text-center">
                              1
                            </span>
                          </button>

                          {/* Funil do CRM (com sub-menu de estágios integrado) */}
                          <div className="rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setShowCrmSubmenu(prev => !prev)}
                              className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                                isWhatsApp
                                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Workflow size={15} className="text-blue-500 shrink-0" />
                                <span className="font-medium text-xs">Funil do CRM</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 max-w-[100px] truncate">
                                  {currentStageObj ? currentStageObj.title : 'Selecionar'}
                                </span>
                                <ChevronRight size={13} className={`text-slate-400 transition-transform ${showCrmSubmenu ? 'rotate-90' : ''}`} />
                              </div>
                            </button>

                            {/* Submenu com lista de estágios do CRM */}
                            {showCrmSubmenu && (
                              <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-blue-500/30 ml-3.5 my-1 bg-slate-50/50 dark:bg-slate-900/40 rounded-r-xl">
                                {crmStages.map((stage) => {
                                  const isCurrent = currentDealStage === stage.id;
                                  return (
                                    <button
                                      key={stage.id}
                                      type="button"
                                      disabled={isMovingStage}
                                      onClick={() => {
                                        handleMoveContactToStage(stage.id, stage.title);
                                        setShowCrmSubmenu(false);
                                        setShowChatOptionsMenu(false);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                                        isCurrent
                                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-white font-bold'
                                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dotColor || 'bg-blue-400'}`} />
                                        <span className="truncate text-[11px]">{stage.title}</span>
                                      </div>
                                      {isCurrent && <Check size={12} className="text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Exportar conversa */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              handleExportConversation();
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileDown size={15} className="text-emerald-500 shrink-0" />
                              <span className="font-medium text-xs">Exportar conversa</span>
                            </div>
                          </button>

                          {/* Dados do contato */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setShowContactInfo(true);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-[#E9EDEF]'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <PanelRight size={15} className="text-blue-500 shrink-0" />
                              <span className="font-medium text-xs">Dados do contato</span>
                            </div>
                          </button>

                          {/* Apagar conversa */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptionsMenu(false);
                              setShowDeleteConvModal(true);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isWhatsApp
                                ? 'hover:bg-[#182229] text-rose-400'
                                : 'hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Trash2 size={15} className="text-rose-500 shrink-0" />
                              <span className="font-semibold text-xs">Apagar conversa</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Ícone Lateral: Dados do Contato (Desktop/Tablet) */}
                <button
                  type="button"
                  onClick={() => setShowContactInfo(prev => !prev)}
                  className={`hidden md:flex p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                    showContactInfo 
                      ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                  title="Dados do contato"
                >
                  <PanelRight size={18} />
                </button>
              </div>
            </div>

            {/* Barra de Ações Rápidas no Mobile (Assumir, Transferir, Finalizar, Devolver IA) com Scroll Suave e Alto Contraste */}
            {!isResolved ? (
              <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#070D1B] border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar shrink-0 shadow-xs z-20">
                {/* Botão Assumir */}
                <button 
                  type="button"
                  onClick={() => handleTakeover()} 
                  className={`text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm whitespace-nowrap active:scale-95 ${
                    activeContactData.status === 'human_takeover'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                      : isWhatsApp
                        ? 'bg-[#00A884] hover:bg-[#02906F]'
                        : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                  title="Assumir o atendimento"
                >
                  <UserCheck size={13} />
                  <span>Assumir</span>
                </button>

                {/* Botão Transferir */}
                <button 
                  type="button"
                  onClick={() => loadDepartmentsAndShowTransfer()} 
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm whitespace-nowrap active:scale-95 ${
                    isWhatsApp
                      ? 'bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] border border-[#222D34]'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                  }`}
                  title="Transferir para outro atendente ou setor"
                >
                  <ArrowRightLeft size={13} className={isWhatsApp ? "text-[#8696A0]" : "text-blue-500"} />
                  <span>Transferir</span>
                </button>

                {/* Botão Finalizar */}
                <button 
                  type="button"
                  onClick={handleRelease} 
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm whitespace-nowrap active:scale-95 ${
                    isWhatsApp
                      ? 'bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] border border-[#222D34]'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                  }`}
                  title="Finalizar atendimento"
                >
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>Finalizar</span>
                </button>

                {/* Botão Devolver IA */}
                {(activeContactData.status === 'human_takeover' || activeContactData.status === 'open' || activeContactData.status === 'in_progress') && (
                  <button 
                    type="button"
                    onClick={handleReturnToBot} 
                    disabled={isReturningToBot}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm whitespace-nowrap active:scale-95 ${
                      isWhatsApp
                        ? 'bg-[#202C33] hover:bg-[#2A3942] text-purple-300 border border-purple-500/30'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                    }`}
                    title="Devolver atendimento para a IA"
                  >
                    <Bot size={13} className="text-purple-500 dark:text-purple-400" />
                    <span>{isReturningToBot ? 'Devolvendo...' : 'Devolver IA'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#070D1B] border-b border-slate-200 dark:border-slate-800/80 shrink-0">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                  <Lock size={12} className="text-slate-400" /> Atendimento Finalizado
                </span>
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={isReopening}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <ArrowRightLeft size={12} />
                  <span>{isReopening ? 'Reabrindo...' : 'Reabrir'}</span>
                </button>
              </div>
            )}

            {/* Barra de Busca na Conversa (WhatsApp Web) */}
            {showSearchInChat && (
              <div className="bg-white dark:bg-[#0B1224] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex items-center gap-3 z-20 animate-in slide-in-from-top-1 duration-150">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Pesquisar nesta conversa..."
                  className="flex-1 bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500/80"
                  autoFocus
                />
                {chatSearchQuery && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {messages.filter(m => m.content?.toLowerCase().includes(chatSearchQuery.toLowerCase())).length} encontrada(s)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchInChat(false);
                    setChatSearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Banner de Modo Espiar */}
            {isPeeking && (
              <div className="bg-amber-50 dark:bg-amber-500/15 border-b border-amber-200 dark:border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-amber-900 dark:text-amber-300 text-xs shrink-0 backdrop-blur-sm z-20">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                  <span><strong>Modo Espiar Ativo:</strong> Visualizando conversa em modo somente-leitura. A IA ou fila continuam ativas.</span>
                </div>
                <button 
                  onClick={() => handleTakeover(activeChat!)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)] cursor-pointer shrink-0 ml-3"
                >
                  <UserCheck size={13} />
                  Assumir atendimento
                </button>
              </div>
            )}


            {/* Chat Messages (Padrão Estrutural WhatsApp com Ticks Inline e Balões Corporativos) */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2.5 z-10 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center">
                  {isResolved ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">Atendimento Finalizado</p>
                      <p className="text-xs text-slate-500 max-w-sm">O cliente pode reabrir o ticket enviando uma nova mensagem.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1 border border-emerald-500/20">
                        <MessageSquarePlus size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-200">Conversa Pronta para Atendimento</p>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                        Nenhuma mensagem trocada ainda. Digite uma mensagem abaixo para iniciar o contato com o cliente via WhatsApp.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAi = msg.senderType === 'system';
                  const isMe = msg.direction === 'OUTBOUND';
                  const audioKey = msg.id || `audio-${i}`;
                  
                  // Separador de Data WhatsApp
                  const prevMsg = i > 0 ? messages[i - 1] : null;
                  const currentDateLabel = getWhatsAppDateLabel(msg.createdAt);
                  const prevDateLabel = prevMsg ? getWhatsAppDateLabel(prevMsg.createdAt) : null;
                  const showDateDivider = i === 0 || currentDateLabel !== prevDateLabel;

                  // Classificação de Tipo para Remover Balão Externo ao Redor de Mídias (Áudio, Documento, Vídeo, Imagem, Localização)
                  const isAudioMsg = Boolean(
                    msg.type === 'audio' ||
                    msg.type === 'voice' ||
                    msg.type === 'ptt' ||
                    (!!msg.mediaUrl && /\.(ogg|opus|mp3|m4a|wav|webm)($|\?)/i.test(msg.mediaUrl)) ||
                    msg.content?.includes('🎤')
                  );
                  const isVideoMsg = Boolean(
                    msg.type === 'video' ||
                    (msg.type !== 'image' && msg.type !== 'document' && !!msg.mediaUrl && /\.(mp4|mov|webm|mkv|avi)($|\?)/i.test(msg.mediaUrl))
                  );
                  const isImageMsg = Boolean(msg.mediaUrl && msg.type === 'image');
                  const isLocationMsg = Boolean(
                    msg.type === 'location' ||
                    (!!msg.mediaUrl && msg.mediaUrl.includes('maps.google.com')) ||
                    msg.content?.includes('📍')
                  );
                  const isDocMsg = Boolean(
                    msg.type === 'document' ||
                    (!!msg.mediaUrl &&
                      !/\.(mp4|mov|webm|ogg|opus|mp3|m4a|wav|jpg|jpeg|png|webp|gif)($|\?)/i.test(msg.mediaUrl) &&
                      !msg.mediaUrl.includes('maps.google.com') &&
                      msg.type !== 'audio' &&
                      msg.type !== 'video' &&
                      msg.type !== 'image' &&
                      msg.type !== 'location')
                  );

                  let cleanedTextContent = msg.content || '';
                  if (isImageMsg) {
                    cleanedTextContent = cleanedTextContent.replace(/\n*📷 \[Análise da Imagem\]:[\s\S]*$/i, '').trim();
                    if (cleanedTextContent === '📷 Foto') cleanedTextContent = '';
                  }
                  if (isVideoMsg && cleanedTextContent.startsWith('📹')) {
                    cleanedTextContent = '';
                  }
                  const hasVisibleText = Boolean(
                    cleanedTextContent &&
                    !isAudioMsg &&
                    !isDocMsg &&
                    !isLocationMsg &&
                    !cleanedTextContent.startsWith('📍')
                  );
                  const isBorderlessMedia = Boolean(
                    !msg.isInternal && (isAudioMsg || isDocMsg || isVideoMsg || isImageMsg || isLocationMsg)
                  );

                  const formattedMsgTime = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const statusTicksNode = isMe && !msg.isInternal ? (
                    <span 
                      title={
                        msg.status === 'read' ? 'Lida' :
                        msg.status === 'delivered' ? 'Entregue' :
                        msg.status === 'sent' ? 'Enviada' :
                        msg.status === 'no_whatsapp' ? 'Número sem WhatsApp ou inválido.' :
                        msg.status === 'failed' || msg.status === 'error' ? 'Falha no envio da mensagem.' :
                        'Enviando...'
                      } 
                      onClick={(e) => {
                        if (msg.status === 'failed' || msg.status === 'error') {
                          e.stopPropagation();
                          handleRetryFailedMessage(msg);
                        }
                      }}
                      className={`inline-flex items-center ${msg.status === 'failed' || msg.status === 'error' || msg.status === 'no_whatsapp' ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                    >
                      {msg.status === 'read' ? (
                        <CheckCheck size={14} className="text-blue-600 dark:text-[#53bdeb] shrink-0" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck size={14} className="text-slate-500 dark:text-slate-300 shrink-0" />
                      ) : msg.status === 'sent' ? (
                        <Check size={14} className="text-slate-500 dark:text-slate-300 shrink-0" />
                      ) : msg.status === 'no_whatsapp' ? (
                        <AlertCircle size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
                      ) : msg.status === 'failed' || msg.status === 'error' ? (
                        <AlertCircle size={13} className="text-rose-500 dark:text-rose-400 shrink-0" />
                      ) : (
                        <Clock size={12} className="text-slate-500 dark:text-slate-300 shrink-0" />
                      )}
                    </span>
                  ) : null;

                  const mediaSurfaceClasses = isMe
                    ? (isWhatsApp
                        ? 'vallor-media-item vallor-msg-outbound bg-[#005C4B] text-[#E9EDEF] border border-[#00A884]/25'
                        : 'vallor-media-item vallor-msg-outbound bg-[#DBEAFE] text-slate-900 border border-blue-200/90 dark:bg-[#1C325E] dark:text-white dark:border-sky-400/20')
                    : (isWhatsApp
                        ? 'vallor-media-item vallor-msg-inbound bg-[#202C33] text-[#E9EDEF] border border-[#2A3942]'
                        : 'vallor-media-item vallor-msg-inbound bg-white text-slate-800 border border-slate-200/90 dark:bg-[#111C35] dark:text-slate-100 dark:border-slate-700/50');

                  return (
                    <div key={msg.id || `msg-${i}`} className="flex flex-col">
                      {/* Pílula de Data Centralizada (WhatsApp Date Divider) */}
                      {showDateDivider && (
                        <div className="flex justify-center my-2">
                          <div className={`${isWhatsApp ? 'bg-[#182229] text-[#8696A0] border-[#222D34]' : 'bg-slate-200/90 text-slate-700 dark:bg-[#111A2E]/95 dark:text-slate-300 border-slate-300/80 dark:border-slate-800/80'} text-[11px] font-medium px-3.5 py-1 rounded-lg shadow-sm border backdrop-blur-sm uppercase tracking-wide`}>
                            {currentDateLabel}
                          </div>
                        </div>
                      )}

                      {/* Container da Mensagem (Balão apenas para Texto; Mídias ficam diretas sem balão externo) */}
                      <div 
                        id={`msg-${msg.id}`} 
                        onClick={() => setSelectedMessageForAction(prev => prev === msg.id ? null : msg.id)}
                        className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%] ${isMe ? 'self-end items-end' : 'self-start items-start'} relative group my-0.5 cursor-pointer sm:cursor-default`}
                      >
                        <div className={`text-sm relative transition-all ${
                          isBorderlessMedia
                            ? 'bg-transparent border-none shadow-none p-0 min-w-0'
                            : msg.isInternal
                              ? 'pt-1.5 pb-1.5 px-3 min-w-[85px] shadow-sm bg-amber-50 text-amber-900 border border-amber-300 dark:bg-[#281b0a] dark:text-amber-100 dark:border-amber-500/30 rounded-2xl rounded-tr-sm'
                              : isMe
                                ? (isWhatsApp 
                                    ? 'vallor-text-bubble vallor-msg-outbound pt-1.5 pb-1.5 px-3.5 min-w-[85px] shadow-sm bg-[#005C4B] text-[#E9EDEF] border border-[#00A884]/25 rounded-2xl rounded-tr-sm' 
                                    : 'vallor-text-bubble vallor-msg-outbound pt-1.5 pb-1.5 px-3.5 min-w-[85px] shadow-sm bg-[#DBEAFE] text-slate-900 border border-blue-200/90 dark:bg-[#1C325E] dark:text-white dark:border-sky-400/20 rounded-2xl rounded-tr-sm')
                                : (isWhatsApp 
                                    ? 'vallor-text-bubble vallor-msg-inbound pt-1.5 pb-1.5 px-3.5 min-w-[85px] shadow-sm bg-[#202C33] text-[#E9EDEF] border border-[#2A3942] rounded-2xl rounded-tl-sm' 
                                    : 'vallor-text-bubble vallor-msg-inbound pt-1.5 pb-1.5 px-3.5 min-w-[85px] shadow-sm bg-white text-slate-800 border border-slate-200/90 dark:bg-[#111C35] dark:text-slate-100 dark:border-slate-700/50 rounded-2xl rounded-tl-sm')
                        }`}>
                          {/* Barra de Ações (Hover no desktop e toque no mobile) com Ícones Vetoriais de Alto Padrão */}
                          {!msg.isInternal && (
                            <div className={`absolute -top-3.5 ${isMe ? 'right-2' : 'left-2'} z-20 ${selectedMessageForAction === msg.id ? 'flex' : 'hidden group-hover:flex'} items-center gap-0.5 bg-white dark:bg-[#182229] border border-slate-300 dark:border-slate-700/80 rounded-full px-1.5 py-0.5 shadow-lg backdrop-blur-md transition-all`}>
                              {/* Botão de Reagir */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveReactionPickerMessageId(activeReactionPickerMessageId === msg.id ? null : msg.id);
                                }}
                                title="Reagir"
                                className="p-1 rounded-full text-slate-700 hover:text-amber-500 dark:text-slate-300 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                              >
                                <Smile size={13} />
                              </button>

                              {/* Botão de Responder (Citar Mensagem) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingToMessage(msg);
                                  setSelectedMessageForAction(null);
                                  if (textareaRef.current) textareaRef.current.focus();
                                }}
                                title="Responder"
                                className="p-1 rounded-full text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                              >
                                <Reply size={13} />
                              </button>

                              {/* Botão de Encaminhar Mensagem / Áudio */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessageForAction(null);
                                  setForwardingMessage(msg);
                                }}
                                title={isAudioMsg ? "Encaminhar áudio" : "Encaminhar mensagem"}
                                className="p-1 rounded-full text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                              >
                                <Forward size={13} />
                              </button>

                              {/* Botão de Excluir Mensagem */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessageForAction(null);
                                  handleDeleteMessage(msg.id);
                                }}
                                title={isMe ? "Apagar mensagem para todos no WhatsApp" : "Apagar mensagem do histórico"}
                                className="p-1 rounded-full text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          {/* Popover Flutuante de Reações Rápidas */}
                          {activeReactionPickerMessageId === msg.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveReactionPickerMessageId(null)} />
                              <div className={`absolute -top-11 ${isMe ? 'right-0' : 'left-0'} z-40 flex items-center gap-1 bg-white dark:bg-[#182229] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-full px-2 py-1 animate-in zoom-in-95 duration-150`}>
                                {QUICK_REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleReaction(msg.id, emoji);
                                    }}
                                    className="hover:scale-125 transition-transform text-base p-1 leading-none rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Identificador de Nota Interna */}
                          {msg.isInternal && (
                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold mb-1 pb-0.5 border-b border-amber-300 dark:border-amber-500/20 text-[10px] uppercase tracking-wider">
                              <Lock size={10} />
                              <span>Nota Interna (Equipe)</span>
                            </div>
                          )}

                          {/* Pill de IA */}
                          {isAi && !msg.isInternal && (
                            <div className="inline-flex items-center gap-1 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 shadow-sm">
                              <Bot size={11} className="text-cyan-600 dark:text-cyan-400 animate-pulse" />
                              <span>IA {aiAgentName.toUpperCase()}</span>
                            </div>
                          )}

                          {/* Mensagem Citada (Quoted / Reply Card estilo WhatsApp) */}
                          {msg.quotedMessage && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(msg.quotedMessage.id);
                              }}
                              className={`mb-1.5 p-2 rounded-xl border-l-4 text-xs cursor-pointer select-none transition-all ${
                                isBorderlessMedia
                                  ? `${mediaSurfaceClasses} border-l-cyan-400`
                                  : isMe 
                                    ? 'bg-black/10 dark:bg-black/25 hover:bg-black/15 dark:hover:bg-black/35 border-blue-600 dark:border-cyan-400 text-slate-900 dark:text-white' 
                                    : 'bg-slate-100/95 hover:bg-slate-200/90 border-emerald-600 text-slate-900 dark:bg-black/30 dark:hover:bg-black/40 dark:border-emerald-400 dark:text-slate-100'
                              }`}
                              title="Ir para a mensagem original"
                            >
                              <div className={`font-bold text-[11px] flex items-center gap-1 mb-0.5 ${
                                isMe 
                                  ? 'text-blue-700 dark:text-cyan-300' 
                                  : 'text-emerald-700 dark:text-emerald-400'
                              }`}>
                                <Reply size={11} className="rotate-180 shrink-0" />
                                <span className="truncate">{msg.quotedMessage.senderName || (msg.quotedMessage.direction === 'OUTBOUND' ? 'Você' : (activeContactData?.name || 'Cliente'))}</span>
                              </div>
                              <div className="text-[11px] font-medium line-clamp-2 opacity-90">
                                {msg.quotedMessage.content || (
                                  msg.quotedMessage.type === 'image' ? '📷 Foto' :
                                  msg.quotedMessage.type === 'video' ? '🎥 Vídeo' :
                                  msg.quotedMessage.type === 'audio' ? '🎤 Mensagem de voz' :
                                  msg.quotedMessage.type === 'document' ? '📄 Documento' : 'Mensagem'
                                )}
                              </div>
                            </div>
                          )}

                          {/* Renderização de Imagens (Sem balão externo ao redor) */}
                          {isImageMsg && (
                            <div className="flex flex-col">
                              {getMediaUrl(msg.mediaUrl, 'image') ? (
                                <div 
                                  onClick={() => setLightboxImage({ url: getMediaUrl(msg.mediaUrl, 'image'), title: msg.content || 'Imagem' })}
                                  className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-md inline-block max-w-full"
                                  title="Clique para expandir em tela cheia"
                                >
                                  <img 
                                    src={getMediaUrl(msg.mediaUrl, 'image')} 
                                    alt={msg.content || "Anexo"} 
                                    className="rounded-2xl max-h-64 sm:max-h-72 object-cover transition-transform duration-300 group-hover:scale-[1.02]" 
                                    onError={(e) => {
                                      const driveId = extractGoogleDriveId(msg.mediaUrl);
                                      const target = e.currentTarget;
                                      if (driveId && !target.src.includes('drive-stream')) {
                                        target.src = `/api-backend/media/drive-stream/${driveId}?name=imagem.jpg`;
                                      } else {
                                        target.style.display = 'none';
                                        if (target.parentElement) {
                                          target.parentElement.innerHTML = '<div class="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-[#111C35] border border-slate-200 dark:border-white/10 text-slate-400 text-xs"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><span>Mídia indisponível</span></div>';
                                        }
                                      }
                                    }}
                                  />
                                  {/* Horário Flutuante no Canto da Imagem (Estilo WhatsApp) */}
                                  {!hasVisibleText && (
                                    <span className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] inline-flex items-center gap-1 backdrop-blur-xs select-none">
                                      <span>{formattedMsgTime}</span>
                                      {statusTicksNode}
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <div className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-xl flex items-center gap-1.5 text-xs font-semibold transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                                      <ZoomIn size={16} className="text-cyan-400" />
                                      <span>Expandir</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className={`${mediaSurfaceClasses} flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs shadow-sm`}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <ImageIcon size={17} className="shrink-0 opacity-70" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold truncate leading-tight">Imagem expirada do WhatsApp</span>
                                      <span className="text-[10px] opacity-75 truncate leading-tight">Mídia expirada no servidor original</span>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none">
                                    <span>{formattedMsgTime}</span>
                                    {statusTicksNode}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Botão de Análise de Imagem sob demanda ou Card Colapsável */}
                          {msg.type === 'image' && (
                            <div className="px-1 flex flex-col gap-1 mt-1">
                              {msg.content?.includes('📷 [Análise da Imagem]:') ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedImageAnalyses(prev => ({
                                        ...prev,
                                        [msg.id]: !prev[msg.id]
                                      }));
                                    }}
                                    className="flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer self-start text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                                  >
                                    <Sparkles size={12} className="shrink-0" />
                                    <span>{expandedImageAnalyses[msg.id] ? 'Ocultar análise da imagem' : 'Ver análise da imagem'}</span>
                                  </button>

                                  {expandedImageAnalyses[msg.id] && (
                                    <div className={`${mediaSurfaceClasses} rounded-xl p-2.5 text-xs animate-in fade-in slide-in-from-top-1 shadow-sm`}>
                                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-600 dark:text-cyan-400">
                                        <Sparkles size={11} />
                                        <span>Análise Visual por IA</span>
                                      </div>
                                      <p className="italic leading-relaxed text-[11px] opacity-90">
                                        "{msg.content.split('📷 [Análise da Imagem]:')[1]?.trim()}"
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={analyzingImageIds[msg.id]}
                                  onClick={() => handleAnalyzeImage(msg.id)}
                                  className="flex items-center gap-1.5 text-[11px] font-bold disabled:opacity-50 transition-colors cursor-pointer self-start text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                                  title="Analisar e descrever o conteúdo desta imagem com IA sob demanda"
                                >
                                  <Sparkles size={12} className={`shrink-0 ${analyzingImageIds[msg.id] ? 'animate-spin' : ''}`} />
                                  <span>{analyzingImageIds[msg.id] ? 'Analisando imagem com IA...' : 'Analisar imagem com IA'}</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Renderização de Vídeos (Sem balão externo ao redor) */}
                          {isVideoMsg && (
                            <div className="max-w-[320px] sm:max-w-[380px]">
                              {msg.mediaUrl?.includes('lvdphjhftfjdifnzuazd.supabase.co') ? (
                                <div className={`${mediaSurfaceClasses} flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs shadow-sm`}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Video size={17} className="shrink-0 text-amber-500 dark:text-amber-400" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold truncate leading-tight">Vídeo histórico indisponível</span>
                                      <span className="text-[10px] opacity-75 truncate leading-tight">Armazenamento do CRM anterior desativado</span>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none">
                                    <span>{formattedMsgTime}</span>
                                    {statusTicksNode}
                                  </span>
                                </div>
                              ) : getMediaUrl(msg.mediaUrl, 'video') ? (
                                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-md bg-black">
                                  <video
                                    src={getMediaUrl(msg.mediaUrl, 'video')}
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="rounded-2xl w-full max-h-72 object-contain bg-black"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      const driveId = extractGoogleDriveId(msg.mediaUrl);
                                      if (driveId && target.parentElement) {
                                        target.parentElement.innerHTML = `<div class="p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-900/95 text-white rounded-2xl border border-white/10 shadow-lg"><div class="flex items-center gap-2 text-cyan-400 text-xs font-bold"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>Vídeo Google Drive</div><p class="text-[11px] text-slate-300">Reprodução em aba externa para visualização integral</p><a href="https://drive.google.com/file/d/${driveId}/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="mt-1 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5">Abrir Vídeo ↗</a></div>`;
                                        return;
                                      }
                                      target.style.display = 'none';
                                      if (target.parentElement) {
                                        target.parentElement.innerHTML = '<div class="p-3 text-xs text-amber-600 dark:text-amber-400">Vídeo indisponível</div>';
                                      }
                                    }}
                                  >
                                    Seu navegador não suporta reprodução de vídeo.
                                  </video>
                                  {!hasVisibleText && (
                                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] inline-flex items-center gap-1 backdrop-blur-xs select-none pointer-events-none">
                                      <span>{formattedMsgTime}</span>
                                      {statusTicksNode}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className={`${mediaSurfaceClasses} flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs shadow-sm`}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Video size={17} className="shrink-0 opacity-70" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold truncate leading-tight">Vídeo expirado do WhatsApp</span>
                                      <span className="text-[10px] opacity-75 truncate leading-tight">Arquivo expirou no servidor da Meta</span>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none">
                                    <span>{formattedMsgTime}</span>
                                    {statusTicksNode}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Renderização de Localização (Sem balão externo ao redor) */}
                          {isLocationMsg && (
                            <div className={`${mediaSurfaceClasses} flex flex-col gap-2 p-3 rounded-2xl max-w-[320px] shadow-sm`}>
                              <div className="flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <MapPin size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold truncate">Localização compartilhada</h4>
                                    <p className="text-[11px] opacity-80 truncate">
                                      {msg.content?.replace(/^📍\s*/, '') || 'Coordenadas do WhatsApp'}
                                    </p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none">
                                  <span>{formattedMsgTime}</span>
                                  {statusTicksNode}
                                </span>
                              </div>
                              {(msg.mediaUrl || msg.content?.includes('http')) && (
                                <a
                                  href={msg.mediaUrl || (msg.content?.match(/https?:\/\/[^\s]+/)?.[0] || '#')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors"
                                >
                                  <MapPin size={13} />
                                  <span>Abrir no Google Maps</span>
                                  <ExternalLink size={12} className="ml-1 opacity-70" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Player de Áudio Direto na Tela (Sem Balão Externo ao Redor) */}
                          {isAudioMsg && (
                            <div className="flex flex-col gap-1 w-full min-w-[260px] max-w-[340px]">
                              {getAudioSrc(msg.mediaUrl) ? (
                                <VersusAudioPlayer
                                  src={getAudioSrc(msg.mediaUrl)}
                                  downloadName={`audio_${msg.id || Date.now()}.ogg`}
                                  isOutbound={isMe}
                                  timestamp={formattedMsgTime}
                                  statusNode={statusTicksNode}
                                  onForward={() => setForwardingMessage(msg)}
                                />
                              ) : msg.mediaUrl?.includes('mmg.whatsapp.net') ? (
                                <div className={`${mediaSurfaceClasses} flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs shadow-sm`}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Volume2 size={16} className="shrink-0 opacity-70" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold truncate leading-tight">Áudio expirado do WhatsApp</span>
                                      <span className="text-[10px] opacity-75 truncate leading-tight">Arquivo criptografado expirou na Meta</span>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none">
                                    <span>{formattedMsgTime}</span>
                                    {statusTicksNode}
                                  </span>
                                </div>
                              ) : (
                                <div className={`${mediaSurfaceClasses} flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs shadow-sm`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Volume2 size={16} className="shrink-0 animate-pulse text-cyan-500 dark:text-cyan-400" />
                                    <span className="font-medium truncate">Processando áudio recebido...</span>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none">
                                    <span>{formattedMsgTime}</span>
                                    {statusTicksNode}
                                  </span>
                                </div>
                              )}

                              {/* Botão de Expansão / Transcrição de Áudio sob demanda */}
                              <div className="px-1 flex flex-col gap-1">
                                {msg.audioTranscription ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExpandedTranscriptions(prev => ({
                                          ...prev,
                                          [audioKey]: !prev[audioKey]
                                        }));
                                      }}
                                      className="flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer self-start text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                                    >
                                      <FileText size={12} className="shrink-0" />
                                      <span>{expandedTranscriptions[audioKey] ? 'Ocultar transcrição' : 'Ver transcrição'}</span>
                                    </button>

                                    {expandedTranscriptions[audioKey] && (
                                      <div className={`${mediaSurfaceClasses} rounded-xl p-2.5 text-xs animate-in fade-in slide-in-from-top-1 shadow-sm`}>
                                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-600 dark:text-cyan-400">
                                          <Sparkles size={11} />
                                          <span>Transcrição por IA</span>
                                        </div>
                                        <p className="italic leading-relaxed text-[11px] opacity-90">
                                          "{msg.audioTranscription}"
                                        </p>
                                      </div>
                                    )}
                                  </>
                                ) : !msg.mediaUrl?.includes('lvdphjhftfjdifnzuazd.supabase.co') && (
                                  <button
                                    type="button"
                                    disabled={transcribingMessageIds[msg.id]}
                                    onClick={() => handleTranscribeAudio(msg.id)}
                                    className="flex items-center gap-1.5 text-[11px] font-bold disabled:opacity-50 transition-colors cursor-pointer self-start text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                                    title="Transcrever áudio sob demanda com IA"
                                  >
                                    {transcribingMessageIds[msg.id] ? (
                                      <>
                                        <RefreshCw size={12} className="shrink-0 animate-spin" />
                                        <span>Transcrevendo áudio...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles size={12} className="shrink-0" />
                                        <span>Transcrever áudio</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Documentos e Anexos Diretos na Tela (Sem Balão Externo ao Redor) */}
                          {isDocMsg && (
                            <div className={`${mediaSurfaceClasses} flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-colors max-w-[350px] shadow-sm`}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                                <FileText size={17} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs truncate font-bold block leading-tight" title={msg.content || 'Documento anexo'}>
                                  {msg.content?.replace(/^📄\s*\[Documento:\s*([^\]]+)\][\s\S]*$/, '$1') || (isGoogleDriveUrl(msg.mediaUrl) ? 'Catálogo / PDF (Google Drive)' : 'Documento anexo')}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] opacity-75 font-medium mt-0.5">
                                  <span className="uppercase tracking-wider">
                                    {isGoogleDriveUrl(msg.mediaUrl) ? 'GOOGLE DRIVE' : msg.mediaUrl?.includes('lvdphjhftfjdifnzuazd.supabase.co') ? 'ARQUIVO HISTÓRICO' : (msg.mediaUrl ? (msg.mediaUrl.split('.').pop()?.split('?')[0] || 'PDF') : 'DOCUMENTO')}
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <span>{formattedMsgTime}</span>
                                    {statusTicksNode}
                                  </span>
                                </div>
                              </div>
                              {getMediaUrl(msg.mediaUrl, 'document') && !msg.mediaUrl?.includes('lvdphjhftfjdifnzuazd.supabase.co') ? (
                                <a 
                                  href={getMediaUrl(msg.mediaUrl, 'document')} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="ml-auto p-1.5 rounded-lg transition-colors text-blue-600 dark:text-cyan-400 hover:bg-black/10 dark:hover:bg-white/10"
                                  title="Abrir anexo"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              ) : msg.mediaUrl?.includes('mmg.whatsapp.net') ? (
                                <span className="ml-auto opacity-60 text-[10px] italic">Expirado</span>
                              ) : null}
                            </div>
                          )}

                          {/* Conteúdo de Texto com Horário e Ticks Inline WhatsApp */}
                          {(!isBorderlessMedia || hasVisibleText) && (
                            <div className={`text-[0.92rem] leading-relaxed break-words relative ${isBorderlessMedia && hasVisibleText ? `${mediaSurfaceClasses} mt-1 px-3.5 py-2 rounded-2xl shadow-sm` : ''}`}>
                              {hasVisibleText && (
                                <span className="whitespace-pre-wrap select-text">{cleanedTextContent}</span>
                              )}
                              {/* Horário e Ticks WhatsApp (Float-Right Inline) */}
                              <span className={`inline-flex items-center gap-1 float-right ml-2.5 mt-1 select-none text-[11px] ${
                                msg.isInternal 
                                  ? 'text-amber-700/80 dark:text-amber-400/80' 
                                  : 'opacity-75'
                              }`}>
                                <span>{formattedMsgTime}</span>
                                {statusTicksNode}
                              </span>
                            </div>
                          )}

                          {/* Alerta de Falha de Envio / Sem WhatsApp */}
                          {isMe && !msg.isInternal && (msg.status === 'failed' || msg.status === 'error' || msg.status === 'no_whatsapp') && (
                            <div className={`mt-1 pt-1 border-t flex items-center justify-between gap-2 text-[10px] ${
                              msg.status === 'no_whatsapp' 
                                ? 'border-amber-500/30 text-amber-300' 
                                : 'border-rose-500/20 text-rose-300'
                            }`}>
                              <span className="flex items-center gap-1 font-semibold">
                                <AlertCircle size={11} className={msg.status === 'no_whatsapp' ? 'text-amber-400 shrink-0' : 'text-rose-400 shrink-0'} />
                                {msg.status === 'no_whatsapp' ? 'Contato sem WhatsApp ou número inválido' : 'Falha no envio'}
                              </span>
                              {msg.status !== 'no_whatsapp' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetryFailedMessage(msg);
                                    }}
                                    className="text-white bg-rose-600/80 hover:bg-rose-600 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                                    title="Tentar reenviar esta mensagem agora"
                                  >
                                    Reenviar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowTemplateModal(true);
                                    }}
                                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
                                    title="Modelos HSM para Meta Cloud API Oficial"
                                  >
                                    Modelo HSM
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-400/90 font-medium">
                                  Verifique o telefone ou contate por e-mail
                                </span>
                              )}
                            </div>
                          )}

                          {/* Pílula de Reações Flutuante no Canto do Balão (Padrão WhatsApp) */}
                          {Array.isArray(msg.reactions) && msg.reactions.length > 0 && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReactionPickerMessageId(activeReactionPickerMessageId === msg.id ? null : msg.id);
                              }}
                              title="Reações (clique para alternar reação)"
                              className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} z-10 flex items-center gap-1 bg-white dark:bg-[#182229] border border-slate-300 dark:border-slate-700/80 rounded-full px-2 py-0.5 shadow-md text-xs cursor-pointer select-none transition-transform hover:scale-105 backdrop-blur-md`}
                            >
                              {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).slice(0, 3).map((emoji: any, idx) => (
                                <span key={idx} className="text-xs leading-none">{emoji}</span>
                              ))}
                              {msg.reactions.length > 1 && (
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                                  {msg.reactions.length}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Âncora invisível para scroll automático na última mensagem */}
              <div ref={messagesEndRef} className="h-0 w-0 shrink-0" />
            </div>

            {/* Chat Input Area (Estrutura e Formato Idênticos ao WhatsApp) */}
            <div className={`border-t ${isWhatsApp ? 'border-[#222D34] bg-[#202C33]' : 'border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0B1224]'} z-30 flex flex-col shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-0`}>
              {/* Barra de Resposta / Citação Ativa (WhatsApp Quote Bar) */}
              {replyingToMessage && (
                <div className="mx-2 sm:mx-3 mt-2 p-2.5 px-3 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700/90 shadow-md flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2.5 overflow-hidden border-l-4 border-emerald-600 dark:border-emerald-400 pl-2.5 py-0.5 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0 w-full">
                      <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 leading-tight">
                        <Reply size={13} className="rotate-180 shrink-0" />
                        <span>Respondendo a {replyingToMessage.direction === 'OUTBOUND' ? 'Você' : (activeContactData?.name || 'Cliente')}</span>
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block mt-0.5 leading-snug">
                        {replyingToMessage.content || (
                          replyingToMessage.type === 'image' ? '📷 Foto' :
                          replyingToMessage.type === 'video' ? '🎥 Vídeo' :
                          replyingToMessage.type === 'audio' ? '🎤 Mensagem de voz' :
                          replyingToMessage.type === 'document' ? '📄 Documento' : 'Mensagem'
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    className="p-1.5 rounded-full text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-slate-800/80 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Cancelar resposta"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Banner Informativo quando o Atendimento estiver Finalizado */}
              {isResolved && (
                <div className="bg-slate-100 dark:bg-[#0F172A]/95 border-b border-slate-200 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <Lock size={12} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate block">
                        Atendimento finalizado. Enviar mensagem reabrirá automaticamente o ticket.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReopen}
                    disabled={isReopening}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <ArrowRightLeft size={11} />
                    <span>{isReopening ? 'Reabrindo...' : 'Reabrir Atendimento'}</span>
                  </button>
                </div>
              )}
                
                {/* File Preview */}
                {selectedFile && (
                  <div className="mx-3 mt-2.5 p-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-blue-500/40 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">{selectedFile.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedFile.type.startsWith('image/') ? 'Foto / Imagem' : 'Documento'}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploadingMedia}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Descartar anexo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {isPeeking ? (
                  <div className="p-4 bg-amber-50 dark:bg-[#0F172A] border-t border-amber-200 dark:border-amber-500/30 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                      <Lock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Modo somente-leitura (Espiando). Envio bloqueado para não interferir no fluxo do bot ou fila.</span>
                    </div>
                    <button
                      onClick={() => handleTakeover(activeChat!)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.35)] flex items-center gap-1.5 cursor-pointer shrink-0 ml-3"
                    >
                      <UserCheck size={14} />
                      Atribuir atendimento para mim
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Indicador Sutil de Modo Nota Interna */}
                    {isInternalMode && (
                      <div className="bg-amber-100/70 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-amber-900 dark:text-amber-300 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold text-[11px]">Modo Nota Interna (Privado - visível apenas para a equipe)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsInternalMode(false)}
                          className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-white text-[11px] underline cursor-pointer"
                        >
                          Voltar para WhatsApp
                        </button>
                      </div>
                    )}

                    {/* Barra de Input Flutuante Nativa Padrão WhatsApp Web */}
                    <div className={`p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 relative ${isWhatsApp ? 'bg-[#202C33] border-t border-[#222D34]' : 'bg-white dark:bg-[#0B1224]'} w-full max-w-full shrink-0`}>
                      {isRecording ? (
                        /* Painel de Gravação de Áudio WhatsApp */
                        <div className="flex-1 bg-rose-50 dark:bg-[#11192A] border border-rose-300 dark:border-rose-500/40 rounded-xl px-4 py-2 flex items-center justify-between animate-in fade-in duration-200 min-h-[44px]">
                          <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-rose-500" />
                              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Gravando áudio...</span>
                              <span className="text-[12px] font-mono text-slate-900 dark:text-white font-bold">{formatTimer(recordingTime)}</span>
                            </div>
                            {/* Ondas Sonoras */}
                            <div className="flex items-center gap-1 h-5 ml-4">
                              {[45, 80, 50, 100, 65, 90, 70, 95, 45, 85, 60, 95].map((h, idx) => (
                                <div
                                  key={idx}
                                  style={{ height: `${h}%` }}
                                  className="w-1 bg-rose-500 dark:bg-rose-400 rounded-full animate-pulse"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={cancelRecording}
                              disabled={isSendingAudio}
                              className="p-2 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 dark:bg-slate-800/80 dark:hover:bg-rose-900/60 dark:text-slate-400 dark:hover:text-rose-300 transition-colors cursor-pointer"
                              title="Descartar gravação"
                            >
                              <Trash2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={stopAndSendAudio}
                              disabled={isSendingAudio}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Enviar áudio gravado"
                            >
                              <Send size={14} />
                              <span>{isSendingAudio ? "Enviando..." : "Enviar Áudio"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 1. Botão Emoji WhatsApp (Oculto em telas pequenas onde o teclado nativo já tem emojis) */}
                          <div className="relative hidden sm:flex shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(prev => !prev)}
                              className={`p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                                showEmojiPicker ? 'text-amber-500 dark:text-amber-400 bg-slate-100 dark:bg-slate-800/80' : ''
                              }`}
                              title="Emojis"
                            >
                              <Smile size={20} />
                            </button>

                            {showEmojiPicker && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                <div className="absolute bottom-12 left-0 w-72 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.8)] rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Emojis Frequentes</span>
                                    <button
                                      type="button"
                                      onClick={() => setShowEmojiPicker(false)}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto">
                                    {COMMON_EMOJIS.map((emoji, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleInsertEmoji(emoji)}
                                        className="w-7 h-7 flex items-center justify-center text-base hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* 2. Botão Clipes/Anexo WhatsApp */}
                          <div className="relative shrink-0">
                            <button 
                              type="button"
                              onClick={() => setShowAttachments(!showAttachments)}
                              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
                              title="Anexar arquivo ou atalhos"
                            >
                              <Paperclip size={20} />
                            </button>
                            
                            {showAttachments && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowAttachments(false)} />
                                <div className="absolute bottom-12 left-0 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/90 shadow-[0_15px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.8)] rounded-2xl p-2 flex flex-col gap-1 w-56 z-50 animate-in slide-in-from-bottom-2">
                                  <label className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer transition-colors">
                                    <ImageIcon size={16} className="text-blue-500 dark:text-blue-400" /> Foto / Vídeo
                                    <input ref={fileInputImageRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                                  </label>
                                  <label className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer transition-colors">
                                    <FileText size={16} className="text-cyan-600 dark:text-cyan-400" /> Documento
                                    <input ref={fileInputDocRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} />
                                  </label>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setShowAttachments(false);
                                      startRecording();
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors text-left w-full cursor-pointer"
                                  >
                                    <Mic size={16} className="text-rose-500 dark:text-rose-400" /> Gravar Áudio
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setShowAttachments(false);
                                      setInputText('/');
                                      setShowQuickReplies(true);
                                      setTimeout(() => textareaRef.current?.focus(), 50);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors text-left w-full cursor-pointer sm:hidden"
                                  >
                                    <Zap size={16} className="text-amber-500 dark:text-amber-400" /> Respostas Rápidas (/)
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Botão de Atalho Rápido / (Oculto em telas pequenas pois digitar '/' no campo já abre as respostas) */}
                          <div className="relative hidden sm:flex shrink-0">
                            <button 
                              type="button"
                              onClick={() => {
                                setShowQuickReplies(prev => {
                                  const nextState = !prev;
                                  if (nextState) {
                                    if (!inputText.startsWith('/')) {
                                      setInputText('/');
                                    }
                                    setQuickReplyFilter('');
                                    setQuickReplyIndex(0);
                                    setTimeout(() => textareaRef.current?.focus(), 50);
                                  }
                                  return nextState;
                                });
                              }}
                              className={`p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center font-mono font-bold text-sm ${
                                showQuickReplies 
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-400 dark:ring-blue-500/40' 
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                              }`}
                              title="Respostas Rápidas & Catálogo (/)"
                            >
                              <span className="leading-none text-base">/</span>
                            </button>
                          </div>

                          {/* 3. Cápsula de Texto WhatsApp com Cantos Arredondados */}
                          <div className={`flex-1 min-w-0 border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 min-h-[42px] sm:min-h-[44px] max-h-36 flex items-center transition-all shadow-inner relative ${
                            isInternalMode 
                              ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/15 focus-within:border-amber-500' 
                              : isWhatsApp
                                ? 'bg-[#2A3942] border-transparent focus-within:border-transparent text-[#E9EDEF]'
                                : 'bg-slate-100 dark:bg-[#161F30] border-slate-200 dark:border-slate-700 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/20'
                          }`}>
                            <textarea 
                              ref={textareaRef}
                              placeholder={isInternalMode ? "Digite uma anotação privada... Visível apenas para a equipe" : "Digite uma mensagem (ou '/' para atalhos e catálogo)"} 
                              className={`w-full flex-1 min-w-0 bg-transparent text-[0.93rem] resize-none outline-none py-0.5 max-h-32 
                                ${isInternalMode ? 'text-amber-950 dark:text-amber-100 placeholder:text-amber-600/60 dark:placeholder:text-amber-500/50' : isWhatsApp ? 'text-[#E9EDEF] placeholder:text-[#8696A0]' : 'text-slate-900 dark:text-slate-100 placeholder:text-slate-400'}
                              `}
                              rows={1}
                              value={inputText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInputText(val);
                                
                                if (val.startsWith('/')) {
                                  setShowQuickReplies(true);
                                  setQuickReplyFilter(val.substring(1));
                                  setQuickReplyIndex(0);
                                } else {
                                  setShowQuickReplies(false);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (showQuickReplies) {
                                  if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    if (filteredSlashItems.length > 0) {
                                      setQuickReplyIndex(prev => (prev + 1) % filteredSlashItems.length);
                                    }
                                    return;
                                  }
                                  if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    if (filteredSlashItems.length > 0) {
                                      setQuickReplyIndex(prev => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
                                    }
                                    return;
                                  }
                                  if (e.key === 'Enter' || e.key === 'Tab') {
                                    if (filteredSlashItems.length > 0) {
                                      e.preventDefault();
                                      const selected = filteredSlashItems[quickReplyIndex] || filteredSlashItems[0];
                                      handleSelectSlashItem(selected);
                                      return;
                                    }
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setShowQuickReplies(false);
                                    return;
                                  }
                                }

                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (!showQuickReplies) {
                                    handleSendMessage();
                                  }
                                }
                              }}
                            />
                            
                            {/* Popover de Respostas Rápidas & Catálogo (Menu / - Padrão Lero) */}
                            {showQuickReplies && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowQuickReplies(false)} />
                                <div className="absolute bottom-full left-0 mb-3 w-[520px] max-w-[95vw] bg-[#1a2230] border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2">
                                  {/* Top Search Filter Header */}
                                  <div className="px-4 py-2.5 bg-[#141b27] border-b border-slate-700/70 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 w-full text-slate-300">
                                      <span className="text-emerald-400 font-bold font-mono text-sm select-none">/</span>
                                      <input 
                                        type="text"
                                        value={quickReplyFilter}
                                        onChange={(e) => {
                                          setQuickReplyFilter(e.target.value);
                                          setQuickReplyIndex(0);
                                        }}
                                        placeholder="Digite para filtrar..."
                                        className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-full text-sm font-sans"
                                        autoFocus
                                      />
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => setShowQuickReplies(false)} 
                                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                                      title="Fechar"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  {/* Subheader: Mensagens da Equipe */}
                                  <div className="px-4 py-2 bg-[#101723] flex items-center gap-2 text-xs font-semibold text-slate-400 border-b border-slate-800/80">
                                    <Users size={14} className="text-slate-400 shrink-0" />
                                    <span>Mensagens da Equipe</span>
                                    <span className="ml-auto text-[10px] text-slate-500 font-mono">
                                      {filteredSlashItems.length} atalhos
                                    </span>
                                  </div>

                                  {/* Lista de itens */}
                                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                                    {filteredSlashItems.length > 0 ? (
                                      filteredSlashItems.map((item, idx) => {
                                        const isSelected = idx === quickReplyIndex;
                                        return (
                                          <div 
                                            key={item.id} 
                                            onClick={() => handleSelectSlashItem(item)}
                                            onMouseEnter={() => setQuickReplyIndex(idx)}
                                            className={`px-3 py-2 cursor-pointer transition-colors flex items-start gap-3 rounded-xl ${
                                              isSelected 
                                                ? 'bg-[#153828] border border-emerald-500/50 text-white shadow-sm' 
                                                : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                                            }`}
                                          >
                                            <MessageSquare 
                                              size={16} 
                                              className={`shrink-0 mt-1 transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} 
                                            />

                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-emerald-400 font-mono">
                                                  {item.shortcut}
                                                </span>
                                                <span className="text-sm font-bold text-white truncate">
                                                  {item.title}
                                                </span>
                                                {item.isMedia && (
                                                  <div className="inline-flex items-center gap-1.5 ml-0.5">
                                                    <Paperclip size={12} className="text-emerald-400 shrink-0" />
                                                    {(item.imageCount || 0) > 0 && (
                                                      <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] px-1.5 py-0.2 rounded font-medium">
                                                        <ImageIcon size={11} /> {item.imageCount}
                                                      </span>
                                                    )}
                                                    {(item.videoCount || 0) > 0 && (
                                                      <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] px-1.5 py-0.2 rounded font-medium">
                                                        <Video size={11} /> {item.videoCount}
                                                      </span>
                                                    )}
                                                    {(item.docCount || 0) > 0 && (
                                                      <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] px-1.5 py-0.2 rounded font-medium">
                                                        <FileText size={11} /> {item.docCount}
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                                {item.category === 'action' && (
                                                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded border border-slate-700">ação</span>
                                                )}
                                              </div>
                                              <p className="text-xs text-slate-400 truncate mt-0.5 leading-relaxed">
                                                {item.description}
                                              </p>
                                            </div>

                                            <button 
                                              type="button" 
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setShowQuickReplies(false); 
                                                window.open('/settings?tab=quick-replies', '_blank'); 
                                              }} 
                                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2" 
                                              title="Editar atalho"
                                            >
                                              <Pencil size={13} />
                                            </button>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="p-5 text-center">
                                        <p className="text-xs text-slate-400 mb-2">
                                          Nenhum atalho encontrado para <span className="font-mono text-emerald-400 font-bold">/{quickReplyFilter}</span>
                                        </p>
                                        <a 
                                          href="/settings?tab=quick-replies" 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline"
                                        >
                                          <Plus size={12} /> Criar nova resposta rápida
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {/* Rodapé Padrão Lero */}
                                  <div className="px-4 py-2.5 bg-[#0e1522] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                    <div className="flex items-center gap-4">
                                      <span>↑↓ navegar</span>
                                      <span>Enter selecionar</span>
                                      <span>Esc fechar</span>
                                    </div>
                                    <a 
                                      href="/settings?tab=quick-replies" 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-sans"
                                    >
                                      <span>Gerenciar atalhos</span>
                                      <ExternalLink size={11} />
                                    </a>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* 4. Botão de Gravar Áudio + Botão Enviar Mensagem (SEMPRE VISÍVEIS) */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Botão Gravar Áudio */}
                            <button 
                              type="button"
                              onClick={startRecording}
                              title="Gravar mensagem de voz"
                              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                            >
                              <Mic size={20} />
                            </button>

                            {/* Botão Enviar Mensagem - Ícone Send SEMPRE VISÍVEL */}
                            <button 
                              type="button"
                              onClick={handleSendMessage} 
                              disabled={isUploadingMedia || (!inputText.trim() && !selectedFile)}
                              title={isUploadingMedia ? "Enviando..." : "Enviar mensagem"}
                              className={`p-2 sm:p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed
                                ${(inputText.trim() || selectedFile)
                                  ? (isInternalMode 
                                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(217,119,6,0.4)] active:scale-95' 
                                      : isWhatsApp
                                        ? 'bg-[#00A884] hover:bg-[#02906F] text-white shadow-[0_0_12px_rgba(0,168,132,0.4)] active:scale-95'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] active:scale-95'
                                    )
                                  : isWhatsApp
                                    ? 'bg-[#2A3942] text-[#8696A0] hover:text-[#E9EDEF]'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700/80'
                                }
                              `}
                            >
                              {isUploadingMedia ? (
                                <RefreshCw size={18} className="animate-spin text-white" />
                              ) : (
                                <Send size={18} className="ml-0.5" />
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

          </>
        )}
      </div>

      {/* 3. PAINEL DIREITO: Dados do Contato (Padrão WhatsApp Web com Overlay Mobile) */}
      {showContactInfo && activeContactData && (
        <div className="fixed inset-0 z-50 md:relative md:inset-auto md:w-[320px] lg:w-[350px] flex-shrink-0 bg-white dark:bg-[#0B1224] flex flex-col overflow-y-auto border-l border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-right-2 duration-150">
          {/* Header do Painel Direito */}
          <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-[#0B1224] shrink-0">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setShowContactInfo(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dados do contato</h3>
            </div>
          </div>

          {/* Cartão de Perfil Circular */}
          <div className="p-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-800/80 relative bg-gradient-to-b from-slate-100/60 dark:from-[#17253D]/40 to-transparent">
            {(() => {
              const drawerDept = resolveContactDepartment(activeContactData);
              return (
                <div 
                  className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700/80 flex items-center justify-center text-slate-800 dark:text-white font-black text-2xl shadow-xl mb-3 overflow-hidden relative transition-all"
                  style={drawerDept?.color ? {
                    boxShadow: `0 0 0 3px ${drawerDept.color}`,
                    borderColor: drawerDept.color,
                  } : undefined}
                  title={drawerDept?.name ? `Setor / Região: ${drawerDept.name}` : undefined}
                >
                  {isAvatarUrlValid(activeContactData.avatarUrl) ? (
                    <img 
                      src={activeContactData.avatarUrl!} 
                      alt={activeContactData.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}

                  <span className={`avatar-initials ${activeContactData.avatarUrl ? "hidden" : ""}`}>
                    {getContactInitials(activeContactData.name, activeContactData.phone)}
                  </span>
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0B1224] shadow-sm" />
                </div>
              );
            })()}

            {isEditingName ? (
              <div className="flex items-center gap-1.5 w-full justify-center max-w-xs mt-1">
                <input
                  type="text"
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  placeholder="Nome do contato"
                  className="bg-slate-100 dark:bg-slate-900 border border-emerald-500/50 rounded px-2.5 py-1 text-sm text-slate-900 dark:text-white font-semibold outline-none text-center w-full focus:border-emerald-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveContactName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveContactName}
                  disabled={isSavingName}
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                  title="Salvar nome"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-center group/name">
                <h2 className="text-base font-bold text-slate-900 dark:text-white text-center leading-snug">
                  {formatContactDisplayName(activeContactData.name, activeContactData.phone)}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNameValue(activeContactData.name === 'Cliente WhatsApp' ? '' : activeContactData.name || '');
                    setIsEditingName(true);
                  }}
                  className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 transition-colors cursor-pointer opacity-70 group-hover/name:opacity-100"
                  title="Editar nome do contato"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">WhatsApp Cloud API</p>
            </div>

            {/* Atalhos Rápidos: Ligar VoIP, Ver no CRM, Copiar */}
            <div className="flex items-center gap-2 mt-4 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = activeContactData.phone?.replace(/\D/g, '') || '';
                  if (cleanPhone && cleanPhone.length >= 8) {
                    setVoipNumber(cleanPhone);
                    setShowVoipDialer(true);
                  } else {
                    toast.error('Número de telefone não disponível para chamada.');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Iniciar chamada VoIP"
              >
                <PhoneCall size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Ligar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const dealId = currentDeal?.id;
                  const contactId = activeContactData?.contactId;
                  const phone = activeContactData?.phone?.replace(/\D/g, '') || '';
                  if (dealId) {
                    router.push(`/crm?dealId=${dealId}`);
                  } else if (contactId) {
                    router.push(`/crm?contactId=${contactId}`);
                  } else if (phone) {
                    router.push(`/crm?search=${encodeURIComponent(phone)}`);
                  } else {
                    router.push('/crm');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Visualizar oportunidade deste cliente no CRM"
              >
                <TrendingUp size={13} className="text-blue-600 dark:text-blue-400" />
                <span>CRM</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(activeContactData.phone || activeContactData.name, 'lead-all')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Copiar dados do contato"
              >
                {copiedField === 'lead-all' ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} className="text-purple-600 dark:text-purple-400" />}
                <span>{copiedField === 'lead-all' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* BLOCO DE DESTAQUE: RADAR DE STORIES & STATUS (ÚLTIMAS 24H) */}
            {contactLatestStory && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-blue-950/30 dark:via-[#070D1B] dark:to-[#0B1224] border border-blue-200/80 dark:border-blue-900/40 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Eye size={12} className="text-blue-500" />
                    <span>Visualizou Status Recente</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {contactLatestStory.exactTime}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Miniatura da Foto com Zoom */}
                  <div
                    onClick={() => {
                      if (contactLatestStory.mediaUrl) {
                        setLightboxImage({
                          url: contactLatestStory.mediaUrl,
                          title: `${contactLatestStory.title} • ${contactLatestStory.category} (${contactLatestStory.relative})`,
                        });
                      }
                    }}
                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 group/inboxThumb cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-500 transition-all"
                    title="Clique para abrir foto ampliada do Story"
                  >
                    {contactLatestStory.mediaUrl ? (
                      <img
                        src={contactLatestStory.mediaUrl}
                        alt={contactLatestStory.title}
                        className="w-full h-full object-cover group-hover/inboxThumb:scale-110 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/inboxThumb:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Título e Categoria */}
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {contactLatestStory.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {contactLatestStory.category}
                      </span>
                      <span className="text-slate-400">
                        {contactLatestStory.relative}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão de Ação: Ver Foto sem Sair do Chat */}
                {contactLatestStory.mediaUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({
                        url: contactLatestStory.mediaUrl!,
                        title: `${contactLatestStory.title} • ${contactLatestStory.category} (${contactLatestStory.relative})`,
                      })
                    }
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Maximize2 size={13} />
                    <span>Visualizar Foto do Story</span>
                  </button>
                )}
              </div>
            )}

            {/* Informações de Contato */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Informações de Contato</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400/90 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  WhatsApp
                </span>
              </h3>

              {/* Telefone */}
              <div className="flex flex-col gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-300 min-w-0 flex-1 mr-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Phone size={13} />
                    </div>
                    {isEditingPhone ? (
                      <input
                        type="text"
                        value={editingPhoneValue}
                        onChange={(e) => setEditingPhoneValue(e.target.value)}
                        placeholder="Ex: +55 (54) 99999-9999"
                        className="bg-white dark:bg-slate-900 border border-emerald-500/50 rounded px-2 py-1 text-xs text-slate-900 dark:text-white outline-none font-mono focus:border-emerald-400 w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveContactPhone();
                          if (e.key === 'Escape') setIsEditingPhone(false);
                        }}
                      />
                    ) : isLidPhoneNumber(activeContactData.phone) ? (
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-sans text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></span>
                          WhatsApp Direto (LID)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPhoneValue('');
                            setIsEditingPhone(true);
                          }}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium hover:underline cursor-pointer"
                        >
                          + Inserir número
                        </button>
                      </div>
                    ) : (
                      <span className="truncate font-mono font-medium text-slate-900 dark:text-white text-xs" title={activeContactData.phone || ''}>
                        {formatDisplayPhoneNumber(activeContactData.phone)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditingPhone ? (
                      <button
                        type="button"
                        onClick={handleSaveContactPhone}
                        disabled={isSavingPhone}
                        className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Salvar telefone"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPhoneValue(isLidPhoneNumber(activeContactData.phone) ? '' : activeContactData.phone || '');
                            setIsEditingPhone(true);
                          }}
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                          title="Editar número de telefone"
                        >
                          <Pencil size={12} />
                        </button>
                        {!isLidPhoneNumber(activeContactData.phone) && activeContactData.phone && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(activeContactData.phone?.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, ''), 'phone')}
                            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white p-1 transition-colors cursor-pointer"
                            title="Copiar telefone"
                          >
                            {copiedField === 'phone' ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* E-mail */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-300 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400">
                    <Mail size={13} />
                  </div>
                  <span className="truncate font-sans">{activeContactData.email || 'Sem e-mail'}</span>
                </div>
                {activeContactData.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeContactData.email, 'email')}
                    className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white p-1 transition-colors"
                    title="Copiar e-mail"
                  >
                    {copiedField === 'email' ? <CheckCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>

            {/* Tags com Cores Dinâmicas */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag size={11} className="text-blue-600 dark:text-blue-400" />
                  <span>Etiquetas & Segmentos</span>
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{activeContactData.tags?.length || 0}</span>
              </div>

              {/* Tags Atuais */}
              <div className="flex flex-wrap gap-1.5">
                {activeContactData.tags && activeContactData.tags.length > 0 ? (
                  activeContactData.tags.map((tag: string) => {
                    const color = getTagColor(tag);
                    return (
                      <span 
                        key={tag} 
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold ${color.bg} ${color.text} ${color.border} shadow-sm group`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        <span>{tag}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag(activeContactData.contactId, tag)} 
                          className="ml-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remover etiqueta"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma etiqueta atribuída</span>
                )}
              </div>

              {/* Campo para Nova Tag */}
              <div className="flex gap-1.5 mt-1">
                <input 
                  type="text" 
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTag(activeContactData.contactId);
                  }}
                  placeholder="Criar nova etiqueta..." 
                  className="flex-1 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button 
                  type="button"
                  onClick={() => handleAddTag(activeContactData.contactId)} 
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-400 dark:border-blue-500/40 text-xs px-3 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Sugestões Rápidas de Etiquetas */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 mr-1">Rápidas:</span>
                {SUGGESTED_TAGS.map((stag) => (
                  <button
                    key={stag}
                    type="button"
                    onClick={(e) => handleQuickAddTag(e, activeContactData.contactId, stag)}
                    className="text-[10px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-slate-800/60 dark:hover:bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/50 transition-colors cursor-pointer"
                  >
                    +{stag}
                  </button>
                ))}
              </div>
            </div>

            {/* Atendimento & Status Operacional */}
            <div className="bg-slate-50 dark:bg-[#11192A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Status Operacional</h3>
              
              <div className={`w-full text-center py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 border ${
                activeContactData.status === 'bot_active' 
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-700/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : activeContactData.status === 'human_takeover'
                  ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : activeContactData.status === 'resolved' || activeContactData.status === 'closed'
                  ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              }`}>
                {activeContactData.status === 'bot_active' ? (
                  <>
                    <Bot size={14} className="text-cyan-600 dark:text-cyan-400 animate-pulse" />
                    <span>IA {aiAgentName} em Atendimento</span>
                  </>
                ) : (activeContactData.status === 'human_takeover' || activeContactData.status === 'open') ? (
                  <>
                    <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Atendimento Ativo</span>
                  </>
                ) : activeContactData.status === 'resolved' || activeContactData.status === 'closed' ? (
                  <>
                    <Lock size={14} className="text-slate-500 dark:text-slate-400" />
                    <span>Ticket Finalizado</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Atendente Humano</span>
                  </>
                )}
              </div>

              {/* Informações Complementares */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Última Interação</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{activeContactData.time || 'Hoje'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Atribuído a</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                    {activeContactData.assignedUser ? activeContactData.assignedUser.name : (activeContactData.assignedTo ? 'Atendente' : 'Fila Geral')}
                  </span>
                </div>

                {/* Departamento / Setor da Conversa */}
                <div className="flex flex-col col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-500">Departamento / Setor</span>
                  <div className="flex items-center justify-between mt-1">
                    {(() => {
                      const drawerDept = resolveContactDepartment(activeContactData);
                      return drawerDept ? (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5"
                          style={{
                            backgroundColor: (drawerDept.color || "#3b82f6") + "20",
                            borderColor: (drawerDept.color || "#3b82f6") + "40",
                            color: drawerDept.color || "#60a5fa",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: drawerDept.color || "#3b82f6" }}
                          />
                          <span>{drawerDept.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Nenhum setor definido</span>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => loadDepartmentsAndShowTransfer()}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer underline flex items-center gap-1"
                    >
                      <ArrowRightLeft size={11} />
                      Transferir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TRANSFERENCIA */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1c1d22] border border-slate-200 dark:border-gray-800 w-full max-w-md rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#25262c] rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-primary" />
                Transferir Conversa
              </h2>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                Selecione o departamento para a fila geral ou escolha um atendente específico vinculado ao setor:
              </p>
              
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {departments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-gray-500 text-center py-4">Nenhum departamento encontrado.</p>
                ) : (
                  departments.map(dept => (
                    <div
                      key={dept.id}
                      className="rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/80 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${dept.color || '#3b82f6'}25` }}>
                            <Network size={16} style={{ color: dept.color || '#3b82f6' }} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{dept.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-gray-400">{dept.users?.length || 0} membro(s) vinculados</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTransfer(dept.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                          title="Distribuir para a fila geral deste setor"
                        >
                          Fila do Setor
                        </button>
                      </div>

                      {dept.users && dept.users.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/70 dark:border-gray-700/60 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-slate-400 font-medium">Ou atribuir a:</span>
                          {dept.users.map((u: any) => {
                            const usr = u.user || u;
                            return (
                              <button
                                key={usr.id}
                                type="button"
                                onClick={() => handleTransfer(dept.id, usr.id)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-600 text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <User size={10} className="text-slate-400" />
                                <span>{usr.name || 'Atendente'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL DE ASSUNÇÃO DE FILA / IA (PADRÃO LERO) */}
      {showTakeoverModal && selectedQueueChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,102,255,0.2)]">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Atendimento em Fila</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Este atendimento está na fila <strong className="text-slate-800 dark:text-white">{selectedQueueChat.isAi ? `IA ${aiAgentName} Online` : 'Aguardando'}</strong>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTakeoverModal(false);
                  setSelectedQueueChat(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informações do Lead */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-slate-700/50 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-white font-bold text-sm shrink-0 overflow-hidden relative">
                  {isAvatarUrlValid(selectedQueueChat.avatarUrl) ? (
                    <img 
                      src={selectedQueueChat.avatarUrl!} 
                      alt={selectedQueueChat.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}

                  <span className={`avatar-initials ${selectedQueueChat.avatarUrl ? "hidden" : ""}`}>
                    {getContactInitials(selectedQueueChat.name, selectedQueueChat.phone)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{formatContactDisplayName(selectedQueueChat.name, selectedQueueChat.phone)}</h3>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                      {selectedQueueChat.isAi ? 'IA Ativa' : 'Fila de Espera'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone size={11} className="text-slate-400 dark:text-slate-500" />
                    <span>{selectedQueueChat.phone || 'Sem telefone'}</span>
                  </p>
                  {selectedQueueChat.lastMsg && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 italic">
                      "{selectedQueueChat.lastMsg}"
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Escolha uma ação para continuar com este atendimento:
              </p>

              {/* 3 Ações Principais */}
              <div className="flex flex-col gap-2.5 pt-1">
                {/* Ação 1: Atribuir atendimento para mim */}
                <button
                  onClick={() => handleTakeover(selectedQueueChat.id)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer group"
                >
                  <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Atribuir atendimento para mim</span>
                </button>

                {/* Ação 2: Transferir atendimento */}
                <button
                  onClick={() => {
                    setShowTakeoverModal(false);
                    loadDepartmentsAndShowTransfer();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-[#1E293B] dark:hover:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-200 dark:hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowRightLeft size={15} className="text-blue-500 dark:text-blue-400" />
                  <span>Transferir atendimento</span>
                </button>

                {/* Ação 3: Espiar conversa */}
                <button
                  onClick={() => {
                    setIsPeeking(true);
                    setActiveChat(selectedQueueChat.id);
                    setShowTakeoverModal(false);
                  }}
                  className="w-full py-2 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Espiar conversa (somente leitura)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDA DE CONTATOS */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookUser size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Agenda de Contatos</h3>
              </div>
              <button onClick={() => setShowContactsModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Pesquisar contato salvo..." 
                  className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  value={contactModalSearch}
                  onChange={e => setContactModalSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {(() => {
                const list = (directoryContacts && directoryContacts.length > 0 ? directoryContacts : contacts).filter((c: any) => {
                  if (!contactModalSearch.trim()) return true;
                  const q = contactModalSearch.toLowerCase();
                  return (
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.email && c.email.toLowerCase().includes(q))
                  );
                });

                if (list.length === 0) {
                  return <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Nenhum contato encontrado.</p>;
                }

                return list.map((c: any) => {
                  const modalDept = resolveContactDepartment(c);
                  return (
                  <div 
                    key={c.id} 
                    onClick={async () => {
                      setIsPeeking(false);
                      setShowContactsModal(false);
                      try {
                        const { data: conv } = await api.get(`/conversations/contact/${c.id}`);
                        if (conv?.id) {
                          setActiveChat(conv.id);
                          refetchConversations();
                        }
                      } catch (err) {
                        setActiveChat(c.id);
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="p-[2px] rounded-full shrink-0 transition-all"
                        style={
                          modalDept?.color
                            ? {
                                backgroundColor: modalDept.color,
                                boxShadow: `0 0 0 1px ${modalDept.color}40, 0 2px 6px ${modalDept.color}30`,
                              }
                            : undefined
                        }
                        title={modalDept?.name ? `Setor / Região: ${modalDept.name}` : undefined}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white relative overflow-hidden shrink-0">
                          {isAvatarUrlValid(c.avatarUrl) ? (
                            <img 
                              src={c.avatarUrl!} 
                              alt={c.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}

                          <span className={`avatar-initials ${c.avatarUrl ? "hidden" : ""}`}>
                            {getContactInitials(c.name, c.phone)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{formatContactDisplayName(c.name, c.phone)}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          <span>{c.phone || 'Sem telefone'}</span>
                          {modalDept?.name && (
                            <>
                              <span>•</span>
                              <span className="font-semibold truncate" style={{ color: modalDept.color }}>
                                {modalDept.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded shrink-0">
                      Conversar
                    </span>
                  </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENCAMINHAR MENSAGEM / ÁUDIO */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                  <Forward size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {forwardingMessage.type === 'audio' ? 'Encaminhar Áudio' : 'Encaminhar Mensagem'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selecione o contato ou conversa de destino
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForwardingMessage(null);
                  setForwardSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview da Mensagem / Áudio sendo encaminhado */}
            <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-[#131d33] border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                {forwardingMessage.type === 'audio' ? (
                  <Volume2 size={16} />
                ) : forwardingMessage.type === 'image' ? (
                  <ImageIcon size={16} />
                ) : forwardingMessage.type === 'document' ? (
                  <FileText size={16} />
                ) : (
                  <MessageSquare size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
                  {forwardingMessage.type === 'audio' ? 'Mensagem de voz' : (forwardingMessage.type || 'Texto')}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 truncate font-medium">
                  {forwardingMessage.content || (forwardingMessage.type === 'audio' ? 'Áudio selecionado' : 'Mídia anexada')}
                </p>
                {forwardingMessage.audioTranscription && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate italic">
                    "{forwardingMessage.audioTranscription}"
                  </p>
                )}
              </div>
            </div>

            {/* Input de Busca */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, telefone ou setor..."
                  className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  value={forwardSearchQuery}
                  onChange={(e) => setForwardSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de Destinatários */}
            <div className="p-3 overflow-y-auto flex-1 space-y-1.5 min-h-[220px] max-h-[360px]">
              {(() => {
                const seenKeys = new Set<string>();
                const combinedList: any[] = [];

                contacts.forEach((c: any) => {
                  const key = c.phone || c.id;
                  if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    combinedList.push({ ...c, isConversation: true });
                  }
                });

                if (directoryContacts && Array.isArray(directoryContacts)) {
                  directoryContacts.forEach((dc: any) => {
                    const key = dc.phone || dc.id;
                    if (!seenKeys.has(key)) {
                      seenKeys.add(key);
                      combinedList.push({ ...dc, isConversation: false });
                    }
                  });
                }

                const filtered = combinedList.filter((c: any) => {
                  if (!forwardSearchQuery.trim()) return true;
                  const q = forwardSearchQuery.toLowerCase();
                  const dept = resolveContactDepartment(c);
                  return (
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.email && c.email.toLowerCase().includes(q)) ||
                    (dept?.name && dept.name.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                      Nenhum contato ou conversa encontrado para "{forwardSearchQuery}".
                    </div>
                  );
                }

                return filtered.map((c: any) => {
                  const modalDept = resolveContactDepartment(c);
                  const isThisTarget = forwardingTargetId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => !isForwardingMessage && handleForwardMessageToContact(c)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group select-none ${
                        isThisTarget
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'bg-slate-50 dark:bg-[#1E293B]/60 hover:bg-slate-100 dark:hover:bg-[#1E293B] border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Anel de Região Inteligente ao redor do Avatar */}
                        <div
                          className="p-[2px] rounded-full shrink-0 transition-all"
                          style={
                            modalDept?.color
                              ? {
                                  backgroundColor: modalDept.color,
                                  boxShadow: `0 0 0 1px ${modalDept.color}40, 0 2px 6px ${modalDept.color}30`,
                                }
                              : undefined
                          }
                          title={modalDept?.name ? `Setor / Região: ${modalDept.name}` : undefined}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white relative overflow-hidden shrink-0">
                            {isAvatarUrlValid(c.avatarUrl) ? (
                              <img
                                src={c.avatarUrl!}
                                alt={c.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initials') as HTMLElement;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={`avatar-initials ${c.avatarUrl ? 'hidden' : ''}`}>
                              {getContactInitials(c.name, c.phone)}
                            </span>
                          </div>
                        </div>

                        {/* Detalhes do Contato */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {formatContactDisplayName(c.name, c.phone)}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            <span>{c.phone || 'Sem telefone'}</span>
                            {modalDept?.name && (
                              <>
                                <span>•</span>
                                <span className="font-semibold truncate" style={{ color: modalDept.color }}>
                                  {modalDept.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botão de Ação / Encaminhar */}
                      <button
                        type="button"
                        disabled={isForwardingMessage}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleForwardMessageToContact(c);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm ${
                          isThisTarget
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                        }`}
                      >
                        {isThisTarget ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Forward size={12} />
                            <span>Encaminhar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO DE MENSAGENS */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        activeContact={activeContactData}
        activeChatId={activeChat}
        onSuccess={(scheduledItem) => {
          handleScheduleSuccess(scheduledItem);
        }}
      />

      {/* DRAWER / PAINEL DE MENSAGENS AGENDADAS */}
      <ScheduledMessagesDrawer
        isOpen={showScheduledDrawer}
        onClose={() => setShowScheduledDrawer(false)}
        activeContact={activeContactData}
        scheduledMessages={activeChat ? scheduledMessagesByChat[activeChat] || [] : []}
        onCancelSchedule={handleCancelScheduled}
        onOpenNewSchedule={() => setShowScheduleModal(true)}
      />

      {/* MODAL DA CENTRAL GLOBAL DE AGENDAMENTOS */}
      <GlobalScheduledCenterModal
        isOpen={showGlobalScheduleCenter}
        onClose={() => setShowGlobalScheduleCenter(false)}
        scheduledMessagesByChat={scheduledMessagesByChat}
        contacts={contacts}
        onSelectChat={(chatId) => {
          setActiveChat(chatId);
        }}
        onCancelSchedule={async (msgId, chatId) => {
          try {
            await api.delete(`/conversations/messages/${msgId}/schedule`).catch(() => {});
          } catch (e) {}
          const currentList = scheduledMessagesByChat[chatId] || [];
          const updated = {
            ...scheduledMessagesByChat,
            [chatId]: currentList.filter((item) => item.id !== msgId),
          };
          saveScheduledMessages(updated);
        }}
        onOpenNewSchedule={() => {
          setShowScheduleModal(true);
        }}
      />

      {/* DISCADOR VOIP FLUTUANTE */}
      {showVoipDialer && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#162038] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Discador VoIP WebRTC</span>
            </div>
            <button onClick={() => setShowVoipDialer(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Display */}
            <div className="bg-slate-50 dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-base font-mono font-bold text-slate-900 dark:text-white tracking-wider truncate">
                {voipNumber || <span className="text-slate-400 dark:text-slate-600">Digitar número...</span>}
              </span>
              {voipNumber && (
                <button 
                  onClick={() => setVoipNumber(prev => prev.slice(0, -1))}
                  className="text-slate-400 hover:text-red-500 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: '1', l: '' }, { n: '2', l: 'ABC' }, { n: '3', l: 'DEF' },
                { n: '4', l: 'GHI' }, { n: '5', l: 'JKL' }, { n: '6', l: 'MNO' },
                { n: '7', l: 'PQRS' }, { n: '8', l: 'TUV' }, { n: '9', l: 'WXYZ' },
                { n: '*', l: '' }, { n: '0', l: '+' }, { n: '#', l: '' },
              ].map(k => (
                <button
                  key={k.n}
                  onClick={() => setVoipNumber(prev => prev + k.n)}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700/80 border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600 text-slate-900 dark:text-white font-bold flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-sm leading-none">{k.n}</span>
                  {k.l && <span className="text-[8px] text-slate-500 font-normal leading-none mt-0.5">{k.l}</span>}
                </button>
              ))}
            </div>

            {/* Ação de Ligar */}
            <button
              onClick={() => {
                if (!voipNumber) return;
                alert(`Iniciando chamada VoIP WebRTC para ${voipNumber}...`);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <PhoneCall size={15} />
              <span>Chamar Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX / EXPANSÃO DE IMAGEM ESTILO WHATSAPP */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200 select-none"
          onClick={() => setLightboxImage(null)}
        >
          {/* Barra Superior de Controles Flutuantes */}
          <div 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-50"
            onClick={e => e.stopPropagation()}
          >
            {/* Botão de Download Direto */}
            <button
              type="button"
              onClick={() => handleDownloadImage(lightboxImage.url, lightboxImage.title)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold backdrop-blur-md border border-white/10 shadow-xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Baixar imagem original"
            >
              <Download size={16} className="text-accent" />
              <span>Baixar Imagem</span>
            </button>

            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Fechar visualização (ESC)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo Central da Imagem */}
          <div 
            className="relative max-w-5xl max-h-[88vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={lightboxImage.url} 
              alt={lightboxImage.title || "Imagem Expandida"} 
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] border border-white/10" 
            />
            {lightboxImage.title && lightboxImage.title !== 'Imagem' && lightboxImage.title !== 'Anexo' && (
              <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-slate-200 font-medium max-w-md truncate text-center">
                {lightboxImage.title}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL VISUALIZADOR DE STORIES 9:16 DA LINHA PRINCIPAL (ESTILO NATIVO WHATSAPP) */}
      {storyViewerModal.isOpen && activeLineStories.length > 0 && (() => {
        const safeIdx = Math.min(Math.max(storyViewerModal.currentIndex, 0), activeLineStories.length - 1);
        const currentStory = activeLineStories[safeIdx];
        const instancePic = activeInstance?.profilePicUrl || waStatus?.profilePicUrl;
        const instanceName = activeInstance?.name || waStatus?.instanceName || 'Linha Principal';

        const currentStoryViewers = storyViewersList.filter((v: any) => {
          if (currentStory.messageId && v.statusMessageId === currentStory.messageId) return true;
          if (currentStory.title && v.storyWatched === currentStory.title) return true;
          return activeLineStories.length === 1;
        });

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200 select-none"
            onClick={() => setStoryViewerModal(prev => ({ ...prev, isOpen: false }))}
          >
            {/* Moldura 9:16 Estilo WhatsApp Status */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[410px] h-[88vh] max-h-[760px] rounded-3xl overflow-hidden bg-[#0B141A] border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col justify-between"
            >
              {/* Topo: Barras de Progresso Segmentadas + Header da Linha Principal */}
              <div className="relative z-20 bg-gradient-to-b from-black/85 via-black/50 to-transparent pt-3 px-3.5 pb-6">
                {/* Barras de Progresso dos Stories Ativos */}
                <div className="flex items-center gap-1.5 mb-3">
                  {activeLineStories.map((st: any, idx: number) => (
                    <button
                      key={st.id || idx}
                      type="button"
                      onClick={() =>
                        setStoryViewerModal(prev => ({
                          ...prev,
                          currentIndex: idx,
                          showViewersDrawer: false,
                        }))
                      }
                      className="flex-1 h-1 rounded-full overflow-hidden bg-white/25 cursor-pointer transition-all"
                      title={st.title || `Story ${idx + 1}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          idx <= safeIdx ? 'w-full bg-[#00A884]' : 'w-0 bg-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Linha Principal Info + Botões */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#00A884] to-emerald-400 shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#111B21] flex items-center justify-center text-white font-bold text-xs">
                        {isAvatarUrlValid(instancePic) ? (
                          <img
                            src={instancePic!}
                            alt={instanceName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span>{instanceName.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{instanceName}</h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#00A884]/25 text-[#00A884] border border-[#00A884]/40">
                          Status Ativo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">
                        {currentStory.postedAtDate} às {currentStory.postedAtTime} ({currentStory.postedAtRelative})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href="/crm/radar-stories"
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 flex items-center gap-1 transition-colors"
                      title="Abrir Radar de Stories & Status completo"
                    >
                      <Sparkles size={12} className="text-emerald-400" />
                      <span>Radar IA</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setStoryViewerModal(prev => ({ ...prev, isOpen: false }))}
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Fechar Story"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Banner de Destaque quando aberto pelo clique no anel de um contato específico */}
                {storyViewerModal.highlightedViewerName && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md flex items-center justify-between text-[11px] text-emerald-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <Eye size={13} className="text-emerald-400 shrink-0" />
                      <span className="truncate">
                        Visualizado por <strong className="text-white">{storyViewerModal.highlightedViewerName}</strong>
                      </span>
                    </div>
                    {storyViewerModal.highlightedViewerTime && (
                      <span className="font-mono text-[10px] text-emerald-300 shrink-0 ml-2">
                        às {storyViewerModal.highlightedViewerTime}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Área Central: Foto / Mídia do Story em 9:16 */}
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B141A] z-10">
                {currentStory.mediaUrl ? (
                  <img
                    src={currentStory.mediaUrl}
                    alt={currentStory.title || "Story WhatsApp"}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center flex flex-col items-center gap-3 max-w-xs">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ImageIcon size={28} />
                    </div>
                    <p className="text-base font-bold text-white leading-relaxed">
                      {currentStory.title || "Status publicado no WhatsApp"}
                    </p>
                    <span className="text-xs text-slate-400">{currentStory.category}</span>
                  </div>
                )}

                {/* Botões de Navegação Anterior / Próximo quando há mais de 1 Story ativo */}
                {activeLineStories.length > 1 && (
                  <>
                    {safeIdx > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setStoryViewerModal(prev => ({
                            ...prev,
                            currentIndex: safeIdx - 1,
                            showViewersDrawer: false,
                          }))
                        }
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer z-20"
                        title="Story anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    {safeIdx < activeLineStories.length - 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setStoryViewerModal(prev => ({
                            ...prev,
                            currentIndex: safeIdx + 1,
                            showViewersDrawer: false,
                          }))
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer z-20"
                        title="Próximo Story"
                      >
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Rodapé do Story: Legenda + Barra de Visualizadores Estilo WhatsApp */}
              <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-8 pb-4 px-4 flex flex-col items-center gap-3">
                {currentStory.title && currentStory.title !== '..' && (
                  <div className="w-full px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center">
                    <p className="text-xs text-white font-medium leading-relaxed">{currentStory.title}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setStoryViewerModal(prev => ({
                      ...prev,
                      showViewersDrawer: !prev.showViewersDrawer,
                    }))
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#202C33]/95 hover:bg-[#2A3942] border border-white/15 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  <Eye size={15} className="text-[#00A884]" />
                  <span>
                    {Math.max(currentStoryViewers.length, Number(currentStory.viewsCount) || 0)} visualizações
                  </span>
                  <ChevronUp
                    size={14}
                    className={`text-slate-300 transition-transform ${
                      storyViewerModal.showViewersDrawer ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Gaveta Deslizante de Quem Visualizou este Story (Igual ao WhatsApp) */}
              {storyViewerModal.showViewersDrawer && (
                <div className="absolute inset-x-0 bottom-0 h-[62%] bg-[#111B21] border-t border-[#222D34] rounded-t-3xl z-30 flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
                  <div className="px-4 py-3 bg-[#202C33] border-b border-[#222D34] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={15} className="text-[#00A884]" />
                      <span className="text-xs font-bold text-white">
                        Visualizado por {currentStoryViewers.length} contatos
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setStoryViewerModal(prev => ({ ...prev, showViewersDrawer: false }))
                      }
                      className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-[#222D34]/60 p-2">
                    {currentStoryViewers.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                        <span>Nenhuma visualização registrada neste Story ainda.</span>
                      </div>
                    ) : (
                      currentStoryViewers.map((viewer: any) => (
                        <div
                          key={viewer.id}
                          className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#202C33] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#2A3942] border border-white/10 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                              {isAvatarUrlValid(viewer.avatarUrl) ? (
                                <img
                                  src={viewer.avatarUrl}
                                  alt={viewer.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span>{getContactInitials(viewer.name, viewer.phone)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white truncate">{viewer.name}</p>
                                {viewer.leadClassificationLabel && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/10 text-slate-200 border border-white/10 shrink-0">
                                    {viewer.leadClassificationLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {viewer.city} - {viewer.state} • Hoje às {viewer.viewedAtExactTime}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const vSuffix = String(viewer.rawPhone || viewer.phone || '').replace(/\D/g, '').slice(-8);
                              const matchedContact = contacts.find((c) => {
                                const cp = String(c.phone || '').replace(/\D/g, '');
                                return (
                                  (viewer.conversationId && c.id === viewer.conversationId) ||
                                  (viewer.contactId && c.contactId === viewer.contactId) ||
                                  (cp && vSuffix && cp.endsWith(vSuffix))
                                );
                              });
                              setStoryViewerModal(prev => ({ ...prev, isOpen: false }));
                              if (matchedContact) {
                                setActiveChat(matchedContact.id);
                              } else {
                                setSearchQuery(viewer.name || viewer.phone || '');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#00A884] hover:bg-[#02906F] text-white text-[10px] font-bold shrink-0 cursor-pointer transition-colors"
                          >
                            Abrir Chat
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {/* MODAL HISTÓRICO DE ATENDIMENTO */}
      {showHistoryModal && activeContactData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#162038]/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={18} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Histórico de Atendimento</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeContactData.name} ({activeContactData.phone || 'Sem telefone'})</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowHistoryModal(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Métricas Rápidas */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Mensagens</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{messages.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Status</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize">{activeContactData.status || 'Aberto'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Atendente</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{currentUserName}</span>
                </div>
              </div>

              {/* Linha do Tempo de Eventos */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Eventos do Atendimento</h4>
                <div className="space-y-3 border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0F172A]" />
                    <p className="font-semibold text-slate-900 dark:text-white text-xs">Atendimento Ativo</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Atribuído a {currentUserName} no Inbox Vallor</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-[#0F172A]" />
                    <p className="font-semibold text-slate-900 dark:text-white text-xs">Mensagens Recebidas</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeContactData.time || 'Hoje'} - Sincronizado via WhatsApp Cloud API</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white dark:ring-[#0F172A]" />
                    <p className="font-semibold text-slate-900 dark:text-white text-xs">Contato Registrado</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Perfil salvo no diretório do tenant</p>
                  </div>
                </div>
              </div>

              {/* Rodapé de Ações */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    handleExportConversation();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
                >
                  <FileDown size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Exportar Transcrição (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Apagar Conversa Inteira */}
      {showDeleteConvModal && activeContactData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1224] border border-rose-300 dark:border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Apagar Conversa?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deseja realmente apagar a conversa com <strong className="text-slate-900 dark:text-white">{activeContactData.name || activeContactData.phone}</strong>? Todas as mensagens, mídias e o histórico deste atendimento serão permanentemente excluídos.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingConv}
                onClick={() => setShowDeleteConvModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingConv}
                onClick={handleDeleteConversation}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingConv ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Apagando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Apagar Conversa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio de Modelo HSM (Reabertura da Janela de 24h Meta) */}
      {showTemplateModal && activeContactData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1224] border border-cyan-300 dark:border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Reabrir Janela de 24h (Meta HSM)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Envie um modelo aprovado pela Meta para retomar o contato</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200/90 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                Mais de 24 horas se passaram desde a última mensagem do cliente. A Meta proíbe mensagens livres até que o cliente interaja com um modelo pré-aprovado.
              </span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Selecione o Modelo de Mensagem (HSM):
              </label>
              
              <div 
                onClick={() => setSelectedTemplateName('hello_world')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTemplateName === 'hello_world'
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">hello_world</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                      Aprovado Universal Meta
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">en_US</span>
                </div>
                <div className="p-2.5 bg-slate-100 dark:bg-black/40 rounded-lg border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 italic font-sans leading-relaxed">
                  "Hello World! Welcome and congratulations on choosing our platform."
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isSendingTemplate}
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSendingTemplate}
                onClick={() => handleSendReopenTemplate(selectedTemplateName)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingTemplate ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Enviando Modelo...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Enviar Modelo de Reabertura</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU DE CONTEXTO DO CONTATO (PADRÃO WHATSAPP WEB) */}
      {chatContextMenu && (() => {
        const targetContact = contacts.find(c => c.id === chatContextMenu.contactId);
        if (!targetContact) return null;
        const isPinned = pinnedContactIds.includes(targetContact.id) || !!targetContact.isPinned;
        const isMuted = mutedContactIds.includes(targetContact.id);
        const isFav = favoriteContactIds.includes(targetContact.id);
        const isArchived = archivedContactIds.includes(targetContact.id);
        const isUnread = (targetContact.unread || 0) > 0 || targetContact.hasNewMessage;
        const isGroup = targetContact.isGroup || (targetContact.phone && targetContact.phone.includes('@g.us'));

        return (
          <div
            id="chat-context-menu"
            style={{
              position: 'fixed',
              top: `${chatContextMenu.y}px`,
              left: `${chatContextMenu.x}px`,
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-56 rounded-2xl shadow-2xl border py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none ${
              isWhatsApp
                ? 'bg-[#233138]/95 border-[#2A3942] text-[#E9EDEF] shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
                : theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.12)]'
                : 'bg-[#0F172A]/95 border-slate-800 text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.7)]'
            }`}
          >
            {/* 1. Arquivar conversa */}
            <button
              type="button"
              onClick={() => handleToggleArchive(targetContact.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                  : theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <Archive size={16} className={`shrink-0 ${
                isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>{isArchived ? 'Desarquivar conversa' : 'Arquivar conversa'}</span>
            </button>

            {/* 2. Silenciar notificações */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isMuted) {
                    handleUnmute(targetContact.id);
                  } else {
                    setShowMuteSubmenu(prev => !prev);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                  isWhatsApp
                    ? 'hover:bg-[#182229] text-[#E9EDEF]'
                    : theme === 'light'
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isMuted ? (
                    <Bell size={16} className={`shrink-0 ${
                      isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
                    }`} />
                  ) : (
                    <BellOff size={16} className={`shrink-0 ${
                      isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
                    }`} />
                  )}
                  <span>{isMuted ? 'Reativar notificações' : 'Silenciar notificações'}</span>
                </div>
                {!isMuted && (
                  <ChevronRight size={14} className={isWhatsApp ? 'text-[#8696A0]' : 'text-slate-400'} />
                )}
              </button>

              {/* Submenu de duração do silêncio */}
              {showMuteSubmenu && !isMuted && (
                <div
                  className={`absolute left-full top-0 ml-1.5 w-36 rounded-xl shadow-2xl border py-1 backdrop-blur-xl animate-in fade-in duration-100 z-50 ${
                    isWhatsApp
                      ? 'bg-[#233138] border-[#2A3942] text-[#E9EDEF]'
                      : theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
                      : 'bg-[#0F172A] border-slate-800 text-slate-100 shadow-black/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleMuteDuration(targetContact.id, '8 horas')}
                    className={`w-full px-3 py-2 text-xs text-left transition-colors font-medium ${
                      isWhatsApp ? 'hover:bg-[#182229]' : theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                    }`}
                  >
                    8 horas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMuteDuration(targetContact.id, '1 semana')}
                    className={`w-full px-3 py-2 text-xs text-left transition-colors font-medium ${
                      isWhatsApp ? 'hover:bg-[#182229]' : theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                    }`}
                  >
                    1 semana
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMuteDuration(targetContact.id, 'Sempre')}
                    className={`w-full px-3 py-2 text-xs text-left transition-colors font-medium ${
                      isWhatsApp ? 'hover:bg-[#182229]' : theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                    }`}
                  >
                    Sempre
                  </button>
                </div>
              )}
            </div>

            {/* 3. Fixar / Desafixar conversa */}
            <button
              type="button"
              onClick={() => handleTogglePin(targetContact.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                  : theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              {isPinned ? (
                <PinOff size={16} className={`shrink-0 ${
                  isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
                }`} />
              ) : (
                <Pin size={16} className={`shrink-0 ${
                  isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
                }`} />
              )}
              <span>{isPinned ? 'Desafixar conversa' : 'Fixar conversa'}</span>
            </button>

            {/* 4. Marcar como não lida / Marcar como lida */}
            <button
              type="button"
              onClick={() => handleToggleRead(targetContact.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                  : theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <MessageSquare size={16} className={`shrink-0 ${
                isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>{isUnread ? 'Marcar como lida' : 'Marcar como não lida'}</span>
            </button>

            {/* 5. Adicionar aos Favoritos */}
            <button
              type="button"
              onClick={() => handleToggleFavorite(targetContact.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                  : theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <Heart size={16} className={`shrink-0 ${
                isFav 
                  ? 'text-rose-500 fill-rose-500' 
                  : isWhatsApp 
                    ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' 
                    : theme === 'light' 
                      ? 'text-slate-500 group-hover:text-slate-900' 
                      : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>{isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}</span>
            </button>

            {/* 6. Adicionar à lista / Etiquetas */}
            <button
              type="button"
              onClick={() => {
                setChatContextMenu(null);
                setActiveChat(targetContact.id);
                setShowContactInfo(true);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                  : theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <Tag size={16} className={`shrink-0 ${
                isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>Adicionar à lista / Etiquetas</span>
            </button>

            <div className={`my-1 border-t ${
              isWhatsApp ? 'border-[#2A3942]' : theme === 'light' ? 'border-slate-100' : 'border-slate-800/80'
            }`} />

            {/* 7. Limpar conversa */}
            <button
              type="button"
              onClick={() => handleClearConversation(targetContact.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-[#E9EDEF]'
                  : theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-800'
                  : 'hover:bg-slate-800/80 text-slate-200'
              }`}
            >
              <Trash2 size={16} className={`shrink-0 ${
                isWhatsApp ? 'text-[#8696A0] group-hover:text-[#E9EDEF]' : theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>Limpar conversa</span>
            </button>

            {/* 8. Finalizar atendimento / Sair do grupo */}
            <button
              type="button"
              onClick={() => handleResolveFromMenu(targetContact.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left group ${
                isWhatsApp
                  ? 'hover:bg-[#182229] text-rose-400'
                  : 'hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isGroup ? (
                <LogOut size={16} className="shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0 text-rose-500" />
              )}
              <span>{isGroup ? 'Sair do grupo' : 'Finalizar atendimento'}</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-100 dark:bg-[#0B1224] text-slate-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Carregando Caixa de Atendimento...</span>
        </div>
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}