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
export interface SendResult {
    success: boolean;
    messageId?: string;
    provider?: 'evolution' | 'meta' | 'simulated';
    error?: string;
    raw?: any;
}
export declare class MessagingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sanitizePhone(phone: string): string;
    private resolveConnection;
    sendText(payload: SendMessagePayload): Promise<SendResult>;
    private sendEvolutionText;
    private sendMetaText;
    sendMedia(payload: SendMediaPayload): Promise<SendResult>;
    private sendEvolutionMedia;
    private sendMetaMedia;
    sendAudio(payload: SendAudioPayload): Promise<SendResult>;
    private sendEvolutionAudio;
    private sendMetaAudio;
}
