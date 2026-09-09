import { PrismaService } from '../../shared/database/prisma.service';
export declare class ContactsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        source: string;
        tags: string[];
        lastActive: string;
    }[]>;
}
