import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ScheduleMessageDto } from './dto/schedule-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(tenantId: string, req: any, tab?: string, status?: string): Promise<({
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    getConversationCounts(tenantId: string, req: any): Promise<{
        waiting: number;
        mine: number;
        resolved: number;
        total: number;
    }>;
    getOperatorProductivity(tenantId: string, req: any): Promise<{
        todayFinishedCount: number;
        tmaSeconds: number;
        firstResponseSeconds: number;
        todayAvgTma: string;
        todayFirstResp: string;
        avgDaily: number;
        finishedVsAveragePercent: number;
        dailyGoal: number;
    }>;
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
    batchCancelScheduledMessages(tenantId: string, body: {
        messageIds: string[];
    }): Promise<{
        success: boolean;
        canceledCount: number;
        canceledIds: string[];
    }>;
    getMessages(tenantId: string, conversationId: string): Promise<{
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
    deleteMessage(tenantId: string, conversationId: string, messageId: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
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
    getConversation(tenantId: string, conversationId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    takeover(tenantId: string, conversationId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }>;
    release(tenantId: string, conversationId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    resolve(tenantId: string, conversationId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    reopen(tenantId: string, conversationId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    ignore(tenantId: string, conversationId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    transfer(tenantId: string, req: any, conversationId: string, body: {
        departmentId: string;
        userId?: string;
    }): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    assign(tenantId: string, req: any, conversationId: string, body: {
        userId: string;
    }): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            avatarUrl: string | null;
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
    sendMessage(tenantId: string, conversationId: string, payload: SendMessageDto): Promise<{
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
    sendAudioMessage(tenantId: string, conversationId: string, file: Express.Multer.File, isInternal?: string | boolean, content?: string, instanceId?: string): Promise<{
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
    scheduleMessage(tenantId: string, conversationId: string, payload: ScheduleMessageDto): Promise<{
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
    cancelScheduledMessage(tenantId: string, messageId: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
    sendMessageToContact(tenantId: string, contactId: string, payload: SendMessageDto, req: any): Promise<{
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
}
