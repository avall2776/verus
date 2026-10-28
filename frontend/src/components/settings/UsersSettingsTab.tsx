"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  User,
  Loader2,
  X,
  Check,
  Mail,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  MessageSquare,
  Kanban,
  MessagesSquare,
  Zap,
  Settings,
  LifeBuoy,
  Megaphone,
  Network,
  MoreVertical,
  Calendar,
  LayoutDashboard,
  Wifi,
  Sparkles,
  Workflow,
  CreditCard,
  ChevronDown,
  Search,
  KeyRound,
  ShieldCheck,
  HelpCircle,
  BookUser,
  Power,
  CheckSquare,
  Square,
  Building,
  Activity,
  Compass,
  BarChart,
  Radio,
  FileText,
  ScrollText,
  Target,
  PieChart,
  TrendingUp,
  Briefcase,
  FolderArchive,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";
import { useTheme } from "@/contexts/ThemeContext";

export interface UserMenuPermissions {
  // 1. Operação & Atendimento
  whatsapp: boolean;
  monitor: boolean;
  contacts: boolean;
  email_inbox: boolean;
  tactical_map: boolean;
  service_metrics: boolean;

  // 2. Comunicação da Equipe
  chat: boolean;

  // 3. Funil Comercial (CRM) & Vendas
  radar_stories: boolean;
  proposals: boolean;
  contracts: boolean;
  sales_goals: boolean;
  sales_metrics: boolean;
  advanced_analytics: boolean;

  // 4. Sistema, Inteligência & Configurações
  dashboard: boolean;
  ai_agents: boolean;
  automations: boolean;
  connections: boolean;
  departments: boolean;
  users: boolean;
  support: boolean;
  products: boolean;
  quick_replies: boolean;
  integrations: boolean;
  billing: boolean;
  webhooks: boolean;
  settings: boolean;
  my_account: boolean;

  // Retrocompatibilidade
  agenda?: boolean;
  chatbots?: boolean;
}

export interface UserSubPermissions {
  // CRM
  crm_enabled: boolean;
  crm_create_funnels: boolean;
  crm_delete_deals: boolean;
  crm_only_own_deals: boolean;

  // Marketing & Agência
  marketing_enabled: boolean;
  marketing_kanban: boolean;
  marketing_clients: boolean;
  marketing_schedule: boolean;
  marketing_media: boolean;

  // Retrocompatibilidade
  agenda_enabled?: boolean;
  analytics_enabled?: boolean;
}

export interface UserPermissions {
  menus?: UserMenuPermissions;
  subPermissions?: UserSubPermissions;
  // Retrocompatibilidade VERSUS
  inbox?: boolean;
  crm?: boolean;
  chat?: boolean;
  automations?: boolean;
  settings?: boolean;
  support?: boolean;
  marketing?: boolean;
}

export const DEFAULT_ADMIN_MENUS: UserMenuPermissions = {
  whatsapp: true,
  monitor: true,
  contacts: true,
  email_inbox: true,
  tactical_map: true,
  service_metrics: true,
  chat: true,
  radar_stories: true,
  proposals: true,
  contracts: true,
  sales_goals: true,
  sales_metrics: true,
  advanced_analytics: true,
  dashboard: true,
  ai_agents: true,
  automations: true,
  connections: true,
  departments: true,
  users: true,
  support: true,
  products: true,
  quick_replies: true,
  integrations: true,
  billing: true,
  webhooks: true,
  settings: true,
  my_account: true,
};

export const DEFAULT_ADMIN_SUB_PERMS: UserSubPermissions = {
  crm_enabled: true,
  crm_create_funnels: true,
  crm_delete_deals: true,
  crm_only_own_deals: false,
  marketing_enabled: true,
  marketing_kanban: true,
  marketing_clients: true,
  marketing_schedule: true,
  marketing_media: true,
};

export const DEFAULT_SUPERVISOR_MENUS: UserMenuPermissions = {
  whatsapp: true,
  monitor: true,
  contacts: true,
  email_inbox: true,
  tactical_map: true,
  service_metrics: true,
  chat: true,
  radar_stories: true,
  proposals: true,
  contracts: true,
  sales_goals: true,
  sales_metrics: true,
  advanced_analytics: true,
  dashboard: true,
  ai_agents: true,
  automations: true,
  connections: false,
  departments: true,
  users: false,
  support: true,
  products: true,
  quick_replies: true,
  integrations: false,
  billing: false,
  webhooks: false,
  settings: false,
  my_account: true,
};

export const DEFAULT_SUPERVISOR_SUB_PERMS: UserSubPermissions = {
  crm_enabled: true,
  crm_create_funnels: true,
  crm_delete_deals: false,
  crm_only_own_deals: false,
  marketing_enabled: true,
  marketing_kanban: true,
  marketing_clients: true,
  marketing_schedule: true,
  marketing_media: true,
};

export const DEFAULT_COLLABORATOR_MENUS: UserMenuPermissions = {
  whatsapp: true,
  monitor: false,
  contacts: false,
  email_inbox: false,
  tactical_map: false,
  service_metrics: false,
  chat: true,
  radar_stories: false,
  proposals: false,
  contracts: false,
  sales_goals: false,
  sales_metrics: false,
  advanced_analytics: false,
  dashboard: false,
  ai_agents: false,
  automations: false,
  connections: false,
  departments: false,
  users: false,
  support: true,
  products: false,
  quick_replies: true,
  integrations: false,
  billing: false,
  webhooks: false,
  settings: false,
  my_account: true,
};

export const DEFAULT_COLLABORATOR_SUB_PERMS: UserSubPermissions = {
  crm_enabled: true,
  crm_create_funnels: false,
  crm_delete_deals: false,
  crm_only_own_deals: true,
  marketing_enabled: false,
  marketing_kanban: false,
  marketing_clients: false,
  marketing_schedule: false,
  marketing_media: false,
};

export interface DepartmentItem {
  id: string;
  name: string;
  color?: string | null;
}

export interface UserDepartmentRelation {
  departmentId: string;
  department: DepartmentItem;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string; // ADMIN, SUPERVISOR, AGENT
  isActive?: boolean;
  isSuperAdmin?: boolean;
  canAccessMarketing?: boolean;
  permissions?: UserPermissions;
  departments?: UserDepartmentRelation[];
  avatarUrl?: string;
  isOnline?: boolean;
  createdAt?: string;
  workspaceName?: string;
}

export interface PermissionMenuConfig {
  key: keyof UserMenuPermissions;
  label: string;
  tooltip: string;
  icon: React.ElementType;
}

export interface PermissionCategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  menus: PermissionMenuConfig[];
}

export const PERMISSION_CATEGORIES: PermissionCategoryConfig[] = [
  {
    id: "operacao",
    title: "Operação & Atendimento",
    description: "Canais de comunicação, atendimento ao vivo, monitoramento e métricas de suporte",
    icon: MessageSquare,
    badge: "Atendimento",
    menus: [
      { key: "whatsapp", label: "WhatsApp", tooltip: "Acesso ao Inbox ao vivo, conversas e filas", icon: MessageSquare },
      { key: "monitor", label: "Monitor em Tempo Real", tooltip: "Supervisão de atendentes, conversas ativas e espião", icon: Activity },
      { key: "contacts", label: "Base de Contatos", tooltip: "Gestão completa de leads, clientes e histórico", icon: Users },
      { key: "email_inbox", label: "Inbox de E-mail", tooltip: "Caixa de entrada e atendimento unificado por e-mail", icon: Mail },
      { key: "tactical_map", label: "Mapa Tático Operacional", tooltip: "Geolocalização de clientes e áreas de atuação", icon: Compass },
      { key: "service_metrics", label: "Métricas de Atendimento", tooltip: "Indicadores operacionais de SLA e tempo de resposta", icon: BarChart },
    ],
  },
  {
    id: "comunicacao",
    title: "Comunicação da Equipe",
    description: "Canais internos de equipe e mensagens diretas",
    icon: MessagesSquare,
    badge: "Equipe",
    menus: [
      { key: "chat", label: "Chat Interno", tooltip: "Comunicação interna em tempo real entre a equipe", icon: MessagesSquare },
    ],
  },
  {
    id: "comercial",
    title: "Funil Comercial (CRM) & Vendas",
    description: "Gestão de negócios, propostas comerciais, contratos e inteligência de vendas",
    icon: Kanban,
    badge: "Vendas",
    menus: [
      { key: "radar_stories", label: "Radar de Stories", tooltip: "Rastreamento de visualizadores de stories e leads quentes", icon: Radio },
      { key: "proposals", label: "Propostas Comerciais", tooltip: "Emissão e envio de orçamentos e propostas", icon: FileText },
      { key: "contracts", label: "Contratos", tooltip: "Gestão de minutas, contratos assinados e jurídicos", icon: ScrollText },
      { key: "sales_goals", label: "Metas Comerciais", tooltip: "Painel de metas e desempenho de vendas da equipe", icon: Target },
      { key: "sales_metrics", label: "Métricas de Vendas", tooltip: "Gráficos de conversão e ticket médio do funil", icon: PieChart },
      { key: "advanced_analytics", label: "Analytics Avançado", tooltip: "Relatórios preditivos e inteligência comercial", icon: TrendingUp },
    ],
  },
  {
    id: "sistema",
    title: "Sistema, Inteligência & Configurações",
    description: "Administração da plataforma, inteligência artificial e parâmetros corporativos",
    icon: Settings,
    badge: "Configuração",
    menus: [
      { key: "dashboard", label: "Visão Geral / Dashboard", tooltip: "Painéis analíticos, metas e produtividade", icon: LayoutDashboard },
      { key: "ai_agents", label: "Inteligência Artificial (BYOK)", tooltip: "Configurações da Sofia e inteligência artificial", icon: Sparkles },
      { key: "automations", label: "Automações & Regras", tooltip: "Gatilhos de fluxo, regras automáticas do CRM e webhooks", icon: Zap },
      { key: "connections", label: "Conexões WhatsApp", tooltip: "Status e pareamento das instâncias de WhatsApp", icon: Wifi },
      { key: "departments", label: "Departamentos & Filas", tooltip: "Configuração de departamentos, filas e filiais", icon: Network },
      { key: "users", label: "Equipe & Usuários", tooltip: "Gestão de equipe e níveis de acesso", icon: Users },
      { key: "support", label: "Central de Suporte", tooltip: "Abertura e gestão de chamados com o suporte da plataforma", icon: LifeBuoy },
      { key: "products", label: "Catálogo & Produtos", tooltip: "Pasta do Drive e catálogo de produtos para orçamentos e propostas", icon: PackageCheck },
      { key: "quick_replies", label: "Respostas Rápidas", tooltip: "Atalhos de teclado (macros) para envio ágil no Inbox", icon: MessageSquare },
      { key: "integrations", label: "Integrações", tooltip: "Conectores externos, CRMs e webhooks", icon: Workflow },
      { key: "billing", label: "Plano & Assinatura", tooltip: "Gestão de planos, limites operacionais e faturas", icon: CreditCard },
      { key: "webhooks", label: "APIs & Webhooks", tooltip: "Tokens de API e eventos HTTP de tráfego pago (Meta Ads)", icon: KeyRound },
      { key: "settings", label: "Configurações Gerais", tooltip: "Parâmetros gerais do sistema e empresa", icon: Settings },
      { key: "my_account", label: "Minha Conta", tooltip: "Perfil pessoal, senha e preferências", icon: User },
    ],
  },
];

export default function UsersSettingsTab() {
  const { isWhatsApp, isClean } = useTheme();

  const primaryBtnClass = isWhatsApp
    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
    : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20";

  const checkColorClass = isWhatsApp ? "text-emerald-500" : "text-blue-600 dark:text-blue-400";
  const focusBorderClass = isWhatsApp ? "focus:border-emerald-500" : "focus:border-blue-500";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDepartments, setAvailableDepartments] = useState<DepartmentItem[]>([]);
  const [maxUsers, setMaxUsers] = useState<number>(12);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Filtros da Tabela
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // Dropdown de Ações por Usuário
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modal 1: Editar / Convidar Colaborador
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const [submittingUserForm, setSubmittingUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"Administrador" | "Supervisor" | "Colaborador">("Colaborador");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDepartmentIds, setFormDepartmentIds] = useState<string[]>([]);
  const [formWorkspace, setFormWorkspace] = useState("Workspace 1");

  // Modal 2: Permissões de Acesso
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [submittingPerms, setSubmittingPerms] = useState(false);
  const [permsUser, setPermsUser] = useState<UserItem | null>(null);
  const [activeMenus, setActiveMenus] = useState<UserMenuPermissions>(DEFAULT_COLLABORATOR_MENUS);
  const [activeSubPerms, setActiveSubPerms] = useState<UserSubPermissions>(DEFAULT_COLLABORATOR_SUB_PERMS);

  // Modal 3: Redefinir Senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [passwordUserName, setPasswordUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchPlanLimit();
  }, []);

  const fetchPlanLimit = async () => {
    try {
      const res = await api.get("/users/me");
      if (res.data?.tenant?.plan?.maxUsers) {
        setMaxUsers(res.data.tenant.plan.maxUsers);
      }
    } catch (e) {
      // fallback
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setAvailableDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("[DEPARTMENTS_FETCH_ERROR]", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      const list = Array.isArray(res.data) ? res.data : [];
      const filtered = list.filter(
        (u: any) => !u.isSuperAdmin && u.role !== "SUPER_ADMIN"
      );
      setUsers(filtered);
    } catch (err: any) {
      console.error("[USERS_FETCH_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  };

  // Mapeamento de Role para o padrão Lero
  const getRoleLabel = (role: string): "Administrador" | "Supervisor" | "Colaborador" => {
    const upper = String(role || "").toUpperCase();
    if (upper === "ADMIN") return "Administrador";
    if (upper === "SUPERVISOR") return "Supervisor";
    return "Colaborador";
  };

  const getRoleApiValue = (label: "Administrador" | "Supervisor" | "Colaborador"): string => {
    if (label === "Administrador") return "ADMIN";
    if (label === "Supervisor") return "SUPERVISOR";
    return "AGENT";
  };

  // Filtragem da Lista
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !searchTerm.trim() ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      const userRoleLabel = getRoleLabel(u.role);
      const matchRole =
        filterRole === "all" || userRoleLabel.toLowerCase() === filterRole.toLowerCase();

      const matchDept =
        filterDepartment === "all" ||
        (u.departments && u.departments.some((d) => d.departmentId === filterDepartment));

      return matchSearch && matchRole && matchDept;
    });
  }, [users, searchTerm, filterRole, filterDepartment]);

  // Selecionar todos os checkboxes
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Abrir Modal de Convidar Colaborador (Padrão Lero)
  const handleOpenInvite = () => {
    setIsInviteMode(true);
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("Colaborador");
    setFormIsActive(true);
    setFormDepartmentIds([]);
    setFormWorkspace("Workspace 1");
    setIsEditModalOpen(true);
  };

  // Abrir Modal de Editar Colaborador (Padrão Lero)
  const handleOpenEdit = (u: UserItem) => {
    setIsInviteMode(false);
    setEditingUserId(u.id);
    setFormName(u.name || "");
    setFormEmail(u.email || "");
    setFormPassword("");
    setFormRole(getRoleLabel(u.role));
    setFormIsActive(u.isActive !== false);
    setFormDepartmentIds((u.departments || []).map((d) => d.departmentId));
    setFormWorkspace("Workspace 1");
    setIsEditModalOpen(true);
  };

  // Salvar Edição ou Convite de Colaborador
  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("O nome do colaborador é obrigatório.");
      return;
    }
    if (isInviteMode && !formEmail.trim()) {
      toast.error("O e-mail do colaborador é obrigatório.");
      return;
    }

    setSubmittingUserForm(true);
    try {
      const apiRole = getRoleApiValue(formRole);

      if (isInviteMode) {
        // Convidar novo colaborador
        let defaultMenus = DEFAULT_COLLABORATOR_MENUS;
        let defaultSub = DEFAULT_COLLABORATOR_SUB_PERMS;
        if (apiRole === "ADMIN") {
          defaultMenus = DEFAULT_ADMIN_MENUS;
          defaultSub = DEFAULT_ADMIN_SUB_PERMS;
        } else if (apiRole === "SUPERVISOR") {
          defaultMenus = DEFAULT_SUPERVISOR_MENUS;
          defaultSub = DEFAULT_SUPERVISOR_SUB_PERMS;
        }

        const permissionsPayload: UserPermissions = {
          menus: defaultMenus,
          subPermissions: defaultSub,
          inbox: defaultMenus.whatsapp,
          crm: defaultSub.crm_enabled,
          chat: defaultMenus.chat,
          automations: defaultMenus.automations || defaultMenus.ai_agents,
          settings: defaultMenus.settings,
          support: defaultMenus.support !== undefined ? defaultMenus.support : true,
          marketing: defaultSub.marketing_enabled || defaultMenus.contacts,
        };

        const res = await api.post("/users", {
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim() || undefined,
          role: apiRole,
          permissions: permissionsPayload,
          departmentIds: formDepartmentIds,
        });

        toast.success(res.data?.message || "Colaborador convidado com sucesso!");
      } else if (editingUserId) {
        // Atualizar colaborador existente
        const payload: any = {
          name: formName.trim(),
          role: apiRole,
          isActive: formIsActive,
          departmentIds: formDepartmentIds,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }

        const res = await api.patch(`/users/${editingUserId}`, payload);
        toast.success(res.data?.message || "Colaborador atualizado com sucesso!");
      }

      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("[SAVE_USER_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar informações do colaborador.");
    } finally {
      setSubmittingUserForm(false);
    }
  };

  // Selecionar ou desmarcar todos os menus
  const handleSelectAllMenus = (enable: boolean) => {
    setActiveMenus((prev) => {
      const updated = { ...prev };
      PERMISSION_CATEGORIES.forEach((cat) => {
        cat.menus.forEach((m) => {
          updated[m.key] = enable;
        });
      });
      return updated;
    });
    setActiveSubPerms((prev) => ({
      ...prev,
      crm_enabled: enable,
      crm_create_funnels: enable,
      crm_delete_deals: enable,
      crm_only_own_deals: !enable,
      marketing_enabled: enable,
      marketing_kanban: enable,
      marketing_clients: enable,
      marketing_schedule: enable,
      marketing_media: enable,
    }));
  };

  // Alternar todos os menus de uma categoria específica
  const handleToggleCategoryMenus = (cat: PermissionCategoryConfig, enable: boolean) => {
    setActiveMenus((prev) => {
      const updated = { ...prev };
      cat.menus.forEach((m) => {
        updated[m.key] = enable;
      });
      return updated;
    });
  };

  // Restaurar permissões para o padrão do cargo do usuário selecionado
  const handleResetToRoleDefault = () => {
    if (!permsUser) return;
    const roleLabel = getRoleLabel(permsUser.role);
    if (roleLabel === "Administrador") {
      setActiveMenus({ ...DEFAULT_ADMIN_MENUS });
      setActiveSubPerms({ ...DEFAULT_ADMIN_SUB_PERMS });
    } else if (roleLabel === "Supervisor") {
      setActiveMenus({ ...DEFAULT_SUPERVISOR_MENUS });
      setActiveSubPerms({ ...DEFAULT_SUPERVISOR_SUB_PERMS });
    } else {
      setActiveMenus({ ...DEFAULT_COLLABORATOR_MENUS });
      setActiveSubPerms({ ...DEFAULT_COLLABORATOR_SUB_PERMS });
    }
    toast.success(`Permissões restauradas para o padrão de ${roleLabel}.`);
  };

  // Abrir Modal de Permissões de Acesso (Padrão Completo de Menus & Sub-permissões)
  const handleOpenPerms = (u: UserItem) => {
    setPermsUser(u);
    const roleLabel = getRoleLabel(u.role);

    // Carregar padrão do perfil
    let roleDefaultMenus = DEFAULT_COLLABORATOR_MENUS;
    let roleDefaultSub = DEFAULT_COLLABORATOR_SUB_PERMS;
    if (roleLabel === "Administrador") {
      roleDefaultMenus = DEFAULT_ADMIN_MENUS;
      roleDefaultSub = DEFAULT_ADMIN_SUB_PERMS;
    } else if (roleLabel === "Supervisor") {
      roleDefaultMenus = DEFAULT_SUPERVISOR_MENUS;
      roleDefaultSub = DEFAULT_SUPERVISOR_SUB_PERMS;
    }

    const existing = u.permissions || {};

    // Mesclar menus existentes com os padrões do cargo para garantir que todos os novos menus existam
    const menus: UserMenuPermissions = {
      ...roleDefaultMenus,
      ...(existing.menus || {}),
    };

    if (!existing.menus) {
      if (existing.inbox !== undefined) menus.whatsapp = existing.inbox;
      if (existing.chat !== undefined) menus.chat = existing.chat;
      if (existing.settings !== undefined) menus.settings = existing.settings;
      if (existing.automations !== undefined) menus.automations = existing.automations;
      if (existing.support !== undefined) menus.support = existing.support;
    }

    const sub: UserSubPermissions = {
      ...roleDefaultSub,
      ...(existing.subPermissions || {}),
    };

    if (!existing.subPermissions) {
      if (existing.crm !== undefined) sub.crm_enabled = existing.crm;
      if (existing.marketing !== undefined) sub.marketing_enabled = existing.marketing;
    }

    setActiveMenus(menus);
    setActiveSubPerms(sub);
    setIsPermsModalOpen(true);
  };

  // Salvar Permissões de Acesso
  const handleSavePerms = async () => {
    if (!permsUser) return;
    setSubmittingPerms(true);
    try {
      const permissionsPayload: UserPermissions = {
        menus: activeMenus,
        subPermissions: activeSubPerms,
        inbox: activeMenus.whatsapp,
        crm: activeSubPerms.crm_enabled,
        chat: activeMenus.chat,
        automations: activeMenus.automations || activeMenus.ai_agents,
        settings: activeMenus.settings,
        support: activeMenus.support !== undefined ? activeMenus.support : true,
        marketing: activeSubPerms.marketing_enabled || activeMenus.contacts,
      };

      await api.patch(`/users/${permsUser.id}/permissions`, {
        permissions: permissionsPayload,
      });

      toast.success("Permissões de acesso salvas com sucesso!");
      setIsPermsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("[SAVE_PERMS_ERROR]", err);
      toast.error(err.response?.data?.message || "Erro ao salvar permissões.");
    } finally {
      setSubmittingPerms(false);
    }
  };

  // Redefinir Senha
  const handleOpenPasswordModal = (u: UserItem) => {
    setPasswordUserId(u.id);
    setPasswordUserName(u.name);
    setNewPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserId || !newPassword.trim()) {
      toast.error("Informe a nova senha.");
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSubmittingPassword(true);
    try {
      await api.patch(`/users/${passwordUserId}`, {
        password: newPassword.trim(),
      });
      toast.success(`Senha de "${passwordUserName}" redefinida com sucesso!`);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao redefinir senha.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Alternar Ativo / Inativo
  const handleToggleActive = async (u: UserItem) => {
    try {
      const newStatus = !(u.isActive !== false);
      await api.patch(`/users/${u.id}`, { isActive: newStatus });
      toast.success(newStatus ? `Colaborador "${u.name}" ativado!` : `Colaborador "${u.name}" inativado!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar status do colaborador.");
    }
  };

  // Remover Colaborador
  const handleDeleteUser = async (u: UserItem) => {
    if (!window.confirm(`Tem certeza que deseja remover o colaborador "${u.name}" da sua conta?`)) {
      return;
    }
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("Colaborador removido com sucesso!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover colaborador.");
    }
  };

  const toggleFormDepartment = (deptId: string) => {
    setFormDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-semibold">Carregando gestão de colaboradores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
      {/* 1. CABEÇALHO SUPERIOR (PADRÃO LERO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Gestão de Usuários
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie os colaboradores da sua conta
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div
            className="flex items-center justify-between sm:justify-start gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800"
            title={`Limite da sua conta: ${maxUsers} usuários simultâneos`}
          >
            <span>{users.length} / {maxUsers} usuários</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
          </div>

          <button
            onClick={handleOpenInvite}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${primaryBtnClass}`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Convidar Colaborador</span>
          </button>
        </div>
      </div>

      {/* 2. CARD PRINCIPAL DA TABELA (PADRÃO LERO) */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-hidden p-4 space-y-4">
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${focusBorderClass} transition-colors`}
            />
          </div>

          {/* Filtro de Ambiente */}
          <div className="relative w-full sm:w-auto">
            <select
              value={filterEnvironment}
              onChange={(e) => setFilterEnvironment(e.target.value)}
              className={`w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium outline-none ${focusBorderClass} cursor-pointer`}
            >
              <option value="all">Todos os ambientes</option>
              <option value="workspace-1">Workspace 1</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro de Tipo de Usuário */}
          <div className="relative w-full sm:w-auto">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium outline-none ${focusBorderClass} cursor-pointer`}
            >
              <option value="all">Todos os tipos</option>
              <option value="administrador">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="colaborador">Colaborador</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro de Setor */}
          <div className="relative w-full sm:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className={`w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium outline-none ${focusBorderClass} cursor-pointer`}
            >
              <option value="all">Todos os setores</option>
              {availableDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Tabela Responsiva de Usuários */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0e131d]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr className="text-[10px] uppercase font-semibold tracking-wider">
                <th className="py-3 px-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className={`w-4 h-4 ${checkColorClass}`} />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 min-w-[200px]">Usuário</th>
                <th className="py-3 px-3 min-w-[110px]">Tipo</th>
                <th className="py-3 px-3 min-w-[220px]">Setores</th>
                <th className="py-3 px-3 min-w-[130px]">Ambiente de Trabalho</th>
                <th className="py-3 px-3 min-w-[80px]">Status</th>
                <th className="py-3 px-3 min-w-[110px]">Convite</th>
                <th className="py-3 px-3 w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    Nenhum colaborador encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const roleLabel = getRoleLabel(u.role);
                  const isOwner = idx === 0 && roleLabel === "Administrador";
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 transition-colors ${
                        isSelected ? (isWhatsApp ? "bg-emerald-500/10" : "bg-blue-500/10") : ""
                      }`}
                    >
                      {/* Checkbox de Seleção */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectUser(u.id)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className={`w-4 h-4 ${checkColorClass}`} />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Usuário (Online Dot + Avatar + Nome + Email) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {/* Dot Online/Offline */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              u.isOnline
                                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                                : "bg-slate-400 dark:bg-slate-600"
                            }`}
                            title={u.isOnline ? "Online" : "Offline"}
                          />

                          {/* Avatar com badge de proprietário se aplicável */}
                          <div
                            onClick={() => handleOpenEdit(u)}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 overflow-hidden relative shadow-inner cursor-pointer hover:border-blue-500 dark:hover:border-emerald-500 transition-all"
                            title="Clique para editar usuário"
                          >
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.name?.charAt(0).toUpperCase() || "U"}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div
                              onClick={() => handleOpenEdit(u)}
                              className="font-bold text-slate-900 dark:text-white truncate max-w-[180px] flex items-center gap-1.5 cursor-pointer hover:underline transition-colors"
                              title="Clique para editar usuário"
                            >
                              <span>{u.name}</span>
                              {isOwner && (
                                <span title="Proprietário da Conta">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px]">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo / Cargo (Administrador, Supervisor, Colaborador) */}
                      <td className="py-3 px-3">
                        {roleLabel === "Administrador" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40">
                            Administrador
                          </span>
                        ) : roleLabel === "Supervisor" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40">
                            Supervisor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Colaborador
                          </span>
                        )}
                      </td>

                      {/* Setores Vinculados */}
                      <td className="py-3 px-3">
                        {roleLabel === "Administrador" ? (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">
                            Acesso total
                          </span>
                        ) : u.departments && u.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {u.departments.map((rel) => (
                              <span
                                key={rel.departmentId}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#1a2334] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300"
                              >
                                {rel.department?.name || "Setor"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Nenhum setor
                          </span>
                        )}
                      </td>

                      {/* Ambiente de Trabalho */}
                      <td className="py-3 px-3">
                        {roleLabel === "Administrador" ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Todos</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-[#1a2334] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
                            Workspace 1
                          </span>
                        )}
                      </td>

                      {/* Status (Ativo / Inativo) */}
                      <td className="py-3 px-3">
                        {u.isActive !== false ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Convite */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                        {isOwner ? (
                          <span>—</span>
                        ) : u.createdAt ? (
                          <span>Aceito: {new Date(u.createdAt).toLocaleDateString("pt-BR")}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Ações (Editar Direto + Dropdown Três Pontos) */}
                      <td className="py-3 px-3 text-center relative">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar Colaborador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {isOwner ? (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                              Dono
                            </span>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(openActionMenuId === u.id ? null : u.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Mais opções"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openActionMenuId === u.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-white dark:bg-[#141b27] border border-slate-200 dark:border-slate-700/80 shadow-2xl p-1 text-left animate-in fade-in zoom-in-95 duration-150"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenEdit(u);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Editar Colaborador</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenPerms(u);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Permissões de Acesso</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenPasswordModal(u);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Redefinir Senha</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleToggleActive(u);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Power className="w-3.5 h-3.5 text-purple-500" />
                                    <span>{u.isActive !== false ? "Inativar" : "Ativar"}</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDeleteUser(u);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remover Colaborador</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL: EDITAR / CONVIDAR COLABORADOR (EXATA PARIDADE COM SCREENSHOT 2 DO LERO) */}
      {isEditModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isInviteMode ? "Convidar Colaborador" : "Editar Colaborador"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isInviteMode
                    ? "Envie um convite para um novo membro da equipe"
                    : "Atualize as informações do colaborador"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="space-y-4">
              {/* Campo: Nome */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Felipe Costa"
                  className={`w-full p-2.5 text-xs rounded-xl bg-white dark:bg-[#161d2b] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${focusBorderClass}`}
                  required
                />
              </div>

              {/* Campo: Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="comercial@suaempresa.com"
                  disabled={!isInviteMode}
                  className={`w-full p-2.5 text-xs rounded-xl border text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${
                    isInviteMode
                      ? `bg-white dark:bg-[#161d2b] border-slate-300 dark:border-slate-700 ${focusBorderClass}`
                      : "bg-slate-100 dark:bg-[#141a26] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  }`}
                  required
                />
              </div>

              {/* Campo: Senha Provisória (apenas no convite) */}
              {isInviteMode && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Senha Provisória (Opcional)</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Padrão: Versus@123"
                    className={`w-full p-2.5 text-xs rounded-xl bg-white dark:bg-[#161d2b] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${focusBorderClass}`}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Deixe em branco para usar a senha padrão segura (Versus@123).
                  </span>
                </div>
              )}

              {/* Campo: Tipo (Dropdown) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tipo</label>
                <div className="relative">
                  <select
                    value={formRole}
                    onChange={(e) =>
                      setFormRole(e.target.value as "Administrador" | "Supervisor" | "Colaborador")
                    }
                    className={`w-full appearance-none p-2.5 pr-8 text-xs rounded-xl bg-white dark:bg-[#161d2b] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none ${focusBorderClass} cursor-pointer`}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Colaborador">Colaborador</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Campo: Ambiente(s) de trabalho * (Padrão Lero) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Ambiente(s) de trabalho *</label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a2232] border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Workspace 1 <span className="text-slate-500 dark:text-slate-400">(Padrão)</span></span>
                </div>
              </div>

              {/* Campo: Setores (Scrollable Checklist) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Setores</label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a2232] border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Workspace 1
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {availableDepartments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        Nenhum departamento cadastrado. Crie setores na aba "Departamentos".
                      </p>
                    ) : (
                      availableDepartments.map((dept) => {
                        const isChecked = formDepartmentIds.includes(dept.id);
                        return (
                          <div
                            key={dept.id}
                            onClick={() => toggleFormDepartment(dept.id)}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked
                                ? isWhatsApp
                                  ? "bg-emerald-500/15 text-emerald-900 dark:text-white"
                                  : "bg-blue-500/15 text-blue-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? isWhatsApp
                                      ? "bg-emerald-600 text-white"
                                      : "bg-blue-600 text-white"
                                    : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span className="text-xs truncate">{dept.name}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingUserForm}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-sm ${primaryBtnClass}`}
                >
                  {submittingUserForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{isInviteMode ? "Convidar Colaborador" : "Salvar Alterações"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* 4. MODAL: PERMISSÕES DE ACESSO */}
      {isPermsModalOpen && permsUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="w-full max-w-4xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white space-y-4 max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Topo do Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isWhatsApp ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Permissões de Acesso ao Sistema
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Defina com precisão quais módulos e menus <strong className="text-slate-800 dark:text-slate-200">{permsUser.name}</strong> ({permsUser.email}) pode acessar.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPermsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barra de Ações Rápidas */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Perfil Atual:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    getRoleLabel(permsUser.role) === "Administrador"
                      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                      : getRoleLabel(permsUser.role) === "Supervisor"
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                      : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                  }`}>
                    {getRoleLabel(permsUser.role)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllMenus(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-medium text-xs cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Marcar Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllMenus(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-medium text-xs cursor-pointer shadow-xs"
                  >
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>Desmarcar Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefault}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Padrão do Cargo</span>
                  </button>
                </div>
              </div>

              {/* Corpo com Scroll: Categorias de Menus e Sub-permissões */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {PERMISSION_CATEGORIES.map((cat) => {
                  const CategoryIcon = cat.icon;
                  const allCatChecked = cat.menus.every((m) => Boolean(activeMenus[m.key]));

                  return (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#141a26]/70 border border-slate-200 dark:border-slate-800/80 space-y-3 transition-all"
                    >
                      {/* Cabeçalho da Categoria */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isWhatsApp ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          }`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                {cat.title}
                              </h4>
                              {cat.badge && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {cat.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {cat.description}
                            </p>
                          </div>
                        </div>

                        {/* Botão de seleção rápida da categoria */}
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryMenus(cat, !allCatChecked)}
                          className="self-start sm:self-auto text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          {allCatChecked ? "Desmarcar Grupo" : "Marcar Grupo"}
                        </button>
                      </div>

                      {/* Grid de Menus da Categoria */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {cat.menus.map((menu) => {
                          const isChecked = Boolean(activeMenus[menu.key]);
                          const MenuIcon = menu.icon;

                          return (
                            <div
                              key={menu.key}
                              onClick={() =>
                                setActiveMenus((prev) => ({
                                  ...prev,
                                  [menu.key]: !prev[menu.key],
                                }))
                              }
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all select-none ${
                                isChecked
                                  ? isWhatsApp
                                    ? "bg-white dark:bg-[#1c2434] border-emerald-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-emerald-500/20"
                                    : "bg-white dark:bg-[#1c2434] border-blue-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-blue-500/20"
                                  : "bg-white/60 dark:bg-[#0f1523] border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked
                                      ? isWhatsApp
                                        ? "bg-emerald-600 text-white"
                                        : "bg-blue-600 text-white"
                                      : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                  }`}
                                >
                                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>

                                <MenuIcon className={`w-4 h-4 shrink-0 ${isChecked ? (isWhatsApp ? "text-emerald-500" : "text-blue-500") : "text-slate-400 dark:text-slate-500"}`} />
                                <span className={`text-xs font-medium truncate ${isChecked ? "text-slate-900 dark:text-white font-semibold" : ""}`}>
                                  {menu.label}
                                </span>
                              </div>

                              <span
                                title={menu.tooltip}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 p-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Sub-permissões específicas integradas sob a categoria Comercial (CRM) */}
                      {cat.id === "comercial" && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                            Sub-permissões Granulares do CRM
                          </span>

                          <div className="p-3 rounded-xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800/80 space-y-3">
                            <div
                              onClick={() =>
                                setActiveSubPerms((prev) => ({
                                  ...prev,
                                  crm_enabled: !prev.crm_enabled,
                                }))
                              }
                              className="flex items-center gap-2.5 cursor-pointer select-none"
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  activeSubPerms.crm_enabled
                                    ? isWhatsApp
                                      ? "bg-emerald-600 text-white"
                                      : "bg-blue-600 text-white"
                                    : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                }`}
                              >
                                {activeSubPerms.crm_enabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <Kanban className={`w-4 h-4 ${isWhatsApp ? "text-emerald-500" : "text-blue-500"}`} />
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                Módulo de Oportunidades & Pipelines (CRM Ativo)
                              </span>
                            </div>

                            {activeSubPerms.crm_enabled && (
                              <div className="pl-6 space-y-2.5 border-l-2 border-slate-200 dark:border-slate-800 ml-2 animate-in fade-in duration-150">
                                <div
                                  onClick={() =>
                                    setActiveSubPerms((prev) => ({
                                      ...prev,
                                      crm_create_funnels: !prev.crm_create_funnels,
                                    }))
                                  }
                                  className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                        activeSubPerms.crm_create_funnels
                                          ? isWhatsApp
                                            ? "bg-emerald-600 text-white"
                                            : "bg-blue-600 text-white"
                                          : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                      }`}
                                    >
                                      {activeSubPerms.crm_create_funnels && (
                                        <Check className="w-2 h-2 stroke-[3]" />
                                      )}
                                    </span>
                                    <span>+ Criar Novos Funis & Etapas</span>
                                  </div>
                                  <span title="Permite criar novos funis de venda e customizar etapas no CRM">
                                    <HelpCircle className="w-3 h-3 text-slate-400" />
                                  </span>
                                </div>

                                <div
                                  onClick={() =>
                                    setActiveSubPerms((prev) => ({
                                      ...prev,
                                      crm_delete_deals: !prev.crm_delete_deals,
                                    }))
                                  }
                                  className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                        activeSubPerms.crm_delete_deals
                                          ? isWhatsApp
                                            ? "bg-emerald-600 text-white"
                                            : "bg-blue-600 text-white"
                                          : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                      }`}
                                    >
                                      {activeSubPerms.crm_delete_deals && (
                                        <Check className="w-2 h-2 stroke-[3]" />
                                      )}
                                    </span>
                                    <span>Excluir Oportunidades</span>
                                  </div>
                                  <span title="Permite excluir permanentemente oportunidades e cards do funil">
                                    <HelpCircle className="w-3 h-3 text-slate-400" />
                                  </span>
                                </div>

                                <div
                                  onClick={() =>
                                    setActiveSubPerms((prev) => ({
                                      ...prev,
                                      crm_only_own_deals: !prev.crm_only_own_deals,
                                    }))
                                  }
                                  className="flex items-center justify-between cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                        activeSubPerms.crm_only_own_deals
                                          ? isWhatsApp
                                            ? "bg-emerald-600 text-white"
                                            : "bg-blue-600 text-white"
                                          : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                      }`}
                                    >
                                      {activeSubPerms.crm_only_own_deals && (
                                        <Check className="w-2 h-2 stroke-[3]" />
                                      )}
                                    </span>
                                    <span>Ver Apenas Próprias Oportunidades</span>
                                  </div>
                                  <span title="Restringe a visão do operador exclusivamente aos negócios em que ele é o vendedor responsável">
                                    <HelpCircle className="w-3 h-3 text-slate-400" />
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Seção Adicional: Marketing & Agência */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#141a26]/70 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isWhatsApp ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Marketing & Agência
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Agência
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Fluxo de produção de criativos, cronograma de postagens e gestão de clientes da agência
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setActiveSubPerms((prev) => {
                          const nextVal = !prev.marketing_enabled;
                          return {
                            ...prev,
                            marketing_enabled: nextVal,
                            marketing_kanban: nextVal ? prev.marketing_kanban || true : false,
                            marketing_clients: nextVal ? prev.marketing_clients || true : false,
                            marketing_schedule: nextVal ? prev.marketing_schedule || true : false,
                            marketing_media: nextVal ? prev.marketing_media || true : false,
                          };
                        })
                      }
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          activeSubPerms.marketing_enabled
                            ? isWhatsApp
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-600 text-white"
                            : "border border-slate-300 dark:border-slate-600 bg-transparent"
                        }`}
                      >
                        {activeSubPerms.marketing_enabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Habilitar Módulo
                      </span>
                    </div>
                  </div>

                  {activeSubPerms.marketing_enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-in fade-in duration-150">
                      {[
                        {
                          key: "marketing_kanban" as const,
                          label: "Kanban de Produção",
                          tooltip: "Quadro de tarefas, prazos e demandas da equipe criativa",
                          icon: Kanban,
                        },
                        {
                          key: "marketing_clients" as const,
                          label: "Clientes & Escopos",
                          tooltip: "Gerenciamento de clientes contratantes e escopos de serviço",
                          icon: Briefcase,
                        },
                        {
                          key: "marketing_schedule" as const,
                          label: "Cronograma Editorial",
                          tooltip: "Calendário de publicações e agendamento de pautas",
                          icon: Calendar,
                        },
                        {
                          key: "marketing_media" as const,
                          label: "Biblioteca de Mídia",
                          tooltip: "Acervo de arquivos, artes e materiais publicitários",
                          icon: FolderArchive,
                        },
                      ].map((subItem) => {
                        const isChecked = Boolean(activeSubPerms[subItem.key]);
                        const SubIcon = subItem.icon;

                        return (
                          <div
                            key={subItem.key}
                            onClick={() =>
                              setActiveSubPerms((prev) => ({
                                ...prev,
                                [subItem.key]: !prev[subItem.key],
                              }))
                            }
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all select-none ${
                              isChecked
                                ? isWhatsApp
                                  ? "bg-white dark:bg-[#1c2434] border-emerald-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-emerald-500/20"
                                  : "bg-white dark:bg-[#1c2434] border-blue-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-blue-500/20"
                                : "bg-white/60 dark:bg-[#0f1523] border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? isWhatsApp
                                      ? "bg-emerald-600 text-white"
                                      : "bg-blue-600 text-white"
                                    : "border border-slate-300 dark:border-slate-600 bg-transparent"
                                }`}
                              >
                                {isChecked && <Check className="w-2 h-2 stroke-[3]" />}
                              </span>
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? (isWhatsApp ? "text-emerald-500" : "text-blue-500") : "text-slate-400"}`} />
                              <span className="text-xs font-medium truncate">{subItem.label}</span>
                            </div>
                            <span title={subItem.tooltip} className="text-slate-400 p-0.5">
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Modal de Permissões */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>As alterações são sincronizadas imediatamente com a sessão do usuário.</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsPermsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePerms}
                    disabled={submittingPerms}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-sm ${primaryBtnClass}`}
                  >
                    {submittingPerms ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando Permissões...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Salvar Permissões</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 5. MODAL: REDEFINIR SENHA */}
      {isPasswordModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Redefinir Senha</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Defina a nova senha para <strong className="text-slate-900 dark:text-white">{passwordUserName}</strong>:
            </p>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mínimo 6 caracteres)"
                className={`w-full p-2.5 text-xs rounded-xl bg-white dark:bg-[#070D1B] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${focusBorderClass}`}
                required
                autoFocus
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs disabled:opacity-50 cursor-pointer shadow-sm ${primaryBtnClass}`}
                >
                  {submittingPassword ? "Salvando..." : "Redefinir"}
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
