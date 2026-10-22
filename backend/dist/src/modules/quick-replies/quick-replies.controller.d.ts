import { QuickRepliesService, CreateQuickReplyDto, UpdateQuickReplyDto } from './quick-replies.service';
export declare class QuickRepliesController {
    private readonly quickRepliesService;
    constructor(quickRepliesService: QuickRepliesService);
    getQuickReplies(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        type: string;
        mediaUrl: string | null;
        title: string | null;
        shortcut: string;
        mediaDriveId: string | null;
        fileName: string | null;
    }[]>;
    createQuickReply(tenantId: string, body: CreateQuickReplyDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        type: string;
        mediaUrl: string | null;
        title: string | null;
        shortcut: string;
        mediaDriveId: string | null;
        fileName: string | null;
    }>;
    updateQuickReply(tenantId: string, id: string, body: UpdateQuickReplyDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        type: string;
        mediaUrl: string | null;
        title: string | null;
        shortcut: string;
        mediaDriveId: string | null;
        fileName: string | null;
    }>;
    deleteQuickReply(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        type: string;
        mediaUrl: string | null;
        title: string | null;
        shortcut: string;
        mediaDriveId: string | null;
        fileName: string | null;
    }>;
}
