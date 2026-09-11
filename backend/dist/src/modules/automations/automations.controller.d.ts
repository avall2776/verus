import { AutomationsService } from './automations.service';
export declare class AutomationsController {
    private readonly automationsService;
    constructor(automationsService: AutomationsService);
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
    create(tenantId: string, body: any): Promise<{
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
    update(tenantId: string, id: string, body: any): Promise<{
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
    toggle(tenantId: string, id: string, body: {
        isActive: boolean;
    }): Promise<{
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
}
