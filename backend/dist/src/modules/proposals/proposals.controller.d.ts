import { Response, Request } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
export declare class ProposalsController {
    private readonly proposalsService;
    constructor(proposalsService: ProposalsService);
    findAll(tenantId: string, status?: string): Promise<any[]>;
    create(tenantId: string, dto: CreateProposalDto): Promise<any>;
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
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, dto: UpdateProposalDto): Promise<any>;
    patch(tenantId: string, id: string, dto: UpdateProposalDto): Promise<any>;
    updateStatus(tenantId: string, id: string, dto: UpdateProposalStatusDto): Promise<any>;
    getPublic(codeOrId: string): Promise<any>;
    acceptPublic(codeOrId: string): Promise<any>;
    getWhatsAppShare(tenantId: string, id: string, queryOrigin?: string, req?: Request): Promise<{
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
    getPdf(id: string, res: Response, queryTenantId?: string): Promise<Response<any, Record<string, any>>>;
    delete(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
