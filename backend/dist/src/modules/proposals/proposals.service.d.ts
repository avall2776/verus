import { PrismaService } from '../../shared/database/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { CreateProposalProductDto, UpdateProposalProductDto } from './dto/proposal-product.dto';
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
    findAllProducts(tenantId: string, folderName?: string): Promise<{
        price: number;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        driveId: string | null;
        driveUrl: string | null;
        folderName: string | null;
        unit: string | null;
    }[]>;
    createProduct(tenantId: string, dto: CreateProposalProductDto): Promise<{
        price: number;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        driveId: string | null;
        driveUrl: string | null;
        folderName: string | null;
        unit: string | null;
    }>;
    updateProduct(tenantId: string, id: string, dto: UpdateProposalProductDto): Promise<{
        price: number;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        driveId: string | null;
        driveUrl: string | null;
        folderName: string | null;
        unit: string | null;
    }>;
    deleteProduct(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDriveConfig(tenantId: string): Promise<{
        driveFolder: string;
    }>;
    updateDriveConfig(tenantId: string, driveFolder: string): Promise<{
        driveFolder: string;
    }>;
}
