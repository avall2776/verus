import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
export declare class ProposalsController {
    private readonly proposalsService;
    constructor(proposalsService: ProposalsService);
    findAll(tenantId: string, status?: string): Promise<({
        tenant: {
            id: string;
            name: string;
            phone: string;
            email: string;
            cnpj: string;
            logoUrl: string;
            address: string;
        };
        deal: {
            id: string;
            status: string;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal;
        };
        contracts: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            proposalId: string;
            documentUrl: string | null;
            auditLogUrl: string | null;
            signedAt: Date | null;
        }[];
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
    })[]>;
    create(tenantId: string, dto: CreateProposalDto): Promise<{
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
    }>;
    getCompanyProfile(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        cnpj: string;
        logoUrl: string;
        address: string;
    }>;
    updateCompanyProfile(tenantId: string, body: {
        name?: string;
        cnpj?: string;
        logoUrl?: string;
        phone?: string;
        address?: string;
        email?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        cnpj: string;
        logoUrl: string;
        address: string;
    }>;
    findOne(tenantId: string, id: string): Promise<{
        tenant: {
            id: string;
            name: string;
            phone: string;
            email: string;
            cnpj: string;
            logoUrl: string;
            address: string;
        };
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
        contracts: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            proposalId: string;
            documentUrl: string | null;
            auditLogUrl: string | null;
            signedAt: Date | null;
        }[];
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
    }>;
    update(tenantId: string, id: string, dto: UpdateProposalDto): Promise<{
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
        contracts: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            proposalId: string;
            documentUrl: string | null;
            auditLogUrl: string | null;
            signedAt: Date | null;
        }[];
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
    }>;
    patch(tenantId: string, id: string, dto: UpdateProposalDto): Promise<{
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
        contracts: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            proposalId: string;
            documentUrl: string | null;
            auditLogUrl: string | null;
            signedAt: Date | null;
        }[];
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
    }>;
    updateStatus(tenantId: string, id: string, dto: UpdateProposalStatusDto): Promise<{
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
        contracts: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            proposalId: string;
            documentUrl: string | null;
            auditLogUrl: string | null;
            signedAt: Date | null;
        }[];
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
    }>;
    getWhatsAppShare(tenantId: string, id: string): Promise<{
        proposalId: string;
        title: string;
        clientName: string;
        clientPhone: string;
        totalValue: number;
        message: string;
        whatsappUrl: string;
    }>;
    getPdf(tenantId: string, id: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
