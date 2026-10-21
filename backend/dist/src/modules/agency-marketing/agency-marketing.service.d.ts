import { PrismaService } from '../../shared/database/prisma.service';
import { CreateMarketingCardDto } from './dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from './dto/update-marketing-card.dto';
import { CreateMarketingClientDto } from './dto/create-marketing-client.dto';
import { UpdateMarketingClientDto } from './dto/update-marketing-client.dto';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';
import { TimeClockDto } from './dto/time-clock.dto';
export declare class AgencyMarketingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCards(tenantId: string, filters?: {
        clientId?: string;
        status?: string;
        search?: string;
    }): Promise<({
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
        assignedUser: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        priority: string;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        marketingClientId: string;
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        assignedUserId: string | null;
    })[]>;
    createCard(tenantId: string, dto: CreateMarketingCardDto): Promise<{
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
        assignedUser: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        priority: string;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        marketingClientId: string;
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        assignedUserId: string | null;
    }>;
    updateCard(tenantId: string, cardId: string, dto: UpdateMarketingCardDto): Promise<{
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
        assignedUser: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        priority: string;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        marketingClientId: string;
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        assignedUserId: string | null;
    }>;
    reorderCards(tenantId: string, items: Array<{
        id: string;
        status: string;
        position: number;
    }>): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    deleteCard(tenantId: string, cardId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getClients(tenantId: string): Promise<{
        id: string;
        name: string;
        brandColor: string;
        logoUrl: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
        planTier: string;
        monthlyDeliverables: any;
        adBudget: number;
        assignedUserId: string;
        status: string;
        createdAt: Date;
        metrics: {
            totalCards: number;
            totalCampaigns: number;
            deliveredMonthCount: number;
            postsProgress: {
                delivered: number;
                target: number;
            };
            reelsProgress: {
                delivered: number;
                target: number;
            };
        };
    }[]>;
    createClient(tenantId: string, dto: CreateMarketingClientDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        logoUrl: string | null;
        contactName: string | null;
        contactPhone: string | null;
        assignedUserId: string | null;
        brandColor: string | null;
        contactEmail: string | null;
        planTier: string | null;
        monthlyDeliverables: import("@prisma/client/runtime/library").JsonValue | null;
        adBudget: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    updateClient(tenantId: string, clientId: string, dto: UpdateMarketingClientDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        logoUrl: string | null;
        contactName: string | null;
        contactPhone: string | null;
        assignedUserId: string | null;
        brandColor: string | null;
        contactEmail: string | null;
        planTier: string | null;
        monthlyDeliverables: import("@prisma/client/runtime/library").JsonValue | null;
        adBudget: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    deleteClient(tenantId: string, clientId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getClientPieces(tenantId: string, clientId: string): Promise<{
        cards: ({
            assignedUser: {
                id: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            description: string | null;
            priority: string;
            checklist: import("@prisma/client/runtime/library").JsonValue | null;
            marketingClientId: string;
            format: string;
            position: number;
            dueDate: Date | null;
            publishDate: Date | null;
            assignedUserId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        logoUrl: string | null;
        contactName: string | null;
        contactPhone: string | null;
        assignedUserId: string | null;
        brandColor: string | null;
        contactEmail: string | null;
        planTier: string | null;
        monthlyDeliverables: import("@prisma/client/runtime/library").JsonValue | null;
        adBudget: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getCampaigns(tenantId: string, filters?: {
        clientId?: string;
        platform?: string;
        status?: string;
    }): Promise<({
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        startDate: Date | null;
        endDate: Date | null;
        platform: string;
        marketingClientId: string;
        objective: string;
        budgetDaily: import("@prisma/client/runtime/library").Decimal | null;
        budgetTotal: import("@prisma/client/runtime/library").Decimal | null;
        spentAmount: import("@prisma/client/runtime/library").Decimal | null;
        leadsGenerated: number;
        cpl: import("@prisma/client/runtime/library").Decimal | null;
        roas: import("@prisma/client/runtime/library").Decimal | null;
        targetAudience: string | null;
        campaignUrl: string | null;
    })[]>;
    createCampaign(tenantId: string, dto: CreateMarketingCampaignDto): Promise<{
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        startDate: Date | null;
        endDate: Date | null;
        platform: string;
        marketingClientId: string;
        objective: string;
        budgetDaily: import("@prisma/client/runtime/library").Decimal | null;
        budgetTotal: import("@prisma/client/runtime/library").Decimal | null;
        spentAmount: import("@prisma/client/runtime/library").Decimal | null;
        leadsGenerated: number;
        cpl: import("@prisma/client/runtime/library").Decimal | null;
        roas: import("@prisma/client/runtime/library").Decimal | null;
        targetAudience: string | null;
        campaignUrl: string | null;
    }>;
    updateCampaign(tenantId: string, campaignId: string, dto: UpdateMarketingCampaignDto): Promise<{
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        startDate: Date | null;
        endDate: Date | null;
        platform: string;
        marketingClientId: string;
        objective: string;
        budgetDaily: import("@prisma/client/runtime/library").Decimal | null;
        budgetTotal: import("@prisma/client/runtime/library").Decimal | null;
        spentAmount: import("@prisma/client/runtime/library").Decimal | null;
        leadsGenerated: number;
        cpl: import("@prisma/client/runtime/library").Decimal | null;
        roas: import("@prisma/client/runtime/library").Decimal | null;
        targetAudience: string | null;
        campaignUrl: string | null;
    }>;
    deleteCampaign(tenantId: string, campaignId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getTrafficSummary(tenantId: string): Promise<{
        activeCampaignsCount: number;
        totalCampaigns: number;
        totalBudget: number;
        totalSpent: number;
        totalLeads: number;
        avgCpl: number;
        avgRoas: number;
        byPlatform: Record<string, {
            count: number;
            spent: number;
            leads: number;
        }>;
    }>;
    getSchedule(tenantId: string, start?: string, end?: string, clientId?: string): Promise<({
        marketingClient: {
            id: string;
            name: string;
            logoUrl: string;
            brandColor: string;
        };
        assignedUser: {
            id: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        priority: string;
        checklist: import("@prisma/client/runtime/library").JsonValue | null;
        marketingClientId: string;
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        assignedUserId: string | null;
    })[]>;
    logTime(tenantId: string, userId: string, dto: TimeClockDto, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        message: string;
        log: {
            id: string;
            type: string;
            timestamp: Date;
            sessionHash: string;
            ipAddress: string;
        };
    }>;
    getTodayTimeStatus(tenantId: string, userId: string): Promise<{
        currentState: "ACTIVE" | "ENDED" | "NOT_STARTED" | "PAUSED";
        lastAction: {
            type: string;
            timestamp: Date;
            sessionHash: string;
        };
        activeMinutes: number;
        activeHoursFormatted: string;
        todayLogs: {
            id: string;
            type: string;
            timestamp: Date;
            sessionHash: string;
            ipAddress: string;
            notes: string;
        }[];
    }>;
    getTimeHistory(tenantId: string, userId?: string, limit?: number): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        type: string;
        notes: string | null;
        timestamp: Date;
        userId: string;
        durationMinutes: number | null;
        sessionHash: string;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
}
