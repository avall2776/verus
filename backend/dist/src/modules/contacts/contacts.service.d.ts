import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class ContactsService {
    private readonly prisma;
    private readonly automationsService;
    private readonly whatsappService;
    constructor(prisma: PrismaService, automationsService: AutomationsService, whatsappService: WhatsappService);
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        source: string;
        avatarUrl: string;
        tags: string[];
        lastActive: string;
    }[]>;
    updateTags(tenantId: string, contactId: string, tags: string[]): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        avatarUrl: string | null;
        source: string;
        tags: string[];
        tenantId: string;
        whatsappLid: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateContact(tenantId: string, contactId: string, data: {
        name?: string;
        phone?: string;
        email?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        avatarUrl: string | null;
        source: string;
        tags: string[];
        tenantId: string;
        whatsappLid: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
