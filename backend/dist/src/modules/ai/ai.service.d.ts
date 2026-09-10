import { ConfigService } from '@nestjs/config';
import { AiResponseDto } from './schemas/response.schema';
import { RagService } from '../rag/services/rag.service';
export declare class AiService {
    private readonly configService;
    private readonly ragService;
    private readonly logger;
    private readonly openai;
    private readonly fallbackPrompt;
    constructor(configService: ConfigService, ragService: RagService);
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
