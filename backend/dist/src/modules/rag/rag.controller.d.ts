import { RagService } from './services/rag.service';
export declare class RagController {
    private readonly ragService;
    constructor(ragService: RagService);
    uploadDocument(tenantId: string, file: Express.Multer.File): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        filename: string;
        fileSize: number;
    }>;
    getDocuments(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        filename: string;
        fileSize: number;
    }[]>;
    deleteDocument(tenantId: string, documentId: string): Promise<{
        success: boolean;
    }>;
}
