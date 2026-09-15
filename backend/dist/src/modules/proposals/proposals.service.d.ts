import { PrismaService } from '../../shared/database/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { Prisma } from '@prisma/client';
export declare class ProposalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
            value: Prisma.Decimal;
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
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
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
        totalValue: Prisma.Decimal;
    })[]>;
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
            value: Prisma.Decimal;
            notes: string | null;
            metadata: Prisma.JsonValue | null;
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
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
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
        totalValue: Prisma.Decimal;
    }>;
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
            value: Prisma.Decimal;
            notes: string | null;
            metadata: Prisma.JsonValue | null;
        };
        items: {
            id: string;
            createdAt: Date;
            description: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
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
        totalValue: Prisma.Decimal;
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
            value: Prisma.Decimal;
            notes: string | null;
            metadata: Prisma.JsonValue | null;
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
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
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
        totalValue: Prisma.Decimal;
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
            value: Prisma.Decimal;
            notes: string | null;
            metadata: Prisma.JsonValue | null;
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
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
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
        totalValue: Prisma.Decimal;
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
    getCompanyProfile(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        cnpj: string;
        logoUrl: string;
        address: string;
    }>;
    updateCompanyProfile(tenantId: string, data: {
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
    generatePdfHtml(tenantId: string, id: string): Promise<string>;
}
