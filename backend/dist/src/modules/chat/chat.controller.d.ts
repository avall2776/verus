import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(tenantId: string, status?: string): Promise<({
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
    getMessages(tenantId: string, conversationId: string): Promise<{
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
    takeover(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
    }>;
    release(tenantId: string, conversationId: string): Promise<{
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
    }>;
    sendMessage(tenantId: string, conversationId: string, payload: SendMessageDto): Promise<{
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
    }>;
}
