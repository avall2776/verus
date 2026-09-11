import { QuickRepliesService } from './quick-replies.service';
export declare class QuickRepliesController {
    private readonly quickRepliesService;
    constructor(quickRepliesService: QuickRepliesService);
    getQuickReplies(req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }[]>;
    createQuickReply(req: any, body: {
        shortcut: string;
        content: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
    updateQuickReply(req: any, id: string, body: {
        shortcut?: string;
        content?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
    deleteQuickReply(req: any, id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        content: string;
        shortcut: string;
    }>;
}
