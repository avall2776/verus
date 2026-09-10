import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { RagService } from './services/rag.service';

@UseGuards(JwtAuthGuard)
@Controller('agent/documents')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) throw new Error('No file provided');
    if (file.mimetype !== 'application/pdf') throw new Error('Only PDF files are supported');

    return this.ragService.processAndSavePdf(tenantId, file.originalname, file.buffer);
  }

  @Get()
  async getDocuments(@CurrentTenant() tenantId: string) {
    return this.ragService.getDocuments(tenantId);
  }

  @Delete(':id')
  async deleteDocument(
    @CurrentTenant() tenantId: string,
    @Param('id') documentId: string
  ) {
    return this.ragService.deleteDocument(tenantId, documentId);
  }
}
