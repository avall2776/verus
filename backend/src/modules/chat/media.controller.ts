import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('media')
export class MediaController {
  @Get('audio/:filename')
  getAudioFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'uploads', 'audio', safeFilename);

    if (!fs.existsSync(filePath)) {
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
    return res.sendFile(filePath);
  }
}
