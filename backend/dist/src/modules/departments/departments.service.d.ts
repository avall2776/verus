import { PrismaService } from '../../shared/database/prisma.service';
export declare class DepartmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, name: string, color: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    }>;
    findAll(tenantId: string, userId?: string, userRole?: string): Promise<({
        users: ({
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
                twoFactorEnabled: boolean;
                twoFactorMethod: string;
                twoFactorPhone: string | null;
                failedLoginAttempts: number;
                lockedUntil: Date | null;
                trustedDevices: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            departmentId: string;
            userId: string;
        })[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    })[]>;
    addUserToDepartment(tenantId: string, departmentId: string, userId: string): Promise<{
        departmentId: string;
        userId: string;
    }>;
    removeUserFromDepartment(tenantId: string, departmentId: string, userId: string): Promise<{
        departmentId: string;
        userId: string;
    }>;
    update(tenantId: string, id: string, data: {
        name?: string;
        color?: string;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    }>;
    delete(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    }>;
}
