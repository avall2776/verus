import { PrismaService } from '../../shared/database/prisma.service';
export interface DriveSyncStats {
    clientsScanned: number;
    clientsCreated: number;
    cardsScanned: number;
    cardsCreated: number;
    details: Array<{
        clientName: string;
        clientId: string;
        isNewClient: boolean;
        filesFound: number;
        cardsCreated: number;
    }>;
}
export declare class GoogleDriveSyncService {
    private readonly prisma;
    private readonly logger;
    private syncConfigs;
    constructor(prisma: PrismaService);
    extractFolderId(urlOrId?: string | null): string | null;
    getSyncConfig(tenantId: string): {
        rootFolderUrl: string;
        apiKeyConfigured: boolean;
        autoSync: boolean;
        lastSyncAt: string;
        lastStats: DriveSyncStats;
    };
    saveSyncConfig(tenantId: string, data: {
        rootFolderUrl?: string;
        apiKey?: string;
        autoSync?: boolean;
    }): {
        rootFolderUrl: string;
        apiKeyConfigured: boolean;
        autoSync: boolean;
        lastSyncAt: string;
        lastStats: DriveSyncStats;
    };
    syncTenantDrive(tenantId: string, options?: {
        rootFolderUrl?: string;
        apiKey?: string;
        autoCreateClients?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        stats: DriveSyncStats;
    }>;
    private collectMediaFiles;
}
