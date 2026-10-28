import { CrmService } from './crm.service';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    listDeals(tenantId: string, startDate?: string, endDate?: string, dateType?: 'created' | 'closed', status?: string): Promise<({
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
    listUsers(tenantId: string): Promise<{
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
    createDeal(tenantId: string, dealData: any): Promise<{
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
    moveContact(tenantId: string, body: {
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
    getDealByContact(tenantId: string, contactId: string): Promise<{
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
    getDeal(tenantId: string, id: string): Promise<{
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
    updateDeal(tenantId: string, id: string, updateData: {
        status?: string;
        value?: number;
        assignedTo?: string;
        notes?: string;
        title?: string;
        metadata?: any;
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
