import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { StorageService } from '../../../shared/storage/storage.service';
export interface StoryViewerItem {
    id: string;
    contactId: string;
    name: string;
    companyOrFarm: string;
    phone: string;
    phoneFormatted: string;
    isLidOnly?: boolean;
    city: string;
    state: string;
    crmStatus: 'active_client' | 'inactive_client' | 'open_deal' | 'prospect' | 'internal_team';
    crmStatusLabel: string;
    totalPurchased: number;
    dealTitle?: string;
    dealValue?: number;
    aiInsight?: string;
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
export declare class RadarStoriesService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly aiService;
    private readonly chatGateway?;
    private readonly storageService?;
    private readonly logger;
    private syncInterval;
    constructor(prisma: PrismaService, aiService: AiService, chatGateway?: ChatGateway, storageService?: StorageService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private startBackgroundSync;
    syncAllActiveTenants(): Promise<void>;
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
        mediaUrl: string;
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
    formatBrazilianPhone(phone: string): {
        formatted: string;
        isLidOnly: boolean;
        cleanDigits: string;
    };
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
    updatePost(tenantId: string, postId: string, data: {
        title?: string;
        category?: string;
        mediaUrl?: string;
        postedAt?: string;
    }): Promise<{
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
    }>;
    updateViewerContact(tenantId: string, viewId: string, data: {
        phone?: string;
        contactName?: string;
        contactId?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    exportMetaAudience(tenantId: string, viewerIds?: string[]): Promise<{
        success: boolean;
        filename: string;
        totalContacts: number;
        csvContent: string;
    }>;
    createCampaignFromViewers(tenantId: string, data: {
        campaignName: string;
        objective: string;
        viewerIds: string[];
        messageTemplate?: string;
    }): Promise<{
        success: boolean;
        campaignId: string;
        campaignName: string;
        objective: string;
        totalAudience: number;
        createdAt: string;
        message: string;
    }>;
    deletePost(tenantId: string, postId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateViewerClassification(tenantId: string, viewId: string, body: {
        crmStatus: string;
        contactId?: string;
    }): Promise<{
        success: boolean;
        crmStatus: string;
        message: string;
    }>;
}
