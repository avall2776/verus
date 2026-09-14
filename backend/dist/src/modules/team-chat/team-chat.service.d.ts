import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class TeamChatService {
    private readonly prisma;
    private readonly chatGateway;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    getUsers(tenantId: string, currentUserId?: string): Promise<{
        department: string;
        departmentColor: string;
        lastMessage: {
            id: string;
            createdAt: Date;
            content: string;
            senderId: string;
        };
        id: string;
        name: string;
        email: string;
        departments: ({
            department: {
                id: string;
                name: string;
                color: string;
            };
        } & {
            departmentId: string;
            userId: string;
        })[];
        role: string;
        isOnline: boolean;
    }[]>;
    getChannels(tenantId: string): Promise<{
        lastMessage: {
            id: string;
            createdAt: Date;
            content: string;
            sender: {
                id: string;
                name: string;
            };
        };
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            sender: {
                id: string;
                name: string;
            };
        }[];
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
    }[]>;
    getDepartments(tenantId: string): Promise<{
        id: string;
        name: string;
        color: string;
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
            role: string;
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
        channel: {
            id: string;
            name: string;
        };
        sender: {
            id: string;
            name: string;
            role: string;
        };
        receiver: {
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
