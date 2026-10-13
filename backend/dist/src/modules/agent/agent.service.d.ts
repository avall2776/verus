import { PrismaService } from '../../shared/database/prisma.service';
import { AiService } from '../ai/ai.service';
export declare class AgentService {
    private prisma;
    private aiService;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService);
    getConfig(tenantId: string): Promise<{
        id: string;
        name: string;
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
    updateConfig(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
    getTrainingLogs(tenantId: string, limit?: number): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        userId: string | null;
        userName: string | null;
        feedback: string;
        quotedText: string | null;
        targetCategory: string;
        categoryLabel: string;
        explanation: string;
        learnedRule: string;
    }[]>;
    coachAgent(tenantId: string, dto: {
        feedback: string;
        quotedText?: string;
    }, userId?: string, userName?: string): Promise<{
        success: boolean;
        parsedResult: any;
        updatedConfig: {
            id: string;
            name: string;
            aiName: string;
            aiModel: string;
            aiPrompt: string;
            aiKnowledgeBase: string;
            aiTemperature: number;
        };
        log: {
            id: string;
            tenantId: string;
            createdAt: Date;
            userId: string | null;
            userName: string | null;
            feedback: string;
            quotedText: string | null;
            targetCategory: string;
            categoryLabel: string;
            explanation: string;
            learnedRule: string;
        };
        confirmationMessage: string;
    }>;
}
