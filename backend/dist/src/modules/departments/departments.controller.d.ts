import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(tenantId: string, body: {
        name: string;
        color?: string;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    }>;
    findAll(tenantId: string): Promise<({
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
    addUser(tenantId: string, id: string, body: {
        userId: string;
    }): Promise<{
        departmentId: string;
        userId: string;
    }>;
    removeUser(tenantId: string, id: string, userId: string): Promise<{
        departmentId: string;
        userId: string;
    }>;
    update(tenantId: string, id: string, body: {
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
