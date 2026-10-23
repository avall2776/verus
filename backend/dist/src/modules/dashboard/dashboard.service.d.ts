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
    getGeoMapData(tenantId: string): Promise<{
        summary: {
            totalSalesCount: number;
            totalRevenue: number;
            totalInAttendance: number;
            totalCitiesMapped: number;
            activeLiveAttendances: number;
            conversionRate: number;
            topRegion: string;
        };
        regions: {
            name: string;
            salesCount: number;
            salesVolume: number;
            inAttendanceCount: number;
            percentage: number;
            assignedSellers: string[];
        }[];
        sellers: {
            id: string;
            name: string;
            region: string;
            salesCount: number;
            salesVolume: number;
            activeDeals: number;
        }[];
        points: {
            id: string;
            cityName: string;
            state: string;
            region: string;
            lat: number;
            lng: number;
            status: "closed" | "in_attendance" | "unexplored";
            salesCount: number;
            salesVolume: number;
            inAttendanceCount: number;
            isLiveNow: boolean;
            assignedSellers: string[];
            trafficSource: {
                paid: number;
                organic: number;
            };
            recentDeals: any[];
        }[];
    }>;
}
