import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
export declare class AutomationsController {
    private readonly automationsService;
    constructor(automationsService: AutomationsService);
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
        dealId: string | null;
        executedAt: Date;
        automationId: string;
        errorReason: string | null;
        payloadDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        logs: {
            error: string | null;
            id: string;
            tenantId: string;
            contactId: string | null;
            status: string;
            dealId: string | null;
            executedAt: Date;
            automationId: string;
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
    create(tenantId: string, body: CreateAutomationDto): Promise<{
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
    test(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
        logId: string;
        actionType: any;
        resolvedMessage: string;
        executedAt: Date;
    }>;
    update(tenantId: string, id: string, body: UpdateAutomationDto): Promise<{
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
    toggle(tenantId: string, id: string, body: {
        isActive: boolean;
    }): Promise<{
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
}
