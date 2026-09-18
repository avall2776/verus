import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        id: string;
        userId: string;
        email: string;
        role: string;
        isSuperAdmin: boolean;
        tenantId: any;
        tenant: any;
        plan: any;
        name?: undefined;
    } | {
        id: string;
        userId: string;
        name: string;
        email: string;
        role: string;
        isSuperAdmin: boolean;
        tenantId: string;
        tenant: {
            id: string;
            name: string;
            plan: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                hasCRM: boolean;
                hasWhatsApp: boolean;
                hasInstagram: boolean;
                hasAIAgent: boolean;
                maxUsers: number;
                maxAIMsgs: number;
                maxWorkspaces: number;
                modules: import("@prisma/client/runtime/library").JsonValue;
            };
            isActive: boolean;
            planId: string;
        };
        plan: {
            id: string;
            name: string;
            price: import("@prisma/client/runtime/library").Decimal;
            hasCRM: boolean;
            hasWhatsApp: boolean;
            hasInstagram: boolean;
            hasAIAgent: boolean;
            maxUsers: number;
            maxAIMsgs: number;
            maxWorkspaces: number;
            modules: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
}
export {};
