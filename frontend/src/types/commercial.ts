export type ProposalStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'accepted' 
  | 'declined' 
  | 'expired';

export interface ProposalItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  total: number;
}

export interface Proposal {
  id: string;
  code: string; // Ex: PROP-2026-089
  title: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone: string;
  sellerName: string;
  sellerId?: string;
  status: ProposalStatus;
  items: ProposalItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: string;
  validUntil: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  notes?: string;
  publicLink?: string;
}

export interface ProposalKPIs {
  totalPipelineValue: number;
  acceptedValue: number;
  totalProposals: number;
  acceptedProposals: number;
  averageTicket: number;
  conversionRate: number;
}

// === METAS (GOALS) ===
export type GoalPeriod = 'monthly' | 'quarterly' | 'yearly';
export type GoalCategory = 'revenue' | 'new_clients' | 'qualified_leads' | 'deals_closed';

export interface CommercialGoal {
  id: string;
  title: string;
  category: GoalCategory;
  period: GoalPeriod;
  targetValue: number;
  currentValue: number;
  unit: 'currency' | 'count' | 'percentage';
  startDate: string;
  endDate: string;
  projectionRate: number; // Run rate calculado
  status: 'on_track' | 'at_risk' | 'achieved' | 'behind';
}

export interface SalesRepRanking {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  achievedValue: number;
  targetValue: number;
  percentAchieved: number;
  dealsCount: number;
  rank: number; // 1, 2, 3...
  badgeTier?: 'gold' | 'silver' | 'bronze' | 'participant';
}

// === ANALYTICS AVANÇADO ===
export interface FunnelStageData {
  stage: string;
  count: number;
  conversionFromPrevious: number; // Ex: 74%
  dropoffRate: number; // Ex: 26%
  averageDurationHours: number;
  color: string;
}

export interface ServiceBottleneckData {
  department: string;
  avgFirstResponseMinutes: number; // FRT
  avgResolutionMinutes: number; // TMA
  slaCompliancePercent: number; // % dentro do SLA
  pendingQueueCount: number;
  status: 'optimal' | 'warning' | 'critical';
}

export interface LeadSourceDistribution {
  name: string;
  leads: number;
  won: number;
  conversionRate: number;
  revenue: number;
  color: string;
}
