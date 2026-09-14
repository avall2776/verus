import { PrismaService } from '../../shared/database/prisma.service';
export declare class WhatsappService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private ensureDefaultInstance;
    getInstances(tenantId: string): Promise<{
        token: string;
        hasToken: boolean;
        history: {
            id: string;
            status: string;
            details: string | null;
            timestamp: Date;
            instanceId: string;
        }[];
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        lastConnectedAt: Date | null;
    }[]>;
    getInstanceById(tenantId: string, id: string): Promise<{
        token: string;
        hasToken: boolean;
        history: {
            id: string;
            status: string;
            details: string | null;
            timestamp: Date;
            instanceId: string;
        }[];
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        lastConnectedAt: Date | null;
    }>;
    createInstance(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        token: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        lastConnectedAt: Date | null;
    }>;
    updateInstance(tenantId: string, id: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        token: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        lastConnectedAt: Date | null;
    }>;
    deleteInstance(tenantId: string, id: string): Promise<{
        success: boolean;
    }>;
    connectInstance(tenantId: string, id: string, mode?: 'qr' | 'meta'): Promise<{
        status: string;
        qrCode: string;
        message: string;
    } | {
        status: string;
        message: string;
        qrCode?: undefined;
    }>;
    disconnectInstance(tenantId: string, id: string): Promise<{
        status: string;
        message: string;
    }>;
    getConfig(tenantId: string): Promise<{
        metaToken: string;
        hasToken: boolean;
        metaPhoneNumberId: string;
        instanceId: string;
        instanceName: string;
        profilePicUrl: string;
        whatsappSettings: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        status: string;
    }>;
    updateConfig(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        token: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        lastConnectedAt: Date | null;
    }>;
}
