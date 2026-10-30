import { QuickRepliesService, CreateQuickReplyDto, UpdateQuickReplyDto } from './quick-replies.service';
export declare class QuickRepliesController {
    private readonly quickRepliesService;
    constructor(quickRepliesService: QuickRepliesService);
    getQuickReplies(tenantId: string): Promise<any[]>;
    getGoogleDriveStatus(tenantId: string): Promise<{
        connected: boolean;
        email: string;
        authUrl: string;
    }>;
    exchangeGoogleDriveToken(tenantId: string, code: string): Promise<{
        success: boolean;
        email?: string;
        error?: string;
    }>;
    uploadToDrive(tenantId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        fileId: string;
        webViewLink: string;
        webContentLink: string;
        fileName: string;
        type: "document" | "image" | "video";
    }>;
    createQuickReply(tenantId: string, body: CreateQuickReplyDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        type: string;
        mediaUrl: string | null;
        title: string | null;
        fileName: string | null;
        shortcut: string;
        mediaDriveId: string | null;
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
        fileName: string | null;
        shortcut: string;
        mediaDriveId: string | null;
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
        fileName: string | null;
        shortcut: string;
        mediaDriveId: string | null;
    }>;
}
