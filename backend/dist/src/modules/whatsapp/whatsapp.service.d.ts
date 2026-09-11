import { PrismaService } from '../../shared/database/prisma.service';
export declare class WhatsappService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getConfig(tenantId: string): Promise<{
        metaToken: string;
        hasToken: boolean;
        metaPhoneNumberId: string;
        whatsappSettings: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        status: string;
    }>;
    updateConfig(tenantId: string, data: any): Promise<{
        success: boolean;
    }>;
}
