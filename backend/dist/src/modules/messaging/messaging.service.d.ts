import { PrismaService } from '../../shared/database/prisma.service';
export interface SendMessagePayload {
    tenantId: string;
    phone: string;
    content: string;
    instanceId?: string;
}
export interface SendAudioPayload {
    tenantId: string;
    phone: string;
    audioBuffer?: Buffer;
    audioUrl?: string;
    mimeType?: string;
    instanceId?: string;
}
export interface SendMediaPayload {
    tenantId: string;
    phone: string;
    type: 'image' | 'document';
    mediaUrl: string;
    content?: string;
    filename?: string;
    instanceId?: string;
}
export declare class MessagingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendText(payload: SendMessagePayload): Promise<any>;
    sendAudio(payload: SendAudioPayload): Promise<any>;
    sendMedia(payload: SendMediaPayload): Promise<any>;
}
