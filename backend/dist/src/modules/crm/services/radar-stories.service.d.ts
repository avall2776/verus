import { OnModuleInit } from '@nestjs/common';
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
export declare class RadarStoriesService implements OnModuleInit {
    private readonly prisma;
    private readonly aiService;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService);
    onModuleInit(): Promise<void>;
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
    getRecentViewersPhones(tenantId: string): Promise<{
        phones: string[];
    }>;
    getContactLatestView(tenantId: string, phone: string, contactId?: string): Promise<{
        id: any;
        statusMessageId: any;
        title: any;
        category: any;
        mediaUrl: any;
        viewedAt: any;
        exactDate: string;
        exactTime: string;
        relative: string;
    }>;
    publishStory(tenantId: string, data: {
        title: string;
        category: string;
        imageBase64: string;
        scheduledAt?: string;
    }): Promise<{
        success: boolean;
        postId: string;
        messageId: string;
        title: string;
        category: string;
        postedImmediately: boolean;
        scheduledAt: string;
    }>;
    syncActiveStories(tenantId: string): Promise<{
        success: boolean;
        message: string;
        activePosts: {
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
        }[];
        syncedViewsCount: number;
    }>;
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
