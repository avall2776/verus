import { ChatService } from './chat.service';
export declare class ChatAliasController {
    private readonly chatService;
    constructor(chatService: ChatService);
    syncOfflineMessagesPost(tenantId: string): Promise<{
        syncedCount: number;
        updatedCount: number;
    }>;
    syncOfflineMessagesGet(tenantId: string): Promise<{
        syncedCount: number;
        updatedCount: number;
    }>;
}
