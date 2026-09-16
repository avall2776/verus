export interface FunnelStage {
  stage: string;
  name: string;
  count: number;
  conversion: string;
  percent: number;
  dropoff: string;
  dropoffCount: number;
  duration: string;
  fill: string;
  color: string;
}

export interface FunnelData {
  totalLeads: number;
  contractsSigned: number;
  overallConversion: number;
  totalRevenue: number;
  avgTicket: number;
  avgSalesCycleHours: number;
  stages: FunnelStage[];
  benchmarkComparison: {
    industryConversion: number;
    versusConversion: number;
    delta: number;
  };
  isBaseline?: boolean;
}

export interface ChannelStat {
  id: string;
  name: string;
  type: string;
  color: string;
  leadsCount: number;
  dealsCount: number;
  proposalsCount: number;
  contractsSignedCount: number;
  totalRevenue: number;
  conversionRate: number;
  avgTicket: number;
  percentOfTotalRevenue: number;
}

export interface ChannelsResponse {
  channels: ChannelStat[];
  totalLeads: number;
  totalRevenue: number;
  topChannel: string;
  fastestGrowingChannel: string;
  isBaseline?: boolean;
}

export interface DepartmentBottleneck {
  department: string;
  name: string;
  frtMin: number;
  tmaMin: number;
  sla: number;
  queue: number;
  fillFrt: string;
  fillTma: string;
  health: 'good' | 'regular' | 'attention' | 'critical';
}

export interface HourlyBottleneck {
  hour: string;
  frtMin: number;
  tmaMin: number;
  volume: number;
  queue: number;
  bottleneckLevel: 'low' | 'medium' | 'high';
}

export interface BottleneckRecommendation {
  id: string;
  type: 'critical' | 'warning' | 'success';
  title: string;
  description: string;
  impact: string;
}

export interface BottlenecksResponse {
  tmaMinutes: number;
  frtMinutes: number;
  slaCompliancePercent: number;
  criticalBottleneck: string;
  departmentBottlenecks: DepartmentBottleneck[];
  hourlyBottlenecks: HourlyBottleneck[];
  recommendations: BottleneckRecommendation[];
}
