import { MonitorService } from './monitor.service';
export declare class MonitorController {
    private readonly monitorService;
    constructor(monitorService: MonitorService);
    getActiveConversations(tenantId: string): Promise<{
        assignee: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            password: string;
            role: string;
            isSuperAdmin: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            isOnline: boolean;
        };
        lastMessage: {
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
        };
        lastMessageAt: Date;
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
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        departmentId: string | null;
        assignedTo: string | null;
        status: string;
    }[]>;
}
