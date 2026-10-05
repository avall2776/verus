import { PrismaService } from '../../shared/database/prisma.service';
export declare class MonitorService {
    private readonly prisma;
    private readonly memoryCache;
    constructor(prisma: PrismaService);
    getActiveConversations(tenantId: string): Promise<any>;
    clearCache(tenantId?: string): void;
}
