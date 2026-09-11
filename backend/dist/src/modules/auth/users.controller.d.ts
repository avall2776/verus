import { PrismaService } from '../../shared/database/prisma.service';
export declare class UsersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        isOnline: boolean;
    }[]>;
}
