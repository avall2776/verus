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
}
