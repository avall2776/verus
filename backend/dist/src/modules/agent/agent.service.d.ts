import { PrismaService } from '../../shared/database/prisma.service';
export declare class AgentService {
    private prisma;
    constructor(prisma: PrismaService);
    getConfig(tenantId: string): Promise<{
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
    updateConfig(tenantId: string, data: any): Promise<{
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
}
