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
    findAll(tenantId: string): Promise<({
        users: ({
            user: {
                id: string;
                name: string;
                email: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                password: string;
                role: string;
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
    addUserToDepartment(tenantId: string, departmentId: string, userId: string): Promise<{
        departmentId: string;
        userId: string;
    }>;
    removeUserFromDepartment(tenantId: string, departmentId: string, userId: string): Promise<{
        departmentId: string;
        userId: string;
    }>;
}
