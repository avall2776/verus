import { PrismaService } from '../../shared/database/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Prisma } from '@prisma/client';
export declare class GoalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private isWon;
    getSummary(tenantId: string, channel?: string): Promise<{
        monthName: string;
        totalDays: number;
        daysPassed: number;
        daysRemaining: number;
        totalRevenueTarget: number;
        totalTarget: number;
        totalRevenueWon: number;
        totalCurrent: number;
        dailyPace: number;
        currentDailyPace: number;
        requiredDailyPace: number;
        dailyPaceNeeded: number;
        projectedRevenue: number;
        runRatePercentage: number;
        progressPercentage: number;
        overallProgress: number;
        expectedPacePercentage: number;
        paceGap: number;
        healthStatus: "achieved" | "on_track" | "at_risk" | "behind";
        isBaseline: boolean;
        topSeller: {
            rank: number;
            badgeTier: "gold" | "silver" | "bronze" | "participant";
            badges: {
                id: string;
                title: string;
                icon: string;
                description: string;
                color: string;
            }[];
            userId: string;
            id: string;
            name: string;
            email: string;
            role: string;
            avatarUrl: any;
            totalDeals: number;
            dealsWon: number;
            dealsCount: number;
            revenueWon: number;
            achievedValue: number;
            targetValue: number;
            percentAchieved: number;
            conversionRate: number;
            avgTicket: number;
        };
        goalsCount: number;
        selectedChannel: string;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        title: string;
        category: string;
        targetType: string;
        targetValue: number;
        currentValue: number;
        unit: string;
        periodStart: string;
        periodEnd: string;
        startDate: string;
        endDate: string;
        progressPercentage: number;
        projectionRate: number;
        status: "achieved" | "on_track" | "at_risk" | "behind";
        user: {
            id: string;
            name: string;
            email: string;
        };
        createdAt: string;
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
    update(tenantId: string, id: string, dto: UpdateGoalDto): Promise<{
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
    delete(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLeaderboard(tenantId: string): Promise<{
        rank: number;
        badgeTier: "gold" | "silver" | "bronze" | "participant";
        badges: {
            id: string;
            title: string;
            icon: string;
            description: string;
            color: string;
        }[];
        userId: string;
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: any;
        totalDeals: number;
        dealsWon: number;
        dealsCount: number;
        revenueWon: number;
        achievedValue: number;
        targetValue: number;
        percentAchieved: number;
        conversionRate: number;
        avgTicket: number;
    }[]>;
    getSellerDetails(tenantId: string, userId: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            createdAt: Date;
            role: string;
        };
        metrics: {
            totalDeals: number;
            dealsWon: number;
            totalRevenueWon: number;
            conversionRate: number;
            avgTicket: number;
        };
        badges: {
            id: string;
            title: string;
            icon: string;
            description: string;
            color: string;
        }[];
        recentDeals: {
            id: string;
            title: string;
            value: number;
            status: string;
            isWon: boolean;
            clientName: string;
            clientCompany: any;
            clientPhone: string;
            createdAt: string;
        }[];
    }>;
    private computeBadges;
    private calculateCurrentMetric;
}
