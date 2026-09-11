import { PrismaService } from '../../shared/database/prisma.service';
export declare class MonitorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveConversations(tenantId: string): Promise<{
        assignee: {
            id: string;
            name: string;
            email: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            role: string;
            password: string;
            isOnline: boolean;
        };
        lastMessage: {
            id: string;
            tenantId: string;
            createdAt: Date;
            contactId: string;
            status: string;
            providerMessageId: string | null;
            content: string;
            type: string;
            mediaUrl: string | null;
            audioTranscription: string | null;
            isInternal: boolean;
            fromMe: boolean;
            direction: string;
            senderType: string;
            conversationId: string;
        };
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            source: string;
            tags: string[];
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        messages: {
            id: string;
            tenantId: string;
            createdAt: Date;
            contactId: string;
            status: string;
            providerMessageId: string | null;
            content: string;
            type: string;
            mediaUrl: string | null;
            audioTranscription: string | null;
            isInternal: boolean;
            fromMe: boolean;
            direction: string;
            senderType: string;
            conversationId: string;
        }[];
        department: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            color: string | null;
        };
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }[]>;
}
