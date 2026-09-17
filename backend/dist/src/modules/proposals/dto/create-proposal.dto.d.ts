export declare class CreateProposalItemDto {
    id?: string;
    name?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    discountPercent?: number;
    total?: number;
}
export declare class CreateProposalDto {
    id?: string;
    code?: string;
    title: string;
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
    logoUrl?: string;
    issuer?: any;
    items?: CreateProposalItemDto[];
}
