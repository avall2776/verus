import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
export declare class ContactsService {
    private readonly prisma;
    private readonly automationsService;
    constructor(prisma: PrismaService, automationsService: AutomationsService);
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        source: string;
        tags: string[];
        lastActive: string;
    }[]>;
    updateTags(tenantId: string, contactId: string, tags: string[]): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        source: string;
        tags: string[];
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
