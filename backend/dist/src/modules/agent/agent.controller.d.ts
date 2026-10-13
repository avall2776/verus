import { AgentService } from './agent.service';
import { AiService } from '../ai/ai.service';
export declare class AgentController {
    private agentService;
    private aiService;
    constructor(agentService: AgentService, aiService: AiService);
    getConfig(tenantId: string): Promise<{
        id: string;
        name: string;
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
    updateConfig(tenantId: string, body: any): Promise<{
        id: string;
        name: string;
        aiName: string;
        aiModel: string;
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
    }>;
    getTrainingLogs(tenantId: string): Promise<{
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
    coachAgent(tenantId: string, body: {
        feedback: string;
        quotedText?: string;
    }, req: any): Promise<{
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
    testPlayground(tenantId: string, body: {
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
        telefone_cliente?: string;
        produto_interesse?: string;
        cidade_uf?: string;
        email_cliente?: string;
        empresa_cliente?: string;
        cargo_cliente?: string;
        formulario_origem?: string;
    }>;
}
