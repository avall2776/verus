import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    listDeals(tenantId: string): Promise<({
        contact: {
            id: string;
            name: string;
            phone: string;
            tags: string[];
        };
        assignee: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        assignedTo: string | null;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    listUsers(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
    }[]>;
    updateDeal(tenantId: string, id: string, updateData: {
        status?: string;
        value?: number;
        assignedTo?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        assignedTo: string | null;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
