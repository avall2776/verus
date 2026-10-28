import { 
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, 
  UseInterceptors, UploadedFile, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuickRepliesService, CreateQuickReplyDto, UpdateQuickReplyDto } from './quick-replies.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { 
  getGoogleOAuthUrl, 
  exchangeCodeForTokens, 
  isGoogleDriveConnected, 
  uploadBufferToGoogleDrive 
} from '../../shared/helpers/google-oauth.helper';
import { detectMediaType } from '../../shared/helpers/google-drive.helper';

@UseGuards(JwtAuthGuard)
@Controller(['quick-replies', 'quick_replies'])
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  @Get()
  async getQuickReplies(@CurrentTenant() tenantId: string) {
    return this.quickRepliesService.findAll(tenantId);
  }

  @Get('google-drive/status')
  async getGoogleDriveStatus(@CurrentTenant() tenantId: string) {
    const status = isGoogleDriveConnected(tenantId);
    const authUrl = getGoogleOAuthUrl(tenantId);
    return {
      connected: status.connected,
      email: status.email,
      authUrl,
    };
  }

  @Post('google-drive/exchange-token')
  async exchangeGoogleDriveToken(
    @CurrentTenant() tenantId: string,
    @Body('code') code: string,
  ) {
    if (!code) {
      throw new BadRequestException('Código de autorização não informado.');
    }
    const result = await exchangeCodeForTokens(code, tenantId);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Falha ao autorizar o Google Drive.');
    }
    return result;
  }

  @Post('upload-to-drive')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 150 * 1024 * 1024 } // limite de 150MB por arquivo
  }))
  async uploadToDrive(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1nHrHOq1s3D8Ckvl-gAcoeIAKGkopvnaG';
      const uploaded = await uploadBufferToGoogleDrive(
        file.buffer,
        file.originalname,
        file.mimetype,
        folderId,
        tenantId,
      );

      const detectedType = detectMediaType(file.originalname);

      return {
        success: true,
        fileId: uploaded.fileId,
        webViewLink: uploaded.webViewLink,
        webContentLink: uploaded.webContentLink,
        fileName: file.originalname,
        type: detectedType,
      };
    } catch (err: any) {
      console.error('[UPLOAD_TO_DRIVE_ERROR]', err);
      throw new BadRequestException(err.message || 'Falha ao fazer upload para o Google Drive.');
    }
  }

  @Post()
  async createQuickReply(@CurrentTenant() tenantId: string, @Body() body: CreateQuickReplyDto) {
    return this.quickRepliesService.create(tenantId, body);
  }

  @Patch(':id')
  async updateQuickReply(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateQuickReplyDto,
  ) {
    return this.quickRepliesService.update(tenantId, id, body);
  }

  @Delete(':id')
  async deleteQuickReply(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quickRepliesService.delete(tenantId, id);
  }
}
