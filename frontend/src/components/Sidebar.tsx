"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Kanban, 
  Bot, 
  Users, 
  Settings, 
  LogOut,
  Activity,
  BarChart,
  MessagesSquare,
  PieChart,
  Smartphone,
  Zap,
  ChevronDown,
  ChevronRight,
  Menu,
  Edit2,
  Check,
  X,
  User,
  FileText,
  ScrollText,
  TrendingUp,
  Target,
  Mail,
  Sparkles,
  LifeBuoy,
  Volume2,
  Keyboard,
  ShieldCheck,
  Building2,
  Megaphone,
  KanbanSquare as LayoutKanban,
  Briefcase,
  Calendar,
  FolderArchive,
  Network,
  Compass,
  Radio,
  KeyRound,
  CreditCard,
  PackageCheck,
  Workflow,
} from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";
import { useWhatsApp } from "@/components/ui/WhatsAppProvider";
import api from "@/lib/api";
import toast from "react-hot-toast";
import SoundAlertsModal from "@/components/modals/SoundAlertsModal";
import KeyboardShortcutsModal from "@/components/modals/KeyboardShortcutsModal";
import UserProfileModal from "@/components/modals/UserProfileModal";
import WorkspaceManagerModal, { WorkspaceItem } from "@/components/modals/WorkspaceManagerModal";
import { getCachedUser, clearUserCache } from "@/lib/userCache";
import { isAvatarUrlValid } from "@/lib/avatarUtils";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { MobileDrawerInstallButton } from "@/components/pwa/MobileAppInstallBanner";

function WhatsAppIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  );
}

const NAV_GROUPS = [
  {
    title: "OPERAÇÃO / ATENDIMENTO",
    items: [
      { name: "Mapa Tático Operacional", icon: Compass, href: "/dashboard/mapa" },
      { name: "Base de Contatos", icon: Users, href: "/contacts" },
      { name: "Monitor em Tempo Real", icon: Activity, href: "/monitor" },
      { name: "WhatsApp", icon: WhatsAppIcon, href: "/inbox" },
      { name: "Inbox de E-mail", icon: Mail, href: "/email-inbox" },
      { name: "Métricas de Atendimento", icon: BarChart, href: "/dashboard/atendimento" },
    ]
  },
  {
    title: "MARKETING & AGÊNCIA",
    items: [
      { name: "Kanban de Produção", icon: LayoutKanban, href: "/agency/marketing" },
      { name: "Clientes & Escopos", icon: Briefcase, href: "/agency/marketing/clients" },
      { name: "Cronograma", icon: Calendar, href: "/agency/marketing/schedule" },
      { name: "Biblioteca de Mídia", icon: FolderArchive, href: "/agency/marketing/media" },
    ]
  },
  {
    title: "CHAT DA EQUIPE",
    items: [
      { name: "Chat Interno", icon: MessagesSquare, href: "/chat-interno" },
    ]
  },
  {
    title: "FUNIL COMERCIAL (CRM)",
    items: [
      { name: "Oportunidades", icon: Kanban, href: "/crm" },
      { name: "Radar de Stories", icon: Radio, href: "/crm/radar-stories" },
      { name: "Propostas Comerciais", icon: FileText, href: "/proposals" },
      { name: "Contratos", icon: ScrollText, href: "/contracts" },
      { name: "Metas Comerciais", icon: Target, href: "/dashboard/goals" },
      { name: "Métricas de Vendas", icon: PieChart, href: "/dashboard/crm" },
      { name: "Analytics Avançado", icon: TrendingUp, href: "/dashboard/analytics" },
      { name: "Automações de Vendas", icon: Zap, href: "/settings?tab=automations" },
    ]
  },
  {
    title: "SISTEMA / ADMINISTRAÇÃO",
    items: [
      { name: "Visão Geral", icon: LayoutDashboard, href: "/dashboard" },
      { name: "Inteligência Artificial (BYOK)", icon: Sparkles, href: "/settings?tab=ai" },
      { name: "Automações & Regras", icon: Zap, href: "/settings?tab=automations" },
      { name: "Usuários & Acessos", icon: Users, href: "/settings?tab=users" },
      { name: "Departamentos e Filas", icon: Network, href: "/settings?tab=departments" },
      { name: "Catálogo & Produtos", icon: PackageCheck, href: "/settings?tab=products" },
      { name: "Respostas Rápidas", icon: MessageSquare, href: "/settings?tab=quick-replies" },
      { name: "Conexões WhatsApp", icon: Smartphone, href: "/settings/whatsapp" },
      { name: "Integrações", icon: Workflow, href: "/integrations" },
      { name: "APIs & Webhooks", icon: KeyRound, href: "/settings?tab=api" },
      { name: "Plano & Assinatura", icon: CreditCard, href: "/settings?tab=plan" },
      { name: "Central de Suporte", icon: LifeBuoy, href: "/support" },
      { name: "Configurações Gerais", icon: Settings, href: "/settings" },
      { name: "Minha Conta", icon: User, href: "/settings?tab=account" },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasGlobalUnread } = useSocket();
  const { status: waStatus, refreshStatus: refreshWaStatus } = useWhatsApp();
  const { isOpen: isMobileOpen, closeMenu: closeMobileMenu } = useMobileMenu();
  const { isDark, isWhatsApp } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Usuário e Modais Estilo Lero
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);

  // Gerenciamento de Workspaces / Unidades
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);

  // Modo Suporte para Super Admin em Agências Clientes
  const [targetTenantId, setTargetTenantId] = useState<string | null>(null);
  const [targetTenantName, setTargetTenantName] = useState<string | null>(null);

  useEffect(() => {
    const checkTarget = () => {
      if (typeof window !== 'undefined') {
        const tId = localStorage.getItem('versus_target_tenant_id');
        const tName = localStorage.getItem('versus_target_tenant_name');
        const tLogo = localStorage.getItem('versus_target_tenant_logo');
        setTargetTenantId(tId);
        setTargetTenantName(tName);

        // Se entrou em modo suporte, sincroniza imediatamente o workspace para refletir o novo tenant sem delay
        if (tId) {
          setActiveWorkspace({
            id: `target-${tId}`,
            name: tName || 'Agência em Suporte',
            description: 'Acesso em modo suporte',
            logoUrl: tLogo || null,
            themeColor: '#2563EB',
            isDefault: true,
            tenantId: tId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Se saiu do modo suporte, limpa o workspace temporário para recarregar o original do admin
          setActiveWorkspace(null);
        }

        loadUser();
        loadWorkspaces(tId, tName, tLogo);
      }
    };
    checkTarget();
    window.addEventListener('tenant_switched', checkTarget);
    return () => window.removeEventListener('tenant_switched', checkTarget);
  }, []);

  const handleExitSupportMode = () => {
    clearUserCache();
    localStorage.removeItem('versus_target_tenant_id');
    localStorage.removeItem('versus_target_tenant_name');
    localStorage.removeItem('versus_target_tenant_logo');
    localStorage.removeItem('versus_active_workspace');
    window.dispatchEvent(new Event('tenant_switched'));
    toast.success("Saiu do Modo Suporte da agência.");
    window.location.href = '/vallor/super-admin/companies';
  };

  const loadUser = async () => {
    try {
      const data = await getCachedUser();
      if (data) {
        // Se a empresa foi bloqueada, desloga imediatamente e redireciona para a tela de bloqueio
        if (data.tenant && data.tenant.isActive === false && !data.isSuperAdmin) {
          localStorage.removeItem('versus_auth_token');
          localStorage.removeItem('versus_token');
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('versus_user');
          sessionStorage.setItem('versus_blocked_reason', 'O acesso desta empresa foi bloqueado pela administração do Vallor.');
          window.location.href = '/vallor/blocked';
          return;
        }
        setCurrentUser(data);
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
        const code = e.response?.data?.code;
        if (code === 'TENANT_BLOCKED') {
          window.location.href = '/vallor/blocked';
        }
      }
    }
  };

  const loadWorkspaces = async (
    overrideTargetId?: string | null,
    overrideTargetName?: string | null,
    overrideTargetLogo?: string | null
  ) => {
    try {
      const currentTargetId = overrideTargetId !== undefined
        ? overrideTargetId
        : (typeof window !== 'undefined' ? localStorage.getItem('versus_target_tenant_id') : null);
      const currentTargetName = overrideTargetName !== undefined
        ? overrideTargetName
        : (typeof window !== 'undefined' ? localStorage.getItem('versus_target_tenant_name') : null);
      const currentTargetLogo = overrideTargetLogo !== undefined
        ? overrideTargetLogo
        : (typeof window !== 'undefined' ? localStorage.getItem('versus_target_tenant_logo') : null);

      const res = await api.get('/workspaces');
      if (res.data?.workspaces) {
        let list: WorkspaceItem[] = res.data.workspaces;

        // Se estiver em modo suporte, isola e filtra apenas os workspaces do tenant alvo
        if (currentTargetId) {
          list = list.filter((w) => w.tenantId === currentTargetId);
        }

        setWorkspaces(list);

        const storedActive = typeof window !== 'undefined' ? localStorage.getItem('versus_active_workspace') : null;
        if (storedActive) {
          try {
            const parsed = JSON.parse(storedActive);
            // Só reutiliza se pertencer ao tenant atual
            if (!currentTargetId || parsed.tenantId === currentTargetId) {
              const found = list.find((w) => w.id === parsed.id);
              if (found) {
                setActiveWorkspace(found);
                return;
              }
            } else {
              localStorage.removeItem('versus_active_workspace');
            }
          } catch (err) {
            // Ignora JSON inválido
          }
        }

        const defaultWs = list.find((w) => w.isDefault) || list[0];
        if (defaultWs) {
          setActiveWorkspace(defaultWs);
          localStorage.setItem('versus_active_workspace', JSON.stringify(defaultWs));
        } else if (currentTargetId) {
          // Fallback caso o tenant ainda não tenha workspaces cadastrados
          const fallbackWs: WorkspaceItem = {
            id: `target-${currentTargetId}`,
            name: currentTargetName || 'Agência em Suporte',
            description: 'Acesso em modo suporte',
            logoUrl: currentTargetLogo || null,
            themeColor: '#2563EB',
            isDefault: true,
            tenantId: currentTargetId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setActiveWorkspace(fallbackWs);
        }
      } else if (currentTargetId) {
        const fallbackWs: WorkspaceItem = {
          id: `target-${currentTargetId}`,
          name: currentTargetName || 'Agência em Suporte',
          description: 'Acesso em modo suporte',
          logoUrl: currentTargetLogo || null,
          themeColor: '#2563EB',
          isDefault: true,
          tenantId: currentTargetId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setActiveWorkspace(fallbackWs);
      }
    } catch (e) {
      console.error('[LOAD_WORKSPACES_ERROR]', e);
    }
  };

  useEffect(() => {
    loadUser();
    loadWorkspaces();
    const handleUserUpdated = () => loadUser();
    const handleWsUpdated = () => loadWorkspaces();
    window.addEventListener('user_updated', handleUserUpdated);
    window.addEventListener('workspace_updated', handleWsUpdated);
    window.addEventListener('workspace_switched', handleWsUpdated);
    return () => {
      window.removeEventListener('user_updated', handleUserUpdated);
      window.removeEventListener('workspace_updated', handleWsUpdated);
      window.removeEventListener('workspace_switched', handleWsUpdated);
    };
  }, []);

  const handleMouseEnterUser = () => {
    if (menuTimeout) clearTimeout(menuTimeout);
    setIsUserMenuOpen(true);
  };

  const handleMouseLeaveUser = () => {
    const t = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 260);
    setMenuTimeout(t);
  };

  const handleLogout = () => {
    // 1. Limpeza profunda de tokens, credenciais e contextos de tenant
    localStorage.removeItem('versus_auth_token');
    localStorage.removeItem('versus_token');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('versus_user');
    localStorage.removeItem('versus_target_tenant_id');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('versus_muted_chats');
    localStorage.removeItem('versus_scheduled_messages');
    localStorage.removeItem('crm_columns');
    localStorage.removeItem('crm_columns_widths');
    sessionStorage.clear();

    // 2. Garante que o próximo carregamento /login inicie no tema corporativo clássico azul
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light', 'theme-whatsapp');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 3. Redirecionamento completo para /vallor/login para descarregar a memória RAM da aba
    window.location.href = '/vallor/login';
  };

  // Garante que o status do WhatsApp seja sincronizado ao montar a Sidebar em tela autenticada
  useEffect(() => {
    if (waStatus.status === 'disconnected') {
      const token = localStorage.getItem('versus_auth_token') || localStorage.getItem('versus_token');
      if (token) {
        refreshWaStatus();
      }
    }
  }, [waStatus.status, refreshWaStatus]);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_expanded');
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
    
    // Operação / Atendimento e o grupo da rota atual vêm abertos por padrão
    const initialGroups: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => {
      const hasActiveChild = g.items.some(item => {
        const itemBase = item.href.split('?')[0];
        if (item.href === '/agency/marketing') {
          return pathname === '/agency/marketing' || pathname === '/agency/marketing/kanban';
        }
        return pathname === item.href || (item.href !== '/dashboard' && item.href !== '/settings' && pathname.startsWith(itemBase));
      });
      initialGroups[g.title] = hasActiveChild || g.title === "OPERAÇÃO / ATENDIMENTO";
    });
    setExpandedGroups(initialGroups);
  }, []);

  useEffect(() => {
    NAV_GROUPS.forEach(g => {
      const hasActiveChild = g.items.some(item => {
        const itemBase = item.href.split('?')[0];
        if (item.href === '/agency/marketing') {
          return pathname === '/agency/marketing' || pathname === '/agency/marketing/kanban';
        }
        return pathname === item.href || (item.href !== '/dashboard' && item.href !== '/settings' && pathname.startsWith(itemBase));
      });
      if (hasActiveChild) {
        setExpandedGroups(prev => ({ ...prev, [g.title]: true }));
      }
    });
  }, [pathname]);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar_expanded', String(newState));
  };

  const toggleGroup = (title: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      localStorage.setItem('sidebar_expanded', 'true');
    }
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const checkItemPermission = (href: string, user: any): boolean => {
    if (!user) return true;

    const isSuperAdmin = Boolean(
      user.isSuperAdmin === true ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'SUPERADMIN'
    );

    // Super Admin possui acesso irrestrito para auditoria e controle global
    if (isSuperAdmin) return true;

    const base = href.split('?')[0];

    // 1. CHECAGEM DA MATRIZ DO PLANO DO TENANT (Governança de Planos)
    const plan = user.tenant?.plan;
    const planModules = (plan?.modules as Record<string, boolean>) || {};

    if (plan) {
      // Funil Comercial (CRM)
      if (base === '/crm' || base === '/dashboard/crm' || base === '/contacts') {
        const crmAllowed = Boolean(planModules.crm ?? plan.hasCRM ?? false);
        if (!crmAllowed) return false;
      }

      // Propostas e Contratos
      if (base === '/proposals' || base === '/contracts') {
        const proposalsAllowed = Boolean(planModules.proposalsContracts ?? false);
        if (!proposalsAllowed) return false;
      }

      // Automações de Vendas
      if (href.includes('tab=automations')) {
        const automationsAllowed = Boolean(planModules.automations ?? false);
        if (!automationsAllowed) return false;
      }

      // Agente IA
      if (base === '/agent') {
        const aiAllowed = Boolean(planModules.aiAgent ?? plan.hasAIAgent ?? false);
        if (!aiAllowed) return false;
      }

      // Inbox de E-mail
      if (base === '/email-inbox') {
        const emailAllowed = Boolean(planModules.emailInbox ?? false);
        if (!emailAllowed) return false;
      }

      // Metas Comerciais
      if (base === '/dashboard/goals') {
        const goalsAllowed = Boolean(planModules.goals ?? false);
        if (!goalsAllowed) return false;
      }

      // Analytics Avançado
      if (base === '/dashboard/analytics') {
        const analyticsAllowed = Boolean(planModules.analytics ?? false);
        if (!analyticsAllowed) return false;
      }

      // Chat Interno da Equipe
      if (base === '/chat-interno') {
        const chatAllowed = Boolean(planModules.teamChat ?? true);
        if (!chatAllowed) return false;
      }

      // Central de Suporte
      if (base === '/support') {
        const supportAllowed = Boolean(planModules.support ?? true);
        if (!supportAllowed) return false;
      }

      // WhatsApp / Conexões
      if (base === '/inbox' || base === '/monitor' || base === '/settings/whatsapp') {
        const waAllowed = Boolean(planModules.whatsapp ?? plan.hasWhatsApp ?? true);
        if (!waAllowed) return false;
      }
    }

    // 2. CHECAGEM POR CARGO DE ADMIN DO TENANT
    // Se o recurso está liberado no plano, ADMIN tem acesso total dentro da empresa
    if (user.role === 'ADMIN') {
      return true;
    }

    // 3. CHECAGEM DE PERMISSÕES INDIVIDUAIS DO OPERADOR (AGENT / SUPERVISOR / COLABORADOR)
    const perms = user.permissions || {
      inbox: true,
      crm: true,
      chat: true,
      automations: false,
      settings: false,
      support: true,
    };
    const menus = perms.menus;
    const subPerms = perms.subPermissions;

    // Visão Geral / Dashboard
    if (base === '/dashboard') {
      if (menus?.dashboard !== undefined) return menus.dashboard;
      return true;
    }

    // Mapa Tático Operacional
    if (base === '/dashboard/mapa') {
      if (menus?.tactical_map !== undefined) return menus.tactical_map;
      if (menus?.dashboard !== undefined) return menus.dashboard;
      return true;
    }

    // Monitor em Tempo Real
    if (base === '/monitor') {
      if (menus?.monitor !== undefined) return menus.monitor;
      if (menus?.whatsapp !== undefined) return menus.whatsapp;
      return perms.inbox !== false;
    }

    // Métricas de Atendimento
    if (base === '/dashboard/atendimento') {
      if (menus?.service_metrics !== undefined) return menus.service_metrics;
      if (menus?.whatsapp !== undefined) return menus.whatsapp;
      return perms.inbox !== false;
    }

    // Inbox de E-mail
    if (base === '/email-inbox') {
      if (menus?.email_inbox !== undefined) return menus.email_inbox;
      if (menus?.whatsapp !== undefined) return menus.whatsapp;
      return perms.inbox !== false;
    }

    // Atendimento & WhatsApp
    if (base === '/inbox') {
      if (menus?.whatsapp !== undefined) return menus.whatsapp;
      return perms.inbox !== false;
    }

    // CRM / Comercial & Sub-rotas
    if (base === '/crm') {
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    if (base === '/crm/radar-stories') {
      if (menus?.radar_stories !== undefined) return menus.radar_stories;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    if (base === '/proposals') {
      if (menus?.proposals !== undefined) return menus.proposals;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    if (base === '/contracts') {
      if (menus?.contracts !== undefined) return menus.contracts;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    if (base === '/dashboard/goals') {
      if (menus?.sales_goals !== undefined) return menus.sales_goals;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    if (base === '/dashboard/crm') {
      if (menus?.sales_metrics !== undefined) return menus.sales_metrics;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    if (base === '/dashboard/analytics') {
      if (menus?.advanced_analytics !== undefined) return menus.advanced_analytics;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    // Contatos
    if (base === '/contacts') {
      if (menus?.contacts !== undefined) return menus.contacts;
      if (subPerms?.crm_enabled !== undefined) return subPerms.crm_enabled;
      return perms.crm !== false;
    }

    // Chat da Equipe
    if (base === '/chat-interno') {
      if (menus?.chat !== undefined) return menus.chat;
      return perms.chat !== false;
    }

    // Central de Suporte
    if (base === '/support' || href.includes('tab=support')) {
      if (menus?.support !== undefined) return menus.support;
      return perms.support !== false;
    }

    // Operações de Marketing da Agência
    if (base === '/agency/marketing' || base.startsWith('/agency/marketing')) {
      if (isSuperAdmin || user.role === 'ADMIN') return true;
      if (subPerms?.marketing_enabled === false) return false;
      if (base === '/agency/marketing/clients') {
        if (subPerms?.marketing_clients !== undefined) return subPerms.marketing_clients;
      }
      if (base === '/agency/marketing/schedule') {
        if (subPerms?.marketing_schedule !== undefined) return subPerms.marketing_schedule;
      }
      if (base === '/agency/marketing/media') {
        if (subPerms?.marketing_media !== undefined) return subPerms.marketing_media;
      }
      if (base === '/agency/marketing') {
        if (subPerms?.marketing_kanban !== undefined) return subPerms.marketing_kanban;
      }
      if (subPerms?.marketing_enabled !== undefined) return subPerms.marketing_enabled;
      return Boolean(user.canAccessMarketing === true || perms.marketing === true);
    }

    // Automações & Agentes IA
    if (href.includes('tab=automations')) {
      if (menus?.automations !== undefined) return menus.automations;
      return perms.automations === true;
    }

    if (href.includes('tab=ai') || base === '/agent') {
      if (menus?.ai_agents !== undefined) return menus.ai_agents;
      return perms.automations === true;
    }

    // Configurações Gerais e Abas Específicas
    if (href.includes('tab=users')) {
      if (menus?.users !== undefined) return menus.users;
      return perms.settings === true;
    }

    if (href.includes('tab=departments')) {
      if (menus?.departments !== undefined) return menus.departments;
      return perms.settings === true;
    }

    if (href.includes('tab=products')) {
      if (menus?.products !== undefined) return menus.products;
      return perms.settings === true;
    }

    if (href.includes('tab=quick-replies')) {
      if (menus?.quick_replies !== undefined) return menus.quick_replies;
      return perms.settings === true;
    }

    if (href.includes('tab=plan') || href.includes('tab=billing')) {
      if (menus?.billing !== undefined) return menus.billing;
      return perms.settings === true;
    }

    if (href.includes('tab=api') || href.includes('tab=webhooks')) {
      if (menus?.webhooks !== undefined) return menus.webhooks;
      return perms.settings === true;
    }

    if (base === '/integrations' || href.includes('tab=integrations')) {
      if (menus?.integrations !== undefined) return menus.integrations;
      return perms.settings === true;
    }

    if (href.includes('tab=account') || href.includes('tab=my_account')) {
      if (menus?.my_account !== undefined) return menus.my_account;
      return true;
    }

    if (base === '/settings/whatsapp' || href.includes('tab=connections')) {
      if (menus?.connections !== undefined) return menus.connections;
      return perms.settings === true;
    }

    if (base === '/settings' && !href.includes('tab=')) {
      if (menus?.settings !== undefined) return menus.settings;
      return perms.settings === true;
    }

    return true;
  };

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => checkItemPermission(item.href, currentUser)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <aside 
        className={`hidden md:flex bg-white dark:bg-[#0B1224] border-r border-slate-200 dark:border-gray-800 flex-col justify-between h-full transition-[width] duration-200 ease-in-out relative z-20 shrink-0 ${isExpanded ? 'w-[260px]' : 'w-[64px]'}`}
      >
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Header Institucional: Logotipo Oficial VALLOR */}
        <div className="h-16 flex items-center justify-between border-b border-slate-200 dark:border-gray-800 px-4 shrink-0 relative">
          {isExpanded ? (
            <div className="flex items-center justify-between w-full">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 group transition-transform active:scale-95 select-none"
                title="VALLOR - Ir para a Visão Geral"
              >
                {/* Logo Oficial Horizontal da VALLOR (Sem by avall para máxima legibilidade) */}
                <img 
                  src="/vallor/Logo_valor_02.svg" 
                  alt="VALLOR" 
                  className={`h-8 w-auto max-w-[165px] object-contain transition-all ${
                    !isDark && !isWhatsApp 
                      ? "brightness-0 opacity-85" 
                      : isWhatsApp 
                        ? "brightness-0 invert opacity-100 drop-shadow-sm" 
                        : "opacity-95"
                  }`}
                />
              </Link>

              {/* Botão para alternar recolhimento da Sidebar */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0 ml-1"
                title="Recolher menu lateral"
                aria-label="Recolher menu lateral"
              >
                <ChevronRight size={16} className="rotate-180 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button 
                type="button"
                onClick={toggleSidebar}
                className="flex items-center justify-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-95 cursor-pointer group"
                title="Expandir menu lateral"
                aria-label="Expandir menu lateral"
              >
                {/* Ícone Circular Oficial Vallor */}
                <img 
                  src="/vallor/Favicon_vallor.svg" 
                  alt="VALLOR" 
                  className="w-7 h-7 object-contain transition-transform group-hover:scale-110 drop-shadow-sm"
                />
              </button>
            </div>
          )}
        </div>

        {/* Banner Modo Suporte Super Admin */}
        {targetTenantId && isExpanded && (
          <div className="mx-3 mt-2 mb-1 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-slate-800 dark:text-blue-200 text-xs flex flex-col gap-1.5 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 truncate text-[11px] text-blue-900 dark:text-blue-200">
                <Building2 size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{targetTenantName || 'Agência Alvo'}</span>
              </span>
              <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                SUPORTE
              </span>
            </div>
            <p className="text-[10px] text-blue-700/90 dark:text-blue-300/80 leading-tight">
              Acesso de auditoria no contexto desta agência cliente.
            </p>
            <button
              onClick={handleExitSupportMode}
              className="w-full text-center text-[11px] font-bold py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all shadow-sm cursor-pointer"
            >
              Sair do Modo Suporte
            </button>
          </div>
        )}

        {targetTenantId && !isExpanded && (
          <div 
            onClick={() => setIsExpanded(true)}
            title={`Modo Suporte Ativo: ${targetTenantName || 'Agência'}. Clique para expandir.`}
            className="mx-2 mt-2 p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Building2 size={16} className="animate-pulse" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
          <button 
            onClick={toggleSidebar}
            className={`flex items-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50 transition-colors mb-2 ${isExpanded ? 'justify-end' : 'justify-center'}`}
            title={isExpanded ? "Recolher Menu" : "Expandir Menu"}
          >
            <Menu size={18} />
          </button>

          {visibleGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {/* Group Header */}
              <div 
                className={`flex items-center justify-between px-2 py-1 mb-1 cursor-pointer group ${!isExpanded && 'hidden'}`}
                onClick={() => toggleGroup(group.title)}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 tracking-wider uppercase group-hover:text-slate-800 dark:group-hover:text-gray-200 transition-colors truncate">
                    {group.title}
                  </span>
                </div>
                {expandedGroups[group.title] ? (
                  <ChevronDown size={12} className="text-slate-400 dark:text-gray-600 group-hover:text-slate-600 dark:group-hover:text-gray-400 shrink-0 ml-1" />
                ) : (
                  <ChevronRight size={12} className="text-slate-400 dark:text-gray-600 group-hover:text-slate-600 dark:group-hover:text-gray-400 shrink-0 ml-1" />
                )}
              </div>

              {/* Group Items */}
              <div className={`flex flex-col gap-1 ${!isExpanded ? 'items-center' : ''} ${(!expandedGroups[group.title] && isExpanded) ? 'hidden' : ''}`}>
                {group.items.map((item) => {
                  const itemBase = item.href.split('?')[0];
                  const isMarketingMain = item.href === '/agency/marketing';
                  const isMarketingGroup = group.title === "MARKETING & AGÊNCIA";
                  let isActive = false;
                  if (item.href === '/dashboard/mapa' || item.href === '/dashboard?view=map') {
                    isActive = pathname === '/dashboard/mapa' || (pathname === '/dashboard' && searchParams?.get('view') === 'map');
                  } else if (item.href === '/dashboard') {
                    isActive = pathname === '/dashboard' && searchParams?.get('view') !== 'map';
                  } else if (item.href.includes('?')) {
                    const tabParam = new URLSearchParams(item.href.split('?')[1]).get('tab');
                    if (tabParam) {
                      isActive = pathname === itemBase && searchParams?.get('tab') === tabParam;
                    } else {
                      isActive = pathname === itemBase;
                    }
                  } else if (isMarketingMain) {
                    isActive = pathname === '/agency/marketing' || pathname === '/agency/marketing/kanban';
                  } else {
                    isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/settings' && !isMarketingMain && pathname.startsWith(item.href));
                  }
                  const isInbox = item.href === '/inbox';
                  const shouldBlink = isInbox && hasGlobalUnread && !isActive;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      title={!isExpanded ? item.name : undefined}
                      className={`
                        flex items-center gap-3 rounded-lg transition-all duration-200 relative group
                        ${isExpanded ? 'px-3 py-2' : 'w-10 h-10 justify-center'}
                        ${isActive 
                          ? isWhatsApp
                            ? 'text-[#00A884] bg-[#00A884]/15 border-l-2 border-[#00A884] font-semibold shadow-sm'
                            : 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-slate-800/60 border-l-2 border-blue-600 dark:border-cyan-400 font-semibold shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                        ${shouldBlink ? 'bg-primary/20 shadow-[0_0_15px_rgba(0,210,255,0.2)] animate-pulse text-blue-600 dark:text-white' : ''}
                      `}
                    >
                      <item.icon size={isExpanded ? 17 : 20} strokeWidth={isActive ? 2 : 1.5} className={isActive ? (isWhatsApp ? 'text-[#00A884]' : 'text-blue-600 dark:text-cyan-400') : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                      
                      {isExpanded && (
                        <span className="text-sm truncate flex-1">{item.name}</span>
                      )}

                      {!isExpanded && (
                        <div className="absolute left-14 bg-slate-900 dark:bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-slate-700 dark:border-gray-700">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`border-t p-3 shrink-0 flex flex-col gap-2 ${
          isWhatsApp ? 'border-[#222D34]' : 'border-slate-200 dark:border-gray-800'
        }`}>
          {/* WA Status */}
          <div className={`flex items-center gap-3 px-2 py-1.5 rounded-lg border transition-colors ${
            !isExpanded && 'justify-center'
          } ${
            isWhatsApp
              ? 'bg-[#202C33] border-[#222D34]'
              : 'bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800'
          }`}>
            <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
              {waStatus.status === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              )}
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden">
                <span className={`text-xs font-semibold truncate ${
                  isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-800 dark:text-white'
                }`}>
                  {waStatus.status === 'connected' ? 'WhatsApp Conectado' : 'Desconectado'}
                </span>
                <span className={`text-[10px] truncate ${
                  isWhatsApp ? 'text-[#8696A0]' : 'text-slate-500 dark:text-gray-500'
                }`}>
                  {waStatus.metaPhoneNumberId ? `ID: ${String(waStatus.metaPhoneNumberId).replace(/^ID:\s*/i, '').trim()}` : 'Sem Instância'}
                </span>
              </div>
            )}
          </div>

          {/* User Profile Container com Hover Popover Estilo Lero */}
          <div 
            onMouseEnter={handleMouseEnterUser}
            onMouseLeave={handleMouseLeaveUser}
            className="relative"
          >
            {/* Popover Flyout Menu (Abre no Hover) */}
            {isUserMenuOpen && (
              <div 
                onMouseEnter={handleMouseEnterUser}
                onMouseLeave={handleMouseLeaveUser}
                className={`absolute bottom-full mb-2.5 rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-[90] flex flex-col gap-1 text-slate-800 dark:text-white animate-in fade-in-50 slide-in-from-bottom-2 ${
                  isExpanded ? "left-0 w-64" : "left-full ml-2 w-64"
                }`}
              >
                {/* Header do Usuário no Popover */}
                <div className="p-2.5 border-b border-slate-200 dark:border-slate-800/80 mb-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                    {isAvatarUrlValid(currentUser?.avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={currentUser!.avatarUrl!} 
                        alt="Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      currentUser?.name?.[0]?.toUpperCase() || "U"
                    )}

                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name || "Operador"}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || "operador@vallor.com.br"}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
                    {currentUser?.role === 'ADMIN' ? 'Admin' : 'Operador'}
                  </span>
                </div>

                {/* Gestão Integrada de Workspace / Empresa */}
                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 mb-1">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Workspace Ativo
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsWorkspaceModalOpen(true);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Gerenciar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/50 transition-colors text-left cursor-pointer select-none"
                    title="Alternar unidade / workspace"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[9px] text-white shrink-0 overflow-hidden shadow-xs"
                        style={{ backgroundColor: isWhatsApp ? "#00A884" : (activeWorkspace?.themeColor || "#2563EB") }}
                      >
                        {activeWorkspace?.logoUrl ? (
                          <img src={activeWorkspace.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span>{(activeWorkspace?.name || targetTenantName || "W").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                        {targetTenantName ? (activeWorkspace?.name || targetTenantName) : (activeWorkspace?.name || "Workspace Principal")}
                      </span>
                      {targetTenantId && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 shrink-0">
                          Suporte
                        </span>
                      )}
                    </div>
                    <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isWorkspaceDropdownOpen ? "rotate-180 text-blue-500" : ""}`} />
                  </button>

                  {/* Dropdown de Unidades / Workspaces Expandível */}
                  {isWorkspaceDropdownOpen && (
                    <div className="mt-1.5 max-h-36 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#0B1224] p-1 animate-in fade-in duration-150">
                      {workspaces.length === 0 ? (
                        <div className="p-2 text-center text-[10px] text-slate-400">
                          Nenhum workspace secundário cadastrado.
                        </div>
                      ) : (
                        workspaces.map((ws) => {
                          const isSelected = activeWorkspace?.id === ws.id;
                          return (
                            <button
                              key={ws.id}
                              type="button"
                              onClick={() => {
                                setActiveWorkspace(ws);
                                localStorage.setItem("versus_active_workspace", JSON.stringify(ws));
                                setIsWorkspaceDropdownOpen(false);
                                setIsUserMenuOpen(false);
                                toast.success(`Workspace "${ws.name}" ativado!`);
                                window.dispatchEvent(new Event("workspace_switched"));
                              }}
                              className={`w-full flex items-center gap-2 p-1.5 rounded-md text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600/15 text-blue-600 dark:text-blue-300 font-semibold"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div
                                className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0 overflow-hidden"
                                style={{ backgroundColor: isWhatsApp ? "#00A884" : (ws.themeColor || "#2563EB") }}
                              >
                                {ws.logoUrl ? (
                                  <img src={ws.logoUrl} alt={ws.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{ws.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="text-[11px] truncate flex-1">{ws.name}</span>
                              {isSelected && <Check size={12} className="text-blue-500 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Opção 1: Meu Perfil & Foto */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
                >
                  <User size={15} className="text-blue-500 dark:text-blue-400" />
                  <span>Meu Perfil & Foto</span>
                </button>

                {/* Opção 2: Alertas Sonoros */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsSoundModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
                >
                  <Volume2 size={15} className="text-blue-500 dark:text-blue-400" />
                  <span>Alertas Sonoros</span>
                </button>

                {/* Opção 3: Atalhos de Teclado */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsKeyboardModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
                >
                  <Keyboard size={15} className="text-blue-500 dark:text-blue-400" />
                  <span>Atalhos de Teclado</span>
                </button>

                {/* Opção 4: Central de Suporte */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/support");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
                >
                  <LifeBuoy size={15} className="text-blue-500 dark:text-blue-400" />
                  <span>Central de Suporte</span>
                </button>

                {/* Opção: Alternância de Tema Dia/Noite */}
                <ThemeToggle variant="menu-item" />

                {/* Opção Super Admin (se aplicável) */}
                {(currentUser?.isSuperAdmin || currentUser?.role === 'SUPER_ADMIN') && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/super-admin/companies");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 transition-colors text-left font-semibold"
                    >
                      <ShieldCheck size={15} />
                      <span>Console Super Admin</span>
                    </button>
                  </>
                )}

                <div className="h-px bg-slate-200 dark:bg-slate-800/80 my-1" />

                {/* Opção 5: Sair */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut size={15} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}

            {/* Barra de Perfil no Rodapé (Gatilho) */}
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              title="Passe o mouse para abrir o menu do operador"
              className={`flex items-center gap-2.5 px-2 py-2 mt-1 rounded-lg cursor-pointer transition-colors group relative ${!isExpanded && 'justify-center'} ${
                isWhatsApp
                  ? 'hover:bg-[#202C33]'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden ${
                isWhatsApp
                  ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30'
                  : 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              }`}>
                {isAvatarUrlValid(currentUser?.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={currentUser!.avatarUrl!} 
                    alt="Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  currentUser?.name?.[0]?.toUpperCase() || "U"
                )}

              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate transition-colors ${
                      isWhatsApp 
                        ? 'text-[#E9EDEF] group-hover:text-[#00A884]' 
                        : 'text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                      {currentUser?.name || "Usuário Atual"}
                    </span>
                    <Edit2 size={11} className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <span className={`text-[10px] truncate ${
                    isWhatsApp ? 'text-[#8696A0]' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {targetTenantName ? (activeWorkspace?.name || targetTenantName) : (activeWorkspace?.name || currentUser?.tenantName || "Verto Comercial")} • <span className={`font-medium ${isWhatsApp ? 'text-[#00A884]' : 'text-blue-600 dark:text-blue-400'}`}>Menu</span>
                  </span>
                </div>
              )}
              {isExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Sair da conta"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>

      {/* Mobile Drawer (Menu Lateral Deslizante para Celular) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Escurecido com Blur */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeMobileMenu}
          />

          {/* Drawer Lateral */}
          <aside className="relative w-[300px] max-w-[85vw] bg-white dark:bg-[#0B1224] border-r border-slate-200 dark:border-gray-800 flex flex-col justify-between h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header Mobile Drawer: Logotipo Oficial VALLOR */}
            <div className="h-16 flex items-center justify-between border-b border-slate-200 dark:border-gray-800 px-4 shrink-0 bg-white dark:bg-[#0B1224]">
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 group transition-transform active:scale-95 select-none"
                title="VALLOR - Ir para a Visão Geral"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/vallor/Logo_valor_02.svg" 
                  alt="VALLOR" 
                  className={`h-8 w-auto max-w-[165px] object-contain transition-all ${
                    !isDark && !isWhatsApp 
                      ? "brightness-0 opacity-85" 
                      : isWhatsApp 
                        ? "brightness-0 invert opacity-100 drop-shadow-sm" 
                        : "opacity-95"
                  }`}
                />
              </Link>

              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800/80 transition-colors"
                  title="Fechar Menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Banner Modo Suporte Super Admin no Mobile Drawer */}
            {targetTenantId && (
              <div className="mx-3 mt-2 mb-1 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-slate-800 dark:text-blue-200 text-xs flex flex-col gap-1.5 shrink-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 truncate text-[11px] text-blue-900 dark:text-blue-200">
                    <Building2 size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{targetTenantName || 'Agência Alvo'}</span>
                  </span>
                  <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                    SUPORTE
                  </span>
                </div>
                <p className="text-[10px] text-blue-700/90 dark:text-blue-300/80 leading-tight">
                  Visualizando em modo suporte como Super Admin.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    handleExitSupportMode();
                  }}
                  className="w-full text-center text-[11px] font-bold py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all shadow-sm cursor-pointer"
                >
                  Voltar ao Super Admin
                </button>
              </div>
            )}

            {/* Itens de Navegação Mobile */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-28 flex flex-col gap-1">
              {/* Botão de Instalação Mobile no Menu */}
              <MobileDrawerInstallButton isWhatsApp={isWhatsApp} />

              {visibleGroups.map((group) => (
                <div key={group.title} className="mb-4">
                  <div className="px-2 py-1 mb-1 text-[10px] font-bold text-slate-500 dark:text-gray-400 tracking-wider uppercase">
                    {group.title}
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const itemBase = item.href.split('?')[0];
                      const isMarketingMain = item.href === '/agency/marketing';
                      const isActive = item.href.includes('?')
                        ? pathname === itemBase
                        : isMarketingMain
                          ? pathname === '/agency/marketing' || pathname === '/agency/marketing/kanban'
                          : pathname === item.href || (item.href !== '/dashboard' && item.href !== '/settings' && !isMarketingMain && pathname.startsWith(item.href));
                      const isInbox = item.href === '/inbox';
                      const shouldBlink = isInbox && hasGlobalUnread && !isActive;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobileMenu}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                            isActive
                              ? isWhatsApp
                                ? 'bg-[#00A884]/15 text-[#00A884] font-semibold border-l-2 border-[#00A884]'
                                : 'bg-blue-50 dark:bg-slate-800/80 text-blue-600 dark:text-white font-semibold border-l-2 border-blue-600 dark:border-cyan-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800/60 hover:text-slate-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? (isWhatsApp ? 'text-[#00A884]' : 'text-blue-600 dark:text-cyan-400') : 'text-slate-400'} />
                            {shouldBlink && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                            )}
                          </div>
                          <span className="truncate flex-1">{item.name}</span>
                          {isInbox && hasGlobalUnread && (
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé Mobile / Operador */}
            <div className="p-3 border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#070D1B] flex flex-col gap-2 shrink-0">
              {/* Atalho Console Super Admin no Mobile Footer */}
              {(currentUser?.isSuperAdmin || currentUser?.role === 'SUPER_ADMIN' || targetTenantId) && (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    if (targetTenantId) {
                      handleExitSupportMode();
                    } else {
                      router.push('/super-admin/companies');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <ShieldCheck size={15} />
                  <span>{targetTenantId ? 'Voltar ao Super Admin' : 'Console Super Admin'}</span>
                </button>
              )}

              {/* Atalho de Workspace no Mobile */}
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  setIsWorkspaceModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 hover:border-blue-500/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[9px] text-white shrink-0 overflow-hidden shadow-xs"
                    style={{ backgroundColor: isWhatsApp ? "#00A884" : (activeWorkspace?.themeColor || "#2563EB") }}
                  >
                    {activeWorkspace?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeWorkspace.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(activeWorkspace?.name || targetTenantName || "W").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-gray-400">Workspace Ativo</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                      {targetTenantName ? (activeWorkspace?.name || targetTenantName) : (activeWorkspace?.name || "Workspace Principal")}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold shrink-0">Trocar</span>
              </button>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800">
                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                  onClick={() => {
                    closeMobileMenu();
                    setIsProfileModalOpen(true);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {isAvatarUrlValid(currentUser?.avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={currentUser!.avatarUrl!} 
                        alt="Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      currentUser?.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || "Usuário"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                      {targetTenantName ? (activeWorkspace?.name || targetTenantName) : (activeWorkspace?.name || currentUser?.tenantName || "Verto Comercial")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
                  title="Sair da conta"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Modais Estilo Lero */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      <SoundAlertsModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
      />

      <WorkspaceManagerModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        activeWorkspaceId={activeWorkspace?.id}
        onWorkspaceSelected={(ws) => {
          setActiveWorkspace(ws);
          loadWorkspaces();
        }}
      />
    </>
  );
}
