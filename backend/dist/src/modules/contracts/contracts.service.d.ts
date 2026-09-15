import { PrismaService } from '../../shared/database/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
export declare class ContractsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        proposal: {
            items: {
                id: string;
                createdAt: Date;
                description: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                proposalId: string;
            }[];
            lead: {
                id: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            notes: string | null;
            dealId: string | null;
            leadId: string | null;
            validUntil: Date | null;
            paymentTerms: string | null;
            totalValue: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        proposalId: string;
        documentUrl: string | null;
        auditLogUrl: string | null;
        signedAt: Date | null;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        proposal: {
            deal: {
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
            };
            items: {
                id: string;
                createdAt: Date;
                description: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                proposalId: string;
            }[];
            lead: {
                id: string;
                name: string;
                phone: string | null;
                email: string | null;
                avatarUrl: string | null;
                source: string;
                tags: string[];
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            notes: string | null;
            dealId: string | null;
            leadId: string | null;
            validUntil: Date | null;
            paymentTerms: string | null;
            totalValue: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        proposalId: string;
        documentUrl: string | null;
        auditLogUrl: string | null;
        signedAt: Date | null;
    }>;
    create(tenantId: string, dto: CreateContractDto): Promise<{
        proposal: {
            items: {
                id: string;
                createdAt: Date;
                description: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                proposalId: string;
            }[];
            lead: {
                id: string;
                name: string;
                phone: string | null;
                email: string | null;
                avatarUrl: string | null;
                source: string;
                tags: string[];
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            notes: string | null;
            dealId: string | null;
            leadId: string | null;
            validUntil: Date | null;
            paymentTerms: string | null;
            totalValue: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        proposalId: string;
        documentUrl: string | null;
        auditLogUrl: string | null;
        signedAt: Date | null;
    }>;
    updateStatus(tenantId: string, id: string, dto: UpdateContractStatusDto): Promise<{
        proposal: {
            items: {
                id: string;
                createdAt: Date;
                description: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                proposalId: string;
            }[];
            lead: {
                id: string;
                name: string;
                phone: string | null;
                email: string | null;
                avatarUrl: string | null;
                source: string;
                tags: string[];
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            notes: string | null;
            dealId: string | null;
            leadId: string | null;
            validUntil: Date | null;
            paymentTerms: string | null;
            totalValue: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        proposalId: string;
        documentUrl: string | null;
        auditLogUrl: string | null;
        signedAt: Date | null;
    }>;
}
