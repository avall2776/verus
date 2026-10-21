import { PrismaService } from '../../shared/database/prisma.service';
export declare class ApiTokensService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listTokens(tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tokenPrefix: string;
        lastUsedAt: Date;
        createdBy: string;
    }[]>;
    createToken(tenantId: string, name: string, permissions: any, createdBy?: string): Promise<{
        success: boolean;
        message: string;
        token: string;
        data: {
            id: string;
            name: string;
            tokenPrefix: string;
            isActive: boolean;
            createdAt: Date;
        };
    }>;
    toggleToken(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            token: string;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            tokenPrefix: string;
            lastUsedAt: Date | null;
            createdBy: string | null;
        };
    }>;
    deleteToken(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
