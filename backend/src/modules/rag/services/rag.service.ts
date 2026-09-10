import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { PdfLoader } from '../loaders/pdf.loader';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async processAndSavePdf(tenantId: string, filename: string, fileBuffer: Buffer) {
    this.logger.log(`Processando PDF ${filename} para o tenant ${tenantId}...`);
    
    // 1. Extrair Texto
    const text = await PdfLoader.extractText(fileBuffer);
    
    // 2. Criar o Documento Pai
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        tenantId,
        filename,
        fileSize: fileBuffer.length,
      }
    });

    // 3. Quebrar o texto em chunks (aprox 1000 caracteres, respeitando parágrafos/espaços)
    const chunks = this.chunkText(text, 1000);
    this.logger.log(`Documento dividido em ${chunks.length} chunks.`);

    // 4. Gerar embeddings e salvar no banco
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      if (!chunkText.trim()) continue;

      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunkText,
      });
      const embedding = embeddingResponse.data[0].embedding;

      // Salvando via raw query por causa do campo Unsupported vector
      await this.prisma.$executeRaw`
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

  async getDocuments(tenantId: string) {
    return this.prisma.knowledgeDocument.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteDocument(tenantId: string, documentId: string) {
    // Cascade delete cuidará dos chunks
    await this.prisma.knowledgeDocument.deleteMany({
      where: { id: documentId, tenantId }
    });
    return { success: true };
  }

  async searchSimilarChunks(tenantId: string, query: string, limit = 3): Promise<string[]> {
    try {
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Realizando a busca semântica via Cosine Similarity (<=>)
      const results = await this.prisma.$queryRaw<{content: string}[]>`
        SELECT content 
        FROM "DocumentChunk"
        WHERE "tenantId" = ${tenantId}
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;

      return results.map(r => r.content);
    } catch (e: any) {
      this.logger.error(`Erro na busca semântica: ${e.message}`);
      return [];
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const words = text.split(' ');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if ((currentChunk.length + word.length) > chunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = word + ' ';
      } else {
        currentChunk += word + ' ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }
}
