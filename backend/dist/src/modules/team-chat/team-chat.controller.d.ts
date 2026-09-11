import { TeamChatService } from './team-chat.service';
export declare class TeamChatController {
    private readonly teamChatService;
    constructor(teamChatService: TeamChatService);
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
    createChannel(tenantId: string, body: {
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
    getMessages(tenantId: string, channelId?: string, receiverId?: string, req?: any): Promise<({
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
    sendMessage(tenantId: string, req: any, body: {
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
