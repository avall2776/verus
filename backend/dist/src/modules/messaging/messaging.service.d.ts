import { ConfigService } from '@nestjs/config';
export interface SendMessagePayload {
    tenantId: string;
    phone: string;
    content: string;
}
export declare class MessagingService {
    private readonly configService;
    private readonly logger;
    private readonly evolutionApiUrl;
    private readonly evolutionApiKey;
    constructor(configService: ConfigService);
    sendText(payload: SendMessagePayload, instanceName?: string): Promise<any>;
}
