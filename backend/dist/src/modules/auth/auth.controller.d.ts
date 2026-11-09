import { AuthService } from './auth.service';
import { SessionService } from './services/session.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class AuthController {
    private readonly authService;
    private readonly sessionService;
    private readonly chatGateway?;
    constructor(authService: AuthService, sessionService: SessionService, chatGateway?: ChatGateway);
    login(req: any, body: any): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            isSuperAdmin: boolean;
            permissions: any;
            avatarUrl: any;
            tenantId: any;
            tenantName: any;
            availableTenants: {
                tenantId: any;
                tenantName: any;
                tenantLogo: any;
                role: any;
            }[];
        };
    } | {
        requiresTenantSelection: boolean;
        user: {
            name: string;
            email: string;
            id?: undefined;
            tenantId?: undefined;
            tenantName?: undefined;
        };
        tenants: {
            tenantId: string;
            tenantName: string;
            tenantLogo: string;
            role: string;
            isActive: boolean;
        }[];
        requires2FA?: undefined;
        tempToken?: undefined;
        maskedPhone?: undefined;
    } | {
        requires2FA: boolean;
        tempToken: string;
        maskedPhone: string;
        user: {
            id: string;
            email: string;
            name: string;
            tenantId: string;
            tenantName: string;
        };
        requiresTenantSelection?: undefined;
        tenants?: undefined;
    }>;
    verify2FA(req: any, body: any): Promise<{
        trustedDeviceToken: string;
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            isSuperAdmin: boolean;
            permissions: any;
            avatarUrl: any;
            tenantId: any;
            tenantName: any;
            availableTenants: {
                tenantId: any;
                tenantName: any;
                tenantLogo: any;
                role: any;
            }[];
        };
    }>;
    switchTenant(req: any, tenantId: string): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            isSuperAdmin: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            avatarUrl: string;
            tenantId: string;
            tenantName: string;
            availableTenants: {
                tenantId: string;
                tenantName: string;
                tenantLogo: string;
                role: string;
            }[];
        };
    }>;
    getActiveSessions(tenantId?: string): Promise<({
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
    getAuditLogs(tenantId?: string): Promise<{
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
    killAllSessions(req: any, preserveCurrent?: boolean): Promise<{
        success: boolean;
        revokedCount: number;
        message: string;
    }>;
    unlockUser(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
