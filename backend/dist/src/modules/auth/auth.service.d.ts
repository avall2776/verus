import { PrismaService } from '../../shared/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorService } from './services/two-factor.service';
import { SessionService } from './services/session.service';
import { ClientTelemetry } from './utils/client-telemetry.util';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly twoFactorService;
    private readonly sessionService;
    constructor(prisma: PrismaService, jwtService: JwtService, twoFactorService: TwoFactorService, sessionService: SessionService);
    login(email: string, pass: string, targetTenantId?: string, telemetry?: ClientTelemetry, trustedDeviceToken?: string): Promise<{
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
    verify2FALogin(tempToken: string, code: string, rememberDevice: boolean, telemetry?: ClientTelemetry): Promise<{
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
    private finalizeSuccessfulLogin;
    switchTenant(userId: string, targetTenantId: string, telemetry?: ClientTelemetry): Promise<{
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
}
