import { PrismaService } from '../../shared/database/prisma.service';
export interface SendMessagePayload {
    tenantId: string;
    phone: string;
    content: string;
    instanceId?: string;
    quoted?: any;
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
    type: 'image' | 'document' | 'video';
    mediaUrl: string;
    content?: string;
    filename?: string;
    instanceId?: string;
    quoted?: any;
}
export interface SendReactionPayload {
    tenantId: string;
    phone: string;
    providerMessageId: string;
    reaction: string;
    fromMe?: boolean;
    instanceId?: string;
}
export interface SendTemplatePayload {
    tenantId: string;
    phone: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
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
    sendTemplate(payload: SendTemplatePayload): Promise<SendResult>;
    private sendMetaTemplate;
    private sendEvolutionText;
    private sendMetaText;
    sendMedia(payload: SendMediaPayload): Promise<SendResult>;
    private sendEvolutionMedia;
    private sendMetaMedia;
    sendAudio(payload: SendAudioPayload): Promise<SendResult>;
    private sendEvolutionAudio;
    private sendMetaAudio;
    sendReaction(payload: SendReactionPayload): Promise<SendResult>;
}
