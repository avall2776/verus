import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
import { MessagingService } from '../../messaging/messaging.service';
import { ChatGateway } from '../../chat/chat.gateway';
export declare class AiProcessor extends WorkerHost {
    private readonly prisma;
    private readonly aiService;
    private readonly messagingService;
    private readonly chatGateway;
    private readonly logger;
    private readonly CENTRAL_COMERCIAL;
    constructor(prisma: PrismaService, aiService: AiService, messagingService: MessagingService, chatGateway: ChatGateway);
    process(job: Job<any, any, string>): Promise<any>;
}
