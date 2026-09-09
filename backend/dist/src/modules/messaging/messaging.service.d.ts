import { PrismaService } from '../../shared/database/prisma.service';
export interface SendMessagePayload {
    tenantId: string;
    phone: string;
    content: string;
}
export declare class MessagingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendText(payload: SendMessagePayload): Promise<any>;
}
