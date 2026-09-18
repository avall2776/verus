import { Queue } from 'bullmq';
import { Response } from 'express';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class WebhooksController {
    private readonly ingressQueue;
    private readonly prisma;
    private readonly chatGateway;
    private readonly whatsappService;
    private readonly logger;
    private readonly META_VERIFY_TOKEN;
    constructor(ingressQueue: Queue, prisma: PrismaService, chatGateway: ChatGateway, whatsappService: WhatsappService);
    verifyMetaWebhook(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    handleMetaWebhook(tenantId: string, payload: any): Promise<{
        status: string;
        reason?: undefined;
    } | {
        status: string;
        reason: string;
    }>;
    handleEvolutionWebhookDefault(payload: any): Promise<{
        status: string;
        state: any;
    } | {
        status: string;
        state?: undefined;
    }>;
    handleEvolutionWebhook(tenantId: string, payload: any): Promise<{
        status: string;
        state: any;
    } | {
        status: string;
        state?: undefined;
    }>;
}
