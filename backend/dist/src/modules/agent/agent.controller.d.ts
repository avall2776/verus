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
    getLearningIncidents(tenantId: string, status?: string): Promise<{
        incidents: ({
            contact: {
                id: string;
                name: string;
                phone: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string | null;
            status: string;
            conversationId: string | null;
            sentimento: string;
            tipoIncidente: string;
            reclamouDeBot: boolean;
            trechoCliente: string | null;
            respostaIa: string | null;
            diagnosticoCausa: string | null;
            sugestaoDiretriz: string | null;
            assimiladoPor: string | null;
            assimiladoEm: Date | null;
        })[];
        metrics: {
            total: number;
            pending: number;
            assimilated: number;
        };
    }>;
    applyLearningIncident(tenantId: string, incidentId: string, req: any): Promise<{
        success: boolean;
        message: string;
        incident: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string | null;
            status: string;
            conversationId: string | null;
            sentimento: string;
            tipoIncidente: string;
            reclamouDeBot: boolean;
            trechoCliente: string | null;
            respostaIa: string | null;
            diagnosticoCausa: string | null;
            sugestaoDiretriz: string | null;
            assimiladoPor: string | null;
            assimiladoEm: Date | null;
        };
        coachResult?: undefined;
        confirmationMessage?: undefined;
    } | {
        success: boolean;
        coachResult: {
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
        };
        incident: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string | null;
            status: string;
            conversationId: string | null;
            sentimento: string;
            tipoIncidente: string;
            reclamouDeBot: boolean;
            trechoCliente: string | null;
            respostaIa: string | null;
            diagnosticoCausa: string | null;
            sugestaoDiretriz: string | null;
            assimiladoPor: string | null;
            assimiladoEm: Date | null;
        };
        confirmationMessage: string;
        message?: undefined;
    }>;
    dismissLearningIncident(tenantId: string, incidentId: string): Promise<{
        success: boolean;
        incident: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string | null;
            status: string;
            conversationId: string | null;
            sentimento: string;
            tipoIncidente: string;
            reclamouDeBot: boolean;
            trechoCliente: string | null;
            respostaIa: string | null;
            diagnosticoCausa: string | null;
            sugestaoDiretriz: string | null;
            assimiladoPor: string | null;
            assimiladoEm: Date | null;
        };
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
        sentimento_cliente?: "ENTUSIASMADO" | "POSITIVO_CORDIAL" | "NEUTRO" | "DUVIDA_CRITICA" | "FRUSTRADO_IRRITADO" | "HOSTIL_RECLAMACAO";
        reclamou_de_bot?: boolean;
        analise_emocional?: string;
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
