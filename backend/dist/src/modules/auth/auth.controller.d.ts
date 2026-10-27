import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        requiresTenantSelection: boolean;
        user: {
            name: string;
            email: string;
            id?: undefined;
            role?: undefined;
            isSuperAdmin?: undefined;
            permissions?: undefined;
            avatarUrl?: undefined;
            tenantId?: undefined;
            tenantName?: undefined;
            availableTenants?: undefined;
        };
        tenants: {
            tenantId: string;
            tenantName: string;
            tenantLogo: string;
            role: string;
            isActive: boolean;
        }[];
        access_token?: undefined;
    } | {
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
        requiresTenantSelection?: undefined;
        tenants?: undefined;
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
}
