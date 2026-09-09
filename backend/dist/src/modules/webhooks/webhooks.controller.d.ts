import { Queue } from 'bullmq';
import { Response } from 'express';
export declare class WebhooksController {
    private readonly ingressQueue;
    private readonly logger;
    private readonly META_VERIFY_TOKEN;
    constructor(ingressQueue: Queue);
    verifyMetaWebhook(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    handleMetaWebhook(tenantId: string, payload: any): Promise<{
        status: string;
        reason: string;
    } | {
        status: string;
        reason?: undefined;
    }>;
}
