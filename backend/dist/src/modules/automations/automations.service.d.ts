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
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
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
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
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
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
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
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    evaluateEvent(tenantId: string, triggerType: string, eventData: any): Promise<void>;
    executeAction(automation: any, eventData: any): Promise<void>;
    private getOrCreateConversation;
}
