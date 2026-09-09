import { ConfigService } from '@nestjs/config';
import { AiResponseDto } from './schemas/response.schema';
export declare class AiService {
    private readonly configService;
    private readonly logger;
    private readonly openai;
    private readonly fallbackPrompt;
    constructor(configService: ConfigService);
    processConversation(history: {
        role: 'user' | 'assistant';
        content: string;
    }[], tenantConfig?: {
        aiPrompt: string;
        aiKnowledgeBase: string;
        aiTemperature: number;
        aiModel: string;
    }, dynamicContext?: string): Promise<AiResponseDto>;
}
