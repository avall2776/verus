export interface MarketingClientAuditItem {
  id: string;
  action: string;
  author: string;
  date: string;
}

export interface MarketingClientDeliverables {
  posts?: number;
  reels?: number;
  stories?: number;
  campaigns?: number;
  // Campos cadastrais corporativos padrão
  cnpj?: string;
  corporateName?: string;
  segment?: string;
  city?: string;
  state?: string;
  address?: string;
  contactRole?: string;
  briefing?: string;
  scope?: string;
  brandGuidelines?: string;
  materialsUrl?: string;
  contractValue?: number;
  contractStartDate?: string;
  contractDurationMonths?: number;
  aiGuidelines?: string;
  notes?: string;
  history?: MarketingClientAuditItem[];
  [key: string]: any;
}

export interface MarketingClientItem {
  id: string;
  name: string;
  brandColor: string;
  logoUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  planTier: string;
  monthlyDeliverables: MarketingClientDeliverables;
  adBudget?: number;
  assignedUserId?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'CHURNED' | 'FECHADO' | string;
  createdAt?: string;
  updatedAt?: string;
  cards?: MarketingCardItem[];
  metrics?: {
    totalCards: number;
    totalCampaigns: number;
    deliveredMonthCount: number;
    postsProgress: { delivered: number; target: number };
    reelsProgress: { delivered: number; target: number };
  };
}

export interface MarketingChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MarketingCardItem {
  id: string;
  tenantId?: string;
  marketingClientId: string;
  title: string;
  description?: string | null;
  format: 'REELS' | 'CARROSSEL' | 'POST' | 'CAMPANHA' | 'STORIES' | 'OUTRO' | string;
  status: 'BACKLOG' | 'PLANEJAMENTO' | 'DESIGN_VIDEO' | 'REVISAO_INTERNA' | 'APROVACAO_CLIENTE' | 'AGENDADO_POSTADO' | string;
  position: number;
  dueDate?: string | null;
  publishDate?: string | null;
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE' | string;
  assignedUserId?: string | null;
  checklist?: MarketingChecklistItem[];
  attachments?: Array<{ id: string; name: string; url?: string; type?: string; size?: string; date?: string }>;
  timeline?: Array<{
    id: string;
    type: string;
    title: string;
    stage?: string;
    author: string;
    date: string;
  }>;
  value?: number;
  marketingClient?: {
    id: string;
    name: string;
    brandColor: string;
    logoUrl?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    planTier?: string;
    adBudget?: number;
  };
  assignedUser?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    email?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingCampaignItem {
  id: string;
  tenantId?: string;
  marketingClientId: string;
  name: string;
  platform: 'META_ADS' | 'GOOGLE_ADS' | 'TIKTOK_ADS' | 'LINKEDIN_ADS';
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'ENDED';
  objective: 'LEADS' | 'VENDAS' | 'RECONHECIMENTO' | 'TRAFEGO';
  budgetDaily?: number;
  budgetTotal?: number;
  spentAmount?: number;
  leadsGenerated?: number;
  cpl?: number;
  roas?: number;
  startDate?: string | null;
  endDate?: string | null;
  targetAudience?: string | null;
  campaignUrl?: string | null;
  marketingClient?: {
    id: string;
    name: string;
    brandColor: string;
    logoUrl?: string | null;
  };
  createdAt?: string;
}

export interface TimeClockStatus {
  currentState: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  lastAction: {
    type: string;
    timestamp: string;
    sessionHash: string;
  } | null;
  activeMinutes: number;
  activeHoursFormatted: string;
  todayLogs: Array<{
    id: string;
    type: string;
    timestamp: string;
    sessionHash: string;
    ipAddress?: string;
    notes?: string;
  }>;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  canAccessMarketing?: boolean;
}
