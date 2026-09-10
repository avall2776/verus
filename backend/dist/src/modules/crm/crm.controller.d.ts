import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    listDeals(tenantId: string): Promise<({
        contact: {
            name: string;
            phone: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        status: string;
        title: string;
        value: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    })[]>;
    updateDealStatus(tenantId: string, id: string, status: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
