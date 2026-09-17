import { PrismaService } from '../../shared/database/prisma.service';
export interface GlobalSearchResult {
    leads: Array<{
        id: string;
        title: string;
        value: number;
        status: string;
        contactName: string;
        contactPhone?: string;
        href: string;
    }>;
    contacts: Array<{
        id: string;
        name: string;
        phone: string;
        email?: string;
        conversationId?: string;
        href: string;
    }>;
    team: Array<{
        id: string;
        name: string;
        email?: string;
        role: string;
        isOnline: boolean;
        href: string;
    }>;
    total: number;
}
export declare class SearchService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    globalSearch(tenantId: string, query: string): Promise<GlobalSearchResult>;
}
