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
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    })[]>;
    getConversationMessages(tenantId: string, conversationId: string): Promise<{
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
    }[]>;
    getConversationByContact(tenantId: string, contactId: string): Promise<{
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
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    getConversationById(tenantId: string, conversationId: string): Promise<{
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
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    takeoverConversation(tenantId: string, conversationId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    releaseConversation(tenantId: string, conversationId: string): Promise<{
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
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    reopenConversation(tenantId: string, conversationId: string): Promise<{
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
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    assignToUser(tenantId: string, conversationId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    transferToDepartment(tenantId: string, conversationId: string, departmentId: string, userId?: string): Promise<{
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
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    sendManualMessage(tenantId: string, conversationId: string, payload: {
        content: string;
        isInternal?: boolean;
        type?: string;
        mediaUrl?: string;
    }): Promise<{
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
    }>;
    sendManualMessageToContact(tenantId: string, contactId: string, payload: any, userId: string): Promise<{
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
    }>;
}
