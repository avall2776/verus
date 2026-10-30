import { AgencyMarketingService } from './agency-marketing.service';
import { CreateMarketingCardDto } from './dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from './dto/update-marketing-card.dto';
import { CreateMarketingClientDto } from './dto/create-marketing-client.dto';
import { UpdateMarketingClientDto } from './dto/update-marketing-client.dto';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';
import { TimeClockDto } from './dto/time-clock.dto';
import { PrismaService } from '../../shared/database/prisma.service';
import { GoogleDriveSyncService } from './google-drive-sync.service';
export declare class AgencyMarketingController {
    private readonly marketingService;
    private readonly driveSyncService;
    private readonly prisma;
    constructor(marketingService: AgencyMarketingService, driveSyncService: GoogleDriveSyncService, prisma: PrismaService);
    getCards(tenantId: string, clientId?: string, status?: string, search?: string): Promise<({
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
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        marketingClientId: string;
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
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        marketingClientId: string;
        assignedUserId: string | null;
    }>;
    reorderCards(tenantId: string, body: {
        items: Array<{
            id: string;
            status: string;
            position: number;
        }>;
    }): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    updateCard(tenantId: string, id: string, dto: UpdateMarketingCardDto): Promise<{
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
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        marketingClientId: string;
        assignedUserId: string | null;
    }>;
    deleteCard(tenantId: string, id: string): Promise<{
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
    updateClient(tenantId: string, id: string, dto: UpdateMarketingClientDto): Promise<{
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
    deleteClient(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getClientById(tenantId: string, id: string): Promise<{
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
            format: string;
            position: number;
            dueDate: Date | null;
            publishDate: Date | null;
            marketingClientId: string;
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
    getClientPieces(tenantId: string, id: string): Promise<{
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
            format: string;
            position: number;
            dueDate: Date | null;
            publishDate: Date | null;
            marketingClientId: string;
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
    getCampaigns(tenantId: string, clientId?: string, platform?: string, status?: string): Promise<({
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
    updateCampaign(tenantId: string, id: string, dto: UpdateMarketingCampaignDto): Promise<{
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
    deleteCampaign(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
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
        format: string;
        position: number;
        dueDate: Date | null;
        publishDate: Date | null;
        marketingClientId: string;
        assignedUserId: string | null;
    })[]>;
    logTime(tenantId: string, req: any, dto: TimeClockDto): Promise<{
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
    getTodayTimeStatus(tenantId: string, req: any): Promise<{
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
    getTimeHistory(tenantId: string, userId?: string, limit?: string): Promise<({
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
        userId: string;
        timestamp: Date;
        durationMinutes: number | null;
        sessionHash: string;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
    getTeamMembers(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        role: string;
        canAccessMarketing: boolean;
    }[]>;
    getDriveConfig(tenantId: string): Promise<{
        rootFolderUrl: string;
        apiKeyConfigured: boolean;
        autoSync: boolean;
        lastSyncAt: string;
        lastStats: import("./google-drive-sync.service").DriveSyncStats;
    }>;
    saveDriveConfig(tenantId: string, body: {
        rootFolderUrl?: string;
        apiKey?: string;
        autoSync?: boolean;
    }): Promise<{
        rootFolderUrl: string;
        apiKeyConfigured: boolean;
        autoSync: boolean;
        lastSyncAt: string;
        lastStats: import("./google-drive-sync.service").DriveSyncStats;
    }>;
    syncDrive(tenantId: string, body: {
        rootFolderUrl?: string;
        apiKey?: string;
        autoCreateClients?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        stats: import("./google-drive-sync.service").DriveSyncStats;
    }>;
}
