import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
export declare class PublicApiKeyGuard implements CanActivate {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
