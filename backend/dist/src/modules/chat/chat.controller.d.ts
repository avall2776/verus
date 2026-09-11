import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(tenantId: string, req: any, tab?: string): Promise<({
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
    getMessages(tenantId: string, conversationId: string): Promise<{
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
    takeover(tenantId: string, conversationId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    release(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    transfer(tenantId: string, conversationId: string, body: {
        departmentId: string;
    }): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    assign(tenantId: string, conversationId: string, body: {
        userId: string;
    }): Promise<{
        id: string;
        tenantId: string;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sendMessage(tenantId: string, conversationId: string, payload: SendMessageDto): Promise<{
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
