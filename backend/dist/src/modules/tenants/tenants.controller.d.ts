import { TenantsService } from './tenants.service';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    private checkSuperAdmin;
    getStats(req: any): Promise<{
        totalTenants: number;
        activeTenants: number;
        blockedTenants: number;
        totalUsers: number;
        totalContracts: number;
        openTickets: number;
        estimatedMRR: number;
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
    updateMyTenant(tenantId: string, body: any): Promise<{
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
    testAiKey(tenantId: string, body: {
        apiKey?: string;
    }): Promise<{
        success: boolean;
        message: string;
        modelsCount?: number;
        error?: string;
    }>;
    saveAiKey(tenantId: string, body: {
        apiKey: string;
    }): Promise<{
        success: boolean;
        message: string;
        maskedKey: string;
    }>;
    removeAiKey(tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(req: any, query: QueryTenantsDto): Promise<{
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
    create(req: any, body: CreateTenantDto): Promise<{
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
        };
    }>;
    getPlans(req: any): Promise<{
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
    createPlan(req: any, body: CreatePlanDto): Promise<{
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
    updatePlan(req: any, id: string, body: Partial<CreatePlanDto>): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
            avatarUrl: string;
            createdAt: Date;
            isActive: boolean;
            role: string;
            isOnline: boolean;
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
    update(req: any, id: string, body: UpdateTenantDto): Promise<{
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
    updatePut(req: any, id: string, body: UpdateTenantDto): Promise<{
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
    updateStatus(req: any, id: string, body: UpdateTenantStatusDto): Promise<{
        message: string;
        tenant: {
            id: string;
            name: string;
            updatedAt: Date;
            isActive: boolean;
        };
    }>;
    resetAdminPassword(req: any, id: string, body: ResetAdminPasswordDto): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
        temporaryPassword: string;
    }>;
    updateTenantUser(req: any, tenantId: string, userId: string, body: {
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
    resetTenantUserPassword(req: any, tenantId: string, userId: string, body: {
        newPassword?: string;
        sendEmail?: boolean;
    }): Promise<{
        message: string;
        temporaryPassword: string;
        emailSent: boolean;
        emailError: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
    }>;
    deleteTenantUser(req: any, tenantId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getSuperTenantAi(req: any, id: string): Promise<{
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
    togglePlatformKey(req: any, id: string, body: {
        allowed?: boolean;
    }): Promise<{
        success: boolean;
        allowed: boolean;
        message: string;
    }>;
    superTestAiKey(req: any, id: string, body: {
        apiKey?: string;
    }): Promise<{
        success: boolean;
        message: string;
        modelsCount?: number;
        error?: string;
    }>;
    superExtendTrial(req: any, id: string, body: {
        extraDays?: number;
    }): Promise<{
        success: boolean;
        aiTrialDays: number;
        message: string;
    }>;
    superSaveAiKey(req: any, id: string, body: {
        apiKey: string;
    }): Promise<{
        success: boolean;
        message: string;
        maskedKey: string;
    }>;
}
