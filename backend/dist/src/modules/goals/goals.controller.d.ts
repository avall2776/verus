import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
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
        targetValue: import("@prisma/client/runtime/library").Decimal;
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
        targetValue: import("@prisma/client/runtime/library").Decimal;
        periodStart: Date;
        periodEnd: Date;
        currentValue: import("@prisma/client/runtime/library").Decimal;
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
}
