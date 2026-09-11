import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
export declare class CrmService {
    private readonly prisma;
    private readonly automationsService;
    constructor(prisma: PrismaService, automationsService: AutomationsService);
    findAllDeals(tenantId: string): Promise<({
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
    findTenantUsers(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
    }[]>;
    createDeal(tenantId: string, data: any): Promise<{
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
    updateDeal(tenantId: string, id: string, data: any): Promise<{
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
