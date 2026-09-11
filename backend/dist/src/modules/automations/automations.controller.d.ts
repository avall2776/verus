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
        actionType: string;
        actionData: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    create(tenantId: string, body: any): Promise<{
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
    update(tenantId: string, id: string, body: any): Promise<{
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
}
