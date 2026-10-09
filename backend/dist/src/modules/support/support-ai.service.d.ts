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
    private formatAiResponseToString;
    handleTicketCreated(ticketId: string): Promise<void>;
    handleIncomingClientMessage(ticketId: string, clientMessageContent: string, senderName: string): Promise<void>;
    coachFromFeedback(ticketId: string, dto: {
        feedback: string;
        targetMessageId?: string;
        quotedText?: string;
    }, adminUserId: string, adminUserName?: string): Promise<{
        success: boolean;
        parsedResult: any;
        updatedConfig: {
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
        };
        aiResponseMessage: {
            id: string;
            createdAt: Date;
            content: string;
            isInternal: boolean;
            senderName: string | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string | null;
            ticketId: string;
            senderRole: string;
        };
        adminMessage: {
            sender: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            isInternal: boolean;
            senderName: string | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string | null;
            ticketId: string;
            senderRole: string;
        };
    }>;
}
