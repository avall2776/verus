import { PrismaService } from '../../shared/database/prisma.service';
import { EmailsService } from '../emails/emails.service';
export declare class UsersController {
    private readonly prisma;
    private readonly emailsService;
    constructor(prisma: PrismaService, emailsService: EmailsService);
    findAll(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        createdAt: Date;
        isActive: boolean;
        role: string;
        isSuperAdmin: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        isOnline: boolean;
    }[]>;
    getMe(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        tenantId: string;
        tenant: {
            id: string;
            name: string;
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
                modules: import("@prisma/client/runtime/library").JsonValue;
            };
            isActive: boolean;
            planId: string;
        };
        isActive: boolean;
        role: string;
        isSuperAdmin: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    } | {
        tenantId: string;
        tenant: {
            id: string;
            name: string;
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
                modules: import("@prisma/client/runtime/library").JsonValue;
            };
            isActive: boolean;
            planId: string;
        };
        isImpersonating: boolean;
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        isActive: boolean;
        role: string;
        isSuperAdmin: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateProfile(req: any, body: {
        name?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        tenantId: string;
        isActive: boolean;
        role: string;
    }>;
    update(req: any, id: string, body: {
        name?: string;
        role?: string;
        isActive?: boolean;
        password?: string;
        avatarUrl?: string;
        permissions?: any;
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            tenantId: string;
            isActive: boolean;
            role: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isOnline: boolean;
        };
    }>;
    create(req: any, body: {
        name: string;
        email: string;
        password?: string;
        role?: string;
        permissions?: any;
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            isActive: boolean;
            role: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isOnline: boolean;
        };
        emailSent: boolean;
        emailError: string;
    }>;
    deleteUser(req: any, id: string): Promise<{
        message: string;
    }>;
}
