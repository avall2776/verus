import { PrismaService } from '../../shared/database/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
export declare class ProposalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private formatProposal;
    findAll(tenantId: string, status?: string): Promise<any[]>;
    findOne(tenantId: string, id: string): Promise<any>;
    create(tenantId: string, dto: CreateProposalDto): Promise<any>;
    update(tenantId: string, id: string, dto: UpdateProposalDto): Promise<any>;
    updateStatus(tenantId: string, id: string, dto: UpdateProposalStatusDto): Promise<any>;
    delete(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findPublicByCodeOrId(codeOrId: string): Promise<any>;
    acceptPublic(codeOrId: string): Promise<any>;
    getWhatsAppShare(tenantId: string, id: string, origin?: string): Promise<{
        proposalId: any;
        code: any;
        title: any;
        clientName: any;
        clientPhone: any;
        proposalLink: string;
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
    generatePdfHtml(id: string, tenantId?: string): Promise<string>;
}
