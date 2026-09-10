import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
export declare class ChatService {
    private readonly prisma;
    private readonly messagingService;
    constructor(prisma: PrismaService, messagingService: MessagingService);
    findAllConversations(tenantId: string, status?: string): Promise<({
        contact: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            email: string | null;
            source: string;
            tags: string[];
        };
        messages: {
            id: string;
            tenantId: string;
            status: string;
            createdAt: Date;
            contactId: string;
            conversationId: string;
            providerMessageId: string | null;
            content: string;
            fromMe: boolean;
            direction: string;
            senderType: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
    })[]>;
    getConversationMessages(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        contactId: string;
        conversationId: string;
        providerMessageId: string | null;
        content: string;
        fromMe: boolean;
        direction: string;
        senderType: string;
    }[]>;
    takeoverConversation(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
    }>;
    releaseConversation(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
    }>;
    sendManualMessage(tenantId: string, conversationId: string, content: string): Promise<any>;
}
