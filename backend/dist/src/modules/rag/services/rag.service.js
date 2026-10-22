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
    sanitizeFilename(filename) {
        try {
            return Buffer.from(filename, 'latin1').toString('utf8');
        }
        catch {
            return filename;
        }
    }
    async processAndSavePdf(tenantId, rawFilename, fileBuffer) {
        const filename = this.sanitizeFilename(rawFilename);
        this.logger.log(`Processando PDF "${filename}" (${fileBuffer.length} bytes) para o tenant ${tenantId}...`);
        let text = '';
        try {
            text = await pdf_loader_1.PdfLoader.extractText(fileBuffer);
        }
        catch (err) {
            this.logger.error(`Erro ao extrair texto do PDF ${filename}: ${err.message}`);
            throw new common_1.BadRequestException(`Falha ao processar o PDF: ${err.message || 'arquivo corrompido ou protegido'}`);
        }
        if (!text || !text.trim()) {
            throw new common_1.BadRequestException('Não foi possível extrair texto deste PDF. O arquivo pode ser uma imagem digitalizada sem camada de texto (OCR) ou estar vazio.');
        }
        const chunks = this.chunkText(text.trim(), 1000).filter(c => Boolean(c.trim()));
        if (chunks.length === 0) {
            throw new common_1.BadRequestException('Nenhum fragmento de texto legível pôde ser extraído deste PDF.');
        }
        this.logger.log(`Documento dividido em ${chunks.length} chunks.`);
        const document = await this.prisma.knowledgeDocument.create({
            data: {
                tenantId,
                filename,
                fileSize: fileBuffer.length,
            }
        });
        try {
            const BATCH_SIZE = 50;
            for (let b = 0; b < chunks.length; b += BATCH_SIZE) {
                const batchChunks = chunks.slice(b, b + BATCH_SIZE);
                const embeddingResponse = await this.openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: batchChunks,
                });
                for (let i = 0; i < batchChunks.length; i++) {
                    const chunkText = batchChunks[i];
                    const embedding = embeddingResponse.data[i].embedding;
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
            }
            this.logger.log(`Documento "${filename}" indexado com sucesso (${chunks.length} chunks vetoriais).`);
            return document;
        }
        catch (err) {
            this.logger.error(`Erro durante geração de embeddings do documento ${document.id}: ${err.message}`, err.stack);
            await this.prisma.knowledgeDocument.deleteMany({
                where: { id: document.id }
            }).catch(() => { });
            throw new common_1.InternalServerErrorException(`Erro ao indexar embeddings no banco vetorial: ${err.message}`);
        }
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