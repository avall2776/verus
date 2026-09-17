import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class WhatsappService {
    private readonly prisma;
    private readonly chatGateway;
    private readonly logger;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    private ensureDefaultInstance;
    private syncEvolutionInstances;
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
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
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
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        lastConnectedAt: Date | null;
    }>;
    createInstance(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        token: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        lastConnectedAt: Date | null;
    }>;
    updateInstance(tenantId: string, id: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        token: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
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
    pairInstance(tenantId: string, id: string, phoneNumber?: string): Promise<{
        status: string;
        message: string;
        instance: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            token: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            phoneNumber: string | null;
            profilePicUrl: string | null;
            profileName: string | null;
            qrCode: string | null;
            phoneNumberId: string | null;
            isDefault: boolean;
            lastConnectedAt: Date | null;
        };
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
        token: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        phoneNumber: string | null;
        profilePicUrl: string | null;
        profileName: string | null;
        qrCode: string | null;
        phoneNumberId: string | null;
        isDefault: boolean;
        lastConnectedAt: Date | null;
    }>;
    fetchContactProfilePicture(tenantId: string, phone: string): Promise<string | null>;
    syncContactAvatar(tenantId: string, contactId: string): Promise<string | null>;
    downloadAndSaveMedia(tenantId: string, mediaId: string, mimeType?: string): Promise<string | null>;
}
