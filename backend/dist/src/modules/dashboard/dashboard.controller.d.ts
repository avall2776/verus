import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardData(tenantId: string): Promise<{
        kpis: {
            totalLeadsToday: number;
            qualRate: number;
            waitingHuman: number;
            pipelineRevenue: number;
        };
        recentLeads: {
            id: string;
            name: string;
            source: string;
            temp: string;
            time: string;
            value: string;
        }[];
        chartData: number[];
    }>;
    getAtendimentoMetrics(tenantId: string): Promise<{
        tma: string;
        tmr: string;
        totalConversations: number;
        resolvedConversations: number;
        weeklyVolume: {
            name: string;
            volume: number;
        }[];
        operators: {
            id: string;
            name: string;
            resolved: number;
        }[];
    }>;
    getCrmMetrics(tenantId: string): Promise<{
        totalRevenue: number;
        wonRevenue: number;
        lostRevenue: number;
        wonCount: number;
        lostCount: number;
        openCount: number;
        winRate: number;
        weeklyComparison: {
            name: string;
            ganho: number;
            perdido: number;
        }[];
        funnelData: {
            name: string;
            value: number;
        }[];
    }>;
}
