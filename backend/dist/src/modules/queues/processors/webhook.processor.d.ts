import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { MessagingService } from '../../messaging/messaging.service';
import { AutomationsService } from '../../automations/automations.service';
export declare class WebhookProcessor extends WorkerHost {
    private readonly prisma;
    private readonly aiQueue;
    private readonly chatGateway;
    private readonly messagingService;
    private readonly automationsService;
    private readonly logger;
    constructor(prisma: PrismaService, aiQueue: Queue, chatGateway: ChatGateway, messagingService: MessagingService, automationsService: AutomationsService);
    process(job: Job<any, any, string>): Promise<any>;
}
