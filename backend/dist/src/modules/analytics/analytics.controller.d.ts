import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
    getDetailedTickets(tenantId: string, startDate?: string, endDate?: string, agentId?: string, departmentId?: string, status?: string, page?: number, limit?: number, search?: string): Promise<{
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
    getCsat(tenantId: string, startDate?: string, endDate?: string): Promise<{
        csatScore: number;
        totalSurveys: number;
        positivePercent: number;
        distribution: {
            stars: number;
            count: number;
            percent: number;
        }[];
        recentFeedbacks: {
            id: string;
            contactName: string;
            agentName: string;
            rating: number;
            comment: string;
            createdAt: string;
        }[];
    }>;
}
