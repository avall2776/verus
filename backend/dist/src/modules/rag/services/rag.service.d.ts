import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class RagService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly openai;
    constructor(prisma: PrismaService, configService: ConfigService);
    processAndSavePdf(tenantId: string, filename: string, fileBuffer: Buffer): Promise<{
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
    searchSimilarChunks(tenantId: string, query: string, limit?: number): Promise<string[]>;
    private chunkText;
}
