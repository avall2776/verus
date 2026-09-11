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
        tenantId: string;
        name: string;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        triggerType: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    evaluateEvent(tenantId: string, triggerType: string, eventData: any): Promise<void>;
    executeAction(automation: any, eventData: any): Promise<void>;
    private getOrCreateConversation;
}
