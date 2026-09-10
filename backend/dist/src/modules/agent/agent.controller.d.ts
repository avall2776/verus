import { AgentService } from './agent.service';
import { AiService } from '../ai/ai.service';
export declare class AgentController {
    private agentService;
    private aiService;
    constructor(agentService: AgentService, aiService: AiService);
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
    testPlayground(body: {
        messages: {
            role: 'user' | 'assistant';
            content: string;
        }[];
        config: any;
    }): Promise<{
        resposta_cliente?: string;
        transferir_vendedor?: boolean;
        motivo_transferencia?: string;
        resumo_atendimento?: string;
        nome_cliente?: string;
        produto_interesse?: string;
    }>;
}
