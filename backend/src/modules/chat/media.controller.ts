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

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    return res.sendFile(filePath);
  }
}
