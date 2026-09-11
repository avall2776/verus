import { WhatsappService } from './whatsapp.service';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    getConfig(tenantId: string): Promise<{
        metaToken: string;
        hasToken: boolean;
        metaPhoneNumberId: string;
        whatsappSettings: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        status: string;
    }>;
    updateConfig(tenantId: string, body: any): Promise<{
        success: boolean;
    }>;
}
