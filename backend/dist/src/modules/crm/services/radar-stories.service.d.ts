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
    hasRealView: boolean;
    storyMedia: {
        id: string;
        title: string;
        category: string;
        viewedAt: string;
        exactDate: string;
        exactTime: string;
        viewsCountWeek: number;
        interestLevel: 'Alta Frequência' | 'Frequência Moderada' | 'Visualização Recente' | 'Aguardando Visualização';
        thumbnailUrl?: string;
    };
}
export declare class RadarStoriesService {
    private readonly prisma;
    private readonly aiService;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService);
    private formatDateTime;
    getMetrics(tenantId: string): Promise<{
        kpis: {
            totalViewsToday: number;
            totalViewsWeek: number;
            producersTracked: number;
            inactiveReheated: number;
            hotOpportunities: number;
            conversionRatePercent: number;
        };
        chartData: any[];
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
    recordStatusView(tenantId: string, data: {
        phone: string;
        contactName?: string;
        contactId?: string;
        statusMessageId?: string;
        storyTitle?: string;
        category?: string;
        mediaUrl?: string;
        viewedAt?: Date | string;
    }): Promise<{
        success: boolean;
        viewId: string;
        phone: string;
        contactName: string;
        storyTitle: string;
        viewedAt: string;
    }>;
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
