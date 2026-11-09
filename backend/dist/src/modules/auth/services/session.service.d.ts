import { PrismaService } from '../../../shared/database/prisma.service';
import { ClientTelemetry } from '../utils/client-telemetry.util';
export declare class SessionService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(params: {
        userId: string;
        tenantId: string;
        sessionToken: string;
        telemetry: ClientTelemetry;
        isTrustedDevice?: boolean;
        trustedUntil?: Date;
    }): Promise<{
        id: string;
        city: string | null;
        state: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        sessionToken: string;
        userId: string;
        ipAddress: string | null;
        country: string | null;
        device: string | null;
        browser: string | null;
        userAgent: string | null;
        isTrustedDevice: boolean;
        trustedUntil: Date | null;
        isRevoked: boolean;
        revokedAt: Date | null;
        lastActiveAt: Date;
    }>;
    recordLoginAudit(params: {
        userId?: string;
        tenantId?: string;
        email: string;
        userName?: string;
        tenantName?: string;
        status: 'SUCCESS' | 'FAILED_PASSWORD' | 'FAILED_2FA' | 'ACCOUNT_LOCKED' | '2FA_REQUESTED';
        failReason?: string;
        telemetry: ClientTelemetry;
    }): Promise<{
        id: string;
        email: string;
        city: string | null;
        state: string | null;
        tenantId: string | null;
        createdAt: Date;
        status: string;
        userId: string | null;
        ipAddress: string | null;
        country: string | null;
        device: string | null;
        browser: string | null;
        userAgent: string | null;
        userName: string | null;
        tenantName: string | null;
        failReason: string | null;
    }>;
    listActiveSessions(tenantId?: string): Promise<({
        tenant: {
            id: string;
            name: string;
            logoUrl: string;
        };
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
            isSuperAdmin: boolean;
            failedLoginAttempts: number;
            lockedUntil: Date;
        };
    } & {
        id: string;
        city: string | null;
        state: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        sessionToken: string;
        userId: string;
        ipAddress: string | null;
        country: string | null;
        device: string | null;
        browser: string | null;
        userAgent: string | null;
        isTrustedDevice: boolean;
        trustedUntil: Date | null;
        isRevoked: boolean;
        revokedAt: Date | null;
        lastActiveAt: Date;
    })[]>;
    listAuditLogs(tenantId?: string): Promise<{
        twoFactorCode: any;
        isVerified2FA: any;
        expiresAt2FA: any;
        id: string;
        email: string;
        city: string | null;
        state: string | null;
        tenantId: string | null;
        createdAt: Date;
        status: string;
        userId: string | null;
        ipAddress: string | null;
        country: string | null;
        device: string | null;
        browser: string | null;
        userAgent: string | null;
        userName: string | null;
        tenantName: string | null;
        failReason: string | null;
    }[]>;
    killSession(sessionId: string): Promise<{
        success: boolean;
        sessionId: string;
        userId: string;
        revokedAt: Date;
    }>;
    killAllSessions(exceptToken?: string): Promise<{
        success: boolean;
        revokedCount: number;
        message: string;
    }>;
    unlockUser(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    isDeviceTrusted(userId: string, trustedDeviceToken?: string): Promise<boolean>;
    generateTrustedDeviceToken(userId: string, telemetry: ClientTelemetry): Promise<{
        token: string;
        expiresAt: Date;
    }>;
}
