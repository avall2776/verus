import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';
export declare class WebhookProcessor extends WorkerHost {
    private readonly prisma;
    private readonly aiQueue;
    private readonly chatGateway;
    private readonly logger;
    constructor(prisma: PrismaService, aiQueue: Queue, chatGateway: ChatGateway);
    process(job: Job<any, any, string>): Promise<any>;
}
