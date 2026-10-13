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
    applyLearningIncident(tenantId: string, incidentId: string, userId?: string, userName?: string): Promise<{
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
}
