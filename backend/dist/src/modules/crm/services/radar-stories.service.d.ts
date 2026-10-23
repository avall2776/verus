import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
export interface StoryViewerItem {
    id: string;
    contactId: string;
    name: string;
    companyOrFarm: string;
    phone: string;
    city: string;
    state: string;
    crmStatus: 'active_client' | 'inactive_client' | 'open_deal' | 'prospect';
    crmStatusLabel: string;
    totalPurchased: number;
    lastPurchaseDate?: string;
    daysInactive: number;
    assignedSeller: string;
    storyMedia: {
        id: string;
        title: string;
        category: 'Maquinários' | 'Insumos' | 'Cotações' | 'Peças & Serviços';
        viewedAt: string;
        viewsCountWeek: number;
        interestLevel: 'Alta Frequência' | 'Frequência Moderada' | 'Visualização Recente';
        thumbnailUrl?: string;
    };
}
export declare class RadarStoriesService {
    private readonly prisma;
    private readonly aiService;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService);
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
    getViewers(tenantId: string, filter?: {
        status?: string;
        category?: string;
        search?: string;
    }): Promise<StoryViewerItem[]>;
    generateApproach(tenantId: string, payload: {
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
