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
    updatePost(tenantId: string, postId: string, body: {
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
    deletePost(tenantId: string, postId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateViewerContact(tenantId: string, viewId: string, body: {
        phone?: string;
        contactName?: string;
        contactId?: string;
    }): Promise<{
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
    exportMetaAudience(tenantId: string, body: {
        viewerIds?: string[];
    }): Promise<{
        success: boolean;
        filename: string;
        totalContacts: number;
        csvContent: string;
    }>;
    createCampaignFromViewers(tenantId: string, body: {
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
    syncStories(tenantId: string): Promise<{
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
    publishStory(tenantId: string, body: {
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
