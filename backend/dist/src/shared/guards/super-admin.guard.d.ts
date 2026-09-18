import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
export declare class SuperAdminGuard implements CanActivate {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
