import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { MessagingService } from '../../messaging/messaging.service';
import { ChatGateway } from '../../chat/chat.gateway';
export declare class ScheduledMessagesProcessor extends WorkerHost {
    private readonly prisma;
    private readonly messagingService;
    private readonly chatGateway;
    private readonly logger;
    constructor(prisma: PrismaService, messagingService: MessagingService, chatGateway: ChatGateway);
    process(job: Job<any, any, string>): Promise<any>;
}
