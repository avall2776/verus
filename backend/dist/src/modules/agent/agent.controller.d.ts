import { AgentService } from './agent.service';
export declare class AgentController {
    private agentService;
    constructor(agentService: AgentService);
    getConfig(tenantId: string): Promise<{
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
    updateConfig(tenantId: string, body: any): Promise<{
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
}
