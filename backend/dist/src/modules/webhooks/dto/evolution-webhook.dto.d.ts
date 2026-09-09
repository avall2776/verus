declare class EvolutionMessageKey {
    remoteJid: string;
    fromMe: boolean;
    id: string;
}
declare class EvolutionMessageData {
    key: EvolutionMessageKey;
    message?: any;
    messageTimestamp?: number;
    pushName?: string;
}
export declare class EvolutionWebhookDto {
    event: string;
    instance: string;
    data: EvolutionMessageData;
}
export {};
