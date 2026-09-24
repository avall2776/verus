import { QuickRepliesService } from './quick-replies.service';
export declare class QuickRepliesController {
    private readonly quickRepliesService;
    constructor(quickRepliesService: QuickRepliesService);
    getQuickReplies(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }[]>;
    createQuickReply(tenantId: string, body: {
        shortcut: string;
        content: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
    updateQuickReply(tenantId: string, id: string, body: {
        shortcut?: string;
        content?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
    deleteQuickReply(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
}
