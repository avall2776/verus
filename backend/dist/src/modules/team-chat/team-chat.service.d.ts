import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class TeamChatService {
    private readonly prisma;
    private readonly chatGateway;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    getUsers(tenantId: string): Promise<{
        id: string;
        name: string;
        role: string;
        isOnline: boolean;
    }[]>;
    getChannels(tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
    }[]>;
    createChannel(tenantId: string, data: {
        name: string;
        description?: string;
        isPrivate?: boolean;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
    }>;
    getMessages(tenantId: string, currentUserId: string, channelId?: string, receiverId?: string): Promise<({
        sender: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        mediaUrl: string | null;
        senderId: string;
        channelId: string | null;
        receiverId: string | null;
    })[]>;
    sendMessage(tenantId: string, senderId: string, data: {
        channelId?: string;
        receiverId?: string;
        content: string;
        mediaUrl?: string;
    }): Promise<{
        sender: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        mediaUrl: string | null;
        senderId: string;
        channelId: string | null;
        receiverId: string | null;
    }>;
}
