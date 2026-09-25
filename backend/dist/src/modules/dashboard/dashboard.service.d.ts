import { PrismaService } from '../../shared/database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    private readonly crmCache;
    constructor(prisma: PrismaService);
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
    getCrmMetrics(tenantId: string): Promise<any>;
}
