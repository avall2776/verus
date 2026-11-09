import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';
export declare function clearUserSessionCache(): void;
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(req: any, payload: any): Promise<any>;
}
export {};
