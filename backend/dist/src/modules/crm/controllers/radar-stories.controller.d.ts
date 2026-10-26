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
        chartData: any[];
        categoryDistribution: {
            name: string;
            value: number;
            percentage: number;
        }[];
    }>;
    getActivePosts(tenantId: string): Promise<{
        id: any;
        messageId: any;
        title: any;
        category: any;
        mediaUrl: any;
        postedAt: any;
        postedAtRelative: string;
        postedAtDate: string;
        postedAtTime: string;
        viewsCount: number;
    }[]>;
    getViewers(tenantId: string, status?: string, category?: string, search?: string): Promise<import("../services/radar-stories.service").StoryViewerItem[]>;
    recordStatusView(tenantId: string, body: {
        phone: string;
        contactName?: string;
        contactId?: string;
        statusMessageId?: string;
        storyTitle?: string;
        category?: string;
        mediaUrl?: string;
        viewedAt?: string;
    }): Promise<{
        success: boolean;
        viewId: string;
        phone: string;
        contactName: string;
        storyTitle: string;
        viewedAt: string;
    }>;
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
