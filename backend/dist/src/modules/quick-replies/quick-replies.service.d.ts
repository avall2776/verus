import { PrismaService } from '../../shared/database/prisma.service';
export interface CreateQuickReplyDto {
    shortcut: string;
    content?: string;
    title?: string;
    type?: 'text' | 'document' | 'image' | 'video';
    mediaUrl?: string;
    mediaDriveId?: string;
    fileName?: string;
}
export interface UpdateQuickReplyDto {
    shortcut?: string;
    content?: string;
    title?: string;
    type?: 'text' | 'document' | 'image' | 'video';
    mediaUrl?: string;
    mediaDriveId?: string;
    fileName?: string;
}
export declare class QuickRepliesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
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
    }[]>;
    create(tenantId: string, data: CreateQuickReplyDto): Promise<{
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
    update(tenantId: string, id: string, data: UpdateQuickReplyDto): Promise<{
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
    delete(tenantId: string, id: string): Promise<{
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
