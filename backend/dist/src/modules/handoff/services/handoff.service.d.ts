export interface HandoffState {
    conversationId: string;
    isLockedForAi: boolean;
    lockedByUserId?: string;
    lockedAt?: Date;
    reason?: string;
}
export declare class HandoffService {
    static canAiRespond(conversationId: string): Promise<boolean>;
    static lockForHuman(conversationId: string, userId?: string, reason?: string): Promise<void>;
    static releaseToAi(conversationId: string): Promise<void>;
}
