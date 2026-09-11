import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { Queue } from 'bullmq';
export declare class AutomationsService {
    private readonly prisma;
    private readonly messagingService;
    private readonly automationsQueue;
    private readonly logger;
    constructor(prisma: PrismaService, messagingService: MessagingService, automationsQueue: Queue);
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    create(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getLogs(tenantId: string): Promise<({
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
        automation: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            triggerType: string;
            conditions: import("@prisma/client/runtime/library").JsonValue | null;
            actions: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        error: string | null;
        id: string;
        tenantId: string;
        contactId: string | null;
        status: string;
        automationId: string;
        dealId: string | null;
        executedAt: Date;
    })[]>;
    evaluateEvent(tenantId: string, triggerType: string, eventData: any): Promise<void>;
    executeAction(automation: any, eventData: any): Promise<void>;
    private getOrCreateConversation;
}
