import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { ChatGateway } from './chat.gateway';
export declare class ChatService {
    private readonly prisma;
    private readonly messagingService;
    private readonly chatGateway;
    constructor(prisma: PrismaService, messagingService: MessagingService, chatGateway: ChatGateway);
    findAllConversations(tenantId: string, userId: string, userRole: string, tab?: string): Promise<({
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
        department: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string | null;
        };
        messages: {
            id: string;
            tenantId: string;
            contactId: string;
            status: string;
            createdAt: Date;
            conversationId: string;
            providerMessageId: string | null;
            content: string;
            type: string;
            mediaUrl: string | null;
            audioTranscription: string | null;
            isInternal: boolean;
            fromMe: boolean;
            direction: string;
            senderType: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getConversationMessages(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        status: string;
        createdAt: Date;
        conversationId: string;
        providerMessageId: string | null;
        content: string;
        type: string;
        mediaUrl: string | null;
        audioTranscription: string | null;
        isInternal: boolean;
        fromMe: boolean;
        direction: string;
        senderType: string;
    }[]>;
    getConversationByContact(tenantId: string, contactId: string): Promise<{
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
            contactId: string;
            status: string;
            createdAt: Date;
            conversationId: string;
            providerMessageId: string | null;
            content: string;
            type: string;
            mediaUrl: string | null;
            audioTranscription: string | null;
            isInternal: boolean;
            fromMe: boolean;
            direction: string;
            senderType: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    takeoverConversation(tenantId: string, conversationId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    releaseConversation(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    assignToUser(tenantId: string, conversationId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    transferToDepartment(tenantId: string, conversationId: string, departmentId: string): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sendManualMessage(tenantId: string, conversationId: string, payload: {
        content: string;
        isInternal?: boolean;
        type?: string;
        mediaUrl?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        status: string;
        createdAt: Date;
        conversationId: string;
        providerMessageId: string | null;
        content: string;
        type: string;
        mediaUrl: string | null;
        audioTranscription: string | null;
        isInternal: boolean;
        fromMe: boolean;
        direction: string;
        senderType: string;
    }>;
}
