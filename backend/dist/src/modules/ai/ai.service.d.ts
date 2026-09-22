import { ConfigService } from '@nestjs/config';
import { AiResponseDto } from './schemas/response.schema';
import { RagService } from '../rag/services/rag.service';
export interface ApiKeyResolution {
    canUseAi: boolean;
    apiKey: string | null;
    source: 'platform_authorized' | 'byok' | 'trial_active' | 'trial_expired';
    daysLeft: number | null;
    totalTrialDays: number;
    statusText: string;
    isPlatformAllowed: boolean;
    hasCustomKey: boolean;
}
export declare class AiService {
    private readonly configService;
    private readonly ragService;
    private readonly logger;
    private readonly openai;
    readonly masterApiKey: string;
    private readonly fallbackPrompt;
    constructor(configService: ConfigService, ragService: RagService);
    resolveTenantApiKey(tenant: any): ApiKeyResolution;
    testApiKey(apiKey: string): Promise<{
        success: boolean;
        message: string;
        modelsCount?: number;
        error?: string;
    }>;
    transcribeAudio(buffer: Buffer, filename?: string, mimeType?: string): Promise<string>;
    analyzeImage(buffer: Buffer, mimeType?: string, caption?: string): Promise<string>;
    extractDocumentText(buffer: Buffer, mimeType?: string, filename?: string): Promise<string>;
    processConversation(history: {
        role: 'user' | 'assistant';
        content: string;
    }[], tenantConfig?: {
        id?: string;
        aiPrompt?: string;
        aiKnowledgeBase?: string;
        aiTemperature?: number;
        aiModel?: string;
    }, dynamicContext?: string): Promise<AiResponseDto>;
}
