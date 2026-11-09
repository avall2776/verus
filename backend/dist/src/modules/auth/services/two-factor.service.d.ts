import { PrismaService } from '../../../shared/database/prisma.service';
import { ClientTelemetry } from '../utils/client-telemetry.util';
export declare const MASTER_VALIDATION_PHONE = "5554991109159";
export declare class TwoFactorService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateAndSend2FA(user: {
        id: string;
        name: string;
        email: string;
        tenantId: string;
    }, tenantName: string, telemetry: ClientTelemetry): Promise<{
        tempToken: string;
        expiresAt: Date;
        maskedPhone: string;
    }>;
    verify2FACode(tempToken: string, code: string): Promise<{
        userId: string;
        tenantId: string;
        email: string;
    }>;
    private dispatchWhatsAppMaster;
}
