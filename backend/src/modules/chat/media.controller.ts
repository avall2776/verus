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
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { StorageService } from '../../shared/storage/storage.service';

const execFileAsync = promisify(execFile);
import { downloadDriveFileBuffer } from '../../shared/helpers/google-drive.helper';

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
      '.vcf': 'text/vcard; charset=utf-8',
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
   * Suporta entrega em .ogg ou conversão transparente on-the-fly para .mp3 com cache em disco
   */
  @Get('audio/:filename')
  async getAudioFile(@Param('filename') filename: string, @Req() req: Request, @Res() res: Response) {
    const safeFilename = path.basename(filename);
    const requestedExt = path.extname(safeFilename).toLowerCase();
    const baseNameWithoutExt = path.basename(safeFilename, requestedExt);

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isAppleOrSafari = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod') || (userAgent.includes('safari') && !userAgent.includes('chrome'));

    const searchDirs = [
      path.join(process.cwd(), 'uploads', 'audio'),
      path.join(process.cwd(), 'uploads', 'media'),
      path.join(process.cwd(), 'uploads'),
    ];

    let filePath: string | undefined;
    for (const dir of searchDirs) {
      const candidate = path.join(dir, safeFilename);
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }

    if (!filePath) {
      const alt = this.storageService.getLocalFilePath(filename);
      if (alt && fs.existsSync(alt)) filePath = alt;
    }

    // Se o cliente pediu .mp3 (ou é iPhone/Safari pedindo .ogg), garante versão MP3 compatível com 100% dos dispositivos
    const wantsMp3 = requestedExt === '.mp3' || isAppleOrSafari || req.query.format === 'mp3';
    if (wantsMp3) {
      const mp3Name = `${baseNameWithoutExt}.mp3`;
      let mp3Path: string | undefined;
      for (const dir of searchDirs) {
        const candidate = path.join(dir, mp3Name);
        if (fs.existsSync(candidate)) {
          mp3Path = candidate;
          break;
        }
      }

      if (mp3Path) {
        filePath = mp3Path;
      } else {
        // Encontra a fonte original (.ogg ou .opus ou .webm) para transcodificar
        let sourcePath = filePath;
        if (!sourcePath || !fs.existsSync(sourcePath)) {
          for (const ext of ['.ogg', '.opus', '.webm']) {
            for (const dir of searchDirs) {
              const candidate = path.join(dir, `${baseNameWithoutExt}${ext}`);
              if (fs.existsSync(candidate)) {
                sourcePath = candidate;
                break;
              }
            }
            if (sourcePath) break;
          }
        }

        if (sourcePath && fs.existsSync(sourcePath)) {
          const targetMp3Path = path.join(path.dirname(sourcePath), `${baseNameWithoutExt}.mp3`);
          try {
            await execFileAsync('ffmpeg', ['-y', '-i', sourcePath, '-c:a', 'libmp3lame', '-b:a', '64k', targetMp3Path]);
            if (fs.existsSync(targetMp3Path)) {
              filePath = targetMp3Path;
            }
          } catch (transcodeErr: any) {
            // Se falhar a transcodificação, mantém o filePath original
          }
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Arquivo de áudio não encontrado.');
    }

    const currentExt = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.ogg': 'audio/ogg',
      '.opus': 'audio/ogg',
      '.webm': 'audio/webm',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
    };
    const contentType = mimeTypes[currentExt] || (currentExt === '.mp3' ? 'audio/mpeg' : 'audio/ogg');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(filePath);
  }

  /**
   * Streaming de arquivos do Google Drive sob demanda
   * Permite que APIs externas (Evolution API / Meta Cloud API) baixem o arquivo binário
   * com cabeçalhos HTTP normais sem consumir disco no VPS.
   */
  @Get('drive-stream/:driveId')
  async streamDriveFile(
    @Param('driveId') driveId: string,
    @Query('name') customName: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const fileData = await downloadDriveFileBuffer(driveId);
      if (fileData && fileData.buffer && fileData.buffer.length > 0) {
        const fileName = customName || 'video.mp4';
        let mimeType = fileData.mimeType;
        const lowerName = fileName.toLowerCase();

        // Determina MIME type correto para navegadores e WhatsApp
        if (!mimeType || mimeType === 'application/octet-stream') {
          if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.includes('video')) {
            mimeType = 'video/mp4';
          } else if (lowerName.endsWith('.pdf')) {
            mimeType = 'application/pdf';
          } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (lowerName.endsWith('.png')) {
            mimeType = 'image/png';
          } else if (lowerName.endsWith('.webp')) {
            mimeType = 'image/webp';
          }
        }

        const totalLength = fileData.buffer.length;
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Suporte a HTTP 206 Partial Content (Range requests para players HTML5 de vídeo)
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
          const chunkSize = end - start + 1;

          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
          res.setHeader('Content-Length', chunkSize);
          res.setHeader('Content-Type', mimeType);
          return res.end(fileData.buffer.subarray(start, end + 1));
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', totalLength);
        return res.end(fileData.buffer);
      }
    } catch (err: any) {
      // Fallback gracioso caso o download falhe
    }

    // Se o download direto em buffer não for possível, redireciona 302 sem gerar erro 404
    return res.redirect(302, `https://drive.google.com/file/d/${driveId}/view?usp=sharing`);
  }
}

