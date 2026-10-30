import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { ChatService } from '../../chat/chat.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { StorageService } from '../../../shared/storage/storage.service';
export interface StoryViewerChatMessage {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    createdAt: string;
    formattedDate: string;
}
export interface StoryViewerItem {
    id: string;
    contactId: string;
    conversationId?: string;
    name: string;
    companyOrFarm: string;
    phone: string;
    phoneFormatted: string;
    email?: string;
    isLidOnly?: boolean;
    city: string;
    state: string;
    crmStatus: 'active_client' | 'inactive_client' | 'open_deal' | 'prospect' | 'internal_team' | 'non_commercial';
    crmStatusLabel: string;
    intentScore: number;
    intentLabel: string;
    totalPurchased: number;
    dealId?: string;
    dealTitle?: string;
    dealValue?: number;
    aiInsight?: string;
    lastChatMessage?: string;
    lastChatDate?: string;
    chatMessages?: StoryViewerChatMessage[];
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
        mediaUrl?: string;
        thumbnailUrl?: string;
        mediaType?: string;
    };
}
export declare class RadarStoriesService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly aiService;
    private readonly chatGateway?;
    private readonly storageService?;
    private readonly whatsappService?;
    private readonly chatService?;
    private readonly logger;
    private syncInterval;
    private readonly aiClassificationCache;
    constructor(prisma: PrismaService, aiService: AiService, chatGateway?: ChatGateway, storageService?: StorageService, whatsappService?: WhatsappService, chatService?: ChatService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private startBackgroundSync;
    syncAllActiveTenants(): Promise<void>;
    getActivePosts(tenantId: string, mode?: string): Promise<{
        id: any;
        messageId: any;
        title: any;
        category: any;
        mediaUrl: any;
        mediaType: any;
        thumbnailUrl: any;
        postedAt: any;
        postedAtRelative: string;
        postedAtDate: string;
        postedAtTime: string;
        viewsCount: number;
        viewsTotal: number;
        viewsToday: number;
        isLive: boolean;
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
        imageBase64?: string;
        videoBase64?: string;
        mediaBase64?: string;
        mediaType?: 'image' | 'video';
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
            mediaType: any;
            thumbnailUrl: any;
            postedAt: any;
            postedAtRelative: string;
            postedAtDate: string;
            postedAtTime: string;
            viewsCount: number;
            viewsTotal: number;
            viewsToday: number;
            isLive: boolean;
        }[];
        syncedViewsCount: number;
    }>;
    private resolveViewerIdentity;
    reconcileExistingLidViewers(tenantId: string, instanceName?: string): Promise<number>;
    private formatDateTime;
    formatBrazilianPhone(phone: string): {
        formatted: string;
        isLidOnly: boolean;
        cleanDigits: string;
    };
    resolveCityAndState(phone: string, contactAddress?: string | null, viewCity?: string | null, viewState?: string | null, contextText?: string): {
        city: string;
        state: string;
    };
    getMetrics(tenantId: string): Promise<{
        kpis: {
            totalViewsToday: any;
            totalViewsWeek: any;
            producersTracked: number;
            inactiveReheated: any;
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
    private classifyLeadByContextAndAi;
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
    sendDirectApproach(tenantId: string, body: {
        viewerId?: string;
        contactId?: string;
        phone: string;
        contactName?: string;
        message: string;
        storyTitle?: string;
        createDeal?: boolean;
    }): Promise<{
        success: boolean;
        contactId: string;
        conversationId: string;
        deal: any;
        message: string;
    }>;
    convertViewerToDeal(tenantId: string, body: {
        viewerId?: string;
        contactId?: string;
        phone: string;
        contactName: string;
        storyTitle: string;
        category?: string;
        estimatedValue?: number;
    }): Promise<{
        success: boolean;
        alreadyExisted: boolean;
        deal: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string;
            assignedTo: string | null;
            status: string;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        message: string;
    }>;
    updatePost(tenantId: string, postId: string, data: {
        title?: string;
        category?: string;
        mediaUrl?: string;
        mediaType?: string;
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
            mediaType: any;
            thumbnailUrl: any;
            postedAt: any;
            postedAtRelative: string;
            postedAtDate: string;
            postedAtTime: string;
            viewsCount: number;
            viewsTotal: number;
            viewsToday: number;
            isLive: boolean;
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
    private sha256Meta;
    private normalizeMetaText;
    exportMetaAudience(tenantId: string, viewerIds?: string[], mode?: 'sha256' | 'plain'): Promise<{
        success: boolean;
        mode: "sha256" | "plain";
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
        scheduledMessagesCount: number;
        createdDealsCount: number;
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
