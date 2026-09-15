import { CreateProposalItemDto } from './create-proposal.dto';
export declare class UpdateProposalDto {
    id?: string;
    code?: string;
    title?: string;
    clientName?: string;
    clientCompany?: string;
    clientEmail?: string;
    clientPhone?: string;
    sellerName?: string;
    status?: string;
    leadId?: string;
    dealId?: string;
    validUntil?: string;
    paymentTerms?: string;
    paymentMethod?: string;
    subtotal?: number;
    discountTotal?: number;
    total?: number;
    notes?: string;
    publicLink?: string;
    issuer?: any;
    items?: CreateProposalItemDto[];
}
