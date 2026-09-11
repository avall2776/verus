import { AutomationsService } from './automations.service';
export declare class AutomationsController {
    private readonly automationsService;
    constructor(automationsService: AutomationsService);
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
    create(tenantId: string, body: any): Promise<{
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
    update(tenantId: string, id: string, body: any): Promise<{
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
}
