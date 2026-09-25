import { PrismaService } from '../../shared/database/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    private readonly memoryCache;
    private readonly seededTenants;
    constructor(prisma: PrismaService);
    private getCached;
    private setCached;
    private parseDateRange;
    getOverview(tenantId: string, startDate?: string, endDate?: string): Promise<unknown>;
    getCharts(tenantId: string, startDate?: string, endDate?: string): Promise<unknown>;
    getAgentPerformance(tenantId: string, startDate?: string, endDate?: string): Promise<unknown>;
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
    getAiCosts(tenantId: string, startDate?: string, endDate?: string): Promise<unknown>;
    getCsat(tenantId: string, startDate?: string, endDate?: string, agentName?: string, search?: string): Promise<unknown>;
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
