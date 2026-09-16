import { PrismaService } from '../../shared/database/prisma.service';
import { EmailsService } from '../emails/emails.service';
export declare class UsersController {
    private readonly prisma;
    private readonly emailsService;
    constructor(prisma: PrismaService, emailsService: EmailsService);
    findAll(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        createdAt: Date;
        isActive: boolean;
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
        isActive: boolean;
        role: string;
    }>;
    update(req: any, id: string, body: {
        name?: string;
        role?: string;
        isActive?: boolean;
        password?: string;
        avatarUrl?: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            tenantId: string;
            isActive: boolean;
            role: string;
            isOnline: boolean;
        };
    }>;
    create(req: any, body: {
        name: string;
        email: string;
        password?: string;
        role?: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            isActive: boolean;
            role: string;
            isOnline: boolean;
        };
        emailSent: boolean;
        emailError: string;
    }>;
    deleteUser(req: any, id: string): Promise<{
        message: string;
    }>;
}
