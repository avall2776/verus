export interface SyncContactPayload {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}
export declare class GoogleContactsService {
    private readonly logger;
    sanitizePhone(rawPhone?: string | null): string | null;
    formatDisplayName(rawName: string, phone: string): string;
    syncContact(tenantId: string, contact: SyncContactPayload): Promise<{
        success: boolean;
        message?: string;
    }>;
}
