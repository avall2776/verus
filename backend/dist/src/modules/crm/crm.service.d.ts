import { PrismaService } from '../../shared/database/prisma.service';
export declare class CrmService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllDeals(tenantId: string): Promise<({
        contact: {
            name: string;
            phone: string;
        };
    } & {
        id: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        title: string;
        notes: string | null;
    })[]>;
    updateDealStatus(tenantId: string, dealId: string, status: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
