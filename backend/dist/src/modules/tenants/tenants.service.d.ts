import { PrismaService } from '../../shared/database/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { AiService } from '../ai/ai.service';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
export declare class TenantsService {
    readonly prisma: PrismaService;
    private readonly emailsService;
    private readonly aiService;
    private readonly logger;
    constructor(prisma: PrismaService, emailsService: EmailsService, aiService: AiService);
    private evolutionInstancesCache;
    private statsCache;
    private getActiveEvolutionInstances;
    private resolveTenantWhatsAppStatus;
    findAll(query: QueryTenantsDto): Promise<{
        data: {
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            address: string;
            logoUrl: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            plan: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
            adminUser: {
                id: string;
                name: string;
                email: string;
                isOnline: boolean;
                savedPassword: string;
            };
            connections: {
                whatsapp: boolean;
                whatsappPhone: any;
                whatsappProvider: any;
                smtp: boolean;
            };
            counts: {
                users: number;
                contracts: number;
                deals: number;
                contacts: number;
                supportTickets: number;
                openTickets: number;
            };
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<any>;
    findOne(id: string): Promise<{
        company: {
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            leadNotificationPhone: string;
            address: string;
            logoUrl: string;
            isActive: boolean;
            aiEnabled: boolean;
            createdAt: Date;
            updatedAt: Date;
            plan: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                hasCRM: boolean;
                hasWhatsApp: boolean;
                hasInstagram: boolean;
                hasAIAgent: boolean;
                maxUsers: number;
                maxAIMsgs: number;
                maxWorkspaces: number;
                modules: import("@prisma/client/runtime/library").JsonValue | null;
            };
        };
        diagnostics: {
            whatsapp: {
                connected: boolean;
                provider: any;
                phoneNumber: any;
                instances: {
                    id: string;
                    name: string;
                    updatedAt: Date;
                    status: string;
                    phoneNumber: string;
                }[];
                settings: import("@prisma/client/runtime/library").JsonValue;
            };
            smtp: {
                configured: boolean;
                provider: any;
                fromEmail: any;
                fromName: any;
                host: any;
                isActive: any;
            };
        };
        metrics: {
            totalUsers: number;
            totalContacts: number;
            totalDeals: number;
            dealsValue: number | import("@prisma/client/runtime/library").Decimal;
            totalContracts: number;
            signedContracts: number;
            signedContractsValue: number | import("@prisma/client/runtime/library").Decimal;
            totalTickets: number;
        };
        users: {
            id: string;
            name: string;
            email: string;
            role: string;
            isActive: boolean;
            avatarUrl: string;
            isOnline: boolean;
            createdAt: Date;
            savedPassword: string;
        }[];
        recentTickets: {
            id: string;
            ticketNumber: number;
            subject: string;
            status: string;
            priority: string;
            category: string;
            requester: string;
            messagesCount: number;
            updatedAt: Date;
        }[];
    }>;
    updateStatus(id: string, isActive: boolean): Promise<{
        message: string;
        tenant: {
            id: string;
            name: string;
            updatedAt: Date;
            isActive: boolean;
        };
    }>;
    resetAdminPassword(id: string, newPassword?: string): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            savedPassword: string;
        };
        temporaryPassword: string;
        savedPassword: string;
    }>;
    getMyTenant(tenantId: string): Promise<{
        _count: {
            supportTickets: number;
            users: number;
            contacts: number;
            contracts: number;
        };
        plan: {
            id: string;
            name: string;
            price: import("@prisma/client/runtime/library").Decimal;
            hasCRM: boolean;
            hasWhatsApp: boolean;
            hasInstagram: boolean;
            hasAIAgent: boolean;
            maxUsers: number;
            maxAIMsgs: number;
            maxWorkspaces: number;
            modules: import("@prisma/client/runtime/library").JsonValue | null;
        };
    } & {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        cnpj: string | null;
        logoUrl: string | null;
        leadNotificationPhone: string | null;
        address: string | null;
        isActive: boolean;
        aiEnabled: boolean;
        aiName: string | null;
        aiModel: string;
        aiPrompt: string | null;
        aiKnowledgeBase: string | null;
        aiTemperature: number;
        aiTrialStartedAt: Date | null;
        aiTrialDays: number;
        aiPlatformKeyAllowed: boolean;
        aiCustomApiKey: string | null;
        aiKeyType: string;
        aiKeyStatus: string;
        aiLastKeyTestAt: Date | null;
        aiTrialWarningSent: boolean;
        metaToken: string | null;
        metaPhoneNumberId: string | null;
        whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
        emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
        planId: string;
    }>;
    updateMyTenant(tenantId: string, data: {
        name?: string;
        cnpj?: string;
        email?: string;
        phone?: string;
        leadNotificationPhone?: string;
        address?: string;
        aiEnabled?: boolean;
    }): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        cnpj: string | null;
        logoUrl: string | null;
        leadNotificationPhone: string | null;
        address: string | null;
        isActive: boolean;
        aiEnabled: boolean;
        aiName: string | null;
        aiModel: string;
        aiPrompt: string | null;
        aiKnowledgeBase: string | null;
        aiTemperature: number;
        aiTrialStartedAt: Date | null;
        aiTrialDays: number;
        aiPlatformKeyAllowed: boolean;
        aiCustomApiKey: string | null;
        aiKeyType: string;
        aiKeyStatus: string;
        aiLastKeyTestAt: Date | null;
        aiTrialWarningSent: boolean;
        metaToken: string | null;
        metaPhoneNumberId: string | null;
        whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
        emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
        planId: string;
    }>;
    private ensureStandardPlans;
    getPlans(): Promise<{
        id: string;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        hasCRM: boolean;
        hasWhatsApp: boolean;
        hasInstagram: boolean;
        hasAIAgent: boolean;
        maxUsers: number;
        maxAIMsgs: number;
        maxWorkspaces: number;
        modules: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    createPlan(dto: CreatePlanDto): Promise<{
        id: string;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        hasCRM: boolean;
        hasWhatsApp: boolean;
        hasInstagram: boolean;
        hasAIAgent: boolean;
        maxUsers: number;
        maxAIMsgs: number;
        maxWorkspaces: number;
        modules: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updatePlan(id: string, dto: Partial<CreatePlanDto>): Promise<{
        id: string;
        name: string;
        price: import("@prisma/client/runtime/library").Decimal;
        hasCRM: boolean;
        hasWhatsApp: boolean;
        hasInstagram: boolean;
        hasAIAgent: boolean;
        maxUsers: number;
        maxAIMsgs: number;
        maxWorkspaces: number;
        modules: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(dto: CreateTenantDto): Promise<{
        message: string;
        tenant: {
            plan: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                hasCRM: boolean;
                hasWhatsApp: boolean;
                hasInstagram: boolean;
                hasAIAgent: boolean;
                maxUsers: number;
                maxAIMsgs: number;
                maxWorkspaces: number;
                modules: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            cnpj: string | null;
            logoUrl: string | null;
            leadNotificationPhone: string | null;
            address: string | null;
            isActive: boolean;
            aiEnabled: boolean;
            aiName: string | null;
            aiModel: string;
            aiPrompt: string | null;
            aiKnowledgeBase: string | null;
            aiTemperature: number;
            aiTrialStartedAt: Date | null;
            aiTrialDays: number;
            aiPlatformKeyAllowed: boolean;
            aiCustomApiKey: string | null;
            aiKeyType: string;
            aiKeyStatus: string;
            aiLastKeyTestAt: Date | null;
            aiTrialWarningSent: boolean;
            metaToken: string | null;
            metaPhoneNumberId: string | null;
            whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
            emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
            planId: string;
        };
        adminUser: {
            id: string;
            name: string;
            email: string;
            role: string;
            savedPassword: string;
        };
    }>;
    update(id: string, dto: any): Promise<{
        message: string;
        tenant: {
            plan: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            cnpj: string | null;
            logoUrl: string | null;
            leadNotificationPhone: string | null;
            address: string | null;
            isActive: boolean;
            aiEnabled: boolean;
            aiName: string | null;
            aiModel: string;
            aiPrompt: string | null;
            aiKnowledgeBase: string | null;
            aiTemperature: number;
            aiTrialStartedAt: Date | null;
            aiTrialDays: number;
            aiPlatformKeyAllowed: boolean;
            aiCustomApiKey: string | null;
            aiKeyType: string;
            aiKeyStatus: string;
            aiLastKeyTestAt: Date | null;
            aiTrialWarningSent: boolean;
            metaToken: string | null;
            metaPhoneNumberId: string | null;
            whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
            emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
            planId: string;
        };
    }>;
    updateTenantUser(tenantId: string, userId: string, dto: {
        name?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            role: string;
            isOnline: boolean;
        };
    }>;
    resetTenantUserPassword(tenantId: string, userId: string, dto: {
        newPassword?: string;
        sendEmail?: boolean;
    }): Promise<{
        message: string;
        temporaryPassword: string;
        savedPassword: string;
        emailSent: boolean;
        emailError: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            savedPassword: string;
        };
    }>;
    deleteTenantUser(tenantId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAiStatus(tenantId: string): Promise<{
        canUseAi: boolean;
        source: "platform_authorized" | "byok" | "trial_active" | "trial_expired";
        daysLeft: number;
        totalTrialDays: number;
        statusText: string;
        isPlatformAllowed: boolean;
        hasCustomKey: boolean;
        maskedCustomKey: string;
        aiModel: string;
        aiEnabled: boolean;
        lastKeyTestAt: Date;
        trialStartedAt: Date;
    }>;
    testClientAiKey(tenantId: string, apiKey?: string): Promise<{
        success: boolean;
        message: string;
        modelsCount?: number;
        error?: string;
    }>;
    saveCustomAiKey(tenantId: string, plainKey: string): Promise<{
        success: boolean;
        message: string;
        maskedKey: string;
    }>;
    removeCustomAiKey(tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getSuperTenantAi(tenantId: string): Promise<{
        tenantId: string;
        tenantName: string;
        aiPlatformKeyAllowed: boolean;
        canUseAi: boolean;
        source: "platform_authorized" | "byok" | "trial_active" | "trial_expired";
        daysLeft: number;
        totalTrialDays: number;
        statusText: string;
        hasCustomKey: boolean;
        maskedCustomKey: string;
        lastKeyTestAt: Date;
        trialStartedAt: Date;
    }>;
    togglePlatformKeyAllowed(tenantId: string, allowed?: boolean): Promise<{
        success: boolean;
        allowed: boolean;
        message: string;
    }>;
    superExtendTrial(tenantId: string, extraDays?: number): Promise<{
        success: boolean;
        aiTrialDays: number;
        message: string;
    }>;
    superSaveAiKey(tenantId: string, plainKey: string): Promise<{
        success: boolean;
        message: string;
        maskedKey: string;
    }>;
}
