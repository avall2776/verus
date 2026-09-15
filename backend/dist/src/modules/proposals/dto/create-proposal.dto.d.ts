export declare class CreateProposalItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
}
export declare class CreateProposalDto {
    title: string;
    leadId?: string;
    dealId?: string;
    validUntil?: string;
    paymentTerms?: string;
    notes?: string;
    items?: CreateProposalItemDto[];
}
