import { PrismaService } from '../../shared/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(email: string, pass: string): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            isSuperAdmin: boolean;
            avatarUrl: string;
            tenantId: string;
            tenantName: string;
        };
    }>;
}
