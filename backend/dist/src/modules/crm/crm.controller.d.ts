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
        title: string;
        value: import("@prisma/client/runtime/library").Decimal;
        status: string;
        notes: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        assignedTo: string | null;
    })[]>;
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
        title: string;
        value: import("@prisma/client/runtime/library").Decimal;
        status: string;
        notes: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        assignedTo: string | null;
    }>;
}
