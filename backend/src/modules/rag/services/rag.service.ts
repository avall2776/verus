import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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

  private sanitizeFilename(filename: string): string {
    try {
      // Converte possíveis caracteres corrompidos por encoding ISO-8859-1/Latin1 do Multer
      return Buffer.from(filename, 'latin1').toString('utf8');
    } catch {
      return filename;
    }
  }

  async processAndSavePdf(tenantId: string, rawFilename: string, fileBuffer: Buffer) {
    const filename = this.sanitizeFilename(rawFilename);
    this.logger.log(`Processando PDF "${filename}" (${fileBuffer.length} bytes) para o tenant ${tenantId}...`);
    
    // 1. Extrair Texto
    let text = '';
    try {
      text = await PdfLoader.extractText(fileBuffer);
    } catch (err: any) {
      this.logger.error(`Erro ao extrair texto do PDF ${filename}: ${err.message}`);
      throw new BadRequestException(`Falha ao processar o PDF: ${err.message || 'arquivo corrompido ou protegido'}`);
    }

    if (!text || !text.trim()) {
      throw new BadRequestException('Não foi possível extrair texto deste PDF. O arquivo pode ser uma imagem digitalizada sem camada de texto (OCR) ou estar vazio.');
    }
    
    // 2. Quebrar o texto em chunks (aprox 1000 caracteres, respeitando parágrafos/espaços)
    const chunks = this.chunkText(text.trim(), 1000).filter(c => Boolean(c.trim()));
    if (chunks.length === 0) {
      throw new BadRequestException('Nenhum fragmento de texto legível pôde ser extraído deste PDF.');
    }
    this.logger.log(`Documento dividido em ${chunks.length} chunks.`);

    // 3. Criar o Documento Pai
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        tenantId,
        filename,
        fileSize: fileBuffer.length,
      }
    });

    // 4. Gerar embeddings em lotes e salvar no banco com rollback
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
      }

      this.logger.log(`Documento "${filename}" indexado com sucesso (${chunks.length} chunks vetoriais).`);
      return document;
    } catch (err: any) {
      this.logger.error(`Erro durante geração de embeddings do documento ${document.id}: ${err.message}`, err.stack);
      // Remove documento órfão em caso de falha no meio do processo
      await this.prisma.knowledgeDocument.deleteMany({
        where: { id: document.id }
      }).catch(() => {});
      throw new InternalServerErrorException(`Erro ao indexar embeddings no banco vetorial: ${err.message}`);
    }
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
