export declare class UpdateContractStatusDto {
    status: 'PENDING_SIGNATURE' | 'SIGNED' | 'CANCELED';
    documentUrl?: string;
    auditLogUrl?: string;
}
