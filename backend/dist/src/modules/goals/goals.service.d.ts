import { PrismaService } from '../../shared/database/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { Prisma } from '@prisma/client';
export declare class GoalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        currentValue: number;
        progressPercentage: number;
        user: {
            id: string;
            name: string;
            email: string;
        };
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string | null;
        targetType: string;
        targetValue: Prisma.Decimal;
        periodStart: Date;
        periodEnd: Date;
    }[]>;
    create(tenantId: string, dto: CreateGoalDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string | null;
        targetType: string;
        targetValue: Prisma.Decimal;
        periodStart: Date;
        periodEnd: Date;
        currentValue: Prisma.Decimal;
    }>;
    getLeaderboard(tenantId: string): Promise<{
        userId: string;
        name: string;
        email: string;
        avatarUrl: any;
        totalDeals: number;
        dealsWon: number;
        revenueWon: number;
        conversionRate: number;
        rank: number;
    }[]>;
    private calculateCurrentMetric;
}
