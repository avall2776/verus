import { CreateProposalItemDto } from './create-proposal.dto';
export declare class UpdateProposalDto {
    title?: string;
    leadId?: string;
    dealId?: string;
    validUntil?: string;
    paymentTerms?: string;
    notes?: string;
    status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
    items?: CreateProposalItemDto[];
}
