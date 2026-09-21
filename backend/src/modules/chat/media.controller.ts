import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { StorageService } from '../../shared/storage/storage.service';

@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Endpoint central de Upload de Arquivos (Imagens, PDFs, Documentos, Áudios)
   * Realiza o upload no Supabase Storage (bucket versus-media) com Fallback Local automático.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório para upload.');
    }

    const result = await this.storageService.uploadFile(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      folder || 'chat',
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Entrega de arquivos em fallback local (imagens, PDFs, documentos gerais)
   */
  @Get('file/:filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.storageService.getLocalFilePath(filename);

    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Arquivo não encontrado no servidor.');
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Imagens
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      // Documentos
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
      // Áudio e Vídeo
      '.ogg': 'audio/ogg',
      '.opus': 'audio/ogg',
      '.webm': 'audio/webm',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
    return res.sendFile(filePath);
  }

  /**
   * Mantido para total retrocompatibilidade com áudios gerados pelo PTT
   */
  @Get('audio/:filename')
  getAudioFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = path.basename(filename);
    const candidatePaths = [
      path.join(process.cwd(), 'uploads', 'audio', safeFilename),
      path.join(process.cwd(), 'uploads', 'media', safeFilename),
      path.join(process.cwd(), 'uploads', safeFilename),
    ];

    let filePath = candidatePaths.find(p => fs.existsSync(p));

    if (!filePath) {
      const alternativePath = this.storageService.getLocalFilePath(filename);
      if (alternativePath && fs.existsSync(alternativePath)) {
        filePath = alternativePath;
      }
    }

    if (!filePath) {
      throw new NotFoundException('Arquivo de áudio não encontrado.');
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.ogg': 'audio/ogg',
      '.opus': 'audio/ogg',
      '.webm': 'audio/webm',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
    };
    const contentType = mimeTypes[ext] || 'audio/ogg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(filePath);
  }
}

