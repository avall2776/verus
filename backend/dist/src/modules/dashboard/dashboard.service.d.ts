import { PrismaService } from '../../shared/database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMetrics(tenantId: string): Promise<{
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
}
