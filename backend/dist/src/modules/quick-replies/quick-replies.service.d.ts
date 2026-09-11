import { PrismaService } from '../../shared/database/prisma.service';
export declare class QuickRepliesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }[]>;
    create(tenantId: string, shortcut: string, content: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
    update(tenantId: string, id: string, data: {
        shortcut?: string;
        content?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
    delete(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
}
