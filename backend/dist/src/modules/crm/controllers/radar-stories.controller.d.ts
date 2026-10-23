import { RadarStoriesService } from '../services/radar-stories.service';
export declare class RadarStoriesController {
    private readonly radarStoriesService;
    constructor(radarStoriesService: RadarStoriesService);
    getMetrics(tenantId: string): Promise<{
        kpis: {
            totalViewsToday: number;
            totalViewsWeek: number;
            producersTracked: number;
            inactiveReheated: number;
            hotOpportunities: number;
            conversionRatePercent: number;
        };
        chartData: {
            date: string;
            Maquinarios: number;
            Insumos: number;
            Cotacoes: number;
            Pecas: number;
            total: number;
        }[];
        categoryDistribution: {
            name: string;
            value: number;
            percentage: number;
        }[];
    }>;
    getViewers(tenantId: string, status?: string, category?: string, search?: string): Promise<import("../services/radar-stories.service").StoryViewerItem[]>;
    generateApproach(tenantId: string, body: {
        contactId: string;
        producerName: string;
        companyOrFarm?: string;
        city?: string;
        state?: string;
        crmStatus: string;
        lastPurchaseInfo?: string;
        statusTitle: string;
        statusCategory: string;
        viewsCountWeek?: number;
    }): Promise<{
        success: boolean;
        modelUsed: string;
        data: {
            casualMessage: any;
            strategicReasoning: any;
            suggestedTiming: any;
            suggestedProduct: any;
        };
    }>;
}
