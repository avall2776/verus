import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { UpdateSupportAiConfigDto } from './dto/update-support-ai-config.dto';
export declare class SupportAiService {
    private readonly prisma;
    private readonly configService;
    private readonly chatGateway;
    private readonly logger;
    private readonly openai;
    constructor(prisma: PrismaService, configService: ConfigService, chatGateway: ChatGateway);
    getConfig(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        model: string;
        prompt: string;
        knowledgeBase: string;
        guardrails: string;
        autoHandoffCrm: boolean;
        autoCloseSolved: boolean;
    }>;
    updateConfig(dto: UpdateSupportAiConfigDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        model: string;
        prompt: string;
        knowledgeBase: string;
        guardrails: string;
        autoHandoffCrm: boolean;
        autoCloseSolved: boolean;
    }>;
    handleTicketCreated(ticketId: string): Promise<void>;
    handleIncomingClientMessage(ticketId: string, clientMessageContent: string, senderName: string): Promise<void>;
}
