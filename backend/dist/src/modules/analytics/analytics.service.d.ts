import { PrismaService } from '../../shared/database/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseDateRange;
    getOverview(tenantId: string, startDate?: string, endDate?: string): Promise<{
        total: number;
        inProgress: number;
        finished: number;
        inbound: number;
        outbound: number;
        newContacts: number;
        tmaSeconds: number;
        firstResponseSeconds: number;
        ignoredCount: number;
    }>;
    getCharts(tenantId: string, startDate?: string, endDate?: string): Promise<{
        timeline: {
            date: string;
            label: string;
            finished: number;
            inProgress: number;
            avgTmaMinutes: number;
        }[];
        distributions: {
            byStatus: {
                name: string;
                value: number;
                color: string;
            }[];
            byDepartment: {
                name: string;
                value: number;
                color: string;
            }[];
            byDayOfWeek: {
                name: string;
                value: number;
            }[];
            byCloseReason: {
                name: string;
                value: number;
                color: string;
            }[];
        };
    }>;
    getAgentPerformance(tenantId: string, startDate?: string, endDate?: string): Promise<{
        id: string;
        name: string;
        role: string;
        isOnline: boolean;
        pendingCount: number;
        inProgressCount: number;
        finishedCount: number;
        total: number;
        avgFirstResponse: string;
        avgTma: string;
        csatAvg: string;
    }[]>;
    getDetailedTickets(tenantId: string, query: {
        startDate?: string;
        endDate?: string;
        agentId?: string;
        departmentId?: string;
        status?: string;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        tickets: {
            id: string;
            contactName: string;
            phone: string;
            agentName: string;
            departmentName: string;
            durationMinutes: number;
            messagesCount: number;
            closeReason: string;
            status: string;
            rating: number;
            createdAt: Date;
            closedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAiCosts(tenantId: string, startDate?: string, endDate?: string): Promise<{
        spent7d: number;
        spent15d: number;
        spent30d: number;
        projectionMonth: number;
        dailyCostEvolution: any[];
        detailedExecutions: {
            id: string;
            model: string;
            promptTokens: number;
            completionTokens: number;
            costUsd: number;
            createdAt: string;
            contactName: string;
        }[];
    }>;
    getCsat(tenantId: string, startDate?: string, endDate?: string, agentName?: string, search?: string): Promise<{
        csatScore: number;
        totalSurveys: number;
        responsesCount: number;
        responseRate: number;
        positivePercent: number;
        distribution: {
            stars: number;
            count: number;
            percent: number;
        }[];
        surveys: {
            id: string;
            contactName: string;
            phone: string;
            agentName: string;
            rating: number;
            comment: string;
            channel: string;
            createdAt: string;
        }[];
        recentFeedbacks: {
            id: string;
            contactName: string;
            phone: string;
            agentName: string;
            rating: number;
            comment: string;
            channel: string;
            createdAt: string;
        }[];
    }>;
    private ensureInitialCsatSeed;
    createCsatSurvey(tenantId: string, data: {
        contactName: string;
        phone: string;
        agentName: string;
        rating: number;
        comment?: string;
        conversationId?: string;
        contactId?: string;
        userId?: string;
    }): Promise<{
        id: string;
        phone: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        status: string;
        conversationId: string | null;
        channel: string;
        userId: string | null;
        contactName: string;
        agentName: string;
        rating: number;
        comment: string | null;
    }>;
    getChannels(tenantId: string, startDate?: string, endDate?: string): Promise<{
        channels: {
            id: string;
            name: string;
            type: string;
            color: string;
            leadsCount: number;
            dealsCount: number;
            proposalsCount: number;
            contractsSignedCount: number;
            totalRevenue: number;
            conversionRate: number;
            avgTicket: number;
            percentOfTotalRevenue: number;
        }[];
        totalLeads: number;
        totalRevenue: number;
        topChannel: string;
        fastestGrowingChannel: string;
        isBaseline: boolean;
    }>;
    getFunnel(tenantId: string, startDate?: string, endDate?: string): Promise<{
        totalLeads: number;
        contractsSigned: number;
        overallConversion: number;
        totalRevenue: number;
        avgTicket: number;
        avgSalesCycleHours: number;
        stages: {
            stage: string;
            name: string;
            count: number;
            conversion: string;
            percent: number;
            dropoff: string;
            dropoffCount: number;
            duration: string;
            fill: string;
            color: string;
        }[];
        benchmarkComparison: {
            industryConversion: number;
            versusConversion: number;
            delta: number;
        };
        isBaseline: boolean;
    }>;
    getBottlenecks(tenantId: string, startDate?: string, endDate?: string): Promise<{
        tmaMinutes: number;
        frtMinutes: number;
        slaCompliancePercent: number;
        criticalBottleneck: string;
        departmentBottlenecks: {
            department: string;
            name: string;
            frtMin: number;
            tmaMin: number;
            sla: number;
            queue: number;
            fillFrt: string;
            fillTma: string;
            health: string;
        }[];
        hourlyBottlenecks: {
            hour: string;
            frtMin: number;
            tmaMin: number;
            volume: number;
            queue: number;
            bottleneckLevel: string;
        }[];
        recommendations: {
            id: string;
            type: string;
            title: string;
            description: string;
            impact: string;
        }[];
    }>;
}
