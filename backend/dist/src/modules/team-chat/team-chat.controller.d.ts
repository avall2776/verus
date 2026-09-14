import { TeamChatService } from './team-chat.service';
export declare class TeamChatController {
    private readonly teamChatService;
    constructor(teamChatService: TeamChatService);
    getUsers(tenantId: string, req: any): Promise<{
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
    getDepartments(tenantId: string): Promise<{
        id: string;
        name: string;
        color: string;
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
    sendMessage(tenantId: string, req: any, body: {
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
