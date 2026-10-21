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
  Bot,
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
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/ThemeContext";

export interface UserMenuPermissions {
  whatsapp: boolean;
  chat: boolean;
  agenda: boolean;
  contacts: boolean;
  dashboard: boolean;
  chatbots: boolean;
  departments: boolean;
  users: boolean;
  connections: boolean;
  settings: boolean;
  my_account: boolean;
  ai_agents: boolean;
  integrations: boolean;
  billing: boolean;
  webhooks: boolean;
}

export interface UserSubPermissions {
  crm_enabled: boolean;
  crm_create_funnels: boolean;
  crm_delete_deals: boolean;
  crm_only_own_deals: boolean;
  agenda_enabled: boolean;
  analytics_enabled: boolean;
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
  chat: true,
  agenda: true,
  contacts: true,
  dashboard: true,
  chatbots: true,
  departments: true,
  users: true,
  connections: true,
  settings: true,
  my_account: true,
  ai_agents: true,
  integrations: true,
  billing: true,
  webhooks: true,
};

export const DEFAULT_ADMIN_SUB_PERMS: UserSubPermissions = {
  crm_enabled: true,
  crm_create_funnels: true,
  crm_delete_deals: true,
  crm_only_own_deals: false,
  agenda_enabled: true,
  analytics_enabled: true,
};

export const DEFAULT_SUPERVISOR_MENUS: UserMenuPermissions = {
  whatsapp: true,
  chat: true,
  agenda: true,
  contacts: true,
  dashboard: true,
  chatbots: false,
  departments: true,
  users: false,
  connections: false,
  settings: false,
  my_account: true,
  ai_agents: true,
  integrations: false,
  billing: false,
  webhooks: false,
};

export const DEFAULT_SUPERVISOR_SUB_PERMS: UserSubPermissions = {
  crm_enabled: true,
  crm_create_funnels: true,
  crm_delete_deals: false,
  crm_only_own_deals: false,
  agenda_enabled: true,
  analytics_enabled: true,
};

export const DEFAULT_COLLABORATOR_MENUS: UserMenuPermissions = {
  whatsapp: true,
  chat: true,
  agenda: true,
  contacts: false,
  dashboard: false,
  chatbots: false,
  departments: false,
  users: false,
  connections: false,
  settings: false,
  my_account: true,
  ai_agents: false,
  integrations: false,
  billing: false,
  webhooks: false,
};

export const DEFAULT_COLLABORATOR_SUB_PERMS: UserSubPermissions = {
  crm_enabled: true,
  crm_create_funnels: false,
  crm_delete_deals: false,
  crm_only_own_deals: true,
  agenda_enabled: true,
  analytics_enabled: false,
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

const MENU_CONFIGS: {
  key: keyof UserMenuPermissions;
  label: string;
  tooltip: string;
  icon: React.ElementType;
}[] = [
  { key: "whatsapp", label: "WhatsApp", tooltip: "Acesso ao Inbox ao vivo, conversas e filas", icon: MessageSquare },
  { key: "chat", label: "Chat Interno", tooltip: "Comunicação interna em tempo real entre a equipe", icon: MessagesSquare },
  { key: "agenda", label: "Lero Cal / Agenda", tooltip: "Agendamentos, calendário e compromissos", icon: Calendar },
  { key: "contacts", label: "Carteira de Atendimento", tooltip: "Gestão completa de leads e contatos", icon: BookUser },
  { key: "dashboard", label: "Dashboard", tooltip: "Painéis analíticos, metas e produtividade", icon: LayoutDashboard },
  { key: "chatbots", label: "Chatbots", tooltip: "Fluxos interativos e triagem automática", icon: Bot },
  { key: "departments", label: "Setores", tooltip: "Configuração de departamentos e filas", icon: Network },
  { key: "users", label: "Usuários", tooltip: "Gestão de equipe e níveis de acesso", icon: Users },
  { key: "connections", label: "Conexão", tooltip: "Status e pareamento das instâncias de WhatsApp", icon: Wifi },
  { key: "settings", label: "Configurações", tooltip: "Parâmetros gerais do sistema e empresa", icon: Settings },
  { key: "my_account", label: "Minha Conta", tooltip: "Perfil pessoal, senha e preferências", icon: User },
  { key: "ai_agents", label: "Agentes de IA", tooltip: "Configurações da Sofia e inteligência artificial", icon: Sparkles },
  { key: "integrations", label: "Integrações", tooltip: "Conectores externos, CRMs e webhooks", icon: Workflow },
  { key: "billing", label: "Minha Assinatura", tooltip: "Gestão de planos, limites e faturas", icon: CreditCard },
  { key: "webhooks", label: "APIs & Webhooks", tooltip: "Tokens de API e eventos HTTP", icon: Zap },
];

export default function UsersSettingsTab() {
  const { theme, isClean, isDark, isWhatsApp } = useTheme();

  // Tokens de Cores Adaptativos (Clean, Dark, WhatsApp)
  const th = {
    containerText: isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-slate-100",
    pageTitle: isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white",
    pageSubtitle: isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400",
    userCountBadge: isClean
      ? "bg-slate-100 border-slate-200 text-slate-700"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#8696A0]"
      : "bg-slate-900/40 border-slate-800 text-slate-400",
    primaryBtn: isClean
      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
      : isWhatsApp
      ? "bg-[#00A884] hover:bg-[#02906F] text-white shadow-[0_0_15px_rgba(0,168,132,0.3)]"
      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    card: isClean
      ? "bg-white border-slate-200/90 shadow-sm"
      : isWhatsApp
      ? "bg-[#111B21] border-[#222D34] shadow-xl"
      : "bg-[#111722] border-slate-800/80 shadow-2xl",
    input: isClean
      ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
      : "bg-[#18202f] border-slate-700/60 text-white placeholder:text-slate-500 focus:border-emerald-500/60",
    tableWrap: isClean
      ? "bg-white border-slate-200"
      : isWhatsApp
      ? "bg-[#111B21] border-[#222D34]"
      : "bg-[#141b27] border-slate-800/80",
    tableHead: isClean
      ? "bg-slate-50 text-slate-600 border-slate-200 font-bold"
      : isWhatsApp
      ? "bg-[#202C33] text-[#8696A0] border-[#222D34]"
      : "bg-[#0e1422] text-slate-400 border-slate-800",
    tableDivider: isClean
      ? "divide-slate-100"
      : isWhatsApp
      ? "divide-[#222D34]"
      : "divide-slate-800/60",
    tableRowHover: isClean
      ? "hover:bg-slate-50/80"
      : isWhatsApp
      ? "hover:bg-[#182229]"
      : "hover:bg-[#182232]/50",
    tableRowSelected: isClean
      ? "bg-emerald-50/60"
      : isWhatsApp
      ? "bg-[#103629]/40"
      : "bg-emerald-500/5",
    userName: isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white",
    userEmail: isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400",
    badgeAdmin: isClean
      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
      : isWhatsApp
      ? "bg-[#103629] text-[#00A884] border-[#00A884]/40 font-semibold"
      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-semibold",
    badgeSupervisor: isClean
      ? "bg-cyan-50 text-cyan-800 border-cyan-300 font-bold"
      : isWhatsApp
      ? "bg-[#0e2a3b] text-[#34b7f1] border-[#34b7f1]/40 font-semibold"
      : "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-semibold",
    badgeCollaborator: isClean
      ? "bg-slate-100 text-slate-700 border-slate-300 font-medium"
      : isWhatsApp
      ? "bg-[#202C33] text-[#8696A0] border-[#2A3942] font-medium"
      : "bg-slate-800/90 text-slate-300 border-slate-700 font-medium",
    badgeActive: isClean
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
      : isWhatsApp
      ? "bg-[#103629] text-[#00A884] border-[#00A884]/30 font-semibold"
      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold",
    badgeInactive: isClean
      ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
      : isWhatsApp
      ? "bg-[#33181c] text-[#f15c6d] border-[#f15c6d]/30 font-semibold"
      : "bg-rose-500/10 text-rose-400 border-rose-500/20 font-semibold",
    sectorChip: isClean
      ? "bg-slate-100 border-slate-200 text-slate-700 font-medium"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] font-medium"
      : "bg-[#1a2334] border-slate-700/80 text-slate-300 font-medium",
    workspacePill: isClean
      ? "bg-slate-100 border-slate-200 text-slate-700 font-medium"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] font-medium"
      : "bg-[#1a2334] border-slate-700/80 text-slate-300 font-medium",
    actionMenu: isClean
      ? "bg-white border-slate-200 text-slate-800 shadow-xl"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] shadow-2xl"
      : "bg-[#141b27] border-slate-700/80 text-slate-200 shadow-2xl",
    actionMenuItem: isClean
      ? "hover:bg-slate-100 hover:text-slate-900 text-slate-700"
      : isWhatsApp
      ? "hover:bg-[#111B21] hover:text-white text-[#E9EDEF]"
      : "hover:bg-slate-800/80 hover:text-white text-slate-200",
    modalCard: isClean
      ? "bg-white border-slate-200 text-slate-900 shadow-2xl"
      : isWhatsApp
      ? "bg-[#111B21] border-[#222D34] text-[#E9EDEF] shadow-2xl"
      : "bg-[#161c28] border-slate-700 text-white shadow-2xl",
    modalBorder: isClean ? "border-slate-200" : isWhatsApp ? "border-[#222D34]" : "border-slate-800",
    modalInput: isClean
      ? "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
      : "bg-[#1c2434] border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500",
    modalSubBox: isClean
      ? "bg-slate-50 border-slate-200 text-slate-800"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF]"
      : "bg-[#1a2232] border-slate-700/80 text-slate-200",
    modalSecondaryBtn: isClean
      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
      : isWhatsApp
      ? "bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] font-semibold"
      : "bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold",
    permTileChecked: isClean
      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-xs"
      : isWhatsApp
      ? "bg-[#103629] border-[#00A884] text-[#00A884] font-medium"
      : "bg-[#1c2434] border-emerald-500/50 text-white font-medium",
    permTileUnchecked: isClean
      ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:bg-[#182229]"
      : "bg-[#141a26] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700",
    subPermBox: isClean
      ? "bg-slate-50 border-slate-200 text-slate-800"
      : isWhatsApp
      ? "bg-[#202C33] border-[#2A3942] text-[#E9EDEF]"
      : "bg-[#141a26] border-slate-800 text-white",
  };

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
          automations: defaultMenus.chatbots || defaultMenus.ai_agents,
          settings: defaultMenus.settings,
          support: true,
          marketing: defaultMenus.contacts,
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

  // Abrir Modal de Permissões de Acesso (Padrão Lero)
  const handleOpenPerms = (u: UserItem) => {
    setPermsUser(u);
    const roleLabel = getRoleLabel(u.role);

    // Carregar menus e sub-permissões do usuário ou aplicar padrão do perfil
    const existing = u.permissions || {};
    let menus: UserMenuPermissions;
    let sub: UserSubPermissions;

    if (existing.menus) {
      menus = { ...existing.menus };
    } else if (roleLabel === "Administrador") {
      menus = { ...DEFAULT_ADMIN_MENUS };
    } else if (roleLabel === "Supervisor") {
      menus = { ...DEFAULT_SUPERVISOR_MENUS };
    } else {
      menus = { ...DEFAULT_COLLABORATOR_MENUS };
      if (existing.inbox !== undefined) menus.whatsapp = existing.inbox;
      if (existing.chat !== undefined) menus.chat = existing.chat;
      if (existing.settings !== undefined) menus.settings = existing.settings;
    }

    if (existing.subPermissions) {
      sub = { ...existing.subPermissions };
    } else if (roleLabel === "Administrador") {
      sub = { ...DEFAULT_ADMIN_SUB_PERMS };
    } else if (roleLabel === "Supervisor") {
      sub = { ...DEFAULT_SUPERVISOR_SUB_PERMS };
    } else {
      sub = { ...DEFAULT_COLLABORATOR_SUB_PERMS };
      if (existing.crm !== undefined) sub.crm_enabled = existing.crm;
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
        automations: activeMenus.chatbots || activeMenus.ai_agents,
        settings: activeMenus.settings,
        support: true,
        marketing: activeMenus.contacts,
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
    <div className={`space-y-5 animate-in fade-in duration-200 ${th.containerText}`}>
      {/* 1. CABEÇALHO SUPERIOR (PADRÃO LERO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl tracking-tight flex items-center gap-2 ${th.pageTitle}`}>
            Gestão de Usuários
          </h1>
          <p className={`text-xs mt-0.5 ${th.pageSubtitle}`}>
            Gerencie os colaboradores da sua conta
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border ${th.userCountBadge}`}
            title={`Limite da sua conta: ${maxUsers} usuários simultâneos`}
          >
            <span>{users.length} / {maxUsers} usuários</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>

          <button
            onClick={handleOpenInvite}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${th.primaryBtn}`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Convidar Colaborador</span>
          </button>
        </div>
      </div>

      {/* 2. CARD PRINCIPAL DA TABELA (PADRÃO LERO EXPANDIDO) */}
      <div className={`rounded-2xl border p-4 space-y-4 ${th.card}`}>
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none transition-colors ${th.input}`}
            />
          </div>

          {/* Filtro de Ambiente */}
          <div className="relative">
            <select
              value={filterEnvironment}
              onChange={(e) => setFilterEnvironment(e.target.value)}
              className={`appearance-none px-3.5 py-2 pr-8 rounded-xl border text-xs font-medium outline-none cursor-pointer ${th.input}`}
            >
              <option value="all">Todos os ambientes</option>
              <option value="workspace-1">Workspace 1</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro de Tipo de Usuário */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`appearance-none px-3.5 py-2 pr-8 rounded-xl border text-xs font-medium outline-none cursor-pointer ${th.input}`}
            >
              <option value="all">Todos os tipos</option>
              <option value="administrador">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="colaborador">Colaborador</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro de Setor */}
          <div className="relative">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className={`appearance-none px-3.5 py-2 pr-8 rounded-xl border text-xs font-medium outline-none cursor-pointer ${th.input}`}
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
        <div className={`overflow-x-auto rounded-xl border ${th.tableWrap}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${th.tableHead}`}>
                <th className="py-3 px-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="cursor-pointer text-slate-400 hover:text-emerald-500"
                  >
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
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
            <tbody className={`divide-y text-xs ${th.tableDivider}`}>
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
                      className={`transition-colors ${isSelected ? th.tableRowSelected : th.tableRowHover}`}
                    >
                      {/* Checkbox de Seleção */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectUser(u.id)}
                          className="cursor-pointer text-slate-400 hover:text-emerald-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
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
                                ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                                : "bg-slate-400"
                            }`}
                            title={u.isOnline ? "Online" : "Offline"}
                          />

                          {/* Avatar com badge de proprietário se aplicável */}
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 overflow-hidden relative shadow-inner">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.name?.charAt(0).toUpperCase() || "U"}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className={`font-bold truncate max-w-[180px] flex items-center gap-1.5 ${th.userName}`}>
                              <span>{u.name}</span>
                              {isOwner && (
                                <span title="Proprietário da Conta">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className={`text-[11px] font-mono truncate max-w-[180px] ${th.userEmail}`}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo / Cargo (Administrador, Supervisor, Colaborador) */}
                      <td className="py-3 px-3">
                        {roleLabel === "Administrador" ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${th.badgeAdmin}`}>
                            Administrador
                          </span>
                        ) : roleLabel === "Supervisor" ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${th.badgeSupervisor}`}>
                            Supervisor
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${th.badgeCollaborator}`}>
                            Colaborador
                          </span>
                        )}
                      </td>

                      {/* Setores Vinculados (Badges Padrão Lero) */}
                      <td className="py-3 px-3">
                        {roleLabel === "Administrador" ? (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Acesso total
                          </span>
                        ) : u.departments && u.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {u.departments.map((rel) => (
                              <span
                                key={rel.departmentId}
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border ${th.sectorChip}`}
                              >
                                {rel.department?.name || "Setor"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Nenhum setor
                          </span>
                        )}
                      </td>

                      {/* Ambiente de Trabalho */}
                      <td className="py-3 px-3">
                        {roleLabel === "Administrador" ? (
                          <span className={`text-xs font-medium ${th.userEmail}`}>Todos</span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border ${th.workspacePill}`}>
                            Workspace 1
                          </span>
                        )}
                      </td>

                      {/* Status (Ativo / Inativo) */}
                      <td className="py-3 px-3">
                        {u.isActive !== false ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${th.badgeActive}`}>
                            Ativo
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${th.badgeInactive}`}>
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Convite */}
                      <td className={`py-3 px-3 text-[11px] font-mono ${th.userEmail}`}>
                        {isOwner ? (
                          <span>—</span>
                        ) : u.createdAt ? (
                          <span>Aceito: {new Date(u.createdAt).toLocaleDateString("pt-BR")}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Ações (Dropdown Três Pontos) */}
                      <td className="py-3 px-3 text-center relative">
                        {isOwner ? (
                          <span className="text-[11px] text-slate-400 font-semibold italic">
                            Proprietário
                          </span>
                        ) : (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === u.id ? null : u.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Mais opções"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === u.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 top-8 z-30 w-52 rounded-xl border p-1 text-left animate-in fade-in zoom-in-95 duration-150 ${th.actionMenu}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenEdit(u);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${th.actionMenuItem}`}
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
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${th.actionMenuItem}`}
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
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${th.actionMenuItem}`}
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
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${th.actionMenuItem}`}
                                >
                                  <Power className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{u.isActive !== false ? "Inativar" : "Ativar"}</span>
                                </button>

                                <div className={`my-1 border-t ${th.modalBorder}`} />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleDeleteUser(u);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remover Colaborador</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg border rounded-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto ${th.modalCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className={`flex items-center justify-between pb-2 border-b ${th.modalBorder}`}>
              <div>
                <h3 className={`text-base font-bold ${th.userName}`}>
                  {isInviteMode ? "Convidar Colaborador" : "Editar Colaborador"}
                </h3>
                <p className={`text-xs mt-0.5 ${th.userEmail}`}>
                  {isInviteMode
                    ? "Envie um convite para um novo membro da equipe"
                    : "Atualize as informações do colaborador"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="space-y-4">
              {/* Campo: Nome */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-200'}`}>Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Felipe Costa"
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${th.modalInput}`}
                  required
                />
              </div>

              {/* Campo: Email */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-200'}`}>Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="comercial@suaempresa.com"
                  disabled={!isInviteMode}
                  className={`w-full p-2.5 text-xs rounded-xl border outline-none ${
                    isInviteMode
                      ? th.modalInput
                      : isClean
                      ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                      : isWhatsApp
                      ? "bg-[#182229] border-[#222D34] text-[#8696A0] cursor-not-allowed"
                      : "bg-[#141a26] border-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                  required
                />
              </div>

              {/* Campo: Senha Provisória (apenas no convite) */}
              {isInviteMode && (
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-200'}`}>Senha Provisória (Opcional)</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Padrão: Versus@123"
                    className={`w-full p-2.5 text-xs rounded-xl border outline-none ${th.modalInput}`}
                  />
                  <span className={`text-[10px] ${th.userEmail}`}>
                    Deixe em branco para usar a senha padrão segura (Versus@123).
                  </span>
                </div>
              )}

              {/* Campo: Tipo (Dropdown) */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-200'}`}>Tipo</label>
                <div className="relative">
                  <select
                    value={formRole}
                    onChange={(e) =>
                      setFormRole(e.target.value as "Administrador" | "Supervisor" | "Colaborador")
                    }
                    className={`w-full appearance-none p-2.5 pr-8 text-xs rounded-xl border outline-none cursor-pointer ${th.modalInput}`}
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
                <label className={`text-xs font-semibold ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-200'}`}>Ambiente(s) de trabalho *</label>
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${th.modalSubBox}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Workspace 1 <span className={th.userEmail}>(Padrão)</span></span>
                </div>
              </div>

              {/* Campo: Setores (Scrollable Checklist com Checkmarks Verde Padrão Lero) */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#E9EDEF]' : 'text-slate-200'}`}>Setores</label>
                <div className={`p-3 rounded-xl border space-y-2 ${th.modalSubBox}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${th.userEmail}`}>
                    Workspace 1
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {availableDepartments.length === 0 ? (
                      <p className={`text-xs italic py-2 ${th.userEmail}`}>
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
                                ? isClean
                                  ? "bg-emerald-50 text-emerald-900 font-semibold"
                                  : isWhatsApp
                                  ? "bg-[#103629] text-[#00A884]"
                                  : "bg-emerald-500/10 text-white"
                                : isClean
                                ? "text-slate-700 hover:bg-slate-100"
                                : isWhatsApp
                                ? "text-[#8696A0] hover:bg-[#182229]"
                                : "text-slate-300 hover:bg-slate-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? isClean
                                      ? "bg-emerald-600 text-white"
                                      : isWhatsApp
                                      ? "bg-[#00A884] text-white"
                                      : "bg-emerald-500 text-slate-950"
                                    : isClean
                                    ? "border border-slate-400 bg-transparent"
                                    : isWhatsApp
                                    ? "border border-[#8696A0] bg-transparent"
                                    : "border border-slate-600 bg-transparent"
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
              <div className={`pt-3 flex justify-end gap-2 border-t ${th.modalBorder}`}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer ${th.modalSecondaryBtn}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingUserForm}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer ${th.primaryBtn}`}
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
      )}

      {/* 4. MODAL: PERMISSÕES DE ACESSO (EXATA PARIDADE COM SCREENSHOT 3 DO LERO) */}
      {isPermsModalOpen && permsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-4xl border rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${th.modalCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal */}
            <div className={`flex items-center justify-between pb-3 border-b ${th.modalBorder}`}>
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${th.userName}`}>
                  Permissões de Acesso
                </h3>
                <p className={`text-xs mt-0.5 ${th.userEmail}`}>
                  <strong className={th.userName}>{permsUser.name}</strong> · {permsUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPermsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* SEÇÃO 1: MENUS (GRID 3 COLUNAS - PADRÃO LERO) */}
              <div className="space-y-2.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#8696A0]' : 'text-slate-300'}`}>
                  Menus
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {MENU_CONFIGS.map((menu) => {
                    const isChecked = Boolean(activeMenus[menu.key]);
                    const Icon = menu.icon;

                    return (
                      <div
                        key={menu.key}
                        onClick={() =>
                          setActiveMenus((prev) => ({
                            ...prev,
                            [menu.key]: !prev[menu.key],
                          }))
                        }
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all select-none ${
                          isChecked ? th.permTileChecked : th.permTileUnchecked
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Circular Checkbox Verde Padrão Lero */}
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isChecked
                                ? isClean
                                  ? "bg-emerald-600 text-white"
                                  : isWhatsApp
                                  ? "bg-[#00A884] text-white"
                                  : "bg-emerald-500 text-slate-950"
                                : isClean
                                ? "border border-slate-400 bg-transparent"
                                : isWhatsApp
                                ? "border border-[#8696A0] bg-transparent"
                                : "border border-slate-600 bg-transparent"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>

                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? (isClean ? 'text-emerald-700' : isWhatsApp ? 'text-[#00A884]' : 'text-emerald-400') : 'text-slate-400'}`} />
                          <span className="text-xs truncate">{menu.label}</span>
                        </div>

                        <span title={menu.tooltip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO 2: MÓDULOS COM SUB-PERMISSÕES (PADRÃO LERO) */}
              <div className={`space-y-3 pt-4 border-t ${th.modalBorder}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isClean ? 'text-slate-700' : isWhatsApp ? 'text-[#8696A0]' : 'text-slate-300'}`}>
                  Módulos com sub-permissões
                </h4>

                {/* Sub-permissão: CRM */}
                <div className={`p-4 rounded-xl border space-y-3.5 ${th.subPermBox}`}>
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
                          ? isClean
                            ? "bg-emerald-600 text-white"
                            : isWhatsApp
                            ? "bg-[#00A884] text-white"
                            : "bg-emerald-500 text-slate-950"
                          : isClean
                          ? "border border-slate-400 bg-transparent"
                          : isWhatsApp
                          ? "border border-[#8696A0] bg-transparent"
                          : "border border-slate-600 bg-transparent"
                      }`}
                    >
                      {activeSubPerms.crm_enabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <Kanban className="w-4 h-4 text-emerald-500" />
                    <span className={`text-xs font-bold ${th.userName}`}>CRM</span>
                  </div>

                  {activeSubPerms.crm_enabled && (
                    <div className={`pl-6 space-y-2 border-l ml-2 animate-in fade-in duration-150 ${isClean ? 'border-slate-200' : isWhatsApp ? 'border-[#222D34]' : 'border-slate-800'}`}>
                      <div
                        onClick={() =>
                          setActiveSubPerms((prev) => ({
                            ...prev,
                            crm_create_funnels: !prev.crm_create_funnels,
                          }))
                        }
                        className={`flex items-center justify-between cursor-pointer select-none text-xs transition-colors ${
                          isClean ? 'text-slate-700 hover:text-slate-950' : isWhatsApp ? 'text-[#E9EDEF] hover:text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              activeSubPerms.crm_create_funnels
                                ? isClean
                                  ? "bg-emerald-600 text-white"
                                  : isWhatsApp
                                  ? "bg-[#00A884] text-white"
                                  : "bg-emerald-500 text-slate-950"
                                : isClean
                                ? "border border-slate-400 bg-transparent"
                                : isWhatsApp
                                ? "border border-[#8696A0] bg-transparent"
                                : "border border-slate-600 bg-transparent"
                            }`}
                          >
                            {activeSubPerms.crm_create_funnels && (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            )}
                          </span>
                          <span>+ Criar Funis</span>
                        </div>
                        <span title="Permite criar novos funis e pipelines no CRM">
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
                        className={`flex items-center justify-between cursor-pointer select-none text-xs transition-colors ${
                          isClean ? 'text-slate-700 hover:text-slate-950' : isWhatsApp ? 'text-[#E9EDEF] hover:text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              activeSubPerms.crm_delete_deals
                                ? isClean
                                  ? "bg-emerald-600 text-white"
                                  : isWhatsApp
                                  ? "bg-[#00A884] text-white"
                                  : "bg-emerald-500 text-slate-950"
                                : isClean
                                ? "border border-slate-400 bg-transparent"
                                : isWhatsApp
                                ? "border border-[#8696A0] bg-transparent"
                                : "border border-slate-600 bg-transparent"
                            }`}
                          >
                            {activeSubPerms.crm_delete_deals && (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            )}
                          </span>
                          <span>Excluir Oportunidades</span>
                        </div>
                        <span title="Permite excluir permanentemente cards de negociação">
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
                        className={`flex items-center justify-between cursor-pointer select-none text-xs transition-colors ${
                          isClean ? 'text-slate-700 hover:text-slate-950' : isWhatsApp ? 'text-[#E9EDEF] hover:text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                              activeSubPerms.crm_only_own_deals
                                ? isClean
                                  ? "bg-emerald-600 text-white"
                                  : isWhatsApp
                                  ? "bg-[#00A884] text-white"
                                  : "bg-emerald-500 text-slate-950"
                                : isClean
                                ? "border border-slate-400 bg-transparent"
                                : isWhatsApp
                                ? "border border-[#8696A0] bg-transparent"
                                : "border border-slate-600 bg-transparent"
                            }`}
                          >
                            {activeSubPerms.crm_only_own_deals && (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            )}
                          </span>
                          <span>Ver Apenas Próprias Oportunidades</span>
                        </div>
                        <span title="Restringe a visão do operador aos leads em que ele é responsável">
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-permissão: Agenda */}
                <div
                  onClick={() =>
                    setActiveSubPerms((prev) => ({
                      ...prev,
                      agenda_enabled: !prev.agenda_enabled,
                    }))
                  }
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer select-none ${th.subPermBox}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        activeSubPerms.agenda_enabled
                          ? isClean
                            ? "bg-emerald-600 text-white"
                            : isWhatsApp
                            ? "bg-[#00A884] text-white"
                            : "bg-emerald-500 text-slate-950"
                          : isClean
                          ? "border border-slate-400 bg-transparent"
                          : isWhatsApp
                          ? "border border-[#8696A0] bg-transparent"
                          : "border border-slate-600 bg-transparent"
                      }`}
                    >
                      {activeSubPerms.agenda_enabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className={`text-xs font-bold ${th.userName}`}>Agenda</span>
                  </div>
                  <span title="Permite criar reuniões e gerenciar disponibilidade">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>

                {/* Sub-permissão: Análises */}
                <div
                  onClick={() =>
                    setActiveSubPerms((prev) => ({
                      ...prev,
                      analytics_enabled: !prev.analytics_enabled,
                    }))
                  }
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer select-none ${th.subPermBox}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        activeSubPerms.analytics_enabled
                          ? isClean
                            ? "bg-emerald-600 text-white"
                            : isWhatsApp
                            ? "bg-[#00A884] text-white"
                            : "bg-emerald-500 text-slate-950"
                          : isClean
                          ? "border border-slate-400 bg-transparent"
                          : isWhatsApp
                          ? "border border-[#8696A0] bg-transparent"
                          : "border border-slate-600 bg-transparent"
                      }`}
                    >
                      {activeSubPerms.analytics_enabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                    <span className={`text-xs font-bold ${th.userName}`}>Análises</span>
                  </div>
                  <span title="Acesso a relatórios de conversão e tempos de atendimento">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal de Permissões */}
            <div className={`pt-3 flex justify-end gap-2 border-t ${th.modalBorder}`}>
              <button
                type="button"
                onClick={() => setIsPermsModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer ${th.modalSecondaryBtn}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePerms}
                disabled={submittingPerms}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer ${th.primaryBtn}`}
              >
                {submittingPerms ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Permissões...</span>
                  </>
                ) : (
                  <span>Salvar Permissões</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: REDEFINIR SENHA */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm border rounded-2xl p-6 space-y-4 ${th.modalCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${th.modalBorder}`}>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className={`text-sm font-bold ${th.userName}`}>Redefinir Senha</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${th.userEmail}`}>
              Defina a nova senha para <strong className={th.userName}>{passwordUserName}</strong>:
            </p>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mínimo 6 caracteres)"
                className={`w-full p-2.5 text-xs rounded-xl border outline-none ${th.modalInput}`}
                required
                autoFocus
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${th.modalSecondaryBtn}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${th.primaryBtn}`}
                >
                  {submittingPassword ? "Salvando..." : "Redefinir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
