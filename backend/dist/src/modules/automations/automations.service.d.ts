import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { Queue } from 'bullmq';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
export declare class AutomationsService {
    private readonly prisma;
    private readonly messagingService;
    private readonly automationsQueue;
    private readonly logger;
    constructor(prisma: PrismaService, messagingService: MessagingService, automationsQueue: Queue);
    findAll(tenantId: string): Promise<({
        _count: {
            logs: number;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        triggerType: string;
        triggerConditions: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string | null;
        actionPayload: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        logs: {
            error: string | null;
            id: string;
            tenantId: string;
            contactId: string | null;
            status: string;
            executedAt: Date;
            automationId: string;
            dealId: string | null;
            errorReason: string | null;
            payloadDetails: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        triggerType: string;
        triggerConditions: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string | null;
        actionPayload: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    create(tenantId: string, data: CreateAutomationDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        triggerType: string;
        triggerConditions: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string | null;
        actionPayload: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(tenantId: string, id: string, data: UpdateAutomationDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        triggerType: string;
        triggerConditions: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string | null;
        actionPayload: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        triggerType: string;
        triggerConditions: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        actionType: string | null;
        actionPayload: import("@prisma/client/runtime/library").JsonValue | null;
        actions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getLogs(tenantId: string): Promise<({
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
        };
        automation: {
            id: string;
            name: string;
            triggerType: string;
            actionType: string;
        };
    } & {
        error: string | null;
        id: string;
        tenantId: string;
        contactId: string | null;
        status: string;
        executedAt: Date;
        automationId: string;
        dealId: string | null;
        errorReason: string | null;
        payloadDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    testAutomation(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
        logId: string;
        actionType: any;
        resolvedMessage: string;
        executedAt: Date;
    }>;
    interpolateVariables(template: string, context: Record<string, any>): string;
    evaluateEvent(tenantId: string, triggerType: string, eventData: any): Promise<void>;
    executeAction(automation: any, eventData: any): Promise<void>;
    private getOrCreateConversation;
}
