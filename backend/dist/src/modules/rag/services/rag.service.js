"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RagService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const openai_1 = require("openai");
const config_1 = require("@nestjs/config");
const pdf_loader_1 = require("../loaders/pdf.loader");
let RagService = RagService_1 = class RagService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(RagService_1.name);
        const apiKey = this.configService.get('OPENAI_API_KEY');
        this.openai = new openai_1.default({ apiKey });
    }
    async processAndSavePdf(tenantId, filename, fileBuffer) {
        this.logger.log(`Processando PDF ${filename} para o tenant ${tenantId}...`);
        const text = await pdf_loader_1.PdfLoader.extractText(fileBuffer);
        const document = await this.prisma.knowledgeDocument.create({
            data: {
                tenantId,
                filename,
                fileSize: fileBuffer.length,
            }
        });
        const chunks = this.chunkText(text, 1000);
        this.logger.log(`Documento dividido em ${chunks.length} chunks.`);
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            if (!chunkText.trim())
                continue;
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: chunkText,
            });
            const embedding = embeddingResponse.data[0].embedding;
            await this.prisma.$executeRaw `
        INSERT INTO "DocumentChunk" (id, "documentId", "tenantId", content, embedding)
        VALUES (
          gen_random_uuid(), 
          ${document.id}, 
          ${tenantId}, 
          ${chunkText}, 
          ${embedding}::vector
        )
      `;
        }
        this.logger.log(`Documento ${filename} processado com sucesso.`);
        return document;
    }
    async getDocuments(tenantId) {
        return this.prisma.knowledgeDocument.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async deleteDocument(tenantId, documentId) {
        await this.prisma.knowledgeDocument.deleteMany({
            where: { id: documentId, tenantId }
        });
        return { success: true };
    }
    async searchSimilarChunks(tenantId, query, limit = 3) {
        try {
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;
            const results = await this.prisma.$queryRaw `
        SELECT content 
        FROM "DocumentChunk"
        WHERE "tenantId" = ${tenantId}
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;
            return results.map(r => r.content);
        }
        catch (e) {
            this.logger.error(`Erro na busca semântica: ${e.message}`);
            return [];
        }
    }
    chunkText(text, chunkSize) {
        const words = text.split(' ');
        const chunks = [];
        let currentChunk = '';
        for (const word of words) {
            if ((currentChunk.length + word.length) > chunkSize) {
                chunks.push(currentChunk.trim());
                currentChunk = word + ' ';
            }
            else {
                currentChunk += word + ' ';
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }
};
exports.RagService = RagService;
exports.RagService = RagService = RagService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], RagService);
//# sourceMappingURL=rag.service.js.map