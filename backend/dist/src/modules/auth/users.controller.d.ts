import { PrismaService } from '../../shared/database/prisma.service';
export declare class UsersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        role: string;
        isOnline: boolean;
    }[]>;
    updateProfile(req: any, body: {
        name?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        tenantId: string;
        role: string;
    }>;
    update(req: any, id: string, body: {
        name?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        tenantId: string;
        role: string;
    }>;
}
