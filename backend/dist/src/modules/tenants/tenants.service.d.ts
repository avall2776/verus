import { PrismaService } from '../../shared/database/prisma.service';
import { QueryTenantsDto } from './dto/query-tenants.dto';
export declare class TenantsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
            };
            connections: {
                whatsapp: boolean;
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
    getStats(): Promise<{
        totalTenants: number;
        activeTenants: number;
        blockedTenants: number;
        totalUsers: number;
        totalContracts: number;
        openTickets: number;
        estimatedMRR: number;
    }>;
    findOne(id: string): Promise<{
        company: {
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
                hasCRM: boolean;
                hasWhatsApp: boolean;
                hasInstagram: boolean;
                hasAIAgent: boolean;
                maxUsers: number;
                maxAIMsgs: number;
            };
        };
        diagnostics: {
            whatsapp: {
                connected: boolean;
                phoneNumberId: string;
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
        };
        temporaryPassword: string;
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
        address: string | null;
        isActive: boolean;
        aiName: string | null;
        aiModel: string;
        aiPrompt: string | null;
        aiKnowledgeBase: string | null;
        aiTemperature: number;
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
        address?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        cnpj: string | null;
        logoUrl: string | null;
        address: string | null;
        isActive: boolean;
        aiName: string | null;
        aiModel: string;
        aiPrompt: string | null;
        aiKnowledgeBase: string | null;
        aiTemperature: number;
        metaToken: string | null;
        metaPhoneNumberId: string | null;
        whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
        emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
        planId: string;
    }>;
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
    }[]>;
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
            address: string | null;
            isActive: boolean;
            aiName: string | null;
            aiModel: string;
            aiPrompt: string | null;
            aiKnowledgeBase: string | null;
            aiTemperature: number;
            metaToken: string | null;
            metaPhoneNumberId: string | null;
            whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
            emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
            planId: string;
        };
    }>;
}
