import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { RagService } from './services/rag.service';

@UseGuards(JwtAuthGuard, PlanGuard)
@RequireModule('aiAgent')
@Controller('agent')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post(['documents/upload', 'upload-knowledge'])
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    if (file.mimetype !== 'application/pdf') throw new BadRequestException('Apenas arquivos PDF são suportados.');

    return this.ragService.processAndSavePdf(tenantId, file.originalname, file.buffer);
  }

  @Get('documents')
  async getDocuments(@CurrentTenant() tenantId: string) {
    return this.ragService.getDocuments(tenantId);
  }

  @Delete('documents/:id')
  async deleteDocument(
    @CurrentTenant() tenantId: string,
    @Param('id') documentId: string
  ) {
    return this.ragService.deleteDocument(tenantId, documentId);
  }
}
