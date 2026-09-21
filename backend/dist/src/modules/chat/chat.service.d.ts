import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ChatGateway } from './chat.gateway';
import { Queue } from 'bullmq';
export declare class ChatService {
    private readonly prisma;
    private readonly messagingService;
    private readonly whatsappService;
    private readonly chatGateway;
    private readonly scheduledQueue;
    private readonly logger;
    constructor(prisma: PrismaService, messagingService: MessagingService, whatsappService: WhatsappService, chatGateway: ChatGateway, scheduledQueue: Queue);
    getConversationCounts(tenantId: string, userId: string, userRole: string): Promise<{
        waiting: number;
        mine: number;
        resolved: number;
        total: number;
    }>;
    getOperatorProductivity(tenantId: string, userId: string): Promise<{
        todayFinishedCount: number;
        tmaSeconds: number;
        firstResponseSeconds: number;
        todayAvgTma: string;
        todayFirstResp: string;
        avgDaily: number;
        finishedVsAveragePercent: number;
        dailyGoal: number;
    }>;
    findAllConversations(tenantId: string, userId: string, userRole: string, tab?: string): Promise<({
        contact: {
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
            scheduledAt: Date | null;
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
        scheduledAt: Date | null;
        conversationId: string;
    }[]>;
    getConversationByContact(tenantId: string, contactId: string): Promise<{
        contact: {
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
            scheduledAt: Date | null;
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
            avatarUrl: string | null;
            source: string;
            tags: string[];
            tenantId: string;
            whatsappLid: string | null;
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
            scheduledAt: Date | null;
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
            avatarUrl: string | null;
            source: string;
            tags: string[];
            tenantId: string;
            whatsappLid: string | null;
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
            scheduledAt: Date | null;
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
            avatarUrl: string | null;
            source: string;
            tags: string[];
            tenantId: string;
            whatsappLid: string | null;
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
            scheduledAt: Date | null;
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
    markAsRead(tenantId: string, conversationId: string): Promise<{
        success: boolean;
        conversationId: string;
        unreadCount: number;
    }>;
    markAsUnread(tenantId: string, conversationId: string): Promise<{
        success: boolean;
        conversationId: string;
        unreadCount: number;
    }>;
    assignToUser(tenantId: string, conversationId: string, userId: string, operatorName?: string): Promise<{
        contact: {
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
            scheduledAt: Date | null;
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
    transferToDepartment(tenantId: string, conversationId: string, departmentId: string, userId?: string, operatorName?: string): Promise<{
        contact: {
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
            scheduledAt: Date | null;
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
    private parseScheduledDate;
    scheduleMessage(tenantId: string, conversationId: string, payload: {
        content: string;
        scheduledAt: string;
        timezone?: string;
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
        scheduledAt: Date | null;
        conversationId: string;
    }>;
    getScheduledMessages(tenantId: string, conversationId: string): Promise<{
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
        scheduledAt: Date | null;
        conversationId: string;
    }[]>;
    getAllScheduledMessages(tenantId: string): Promise<({
        contact: {
            id: string;
            name: string;
            phone: string;
            avatarUrl: string;
        };
        conversation: {
            id: string;
            status: string;
        };
    } & {
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
        scheduledAt: Date | null;
        conversationId: string;
    })[]>;
    batchCancelScheduledMessages(tenantId: string, messageIds: string[]): Promise<{
        success: boolean;
        canceledCount: number;
        canceledIds: string[];
    }>;
    cancelScheduledMessage(tenantId: string, messageId: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
    sendManualMessage(tenantId: string, conversationId: string, payload: {
        content: string;
        isInternal?: boolean;
        type?: string;
        mediaUrl?: string;
        scheduledAt?: string;
        timezone?: string;
        instanceId?: string;
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
        scheduledAt: Date | null;
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
        scheduledAt: Date | null;
        conversationId: string;
    }>;
    sendManualAudioMessage(tenantId: string, conversationId: string, file: Express.Multer.File, payload: {
        content?: string;
        isInternal?: boolean;
        instanceId?: string;
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
        scheduledAt: Date | null;
        conversationId: string;
    }>;
    deleteMessage(tenantId: string, conversationId: string, messageId: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
