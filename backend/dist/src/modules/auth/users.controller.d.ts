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
        departments: ({
            department: {
                id: string;
                name: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                color: string | null;
            };
        } & {
            departmentId: string;
            userId: string;
        })[];
        role: string;
        isSuperAdmin: boolean;
        canAccessMarketing: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        isOnline: boolean;
    }[]>;
    private readonly meCache;
    getMe(req: any): Promise<any>;
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
    updatePermissions(req: any, id: string, body: {
        permissions: any;
        canAccessMarketing?: boolean;
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
            canAccessMarketing: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isOnline: boolean;
        };
    }>;
    update(req: any, id: string, body: {
        name?: string;
        role?: string;
        isActive?: boolean;
        password?: string;
        avatarUrl?: string;
        permissions?: any;
        canAccessMarketing?: boolean;
        departmentIds?: string[];
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            tenantId: string;
            isActive: boolean;
            departments: ({
                department: {
                    id: string;
                    name: string;
                    tenantId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    color: string | null;
                };
            } & {
                departmentId: string;
                userId: string;
            })[];
            role: string;
            canAccessMarketing: boolean;
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
        canAccessMarketing?: boolean;
        departmentIds?: string[];
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            password: string;
            rawPasswordEncrypted: string | null;
            role: string;
            isSuperAdmin: boolean;
            canAccessMarketing: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            isOnline: boolean;
        } | {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            isActive: boolean;
            departments: ({
                department: {
                    id: string;
                    name: string;
                    tenantId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    color: string | null;
                };
            } & {
                departmentId: string;
                userId: string;
            })[];
            role: string;
            canAccessMarketing: boolean;
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
