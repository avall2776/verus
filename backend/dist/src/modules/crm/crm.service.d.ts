import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
export declare class CrmService {
    private readonly prisma;
    private readonly automationsService;
    private readonly logger;
    constructor(prisma: PrismaService, automationsService: AutomationsService);
    findAllDeals(tenantId: string, filters?: {
        startDate?: string;
        endDate?: string;
        dateType?: 'created' | 'closed';
        status?: string;
    }): Promise<({
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
            source: string;
            tags: string[];
        };
        assignee: {
            id: string;
            name: string;
            email: string;
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
    findOneDeal(tenantId: string, id: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
            source: string;
            tags: string[];
        };
        assignee: {
            id: string;
            name: string;
            email: string;
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
    }>;
    findTenantUsers(tenantId: string): Promise<{
        id: string;
        name: string;
        email: string;
        departments: {
            department: {
                id: string;
                name: string;
            };
        }[];
        role: string;
        canAccessMarketing: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    createDeal(tenantId: string, data: any): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
            source: string;
            tags: string[];
        };
        assignee: {
            id: string;
            name: string;
            email: string;
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
    getContactDeal(tenantId: string, contactId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
            source: string;
            tags: string[];
        };
        assignee: {
            id: string;
            name: string;
            email: string;
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
    }>;
    moveContactToStage(tenantId: string, dto: {
        contactId: string;
        stageId: string;
        title?: string;
        value?: number;
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
